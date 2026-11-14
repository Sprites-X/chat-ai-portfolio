import { useRef, useState } from 'react';
import { MEMBERS } from '../../data/team.js';
import { useOs } from '../osContext.js';

const AVATAR = { w: 'ว', n: 'ณ', p: 'พ' };

export default function Team() {
  const { ask, openApp } = useOs();
  const [sel, setSel] = useState('w');
  const tabRefs = useRef({});
  // ลูกศรซ้าย/ขวาเลื่อนแท็บได้ (ตามแบบแผนของ tablist)
  const onKey = (e, i) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const next = MEMBERS[(i + (e.key === 'ArrowRight' ? 1 : MEMBERS.length - 1)) % MEMBERS.length].key;
    setSel(next);
    tabRefs.current[next]?.focus();
  };
  return (
    <>
      <div className="tabs" role="tablist" aria-label="สมาชิก">
        {MEMBERS.map((m, i) => (
          <button
            key={m.key}
            ref={(el) => (tabRefs.current[m.key] = el)}
            className="tab"
            type="button"
            role="tab"
            id={`tab-${m.key}`}
            aria-controls={`pf-${m.key}`}
            aria-selected={sel === m.key}
            tabIndex={sel === m.key ? 0 : -1}
            onClick={() => setSel(m.key)}
            onKeyDown={(e) => onKey(e, i)}
          >
            <span className={`av av-${m.key}`} aria-hidden="true">{AVATAR[m.key]}</span>
            {m.name.split(' ')[0]}
          </button>
        ))}
      </div>
      {MEMBERS.map((m) => (
        <div key={m.key} className="profile" id={`pf-${m.key}`} role="tabpanel" aria-labelledby={`tab-${m.key}`} hidden={sel !== m.key}>
          <div className="pf-head">
            <span className={`av av-${m.key}`} aria-hidden="true">{AVATAR[m.key]}</span>
            <div>
              <h3>{m.name}</h3>
              <p className="pf-role">{m.en} · {m.role}</p>
            </div>
          </div>
          <div className="chips">{m.skills.map((s) => <span key={s} className="chip">{s}</span>)}</div>
          <p>{m.work}</p>
          <p className="pf-mail">{m.email}</p>
          <div className="links">
            {/* ส่งคำถามจริงไปที่ AI ผ่านแอปแชต */}
            <button className="btn btn-solid" type="button" onClick={() => ask(`เล่าเรื่อง${m.name.split(' ')[0]}ให้ฟังหน่อย`)}>ถาม AI เรื่อง{m.name.split(' ')[0]}</button>
            {m.key === 'p' && <button className="btn" type="button" onClick={() => openApp('pipe')}>เปิด pipeline</button>}
          </div>
        </div>
      ))}
    </>
  );
}
