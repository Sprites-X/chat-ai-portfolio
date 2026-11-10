// test ของ BE รันด้วย `node --test` (pipeline รันให้ทุกครั้งที่ push)
// เปิด server จริงด้วย `node index.js` แล้วยิง request เข้าไป จึงไม่ต้องแก้ index.js
// ไม่ต้องใช้ฐานข้อมูลหรือ Gemini key เพราะตรวจเฉพาะ response ที่ไม่ไปถึง DB/AI
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const net = require('node:net');

let server;
let base;
let logs = '';

// ขอพอร์ตว่างจากระบบ จะได้ไม่ชนกับโปรแกรมอื่นในเครื่อง
function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.once('error', reject);
    s.listen(0, () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });
}

before(async () => {
  const port = await freePort();
  base = `http://127.0.0.1:${port}`;

  server = spawn(process.execPath, ['index.js'], {
    cwd: __dirname,
    // ตั้งค่าว่างไว้ dotenv จะไม่เขียนทับ test จึงไม่ไปแตะ DB หรือ Gemini จริงแม้ในเครื่องจะมี .env
    env: { ...process.env, PORT: String(port), DATABASE_URL: '', GEMINI_API_KEY: '' },
  });
  server.stdout.on('data', (d) => (logs += d));
  server.stderr.on('data', (d) => (logs += d));

  // รอจน server รับ request ได้ (สูงสุด 10 วินาที)
  for (let i = 0; i < 100; i++) {
    try {
      await fetch(base);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  throw new Error(`server ไม่ขึ้นภายใน 10 วินาที\n${logs}`);
});

after(() => server?.kill());

describe('POST /api/chat', () => {
  const post = (body) =>
    fetch(`${base}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  it('ไม่มี message ได้ 400 พร้อม error', async () => {
    const res = await post({});
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.ok(data.error);
  });

  it('message เป็นข้อความว่างได้ 400', async () => {
    const res = await post({ message: '' });
    assert.equal(res.status, 400);
  });

  it('ส่งชื่อ field ผิด (text แทน message) ได้ 400', async () => {
    const res = await post({ text: 'สวัสดี' });
    assert.equal(res.status, 400);
  });
});

describe('route ที่ไม่มีอยู่', () => {
  it('GET /api/chat ได้ 404 เพราะรับเฉพาะ POST', async () => {
    const res = await fetch(`${base}/api/chat`);
    assert.equal(res.status, 404);
  });
});
