const test = require('node:test');
const assert = require('node:assert');

test('POST /api/chat โดยไม่ส่ง message ควรคืนค่า 400', async () => {
  const app = require('./index.js');
  
  // สร้าง server ชั่วคราวบน port สุ่มเพื่อรันเทส
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    const data = await res.json();
    assert.strictEqual(res.status, 400);
    assert.strictEqual(data.error, 'Message is required');
  } finally {
    server.close();
  }
});
process.exit(0);
