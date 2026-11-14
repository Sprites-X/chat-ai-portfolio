// แอปทั้งหมดใน ByteMind OS: ชื่อ, ไอคอน, สีแถบหน้าต่าง และคำอธิบายในหน้ารวมแอป
// dock: true = โชว์ใน dock บนมือถือ (ที่เหลือเปิดจากปุ่ม ⊞)
export const APPS = [
  { key: 'about', name: 'about', title: 'about.app', ico: '.app', color: 'var(--c-about)', desc: 'แนะนำโปรเจกต์', dock: true },
  { key: 'team', name: 'team', title: 'team — 3 members', ico: '3', color: 'var(--c-team)', desc: 'สมาชิก 3 คน', dock: true },
  { key: 'pipe', name: 'pipeline', title: 'pipeline — ci-cd.yml', ico: 'CI', color: 'var(--c-pipe)', desc: 'จำลอง CI/CD' },
  { key: 'chat', name: 'chat', title: 'chat — ByteMind AI', ico: 'AI', color: 'var(--c-chat)', desc: 'คุยกับ AI', dock: true },
  { key: 'contact', name: 'contact', title: 'contact.txt', ico: '.txt', color: 'var(--c-contact)', desc: 'ช่องทางติดต่อ' },
  { key: 'term', name: 'terminal', title: 'terminal — bytemind@os', ico: '>_', color: 'var(--c-term)', icoStyle: { background: '#16132E', color: 'var(--c-term)' }, desc: 'พิมพ์คำสั่ง', dock: true },
  { key: 'files', name: 'files', title: 'files — chat-ai-portfolio', ico: '/', color: 'var(--c-files)', desc: 'ไฟล์ใน repo' },
  { key: 'db', name: 'database', title: 'database — chat_history', ico: 'SQL', color: 'var(--c-db)', desc: 'ตาราง chat_history' },
  { key: 'sys', name: 'system', title: 'system — เส้นทางของคำถาม', ico: '⇄', color: 'var(--c-sys)', icoStyle: { fontSize: 18 }, desc: 'เส้นทางคำถาม' },
  { key: 'set', name: 'settings', title: 'settings', ico: '⚙', color: 'var(--c-set)', icoStyle: { fontSize: 20 }, desc: 'วอลเปเปอร์' },
];

export const APP = Object.fromEntries(APPS.map((a) => [a.key, a]));

export const WALLPAPERS = { indigo: ['#221C52', 'คราม'], midnight: ['#101631', 'กลางคืน'], plum: ['#3B1B47', 'พลัม'], forest: ['#12352F', 'ป่าสน'] };
