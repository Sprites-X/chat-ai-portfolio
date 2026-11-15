import { useEffect, useRef, useState } from 'react';
import { Link } from '../Link.jsx';
import { PEOPLE, MEMBERS, PROJECT, REPO_URL } from '../data/team.js';
import { useReducedMotion, copyText } from '../hooks.js';
import { createNetwork, skillOwners, skillLabel, COL } from './network.js';
import './neural.css';

export default function Neural() {
  const canvasRef = useRef(null);
  const infoRef = useRef(null);
  const netRef = useRef(null);
  const reduce = useReducedMotion();
  const [selected, setSelected] = useState('core');
  const [textView, setTextView] = useState(false);
  const [toast, setToast] = useState('');

  // เลือกจุด: อัปเดตแผงข้อมูล แล้วยิงสัญญาณแสงไปหาจุดนั้น
  const select = (id, pulse = true) => {
    setSelected(id);
    if (pulse) netRef.current?.fireTo(id);
  };

  useEffect(() => {
    const narrow = () => window.matchMedia('(max-width: 980px)').matches;
    netRef.current = createNetwork(canvasRef.current, {
      leftBound: () => infoRef.current?.getBoundingClientRect().right ?? 0,
      narrow,
      reduce,
      onPick: (id) => select(id),
    });
    return () => netRef.current.destroy();
  }, [reduce]);

  useEffect(() => {
    netRef.current?.setSelected(selected);
  }, [selected]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setTextView(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(''), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  const copy = async (text) => setToast((await copyText(text)) ? `คัดลอก ${text} แล้ว` : 'คัดลอกไม่ได้ เลือกข้อความแล้วคัดลอกเองได้เลย');
  const back = (
    <div className="row">
      <button className="btn" type="button" onClick={() => select('core', false)}>← ดูทั้งกลุ่ม</button>
    </div>
  );

  let panel;
  if (PEOPLE[selected]) {
    const p = PEOPLE[selected];
    panel = (
      <>
        <p className="kicker">สมาชิก · {p.en}</p>
        <div className="who">
          <span className="dot" style={{ color: COL[p.key], background: COL[p.key], width: 16, height: 16 }} />
          <div>
            <h2>{p.name}</h2>
            <p className="role">{p.role}</p>
          </div>
        </div>
        <div className="chips">{p.skills.map((s) => <span key={s} className="chip">{s}</span>)}</div>
        <p>{p.work}</p>
        <p className="mail"><button className="copy" type="button" onClick={() => copy(p.email)}>{p.email}</button></p>
        {back}
      </>
    );
  } else if (selected === 'work') {
    panel = (
      <>
        <p className="kicker">ผลงานที่ทำร่วมกัน</p>
        <h2 className="title-xl" style={{ fontSize: 30 }}>{PROJECT.name}</h2>
        <p>{PROJECT.together}</p>
        <div className="chips">{PROJECT.stack.map((s) => <span key={s} className="chip">{s}</span>)}</div>
        <div className="row">
          <Link className="btn btn-hot" to="/os?app=chat">คุยกับ AI ใน OS</Link>
          <button className="btn" type="button" onClick={() => select('core', false)}>← ดูทั้งกลุ่ม</button>
        </div>
      </>
    );
  } else if (selected === 'contact') {
    panel = (
      <>
        <p className="kicker">ติดต่อกลุ่ม</p>
        <h2 className="title-xl" style={{ fontSize: 30 }}>คุยกับ ByteMind</h2>
        <p><a href={REPO_URL} target="_blank" rel="noopener">github.com/Sprites-X/chat-ai-portfolio</a></p>
        <p className="role">กดอีเมลเพื่อคัดลอก</p>
        {MEMBERS.map((m) => (
          <p key={m.key}>
            <span>{m.name}  </span>
            <button className="copy" type="button" onClick={() => copy(m.email)}>{m.email}</button>
          </p>
        ))}
        {back}
      </>
    );
  } else if (selected.startsWith('s:')) {
    panel = (
      <>
        <p className="kicker">ทักษะ</p>
        <h2 className="title-xl" style={{ fontSize: 30 }}>{skillLabel(selected)}</h2>
        <p className="role">ใช้โดย</p>
        <div className="mlist">
          {skillOwners(selected).map((id) => (
            <button key={id} className="mbtn" type="button" onClick={() => select(id)}>
              <span className="dot" style={{ color: COL[id], background: COL[id] }} />
              <span>{PEOPLE[id].name}</span>
            </button>
          ))}
        </div>
        {back}
      </>
    );
  } else {
    panel = (
      <>
        <p className="kicker">AIE312 · Chat AI Portfolio</p>
        <h1 className="title-xl">ByteMind</h1>
        <p>{PROJECT.intro}</p>
        <p className="kicker">สมาชิก</p>
        <div className="mlist">
          {MEMBERS.map((m) => (
            <button key={m.key} className="mbtn" type="button" onClick={() => select(m.key)}>
              <span className="dot" style={{ color: COL[m.key], background: COL[m.key] }} />
              <span>{m.name}<small>{m.role}</small></span>
            </button>
          ))}
        </div>
        <div className="row">
          <button className="btn" type="button" onClick={() => select('work')}>ผลงานร่วม</button>
          <button className="btn" type="button" onClick={() => select('contact')}>ติดต่อกลุ่ม</button>
        </div>
      </>
    );
  }

  return (
    <div className="nn">
      <div className="stage">
        <canvas id="net" ref={canvasRef} role="img" aria-label="แผนภาพเครือข่ายของกลุ่ม ByteMind ลากจุดได้ กดที่จุดเพื่อดูข้อมูล" />
      </div>

      <header className="top">
        <div className="brand"><span className="brain" aria-hidden="true" />ByteMind</div>
        <div className="top-actions">
          <Link className="pill" to="/room">← กลับห้อง</Link>
          <button className="pill" type="button" onClick={() => setTextView(true)}>ดูแบบข้อความ</button>
          <Link className="pill" to="/os?app=chat">คุยกับ AI</Link>
        </div>
      </header>

      <p className="hint glass" aria-hidden="true">ลากจุดเล่นได้ · กดที่จุดเพื่อดูข้อมูล</p>

      <aside className="panel glass" id="info" ref={infoRef} aria-live="polite">
        <div className="panel-body">{panel}</div>
      </aside>

      {textView && (
        <div id="textv" role="dialog" aria-modal="true" aria-labelledby="tv-title">
          <div className="tv">
            <button className="pill tv-close" type="button" autoFocus onClick={() => setTextView(false)}>ปิด</button>
            <section>
              <p className="kicker">แบบข้อความ</p>
              <h2 id="tv-title">ByteMind · {PROJECT.name}</h2>
              <p>{PROJECT.intro}</p>
            </section>
            <section>
              <h2>ผลงานที่ทำร่วมกัน: {PROJECT.name}</h2>
              <p>{PROJECT.together} ใช้ {PROJECT.stack.join(', ')}</p>
            </section>
            {MEMBERS.map((m) => (
              <section key={m.key}>
                <h2>{m.name} · {m.role}</h2>
                <p>ทักษะ: {m.skills.join(', ')}</p>
                <p>{m.work}</p>
                <p className="mail">{m.email}</p>
              </section>
            ))}
            <section>
              <h2>ติดต่อกลุ่ม</h2>
              <p><a href={REPO_URL} target="_blank" rel="noopener">github.com/Sprites-X/chat-ai-portfolio</a></p>
            </section>
          </div>
        </div>
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
