// เครือข่ายของทีมบน <canvas>: จุดดึงกันด้วยสปริง ผลักกันเล็กน้อย ลากเล่นได้ และมีสัญญาณแสงวิ่งไปหาจุดที่ถูกเลือก
// ส่วนนี้เป็นงานวาดภาพล้วน ๆ จึงเขียนแบบปกติ (ไม่ใช่ React) แล้วให้ Neural.jsx เป็นคนเรียกใช้
import { PEOPLE } from '../data/team.js';

export const COL = { w: '#FF8A5B', n: '#A78BFA', p: '#4FD1E8', core: '#FFF1DC', work: '#FFD166', contact: '#E9E4FF', shared: '#DCE3FF', gold: '#FFD166' };

const SKILLS = {
  w: ['React', 'JavaScript', 'HTML/CSS', 'UI/UX', 'Component Design'],
  n: ['Node.js', 'Express', 'Gemini API', 'RESTful API'],
  p: ['Docker', 'Nginx', 'GitHub Actions', 'Trivy', 'Render'],
  shared: ['Git/GitHub', 'node:test'],
};

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const hexA = (hex, a) => {
  const v = parseInt(hex.slice(1), 16);
  return `rgba(${(v >> 16) & 255},${(v >> 8) & 255},${v & 255},${a})`;
};

function buildGraph() {
  const nodes = [];
  const edges = [];
  const byId = {};
  const add = (id, label, kind, r, color) => {
    const n = { id, label, kind, r, color, x: 0, y: 0, vx: 0, vy: 0, flash: 0, fixed: false };
    nodes.push(n);
    byId[id] = n;
  };
  const link = (a, b, rest) => edges.push({ a: byId[a], b: byId[b], rest });
  add('core', 'ByteMind', 'core', 30, COL.core);
  ['w', 'n', 'p'].forEach((m) => add(m, PEOPLE[m].name.split(' ')[0], 'member', 20, COL[m]));
  add('work', 'Chat AI Portfolio', 'work', 15, COL.work);
  add('contact', 'ติดต่อ', 'contact', 12, COL.contact);
  ['w', 'n', 'p'].forEach((m) => {
    link('core', m, 175);
    link('work', m, 150);
  });
  link('core', 'work', 170);
  link('core', 'contact', 150);
  // ผลงานส่วนตัวของสมาชิก (projects ใน data/team.js) เป็นจุดสีทองที่ต่อกับเจ้าของ
  ['w', 'n', 'p'].forEach((m) =>
    (PEOPLE[m].projects || []).forEach((pj) => {
      const id = projectNodeId(m, pj.id);
      add(id, pj.short || pj.name, 'proj', 11, COL.work);
      link(m, id, 125);
    }),
  );
  Object.entries(SKILLS).forEach(([m, list]) =>
    list.forEach((s) => {
      const id = 's:' + s;
      add(id, s, 'skill', 7, COL[m]);
      if (m === 'shared') {
        link('n', id, 90);
        link('p', id, 90);
      } else link(m, id, 82);
    }),
  );
  return { nodes, edges, byId };
}

// id ของจุดผลงานส่วนตัว: pj:<สมาชิก>:<โปรเจกต์> เช่น pj:p:yolo
export const projectNodeId = (member, projectId) => `pj:${member}:${projectId}`;

// อ่านกลับจาก id ของจุด ได้ { member, project } หรือ null ถ้าไม่ใช่จุดผลงาน
export function projectFromNode(nodeId) {
  const [kind, member, projectId] = String(nodeId).split(':');
  if (kind !== 'pj' || !PEOPLE[member]) return null;
  const project = (PEOPLE[member].projects || []).find((p) => p.id === projectId);
  return project ? { member, project } : null;
}

// ทักษะนี้ใครใช้บ้าง (ใช้ในแผงข้อมูล)
export function skillOwners(skillId) {
  const { edges, byId } = buildGraph();
  const n = byId[skillId];
  return edges.filter((e) => e.a === n || e.b === n).map((e) => (e.a === n ? e.b : e.a)).filter((x) => PEOPLE[x.id]).map((x) => x.id);
}

