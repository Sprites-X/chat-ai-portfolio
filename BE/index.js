const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_history (
        id SERIAL PRIMARY KEY,
        user_message TEXT NOT NULL,
        ai_response TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Database connected & initialized!');
  } catch (err) {
    console.error('❌ Error initializing database:', err);
  }
};


const PORTFOLIO_CONTEXT = `
ชื่อกลุ่ม ByteMind
1. ข้อมูลภาพรวมกลุ่ม
 แนวคิด & จุดเด่น: ทำเว็บ Portfolio ที่ไม่ได้มีแค่อ่านประวัติเฉยๆ แต่ใส่ระบบแชท AI เข้าไปด้วย กิมมิกคืออยากให้คนที่เข้ามาดูเว็บ สามารถพิมพ์ถาม-ตอบเรื่องโปรเจกต์หรือถามข้อมูลสมาชิกในกลุ่มได้ตรงๆ เลย แถมหลังบ้านเซ็ตระบบ CI/CD กับ Docker ไว้แน่นเปรี๊ยะ ดันโค้ดปุ๊บเทสปั๊บ ระบบไม่รวนแน่นอน
 ผลงานที่ทำร่วมกัน: เว็บ Chat AI Portfolio นี่แหละ ช่วยกันลุยตั้งแต่ขึ้นโครง UI, เขียน API ยิงหา AI, ทำเทส จนถึงเอาขึ้นระบบจริงบน Cloud
 ช่องทางติดต่อ:
 GitHub: Sprites-X/chat-ai-portfolio

2. ข้อมูลสมาชิกรายคน
1. Wannaporn (สาย Frontend)
 ทักษะ: React, JavaScript, HTML/CSS, UI/UX, Component Design
 ผลงาน / หน้าที่: ตัวแม่เรื่องความสวยงาม ลุยทำหน้าเว็บ UI ทั้งหมด ทำปุ่ม ออกแบบการจัดวางคอมโพเนนต์ แล้วก็ทำหน้าแชทโต้ตอบให้เล่นง่ายสบายตา

2. Phongsakon (สาย DevOps)
 ทักษะ: Docker, Nginx, GitHub Actions (CI/CD), Trivy, Render, Unit Test (node:test), Git/GitHub
 ผลงาน / หน้าที่: สร้าง repo กลุ่มและวางโครง BE/FE ทำ Dockerfile ของ BE กับ FE และ Nginx Proxy ที่ส่ง /api ต่อไปหา BE เขียน pipeline GitHub Actions ให้ test → build → สแกนช่องโหว่ → deploy ขึ้น Render อัตโนมัติ โดย build เฉพาะฝั่งที่โค้ดเปลี่ยน เขียน test ของ API ตั้งกฎป้องกัน main ให้ต้องผ่าน PR และ test ก่อน merge และดูแลค่าลับไม่ให้หลุดเข้า repo

3. Natnicha (สาย Backend)
ทักษะ: Node.js, Express, Gemini API Integration, Automated Testing (node:test), RESTful API Design, Git/GitHub
ผลงาน / หน้าที่: พัฒนาและดูแลระบบ Backend API /api/chat ทั้งหมด เชื่อมต่อ Gemini API SDK เขียนระบบสลับโมเดลอัตโนมัติ (Fallback Logic) เมื่อเจอ Error 429/500/503 จัดการระบบตอบรับสำรอง และเขียน Unit Test ให้ผ่านอัตโนมัติก่อนส่งโค้ดขึ้นระบบจริง
`;

const MODELS = [...new Set([process.env.GEMINI_MODEL || 'gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-3.8-flash'])];

async function askGemini(ai, message) {
  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: message,
        config: { systemInstruction: `คุณคือ AI ผู้ช่วยตอบคำถามเกี่ยวกับกลุ่ม อ้างอิงข้อมูลเท่านั้น: ${PORTFOLIO_CONTEXT}` },
      });
      return response.text;
    } catch (err) {
      if (![429, 500, 503].includes(err.status)) throw err;
      console.error(`⚠️ ${model} ตอบ ${err.status} ลองโมเดลถัดไป`);
    }
  }
  const busy = new Error('Gemini ไม่ว่างทุกโมเดล');
  busy.status = 503;
  throw busy;
}

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  let aiReply = '';
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      aiReply = await askGemini(ai, message);
    } catch (err) {
      if (err.status === 503) {
        return res.status(503).json({ error: 'AI มีผู้ใช้งานเยอะ ลองใหม่อีกครั้งนะ' });
      }
      console.error('Error calling Gemini API:', err);
      aiReply = `[ระบบตอบรับอัตโนมัติ] คุณถามว่า: "${message}" (ข้อมูลกลุ่ม: ByteMind)`;
    }
  } else {
    aiReply = `[ระบบตอบรับอัตโนมัติ] คุณถามว่า: "${message}" (ข้อมูลกลุ่ม: ByteMind)`;
  }
  try {
    await pool.query('INSERT INTO chat_history (user_message, ai_response) VALUES ($1, $2)', [message, aiReply]);
  } catch (err) {
    console.error('❌ Error saving chat history:', err);
  }

  res.json({ reply: aiReply });
});

if (require.main === module) {
  initDb();
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;

