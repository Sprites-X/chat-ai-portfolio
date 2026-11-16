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
    projects: [
      {
        id: 'po-invoice-automation',
        name: 'ระบบอ่านและประมวลผลเอกสาร PO / Invoice อัตโนมัติด้วย n8n และ Gemini AI',
        short: 'PO / Invoice AI',
        meta: 'งานเดี่ยว · 2026',
        url: 'https://kookkao-project.app.n8n.cloud/form/f4f0308e-14c6-4652-ad7e-4eb48516aeb0',
        stack: ['n8n', 'Gemini AI'],
        summary: 'ระบบรับและสกัดข้อมูลจากเอกสาร PO และ Invoice อัตโนมัติผ่าน Webform ด้วย AI',
        points: [
          'สร้าง Workflow อัตโนมัติบน n8n เพื่อรับไฟล์เอกสาร PO และ Invoice ผ่านหน้า Webform',
          'เชื่อมต่อ Gemini AI สำหรับอ่าน วิเคราะห์ และดึงข้อมูลสำคัญออกจากเอกสารอย่างแม่นยำ',
          'ลดขั้นตอนและเวลาในการคีย์ข้อมูลเอกสารด้วยตนเอง รวมถึงลดความผิดพลาดในการทำงาน',
        ],
      },
      {
        id: 'bu-spacehub',
        name: 'BU SpaceHub',
        short: 'BU SpaceHub',
        meta: 'งานกลุ่ม · 2026',
        stack: ['UI/UX', 'Figma'],
        summary: 'แพลตฟอร์มจัดการและจองพื้นที่การใช้งานภายในมหาวิทยาลัยกรุงเทพ',
        points: [
          'ออกแบบระบบและประสบการณ์ผู้ใช้งาน (UI/UX) เพื่ออำนวยความสะดวกในการค้นหาและจองพื้นที่',
          'รับผิดชอบหลักในส่วนการออกแบบ UI/UX Flow และโครงสร้างหน้าจอทั้งหมดของระบบ',
          'ช่วยให้ผู้ใช้งานเข้าถึงและจัดการพื้นที่ส่วนกลางได้ง่ายและเป็นระบบมากขึ้น',
        ],
      },
    ],
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
    // ผลงานส่วนตัว (นอกจากโปรเจกต์นี้) แสดงในห้อง, แอป team ของ OS และ Neural
    // สมาชิกคนอื่นเพิ่มได้ด้วยรูปแบบเดียวกัน (ใส่ในก้อนของตัวเอง: w, n หรือ p) แล้วเติมใน PORTFOLIO_CONTEXT ของ BE/index.js ด้วย AI จะได้ตอบได้
    // url ของ github.com ขึ้นป้าย "GitHub ↗" ลิงก์อื่นขึ้น "ลองใช้ ↗" (ตั้งป้ายเองได้ด้วย urlLabel)
    projects: [
      {
        id: 'yolo',
        name: 'YOLO Inference Optimization Benchmark',
        short: 'YOLO Benchmark',
        meta: 'งานเดี่ยว · 2026',
        url: 'https://github.com/Sprites-X/YOLO-Inference-Optimization',
        stack: ['Python', 'PyTorch', 'ONNX Runtime', 'TensorRT 10', 'CUDA'],
        summary: 'เร่งความเร็ว YOLOv8n บน RTX 5060 จน TensorRT FP16 ได้ 702 FPS เร็วกว่า PyTorch 2.6 เท่า โดยความแม่นยำเท่าเดิม',
        points: [
          'วัด YOLOv8n 7 แบบ ทั้ง PyTorch FP32, ONNX Runtime, TensorRT FP16 และ INT8 บน CPU และ RTX 5060 โดยเช็กผลของทุกแบบกับ PyTorch ก่อนจับเวลา',
          'TensorRT FP16 ได้ 702 FPS เร็วกว่า PyTorch บน GPU เดียวกัน 2.60 เท่า mAP50-95 เท่าเดิม และใช้ profiling รายเลเยอร์อธิบายว่าทำไม INT8 ทั้งช้ากว่าและแม่นน้อยกว่าบนโมเดลนี้',
          'ไล่หาสาเหตุที่ mAP วัดได้ 0.365 ไม่ตรงกับ 0.373 ที่ Ultralytics ประกาศ จนพบว่ามาจาก NMS ที่เลือก label เดียวต่อกล่อง',
          'ล็อกเวอร์ชัน dependency และเพิ่มขั้นตรวจ environment ก่อนรัน หลังแก้ปัญหา CUDA, TensorRT และ PYTHONPATH ชนกัน',
        ],
      },
      {
        id: 'erp',
        name: 'ERP Helpdesk Agent',
        short: 'ERP Helpdesk Agent',
        meta: 'งานเดี่ยว · 2026',
        url: 'https://github.com/Sprites-X/erp-helpdesk-agent',
        stack: ['Python', 'LangGraph', 'ChromaDB', 'Ollama', 'pytest', 'GitHub Actions'],
        summary: 'ผู้ช่วย helpdesk ภาษาไทยแบบหลาย agent รันบนเครื่องตัวเอง ตอบจากคู่มือ ERP พร้อมประโยคหลักฐาน หรือเปิด ticket แทนการเดา',
        points: [
          'ตอบคำถามการใช้โปรแกรม ERP จากคู่มือพร้อมยกประโยคหลักฐาน ถ้าคู่มือไม่มีคำตอบจะเปิด ticket ที่สรุปปัญหาไว้ให้ทีม support',
          'ตัดสินใจถูก 19 จาก 20 ข้อกับคำถามที่ระบบไม่เคยเห็น และไม่เคยตอบข้อที่ควรเปิด ticket โค้ดตรวจทุกครั้งว่าประโยคหลักฐานมีอยู่จริงในคู่มือ',
          'ลดเวลาตอบจาก 10.7 เหลือ 2.8 วินาที โดยจับเวลาแยกทีละขั้นจนพบว่า localhost บน Windows เสียเวลาไปกับ IPv6 มี unit test 76 ข้อรันใน CI',
        ],
      },
      {
        id: 'tb3',
        name: 'TurtleBot3 Person Detection',
        short: 'TurtleBot3',
        meta: 'งานกลุ่ม 3 คน · วิชา Robotics · 2026',
        stack: ['ROS 2 Humble', 'Python', 'YOLO', 'TurtleBot3 (simulation)'],
        summary: 'หุ่น TurtleBot3 ในซิมเรียก service ตรวจจับคนด้วย YOLO ทุก 0.5 เมตรที่เดิน แล้วบันทึกผลพร้อมตำแหน่ง',
        points: [
          'หุ่น TurtleBot3 ในซิมเรียก ROS 2 service ตรวจจับคนด้วย YOLO ทุกครั้งที่เดินครบ 0.5 เมตร และบันทึกผลพร้อมตำแหน่งของหุ่น',
          'หน้าที่ของพงศกร: เขียน node นับระยะทางจาก odometry (subscribe /odom สะสมระยะทาง แล้วเรียก service) และวางแผนงานของทั้งโปรเจกต์',
        ],
      },
    ],
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