export function skillLabel(skillId) {
  return skillId.slice(2);
}

/**
 * @param canvas      <canvas> ที่จะวาด
 * @param opts.leftBound  ฟังก์ชันคืนขอบขวาของแผงข้อมูล (จอใหญ่จะจัดเครือข่ายไว้ตรงกลางพื้นที่ที่เหลือ)
 * @param opts.narrow     ฟังก์ชันคืน true บนจอแคบ
 * @param opts.reduce     ปิดแอนิเมชันสัญญาณที่วิ่งเอง
 * @param opts.onPick     เรียกเมื่อผู้ใช้กดจุด (ไม่ใช่ลาก)
 */
export function createNetwork(canvas, { leftBound, narrow, reduce, onPick }) {
  const ctx = canvas.getContext('2d');
  const { nodes, edges, byId } = buildGraph();
  let W = 0, H = 0, cx = 0, cy = 0, S = 1;
  let selected = 'core';
  let hover = null;
  let time = 0;
  let last = performance.now();
  let ambient = 0;
  let alive = true;
  const pulses = [];

  function measure() {
    const r = canvas.getBoundingClientRect();
    W = r.width;
    H = r.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (narrow()) {
      cx = W / 2;
      cy = H * 0.54;
      S = clamp(Math.min(W, H) / 760, 0.48, 0.9);
    } else {
      const L = leftBound();
      const R = W - 20;
      cx = (L + R) / 2;
      cy = H * 0.52;
      S = clamp(Math.min(R - L, H) / 760, 0.62, 1.15);
    }
  }
  function seed() {
    nodes.forEach((n, i) => {
      if (n.id === 'core') {
        n.x = cx;
        n.y = cy;
        return;
      }
      const a = (i / nodes.length) * Math.PI * 2;
      n.x = cx + Math.cos(a) * 220 * S + (Math.random() - 0.5) * 30;
      n.y = cy + Math.sin(a) * 200 * S + (Math.random() - 0.5) * 30;
    });
    const ang = { w: -2.4, n: -0.6, p: 1.6 };
    ['w', 'n', 'p'].forEach((m) => {
      byId[m].x = cx + Math.cos(ang[m]) * 175 * S;
      byId[m].y = cy + Math.sin(ang[m]) * 175 * S;
    });
  }
  const onResize = () => {
    const ox = cx, oy = cy;
    measure();
    nodes.forEach((n) => {
      n.x += cx - ox;
      n.y += cy - oy;
    });
  };

  function physics() {
    const REP = 2400 * S * S;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        let dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy || 0.01;
        if (d2 > 160000 * S * S) continue;
        const f = REP / d2, d = Math.sqrt(d2);
        dx /= d;
        dy /= d;
        a.vx += dx * f; a.vy += dy * f; b.vx -= dx * f; b.vy -= dy * f;
      }
    }
    edges.forEach((e) => {
      const dx = e.b.x - e.a.x, dy = e.b.y - e.a.y, d = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const f = (d - e.rest * S) * 0.018, fx = (dx / d) * f, fy = (dy / d) * f;
      e.a.vx += fx; e.a.vy += fy; e.b.vx -= fx; e.b.vy -= fy;
    });
    nodes.forEach((n) => {
      n.vx += (cx - n.x) * (n.id === 'core' ? 0.02 : 0.0025);
      n.vy += (cy - n.y) * (n.id === 'core' ? 0.02 : 0.0025);
      if (n.fixed) {
        n.vx = 0;
        n.vy = 0;
        return;
      }
      n.vx *= 0.82;
      n.vy *= 0.82;
      const sp = Math.hypot(n.vx, n.vy);
      if (sp > 14) {
        n.vx *= 14 / sp;
        n.vy *= 14 / sp;
      }
      n.x = clamp(n.x + n.vx, 20, W - 20);
      n.y = clamp(n.y + n.vy, 60, H - 20);
    });
  }

  // ---------- สัญญาณแสง ----------
  const edgeBetween = (a, b) => edges.find((e) => (e.a.id === a && e.b.id === b) || (e.a.id === b && e.b.id === a));
  function fire(from, to, color, delay = 0, speed = 1.4) {
    const e = edgeBetween(from, to);
    if (!e) return;
    pulses.push({ e, dir: e.a.id === from ? 1 : -1, t: -delay, speed, color: color || byId[to].color, target: byId[to] });
  }
  function fireTo(id) {
    if (id === 'core') {
      ['w', 'n', 'p', 'work', 'contact'].forEach((m, i) => fire('core', m, COL.gold, i * 0.08));
      return;
    }
    // ทักษะและผลงานส่วนตัวไม่ได้ต่อกับ core ตรง ๆ จึงยิงจาก core ไปหาเจ้าของก่อน แล้วค่อยต่อไปที่จุดนั้น
    if (byId[id].kind === 'skill' || byId[id].kind === 'proj') {
      edges.filter((e) => e.a.id === id || e.b.id === id).forEach((e) => {
        const m = e.a.id === id ? e.b.id : e.a.id;
        fire('core', m, byId[m].color, 0);
        fire(m, id, byId[m].color, 0.7);
      });
      return;
    }
    fire('core', id, byId[id].color, 0);
    edges.filter((e) => e.a.id === id && (e.b.kind === 'skill' || e.b.kind === 'proj')).forEach((e, i) => fire(id, e.b.id, byId[id].color, 0.7 + i * 0.06, 1.8));
  }

  // ---------- วาด ----------
  const related = (n) => selected !== 'core' && (n.id === selected || edges.some((e) => (e.a.id === selected && e.b === n) || (e.b.id === selected && e.a === n)));
  function glowDot(x, y, r, color, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, hexA(color, a));
    g.addColorStop(1, hexA(color, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function draw(dt) {
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = 'round';
    edges.forEach((e) => {
      const hot = selected !== 'core' && (e.a.id === selected || e.b.id === selected);
      const hv = hover && (e.a === hover || e.b === hover);
      ctx.strokeStyle = hot ? hexA(byId[selected].color, 0.55) : hv ? 'rgba(255,255,255,0.35)' : 'rgba(200,180,255,0.15)';
      ctx.lineWidth = hot ? 1.8 : 1;
      ctx.beginPath();
      ctx.moveTo(e.a.x, e.a.y);
      ctx.lineTo(e.b.x, e.b.y);
      ctx.stroke();
    });
    ctx.globalCompositeOperation = 'lighter';
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i];
      p.t += dt * p.speed;
      if (p.t < 0) continue;
      if (p.t >= 1) {
        p.target.flash = 1;
        pulses.splice(i, 1);
        continue;
      }
      const t = p.dir === 1 ? p.t : 1 - p.t;
      const x = p.e.a.x + (p.e.b.x - p.e.a.x) * t, y = p.e.a.y + (p.e.b.y - p.e.a.y) * t;
      glowDot(x, y, 14, p.color, 0.9);
      glowDot(x, y, 4, '#FFFFFF', 1);
    }
    nodes.forEach((n) => {
      n.flash = Math.max(0, n.flash - dt * 1.6);
      const isSel = n.id === selected, isHov = n === hover, rel = related(n);
      const breathe = 1 + Math.sin(time * 1.6 + n.x * 0.01) * 0.05;
      const r = n.r * Math.max(0.75, S) * breathe * (isHov ? 1.18 : 1) * (isSel && n.id !== 'core' ? 1.15 : 1);
      glowDot(n.x, n.y, r * (n.kind === 'skill' ? 3.2 : 2.6) + n.flash * 26, n.color, (selected !== 'core' && !rel ? 0.18 : 0.5) + n.flash * 0.5);
      n.drawR = r;
    });
    ctx.globalCompositeOperation = 'source-over';
    nodes.forEach((n) => {
      ctx.globalAlpha = selected !== 'core' && !related(n) && n.id !== 'core' ? 0.45 : 1;
      ctx.fillStyle = n.color;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.drawR, 0, Math.PI * 2);
      ctx.fill();
      if (n.kind !== 'skill') {
        ctx.strokeStyle = 'rgba(13,10,26,0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      if (n.id === selected && n.id !== 'core') {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.drawR + 6, 0, Math.PI * 2);
        ctx.stroke();
      }
      const big = n.kind !== 'skill';
      ctx.font = big ? `600 ${n.kind === 'core' ? 15 : n.kind === 'proj' ? 13 : 14}px Mitr, 'Noto Sans Thai', sans-serif` : `500 11.5px 'Noto Sans Thai', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const ty = n.y + n.drawR + (big ? 8 : 5);
      const tw = ctx.measureText(n.label).width;
      if (big) {
        ctx.fillStyle = 'rgba(13,10,26,0.75)';
        roundRect(n.x - tw / 2 - 8, ty - 3, tw + 16, 22, 11);
        ctx.fill();
      }
      ctx.fillStyle = big ? '#FFFFFF' : 'rgba(243,238,255,0.82)';
      ctx.fillText(n.label, n.x, ty);
      if (n.kind === 'core') {
        ctx.fillStyle = '#0D0A1A';
        ctx.font = '600 13px Mitr, sans-serif';
        ctx.textBaseline = 'middle';
        ctx.fillText('BM', n.x, n.y + 1);
      }
      ctx.globalAlpha = 1;
    });
  }

  // ---------- วนเฟรม: ถ้า requestAnimationFrame หยุด (บางแอปพรีวิว) จะเปลี่ยนไปใช้ setTimeout แทน ----------
  let lastTick = 0;
  let useTimer = false;
  function frame(now) {
    if (!alive) return;
    lastTick = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    time += dt;
    physics();
    if (!reduce) {
      ambient -= dt;
      if (ambient <= 0) {
        ambient = 0.35 + Math.random() * 0.4;
        const e = edges[(Math.random() * edges.length) | 0];
        pulses.push({ e, dir: Math.random() < 0.5 ? 1 : -1, t: 0, speed: 0.9 + Math.random() * 0.6, color: e.b.kind === 'skill' ? e.b.color : COL.gold, target: Math.random() < 0.5 ? e.a : e.b });
      }
    }
    draw(dt);
    schedule();
  }
  function schedule() {
    if (!alive) return;
    if (useTimer) setTimeout(() => frame(performance.now()), 33);
    else requestAnimationFrame((t) => !useTimer && frame(t));
  }
  const watchdog = setInterval(() => {
    if (!useTimer && performance.now() - lastTick > 1500) {
      useTimer = true;
      schedule();
    }
  }, 1000);

  // ---------- เมาส์/นิ้ว: ลากจุดได้ กดเฉย ๆ = เลือก ----------
  const pick = (x, y) => {
    let best = null, bd = Infinity;
    nodes.forEach((n) => {
      const d = Math.hypot(n.x - x, n.y - y);
      if (d < (n.drawR || n.r) + 10 && d < bd) {
        bd = d;
        best = n;
      }
    });
    return best;
  };
  const pt = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  let drag = null;
  const down = (e) => {
    const p = pt(e), n = pick(p.x, p.y);
    if (!n) return;
    drag = { n, sx: p.x, sy: p.y, moved: false };
    n.fixed = true;
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add('dragging');
  };
  const move = (e) => {
    const p = pt(e);
    if (drag) {
      if (Math.hypot(p.x - drag.sx, p.y - drag.sy) > 5) drag.moved = true;
      drag.n.x = p.x;
      drag.n.y = p.y;
      return;
    }
    hover = pick(p.x, p.y);
    canvas.classList.toggle('hover', !!hover);
  };
  const up = () => {
    if (!drag) return;
    drag.n.fixed = false;
    if (!drag.moved) onPick(drag.n.id);
    drag = null;
    canvas.classList.remove('dragging');
  };
  const leave = () => {
    hover = null;
    canvas.classList.remove('hover');
  };
  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('pointerleave', leave);
  window.addEventListener('resize', onResize);

  measure();
  seed();
  schedule();
  const intro = setTimeout(() => fireTo('core'), 600);

  return {
    setSelected(id) {
      selected = id;
    },
    fireTo,
    remeasure: onResize,
    destroy() {
      alive = false;
      clearInterval(watchdog);
      clearTimeout(intro);
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', up);
      canvas.removeEventListener('pointerleave', leave);
      window.removeEventListener('resize', onResize);
    },
  };
}
