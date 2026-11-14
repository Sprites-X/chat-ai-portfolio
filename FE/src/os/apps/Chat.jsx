import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useOs } from '../osContext.js';

const SAMPLES = [
  ['สมาชิกมีใครบ้าง?', 'ขอทราบข้อมูลสมาชิกในกลุ่ม ByteMind หน่อยครับ'],
  ['จุดเด่น?', 'จุดเด่นของโปรเจกต์นี้คืออะไร?'],
  ['ใครดูแล CI/CD?', 'ใครดูแลส่วน DevOps และ CI/CD Pipeline?'],
];

// ปุ่มล้างแชตบนแถบหน้าต่าง
export function ChatClearButton() {
  const { chat, showToast } = useOs();
  return (
    <button
      className="wbtn"
      type="button"
      title="ล้างแชต"
      aria-label="ล้างแชต"
      disabled={chat.busy || chat.messages.length <= 1}
      onClick={() => {
        chat.clear();
        showToast('ล้างแชตแล้ว');
      }}
    >
      ⌫
    </button>
  );
}

// แชตกับ AI ของจริง: ส่งไปที่ POST /api/chat → BE ถาม Gemini จากข้อมูลของกลุ่ม → บันทึกลง chat_history
export default function Chat() {
  const { chat } = useOs();
  const [input, setInput] = useState('');
  const logRef = useRef(null);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat.messages, chat.busy]);

  const submit = (e) => {
    e.preventDefault();
    if (!input.trim() || chat.busy) return;
    chat.send(input);
    setInput('');
  };

  return (
    <>
      <div className="chat-log" ref={logRef} aria-live="polite">
        {chat.messages.map((m, i) => (
          <div key={i} className={'msg ' + (m.role === 'user' ? 'msg-user' : 'msg-ai') + (m.role === 'error' ? ' msg-error' : '')}>
            <span className="msg-who">{m.role === 'user' ? 'คุณ' : m.role === 'error' ? 'ระบบ' : 'ByteMind AI'}</span>
            <div className="bubble">{m.role === 'ai' ? <ReactMarkdown>{m.text}</ReactMarkdown> : <p>{m.text}</p>}</div>
          </div>
        ))}
        {chat.busy && (
          <div className="typing">
            {chat.retry ? `ระบบหลังบ้านกำลังตื่น ลองส่งใหม่ครั้งที่ ${chat.retry}/6…` : 'ByteMind AI กำลังพิมพ์… (ถ้า BE เพิ่งตื่นอาจใช้เวลาถึง 1 นาที)'}
          </div>
        )}
      </div>
      <div className="chat-foot">
        <div className="qchips">
          {SAMPLES.map(([label, q]) => (
            <button key={label} className="qchip" type="button" disabled={chat.busy} onClick={() => chat.send(q)}>{label}</button>
          ))}
        </div>
        <form className="chat-form" onSubmit={submit}>
          <label className="sr" htmlFor="chat-input">พิมพ์คำถาม</label>
          <input id="chat-input" type="text" value={input} maxLength={1000} placeholder="พิมพ์คำถามเกี่ยวกับ ByteMind…" autoComplete="off" onChange={(e) => setInput(e.target.value)} />
          <button className="btn btn-solid" type="submit" disabled={chat.busy || !input.trim()}>ส่ง</button>
        </form>
      </div>
    </>
  );
}
