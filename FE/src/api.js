import axios from 'axios';

// เรียก BE ผ่าน path สั้น /api/chat เสมอ บน Render nginx ส่งต่อไปที่ BE_URL ให้ (ดู nginx/default.conf.template)
// ส่งซ้ำเองตอน BE หลับ: BE แบบ Free หลับเมื่อไม่มีคนใช้ 15 นาที ตื่นช้าราว 1 นาที จึงลองใหม่ทุก 10 วินาที สูงสุด 6 ครั้ง
export async function sendWithRetry(message, onRetry) {
  for (let i = 0; i < 6; i++) {
    try {
      const res = await axios.post('/api/chat', { message });
      if (typeof res.data?.reply === 'string') return res.data.reply;
    } catch (err) {
      // 400 = ข้อความไม่ถูกต้อง (ว่าง/ยาวเกิน) ส่งซ้ำก็ไม่หาย แจ้งผู้ใช้ทันที
      if (err.response?.status === 400) throw err;
    }
    onRetry?.(i + 1);
    await new Promise((r) => setTimeout(r, 10000));
  }
  throw new Error('ระบบหลังบ้านใช้เวลาปลุกนานกว่าปกติ กรุณาลองส่งข้อความใหม่อีกครั้งนะครับ/ค่ะ');
}

// ข้อความ error ที่จะโชว์ในแชต: ใช้ข้อความจาก BE ก่อน ถ้าไม่มีค่อยใช้ของ axios
export const errorText = (error) => error.response?.data?.error || error.message || 'ส่งข้อความไม่สำเร็จ';

// ยิงครั้งเดียวไม่ส่งซ้ำ ใช้ใน terminal ที่อยากเห็น status code จริง (เช่น 400)
export async function postChatOnce(body) {
  try {
    const res = await axios.post('/api/chat', body, { validateStatus: () => true });
    return { status: res.status, data: res.data };
  } catch (err) {
    return { status: 0, data: { error: err.message } };
  }
}
