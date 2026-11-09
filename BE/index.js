const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 1. เชื่อมต่อฐานข้อมูล PostgreSQL บน Neon Cloud
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 2. สร้างตาราง chat_history ใน PostgreSQL อัตโนมัติ
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
initDb();

// 3. กำหนดข้อมูล Context ของ Portfolio กลุ่ม และสมาชิก
const PORTFOLIO_CONTEXT = `
ข้อมูลกลุ่ม:
- ชื่อกลุ่ม: DevTeam Alpha
- ผลงาน: เว็บไซต์แนะนำ Portfolio กลุ่ม พร้อมระบบ Chatbot AI อัจฉริยะ

ข้อมูลสมาชิก:
1. สมาชิกคนที่ 1: Frontend Developer (พัฒนา UI หน้าเว็บและหน้าแชทด้วย React)
2. สมาชิกคนที่ 2 (ฉัน): Backend Developer (สร้าง Express API, จัดการ PostgreSQL และ AI Context Integration)
3. สมาชิกคนที่ 3: DevOps (จัดการ CI/CD Pipeline และการ Deploy ระบบ)
`;

// 4. API Endpoint รองรับการรับ-ส่งข้อความแชท
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'กรุณาระบุข้อความ' });

    let aiReply = '';

    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'ยังไม่ต้องใส่ก็ได้ครับ') {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: message,
        config: {
          systemInstruction: `คุณคือ AI ผู้ช่วยตอบคำถามเกี่ยวกับกลุ่ม อ้างอิงข้อมูลนี้เท่านั้น: ${PORTFOLIO_CONTEXT}`
        }
      });
      aiReply = response.text;
    } else {
      aiReply = `[ระบบตอบรับอัตโนมัติ] คุณถามว่า: "${message}" (ข้อมูลกลุ่ม: DevTeam Alpha)`;
    }

    // บันทึกประวัติการสนทนาลง PostgreSQL
    await pool.query(
      'INSERT INTO chat_history (user_message, ai_response) VALUES ($1, $2)',
      [message, aiReply]
    );

    res.json({ reply: aiReply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดฝั่ง Server' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));