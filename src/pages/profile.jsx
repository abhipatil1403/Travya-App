import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #EEF4FF 0%, #FFFFFF 35%, #FFFFFF 100%)', paddingBottom: 100 }}>
      <div style={{ maxWidth: 520, margin: '0 auto', padding: 20 }}>
        <h1 style={{ marginTop: 0 }}>Profile</h1>
        <div style={{ background: '#fff', border: '1px solid #E6EAF2', borderRadius: 12, padding: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>John Doe</div>
          <div style={{ color: '#5B6472' }}>Phone: +91 98xxxxxx00</div>
          <div style={{ color: '#5B6472' }}>Email: johndoe@example.com</div>
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


