const fs = require('fs');

const envText = fs.readFileSync('.env', 'utf8');
const usernameMatch = envText.match(/WIGAL_USERNAME=["']?([^"\r\n]+)["']?/);
const passwordMatch = envText.match(/WIGAL_PASSWORD=["']?([^"\r\n]+)["']?/);

const username = usernameMatch ? usernameMatch[1] : 'DVLA';
const password = passwordMatch ? passwordMatch[1] : 'Devapps@123';

async function testPhone(destination) {
  try {
    const res = await fetch('https://frog.wigal.com.gh/api/v2/sendmsg', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        password,
        source: 'DVLA NSS',
        destination,
        message: 'Test message from DVLA NSS',
      })
    });
    const text = await res.text();
    console.log(`Phone format "${destination}":`, text);
  } catch (err) {
    console.error(`Error for "${destination}":`, err.message);
  }
}

async function run() {
  await testPhone('0543860264');
  await testPhone('233543860264');
  await testPhone('+233543860264');
}

run();
