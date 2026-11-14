import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { navigate } from '../router.js';
import { PEOPLE, MEMBERS, REPO_URL } from '../data/team.js';
import { useMedia, useReducedMotion, useViewport, storage } from '../hooks.js';
import { SCENES, IMAGES, ALT, HOT, POINTS, OBJECTS, objectAt, boxStyle, unionBox } from './scene.js';
import './room.css';

// หนังสือ 3 เล่มบนชั้น = สมาชิก 3 คน
const BOOK = {
  w: { color: '#F26B42', label: 'วรรณพร · FE', kick: 'หนังสือเล่มส้ม · FE' },
  n: { color: '#5C73F2', label: 'ณัฐนิชา · BE', kick: 'หนังสือเล่มน้ำเงิน · BE' },
  p: { color: '#33BF80', label: 'พงศกร · DevOps', kick: 'หนังสือเล่มเขียว · DevOps' },
};

// กดของที่เกี่ยวกับโปรเจกต์ = ไปหน้าอื่นหรือเปิดการ์ดสมาชิก ส่วนของอื่นในห้องแค่โชว์รายละเอียด
const PROJECT_SPOT = { pc: 'pc', tower: 'pc', model: 'model', book_w: 'book_w', book_n: 'book_n', book_p: 'book_p' };

// ซูมเข้าไปที่จอหรือโมเดลก่อนเปลี่ยนหน้า
const TARGETS = {
  os: { box: 'screen', to: '/os', color: '#0C0A22' },
  chat: { box: 'screen', to: '/os?app=chat', color: '#0C0A22' },
  neural: { box: 'model', to: '/neural', color: '#0D0A1A' },
};

function initialTimeOfDay() {
  const saved = storage.get('bytemind-room-tod');
  if (saved === 'day' || saved === 'night') return saved;
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18 ? 'day' : 'night';
}

