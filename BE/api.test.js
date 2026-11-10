import React, { useState } from 'react';
import axios from 'axios';
import { MessageSquare, User, Send, Code, Server, Layout } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('portfolio');
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'สวัสดีครับ! มีอะไรให้ผมช่วยไหมครับ?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // ข้อมูลสมาชิกกลุ่ม 3 คน (ปรับเปลี่ยนชื่อได้เลย)
 const teamMembers = [
    { name: 'Wannaporn', role: 'Frontend Developer', icon: Layout, desc: 'พัฒนา UI/UX Portfolio และ Chat Interface' },
    { name: 'Phrongsakon', role: 'Backend & DevOps', icon: Server, desc: 'พัฒนา API Gateway และจัดการ CI/CD Deployment' },
    { name: 'Member Name', role: 'Fullstack / Data', icon: Code, desc: 'ดูแลส่วนข้อมูลและ Prompt Engineering' }
  ];
  
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const response = await axios.post('/api/chat', { message: userMessage });
      const reply = response.data.reply || response.data.message || 'ได้รับคำตอบจากเซิร์ฟเวอร์แล้ว';
      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
    } catch (error) {
      console.error('API Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
        <button 
          onClick={() => setActiveTab('portfolio')}
          style={{ 
            padding: '10px 20px', 
            cursor: 'pointer', 
            borderRadius: '6px', 
            border: 'none',
            background: activeTab === 'portfolio' ? '#0070f3' : '#f0f0f0',
            color: activeTab === 'portfolio' ? '#fff' : '#333',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <User size={18} /> Portfolio
        </button>
        <button 
          onClick={() => setActiveTab('chat')}
          style={{ 
            padding: '10px 20px', 
            cursor: 'pointer', 
            borderRadius: '6px', 
            border: 'none',
            background: activeTab === 'chat' ? '#0070f3' : '#f0f0f0',
            color: activeTab === 'chat' ? '#fff' : '#333',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <MessageSquare size={18} /> Chat AI
        </button>
      </div>

      {activeTab === 'portfolio' ? (
        <div>
          <h2>🚀 Group Project Portfolio</h2>
          <p>ยินดีต้อนรับสู่เว็บ Portfolio กลุ่ม สมาชิกผู้พัฒนาได้แก่:</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginTop: '20px' }}>
            {teamMembers.map((member, idx) => {
              const IconComp = member.icon;
              return (
                <div key={idx} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                  <IconComp size={40} color="#0070f3" style={{ marginBottom: '10px' }} />
                  <h3 style={{ margin: '5px 0' }}>{member.name}</h3>
                  <p style={{ fontWeight: 'bold', color: '#666', fontSize: '14px' }}>{member.role}</p>
                  <p style={{ fontSize: '12px', color: '#888' }}>{member.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div>
          <h2>💬 Chat AI Assistant</h2>
          <div style={{ height: '350px', border: '1px solid #ddd', borderRadius: '8px', padding: '15px', overflowY: 'auto', marginBottom: '15px', background: '#fafafa' }}>
            {messages.map((msg, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: '10px' }}>
                <div style={{ 
                  maxWidth: '70%', 
                  padding: '10px 14px', 
                  borderRadius: '12px',
                  background: msg.role === 'user' ? '#0070f3' : '#e9e9eb',
                  color: msg.role === 'user' ? '#fff' : '#000'
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && <div style={{ color: '#888', fontStyle: 'italic' }}>AI กำลังคิดคำตอบ...</div>}
          </div>
          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="พิมพ์ข้อความที่นี่..."
              style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
            />
            <button type="submit" disabled={loading} style={{ padding: '10px 20px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}