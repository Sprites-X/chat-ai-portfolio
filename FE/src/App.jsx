import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Layout, Server, Code, Send, Trash2, ExternalLink, Mail } from 'lucide-react';

const WELCOME = {
  role: 'assistant',
  text: 'สวัสดีครับ/ค่ะ พวกเรา **ByteMind** ยินดีต้อนรับครับ 🚀\n\nยินดีตอบคำถามเกี่ยวกับโปรเจกต์ ผลงาน หรือข้อมูลสมาชิกในกลุ่ม ลองกดปุ่มคำถามตัวอย่างด้านบนหรือพิมพ์ถามมาได้เลยครับ!'
};

// ส่งซ้ำเองตอน BE หลับ (Retry Logic นอก App)
async function sendWithRetry(message) {
  for (let i = 0; i < 6; i++) {
    try {
      const res = await axios.post('/api/chat', { message });
      if (typeof res.data?.reply === 'string') return res.data.reply;
    } catch (err) {
      if (err.response?.status === 400) throw err;
    }
    await new Promise((r) => setTimeout(r, 10000));
  }
  throw new Error('ระบบหลังบ้านใช้เวลาปลุกนานกว่าปกติ กรุณาลองส่งข้อความใหม่อีกครั้งนะครับ/ค่ะ');
}

