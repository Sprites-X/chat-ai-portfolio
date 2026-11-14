import { navigate } from './router.js';

// ลิงก์ภายในแอป: กดธรรมดาเปลี่ยนหน้าโดยไม่โหลดใหม่ แต่ Ctrl/Cmd+คลิกยังเปิดแท็บใหม่ได้
export function Link({ to, onClick, ...props }) {
  return (
    <a
      href={to}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        navigate(to);
      }}
      {...props}
    />
  );
}
