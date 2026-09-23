const fs = require('fs');

const envText = fs.readFileSync('.env', 'utf8');
const usernameMatch = envText.match(/WIGAL_USERNAME=["']?([^"\r\n]+)["']?/);
const passwordMatch = envText.match(/WIGAL_PASSWORD=["']?([^"\r\n]+)["']?/);
const apiKeyMatch = envText.match(/WIGAL_API_KEY=["']?([^"\r\n]+)["']?/);

const username = usernameMatch ? usernameMatch[1] : 'DVLA';
const apiKey = apiKeyMatch ? apiKeyMatch[1] : (passwordMatch ? passwordMatch[1] : '');

console.log('Testing Frog API v3 OTP Generate for username:', username);
console.log('API-KEY / Credential:', apiKey);

async function testOtpGenerate(phone) {
  try {
    const postData = {
      number: phone,
      expiry: 10,
      length: 6,
      messagetemplate: "Your DVLA NSS verification code is: %OTPCODE%. Valid for %EXPIRY% mins",
      type: "NUMERIC",
      senderid: "DVLA NSS"
    };

    const res = await fetch('https://frogapi.wigal.com.gh/api/v3/sms/otp/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API-KEY': apiKey,
        'USERNAME': username
      },
      body: JSON.stringify(postData)
    });

    const text = await res.text();
    console.log(`v3 OTP Generate Result for "${phone}":`, text);
  } catch (err) {
    console.error('Error generating OTP:', err.message);
  }
}

testOtpGenerate('0543860264');
