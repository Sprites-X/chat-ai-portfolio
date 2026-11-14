import { useEffect, useRef, useState } from 'react';
import { useOs } from '../osContext.js';

// ภาพอธิบายว่าคำถามหนึ่งข้อวิ่งผ่านส่วนไหนของระบบ (เป็นภาพจำลอง ไม่ได้ยิง API)
// แต่ละขั้นอ้างโค้ดจริง: FE/src/api.js → FE/nginx/default.conf.template → BE/index.js
const NODES = [
  { id: 'user', title: 'ผู้ใช้', sub: 'เบราว์เซอร์', who: 'เปิดแอป chat', app: 'chat' },
  { id: 'fe', title: 'React', sub: 'FE · axios.post', who: 'วรรณพร', file: 'FE/src/api.js' },
  { id: 'nginx', title: 'Nginx', sub: '/api/ → BE_URL', who: 'พงศกร', file: 'FE/nginx/default.conf.template' },
  { id: 'be', title: 'Express', sub: 'POST /api/chat', who: 'ณัฐนิชา', file: 'BE/index.js' },
];
const SIDE = [
  { id: 'gemini', title: 'Gemini', sub: '3.8-flash → 3.5-flash-lite', file: 'BE/index.js' },
  { id: 'db', title: 'Neon PostgreSQL', sub: 'chat_history', app: 'db' },
];

export default function System() {
  const { openApp, openFile, ask } = useOs();
  const [q, setQ] = useState('ใครดูแล CI/CD?');
  const [scenario, setScenario] = useState('ok');
  const [on, setOn] = useState(null); // กล่องที่กำลังไฮไลต์
  const [arrow, setArrow] = useState(0); // ลูกศรที่ไฮไลต์ถึง (1–4)
  const [err, setErr] = useState([]); // กล่องที่ error
  const [log, setLog] = useState([{ t: 'กด "ส่งคำถาม" เพื่อเริ่ม', c: 'dim' }]);
  const [running, setRunning] = useState(false);
  const [sent, setSent] = useState('');
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);

  const pause = (ms) => new Promise((r) => setTimeout(r, ms));
  const say = (t, c) => alive.current && setLog((l) => [...l, { t, c }]);
  const lit = (n, a) => {
    if (!alive.current) return;
    setOn(n);
    setArrow(a);
  };
  async function step(n, a, t, c, ms = 700) {
    lit(n, a);
    say(t, c);
    await pause(ms);
  }
  async function back(ok) {
    lit('nginx', 3);
    await pause(260);
    lit('fe', 2);
    await pause(260);
    lit('user', 1);
    say(ok ? 'FE     แสดงคำตอบในหน้าแชต' : 'FE     แสดงข้อความ error ในหน้าแชต', ok ? 'ok' : 'bad');
  }

  async function run() {
    if (running) return;
    setRunning(true);
    setErr([]);
    setLog([]);
    setSent('');
    const question = scenario === 'empty' ? '' : q.trim() || 'ใครดูแล CI/CD?';
    await step('user', 0, question ? `ผู้ใช้  พิมพ์ "${question}"` : 'ผู้ใช้  ส่ง message ว่าง (เช่นยิง curl มาตรง ๆ)');
    await step('fe', 1, "FE     axios.post('/api/chat', { message })");
    await step('nginx', 2, 'Nginx  location /api/ → proxy_pass ${BE_URL}');
    await step('be', 3, "BE     app.post('/api/chat') ตรวจว่า message เป็นข้อความ ไม่ว่าง ไม่เกิน 1000 ตัว");
    if (scenario === 'empty') {
      setErr(['be']);
      say('BE     ไม่มี message → 400 {"error":"Message is required"} · ไม่เรียก Gemini', 'bad');
      await pause(700);
      await back(false);
    } else {
      await step('gemini', 4, 'Gemini ลอง gemini-3.8-flash');
      if (scenario !== 'ok') {
        say('Gemini gemini-3.8-flash ตอบ 503 → ลองโมเดลถัดไป', 'bad');
        await pause(700);
        say('Gemini ลอง gemini-3.5-flash-lite');
        await pause(700);
      }
      if (scenario === 'busy') {
        setErr(['gemini']);
        say('Gemini gemini-3.5-flash-lite ตอบ 503 → หมดโมเดลให้ลอง', 'bad');
        await pause(600);
        lit('be', 3);
        say('BE     ส่ง 503 {"error":"AI มีผู้ใช้งานเยอะ ลองใหม่อีกครั้งนะ"} · ไม่บันทึกลงฐานข้อมูล', 'bad');
        await pause(700);
        await back(false);
      } else {
        say('Gemini ได้คำตอบ ✓', 'ok');
        await step('db', 4, 'Neon   INSERT INTO chat_history (user_message, ai_response)');
        say('Neon   บันทึกแล้ว ✓', 'ok');
        lit('be', 3);
        say('BE     res.json({ reply })');
        await pause(500);
        await back(true);
        if (alive.current) setSent(question);
      }
    }
    if (alive.current) setRunning(false);
  }

  const node = (n) => (
    <button
      key={n.id}
      className={'node' + (on === n.id ? ' on' : '') + (err.includes(n.id) ? ' err' : '')}
      type="button"
      onClick={() => (n.file ? openFile(n.file) : openApp(n.app))}
    >
      <b>{n.title}</b>
      <small>{n.sub}</small>
      {n.who && <span className="who">{n.who}</span>}
    </button>
  );

  return (
    <>
      <p>กดส่งแล้วดูว่าคำถามหนึ่งข้อวิ่งผ่านส่วนไหนของระบบบ้าง เลือกสถานการณ์เพื่อดูตอนที่ระบบสลับโมเดลหรือตอบ error กดที่กล่องเพื่อเปิดโค้ดของส่วนนั้น</p>
      <div className="sys-ctl">
        <label className="sr" htmlFor="sys-q">คำถาม</label>
        <input id="sys-q" type="text" value={q} autoComplete="off" onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && run()} />
        <label className="sr" htmlFor="sys-case">สถานการณ์</label>
        <select id="sys-case" value={scenario} onChange={(e) => setScenario(e.target.value)}>
          <option value="ok">ปกติ</option>
          <option value="fallback">โมเดลแรกไม่ว่าง → สลับโมเดล</option>
          <option value="busy">ทุกโมเดลไม่ว่าง → 503</option>
          <option value="empty">ส่ง message ว่าง → 400</option>
        </select>
        <button className="btn btn-solid" type="button" disabled={running} onClick={run}>ส่งคำถาม</button>
      </div>
      <div className="sys-wrap">
        <div className="sys">
          {NODES.map((n, i) => [node(n), <span key={'a' + i} className={'arr' + (arrow >= i + 1 ? ' on' : '')} aria-hidden="true" />])}
          <div className="sys-stack">{SIDE.map(node)}</div>
        </div>
      </div>
      <pre className="log" aria-live="polite">
        {log.map((l, i) => <span key={i} className={l.c}>{l.t + '\n'}</span>)}
      </pre>
      <p className="pf-role">
        ภาพนี้เป็นการจำลองเพื่ออธิบาย{' '}
        {sent && <button className="copy" type="button" onClick={() => ask(sent)}>ส่ง "{sent}" ให้ AI จริงในแอป chat</button>}
      </p>
    </>
  );
}
