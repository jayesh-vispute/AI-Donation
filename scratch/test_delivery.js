const http = require('http');
const fs = require('fs');
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

// Multipatch FormData support for node script
async function requestFormData(method, path, dataObj, fileObj, headers = {}) {
    return new Promise((resolve, reject) => {
        const boundary = '----WebKitFormBoundary' + crypto.randomBytes(8).toString('hex');
        let body = '';
        
        for (const [key, value] of Object.entries(dataObj)) {
            body += `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`;
        }
        
        const fileContent = fs.readFileSync(fileObj.path);
        const fileHeader = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileObj.name}"\r\nContent-Type: image/jpeg\r\n\r\n`;
        const footer = `\r\n--${boundary}--\r\n`;
        
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
        req.write(Buffer.from(fileHeader, 'utf8'));
        req.write(fileContent);
        req.write(Buffer.from(footer, 'utf8'));
        req.end();
    });
}

async function runTests() {
    console.log("Setting up test environment...");
    
    // Register Donor
    const donorEmail = `donor_${crypto.randomBytes(4).toString('hex')}@test.com`;
    let res = await request('POST', '/auth/register', { email: donorEmail, password: 'password123', full_name: 'Test Donor', role: 'DONOR', phone: '1234567890' });
    if(res.status !== 200) throw new Error("Donor register failed: " + JSON.stringify(res.body));
    const donorToken = (await request('POST', '/auth/login', 'grant_type=password&username=' + encodeURIComponent(donorEmail) + '&password=password123', {'Content-Type': 'application/x-www-form-urlencoded'})).body.access_token;
    if(!donorToken) throw new Error("Donor login failed");
    
    // Register NGO
    const ngoEmail = `ngo_${crypto.randomBytes(4).toString('hex')}@test.com`;
    res = await request('POST', '/auth/register', { email: ngoEmail, password: 'password123', full_name: 'Test NGO', role: 'NGO', phone: '0987654321' });
    if(res.status !== 200) throw new Error("NGO register failed: " + JSON.stringify(res.body));
    const ngoToken = (await request('POST', '/auth/login', 'grant_type=password&username=' + encodeURIComponent(ngoEmail) + '&password=password123', {'Content-Type': 'application/x-www-form-urlencoded'})).body.access_token;
    if(!ngoToken) throw new Error("NGO login failed");
    
    const donorHeaders = { 'Authorization': `Bearer ${donorToken}` };
    const ngoHeaders = { 'Authorization': `Bearer ${ngoToken}` };

    const ngoRes = await request('POST', '/ngos/', { organization_name: 'Test NGO', registration_number: 'REG-1234', address: '123 St', contact_person: 'Mr. NGO', phone: '0987654321', website: 'http://example.com' }, ngoHeaders);
    if(ngoRes.status !== 200) throw new Error("NGO profile failed: " + JSON.stringify(ngoRes.body));
    const ngoId = ngoRes.body.id;

    fs.writeFileSync('test_photo.jpg', Buffer.from('ffd8ffe000104a46494600010101004800480000ffdb0043000302020302020303030304030304050805050404050a070706080c0a0c0c0b0a0b0b0d0e12100d0e110e0b0b1016101113141515150c0f171816141812141514ffc0000b080001000101011100ffc4001f0000010501010101010100000000000000000102030405060708090a0bffda0008010100003f003fffd9', 'hex'));

    async function setupDonation() {
        let dRes = await request('POST', '/donations/', { items: [{item_name: 'Food', quantity: 10, condition: 'NEW'}], pickup_address: '123 St', pickup_city: 'City', pickup_state: 'State', pickup_postal_code: '12345', pickup_latitude: 0, pickup_longitude: 0, pickup_scheduled_at: '2026-10-01T10:00:00Z' }, donorHeaders);
        if(dRes.status !== 200) throw new Error("Create donation failed: " + JSON.stringify(dRes.body));
        const dId = dRes.body.id;
        
        let mRes = await request('POST', `/donations/${dId}/match`, { ngo_id: ngoId }, donorHeaders);
        if(mRes.status !== 200) throw new Error("Match failed: " + JSON.stringify(mRes.body));
        
        let aRes = await request('PATCH', `/status/donations/${dId}`, { status: 'ACCEPTED' }, ngoHeaders);
        if(aRes.status !== 200) throw new Error("Accept failed: " + JSON.stringify(aRes.body));
        
        let pRes = await request('POST', `/pickups/`, { donation_id: dId, date: '2026-10-01T10:00:00Z', time_slot: 'MORNING', address: '123 St' }, ngoHeaders);
        if(pRes.status !== 200) throw new Error("Pickup create failed: " + JSON.stringify(pRes.body));
        
        await request('PATCH', `/status/donations/${dId}`, { status: 'PICKUP_SCHEDULED' }, ngoHeaders);
        await request('PATCH', `/status/donations/${dId}`, { status: 'PICKUP_CONFIRMED' }, ngoHeaders);
        
        return dId;
    }

    // TEST 1
    console.log("\nTEST 1: Try Delivered before COLLECTED");
    let d1 = await setupDonation();
    res = await requestFormData('POST', `/status/donations/${d1}/verify-delivery`, { otp: '123456' }, { path: 'test_photo.jpg', name: 'photo.jpg' }, ngoHeaders);
    if(res.status !== 400 || !JSON.stringify(res.body).includes("must be 'COLLECTED'")) throw new Error("Test 1 failed: status=" + res.status + " body=" + JSON.stringify(res.body));
    console.log("✅ TEST 1 passed");

    // TEST 2
    console.log("\nTEST 2: COLLECTED + no OTP");
    let d2 = await setupDonation();
    await request('PATCH', `/status/donations/${d2}`, { status: 'COLLECTED' }, ngoHeaders);
    res = await requestFormData('POST', `/status/donations/${d2}/verify-delivery`, { }, { path: 'test_photo.jpg', name: 'photo.jpg' }, ngoHeaders);
    if(res.status !== 422) throw new Error("Test 2 failed");
    console.log("✅ TEST 2 passed");

    // TEST 3
    console.log("\nTEST 3: COLLECTED + wrong OTP + photo");
    let d3 = await setupDonation();
    await request('PATCH', `/status/donations/${d3}`, { status: 'COLLECTED' }, ngoHeaders);
    res = await requestFormData('POST', `/status/donations/${d3}/verify-delivery`, { otp: '000000' }, { path: 'test_photo.jpg', name: 'photo.jpg' }, ngoHeaders);
    if(res.status !== 400 || !JSON.stringify(res.body).includes("Invalid or expired OTP")) throw new Error("Test 3 failed");
    console.log("✅ TEST 3 passed");

    // TEST 5
    console.log("\nTEST 5: COLLECTED + valid OTP + no photo");
    let d5 = await setupDonation();
    await request('PATCH', `/status/donations/${d5}`, { status: 'COLLECTED' }, ngoHeaders);
    let otpRes = await request('GET', `/donations/${d5}/delivery-otp`, null, donorHeaders);
    res = await request('POST', `/status/donations/${d5}/verify-delivery`, { otp: otpRes.body.otp }, ngoHeaders);
    if(res.status !== 422) throw new Error("Test 5 failed");
    console.log("✅ TEST 5 passed");

    // TEST 6
    console.log("\nTEST 6: COLLECTED + valid OTP + valid photo");
    let d6 = await setupDonation();
    await request('PATCH', `/status/donations/${d6}`, { status: 'COLLECTED' }, ngoHeaders);
    otpRes = await request('GET', `/donations/${d6}/delivery-otp`, null, donorHeaders);
    let otp6 = otpRes.body.otp;
    res = await requestFormData('POST', `/status/donations/${d6}/verify-delivery`, { otp: otp6 }, { path: 'test_photo.jpg', name: 'photo.jpg' }, ngoHeaders);
    if(res.status !== 200 || res.body.status !== 'DELIVERED') throw new Error("Test 6 failed: " + JSON.stringify(res.body));
    console.log("✅ TEST 6 passed");

    // TEST 7
    console.log("\nTEST 7: Reuse the same OTP");
    res = await requestFormData('POST', `/status/donations/${d6}/verify-delivery`, { otp: otp6 }, { path: 'test_photo.jpg', name: 'photo.jpg' }, ngoHeaders);
    if(res.status !== 400) throw new Error("Test 7 failed");
    console.log("✅ TEST 7 passed");

    // TEST 8
    console.log("\nTEST 8: Try using OTP for Donation A on Donation B");
    let d8 = await setupDonation();
    await request('PATCH', `/status/donations/${d8}`, { status: 'COLLECTED' }, ngoHeaders);
    res = await requestFormData('POST', `/status/donations/${d8}/verify-delivery`, { otp: otp6 }, { path: 'test_photo.jpg', name: 'photo.jpg' }, ngoHeaders);
    if(res.status !== 400) throw new Error("Test 8 failed");
    console.log("✅ TEST 8 passed");

    // TEST 9
    console.log("\nTEST 9: Unauthorized user tries to mark Delivered");
    let d9 = await setupDonation();
    await request('PATCH', `/status/donations/${d9}`, { status: 'COLLECTED' }, ngoHeaders);
    otpRes = await request('GET', `/donations/${d9}/delivery-otp`, null, donorHeaders);
    let otp9 = otpRes.body.otp;
    
    const otherEmail = `ngo_${crypto.randomBytes(4).toString('hex')}@test.com`;
    await request('POST', '/auth/register', { email: otherEmail, password: 'password123', full_name: 'Test NGO 2', role: 'NGO', phone: '0987654321' });
    const otherToken = (await request('POST', '/auth/login?grant_type=password&username=' + encodeURIComponent(otherEmail) + '&password=password123', null, {'Content-Type': 'application/x-www-form-urlencoded'})).body.access_token;
    
    res = await requestFormData('POST', `/status/donations/${d9}/verify-delivery`, { otp: otp9 }, { path: 'test_photo.jpg', name: 'photo.jpg' }, { 'Authorization': `Bearer ${otherToken}` });
    if(res.status !== 403) throw new Error("Test 9 failed");
    console.log("✅ TEST 9 passed");

    // TEST 10
    console.log("\nTEST 10: After DELIVERED, Donor attempts to change status");
    res = await request('PATCH', `/status/donations/${d6}`, { status: 'PENDING' }, donorHeaders);
    if(res.status !== 403 && res.status !== 400) throw new Error("Test 10 failed");
    console.log("✅ TEST 10 passed");

    // TEST 12
    console.log("\nTEST 12: Try RECEIVED before DELIVERED");
    let d9_data = (await request('GET', `/donations/${d9}`, null, ngoHeaders)).body;
    let item9_id = d9_data.items[0].id;
    res = await request('POST', `/status/donations/${d9}/receipt`, { items: [{donation_item_id: item9_id, expected_quantity: 10, received_quantity: 10, condition: 'NEW'}], notes: 'Test' }, ngoHeaders);
    if(res.status !== 400 || !JSON.stringify(res.body).includes('must be in DELIVERED state')) throw new Error("Test 12 failed");
    console.log("✅ TEST 12 passed");

    // TEST 11
    console.log("\nTEST 11: NGO confirms receipt");
    let d6_data = (await request('GET', `/donations/${d6}`, null, ngoHeaders)).body;
    let item6_id = d6_data.items[0].id;
    res = await request('POST', `/status/donations/${d6}/receipt`, { items: [{donation_item_id: item6_id, expected_quantity: 10, received_quantity: 10, condition: 'NEW'}], notes: 'Test receipt' }, ngoHeaders);
    if(res.status !== 200) throw new Error("Test 11 failed: " + JSON.stringify(res.body));
    console.log("✅ TEST 11 passed");

    // TEST 13
    console.log("\nTEST 13: After RECEIVED, try Distribution/Completed");
    res = await request('PATCH', `/status/donations/${d6}`, { status: 'COMPLETED' }, ngoHeaders);
    if(res.status !== 400) throw new Error("Test 13 failed");
    console.log("✅ TEST 13 passed");

    console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉");
    fs.unlinkSync('test_photo.jpg');
}

runTests().catch(console.error);
