const fs = require('fs');

const envText = fs.readFileSync('.env', 'utf8');
const usernameMatch = envText.match(/WIGAL_USERNAME=["']?([^"\r\n]+)["']?/);
const passwordMatch = envText.match(/WIGAL_PASSWORD=["']?([^"\r\n]+)["']?/);

const username = usernameMatch ? usernameMatch[1] : 'DVLA';
const password = passwordMatch ? passwordMatch[1] : '';

console.log('Testing Wigal v2 payload key variations for username:', username);

async function testPayload(name, payload) {
  try {
    const res = await fetch('https://frog.wigal.com.gh/api/v2/sendmsg', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const text = await res.text();
    console.log(`Payload [${name}]:`, text);
  } catch (err) {
    console.error(`Error [${name}]:`, err.message);
  }
}

async function run() {
  const variations = [
    { name: 'source: DVLA NSS', payload: { username, password, source: 'DVLA NSS', destination: '233543860264', message: 'Test message' } },
    { name: 'sender: DVLA NSS', payload: { username, password, sender: 'DVLA NSS', destination: '233543860264', message: 'Test message' } },
    { name: 'senderid: DVLA NSS', payload: { username, password, senderid: 'DVLA NSS', destination: '233543860264', message: 'Test message' } },
    { name: 'sender_id: DVLA NSS', payload: { username, password, sender_id: 'DVLA NSS', destination: '233543860264', message: 'Test message' } },
    { name: 'from: DVLA NSS', payload: { username, password, from: 'DVLA NSS', destination: '233543860264', message: 'Test message' } },
  ];

  for (const v of variations) {
    await testPayload(v.name, v.payload);
  }
}

run();
