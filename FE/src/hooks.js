import { useEffect, useState } from 'react';

// true/false ตาม media query และอัปเดตเมื่อจอเปลี่ยน (หมุนมือถือ, ย่อหน้าต่าง)
export function useMedia(query) {
  const [match, setMatch] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatch(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [query]);
  return match;
}

export function useViewport() {
  const read = () => [window.innerWidth, window.innerHeight];
  const [size, setSize] = useState(read);
  useEffect(() => {
    const update = () => setSize(read());
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return size;
}

export const useReducedMotion = () => useMedia('(prefers-reduced-motion: reduce)');

// อ่าน/เขียน localStorage แบบไม่พัง (บางเบราว์เซอร์ปิด storage ไว้)
export const storage = {
  get(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* storage ถูกปิด ไม่ต้องจำค่า */
    }
  },
};

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
