import { useEffect, useRef, useState } from 'react';
import { navigate } from '../router.js';
import { useReducedMotion, useViewport } from '../hooks.js';
import { IMAGES as ROOM } from '../room/scene.js';
import { initialTimeOfDay } from '../room/tod.js';
import './entry.css';

// หน้าแรก: ประตูบานเดียวตั้งอยู่กลางทุ่งหญ้า (เรนเดอร์ด้วย Blender) กดแล้วประตูเปิด เห็นห้องของทีมอยู่หลังบาน
// แล้วกล้องเดินผ่านประตูเข้าไปที่หน้าห้อง (/room)
//
// ภาพแบ่งเป็นชั้น: ห้อง (หลังสุด) → บานประตู → ทุ่งหญ้า (ช่องประตูในภาพโปร่งใส) → แสง/ฝุ่น → ปุ่มกดตรงประตู
// บานประตูอยู่ใต้ทุ่งหญ้า หญ้ากับวงกบที่อยู่ข้างหน้าจึงบังบานได้ถูกต้องตอนบานหมุนเปิด
const ART = {
  day: { hall: '/entry/meadow-hall.webp', small: '/entry/meadow-hall-2400.webp', leaf: '/entry/meadow-leaf-cream.webp' },
  night: { hall: '/entry/meadow-night-hall.webp', small: '/entry/meadow-night-hall-2400.webp', leaf: '/entry/meadow-night-leaf-cream.webp' },
};
const ALT = {
  day: 'ทุ่งหญ้าสูงสีเขียวกลางแดด มีดอกไม้ป่าและต้นไม้ห่าง ๆ ทุ่งราบยาวไปจนถึงขอบฟ้า ฟ้าใสมีเมฆก้อนใหญ่สีขาว ตรงกลางมีประตูสีครีมบานเดียวตั้งอยู่บนแผ่นหิน มีหินวางเป็นทางเดินพาไปถึงประตู',
  night: 'ทุ่งหญ้ายามค่ำใต้แสงจันทร์และดาว มีหิ่งห้อยและต้นไม้ห่าง ๆ ทุ่งราบยาวไปจนถึงขอบฟ้า ตรงกลางมีประตูสีครีมบานเดียวตั้งอยู่บนแผ่นหิน มีแสงลอดใต้ประตู',
};

// ตำแหน่งในภาพ (สัดส่วน 0–1: ซ้าย บน ขวา ล่าง) คำนวณจากกล้องใน Blender
const DOORWAY = [0.4408, 0.4036, 0.5592, 0.8183]; // ช่องประตู
const LEAF_BOX = [0.44, 0.4025, 0.56, 0.819583]; // ภาพบานประตู (กว้างกว่าช่องนิดหน่อย)
const AR = 1.5; // ภาพ 3:2

const pct = (v) => `${v * 100}%`;
const boxStyle = ([a, b, c, d]) => ({ left: pct(a), top: pct(b), width: pct(c - a), height: pct(d - b) });
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// กลางวันเป็นเมล็ดหญ้าลอยช้า ๆ กลางคืนเป็นหิ่งห้อย สุ่มครั้งเดียวตอนเปิดหน้า
function makeMotes(night) {
  const r = (a, b) => a + Math.random() * (b - a);
  return Array.from({ length: 16 }, () => {
    const size = night ? 5 : r(3, 6);
    return {
      left: `${night ? r(5, 95) : r(-5, 70)}%`,
      top: `${night ? r(52, 92) : r(35, 85)}%`,
      width: size,
      height: size,
      '--dx': `${night ? r(-140, 140) : r(260, 620)}px`,
      '--dy': `${night ? r(-90, 60) : r(-240, -40)}px`,
      '--d': `${(night ? r(3.5, 7) : r(9, 16)).toFixed(1)}s`,
      '--delay': `${(-r(0, 12)).toFixed(1)}s`,
    };
  });
}

