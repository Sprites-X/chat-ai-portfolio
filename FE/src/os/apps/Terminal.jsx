import { useEffect, useRef, useState } from 'react';
import { MEMBERS } from '../../data/team.js';
import { sendWithRetry, errorText, postChatOnce } from '../../api.js';
import { APP, APPS } from '../appList.js';
import { useOs } from '../osContext.js';
import { listFiles, readFile, latestCommits, latestRun, fileInfo, ACTIONS_URL, COMMITS_URL } from '../github.js';

const CHIPS = ['help', 'ls', 'cat BE/.env.example', 'curl -X POST /api/chat -d {"message":"ใครดูแล CI/CD?"}', 'npm test', 'git log', 'neofetch'];
const CHIP_LABEL = { 'curl -X POST /api/chat -d {"message":"ใครดูแล CI/CD?"}': 'curl /api/chat', 'cat BE/.env.example': 'cat .env.example' };
const APP_ALIAS = { pipeline: 'pipe', terminal: 'term', database: 'db', system: 'sys', settings: 'set' };
const plain = (t) => t.replace(/\*\*/g, '').replace(/^#+\s*/gm, '');

const HELP = `คำสั่งที่ใช้ได้
  ls [โฟลเดอร์]     ดูไฟล์ใน repo (ดึงจาก GitHub)
  tree               ดูไฟล์ทั้งหมด
  cat <ไฟล์>         อ่านไฟล์ เช่น cat BE/Dockerfile
  curl /api/chat     ยิง API จริง (ใส่ -X POST -d {"message":"..."} เพื่อถาม)
  ask <คำถาม>        ถาม AI จริงแบบสั้น
  npm test           ดูชื่อ test ของ BE และผลรันล่าสุดบน GitHub Actions
  git log            commit ล่าสุดบน main
  open <แอป>         เปิดแอป เช่น open files
  neofetch · whoami · team · date · history · clear · exit`;

export default function Terminal() {
  const { addRow, openApp, closeApp, termCmd, focused, phone } = useOs();
  const [lines, setLines] = useState([
    { t: 'ByteMind OS terminal', c: 'ok' },
    { t: 'ไฟล์, commit และ /api/chat เป็นของจริง พิมพ์ help หรือกดคำสั่งลัดด้านล่าง', c: 'dim' },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const history = useRef([]);
  const hi = useRef(0);
  const outRef = useRef(null);
  const inRef = useRef(null);
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);

  useEffect(() => {
    if (outRef.current) outRef.current.scrollTop = outRef.current.scrollHeight;
  }, [lines]);
  useEffect(() => {
    if (focused === 'term' && !phone) inRef.current?.focus();
  }, [focused, phone]);
  useEffect(() => {
    if (termCmd) run(termCmd.cmd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [termCmd]);

  const print = (t, c) => alive.current && setLines((l) => [...l, typeof t === 'string' ? { t, c } : t]);

  async function findFile(arg) {
    if (!arg) return { err: 'ใส่ชื่อไฟล์ด้วย เช่น cat BE/.env.example' };
    const a = arg.replace(/^\.\//, '');
    const { files } = await listFiles();
    if (files.includes(a)) return { path: a };
    const m = files.filter((f) => f.endsWith('/' + a));
    if (m.length === 1) return { path: m[0] };
    if (m.length > 1) return { err: `มี ${a} หลายไฟล์: ${m.join('  ')}` };
    return { err: `cat: ${a}: ไม่มีไฟล์นี้ (ลอง ls หรือ tree)` };
  }

  async function cmdCat(arg) {
    const r = await findFile(arg);
    if (r.err) return print(r.err, 'bad');
    const info = fileInfo(r.path);
    if (info.kind !== 'text') return print(`${r.path}: ${info.kind === 'image' ? 'ไฟล์ภาพ' : 'ไฟล์ยาวมาก'} เปิดดูในแอป files ได้`, 'dim');
    try {
      const text = await readFile(r.path);
      const all = text.replace(/\n$/, '').split('\n');
      print(all.slice(0, 60).join('\n'));
      if (all.length > 60) print(`… อีก ${all.length - 60} บรรทัด · อ่านต่อใน files: open files`, 'dim');
    } catch (e) {
      print(`cat: โหลด ${r.path} จาก GitHub ไม่ได้ (${e.message})`, 'bad');
    }
  }

  async function cmdTest() {
    print('> cd BE && node --test', 'dim');
    try {
      const [a, s] = await Promise.all([readFile('BE/api.test.js'), readFile('BE/server.test.js')]);
      const names = [...`${a}\n${s}`.matchAll(/\b(?:it|test)\(\s*'([^']+)'/g)].map((m) => m[1]);
      names.forEach((n) => print('  • ' + n));
      print(`รวม ${names.length} test (ชื่อจากไฟล์ BE/*.test.js ใน repo)`, 'dim');
    } catch (e) {
      print(`อ่านไฟล์ test จาก GitHub ไม่ได้ (${e.message})`, 'bad');
    }
    try {
      const run = await latestRun();
      if (run) print(`รันล่าสุดบน main: ${run.conclusion === 'success' ? '✔ ผ่าน' : run.conclusion || run.status} · ${run.title}`, run.conclusion === 'success' ? 'ok' : 'hl');
    } catch {
      print(`ดูผลรันจริงได้ที่ ${ACTIONS_URL}`, 'dim');
    }
  }

  async function cmdGitLog() {
    try {
      const commits = await latestCommits(10);
      commits.forEach((c) => print({ parts: [{ t: c.sha, c: 'hl' }, { t: ' ' + c.msg }] }));
    } catch {
      print(`ดึง commit จาก GitHub ไม่ได้ตอนนี้ ดูได้ที่ ${COMMITS_URL}`, 'dim');
    }
  }

  async function cmdCurl(arg) {
    const isPost = /-X\s*POST/i.test(arg) || /(^|\s)-d\s/.test(arg);
    const url = (arg.match(/(?:^|\s)(\S*\/api\/\S*|\/\S*)/) || [])[1] || '';
    const path = url.replace(/^https?:\/\/[^/]+/, '');
    if (!path.startsWith('/api/chat')) return print('curl: ในเครื่องนี้ยิงได้แค่ /api/chat', 'dim');
    if (!isPost) {
      // ยิง GET จริง: Express ตอบ 404 เพราะ route นี้รับเฉพาะ POST
      try {
        const r = await fetch('/api/chat');
        const text = (await r.text()).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        print(`HTTP ${r.status}`, r.ok ? 'ok' : 'bad');
        print(text.slice(0, 200) || '(ไม่มีเนื้อหา)');
      } catch (e) {
        print(`curl: ${e.message}`, 'bad');
      }
      return undefined;
    }
    let body = {};
    const j = arg.match(/\{.*\}/);
    if (j) {
      try {
        body = JSON.parse(j[0]);
      } catch {
        return print('curl: JSON ใน -d ไม่ถูกต้อง เช่น -d {"message":"สวัสดี"}', 'bad');
      }
    }
    print('…', 'dim');
    const res = await postChatOnce(body);
    setLines((l) => l.slice(0, -1));
    print(`HTTP ${res.status || 'error'}`, res.status === 200 ? 'ok' : 'bad');
    print(JSON.stringify(res.data));
    if (res.status === 200 && typeof res.data?.reply === 'string') {
      addRow(String(body.message).trim(), res.data.reply);
      print('BE บันทึกคำถามนี้ลง chat_history แล้ว · ดูแถวของรอบนี้ใน database', 'dim');
    } else if (res.status >= 500 || res.status === 0) {
      print('ถ้า BE เพิ่งหลับ ลองใหม่อีกครั้งในอีกสักครู่ (หรือใช้ ask ซึ่งส่งซ้ำให้เอง)', 'dim');
    }
    return undefined;
  }

  async function cmdAsk(q) {
    if (!q) return print('พิมพ์คำถามต่อท้าย เช่น ask ใครทำหน้าเว็บ', 'dim');
    print('ByteMind AI กำลังคิด…', 'dim');
    try {
      const reply = await sendWithRetry(q, (n) => print(`BE กำลังตื่น ลองใหม่ครั้งที่ ${n}/6…`, 'dim'));
      print(plain(reply));
      addRow(q, reply);
    } catch (e) {
      print(errorText(e), 'bad');
    }
    return undefined;
  }

  async function run(raw) {
    const line = (raw || '').trim();
    if (!line || busy) return;
    print({ t: line, c: 'cmd' });
    history.current.push(line);
    hi.current = history.current.length;
    const [cmd, ...rest] = line.split(/\s+/);
    const arg = rest.join(' ');
    const c = cmd.toLowerCase();
    setBusy(true);
    try {
      if (c === 'help') print(HELP);
      else if (c === 'ls') {
        const { files, live } = await listFiles();
        const base = (arg || '').replace(/^\.\/?/, '').replace(/\/$/, '');
        const pre = base ? base + '/' : '';
        const out = [...new Set(files.filter((f) => f.startsWith(pre)).map((f) => { const r = f.slice(pre.length).split('/'); return r.length > 1 ? r[0] + '/' : r[0]; }))];
        print(out.length ? out.join('   ') : `ls: ${arg}: ไม่มีโฟลเดอร์นี้`, out.length ? '' : 'bad');
        if (!live) print('(GitHub API ไม่ตอบ ใช้รายชื่อสำรอง)', 'dim');
      } else if (c === 'tree') print((await listFiles()).files.join('\n'));
      else if (c === 'cat' || c === 'less' || c === 'more') await cmdCat(arg);
      else if (c === 'npm' && /^(run\s+)?test$/.test(arg)) await cmdTest();
      else if (c === 'npm') print('ใช้ได้แค่ npm test ในเครื่องนี้', 'dim');
      else if (c === 'git' && /^log/.test(arg)) await cmdGitLog();
      else if (c === 'git' && /^push/.test(arg)) {
        print('remote: error: GH013: Repository rule violations found for refs/heads/main.', 'bad');
        print('remote: - Changes must be made through a pull request.', 'bad');
        print(' ! [remote rejected] main -> main', 'bad');
      } else if (c === 'git') print('ใช้ได้: git log · git push', 'dim');
      else if (c === 'curl') await cmdCurl(arg);
      else if (c === 'ask') await cmdAsk(arg);
      else if (c === 'open') {
        const k = APP_ALIAS[arg.toLowerCase()] || arg.toLowerCase();
        if (APP[k]) {
          print(`เปิด ${APP[k].name}`, 'dim');
          openApp(k);
        } else print('แอปที่มี: ' + APPS.map((a) => a.name).join(' '), 'dim');
      } else if (c === 'whoami') print('guest · กำลังดู portfolio ของ ByteMind');
      else if (c === 'team') print(MEMBERS.map((m) => `${m.name.padEnd(18)} ${m.role}`).join('\n'));
      else if (c === 'neofetch') {
        print(' ▄▄▄▄▄▄\n█  ◉   █  bytemind@os\n ▀▀▀▀▀▀', 'ok');
        print('OS        ByteMind OS 1.0\nFrontend  React 19 + Vite 8 · Nginx\nBackend   Express 5 · Node 24\nAI        Gemini 3.8-flash → 3.5-flash-lite\nDatabase  Neon PostgreSQL · chat_history\nCI/CD     GitHub Actions → Render\nTeam      ' + MEMBERS.map((m) => m.name.split(' ')[0]).join(' · '));
      } else if (c === 'date') print(new Date().toLocaleString('th-TH', { dateStyle: 'full', timeStyle: 'short' }));
      else if (c === 'history') print(history.current.map((h, i) => `${String(i + 1).padStart(3)}  ${h}`).join('\n'));
      else if (c === 'clear' || c === 'cls') setLines([]);
      else if (c === 'exit') closeApp('term');
      else if (c === 'cd') print('repo นี้อ่านอย่างเดียว ใช้ ls หรือ cat แทนได้เลย', 'dim');
      else if (c === 'sudo' || (c === 'rm' && /-rf/.test(arg))) print('ทำไม่ได้ครับ main ถูกป้องกันด้วย Ruleset protect-main ต้องเปิด PR และผ่าน test ก่อนเสมอ', 'bad');
      else if (c === 'echo') print(arg);
      else print(`${cmd}: command not found · พิมพ์ help เพื่อดูคำสั่ง`, 'bad');
    } finally {
      if (alive.current) setBusy(false);
    }
  }

  const onKeyDown = (e) => {
    const h = history.current;
    if (e.key === 'ArrowUp' && h.length) {
      e.preventDefault();
      hi.current = Math.max(0, hi.current - 1);
      setInput(h[hi.current]);
    } else if (e.key === 'ArrowDown' && h.length) {
      e.preventDefault();
      hi.current = Math.min(h.length, hi.current + 1);
      setInput(h[hi.current] || '');
    }
  };

  return (
    <>
      <div className="term" ref={outRef} aria-live="polite" onClick={() => !phone && !window.getSelection().toString() && inRef.current?.focus()}>
        {lines.map((l, i) =>
          l.parts ? (
            <div key={i}>{l.parts.map((p, j) => <span key={j} className={p.c}>{p.t}</span>)}</div>
          ) : (
            <div key={i} className={l.c}>{l.t}</div>
          ),
        )}
        {busy && <div className="dim">…</div>}
      </div>
      <div className="term-chips" aria-label="คำสั่งลัด">
        {CHIPS.map((cmd) => (
          <button key={cmd} className="tchip" type="button" disabled={busy} onClick={() => run(cmd)}>{CHIP_LABEL[cmd] || cmd}</button>
        ))}
      </div>
      <form
        className="term-line"
        onSubmit={(e) => {
          e.preventDefault();
          const v = input;
          setInput('');
          run(v);
        }}
      >
        <label className="prompt" htmlFor="term-in">~/chat-ai-portfolio $</label>
        <input id="term-in" ref={inRef} type="text" value={input} autoComplete="off" autoCapitalize="off" spellCheck="false" enterKeyHint="send" onChange={(e) => setInput(e.target.value)} onKeyDown={onKeyDown} />
      </form>
    </>
  );
}
