// อ่านไฟล์และ commit จาก repo จริงบน GitHub ตอนเปิดดู แอป files และ terminal จึงตรงกับ repo เสมอ
// GitHub API ให้คนที่ไม่ได้ล็อกอินเรียกได้ราว 60 ครั้ง/ชั่วโมง ถ้าเกินจะใช้รายชื่อไฟล์สำรองด้านล่างแทน
const OWNER = 'Sprites-X';
const REPO = 'chat-ai-portfolio';
const BRANCH = 'main';
const API = `https://api.github.com/repos/${OWNER}/${REPO}`;
const RAW = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/`;

export const BLOB_URL = `https://github.com/${OWNER}/${REPO}/blob/${BRANCH}/`;
export const ACTIONS_URL = `https://github.com/${OWNER}/${REPO}/actions`;
export const COMMITS_URL = `https://github.com/${OWNER}/${REPO}/commits/${BRANCH}`;

// รายชื่อไฟล์ ณ ตอนทำหน้านี้ ใช้เมื่อเรียก GitHub API ไม่ได้
export const FALLBACK_FILES = [
  ".github/workflows/ci-cd.yml",
  ".gitignore",
  "BE/.dockerignore",
  "BE/.env.example",
  "BE/Dockerfile",
  "BE/api.test.js",
  "BE/index.js",
  "BE/package-lock.json",
  "BE/package.json",
  "BE/server.test.js",
  "FE/.dockerignore",
  "FE/.gitignore",
  "FE/.oxlintrc.json",
  "FE/Dockerfile",
  "FE/index.html",
  "FE/nginx/default.conf.template",
  "FE/package-lock.json",
  "FE/package.json",
  "FE/public/favicon.svg",
  "FE/public/room/room-day.jpg",
  "FE/public/room/room-portrait-day.jpg",
  "FE/public/room/room-portrait.jpg",
  "FE/public/room/room.jpg",
  "FE/src/App.jsx",
  "FE/src/Link.jsx",
  "FE/src/api.js",
  "FE/src/data/team.js",
  "FE/src/hooks.js",
  "FE/src/index.css",
  "FE/src/main.jsx",
  "FE/src/neural/Neural.jsx",
  "FE/src/neural/network.js",
  "FE/src/neural/neural.css",
  "FE/src/os/Os.jsx",
  "FE/src/os/Window.jsx",
  "FE/src/os/appList.js",
  "FE/src/os/apps/About.jsx",
  "FE/src/os/apps/Chat.jsx",
  "FE/src/os/apps/Contact.jsx",
  "FE/src/os/apps/Database.jsx",
  "FE/src/os/apps/Files.jsx",
  "FE/src/os/apps/Pipeline.jsx",
  "FE/src/os/apps/Settings.jsx",
  "FE/src/os/apps/System.jsx",
  "FE/src/os/apps/Team.jsx",
  "FE/src/os/apps/Terminal.jsx",
  "FE/src/os/github.js",
  "FE/src/os/os.css",
  "FE/src/os/osContext.js",
  "FE/src/os/useChat.js",
  "FE/src/room/Room.jsx",
  "FE/src/room/room.css",
  "FE/src/room/roomData.json",
  "FE/src/room/scene.js",
  "FE/src/router.js",
  "FE/vite.config.js",
  "README.md"
];

const encodePath = (path) => path.split('/').map(encodeURIComponent).join('/');
export const rawUrl = (path) => RAW + encodePath(path);

let treePromise = null;
export function listFiles() {
  treePromise ||= fetch(`${API}/git/trees/${BRANCH}?recursive=1`)
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
    .then((j) => ({ live: true, files: j.tree.filter((t) => t.type === 'blob').map((t) => t.path) }))
    .catch(() => ({ live: false, files: FALLBACK_FILES }));
  return treePromise;
}

