import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const theme = { colors: { text: '#0F172A' } };

export default function AIChat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! Ask me anything about safety or travel.' },
  ]);
  const [input, setInput] = useState('');

  const send = () => {
    if (!input.trim()) return;
    setMessages((m) => [...m, { role: 'user', content: input }, { role: 'assistant', content: 'This is a demo response.' }]);
    setInput('');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #EEF4FF 0%, #FFFFFF 35%, #FFFFFF 100%)', paddingBottom: 100, color: theme.colors.text }}>
      <div style={{ maxWidth: 520, margin: '0 auto', padding: 20 }}>
        <h1 style={{ marginTop: 0 }}>AI Assistant</h1>
        <div style={{ background: '#fff', border: '1px solid #E6EAF2', borderRadius: 12, padding: 12, height: 420, overflow: 'auto' }}>
          {messages.map((m, i) => (
            <div key={i} style={{ marginBottom: 10, textAlign: m.role === 'user' ? 'right' : 'left' }}>
              <div style={{ display: 'inline-block', background: m.role === 'user' ? '#EEF4FF' : '#F8FAFC', border: '1px solid #E6EAF2', borderRadius: 10, padding: '8px 10px' }}>{m.content}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message" style={{ flex: 1, padding: 10, borderRadius: 10, border: '1px solid #E6EAF2' }} />
          <button onClick={send} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #E6EAF2', background: '#fff', cursor: 'pointer' }}>Send</button>
        </div>
      </div>

      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, background: '#FFFFFF', borderTop: '1px solid #E6EAF2', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: '10px 20px 14px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        <button style={tabStyle} onClick={() => navigate('/apphome')}><div style={iconStyle}>🏠</div><span style={textStyle}>Home</span></button>
        <button style={tabStyle} onClick={() => navigate('/services')}><div style={iconStyle}>🧭</div><span style={textStyle}>Services</span></button>
        <button style={tabStyle} onClick={() => navigate('/aichat')}><div style={iconStyle}>💬</div><span style={textStyle}>AI Chat</span></button>
        <button style={tabStyle} onClick={() => navigate('/profile')}><div style={iconStyle}>👤</div><span style={textStyle}>Profile</span></button>
      </div>
    </div>
  );
}

const tabStyle = { background: 'transparent', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 6, cursor: 'pointer' };
const iconStyle = { width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, background: '#F3F6FF' };
const textStyle = { fontSize: 12 };


