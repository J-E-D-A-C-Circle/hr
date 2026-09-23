const fs = require('fs');

const envText = fs.readFileSync('.env', 'utf8');
const usernameMatch = envText.match(/WIGAL_USERNAME=["']?([^"\r\n]+)["']?/);
const passwordMatch = envText.match(/WIGAL_PASSWORD=["']?([^"\r\n]+)["']?/);
const apiKeyMatch = envText.match(/WIGAL_API_KEY=["']?([^"\r\n]+)["']?/);

const username = usernameMatch ? usernameMatch[1] : 'DVLA';
const apiKey = apiKeyMatch ? apiKeyMatch[1] : (passwordMatch ? passwordMatch[1] : '');

console.log('Testing Frog API v3 for username:', username);
console.log('API Key / Password:', apiKey);

async function testV3(sender) {
  try {
    const res = await fetch('https://frogapi.wigal.com.gh/api/v3/sms/send', {
      method: 'POST',
      headers: {
        'API-KEY': apiKey,
        'USERNAME': username,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        senderid: sender,
        destination: '233543860264',
        message: 'Your DVLA NSS verification code is 123456.',
        msgid: `MSG_${Date.now()}`,
        smstype: 'text',
      })
    });
    const text = await res.text();
    console.log(`v3 Result for Sender ID "${sender}":`, text);
  } catch (err) {
    console.error(`Error v3 for "${sender}":`, err.message);
  }
}

async function run() {
  await testV3('DVLA NSS');
  await testV3('DVLA');
  await testV3('Weskina');
}

run();
