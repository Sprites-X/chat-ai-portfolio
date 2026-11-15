import { Suspense, lazy, useEffect } from 'react';
import { useLocation } from './router.js';
import Entry from './entry/Entry.jsx';
import Room from './room/Room.jsx';

// หน้า OS กับ Neural โหลดแยกไฟล์ (โหลดเมื่อเปิดหน้านั้นจริง) หน้าแรกจึงโหลดเร็วขึ้น
const Os = lazy(() => import('./os/Os.jsx'));
const Neural = lazy(() => import('./neural/Neural.jsx'));

// 4 หน้าในแอปเดียว: ประตูกลางทุ่ง (/) → ห้อง (/room) → กดคอมไป ByteMind OS (/os) หรือกดโมเดลแก้วไปเครือข่ายทีม (/neural)
const ROUTES = {
  '/': { page: Entry, title: 'ByteMind · Chat AI Portfolio' },
  '/room': { page: Room, title: 'ห้องของทีม · ByteMind' },
  '/os': { page: Os, title: 'ByteMind OS · Chat AI Portfolio' },
  '/neural': { page: Neural, title: 'ByteMind Neural · Chat AI Portfolio' },
};

export default function App() {
  const { path, query } = useLocation();
  const route = ROUTES[path.replace(/\/+$/, '') || '/'] || ROUTES['/']; // /room/ กับ /room คือหน้าเดียวกัน
  const Page = route.page;

  useEffect(() => {
    document.title = route.title;
  }, [route]);

  // key = path ทำให้เปลี่ยนหน้าแล้วเริ่มหน้าใหม่สะอาด ๆ (เช่น กลับมาห้องแล้วภาพไม่ค้างตอนซูม)
  return (
    <Suspense fallback={<div className="page-loading" role="status">กำลังโหลด…</div>}>
      <Page key={path} query={query} />
    </Suspense>
  );
}