export default function Room() {
  const portrait = useMedia('(max-aspect-ratio: 4/5)');
  const reduce = useReducedMotion();
  const [vw, vh] = useViewport();
  const mode = portrait ? 'port' : 'land';
  const { ar, focus } = SCENES[mode];
  const hot = HOT[mode];

  // ---------- ขนาดและตำแหน่งภาพ: เต็มจอเสมอ จอแคบแนวนอนเลื่อนซ้าย-ขวาได้ ----------
  const pan = mode === 'land' && vw / vh < 1.05;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const W = pan ? vh * ar : Math.max(vw, vh * ar);
  const H = W / ar;
  const photoPos = pan
    ? { width: W, height: H }
    : { width: W, height: H, left: clamp(vw / 2 - focus[0] * W, vw - W, 0), top: clamp(vh / 2 - focus[1] * H, vh - H, 0) };

  const viewRef = useRef(null);
  const photoRef = useRef(null);
  const parRef = useRef(null);
  const zoomingRef = useRef(false);

  useLayoutEffect(() => {
    if (pan && viewRef.current) viewRef.current.scrollLeft = ((hot.model[0] + hot.pc[2]) / 2) * W - vw / 2;
  }, [pan, W, vw, hot]);

  // ภาพขยับตามเมาส์นิดหน่อยบนจอคอม (เขียน style ตรง ๆ ทุกเฟรม ไม่ต้อง render ใหม่)
  useEffect(() => {
    const par = parRef.current;
    if (pan || mode === 'port' || reduce) {
      par.style.transform = '';
      return undefined;
    }
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    const move = (e) => {
      tx = (e.clientX / window.innerWidth - 0.5) * -14;
      ty = (e.clientY / window.innerHeight - 0.5) * -9;
    };
    const loop = () => {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      if (!zoomingRef.current) par.style.transform = `translate(${cx.toFixed(2)}px, ${cy.toFixed(2)}px) scale(1.02)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener('pointermove', move, { passive: true });
    loop();
    return () => {
      window.removeEventListener('pointermove', move);
      cancelAnimationFrame(raf);
    };
  }, [pan, mode, reduce]);

  // ---------- กลางวัน / กลางคืน: โหลดภาพใหม่ให้เสร็จก่อนแล้วค่อยจางเปลี่ยน ----------
  const [tod, setTod] = useState(initialTimeOfDay);
  const [shown, setShown] = useState(tod);
  const [mounted, setMounted] = useState(() => [tod]);
  const toggleTod = () => {
    const next = tod === 'day' ? 'night' : 'day';
    storage.set('bytemind-room-tod', next);
    setTod(next);
    setMounted((list) => (list.includes(next) ? list : [...list, next]));
    if (reduce) setShown(next);
  };
  const onImageReady = (t) => {
    if (t === tod) setShown(t);
  };

  // ---------- การ์ดข้อมูล (สมาชิก หรือ ของในห้อง) ----------
  const [card, setCard] = useState(null); // { kind: 'member', key } | { kind: 'object', key }
  const showMember = (m) => setCard((c) => (c?.kind === 'member' && c.key === m ? null : { kind: 'member', key: m }));
  const showObject = (g) => setCard({ kind: 'object', key: g, time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) });
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setCard(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ---------- ซูมเข้าไปแล้วเปลี่ยนหน้า ----------
  const [zoom, setZoom] = useState(null);
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const go = (which) => {
    const T = TARGETS[which];
    if (reduce) return navigate(T.to);
    if (zoomingRef.current) return undefined;
    zoomingRef.current = true;
    setCard(null);
    const [x0, y0, x1, y1] = hot[T.box];
    const r = photoRef.current.getBoundingClientRect();
    const px = r.left + ((x0 + x1) / 2) * r.width;
    const py = r.top + ((y0 + y1) / 2) * r.height;
    const k = Math.min(vw / ((x1 - x0) * r.width), vh / ((y1 - y0) * r.height)) * 0.9;
    setZoom({
      origin: `${((x0 + x1) / 2) * 100}% ${((y0 + y1) / 2) * 100}%`,
      transform: `translate(${vw / 2 - px}px, ${vh / 2 - py}px) scale(${k.toFixed(3)})`,
      color: T.color,
      curtain: false,
    });
    timers.current.push(setTimeout(() => setZoom((z) => z && { ...z, curtain: true }), 800));
    timers.current.push(setTimeout(() => navigate(T.to), 1300));
    return undefined;
  };

  // ---------- กดที่ภาพ: ดูจากแผนที่วัตถุว่าโดนอะไร ----------
  const [hoverSpot, setHoverSpot] = useState(null);
  const pickAt = (e) => {
    const r = parRef.current.getBoundingClientRect();
    return objectAt(mode, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height, r.width);
  };
  const onPick = (e) => {
    const g = pickAt(e);
    if (!g) return setCard(null);
    if (g === 'pc' || g === 'tower') return go('os');
    if (g === 'model') return go('neural');
    if (g.startsWith('book_')) return showMember(g.slice(5));
    return showObject(g);
  };
  const onHover = (e) => {
    if (e.pointerType !== 'mouse') return;
    const g = pickAt(e);
    e.currentTarget.style.cursor = g ? 'pointer' : '';
    const spot = PROJECT_SPOT[g] || null;
    if (spot !== hoverSpot) setHoverSpot(spot);
  };

  // ตำแหน่งจุดกดของโปรเจกต์ (เปลี่ยนตามภาพแนวนอน/แนวตั้ง)
  const spots = useMemo(() => {
    const books = ['w', 'n', 'p'].map((m) => hot['book_' + m]);
    const glow = (box, grow) => {
      const [x0, y0, x1, y1] = box;
      const w = (x1 - x0) * grow, h = (y1 - y0) * grow, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      return { left: `${(cx - w / 2) * 100}%`, top: `${(cy - h / 2) * 100}%`, width: `${w * 100}%`, height: `${h * 100}%` };
    };
    return {
      pc: boxStyle(hot.screen, 0.006, ar),
      model: boxStyle(hot.model, 0.008, ar),
      books: Object.fromEntries(['w', 'n', 'p'].map((m) => [m, boxStyle(hot['book_' + m], 0.002, ar)])),
      booksGroup: boxStyle(unionBox(books), 0, ar),
      glowScreen: glow(hot.screen, 1.9),
      glowModel: glow(hot.model, 1.6),
    };
  }, [hot, ar]);

  const hint = pan ? 'เลื่อนซ้าย-ขวาเพื่อดูทั้งห้อง' : 'แตะจุดที่กระพริบหรือของในห้องเพื่อดูข้อมูล';

  return (
    <div className="room" data-tod={shown}>
      <section className="hud intro glass" aria-labelledby="intro-title">
        <div className="brand"><span className="mark" aria-hidden="true" />ByteMind</div>
        <h1 id="intro-title"><span className="mark mark-sm" aria-hidden="true" />ห้องของทีม ByteMind</h1>
        <button className="tod" type="button" onClick={toggleTod} aria-label={tod === 'day' ? 'สลับเป็นกลางคืน' : 'สลับเป็นกลางวัน'}>
          <b aria-hidden="true">{tod === 'day' ? '☀️' : '🌙'}</b>
          <span>{tod === 'day' ? 'กลางวัน' : 'กลางคืน'}</span>
        </button>
        <p>กดที่คอมเพื่อเปิด ByteMind OS แล้วคุยกับ AI ได้ กดโมเดลแก้วบนชั้นเพื่อดูเครือข่ายของทีม หนังสือสีส้ม น้ำเงิน เขียวบนชั้นคือสมาชิกแต่ละคน ของชิ้นอื่นในห้องก็กดดูรายละเอียดได้</p>
        <div className="row">
          <button className="btn btn-os" type="button" onClick={() => go('chat')}>💬 <span className="full">คุยกับ AI</span><span className="short">ถาม AI</span></button>
          <button className="btn" type="button" onClick={() => go('os')}><span className="full">เปิดคอม → OS</span><span className="short">OS</span></button>
          <button className="btn btn-nn" type="button" onClick={() => go('neural')}><span className="full">ดูโมเดล → Neural</span><span className="short">Neural</span></button>
        </div>
      </section>
      <a className="hud top-right btn glass" href={REPO_URL} target="_blank" rel="noopener">GitHub ↗</a>

      <nav className="hud members glass" aria-label="สมาชิก (หนังสือบนชั้น)">
        {MEMBERS.map((p) => (
          <button key={p.key} className="mb" type="button" aria-expanded={card?.kind === 'member' && card.key === p.key} aria-controls="room-card" onClick={() => showMember(p.key)}>
            <i style={{ background: BOOK[p.key].color }} />
            <span>{p.name.split(' ')[0]}</span>
          </button>
        ))}
      </nav>

      <div id="view" ref={viewRef} className={pan ? 'pan' : undefined}>
        <div
          id="photo"
          ref={photoRef}
          className={zoom ? 'zoom' : undefined}
          style={{ ...photoPos, transformOrigin: zoom?.origin, transform: zoom?.transform }}
        >
          <div id="parallax" ref={parRef}>
            {mounted.map((t) => (
              <picture key={t}>
                <source media="(max-aspect-ratio: 4/5)" srcSet={IMAGES[t].port} />
                <img
                  src={IMAGES[t].land}
                  alt={t === shown ? ALT[t] : ''}
                  decoding="async"
                  draggable="false"
                  style={{ opacity: t === shown ? 1 : 0 }}
                  onLoad={() => onImageReady(t)}
                />
              </picture>
            ))}
            <div className="glow glow-screen" style={spots.glowScreen} />
            <div className="glow glow-model" style={spots.glowModel} />
            <div className="vignette" />
            <div id="pick" aria-hidden="true" onClick={onPick} onPointerMove={onHover} onPointerLeave={() => setHoverSpot(null)} />

            <button className={'spot' + (hoverSpot === 'pc' ? ' hover' : '')} type="button" style={spots.pc} onClick={() => go('os')} aria-label="คอมพิวเตอร์ เปิด ByteMind OS">
              <span className="beacon" />
              <span className="label label-os">คอมพิวเตอร์ <small>เปิด OS</small></span>
            </button>
            <button className={'spot' + (hoverSpot === 'model' ? ' hover' : '')} type="button" style={spots.model} onClick={() => go('neural')} aria-label="โมเดลเครือข่ายในโดมแก้ว เปิด ByteMind Neural">
              <span className="beacon" />
              <span className="label label-nn">โมเดลเครือข่าย <small>เปิด Neural</small></span>
            </button>
            <span className="group-beacon" style={spots.booksGroup} aria-hidden="true">
              <span className="beacon" />
              <span className="group-label">หนังสือสมาชิก 3 เล่ม</span>
            </span>
            {['w', 'n', 'p'].map((m) => {
              const lit = hoverSpot === 'book_' + m || (card?.kind === 'member' && card.key === m);
              return (
                <button key={m} className={'spot' + (lit ? ' lit' : '')} type="button" style={spots.books[m]} onClick={() => showMember(m)} aria-label={'หนังสือของ' + PEOPLE[m].name.split(' ')[0]}>
                  <span className="label label-book">{BOOK[m].label}</span>
                </button>
              );
            })}

            {/* ปุ่มล่องหนของของทั่วไป ใช้กับคีย์บอร์ด: กด Tab แล้วชื่อของจะโผล่ */}
            {Object.entries(POINTS[mode]).map(([g, [u, v]]) =>
              OBJECTS[g] ? (
                <button key={g} className="obj" type="button" style={{ left: `${u * 100}%`, top: `${v * 100}%` }} onClick={() => showObject(g)}>
                  <span>{OBJECTS[g].name}</span>
                </button>
              ) : null,
            )}
          </div>
        </div>
      </div>

      <p className="hud hint glass" aria-hidden="true">กดจุดที่กระพริบ หรือกดของชิ้นไหนก็ได้</p>
      <p className="hud pan-hint glass" aria-hidden="true">{hint}</p>

      {card && (
        <section className="hud card glass" id="room-card" aria-live="polite">
          <button className="x" type="button" onClick={() => setCard(null)} aria-label="ปิดการ์ด">×</button>
          {card.kind === 'member' ? (
            <>
              <p className="mail">{BOOK[card.key].kick}</p>
              <h2>{PEOPLE[card.key].name}</h2>
              <p className="role">{PEOPLE[card.key].role}</p>
              <div className="chips">{PEOPLE[card.key].skills.map((s) => <span key={s} className="chip">{s}</span>)}</div>
              <p>{PEOPLE[card.key].work}</p>
              <p className="mail">{PEOPLE[card.key].email}</p>
            </>
          ) : (
            <>
              <p className="mail">{OBJECTS[card.key].kick}</p>
              <h2>{OBJECTS[card.key].name}</h2>
              <p>{OBJECTS[card.key].desc}{card.key === 'clock' ? ` ตอนนี้เวลา ${card.time} น.` : ''}</p>
            </>
          )}
        </section>
      )}

      <div id="curtain" className={zoom?.curtain ? 'on' : undefined} style={{ background: zoom?.color }} aria-hidden="true" />
    </div>
  );
}
