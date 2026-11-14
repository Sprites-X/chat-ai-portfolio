import { createContext, useContext } from 'react';

// ของที่แอปใน OS ใช้ร่วมกัน: เปิดแอปอื่น, ส่งคำถามเข้าแชต, แถว chat_history ของรอบนี้, แจ้งเตือนสั้น ๆ ฯลฯ
export const OsContext = createContext(null);
export const useOs = () => useContext(OsContext);
