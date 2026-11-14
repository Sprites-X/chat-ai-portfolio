import { useState } from 'react';
import { useOs } from '../osContext.js';

// โครงตารางเดียวกับที่ BE สร้างตอนเริ่มทำงาน (initDb ใน BE/index.js)
const SCHEMA = 'CREATE TABLE IF NOT EXISTS chat_history (\n  id SERIAL PRIMARY KEY,\n  user_message TEXT NOT NULL,\n  ai_response TEXT NOT NULL,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);';
const COLUMNS = [
  ['id', 'SERIAL PRIMARY KEY', 'เลขแถว เพิ่มเอง'],
  ['user_message', 'TEXT NOT NULL', 'คำถามของผู้ใช้'],
  ['ai_response', 'TEXT NOT NULL', 'คำตอบจาก AI'],
  ['created_at', 'TIMESTAMP', 'เวลาที่บันทึก ใส่ให้เอง'],
];
const stamp = (d) => d.toLocaleString('sv-SE', { hour12: false }).slice(0, 19);
const flat = (t) => t.replace(/\*\*/g, '').replace(/\s+/g, ' ');

export default function Database() {
  const { rows, openApp } = useOs();
  const [view, setView] = useState('rows');
  const latest = rows.length ? rows[rows.length - 1].id : 0;

  let sql, table;
  if (view === 'rows') {
    sql = 'SELECT id, user_message, ai_response, created_at\nFROM chat_history\nORDER BY id DESC\nLIMIT 20;';
    table = (
      <>
        <thead><tr><th>id</th><th>user_message</th><th>ai_response</th><th>created_at</th></tr></thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={4} className="empty">ยังไม่มีแถว ลองถามอะไรสักข้อในแอป chat <button className="copy" type="button" onClick={() => openApp('chat')}>เปิด chat</button></td></tr>
          )}
          {rows.slice().reverse().slice(0, 20).map((r) => (
            <tr key={r.id} className={r.id === latest ? 'new' : undefined}>
              <td className="n">{r.id}</td>
              <td className="t" title={r.user_message}>{r.user_message}</td>
              <td className="t" title={flat(r.ai_response)}>{flat(r.ai_response)}</td>
              <td className="n">{stamp(r.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </>
    );
  } else if (view === 'count') {
    sql = 'SELECT COUNT(*) FROM chat_history;';
    table = (
      <>
        <thead><tr><th>count</th></tr></thead>
        <tbody><tr><td className="n">{rows.length}</td></tr></tbody>
      </>
    );
  } else {
    sql = SCHEMA;
    table = (
      <>
        <thead><tr><th>column</th><th>type</th><th>ความหมาย</th></tr></thead>
        <tbody>{COLUMNS.map((c) => <tr key={c[0]}><td className="n">{c[0]}</td><td className="n">{c[1]}</td><td>{c[2]}</td></tr>)}</tbody>
      </>
    );
  }

  return (
    <>
      <p className="kicker">Neon PostgreSQL · ตาราง chat_history</p>
      <p>
        ทุกครั้งที่ถาม AI แล้วได้คำตอบ BE จะบันทึกลงตารางนี้บน Neon ตรงนี้โชว์เฉพาะแถวที่ส่งจากเครื่องนี้ในรอบนี้{' '}
        <span className="note">(เว็บไม่มี API ให้อ่านตารางจริง เพื่อไม่เปิดประวัติแชตของคนอื่น)</span>
      </p>
      <div className="seg" role="group" aria-label="คำสั่ง SQL">
        {[['rows', 'SELECT * ล่าสุด'], ['count', 'COUNT(*)'], ['schema', 'โครงตาราง']].map(([k, label]) => (
          <button key={k} className="btn" type="button" aria-pressed={view === k} onClick={() => setView(k)}>{label}</button>
        ))}
      </div>
      <pre className="sql">{sql}</pre>
      <div className="tablewrap"><table className="dbt">{table}</table></div>
      <p className="pf-role">
        {view === 'schema' ? 'BE สร้างตารางนี้ให้เองตอนเริ่มทำงาน' : `${rows.length} แถว · BE บันทึกแต่ละแถวด้วย INSERT INTO chat_history (user_message, ai_response) VALUES ($1, $2)`}
      </p>
    </>
  );
}
