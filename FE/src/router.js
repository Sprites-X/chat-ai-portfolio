// router เล็ก ๆ ใช้ History API ของเบราว์เซอร์ ไม่ต้องลง library เพิ่ม
// บน Render, nginx ตอบ index.html ให้ทุก path อยู่แล้ว (try_files ... /index.html) จึงรีเฟรชหน้า /os หรือ /neural ได้
import { useEffect, useState } from 'react';

const listeners = new Set();

export function navigate(to) {
  const url = new URL(to, window.location.origin);
  if (url.pathname + url.search === window.location.pathname + window.location.search) return;
  window.history.pushState({}, '', url.pathname + url.search);
  listeners.forEach((fn) => fn());
  window.scrollTo(0, 0);
}

// คืน path ปัจจุบัน และ render ใหม่เมื่อเปลี่ยนหน้า (รวมถึงกดปุ่ม back ของเบราว์เซอร์)
export function useLocation() {
  const read = () => ({ path: window.location.pathname, query: new URLSearchParams(window.location.search) });
  const [loc, setLoc] = useState(read);
  useEffect(() => {
    const update = () => setLoc(read());
    listeners.add(update);
    window.addEventListener('popstate', update);
    return () => {
      listeners.delete(update);
      window.removeEventListener('popstate', update);
    };
  }, []);
  return loc;
}
