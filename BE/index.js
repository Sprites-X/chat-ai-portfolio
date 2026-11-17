const express = require('express');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const { Pool } = require('pg');

const app = express();
// ไม่เปิด CORS: หน้าเว็บเรียก /api/chat ผ่าน nginx ของ FE ซึ่งเป็นโดเมนเดียวกัน
// เว็บอื่นจึงสั่งเบราว์เซอร์ของผู้ใช้ให้ยิง API นี้แทนไม่ได้ (curl/Postman ยังเรียกได้ตามปกติ)
app.use(express.json());

const PORT = process.env.PORT || 3000;
// Neon บังคับใช้ SSL: ต่อแบบเข้ารหัสและตรวจใบรับรองของ server เสมอ
// (ถ้า DATABASE_URL มี ?sslmode=... pg จะใช้ค่าจาก URL แทนค่านี้)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
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


// ข้อมูลที่ AI ใช้ตอบ ต้องตรงกับที่หน้าเว็บแสดง (FE/src/data/team.js) ถ้าแก้ที่หนึ่งให้แก้อีกที่ด้วย
const PORTFOLIO_CONTEXT = `
ชื่อกลุ่ม ByteMind
1. ข้อมูลภาพรวมกลุ่ม
 แนวคิด & จุดเด่น: ทำเว็บ Portfolio ที่ไม่ได้มีแค่อ่านประวัติเฉยๆ แต่ใส่ระบบแชท AI เข้าไปด้วย กิมมิกคืออยากให้คนที่เข้ามาดูเว็บ สามารถพิมพ์ถาม-ตอบเรื่องโปรเจกต์หรือถามข้อมูลสมาชิกในกลุ่มได้ตรงๆ เลย แถมหลังบ้านเซ็ตระบบ CI/CD กับ Docker ไว้แน่นเปรี๊ยะ ดันโค้ดปุ๊บเทสปั๊บ ระบบไม่รวนแน่นอน
 ผลงานที่ทำร่วมกัน: เว็บ Chat AI Portfolio นี่แหละ ช่วยกันลุยตั้งแต่ขึ้นโครง UI, เขียน API ยิงหา AI, ทำเทส จนถึงเอาขึ้นระบบจริงบน Cloud
 ช่องทางติดต่อ:
 GitHub: Sprites-X/chat-ai-portfolio

2. ข้อมูลสมาชิกรายคน
1.วรรณพร แก้วหาวงศ์(Wannaporn)(สาย Frontend)
 ทักษะ: React, JavaScript, HTML/CSS, UI/UX, Component Design
 ผลงาน / หน้าที่: ตัวแม่เรื่องความสวยงาม ลุยทำหน้าเว็บ UI ทั้งหมด ทำปุ่ม ออกแบบการจัดวางคอมโพเนนต์ แล้วก็ทำหน้าแชทโต้ตอบให้เล่นง่ายสบายตา
 ผลงานส่วนตัว (นอกจากโปรเจกต์นี้):
 - ระบบอ่านและประมวลผลเอกสาร PO / Invoice อัตโนมัติด้วย n8n และ Gemini AI (งานเดี่ยว, 2026, มีฟอร์มให้ลองใช้จริงบน n8n) ใช้ n8n, Gemini AI: สร้าง Workflow อัตโนมัติบน n8n รับไฟล์เอกสาร PO และ Invoice ผ่านหน้า Webform แล้วให้ Gemini AI อ่าน วิเคราะห์ และดึงข้อมูลสำคัญออกจากเอกสาร ช่วยลดเวลาคีย์ข้อมูลเองและลดความผิดพลาด
 - BU SpaceHub (งานกลุ่ม, 2026) ใช้ UI/UX, Figma: แพลตฟอร์มจัดการและจองพื้นที่การใช้งานภายในมหาวิทยาลัยกรุงเทพ วรรณพรรับผิดชอบหลักในการออกแบบ UI/UX Flow และโครงสร้างหน้าจอทั้งหมดของระบบ ช่วยให้ผู้ใช้ค้นหา จอง และจัดการพื้นที่ส่วนกลางได้ง่ายขึ้น

2.พงศกร ศรีทอง(Phongsakon)(สาย DevOps)
 ทักษะ: Docker, Nginx, GitHub Actions (CI/CD), Trivy, Render, Unit Test (node:test), Git/GitHub
 ผลงาน / หน้าที่: สร้าง repo กลุ่มและวางโครง BE/FE ทำ Dockerfile ของ BE กับ FE และ Nginx Proxy ที่ส่ง /api ต่อไปหา BE เขียน pipeline GitHub Actions ให้ test → build → สแกนช่องโหว่ → deploy ขึ้น Render อัตโนมัติ โดย build เฉพาะฝั่งที่โค้ดเปลี่ยน เขียน test ของ API ตั้งกฎป้องกัน main ให้ต้องผ่าน PR และ test ก่อน merge และดูแลค่าลับไม่ให้หลุดเข้า repo
 ผลงานส่วนตัว (นอกจากโปรเจกต์นี้):
 - YOLO Inference Optimization Benchmark (งานเดี่ยว, 2026, github.com/Sprites-X/YOLO-Inference-Optimization) ใช้ Python, PyTorch, ONNX Runtime, TensorRT 10, CUDA: วัดความเร็ว YOLOv8n 7 แบบบน CPU และ RTX 5060 โดยเช็กผลทุกแบบกับ PyTorch ก่อนจับเวลา TensorRT FP16 ได้ 702 FPS เร็วกว่า PyTorch บน GPU เดียวกัน 2.60 เท่าโดย mAP50-95 เท่าเดิม ใช้ profiling รายเลเยอร์อธิบายว่าทำไม INT8 ทั้งช้ากว่าและแม่นน้อยกว่าบนโมเดลนี้ ไล่หาสาเหตุที่ mAP ได้ 0.365 ไม่ตรงกับ 0.373 ของ Ultralytics จนพบว่ามาจาก NMS ที่เลือก label เดียว และล็อก dependency พร้อมขั้นตรวจ environment
 - ERP Helpdesk Agent (งานเดี่ยว, 2026, github.com/Sprites-X/erp-helpdesk-agent) ใช้ Python, LangGraph, ChromaDB, Ollama, pytest, GitHub Actions: ผู้ช่วย helpdesk ภาษาไทยแบบหลาย agent รันบนเครื่องตัวเอง ตอบคำถามโปรแกรม ERP จากคู่มือพร้อมประโยคหลักฐานที่โค้ดตรวจว่ามีอยู่จริง ถ้าคู่มือไม่มีคำตอบจะเปิด ticket แทนการเดา ตัดสินใจถูก 19 จาก 20 ข้อกับคำถามที่ไม่เคยเห็นและไม่เคยตอบข้อที่ควรเปิด ticket ลดเวลาตอบจาก 10.7 เหลือ 2.8 วินาทีหลังพบว่า localhost บน Windows เสียเวลากับ IPv6 มี unit test 76 ข้อรันใน CI
 - TurtleBot3 Person Detection (งานกลุ่ม 3 คน วิชา Robotics, 2026) ใช้ ROS 2 Humble, Python, YOLO: หุ่น TurtleBot3 ในซิมเรียก ROS 2 service ตรวจจับคนด้วย YOLO ทุก 0.5 เมตรที่เดินแล้วบันทึกผลพร้อมตำแหน่ง พงศกรเขียน node นับระยะทางจาก odometry (subscribe /odom แล้วเรียก service) และวางแผนงานของทั้งโปรเจกต์

3.ณัฐนิชา ภูสิงห์(Natnicha)(สาย Backend)
ทักษะ: Node.js, Express, Gemini API Integration, Automated Testing (node:test), RESTful API Design, Git/GitHub
ผลงาน / หน้าที่: พัฒนาและดูแลระบบ Backend API /api/chat ทั้งหมด เชื่อมต่อ Gemini API SDK เขียนระบบสลับโมเดลอัตโนมัติ (Fallback Logic) เมื่อเจอ Error 429/500/503 จัดการระบบตอบรับสำรอง และเขียน Unit Test ให้ผ่านอัตโนมัติก่อนส่งโค้ดขึ้นระบบจริง
ผลงานส่วนตัว (นอกจากโปรเจกต์นี้):
- Satellite Orbital Catalog ETL Pipeline (งานกลุ่ม 3 คน, วิชา Big Data AIE321, 2026) ใช้ Python, PostgreSQL, SQL, Pandas: รับผิดชอบส่วน Data Engineering & ETL Pipeline ออกแบบฐานข้อมูล PostgreSQL แยกตาราง Raw และ Cleaned เขียนสคริปต์ ingest.py นำเข้าข้อมูลกว่า 5.7 ล้านแถว และแก้ปัญหาหน่วยความจำเต็มด้วยเทคนิค In-Database SQL Cleaning จนได้ตารางข้อมูลพร้อมใช้งาน 4 ตารางส่งต่อให้ทีม EDA และ ML
- Student Project Management Database System (วิชา Databases AIE313, 2026) ใช้ PostgreSQL, Supabase, SQL Triggers: ออกแบบระบบฐานข้อมูลจัดการโครงการนักศึกษาบน Supabase ครบ 23 ตาราง และ 10 Views ครอบคลุมระบบโครงการ งบประมาณ จองสถานที่ ยืมอุปกรณ์ และใบลา พร้อมเขียน SQL Triggers 4 ระบบหลักป้องกันการจองซ้อนทับ เช็กยอดอุปกรณ์คงเหลือ และสร้างคำขอซื้ออัตโนมัติ
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

// จำกัดความยาวคำถาม กันข้อความยาวผิดปกติไปถึง Gemini และฐานข้อมูล
const MAX_MESSAGE_LENGTH = 1000;

// จำกัดจำนวน request ต่อ IP ต่อนาที กันคนยิง BE ตรง ๆ รัว ๆ จนโควตา Gemini หมดและตาราง chat_history โตไม่หยุด
// IP จริงอยู่ใน CF-Connecting-IP ที่ Cloudflare หน้า Render ใส่มาให้ ถ้าไม่มี (รันในเครื่อง/test) ใช้ IP ที่ต่อเข้ามา
// คำถามจากหน้าเว็บมาผ่าน nginx ของ FE จึงนับรวมเป็น IP ของ FE ค่าที่นี่จึงตั้งสูงกว่า
// ส่วนการจำกัดรายคนของคนที่ใช้หน้าเว็บอยู่ที่ nginx ของ FE (CHAT_RATE_PER_MIN)
const RATE_LIMIT_PER_MINUTE = Number(process.env.RATE_LIMIT_PER_MINUTE) || 60;
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: RATE_LIMIT_PER_MINUTE,
  standardHeaders: 'draft-8', // ส่ง header RateLimit บอกโควตาที่เหลือ
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.get('cf-connecting-ip') || req.socket.remoteAddress || 'unknown'),
  // ตั้งใจไม่ใช้ X-Forwarded-For (ผู้ใช้เติมค่าปลอมเองได้) จึงปิดคำเตือนของ library เรื่อง header นี้
  validate: { xForwardedForHeader: false },
  message: { error: 'ส่งข้อความถี่เกินไป รอสักครู่แล้วลองใหม่นะ' },
});

app.post('/api/chat', chatLimiter, async (req, res) => {
  // req.body เป็น undefined ได้ถ้าไม่ได้ส่งมาเป็น JSON และ message ต้องเป็นข้อความเท่านั้น
  const raw = req.body?.message;
  const message = typeof raw === 'string' ? raw.trim() : '';
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ error: `ข้อความยาวเกินไป (สูงสุด ${MAX_MESSAGE_LENGTH} ตัวอักษร)` });
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