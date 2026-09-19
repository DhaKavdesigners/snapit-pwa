const https = require('https');

let attempts = 0;
const maxAttempts = 15;

function poll() {
  attempts++;
  https.get('https://snapit-rider.vercel.app/.well-known/assetlinks.json', (res) => {
    if (res.statusCode === 200) {
      console.log('✅ DEPLOYED! Status: 200 OK');
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        console.log(data);
        process.exit(0);
      });
    } else {
      console.log(`[Attempt ${attempts}/${maxAttempts}] Status: ${res.statusCode}. Waiting for Vercel...`);
      if (attempts >= maxAttempts) {
        console.log('Timeout waiting for deployment.');
        process.exit(1);
      }
      setTimeout(poll, 5000);
    }
  }).on('error', (err) => {
    console.log('Error:', err.message);
    setTimeout(poll, 5000);
  });
}

poll();
