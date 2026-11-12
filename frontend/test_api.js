const http = require('http');

const options = {
  hostname: 'localhost',
  port: 8000,
  path: '/api/donations/7/receipt',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    // We don't have a token, so we'll probably get 401 Unauthorized, but let's see what happens.
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Body: ${data}`);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

const payload = JSON.stringify({
  items: [
    {
      donation_item_id: 1, // dummy
      expected_quantity: 2,
      received_quantity: 2,
      condition: "GOOD"
    }
  ],
  notes: "Test"
});

req.write(payload);
req.end();
