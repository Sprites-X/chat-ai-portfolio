import { storage } from '../hooks.js';

// กลางวันหรือกลางคืน: ใช้ค่าที่ผู้ใช้สลับไว้ล่าสุด ถ้าไม่มีก็ตามเวลาเครื่อง (6 โมงเช้า–6 โมงเย็น = กลางวัน)
// ใช้ร่วมกันระหว่างหน้าประตู (/) กับห้อง (/room) ภาพที่เห็นผ่านประตูจึงตรงกับห้องที่เดินเข้าไปเจอ
export const TOD_KEY = 'bytemind-room-tod';

export function initialTimeOfDay() {
  const saved = storage.get(TOD_KEY);
  if (saved === 'day' || saved === 'night') return saved;
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18 ? 'day' : 'night';
}