export default function Entry() {
  const [tod] = useState(initialTimeOfDay);
  const night = tod === 'night';
  const reduce = useReducedMotion();
  const [vw, vh] = useViewport();
  const [phase, setPhase] = useState('idle'); // idle → peek (เมาส์ชี้ประตู) → open → arrive
  const [zoom, setZoom] = useState(null);
  const [motes] = useState(() => (reduce ? [] : makeMotes(night)));
  const timers = useRef([]);

  // ภาพเต็มจอแบบ cover โดยให้ประตูอยู่กลางจอ (จอแคบ/มือถือจะตัดสองข้างออก)
  const W = Math.max(vw, vh * AR);
  const H = W / AR;
  const [x0, y0, x1, y1] = DOORWAY;
  const L = clamp(vw / 2 - ((x0 + x1) / 2) * W, vw - W, 0);
  const T = clamp(vh / 2 - ((y0 + y1) / 2 + 0.02) * H, vh - H, 0);

  useEffect(() => {
    // โหลดภาพห้องไว้ก่อน พอเดินผ่านประตูแล้วภาพขึ้นทันที
    [ROOM[tod].land, ROOM[tod].port].forEach((src) => {
      const img = new Image();
      img.src = src;
    });
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, [tod]);

  const opening = phase === 'open' || phase === 'arrive';

  function open() {
    if (opening) return;
    setPhase('open');
    // เดินเข้าประตู: ขยายภาพจนช่องประตูเต็มจอ
    const dw = (x1 - x0) * W;
    const dh = (y1 - y0) * H;
    const dcx = L + ((x0 + x1) / 2) * W;
    const dcy = T + ((y0 + y1) / 2) * H;
    const k = Math.max(vw / dw, vh / dh) * 1.08;
    const later = (ms, fn) => timers.current.push(setTimeout(fn, reduce ? 0 : ms));
    later(850, () => setZoom({ transformOrigin: `${dcx - L}px ${dcy - T}px`, transform: `translate(${vw / 2 - dcx}px, ${vh / 2 - dcy}px) scale(${k.toFixed(3)})` }));
    later(1750, () => setPhase('arrive'));
    later(reduce ? 60 : 2270, () => navigate('/room'));
  }

  // แง้มประตูนิดหนึ่งตอนเอาเมาส์ชี้ (เฉพาะเมาส์ บนมือถือนิ้วแตะแล้วจะค้างแง้ม)
  const hover = (on) => (e) => {
    if (e.pointerType !== 'mouse' || opening) return;
    setPhase(on ? 'peek' : 'idle');
  };

  return (
    <div className={`entry ${night ? 'night' : 'day'} ${phase}`}>
      <div className="view">
        <div className={`stage${zoom ? ' zoom' : ''}`} style={{ width: W, height: H, left: L, top: T, ...zoom }}>
          <div className="through" style={boxStyle(DOORWAY)}>
            <img src={ROOM[tod].port} alt="" />
            <div className="spill" />
          </div>
          <div className="leafbox" style={boxStyle(LEAF_BOX)}>
            <img className="leaf" src={ART[tod].leaf} alt="" />
          </div>
          <img
            className="layer"
            src={ART[tod].hall}
            srcSet={`${ART[tod].small} 2400w, ${ART[tod].hall} 3600w`}
            sizes={`${Math.round(W)}px`}
            alt={ALT[tod]}
          />
          <div className="halo" style={boxStyle(DOORWAY)} />
          <div className="motes" aria-hidden="true">
            {motes.map((style, i) => (
              <span key={i} className="mote" style={style} />
            ))}
          </div>
          <button
            className="door-hit"
            type="button"
            style={boxStyle(DOORWAY)}
            aria-label="เปิดประตูกลางทุ่งเข้าห้อง 312 ของทีม ByteMind"
            onClick={open}
            onPointerEnter={hover(true)}
            onPointerLeave={hover(false)}
          />
        </div>
      </div>

      {/* ภาพแรกของหน้าห้อง ค่อย ๆ ขึ้นตอนท้าย เปลี่ยนไปหน้าห้องจึงไม่มีรอยต่อ */}
      <div className="final" aria-hidden="true">
        <picture>
          <source media="(max-aspect-ratio: 4/5)" srcSet={ROOM[tod].port} />
          <img src={ROOM[tod].land} alt="" />
        </picture>
      </div>

      <section className="card glass" aria-labelledby="entry-title">
        <h1 id="entry-title" className="sr-only">ห้อง 312 · ByteMind</h1>
        <p className="kicker">ByteMind · AIE312 Chat AI Portfolio</p>
        <button className="btn-gold" type="button" onClick={open} onPointerEnter={hover(true)} onPointerLeave={hover(false)}>
          เปิดประตู →
        </button>
        <span className="hint">หรือกดที่ประตูก็ได้</span>
      </section>
      <p className="tap glass">แตะที่ประตูเพื่อเปิด</p>
    </div>
  );
}
