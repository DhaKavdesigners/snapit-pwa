const https = require('https');

function check() {
  https.get('https://snapit-rider.vercel.app/.well-known/assetlinks.json', (res) => {
    console.log('Status code:', res.statusCode);
    console.log('Headers:', res.headers['content-type']);
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log('Response body:\n', body);
    });
  }).on('error', (err) => console.error('Error:', err.message));
}

check();
