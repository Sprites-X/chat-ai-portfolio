import { useCallback, useRef, useState } from 'react';
import { sendWithRetry, errorText } from '../api.js';

export const WELCOME = {
  role: 'ai',
  text: 'สวัสดีครับ/ค่ะ พวกเรา **ByteMind** ยินดีต้อนรับ 🚀\n\nถามเรื่องโปรเจกต์ ผลงาน หรือข้อมูลสมาชิกในกลุ่มได้เลย ลองกดคำถามตัวอย่างด้านล่างก็ได้',
};

// สถานะแชตอยู่ที่ OS ไม่ได้อยู่ในหน้าต่างแชต แอปอื่น (team, terminal) จึงส่งคำถามเข้ามาได้ และปิดหน้าต่างแล้วข้อความไม่หาย
export function useChat({ onAnswer } = {}) {
  const [messages, setMessages] = useState([WELCOME]);
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const busyRef = useRef(false);

  const send = useCallback(
    async (text) => {
      const q = (text || '').trim();
      if (!q || busyRef.current) return;
      busyRef.current = true;
      setBusy(true);
      setRetry(0);
      setMessages((m) => [...m, { role: 'user', text: q }]);
      try {
        const reply = await sendWithRetry(q, (n) => setRetry(n));
        setMessages((m) => [...m, { role: 'ai', text: reply }]);
        onAnswer?.(q, reply);
      } catch (error) {
        setMessages((m) => [...m, { role: 'error', text: errorText(error) }]);
      } finally {
        busyRef.current = false;
        setBusy(false);
        setRetry(0);
      }
    },
    [onAnswer],
  );

  const clear = useCallback(() => setMessages([WELCOME]), []);
  return { messages, busy, retry, send, clear };
}
