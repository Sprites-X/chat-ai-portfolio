import { PROJECT } from '../../data/team.js';
import { useOs } from '../osContext.js';

export default function About() {
  const { openApp } = useOs();
  return (
    <>
      <p className="kicker">AIE312 · Chat AI Portfolio</p>
      <h1 className="big">ByteMind</h1>
      <p>{PROJECT.intro}</p>
      <div className="box">
        <p className="kicker">ผลงานที่ทำร่วมกัน</p>
        <h2 style={{ fontSize: 22 }}>{PROJECT.name}</h2>
        <p>{PROJECT.together}</p>
        <div className="chips">{PROJECT.stack.map((s) => <span key={s} className="chip">{s}</span>)}</div>
      </div>
      <div className="links">
        <button className="btn btn-solid" type="button" onClick={() => openApp('chat')}>เปิดแชต AI</button>
        <button className="btn" type="button" onClick={() => openApp('team')}>ดูสมาชิก</button>
        <button className="btn" type="button" onClick={() => openApp('sys')}>ดูว่าระบบทำงานยังไง</button>
      </div>
    </>
  );
}
