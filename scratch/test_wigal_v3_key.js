const apiKey = "$2a$10$5X3KvL/v/kzYoVzyEv9XsODWHASgrxvh5X7sJVUJDlPnUc/3x5d52";
const username = "DVLA";
const destination = "0543860264";
const senderId = "DVLA NSS";

console.log('Testing Frog API v3 with key:', apiKey);

async function testV3Send() {
  try {
    const res = await fetch('https://frogapi.wigal.com.gh/api/v3/sms/send', {
      method: 'POST',
      headers: {
        'API-KEY': apiKey,
        'USERNAME': username,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        senderid: senderId,
        destination: destination,
        message: 'Hello! This is a test SMS from DVLA NSS Portal.',
        msgid: `MSG_${Date.now()}`,
        smstype: 'text',
      })
    });
    const text = await res.text();
    console.log('v3 Send Result:', text);
  } catch (err) {
    console.error('Error v3 Send:', err.message);
  }
}

async function testV3OtpGenerate() {
  try {
    const res = await fetch('https://frogapi.wigal.com.gh/api/v3/sms/otp/generate', {
      method: 'POST',
      headers: {
        'API-KEY': apiKey,
        'USERNAME': username,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        number: destination,
        expiry: 10,
        length: 6,
        messagetemplate: 'Your DVLA NSS verification code is : %OTPCODE%. It will expire after %EXPIRY% mins',
        type: 'NUMERIC',
        senderid: senderId,
      })
    });
    const text = await res.text();
    console.log('v3 OTP Generate Result:', text);
  } catch (err) {
    console.error('Error v3 OTP Generate:', err.message);
  }
}

async function run() {
  await testV3Send();
  await testV3OtpGenerate();
}

run();
