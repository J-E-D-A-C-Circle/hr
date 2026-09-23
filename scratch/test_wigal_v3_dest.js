const apiKey = "$2a$10$5X3KvL/v/kzYoVzyEv9XsODWHASgrxvh5X7sJVUJDlPnUc/3x5d52";
const username = "DVLA";
const destination = "0543860264";
const senderId = "DVLA NSS";

async function testSend() {
  const payload = {
    senderid: senderId,
    destinations: [destination],
    message: 'Hello! This is a test SMS from DVLA NSS Portal.',
    msgid: `MSG_${Date.now()}`,
    smstype: 'text',
  };

  const res = await fetch('https://frogapi.wigal.com.gh/api/v3/sms/send', {
    method: 'POST',
    headers: {
      'API-KEY': apiKey,
      'USERNAME': username,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });
  const text = await res.text();
  console.log('v3 Send Result:', text);
}

testSend();
