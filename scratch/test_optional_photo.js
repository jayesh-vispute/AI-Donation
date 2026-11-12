const http = require('http');
const crypto = require('crypto');

async function request(method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: '127.0.0.1',
            port: 8000,
            path: '/api' + path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                let parsed = data;
                try { parsed = JSON.parse(data); } catch(e) {}
                resolve({ status: res.statusCode, body: parsed });
            });
        });
        
        req.on('error', reject);
        if (body) {
            req.write(typeof body === 'string' ? body : JSON.stringify(body));
        }
        req.end();
    });
}

// Multipart FormData without file
async function requestFormDataNoFile(method, path, dataObj, headers = {}) {
    return new Promise((resolve, reject) => {
        const boundary = '----WebKitFormBoundary' + crypto.randomBytes(8).toString('hex');
        let body = '';
        
        for (const [key, value] of Object.entries(dataObj)) {
            body += `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`;
        }
        body += `--${boundary}--\r\n`;
        
        const req = http.request({
            hostname: '127.0.0.1',
            port: 8000,
            path: '/api' + path,
            method: method,
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                ...headers
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                let parsed = data;
                try { parsed = JSON.parse(data); } catch(e) {}
                resolve({ status: res.statusCode, body: parsed });
            });
        });
        req.on('error', reject);
        req.write(Buffer.from(body, 'utf8'));
        req.end();
    });
}

async function runTest() {
    console.log("=== Testing Delivery Verification with Optional Photo ===");
    
    // Register Donor
    const donorEmail = `donor_${crypto.randomBytes(4).toString('hex')}@test.com`;
    let res = await request('POST', '/auth/register', { email: donorEmail, password: 'password123', full_name: 'Test Donor', role: 'DONOR', phone: '1234567890' });
    if(res.status !== 200) throw new Error("Donor register failed: " + JSON.stringify(res.body));
    const donorToken = (await request('POST', '/auth/login', 'grant_type=password&username=' + encodeURIComponent(donorEmail) + '&password=password123', {'Content-Type': 'application/x-www-form-urlencoded'})).body.access_token;
    
    // Register NGO
    const ngoEmail = `ngo_${crypto.randomBytes(4).toString('hex')}@test.com`;
    res = await request('POST', '/auth/register', { email: ngoEmail, password: 'password123', full_name: 'Test NGO', role: 'NGO', phone: '0987654321' });
    if(res.status !== 200) throw new Error("NGO register failed: " + JSON.stringify(res.body));
    const ngoToken = (await request('POST', '/auth/login', 'grant_type=password&username=' + encodeURIComponent(ngoEmail) + '&password=password123', {'Content-Type': 'application/x-www-form-urlencoded'})).body.access_token;
    
    const donorHeaders = { 'Authorization': `Bearer ${donorToken}` };
    const ngoHeaders = { 'Authorization': `Bearer ${ngoToken}` };

    const ngoProfile = await request('POST', '/ngos/', { organization_name: 'Test Org', registration_number: 'REG-1234', address: '123 St', contact_person: 'Contact', phone: '0987654321' }, ngoHeaders);
    const ngoId = ngoProfile.body.id;

    // Create Donation
    const donationRes = await request('POST', '/donations/', {
        title: "Test Blanket Donation",
        category: "Clothing",
        description: "Warm Blankets",
        pickup_address: "123 Donor St",
        items: [{ item_name: "Blanket", category: "Clothing", quantity: 2, condition: "NEW" }]
    }, donorHeaders);
    const donationId = donationRes.body.id;
    console.log("Created donation ID:", donationId);

    // Create Demand & Match
    await request('POST', '/demand/', { item_name: "Blanket", category: "Clothing", quantity_required: 2, urgency_level: "HIGH" }, ngoHeaders);
    const triggerRes = await request('POST', '/matcher/trigger', {}, ngoHeaders);

    // Accept Request
    const reqs = await request('GET', '/ngos/donation-requests', null, ngoHeaders);
    const myReq = reqs.body.find(r => r.donation_id === donationId);
    if (!myReq) throw new Error("Donation request not found for donation " + donationId);

    await request('POST', `/ngos/donation-requests/${myReq.id}/accept`, {}, ngoHeaders);

    // Schedule Pickup
    await request('POST', `/ngos/donation-requests/${myReq.id}/schedule-pickup`, {
        date: new Date(Date.now() + 86400000).toISOString(),
        time_slot: '10:00 - 12:00',
        volunteer: 'Volunteer Bob',
        notes: 'Doorstep pickup'
    }, ngoHeaders);

    // Mark Collected -> triggers OTP generation
    await request('POST', `/ngos/donation-requests/${myReq.id}/mark-collected`, {}, ngoHeaders);

    // Get OTP from donor tracking page
    const trackingRes = await request('GET', `/donations/${donationId}/tracking`, null, donorHeaders);
    const plainOtp = trackingRes.body.delivery_otp;
    console.log("Obtained Delivery OTP:", plainOtp);

    // Now test verify delivery WITHOUT file (only OTP + notes)
    console.log("Verifying delivery WITHOUT photo proof...");
    const verifyRes = await requestFormDataNoFile('POST', `/status/donations/${donationId}/verify-delivery`, {
        otp: plainOtp,
        notes: 'Delivered at desk without photo'
    }, ngoHeaders);

    console.log("Verify Response Status:", verifyRes.status);
    console.log("Verify Response Body:", verifyRes.body);

    if (verifyRes.status === 200 && verifyRes.body.success && verifyRes.body.status === 'DELIVERED') {
        console.log("SUCCESS: Delivery verified without mandatory photo proof!");
    } else {
        throw new Error("Verification without photo failed: " + JSON.stringify(verifyRes.body));
    }
}

runTest().catch(err => {
    console.error("Test Error:", err);
    process.exit(1);
});
