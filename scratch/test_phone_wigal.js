const apiKey = "$2a$10$5X3KvL/v/kzYoVzyEv9XsODWHASgrxvh5X7sJVUJDlPnUc/3x5d52";
const username = "DVLA";

async function testNumber(num) {
  console.log('\n--- Testing Number:', num);

  // 1. v3 Quick SMS
  try {
    const r1 = await fetch('https://frogapi.wigal.com.gh/api/v3/sms/send', {
      method: 'POST',
      headers: { 'API-KEY': apiKey, 'USERNAME': username, 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderid: 'DVLA NSS', destination: num, message: 'Test SMS from DVLA NSS', msgid: `MSG_${Date.now()}`, smstype: 'text' })
    });
    console.log('v3 Quick SMS Response:', await r1.text());
  } catch (err) {
    console.error('v3 Quick SMS Error:', err.message);
  }

  // 2. v3 OTP Generate
  try {
    const r2 = await fetch('https://frogapi.wigal.com.gh/api/v3/sms/otp/generate', {
      method: 'POST',
      headers: { 'API-KEY': apiKey, 'USERNAME': username, 'Content-Type': 'application/json' },
      body: JSON.stringify({ number: num, expiry: 10, length: 6, messagetemplate: 'Your code is : %OTPCODE%', type: 'NUMERIC', senderid: 'DVLA NSS' })
    });
    console.log('v3 OTP Generate Response:', await r2.text());
  } catch (err) {
    console.error('v3 OTP Generate Error:', err.message);
  }

  // 3. v2 API
  try {
    const r3 = await fetch('https://frog.wigal.com.gh/api/v2/sendmsg', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: apiKey, source: 'DVLA NSS', destination: num, message: 'Test SMS v2 from DVLA NSS' })
    });
    console.log('v2 API Response:', await r3.text());
  } catch (err) {
    console.error('v2 API Error:', err.message);
  }
}

async function run() {
  await testNumber('0240767261');
  await testNumber('233240767261');
  await testNumber('+233240767261');
  process.exit(0);
}

run();
