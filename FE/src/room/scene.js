// ข้อมูลของภาพห้องที่เรนเดอร์จาก Blender: ตำแหน่งจุดกด, แผนที่ว่าแต่ละพิกเซลเป็นของชิ้นไหน และคำอธิบายของแต่ละชิ้น
import DATA from './roomData.json';

// ภาพแนวนอนใช้บนจอกว้าง ภาพแนวตั้งใช้บนจอสูง (มือถือ) มุมกล้องคนละมุมแต่ห้องเดียวกัน
export const SCENES = {
  land: { ar: 2560 / 1440, focus: [0.5, 0.5] },
  port: { ar: 1260 / 2240, focus: [0.484, 0.52] },
};

export const IMAGES = {
  night: { land: '/room/room.jpg', port: '/room/room-portrait.jpg' },
  day: { land: '/room/room-day.jpg', port: '/room/room-portrait-day.jpg' },
};

export const ALT = {
  night: 'ห้องทำงานยามค่ำของทีม ByteMind จอคอมเปิด ByteMind OS อยู่ ชั้นวางมีหนังสือและโมเดลเครือข่ายในโดมแก้ว นอกหน้าต่างเป็นเมืองตอนพลบค่ำ',
  day: 'ห้องทำงานตอนกลางวันของทีม ByteMind แดดส่องผ่านหน้าต่างลงบนพรม จอคอมเปิด ByteMind OS อยู่ ชั้นวางมีหนังสือและโมเดลเครือข่ายในโดมแก้ว',
};

// กรอบของจุดกด (สัดส่วน 0–1 ของภาพ: [ซ้าย, บน, ขวา, ล่าง]) กันไม่ให้หลุดขอบภาพ
const clamp01 = (v) => Math.min(0.995, Math.max(0.005, v));
export const HOT = Object.fromEntries(
  Object.entries(DATA.hot).map(([mode, boxes]) => [mode, Object.fromEntries(Object.entries(boxes).map(([k, b]) => [k, b.map(clamp01)]))]),
);

// แผนที่วัตถุ: เก็บแบบ run-length (ค่า, จำนวนซ้ำ, ...) แตกเป็นอาร์เรย์ 1 ไบต์ต่อพิกเซลครั้งเดียวตอนโหลด
export const MAPS = Object.fromEntries(
  Object.entries(DATA.pick.maps).map(([mode, m]) => {
    const data = new Uint8Array(m.w * m.h);
    let p = 0;
    for (let i = 0; i < m.rle.length; i += 2) {
      data.fill(m.rle[i], p, p + m.rle[i + 1]);
      p += m.rle[i + 1];
    }
    return [mode, { w: m.w, h: m.h, data }];
  }),
);

export const GROUPS = DATA.pick.groups; // id ในแผนที่ → ชื่อกลุ่ม (id 0 = ผนัง/พื้น ไม่ใช่ของ)
export const POINTS = DATA.pick.pts; // จุดกลางของแต่ละชิ้น ใช้วางปุ่มสำหรับคนใช้คีย์บอร์ด
export const OBJECTS = DATA.obj; // ชื่อและคำอธิบายของของทั่วไปในห้อง

// หาว่าจุด (u, v) บนภาพเป็นของชิ้นไหน ถ้าโดนผนังข้าง ๆ ของชิ้นเล็ก (ปลั๊ก, เมาส์) ให้หาของที่ใกล้สุดในรัศมีราว 8px
export function objectAt(mode, u, v, cssWidth) {
  if (!(u >= 0 && u < 1 && v >= 0 && v < 1)) return null;
  const m = MAPS[mode];
  const px = Math.floor(u * m.w);
  const py = Math.floor(v * m.h);
  let id = m.data[py * m.w + px];
  if (!id) {
    const R = Math.max(1, Math.round(8 / (cssWidth / m.w)));
    let best = R * R + 1;
    for (let dy = -R; dy <= R; dy++) {
      for (let dx = -R; dx <= R; dx++) {
        const x = px + dx;
        const y = py + dy;
        const d = dx * dx + dy * dy;
        if (d < best && x >= 0 && y >= 0 && x < m.w && y < m.h && m.data[y * m.w + x]) {
          best = d;
          id = m.data[y * m.w + x];
        }
      }
    }
  }
  return id ? GROUPS[id - 1] : null;
}

// แปลงกรอบ [x0, y0, x1, y1] เป็น style ตำแหน่งแบบ % พร้อมขอบเผื่อ (pad เป็นสัดส่วนของความกว้างภาพ)
export function boxStyle([x0, y0, x1, y1], pad, ar) {
  return {
    left: `${(x0 - pad) * 100}%`,
    top: `${(y0 - pad * ar) * 100}%`,
    width: `${(x1 - x0 + pad * 2) * 100}%`,
    height: `${(y1 - y0 + pad * 2 * ar) * 100}%`,
  };
}

export function unionBox(boxes) {
  return [Math.min(...boxes.map((b) => b[0])), Math.min(...boxes.map((b) => b[1])), Math.max(...boxes.map((b) => b[2])), Math.max(...boxes.map((b) => b[3]))];
}
