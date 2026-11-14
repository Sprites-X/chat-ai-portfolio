import { MEMBERS, REPO_URL } from '../../data/team.js';
import { copyText } from '../../hooks.js';
import { useOs } from '../osContext.js';

export default function Contact() {
  const { showToast } = useOs();
  const copy = async (t) => showToast((await copyText(t)) ? `คัดลอก ${t} แล้ว` : 'คัดลอกไม่ได้ เลือกข้อความแล้วคัดลอกเองได้เลย');
  const lines = 5 + MEMBERS.length;
  return (
    <div className="editor">
      <div className="ln" aria-hidden="true">
        {Array.from({ length: lines }, (_, i) => <div key={i}>{i + 1}</div>)}
      </div>
      <div className="code">
        <span className="c"># ติดต่อกลุ่ม ByteMind</span><br />
        <span className="k">github</span>  <a href={REPO_URL} target="_blank" rel="noopener">github.com/Sprites-X/chat-ai-portfolio</a><br />
        <br />
        <span className="c"># กดอีเมลเพื่อคัดลอก</span><br />
        {MEMBERS.map((m) => (
          <span key={m.key}>
            <span className="k">{m.name.split(' ')[0]}</span>{'  '}
            <button className="copy" type="button" onClick={() => copy(m.email)}>{m.email}</button><br />
          </span>
        ))}
      </div>
    </div>
  );
}
