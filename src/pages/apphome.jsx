import React, { useState } from 'react';

// Simple in-file theme so this page is self-contained for UI-only demo
const theme = {
  colors: {
    background: '#F3F6FF',
    backgroundAlt: '#FFFFFF',
    surface: '#FFFFFF',
    text: '#0F172A',
    textSecondary: '#5B6472',
    primary: '#2563EB',
    secondary: '#7C3AED',
    success: '#16A34A',
    successGradientStart: '#22C55E',
    successGradientEnd: '#16A34A',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  spacing: {
    xs: 6,
    sm: 12,
    md: 16,
    lg: 20,
  },
  typography: {
    h1: { fontSize: 28, fontWeight: 700 },
    h2: { fontSize: 20, fontWeight: 700 },
    h3: { fontSize: 16, fontWeight: 700 },
    body: { fontSize: 14, fontWeight: 400 },
    caption: { fontSize: 12, fontWeight: 400 },
  },
};

export default function HomeScreen() {
  // Mock UI-only state
  const [isHotelsOpen, setIsHotelsOpen] = useState(false);
  const [alerts] = useState([
    { message: 'Heavy rainfall alert in your area. Travel with caution.' },
    { message: 'Construction ahead. Expect delays on the main route.' },
  ]);

  const safetyScore = 86;
  const isInSafeZone = true;
  const lat = 18.45487;
  const lng = 73.863923;

  const safetyFeatures = [
    {
      id: 1,
      title: 'Geo-fencing Alerts',
      description: 'Get notified when entering restricted zones',
      color: theme.colors.primary,
      onClick: () => window.alert('Geo-fencing: Coming soon')
    },
    {
      id: 2,
      title: 'AI Anomaly Detection',
      description: 'Monitor unusual patterns and activities',
      color: theme.colors.secondary,
      onClick: () => window.alert('AI Detection: Coming soon')
    },
    {
      id: 3,
      title: 'Safety Tips',
      description: 'Personalized safety recommendations',
      color: theme.colors.warning,
      onClick: () => window.alert('Safety Tips: Coming soon')
    },
    {
      id: 4,
      title: 'Emergency Contacts',
      description: 'Quick access to emergency services',
      color: theme.colors.error,
      onClick: () => window.alert('Emergency Contacts: Coming soon')
    },
  ];

  const hotels = [
    { name: 'Seaside Residency', area: 'Marine Drive', rating: 4.6 },
    { name: 'Cityscape Inn', area: 'Downtown', rating: 4.4 },
    { name: 'Green Leaf Hotel', area: 'Riverside', rating: 4.2 },
    { name: 'Sunset Suites', area: 'Old Town', rating: 4.1 },
    { name: 'Skyline Hotel', area: 'Business Bay', rating: 4.5 },
  ];

  const openDelivery = (provider) => {
    const urls = {
      blinkit: 'https://blinkit.com',
      zomato: 'https://www.zomato.com',
      swiggy: 'https://www.swiggy.com',
      uber: 'https://www.ubereats.com',
    };
    const url = urls[provider];
    if (url) window.open(url, '_blank');
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={{ flex: 1 }}>
            <div style={styles.badgeRow}>
              <div style={styles.badge}>
                <span style={styles.badgeDot} />
                <span style={styles.badgeText}>Safe Travel</span>
              </div>
            </div>
            <h1 style={styles.greeting}>Welcome back!</h1>
            <p style={styles.subtitle}>Plan smart. Travel safer.</p>
          </div>
          <button style={styles.weatherBtn} onClick={() => window.location.assign('/weather')} aria-label="Open Weather">
            ☁️
          </button>
        </div>

        {/* Safety Score */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={{ fontSize: 18 }}>📈</span>
            <span style={styles.cardTitle}>Live Safety Index</span>
          </div>
          <div style={styles.scoreValueWrap}>
            <span style={styles.scoreValue}>{safetyScore}</span>
          </div>
          <div style={styles.chipsRow}>
            <div style={{ ...styles.chip, background: hexWithAlpha(theme.colors.success, 0.12) }}>
              <span style={{ marginRight: 6 }}>🛡️</span>
              <span style={{ color: theme.colors.success }}>Safe Zone: {isInSafeZone ? 'Yes' : 'No'}</span>
            </div>
            <div style={{ ...styles.chip, background: hexWithAlpha(theme.colors.primary, 0.12) }}>
              <span style={{ marginRight: 6 }}>📍</span>
              <span style={{ color: theme.colors.primary }}>GPS Active</span>
            </div>
          </div>
          <p style={styles.cardNote}>Calculated from your current location, time, and environment signals</p>
        </div>

        {/* Safe Zone Card */}
        <div style={styles.safeZoneCard}>
          <div style={styles.safeZoneHeader}>
            <div style={styles.safeZoneIcon}>✅</div>
            <div>
              <div style={styles.safeZoneTitle}>Safe Zone</div>
              <div style={styles.safeZoneSubtitle}>You are in a safe area</div>
            </div>
          </div>
          <div style={styles.safeZoneBody}>
            <div style={styles.locationCol}>
              <div style={styles.locationLabel}>Latitude</div>
              <div style={styles.locationValue}>{lat.toFixed(6)}°</div>
            </div>
            <div style={styles.locationCol}>
              <div style={styles.locationLabel}>Longitude</div>
              <div style={styles.locationValue}>{lng.toFixed(6)}°</div>
            </div>
          </div>
          <div style={styles.safeZoneFooter}>
            <div style={styles.accuracy}>±30m accuracy</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={styles.detailBtn} onClick={() => window.alert('Details: Coming soon')}>👁️ Show Details</button>
              <button style={styles.copyBtn} onClick={() => navigator.clipboard.writeText(`${lat}, ${lng}`)}>📋 Copy</button>
            </div>
          </div>
        </div>

        {/* Emergency Button */}
        <div style={styles.emergencyWrap}>
          <button
            style={styles.emergencyBtn}
            onClick={() => {
              try {
                const list = JSON.parse(localStorage.getItem('travya_sos_events') || '[]');
                const ev = {
                  id: 'SOS-' + Date.now(),
                  name: 'You',
                  phone: '+91 xxxxxxxx',
                  lat,
                  lng,
                  ts: Date.now(),
                };
                const next = [...list, ev];
                localStorage.setItem('travya_sos_events', JSON.stringify(next));
                alert('SOS sent to nearby public and police');
              } catch (_) {
                alert('Unable to send SOS');
              }
            }}
          >Hold for SOS</button>
        </div>

        {/* Safety Features */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Safety Features</h2>
          <div style={styles.featuresGrid}>
            {safetyFeatures.map((f) => (
              <button key={f.id} style={styles.featureCard} onClick={f.onClick}>
                <div style={{ ...styles.featureIcon, background: hexWithAlpha(f.color, 0.15) }} />
                <div>
                  <div style={styles.featureTitle}>{f.title}</div>
                  <div style={styles.featureDesc}>{f.description}</div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Alerts */}
        {alerts.length > 0 && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Recent Alerts</h2>
            <div style={{ display: 'grid', gap: theme.spacing.sm }}>
              {alerts.map((a, i) => (
                <div key={i} style={styles.alertItem}>
                  <span style={{ marginRight: 10 }}>⚠️</span>
                  <span style={styles.alertText}>{a.message}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Sticky Footer (4 tabs) */}
      <div style={styles.footer}>
        <button style={styles.footerItem} onClick={() => window.location.assign('/apphome')}>
          <div style={styles.footerIcon}>🏠</div>
          <span style={styles.footerText}>Home</span>
        </button>
        <button style={styles.footerItem} onClick={() => window.location.assign('/services')}>
          <div style={styles.footerIcon}>🧭</div>
          <span style={styles.footerText}>Services</span>
        </button>
        <button style={styles.footerItem} onClick={() => window.location.assign('/aichat')}>
          <div style={styles.footerIcon}>💬</div>
          <span style={styles.footerText}>AI Chat</span>
        </button>
        <button style={styles.footerItem} onClick={() => window.location.assign('/profile')}>
          <div style={styles.footerIcon}>👤</div>
          <span style={styles.footerText}>Profile</span>
        </button>
      </div>

      {/* Hotels Overlay */}
      {isHotelsOpen && (
        <div style={styles.overlay}>
          <div style={styles.overlayBackdrop} onClick={() => setIsHotelsOpen(false)} />
          <div style={styles.overlayCard}>
            <div style={styles.overlayHeader}>
              <div style={styles.overlayTitle}>Nearby Hotels</div>
              <button style={styles.closeBtn} onClick={() => setIsHotelsOpen(false)}>✕</button>
            </div>
            <div style={{ maxHeight: 320, overflow: 'auto' }}>
              {hotels.map((h, idx) => (
                <div key={idx} style={styles.hotelItem}>
                  <div style={styles.hotelAvatar}>🛏️</div>
                  <div style={{ flex: 1 }}>
                    <div style={styles.hotelName}>{h.name}</div>
                    <div style={styles.hotelMeta}>{h.area}</div>
                  </div>
                  <div style={styles.ratingPill}>⭐ {h.rating}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function hexWithAlpha(hex, alpha) {
  // hex like #RRGGBB, alpha 0..1
  const bigint = parseInt(hex.replace('#', ''), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const styles = {
  page: {
    minHeight: '100vh',
    background: `linear-gradient(180deg, #EEF4FF 0%, #FFFFFF 35%, #FFFFFF 100%)`,
    color: theme.colors.text,
    paddingBottom: 120,
  },
  container: {
    maxWidth: 520,
    margin: '0 auto',
    padding: theme.spacing.lg,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: theme.spacing.md,
  },
  badgeRow: {
    display: 'flex',
    marginBottom: 6,
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 10px',
    borderRadius: 999,
    background: '#FFFFFF',
    boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: theme.colors.success,
    display: 'inline-block',
  },
  badgeText: {
    marginLeft: 8,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  greeting: {
    fontSize: theme.typography.h1.fontSize,
    fontWeight: theme.typography.h1.fontWeight,
    margin: 0,
    marginBottom: 2,
  },
  subtitle: {
    margin: 0,
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
  },
  weatherBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    border: '1px solid #E6EAF2',
    background: '#FFFFFF',
    color: theme.colors.primary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  card: {
    background: '#FFFFFF',
    border: '1px solid #E6EAF2',
    borderRadius: 16,
    padding: theme.spacing.lg,
    margin: `${theme.spacing.md}px 0`,
    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: theme.spacing.sm,
  },
  cardTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
  },
  scoreValueWrap: {
    height: 66,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  scoreValue: {
    fontSize: 52,
    fontWeight: 800,
    color: theme.colors.success,
  },
  chipsRow: {
    display: 'flex',
    gap: 10,
    marginBottom: theme.spacing.sm,
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 10px',
    borderRadius: 999,
  },
  cardNote: {
    margin: 0,
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption.fontSize,
    textAlign: 'center',
  },
  emergencyWrap: {
    display: 'flex',
    justifyContent: 'center',
    margin: `${theme.spacing.md}px 0`,
  },
  emergencyBtn: {
    background: theme.colors.error,
    color: '#fff',
    border: 'none',
    borderRadius: 999,
    padding: '14px 24px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  safeZoneCard: {
    background: 'linear-gradient(90deg, ' + theme.colors.successGradientStart + ' 0%, ' + theme.colors.successGradientEnd + ' 100%)',
    color: '#FFFFFF',
    borderRadius: 16,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.md,
    boxShadow: '0 8px 24px rgba(22,163,74,0.35)'
  },
  safeZoneHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: theme.spacing.md,
  },
  safeZoneIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    background: 'rgba(255,255,255,0.18)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
  },
  safeZoneTitle: {
    fontWeight: 700,
    fontSize: 18,
  },
  safeZoneSubtitle: {
    opacity: 0.9,
  },
  safeZoneBody: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    background: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    padding: theme.spacing.md,
  },
  locationCol: {},
  locationLabel: {
    fontSize: 12,
    opacity: 0.9,
  },
  locationValue: {
    fontWeight: 700,
    marginTop: 2,
  },
  safeZoneFooter: {
    marginTop: theme.spacing.sm,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accuracy: {
    fontSize: 12,
    opacity: 0.95,
  },
  detailBtn: {
    background: '#FFFFFF',
    color: theme.colors.text,
    border: '1px solid #FFFFFF',
    borderRadius: 999,
    padding: '8px 12px',
    cursor: 'pointer',
  },
  copyBtn: {
    background: '#FFFFFF',
    color: theme.colors.text,
    border: '1px solid #FFFFFF',
    borderRadius: 999,
    padding: '8px 12px',
    cursor: 'pointer',
  },
  section: {
    marginTop: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.h2.fontWeight,
    margin: 0,
    marginBottom: theme.spacing.md,
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: theme.spacing.sm,
  },
  featureCard: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    width: '100%',
    textAlign: 'left',
    background: '#FFFFFF',
    border: '1px solid #E6EAF2',
    borderRadius: 12,
    padding: theme.spacing.md,
    cursor: 'pointer',
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  featureTitle: {
    fontWeight: 600,
  },
  featureDesc: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  alertItem: {
    display: 'flex',
    alignItems: 'center',
    background: '#FFFFFF',
    border: '1px solid #E6EAF2',
    borderRadius: 12,
    padding: theme.spacing.md,
  },
  alertText: {
    color: theme.colors.text,
  },
  footer: {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 0,
    background: '#FFFFFF',
    borderTop: '1px solid #E6EAF2',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: '10px 20px 14px',
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 10,
  },
  footerItem: {
    background: 'transparent',
    border: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 6,
    cursor: 'pointer',
    color: theme.colors.text,
  },
  footerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
  },
  footerText: {
    fontSize: 12,
    color: theme.colors.text,
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    alignItems: 'flex-end',
    zIndex: 50,
  },
  overlayBackdrop: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
  },
  overlayCard: {
    background: theme.colors.surface,
    width: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTop: '1px solid #ffffff10',
    padding: '20px 20px 24px',
    boxShadow: '0 -12px 30px rgba(0,0,0,0.4)',
  },
  overlayHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  overlayTitle: {
    flex: 1,
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    border: '1px solid #ffffff10',
    background: theme.colors.surface,
    color: theme.colors.text,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  hotelItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: theme.colors.background,
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  hotelAvatar: {
    width: 36,
    height: 36,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: hexWithAlpha(theme.colors.primary, 0.15),
    fontSize: 16,
  },
  hotelName: {
    fontWeight: 600,
  },
  hotelMeta: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  ratingPill: {
    background: 'rgba(255,184,0,0.18)',
    borderRadius: 999,
    padding: '6px 10px',
    fontWeight: 700,
  },
};