export default function App() {
  const [activeTab, setActiveTab] = useState('portfolio');
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // เลื่อนลงล่างสุดอัตโนมัติเมื่อมีข้อความใหม่ (รองรับมือถือด้วย block: 'nearest')
  const bottomRef = useRef(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, loading]);

  // ข้อมูลสมาชิกรายคน (อัปเดตชื่อ-นามสกุลไทยครบ 3 คน)
  const teamMembers = [
    {
      name: 'วรรณพร แก้วหาวงศ์ (Wannaporn)',
      role: 'Frontend Developer',
      icon: Layout,
      skills: 'React, JavaScript, HTML/CSS, UI/UX, Component Design',
      desc: 'ตัวแม่เรื่องความสวยงาม ลุยทำหน้าเว็บ UI ทั้งหมด ทำปุ่ม ออกแบบการจัดวางคอมโพเนนต์ แล้วก็ทำหน้าแชทโต้ตอบให้เล่นง่ายสบายตา'
    },
    {
      name: 'พงศกร ศรีทอง (Phongsakon)',
      role: 'DevOps Engineer',
      icon: Server,
      skills: 'Docker, Nginx, GitHub Actions (CI/CD), Trivy, Render, Unit Test (node:test), Git/GitHub',
      desc: 'สร้าง repo กลุ่มและวางโครง BE/FE, ทำ Dockerfile ของ BE/FE + Nginx Proxy, เขียน pipeline GitHub Actions ให้ test → build → สแกนช่องโหว่ → deploy ขึ้น Render อัตโนมัติ (build เฉพาะฝั่งที่เปลี่ยน), เขียน test API, ตั้งกฎป้องกัน main และดูแลค่าลับ'
    },
    {
      name: 'ณัฐนิชา ภูสิงห์ (Natnicha)',
      role: 'Backend Developer',
      icon: Code,
      skills: 'Node.js, Express, Gemini API Integration, Automated Testing (node:test), RESTful API Design, Git/GitHub',
      desc: 'พัฒนาและดูแลระบบ Backend API (/api/chat) ทั้งหมด, เชื่อมต่อ Gemini API SDK, เขียนระบบสลับโมเดลอัตโนมัติ (Fallback Logic) เมื่อเจอ Error 429/500/503, จัดการระบบตอบรับสำรอง และเขียน Unit Test ให้ผ่านอัตโนมัติก่อนส่งโค้ด'
    }
  ];

  // ปุ่มล้างแชท
  const clearChat = () => {
    if (window.confirm('ล้างข้อความทั้งหมดในแชท?')) setMessages([WELCOME]);
  };

  const handleSendMessage = async (e, customText = null) => {
    if (e?.preventDefault) e.preventDefault();
    const messageToSend = customText || input;
    if (!messageToSend.trim() || loading) return;

    const userMessage = messageToSend;
    if (!customText) setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const reply = await sendWithRetry(userMessage);
      setMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text:
            error.response?.data?.error ||
            error.message ||
            'ขออภัยครับ/ค่ะ ระบบไม่สามารถตอบกลับได้ในขณะนี้ กรุณาลองใหม่อีกครั้งในภายหลัง'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = [
    'ขอทราบข้อมูลสมาชิกในกลุ่ม ByteMind หน่อยครับ',
    'จุดเด่นของโปรเจกต์นี้คืออะไร?',
    'ใครดูแลส่วน DevOps และ CI/CD Pipeline?'
  ];

  return (
    <div style={{ width: '100%', boxSizing: 'border-box', maxWidth: '1000px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      
      {/* Header & Tabs */}
      <header style={{ borderBottom: '2px solid #eee', paddingBottom: '15px', marginBottom: '20px' }}>
        <h1 style={{ margin: '0 0 10px 0', color: '#2c3e50', lineHeight: 1.2 }}>ByteMind · Chat AI Portfolio</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setActiveTab('portfolio')}
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'portfolio' ? '#3498db' : '#e0e0e0',
              color: activeTab === 'portfolio' ? '#fff' : '#333',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Portfolio
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'chat' ? '#3498db' : '#e0e0e0',
              color: activeTab === 'chat' ? '#fff' : '#333',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Chat AI Assistant
          </button>
        </div>
      </header>

      {/* TAB 1: PORTFOLIO */}
      {activeTab === 'portfolio' && (
        <main style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          {/* ข้อมูลภาพรวมกลุ่ม */}
          <section style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', borderLeft: '5px solid #3498db', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h2 style={{ marginTop: 0, color: '#2c3e50' }}>🚀 กลุ่ม ByteMind</h2>
            <p><strong>แนวคิด & จุดเด่น:</strong> ทำเว็บ Portfolio ที่ไม่ได้มีแค่อ่านประวัติเฉยๆ แต่ใส่ระบบแชท AI เข้าไปด้วย กิมมิคคืออยากให้คนที่เข้ามาดูเว็บ สามารถพิมพ์ถาม-ตอบเรื่องโปรเจกต์หรือถามข้อมูลสมาชิกในกลุ่มได้ตรงๆ เลย แถมหลังบ้านเซ็ตระบบ CI/CD กับ Docker ไว้แน่นเปรี๊ยะ ดันโค้ดปุ๊บเทสปั๊บ ระบบไม่รวนแน่นอน</p>
            <p><strong>ผลงานที่ทำร่วมกัน:</strong> เว็บ <em>Chat AI Portfolio</em> ช่วยกันลุยตั้งแต่ขึ้นโครง UI, เขียน API ยิงหา AI, ทำเทส จนถึงเอาขึ้นระบบจริงบน Cloud</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <p style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0, flexWrap: 'wrap' }}>
                <strong>ช่องทางติดต่อ:</strong>
                <a href="https://github.com/Sprites-X/chat-ai-portfolio" target="_blank" rel="noreferrer" style={{ color: '#3498db', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  GitHub: Sprites-X/chat-ai-portfolio <ExternalLink size={14} />
                </a>
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.9rem', color: '#555' }}>
                <a href="mailto:wannaporn.kaeo@bumail.net" style={{ color: '#3498db', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Mail size={14} /> wannaporn.kaeo@bumail.net
                </a>
                <a href="mailto:phongsakon.sith@bumail.net" style={{ color: '#3498db', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Mail size={14} /> phongsakon.sith@bumail.net
                </a>
                <a href="mailto:natnicha.phoo@bumail.net" style={{ color: '#3498db', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Mail size={14} /> natnicha.phoo@bumail.net
                </a>
              </div>
            </div>
          </section>

          {/* สมาชิกในกลุ่ม */}
          <section>
            <h2 style={{ color: '#2c3e50', marginBottom: '15px' }}>👥 สมาชิกในกลุ่ม</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {teamMembers.map((m, idx) => {
                const IconComponent = m.icon;
                return (
                  <div key={idx} style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px', background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <div style={{ background: '#ebf5fb', padding: '10px', borderRadius: '50%', color: '#3498db' }}>
                        <IconComponent size={24} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{m.name}</h3>
                        <span style={{ fontSize: '0.85rem', color: '#7f8c8d' }}>{m.role}</span>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: '8px' }}><strong>ทักษะ:</strong> {m.skills}</p>
                    <p style={{ fontSize: '0.9rem', color: '#555', margin: 0 }}><strong>หน้าที่ & ผลงาน:</strong> {m.desc}</p>
                  </div>
                );
              })}
            </div>
          </section>
        </main>
      )}

      {/* TAB 2: CHAT AI */}
      {activeTab === 'chat' && (
        <main style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '8px', padding: '20px' }}>
          {/* Header กล่องแชท + ปุ่มล้างแชท */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h2 style={{ margin: 0 }}>💬 Chat AI Assistant</h2>
            <button
              type="button"
              onClick={clearChat}
              disabled={loading || messages.length <= 1}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                background: '#fff',
                color: '#c0392b',
                cursor: 'pointer',
                opacity: loading || messages.length <= 1 ? 0.5 : 1
              }}
            >
              <Trash2 size={16} /> ล้างแชท
            </button>
          </div>

          {/* ปุ่มคำถามตัวอย่าง */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '15px' }}>
            {sampleQuestions.map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => handleSendMessage(e, q)}
                disabled={loading}
                style={{ fontSize: '0.8rem', padding: '6px 12px', background: '#f0f4f8', border: '1px solid #d0d7de', borderRadius: '15px', cursor: 'pointer' }}
              >
                💡 {q}
              </button>
            ))}
          </div>

          {/* กล่องข้อความ */}
          <div style={{ height: '400px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '6px', padding: '15px', background: '#fafafa', marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: msg.role === 'user' ? '#3498db' : '#fff',
                  color: msg.role === 'user' ? '#fff' : '#333',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  textAlign: 'left'
                }}
              >
                {msg.role === 'assistant' ? (
                  <ReactMarkdown>{String(msg.text)}</ReactMarkdown>
                ) : (
                  msg.text
                )}
              </div>
            ))}

            {loading && (
              <div style={{ alignSelf: 'flex-start', background: '#eee', padding: '8px 12px', borderRadius: '12px', fontSize: '0.85rem', color: '#666' }}>
                AI กำลังพิมพ์... (อาจใช้เวลาสูงสุด 1 นาทีหาก BE เพิ่งตื่น)
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* ฟอร์มส่งข้อความ */}
          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="พิมพ์ข้อความคำถามเกี่ยวกับ ByteMind..."
              maxLength={1000}
              disabled={loading}
              style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="ส่งข้อความ"
              style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', background: '#3498db', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', opacity: loading || !input.trim() ? 0.6 : 1 }}
            >
              <Send size={16} /> ส่ง
            </button>
          </form>
        </main>
      )}
    </div>
  );
}