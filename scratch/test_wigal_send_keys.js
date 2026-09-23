const apiKey = "$2a$10$5X3KvL/v/kzYoVzyEv9XsODWHASgrxvh5X7sJVUJDlPnUc/3x5d52";
const username = "DVLA";
const dest = "0543860264";

async function test(name, extra) {
  try {
    const payload = {
      senderid: "DVLA NSS",
      message: "Test message",
      msgid: `MSG_${Date.now()}_${Math.floor(Math.random()*100)}`,
      smstype: "text",
      ...extra
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
    console.log(`Key [${name}]:`, text);
  } catch (err) {
    console.error(`Error [${name}]:`, err.message);
  }
}

async function run() {
  await test('destinations: string', { destinations: dest });
  await test('destinations: array', { destinations: [dest] });
  await test('destination: string', { destination: dest });
  await test('destination: array', { destination: [dest] });
  await test('recipient: string', { recipient: dest });
  await test('recipients: array', { recipients: [dest] });
}

run();
