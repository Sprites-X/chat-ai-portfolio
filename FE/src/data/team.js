// ข้อมูลกลุ่มที่ทุกหน้าใช้ร่วมกัน แก้ที่นี่ที่เดียวแล้วห้อง, OS และ Neural เปลี่ยนตามหมด
export const REPO_URL = 'https://github.com/Sprites-X/chat-ai-portfolio';

export const PEOPLE = {
  w: {
    key: 'w',
    name: 'วรรณพร แก้วหาวงศ์',
    en: 'Wannaporn',
    role: 'Frontend Developer',
    skills: ['React', 'JavaScript', 'HTML/CSS', 'UI/UX', 'Component Design'],
    work: 'ทำหน้าเว็บ UI ทั้งหมด ทำปุ่ม ออกแบบการจัดวางคอมโพเนนต์ และทำหน้าแชตโต้ตอบให้ใช้ง่ายสบายตา',
    email: 'wannaporn.kaeo@bumail.net',
  },
  n: {
    key: 'n',
    name: 'ณัฐนิชา ภูสิงห์',
    en: 'Natnicha',
    role: 'Backend Developer',
    skills: ['Node.js', 'Express', 'Gemini API', 'Automated Testing (node:test)', 'RESTful API Design', 'Git/GitHub'],
    work: 'พัฒนาและดูแล Backend API /api/chat ทั้งหมด เชื่อมต่อ Gemini API เขียนระบบสลับโมเดลอัตโนมัติเมื่อเจอ 429/500/503 จัดการระบบตอบรับสำรอง และเขียน Unit Test ก่อนส่งโค้ดขึ้นระบบจริง',
    email: 'natnicha.phoo@bumail.net',
  },
  p: {
    key: 'p',
    name: 'พงศกร ศรีทอง',
    en: 'Phongsakon',
    role: 'DevOps Engineer',
    skills: ['Docker', 'Nginx', 'GitHub Actions (CI/CD)', 'Trivy', 'Render', 'Unit Test (node:test)', 'Git/GitHub'],
    work: 'สร้าง repo กลุ่มและวางโครง BE/FE ทำ Dockerfile และ Nginx Proxy เขียน pipeline GitHub Actions ให้ test → build → สแกนช่องโหว่ → deploy ขึ้น Render อัตโนมัติ (build เฉพาะฝั่งที่เปลี่ยน) เขียน test API ตั้งกฎป้องกัน main และดูแลค่าลับ',
    email: 'phongsakon.sith@bumail.net',
  },
};

export const MEMBERS = [PEOPLE.w, PEOPLE.n, PEOPLE.p];

export const PROJECT = {
  name: 'Chat AI Portfolio',
  intro:
    'เว็บ Portfolio ที่ไม่ได้มีแค่อ่านประวัติเฉย ๆ แต่ใส่ระบบแชต AI เข้าไปด้วย คนที่เข้ามาดูพิมพ์ถาม-ตอบเรื่องโปรเจกต์หรือข้อมูลสมาชิกในกลุ่มได้ตรง ๆ หลังบ้านเซ็ต CI/CD กับ Docker ไว้ ดันโค้ดแล้ว test ทันที',
  together: 'ช่วยกันตั้งแต่ขึ้นโครง UI, เขียน API ยิงหา AI, ทำเทส จนถึงเอาขึ้นระบบจริงบน Cloud',
  stack: ['React', 'Express', 'Gemini', 'PostgreSQL (Neon)', 'Docker', 'GitHub Actions', 'Render'],
};
