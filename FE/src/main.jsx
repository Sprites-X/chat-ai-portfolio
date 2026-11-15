import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// หลัง deploy ไฟล์ JS ชุดเก่าหายไปจาก server ถ้าหน้าที่เปิดค้างไว้กดไปหน้า OS/Neural แล้วโหลดไฟล์เก่าไม่เจอ
// (nginx ตอบ 404) ให้โหลดหน้าใหม่เพื่อเอา index.html กับไฟล์ชุดล่าสุด
// กันวนโหลดไม่รู้จบ: ถ้าเพิ่งโหลดใหม่ไปไม่ถึง 10 วินาทีจะไม่โหลดซ้ำ
const RELOAD_KEY = 'bytemind-chunk-reload'
window.addEventListener('vite:preloadError', () => {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY)) || 0
    if (Date.now() - last < 10000) return
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
  } catch {
    return // storage ถูกปิด จำไม่ได้ว่าเคยโหลดใหม่ไปแล้วหรือยัง จึงไม่โหลดเอง
  }
  window.location.reload()
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