const contentCache = new Map();
export function readFile(path) {
  if (!contentCache.has(path)) {
    const p = fetch(rawUrl(path)).then((r) => (r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status}`))));
    p.catch(() => contentCache.delete(path));
    contentCache.set(path, p);
  }
  return contentCache.get(path);
}

export async function latestCommits(n = 10) {
  const r = await fetch(`${API}/commits?sha=${BRANCH}&per_page=${n}`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return (await r.json()).map((c) => ({ sha: c.sha.slice(0, 7), msg: c.commit.message.split('\n')[0] }));
}

export async function latestRun() {
  const r = await fetch(`${API}/actions/runs?branch=${BRANCH}&per_page=1`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const run = (await r.json()).workflow_runs?.[0];
  return run ? { status: run.status, conclusion: run.conclusion, title: run.display_title, url: run.html_url } : null;
}

// ไฟล์ไหนเป็นงานฝั่งใคร (ตามหน้าที่ของแต่ละคน) และอธิบายสั้น ๆ ว่าไฟล์ทำอะไร
const DESC = {
  '.github/workflows/ci-cd.yml': 'pipeline: detect → test → build → scan → deploy แยกสาย BE กับ FE',
  '.gitignore': 'ไฟล์ที่ไม่ขึ้น git เช่น node_modules และ .env',
  'README.md': 'วิธีรัน · env · API · test · CI/CD · deploy',
  'BE/.dockerignore': 'กันไม่ให้ .env, test และ node_modules ติดเข้า image',
  'BE/.env.example': 'ตัวอย่างค่าที่ BE ต้องใช้ ค่าจริงตั้งไว้บน Render ไม่อยู่ใน repo',
  'BE/Dockerfile': 'image ของ BE: node:24-alpine รันด้วย user ที่ไม่ใช่ root',
  'BE/index.js': 'Express /api/chat · ตรวจข้อความ · Gemini + สลับโมเดล · บันทึก chat_history',
  'BE/api.test.js': 'test: ไม่ส่ง message ต้องได้ 400',
  'BE/server.test.js': 'test API: เปิด server จริงแล้วยิง request',
  'BE/package.json': 'dependency ของ BE และคำสั่ง npm test / start',
  'FE/Dockerfile': 'build 2 ขั้น: Node build → nginx เสิร์ฟ',
  'FE/.dockerignore': 'กันไฟล์ที่ไม่จำเป็นออกจาก image ของ FE',
  'FE/nginx/default.conf.template': 'ส่ง /api/ ต่อไปที่ BE · ทุก path อื่นตอบ index.html',
  'FE/index.html': 'หน้า HTML หลักที่ React ไปเกาะ + ฟอนต์',
  'FE/package.json': 'dependency ของ FE: React, Vite, axios, react-markdown',
  'FE/src/main.jsx': 'จุดเริ่มของ React',
  'FE/src/App.jsx': 'เลือกหน้าตาม path: / ห้อง · /os · /neural',
  'FE/src/router.js': 'router เล็ก ๆ ด้วย History API ของเบราว์เซอร์',
  'FE/src/Link.jsx': 'ลิงก์ภายในแอป เปลี่ยนหน้าโดยไม่โหลดใหม่',
  'FE/src/api.js': 'เรียก POST /api/chat และส่งซ้ำเองตอน BE หลับ',
  'FE/src/hooks.js': 'hook ที่ใช้ร่วมกัน: ขนาดจอ, media query, localStorage',
  'FE/src/data/team.js': 'ข้อมูลสมาชิกที่ทุกหน้าใช้ร่วมกัน',
  'FE/src/room/Room.jsx': 'หน้าห้อง: กดของในภาพ สลับกลางวัน/กลางคืน ซูมเข้าคอม',
  'FE/src/room/scene.js': 'จุดกดและแผนที่วัตถุของภาพห้อง',
  'FE/src/room/roomData.json': 'ตำแหน่งของทุกชิ้นในภาพ (สร้างจากไฟล์ Blender)',
  'FE/src/os/Os.jsx': 'ByteMind OS: หน้าต่าง, dock, เมนู และสถานะที่แอปใช้ร่วมกัน',
  'FE/src/os/Window.jsx': 'กรอบหน้าต่าง ลากย้ายได้',
  'FE/src/os/useChat.js': 'สถานะแชต: ส่งคำถามไป BE แล้วเก็บคำตอบ',
  'FE/src/os/github.js': 'ดึงไฟล์และ commit จาก GitHub ให้แอป files กับ terminal',
  'FE/src/os/apps/Chat.jsx': 'แอปแชตที่คุยกับ AI ผ่าน BE จริง',
  'FE/src/os/apps/Terminal.jsx': 'terminal: ls, cat, curl /api/chat, git log ฯลฯ',
  'FE/src/neural/Neural.jsx': 'หน้าเครือข่ายทีม + แผงข้อมูล',
  'FE/src/neural/network.js': 'วาดเครือข่ายบน canvas ลากจุดได้',
};

export function fileInfo(path) {
  let own;
  if (path.startsWith('.github/') || /(^|\/)(Dockerfile|\.dockerignore)$/.test(path) || path.startsWith('FE/nginx/') || path === 'BE/server.test.js') own = 'DevOps · พงศกร';
  else if (path.startsWith('BE/')) own = 'BE · ณัฐนิชา';
  else if (path.startsWith('FE/')) own = 'FE · วรรณพร';
  else own = 'ทั้งกลุ่ม';
  const image = /\.(jpe?g|png|gif|webp|svg)$/i.test(path);
  const big = /(package-lock\.json|roomData\.json)$/.test(path);
  return { own, desc: DESC[path] || '', kind: image ? 'image' : big ? 'big' : 'text' };
}
