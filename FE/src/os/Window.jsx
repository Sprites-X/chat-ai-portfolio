import { useRef } from 'react';

// กรอบหน้าต่าง: ลากแถบสีเพื่อย้าย (ระหว่างลากขยับ style ตรง ๆ ปล่อยเมาส์แล้วค่อยบันทึกตำแหน่ง)
// บนมือถือโชว์ทีละแอปเต็มความกว้าง ไม่มีลาก/ย่อ/ปิด
export default function Window({ app, geo, z, focused, hidden, active, phone, desktopRef, onFocus, onClose, onMin, onMove, barExtra, bodyClass, children }) {
  const ref = useRef(null);
  const drag = useRef(null);
  const titleId = `t-${app.key}`;

  const down = (e) => {
    if (phone || e.target.closest('button')) return;
    const r = ref.current.getBoundingClientRect();
    const d = desktopRef.current.getBoundingClientRect();
    drag.current = { dx: e.clientX - r.left, dy: e.clientY - r.top, d };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e) => {
    const g = drag.current;
    if (!g) return;
    const x = Math.min(g.d.width - 80, Math.max(-ref.current.offsetWidth + 120, e.clientX - g.d.left - g.dx));
    const y = Math.min(g.d.height - 44, Math.max(0, e.clientY - g.d.top - g.dy));
    ref.current.style.left = `${x}px`;
    ref.current.style.top = `${y}px`;
    g.x = x;
    g.y = y;
  };
  const up = () => {
    const g = drag.current;
    drag.current = null;
    if (g && g.x !== undefined) onMove(app.key, g.x, g.y);
  };

  const style = phone || !geo ? undefined : { left: geo.x, top: geo.y, width: geo.w, height: geo.h || undefined, zIndex: z };

  return (
    <section
      ref={ref}
      className={'win' + (focused ? ' focused' : '') + (active ? ' m-active' : '')}
      hidden={hidden}
      style={style}
      onPointerDown={() => onFocus(app.key)}
      aria-labelledby={titleId}
    >
      <header className="win-bar" style={{ '--bar': app.color }} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        <span className="win-title" id={titleId}>{app.title}</span>
        <div className="win-ctrl">
          {barExtra}
          <button className="wbtn" type="button" onClick={() => onMin(app.key)} aria-label={`ย่อหน้าต่าง ${app.name}`}>–</button>
          <button className="wbtn" type="button" onClick={() => onClose(app.key)} aria-label={`ปิดหน้าต่าง ${app.name}`}>×</button>
        </div>
      </header>
      <div className={'win-body' + (bodyClass ? ' ' + bodyClass : '')}>{children}</div>
    </section>
  );
}
