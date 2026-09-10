import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from './navbar';
import { listTourists, getLatestTimelineCoords, getLocalDuplicateByAuthId } from '../lib/db';
import { supabase } from '../lib/supabase';

const theme = {
  colors: {
    text: '#0F172A',
    textSecondary: '#5B6472',
    primary: '#2563EB',
    success: '#16A34A',
    error: '#EF4444',
    warning: '#F59E0B',
  },
  spacing: { xs: 6, sm: 12, md: 16, lg: 20 },
};

export default function PublicDashboard() {
  const [accessState, setAccessState] = useState('loading'); // 'loading' | 'not_logged_in' | 'access_denied' | 'pending_verification' | 'allowed'
  const [activeTab, setActiveTab] = useState('alerts');
  const [selectedId, setSelectedId] = useState(null);
  const [events, setEvents] = useState(() => loadEvents());
  const [nowTs, setNowTs] = useState(Date.now());
  const historyEvents = [
    { id: 'PH-1201', name: 'Expired SOS - Rahul', lat: 31.1051, lng: 77.1711, ts: Date.now() - 1000 * 60 * 90 },
    { id: 'PH-1202', name: 'Expired SOS - Anita', lat: 31.1064, lng: 77.1760, ts: Date.now() - 1000 * 60 * 60 * 18 },
  ];
  const mapRef = useRef(null);
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 });
  const cardsRef = useRef({});

  // Shimla-ish bounds (same as police for parity)
  const bounds = useMemo(() => ({ minLat: 31.1015, maxLat: 31.1085, minLng: 77.1685, maxLng: 77.1785 }), []);

  const projectToMap = (lat, lng, width, height) => {
    const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * width;
    const y = (1 - (lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * height;
    return { x, y };
  };

  // Access control: only verified local volunteers can see alerts
  useEffect(() => {
    let cancelled = false;
    async function checkAccess() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.email) {
          if (!cancelled) setAccessState('not_logged_in');
          return;
        }
        const role = session?.user?.user_metadata?.role || localStorage.getItem('role') || '';
        if (role !== 'local') {
          if (!cancelled) setAccessState('access_denied');
          return;
        }
        const localRecord = await getLocalDuplicateByAuthId(session.user.id);
        if (!localRecord) {
          if (!cancelled) setAccessState('access_denied');
          return;
        }
        if (!localRecord.verification_status) {
          if (!cancelled) setAccessState('pending_verification');
          return;
        }
        if (!cancelled) setAccessState('allowed');
      } catch (_) {
        if (!cancelled) setAccessState('not_logged_in');
      }
    }
    checkAccess();
    return () => { cancelled = true; };
  }, []);

  // Merge local SOS with server-side emergencies; refresh every 5 seconds
  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      try {
        const [list, timelineCoords] = await Promise.all([
          listTourists(),
          getLatestTimelineCoords() // Use the new function that properly matches user_id with email
        ]);
        const emergencies = (list || []).filter(t => t.emergency_active === true || t.emergency_active === 'true' || t.emergency_active === 1);
        const startMap = loadEmergencyStartMap();
        const mapped = emergencies.map(t => {
          const timelineEntry = timelineCoords[t.id];
          const hasRealCoords = t.last_lat != null && t.last_lng != null && !Number.isNaN(Number(t.last_lat)) && !Number.isNaN(Number(t.last_lng));
          const lat = hasRealCoords ? Number(t.last_lat) : (timelineEntry?.latitude ?? 31.105);
          const lng = hasRealCoords ? Number(t.last_lng) : (timelineEntry?.longitude ?? 77.173);
          return {
            id: `EM-${t.id}`,
            touristId: t.id,
            name: t.fullname || 'Tourist',
            phone: t.phoneno || '',
            email: t.email || '',
            lat,
            lng,
            ts: startMap[`EM-${t.id}`] || Date.now()
          };
        });
        let changed = false; for (const m of mapped) { if (!startMap[m.id]) { startMap[m.id] = m.ts; changed = true; } }
        if (changed) saveEmergencyStartMap(startMap);
        const local = loadEvents();
        const combined = [...local, ...mapped].slice(-20);
        if (!cancelled) setEvents(combined);
      } catch (_) {
        // keep local events only on error
        if (!cancelled) setEvents(loadEvents());
      }
    }
    // initial and 5-second interval
    refresh();
    const onStorage = (e) => {
      if (e.key !== 'travya_sos_events') return;
      try {
        const raw = localStorage.getItem('travya_sos_events') || '[]';
        const parsed = JSON.parse(raw);
        const local = Array.isArray(parsed) ? parsed : [];
        setEvents(prev => [...local, ...(prev || []).filter(x => String(x?.id || '').startsWith('EM-'))].slice(-20));
      } catch (_) {}
    };
    window.addEventListener('storage', onStorage);
    const iv = setInterval(refresh, 5000);
    return () => { cancelled = true; window.removeEventListener('storage', onStorage); clearInterval(iv); };
  }, []);

  // 1s ticker for timers
  useEffect(() => {
    const iv = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  // Map size observer
  useEffect(() => {
    const el = mapRef.current; if (!el) return;
    const update = () => setMapSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    const ro = new ResizeObserver(update); ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const onPinClick = (id) => {
    setSelectedId(id);
    const el = cardsRef.current[id];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Access-gated content
  if (accessState === 'loading') {
    return (
      <div style={styles.page}>
        <Navbar/>
        <div style={styles.container}>
          <div style={{ textAlign: 'center', padding: 60, color: theme.colors.textSecondary }}>Checking access...</div>
        </div>
      </div>
    );
  }
  if (accessState === 'not_logged_in') {
    return (
      <div style={styles.page}>
        <Navbar/>
        <section style={styles.heroSection}>
          <div style={styles.bgBase} />
          <div style={styles.bgBlobLeft} />
          <div style={styles.bgBlobRight} />
        </section>
        <div style={styles.container}>
          <div style={styles.gateCard}>
            <div style={styles.gateTitle}>Log in required</div>
            <div style={styles.gateSub}>Please log in to view local volunteer alerts.</div>
            <Link to="/signin" style={styles.gateBtn}>Log in</Link>
          </div>
        </div>
      </div>
    );
  }
  if (accessState === 'access_denied') {
    return (
      <div style={styles.page}>
        <Navbar/>
        <section style={styles.heroSection}>
          <div style={styles.bgBase} />
          <div style={styles.bgBlobLeft} />
          <div style={styles.bgBlobRight} />
        </section>
        <div style={styles.container}>
          <div style={styles.gateCard}>
            <div style={{ ...styles.gateTitle, color: theme.colors.error }}>Access denied</div>
            <div style={styles.gateSub}>Only verified local volunteers can view this page. If you are a local, log in with your local account.</div>
            <Link to="/signin" style={styles.gateBtn}>Log in</Link>
          </div>
        </div>
      </div>
    );
  }
  if (accessState === 'pending_verification') {
    return (
      <div style={styles.page}>
        <Navbar/>
        <section style={styles.heroSection}>
          <div style={styles.bgBase} />
          <div style={styles.bgBlobLeft} />
          <div style={styles.bgBlobRight} />
        </section>
        <div style={styles.container}>
          <div style={styles.gateCard}>
            <div style={{ ...styles.gateTitle, color: theme.colors.warning }}>Pending verification</div>
            <div style={styles.gateSub}>Your application is under review. Only verified locals can view alerts. You will get access after police verification.</div>
          </div>
        </div>
      </div>
    );
  }

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
            <div style={styles.badge}>Local Dashboard</div>
            <h1 style={styles.title}>Live SOS from Nearby Tourists</h1>
            <div style={styles.sub}>View and respond to alerts in your area.</div>
          </div>
          <div style={styles.tabGroup}>
            <button style={{ ...styles.tabBtn, ...(activeTab === 'alerts' ? styles.tabActive : {}) }} onClick={() => setActiveTab('alerts')}>Alerts</button>
            <button style={{ ...styles.tabBtn, ...(activeTab === 'map' ? styles.tabActive : {}) }} onClick={() => setActiveTab('map')}>Map</button>
            <button style={{ ...styles.tabBtn, ...(activeTab === 'history' ? styles.tabActive : {}) }} onClick={() => setActiveTab('history')}>History</button>
            <a href="/report" style={{ ...styles.tabBtn, textDecoration: 'none' }}>Report</a>
          </div>
        </header>

        {/* Live SOS banner + list
        {events.length > 0 && (
          <div style={styles.sosWrap}>
            <div style={styles.sosBanner}>
              <div style={styles.sosDot} />
              <div style={{ flex: 1 }}>
                <div style={styles.sosTitle}>Live SOS</div>
                <div style={styles.sosMeta}>Most recent at {new Date(events[events.length - 1].ts).toLocaleTimeString()}</div>
              </div>
              <a href={`https://www.google.com/maps?q=${events[events.length - 1].lat},${events[events.length - 1].lng}`} target="_blank" rel="noreferrer" style={styles.sosLink}>Open Map</a>
            </div>
            <div style={styles.sosList}>
              {events.slice(-5).reverse().map((ev) => (
                <div key={ev.id} style={styles.sosItem} onClick={() => { setActiveTab('map'); setSelectedId(ev.id); }}>
                  <div style={styles.sosTime}>{new Date(ev.ts).toLocaleTimeString()}</div>
                  <div style={{ flex: 1 }}>
                    <div style={styles.sosName}>{ev.name || 'Tourist'} • {ev.phone || ''}</div>
                    <div style={styles.sosCoords}>{ev.lat === '-' ? '-' : Number(ev.lat).toFixed(5)}, {ev.lng === '-' ? '-' : Number(ev.lng).toFixed(5)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )} */}

        {events.length > 0 && (
          <div style={styles.priorityCard}>
            <div style={styles.priorityHeader}>
              <div style={styles.priorityBadge}>Priority • SOS</div>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {events.map((r) => {
                const startedAt = getStartTs(r);
                return (
                  <div key={r.id} style={{ ...styles.priorityBody, padding: 8, borderRadius: 10 }} onClick={() => { setActiveTab('map'); setSelectedId(r.id); }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={styles.priorityAvatar}>🆘</div>
                      <div>
                        <div style={styles.priorityName}>{r.name || 'Tourist'}</div>
                        <div style={styles.priorityMeta}>At {new Date(startedAt).toLocaleTimeString()} • {r.phone || '+91 xxxxxxxx'}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <div style={styles.priorityCoords}>{Number(r.lat).toFixed(5)}, {Number(r.lng).toFixed(5)}</div>
                      <a href={`https://www.google.com/maps?q=${r.lat},${r.lng}`} target="_blank" rel="noreferrer" style={{ ...styles.linkBtn, textDecoration: 'none' }} onClick={(e) => e.stopPropagation()}>Open in Maps</a>
                      <button style={styles.helpBtn} onClick={(e) => e.stopPropagation()}>Offer Help</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* {activeTab === 'alerts' && (
          <div style={{ marginTop: 12 }}>
            {events.length === 0 ? (
              <div style={{ padding: 24, background: '#F8FAFC', borderRadius: 12, color: theme.colors.textSecondary, textAlign: 'center' }}>
                No active alerts. When a tourist raises an emergency (SOS), they will appear here so you can see their location and offer help.
              </div>
            ) : (
              <div style={styles.grid}>
                {events.map((ev) => {
                  const hasCoords = ev.lat != null && ev.lng != null && !Number.isNaN(Number(ev.lat)) && !Number.isNaN(Number(ev.lng));
                  return (
                    <div key={ev.id} ref={(el) => (cardsRef.current[ev.id] = el)} style={{ ...styles.card, outline: selectedId === ev.id ? `2px solid ${theme.colors.primary}` : 'none', borderColor: theme.colors.error }} onClick={() => setSelectedId(ev.id)}>
                      <div style={styles.cardHeader}>
                        <div style={{ ...styles.dot, background: theme.colors.error }} />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={styles.cardTitle}>🆘 {ev.name || 'Tourist'}</div>
                          <div style={styles.cardSub}>Alert at {new Date(ev.ts).toLocaleTimeString()}</div>
                          {(ev.phone || ev.email) && (
                            <div style={{ fontSize: 12, color: theme.colors.textSecondary, marginTop: 4 }}>
                              {ev.phone || ''} {ev.phone && ev.email ? '• ' : ''} {ev.email || ''}
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={styles.coordsRow}>
                        <div>
                          <div style={styles.coordLabel}>Latitude</div>
                          <div style={styles.coordValue}>{hasCoords ? Number(ev.lat).toFixed(6) + '°' : '—'}</div>
                        </div>
                        <div>
                          <div style={styles.coordLabel}>Longitude</div>
                          <div style={styles.coordValue}>{hasCoords ? Number(ev.lng).toFixed(6) + '°' : '—'}</div>
                        </div>
                      </div>
                      <div style={{ ...styles.actionsRow, flexWrap: 'wrap', gap: 8 }}>
                        {hasCoords && (
                          <a href={`https://www.google.com/maps?q=${ev.lat},${ev.lng}`} target="_blank" rel="noreferrer" style={styles.linkBtn} onClick={(e) => e.stopPropagation()}>Open in Maps</a>
                        )}
                        <button style={styles.primaryBtn} onClick={(e) => e.stopPropagation()}>Offer Help</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )} */}

        {activeTab === 'map' && (
          <div style={styles.mapCard}>
            <div style={styles.mapHeader}>Live SOS Map – tap pin then use Open in Maps to navigate</div>
            <div style={styles.mapCanvas} ref={mapRef}>
              {events.filter((ev) => ev.lat != null && ev.lng != null && !Number.isNaN(Number(ev.lat)) && !Number.isNaN(Number(ev.lng))).map((ev) => {
                const { x, y } = projectToMap(Number(ev.lat), Number(ev.lng), mapSize.width || 900, mapSize.height || 380);
                return (
                  <button key={ev.id} title={`SOS: ${ev.name || 'Tourist'} – Open in Maps to go to location`} onClick={() => onPinClick(ev.id)} style={{ ...styles.pin, left: x, top: y, width: 18, height: 18, background: theme.colors.error, boxShadow: '0 0 0 8px rgba(239,68,68,0.18)', transform: selectedId === ev.id ? 'translate(-50%, -50%) scale(1.2)' : 'translate(-50%, -50%)' }} />
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div style={styles.grid}>
            {historyEvents.map((ev) => (
              <div key={ev.id} style={{ ...styles.card, opacity: 0.6 }}>
                <div style={styles.cardHeader}>
                  <div style={{ ...styles.dot, background: '#9CA3AF' }} />
                  <div>
                    <div style={styles.cardTitle}>{ev.name}</div>
                    <div style={styles.cardSub}>Expired • {new Date(ev.ts).toLocaleString()}</div>
                  </div>
                </div>
                <div style={styles.coordsRow}>
                  <div>
                    <div style={styles.coordLabel}>Latitude</div>
                    <div style={styles.coordValue}>{ev.lat.toFixed(6)}°</div>
                  </div>
                  <div>
                    <div style={styles.coordLabel}>Longitude</div>
                    <div style={styles.coordValue}>{ev.lng.toFixed(6)}°</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function loadEvents() {
  try {
    const raw = localStorage.getItem('travya_sos_events');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.slice(-20); // keep recent 20
    return [];
  } catch (_) {
    return [];
  }
}

function loadEmergencyStartMap() {
  try {
    const raw = localStorage.getItem('travya_em_start');
    return raw ? (JSON.parse(raw) || {}) : {};
  } catch (_) { return {}; }
}

function saveEmergencyStartMap(map) {
  try { localStorage.setItem('travya_em_start', JSON.stringify(map)); } catch (_) {}
}

function getStartTs(ev) {
  if (!ev) return Date.now();
  if (String(ev.id).startsWith('EM-')) {
    const map = loadEmergencyStartMap();
    return map[ev.id] || ev.ts || Date.now();
  }
  return ev.ts || Date.now();
}

function formatDuration(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = String(Math.floor(total / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function formatCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = String(Math.floor(total / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${m}:${s}`;
}

const styles = {
  page: { minHeight: '100vh', background: 'linear-gradient(180deg, #EEF4FF 0%, #FFFFFF 35%, #FFFFFF 100%)', color: theme.colors.text, paddingBottom: 80, overflowX: 'hidden' },
  heroSection: { position: 'relative' },
  bgBase: { position: 'absolute', inset: 0, zIndex: 0, background: 'linear-gradient(135deg, #F0F6FF 0%, #FFFFFF 60%, #FFF4F6 100%)' },
  bgBlobLeft: { position: 'absolute', top: -120, left: -120, width: 360, height: 360, borderRadius: 9999, background: 'rgba(125, 211, 252, 0.25)', filter: 'blur(60px)', zIndex: 0 },
  bgBlobRight: { position: 'absolute', bottom: -140, right: -140, width: 380, height: 380, borderRadius: 9999, background: 'rgba(251, 146, 60, 0.25)', filter: 'blur(70px)', zIndex: 0 },
  container: { maxWidth: 920, margin: '0 auto', padding: 20, marginTop: 64 },
  gateCard: { background: '#fff', border: '1px solid #E6EAF2', borderRadius: 16, padding: 40, textAlign: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' },
  gateTitle: { fontSize: 20, fontWeight: 700, color: theme.colors.text },
  gateSub: { marginTop: 12, color: theme.colors.textSecondary, maxWidth: 400, margin: '12px auto 0' },
  gateBtn: { display: 'inline-block', marginTop: 20, padding: '12px 24px', borderRadius: 10, background: theme.colors.primary, color: '#fff', fontWeight: 600, textDecoration: 'none' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' },
  badge: { display: 'inline-block', background: '#fff', border: '1px solid #E6EAF2', borderRadius: 999, padding: '6px 10px', color: theme.colors.textSecondary, fontSize: 12 },
  title: { margin: 0, marginTop: 8, fontSize: 22, fontWeight: 700 },
  sub: { color: theme.colors.textSecondary, marginTop: 4, fontSize: 12 },
  tabGroup: { display: 'flex', gap: 8 },
  tabBtn: { background: '#fff', border: '1px solid #E6EAF2', padding: '8px 12px', borderRadius: 10, cursor: 'pointer', color: theme.colors.textSecondary },
  tabActive: { color: theme.colors.primary, borderColor: theme.colors.primary, background: '#EEF4FF' },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 },
  card: { background: '#fff', border: '1px solid #E6EAF2', borderRadius: 14, padding: 14, boxShadow: '0 8px 24px rgba(0,0,0,0.06)', cursor: 'pointer' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 },
  dot: { width: 14, height: 14, borderRadius: 999 },
  cardTitle: { fontWeight: 700 },
  cardSub: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 2 },
  coordsRow: { display: 'flex', justifyContent: 'space-between', marginTop: 10 },
  coordLabel: { fontSize: 12, color: theme.colors.textSecondary },
  coordValue: { fontWeight: 700, marginTop: 2 },
  actionsRow: { display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 12 },
  linkBtn: { padding: '8px 10px', borderRadius: 10, border: '1px solid #E6EAF2', background: '#fff', color: theme.colors.text },
  primaryBtn: { padding: '8px 10px', borderRadius: 10, border: '1px solid #2563EB22', background: '#2563EB', color: '#fff' },
  helpBtn: { padding: '8px 10px', borderRadius: 10, border: '1px solid #16A34A22', background: '#16A34A', color: '#fff', cursor: 'pointer' },

  priorityCard: { background: '#FFF1F2', border: '1px solid #FECACA', borderRadius: 14, padding: 12, marginBottom: 12 },
  priorityHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  priorityBadge: { fontSize: 12, fontWeight: 700, color: '#B91C1C' },
  priorityTimer: { fontWeight: 700, color: '#B91C1C' },
  priorityBody: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  priorityAvatar: { width: 36, height: 36, borderRadius: 10, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  priorityName: { fontWeight: 700 },
  priorityMeta: { fontSize: 12, color: theme.colors.textSecondary },
  priorityCoords: { fontWeight: 700 },

  mapCard: { background: '#fff', border: '1px solid #E6EAF2', borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' },
  mapHeader: { padding: 14, borderBottom: '1px solid #E6EAF2', fontWeight: 700 },
  mapCanvas: { position: 'relative', width: '100%', height: 380, background: "url('https://maps.wikimedia.org/img/osm-intl,13,77.2090,28.6139,900x380.png') center/cover no-repeat, linear-gradient(135deg, #E5EEFF, #F8FBFF)", overflow: 'hidden' },
  pin: { position: 'absolute', width: 14, height: 14, borderRadius: 999, border: '2px solid #fff' },
};




//           <div style={styles.mapCard}>

//             <div style={styles.mapHeader}>Live SOS Map (static image)</div>

//             <div style={styles.mapCanvas} ref={mapRef}>

//               {events.map((ev) => {

//                 const { x, y } = projectToMap(Number(ev.lat), Number(ev.lng), mapSize.width || 900, mapSize.height || 380);

//                 return (

//                   <button key={ev.id} title={`SOS: ${ev.name || 'Tourist'}`} onClick={() => onPinClick(ev.id)} style={{ ...styles.pin, left: x, top: y, width: 18, height: 18, background: theme.colors.error, boxShadow: '0 0 0 8px rgba(239,68,68,0.18)', transform: selectedId === ev.id ? 'translate(-50%, -50%) scale(1.2)' : 'translate(-50%, -50%)' }} />

//                 );

//               })}

//             </div>

//           </div>

//         )}



//         {activeTab === 'history' && (

//           <div style={styles.grid}>

//             {historyEvents.map((ev) => (

//               <div key={ev.id} style={{ ...styles.card, opacity: 0.6 }}>

//                 <div style={styles.cardHeader}>

//                   <div style={{ ...styles.dot, background: '#9CA3AF' }} />

//                   <div>

//                     <div style={styles.cardTitle}>{ev.name}</div>

//                     <div style={styles.cardSub}>Expired • {new Date(ev.ts).toLocaleString()}</div>

//                   </div>

//                 </div>

//                 <div style={styles.coordsRow}>

//                   <div>

//                     <div style={styles.coordLabel}>Latitude</div>

//                     <div style={styles.coordValue}>{ev.lat.toFixed(6)}°</div>

//                   </div>

//                   <div>

//                     <div style={styles.coordLabel}>Longitude</div>

//                     <div style={styles.coordValue}>{ev.lng.toFixed(6)}°</div>

//                   </div>

//                 </div>

//               </div>

//             ))}

//           </div>

//         )}

//       </div>

//     </div>

//   );

// }



// function loadEvents() {

//   try {

//     const raw = localStorage.getItem('travya_sos_events');

//     if (!raw) return [];

//     const parsed = JSON.parse(raw);

//     if (Array.isArray(parsed)) return parsed.slice(-20); // keep recent 20

//     return [];

//   } catch (_) {

//     return [];

//   }

// }


// function loadEmergencyStartMap() {
//   try {
//     const raw = localStorage.getItem('travya_em_start');
//     return raw ? (JSON.parse(raw) || {}) : {};
//   } catch (_) { return {}; }
// }

// function saveEmergencyStartMap(map) {
//   try { localStorage.setItem('travya_em_start', JSON.stringify(map)); } catch (_) {}
// }

// function getStartTs(ev) {
//   if (!ev) return Date.now();
//   if (String(ev.id).startsWith('EM-')) {
//     const map = loadEmergencyStartMap();
//     return map[ev.id] || ev.ts || Date.now();
//   }
//   return ev.ts || Date.now();
// }

// function formatDuration(ms) {
//   const total = Math.max(0, Math.floor(ms / 1000));
//   const m = String(Math.floor(total / 60)).padStart(2, '0');
//   const s = String(total % 60).padStart(2, '0');
//   return `${m}:${s}`;
// }


// const styles = {

//   page: { minHeight: '100vh', background: 'linear-gradient(180deg, #EEF4FF 0%, #FFFFFF 35%, #FFFFFF 100%)', color: theme.colors.text, paddingBottom: 80, overflowX: 'hidden' },

//   heroSection: { position: 'relative' },

//   bgBase: { position: 'absolute', inset: 0, zIndex: 0, background: 'linear-gradient(135deg, #F0F6FF 0%, #FFFFFF 60%, #FFF4F6 100%)' },

//   bgBlobLeft: { position: 'absolute', top: -120, left: -120, width: 360, height: 360, borderRadius: 9999, background: 'rgba(125, 211, 252, 0.25)', filter: 'blur(60px)', zIndex: 0 },

//   bgBlobRight: { position: 'absolute', bottom: -140, right: -140, width: 380, height: 380, borderRadius: 9999, background: 'rgba(251, 146, 60, 0.25)', filter: 'blur(70px)', zIndex: 0 },

//   container: { maxWidth: 920, margin: '0 auto', padding: 20, marginTop: 64 },

//   header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' },

//   badge: { display: 'inline-block', background: '#fff', border: '1px solid #E6EAF2', borderRadius: 999, padding: '6px 10px', color: theme.colors.textSecondary, fontSize: 12 },

//   title: { margin: 0, marginTop: 8, fontSize: 22, fontWeight: 700 },

//   sub: { color: theme.colors.textSecondary, marginTop: 4, fontSize: 12 },

//   tabGroup: { display: 'flex', gap: 8 },

//   tabBtn: { background: '#fff', border: '1px solid #E6EAF2', padding: '8px 12px', borderRadius: 10, cursor: 'pointer', color: theme.colors.textSecondary },

//   tabActive: { color: theme.colors.primary, borderColor: theme.colors.primary, background: '#EEF4FF' },



//   grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 },

//   card: { background: '#fff', border: '1px solid #E6EAF2', borderRadius: 14, padding: 14, boxShadow: '0 8px 24px rgba(0,0,0,0.06)', cursor: 'pointer' },

//   cardHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 },

//   dot: { width: 14, height: 14, borderRadius: 999 },

//   cardTitle: { fontWeight: 700 },

//   cardSub: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 2 },

//   coordsRow: { display: 'flex', justifyContent: 'space-between', marginTop: 10 },

//   coordLabel: { fontSize: 12, color: theme.colors.textSecondary },

//   coordValue: { fontWeight: 700, marginTop: 2 },

//   actionsRow: { display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 12 },

//   linkBtn: { padding: '8px 10px', borderRadius: 10, border: '1px solid #E6EAF2', background: '#fff', color: theme.colors.text },

//   primaryBtn: { padding: '8px 10px', borderRadius: 10, border: '1px solid #2563EB22', background: '#2563EB', color: '#fff' },

//   helpBtn: { padding: '8px 10px', borderRadius: 10, border: '1px solid #16A34A22', background: '#16A34A', color: '#fff', cursor: 'pointer' },

//   priorityCard: { background: '#FFF1F2', border: '1px solid #FECACA', borderRadius: 14, padding: 12, marginBottom: 12 },
//   priorityHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
//   priorityBadge: { fontSize: 12, fontWeight: 700, color: '#B91C1C' },
//   priorityTimer: { fontWeight: 700, color: '#B91C1C' },
//   priorityBody: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
//   priorityAvatar: { width: 36, height: 36, borderRadius: 10, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' },
//   priorityName: { fontWeight: 700 },
//   priorityMeta: { fontSize: 12, color: theme.colors.textSecondary },
//   priorityCoords: { fontWeight: 700 },


//   mapCard: { background: '#fff', border: '1px solid #E6EAF2', borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' },

//   mapHeader: { padding: 14, borderBottom: '1px solid #E6EAF2', fontWeight: 700 },

//   mapCanvas: { position: 'relative', width: '100%', height: 380, background: "url('https://maps.wikimedia.org/img/osm-intl,13,77.2090,28.6139,900x380.png') center/cover no-repeat, linear-gradient(135deg, #E5EEFF, #F8FBFF)", overflow: 'hidden' },

//   pin: { position: 'absolute', width: 14, height: 14, borderRadius: 999, border: '2px solid #fff' },

// };






