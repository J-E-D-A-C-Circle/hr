const fs = require('fs');

const envText = fs.readFileSync('.env', 'utf8');
const usernameMatch = envText.match(/WIGAL_USERNAME=["']?([^"\r\n]+)["']?/);
const passwordMatch = envText.match(/WIGAL_PASSWORD=["']?([^"\r\n]+)["']?/);

const username = usernameMatch ? usernameMatch[1] : 'DVLA';
const password = passwordMatch ? passwordMatch[1] : '';

console.log('Testing with Username:', username);

async function testSender(sender) {
  try {
    const res = await fetch('https://frog.wigal.com.gh/api/v2/sendmsg', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        password,
        source: sender,
        destination: '233543860264',
        message: `Your DVLA NSS verification code is 654321. Valid for 10 minutes.`,
      })
    });
    const text = await res.text();
    console.log(`Result for Sender ID "${sender}":`, text);
  } catch (err) {
    console.error(`Error for "${sender}":`, err.message);
  }
}

async function run() {
  const senders = ['DVLA NSS'];
  for (const sender of senders) {
    await testSender(sender);
  }
}

run();
