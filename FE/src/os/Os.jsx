import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link } from '../Link.jsx';
import { REPO_URL } from '../data/team.js';
import { useMedia, useReducedMotion, storage } from '../hooks.js';
import { APPS, APP, WALLPAPERS } from './appList.js';
import { OsContext } from './osContext.js';
import { useChat } from './useChat.js';
import Window from './Window.jsx';
import About from './apps/About.jsx';
import Team from './apps/Team.jsx';
import Pipeline from './apps/Pipeline.jsx';
import Chat, { ChatClearButton } from './apps/Chat.jsx';
import Contact from './apps/Contact.jsx';
import Terminal from './apps/Terminal.jsx';
import Files from './apps/Files.jsx';
import Database from './apps/Database.jsx';
import System from './apps/System.jsx';
import Settings from './apps/Settings.jsx';
import './os.css';

const BODY = { about: About, team: Team, pipe: Pipeline, chat: Chat, contact: Contact, term: Terminal, files: Files, db: Database, sys: System, set: Settings };
const BODY_CLASS = { chat: 'chat-body', term: 'term-body', files: 'files-body' };

const BOOT_LINES = [
  ['', 'ByteMind OS 1.0 · AIE312'],
  ['ok', 'mount /team ............ 3 members'],
  ['ok', 'start frontend ......... React + Vite'],
  ['ok', 'start backend .......... Express /api/chat'],
  ['ok', 'link ai ................ Gemini'],
  ['ok', 'connect database ....... Neon PostgreSQL'],
  ['ok', 'pipeline ............... GitHub Actions → Render'],
  ['ok', 'install apps ........... terminal, files, database, system'],
  ['', 'ยินดีต้อนรับสู่ ByteMind'],
];

// หน้าจอบูตตอนเปิดเครื่อง (ครั้งแรกของแต่ละแท็บ กดข้ามได้)
function Boot({ onDone }) {
  const [shown, setShown] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const finish = useCallback(() => {
    setLeaving(true);
    setTimeout(onDone, 560);
  }, [onDone]);
  useEffect(() => {
    const timers = BOOT_LINES.map((_, i) => setTimeout(() => setShown(i + 1), 180 + i * 260));
    timers.push(setTimeout(finish, 180 + BOOT_LINES.length * 260 + 450));
    const onKey = (e) => ['Escape', 'Enter', ' '].includes(e.key) && finish();
    window.addEventListener('keydown', onKey);
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener('keydown', onKey);
    };
  }, [finish]);
  return (
    <div id="boot" className={leaving ? 'off' : undefined} role="status" aria-label="กำลังเปิด ByteMind OS">
      <button className="boot-skip" type="button" onClick={finish}>ข้าม</button>
      <div className="boot-box">
        <div className="boot-logo"><span className="os-mark" aria-hidden="true" />ByteMind OS</div>
        <div className="bar" aria-hidden="true"><i style={{ width: `${Math.round((shown / BOOT_LINES.length) * 100)}%` }} /></div>
        <pre className="boot-log">
          {BOOT_LINES.slice(0, shown).map(([cls, text]) => (
            <span key={text}>{cls === 'ok' && <span className="ok">[ OK ] </span>}{text + '\n'}</span>
          ))}
        </pre>
      </div>
    </div>
  );
}

function Clock() {
  const fmt = () => new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  const [t, setT] = useState(fmt);
  useEffect(() => {
    const id = setInterval(() => setT(fmt()), 15000);
    return () => clearInterval(id);
  }, []);
  return <span className="clock">{t}</span>;
}

