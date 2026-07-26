const http = require('http');

const data = JSON.stringify({
  text: "My name is John Doe living at 123 Main St. API key is sample_stripe_secret_key_placeholder, Aadhaar is 9876 5432 1098, PAN is ABCDE1234F, email is test@example.com, card is 4532 7810 9901 2345, password = 'MySuperSecretPassword123!'."
});

const options = {
  hostname: 'localhost',
  port: 3005,
  path: '/api/scrub',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  let responseData = '';
  res.on('data', (chunk) => { responseData += chunk; });
  res.on('end', () => {
    console.log('HTTP Status:', res.statusCode);
    console.log('API Response:\n', JSON.stringify(JSON.parse(responseData), null, 2));
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.write(data);
req.end();
