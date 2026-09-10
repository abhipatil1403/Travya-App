import React from 'react';
import Navbar from './navbar';

const theme = {
  colors: {
    text: '#0F172A',
    textSecondary: '#5B6472',
    primary: '#2563EB',
    success: '#16A34A',
    warning: '#F59E0B',
    error: '#EF4444',
  },
};

const EFIRS = [
  { id: 'EFIR-2025-0012', tourist: 'Arjun Verma', phone: '+91 98xxxxxx45', lastActivity: 'Last seen: 18:35 near Ridge, Shimla', filedAt: 'Today, 19:05', status: 'open' },
  { id: 'EFIR-2025-0013', tourist: 'Neha Patel', phone: '+91 98xxxxxx76', lastActivity: 'Last seen: 17:10 near Mall Road', filedAt: 'Today, 18:00', status: 'open' },
  { id: 'EFIR-2025-0014', tourist: 'Kabir Singh', phone: '+91 98xxxxxx11', lastActivity: 'Last seen: Yesterday 22:40, Jakhu Hill', filedAt: 'Today, 09:15', status: 'closed' },
  { id: 'EFIR-2025-0015', tourist: 'Sara Khan', phone: '+91 98xxxxxx04', lastActivity: 'Last seen: Yesterday 21:20, Lakkar Bazar', filedAt: 'Today, 08:30', status: 'closed' },
];

export default function EFIRs() {
  return (
    <div style={styles.page}>
      <Navbar/>
      <section style={styles.heroSection}>
        <div style={styles.bgBase} />
        <div style={styles.bgBlobLeft} />
        <div style={styles.bgBlobRight} />
      </section>
      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <div style={styles.badge}>Auto eFIRs</div>
            <h1 style={styles.title}>Filed due to inactivity</h1>
            <div style={styles.sub}>These eFIRs were generated automatically when a tourist showed no movement.</div>
          </div>
        </header>

        <div style={styles.grid}>
          {EFIRS.map((e) => (
            <div key={e.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.idText}>{e.id}</div>
                <div style={styles.statusPill(e.status)}>{e.status === 'closed' ? 'eFIR Closed' : 'Open'}</div>
              </div>
              <div style={styles.line}><span style={styles.label}>Tourist</span><span style={styles.value}>{e.tourist}</span></div>
              <div style={styles.line}><span style={styles.label}>Phone</span><span style={styles.value}>{e.phone}</span></div>
              <div style={styles.line}><span style={styles.label}>Last Activity</span><span style={styles.value}>{e.lastActivity}</span></div>
              <div style={styles.line}><span style={styles.label}>Filed</span><span style={styles.value}>{e.filedAt}</span></div>
              <div style={styles.actions}>
                <a href="#" onClick={(ev) => ev.preventDefault()} style={styles.linkBtn}>View details</a>
                <a href={e.status === 'closed' ? '#' : `https://www.google.com/maps?q=31.105,77.173`} target="_blank" rel="noreferrer" style={styles.primaryBtn}>{e.status === 'closed' ? 'Case Solved' : 'Open in Maps'}</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: 'linear-gradient(180deg, #EEF4FF 0%, #FFFFFF 35%, #FFFFFF 100%)', color: theme.colors.text, paddingBottom: 80, overflowX: 'hidden' },
  heroSection: { position: 'relative' },
  bgBase: { position: 'absolute', inset: 0, zIndex: 0, background: 'linear-gradient(135deg, #F0F6FF 0%, #FFFFFF 60%, #FFF4F6 100%)' },
  bgBlobLeft: { position: 'absolute', top: -120, left: -120, width: 360, height: 360, borderRadius: 9999, background: 'rgba(125, 211, 252, 0.25)', filter: 'blur(60px)', zIndex: 0 },
  bgBlobRight: { position: 'absolute', bottom: -140, right: -140, width: 380, height: 380, borderRadius: 9999, background: 'rgba(251, 146, 60, 0.25)', filter: 'blur(70px)', zIndex: 0 },
  container: { maxWidth: 920, margin: '0 auto', padding: 20, marginTop: 64 },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' },
  badge: { display: 'inline-block', background: '#fff', border: '1px solid #E6EAF2', borderRadius: 999, padding: '6px 10px', color: theme.colors.textSecondary, fontSize: 12 },
  title: { margin: 0, marginTop: 8, fontSize: 22, fontWeight: 700 },
  sub: { color: theme.colors.textSecondary, marginTop: 4, fontSize: 12 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 },
  card: { background: '#fff', border: '1px solid #E6EAF2', borderRadius: 14, padding: 14, boxShadow: '0 8px 24px rgba(0,0,0,0.06)' },
  cardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  idText: { fontWeight: 700 },
  statusPill: (status) => ({ padding: '6px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, color: status === 'closed' ? theme.colors.success : '#B45309', background: status === 'closed' ? 'rgba(22,163,74,0.12)' : 'rgba(245,158,11,0.12)', border: `1px solid ${status === 'closed' ? '#86efac' : '#fde68a'}` }),
  line: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 6 },
  label: { fontSize: 12, color: theme.colors.textSecondary },
  value: { fontWeight: 600 },
  actions: { display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 12 },
  linkBtn: { padding: '8px 10px', borderRadius: 10, border: '1px solid #E6EAF2', background: '#fff', color: theme.colors.text, textDecoration: 'none' },
  primaryBtn: { padding: '8px 10px', borderRadius: 10, border: '1px solid #2563EB22', background: '#2563EB', color: '#fff', textDecoration: 'none' },
};