export default function Os({ query }) {
  const phone = useMedia('(max-width: 760px)');
  const reduce = useReducedMotion();
  const rootRef = useRef(null);
  const desktopRef = useRef(null);
  const iconsRef = useRef(null);

  const startApp = APP[query?.get('app')] ? query.get('app') : null;
  const [open, setOpen] = useState(() => ({ about: true, team: true, chat: true, ...(startApp ? { [startApp]: true } : {}) }));
  const [active, setActive] = useState(startApp || 'about'); // แอปที่โชว์อยู่บนมือถือ
  const [focused, setFocused] = useState(startApp || 'chat');
  const zTop = useRef(10);
  const [z, setZ] = useState(() => ({ team: 2, about: 3, chat: 4, ...(startApp ? { [startApp]: 5 } : {}) }));
  const [geo, setGeo] = useState({});
  const [booting, setBooting] = useState(() => !reduce && window.sessionStorage?.getItem('bytemind-booted') !== '1');
  const [launcher, setLauncher] = useState(false);
  const [toast, setToast] = useState('');
  const [wall, setWallState] = useState(() => (WALLPAPERS[storage.get('bytemind-os-wall')] ? storage.get('bytemind-os-wall') : 'indigo'));
  const [rows, setRows] = useState([]); // แถว chat_history ที่ส่งจากเครื่องนี้ในรอบนี้
  const [filePath, setFilePath] = useState('BE/index.js');
  const [termCmd, setTermCmd] = useState(null);

  const showToast = useCallback((m) => setToast(m), []);
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(''), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const endBoot = useCallback(() => {
    setBooting(false);
    try {
      window.sessionStorage.setItem('bytemind-booted', '1');
    } catch {
      /* ไม่จำก็ได้ */
    }
  }, []);

  // ---------- จัดการหน้าต่าง ----------
  const focus = useCallback((key) => {
    zTop.current += 1;
    const top = zTop.current;
    setZ((v) => ({ ...v, [key]: top }));
    setFocused(key);
  }, []);
  const openApp = useCallback(
    (key) => {
      setOpen((o) => ({ ...o, [key]: true }));
      focus(key);
      setActive(key);
      setLauncher(false);
      if (window.matchMedia('(max-width: 760px)').matches) rootRef.current?.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    },
    [focus, reduce],
  );
  const closeApp = useCallback((key) => setOpen((o) => ({ ...o, [key]: false })), []);
  const minApp = useCallback(
    (key) => {
      closeApp(key);
      showToast('ย่อไว้ใน dock แล้ว');
    },
    [closeApp, showToast],
  );
  const moveApp = useCallback((key, x, y) => setGeo((g) => ({ ...g, [key]: { ...g[key], x, y } })), []);

  // ตำแหน่งเริ่มต้นของทุกหน้าต่างบนจอคอม (คำนวณจากขนาดเดสก์ท็อป)
  const layout = useCallback(() => {
    if (!desktopRef.current || window.matchMedia('(max-width: 760px)').matches) return;
    const dr = desktopRef.current.getBoundingClientRect();
    const W = dr.width, H = dr.height;
    const L = Math.round(iconsRef.current.getBoundingClientRect().right - dr.left) + 16;
    const colW = Math.min(500, (W - L - 60) * 0.48);
    const chatW = Math.min(470, W - L - colW - 50);
    const R = W - L - 30;
    const teamY = Math.min(300, H * 0.42);
    setGeo({
      about: { x: L, y: 24, w: colW, h: Math.min(470, H * 0.6) },
      team: { x: L + 40, y: teamY, w: colW, h: Math.max(320, H - teamY - 104) },
      chat: { x: Math.max(L + colW + 30, W - chatW - 36), y: 70, w: chatW, h: Math.max(360, H - 180) },
      pipe: { x: L + colW * 0.5, y: 50, w: Math.min(520, W - L - 40), h: Math.min(560, H - 130) },
      contact: { x: W * 0.45, y: H * 0.3, w: Math.min(460, W - 40), h: 0 },
      term: { x: L + 70, y: Math.min(110, H * 0.14), w: Math.min(660, R), h: Math.min(440, H - 150) },
      files: { x: L + 30, y: 30, w: Math.min(880, R), h: Math.min(580, H - 120) },
      db: { x: L + 110, y: Math.min(90, H * 0.1), w: Math.min(720, R), h: Math.min(480, H - 140) },
      sys: { x: L + 20, y: 24, w: Math.min(900, R), h: 0 },
      set: { x: Math.max(L, W - 430), y: 60, w: Math.min(400, R), h: 0 },
    });
  }, []);
  useLayoutEffect(() => {
    layout();
    let t = 0;
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(layout, 150);
    };
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', onResize);
    };
  }, [layout, phone]);
  const tile = useCallback(() => {
    setOpen((o) => ({ ...o, about: true, team: true, chat: true }));
    layout();
    ['team', 'about', 'chat'].forEach(focus);
  }, [layout, focus]);
  const reboot = useCallback(() => !reduce && setBooting(true), [reduce]);
  const setWall = useCallback((k) => {
    setWallState(k);
    storage.set('bytemind-os-wall', k);
  }, []);

  // ---------- แชต + ฐานข้อมูลของรอบนี้ ----------
  const addRow = useCallback((q, a) => setRows((r) => [...r, { id: r.length + 1, user_message: q, ai_response: a, created_at: new Date() }]), []);
  const chat = useChat({ onAnswer: addRow });
  const ask = useCallback(
    (q) => {
      openApp('chat');
      chat.send(q);
    },
    [openApp, chat],
  );
  const openFile = useCallback(
    (path) => {
      setFilePath(path);
      openApp('files');
    },
    [openApp],
  );
  const runInTerminal = useCallback(
    (cmd) => {
      setTermCmd({ cmd, at: Date.now() });
      openApp('term');
    },
    [openApp],
  );

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setLauncher(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const ctx = useMemo(
    () => ({ phone, reduce, openApp, closeApp, ask, chat, rows, addRow, showToast, tile, reboot, wall, setWall, filePath, openFile, termCmd, runInTerminal, focused }),
    [phone, reduce, openApp, closeApp, ask, chat, rows, addRow, showToast, tile, reboot, wall, setWall, filePath, openFile, termCmd, runInTerminal, focused],
  );

  const dockClick = (key) => {
    if (!phone && open[key] && focused === key) closeApp(key);
    else openApp(key);
  };

  return (
    <OsContext.Provider value={ctx}>
      <div className="os" ref={rootRef} style={{ '--desk': WALLPAPERS[wall][0] }}>
        {booting && <Boot onDone={endBoot} />}

        <div className="menubar">
          <div className="mb-left">
            <Link className="mb-btn" to="/">← ห้อง</Link>
            <button className="mb-btn mb-brand" type="button" onClick={() => setLauncher(true)} aria-haspopup="dialog">
              <span className="os-mark" aria-hidden="true" />ByteMind OS
            </button>
            <button className="mb-btn hide-m" type="button" onClick={tile}>จัดหน้าต่าง</button>
            <button className="mb-btn hide-m" type="button" onClick={reboot}>รีบูต</button>
          </div>
          <div className="mb-right">
            <a className="mb-btn" href={REPO_URL} target="_blank" rel="noopener">GitHub ↗</a>
            <Clock />
          </div>
        </div>

        <main className="desktop" ref={desktopRef}>
          <div className="wallpaper" aria-hidden="true">Byte<br />Mind</div>
          <aside className="sticky-note"><strong>วิธีใช้เครื่องนี้</strong>ลากแถบสีบนหน้าต่างเพื่อย้าย กดไอคอนทางซ้ายหรือใน dock ด้านล่างเพื่อเปิดแอป แชตคุยกับ AI ของจริง</aside>
          <nav className="icons" ref={iconsRef} aria-label="แอปบนเดสก์ท็อป">
            {APPS.map((a) => (
              <button key={a.key} className="dicon" type="button" onClick={() => openApp(a.key)}>
                <span className="ico" style={{ background: a.color, ...a.icoStyle }}>{a.ico}</span>
                {a.name}
              </button>
            ))}
          </nav>

          {APPS.map((a) => {
            const Body = BODY[a.key];
            return (
              <Window
                key={a.key}
                app={a}
                geo={geo[a.key]}
                z={z[a.key] || 1}
                focused={focused === a.key}
                hidden={phone ? active !== a.key : !open[a.key]}
                active={active === a.key}
                phone={phone}
                desktopRef={desktopRef}
                onFocus={focus}
                onClose={closeApp}
                onMin={minApp}
                onMove={moveApp}
                bodyClass={BODY_CLASS[a.key]}
                barExtra={a.key === 'chat' ? <ChatClearButton /> : null}
              >
                <Body />
              </Window>
            );
          })}
        </main>

        <nav className="dock" aria-label="Dock">
          {APPS.map((a) => (
            <button key={a.key} className={'dk' + (a.dock ? '' : ' dk-extra') + (open[a.key] ? ' open' : '')} type="button" style={{ background: a.color, ...a.icoStyle }} onClick={() => dockClick(a.key)}>
              {a.ico}
              <span className="tip">{a.name}</span>
            </button>
          ))}
          <button className="dk dk-home" type="button" style={{ background: '#FFFFFF' }} aria-label="แอปทั้งหมด" aria-haspopup="dialog" onClick={() => setLauncher((v) => !v)}>⊞</button>
        </nav>

        {launcher && (
          <div className="launcher" role="dialog" aria-modal="true" aria-labelledby="launcher-title" onClick={(e) => e.target === e.currentTarget && setLauncher(false)}>
            <div className="launcher-box">
              <div className="launcher-head">
                <h2 id="launcher-title">แอปทั้งหมด</h2>
                <button className="wbtn" type="button" aria-label="ปิด" onClick={() => setLauncher(false)}>×</button>
              </div>
              <div className="launcher-grid">
                {APPS.map((a, i) => (
                  <button key={a.key} className="ltile" type="button" autoFocus={i === 0} onClick={() => openApp(a.key)}>
                    <span className="ico" style={{ background: a.color, ...a.icoStyle }}>{a.ico}</span>
                    <b>{a.name}</b>
                    <small>{a.desc}</small>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {toast && <div className="toast" role="status">{toast}</div>}
      </div>
    </OsContext.Provider>
  );
}
