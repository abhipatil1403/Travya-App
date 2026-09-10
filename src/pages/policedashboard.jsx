import React, { useEffect, useMemo, useRef, useState } from 'react';
import Navbar from './navbar';
import { ReportFormContent } from './report';
import { listTourists, getLatestTimelineCoords, listUnverifiedLocalsDuplicate, listVerifiedLocalsDuplicate, verifyLocalDuplicate, rejectLocalDuplicate, setTouristVerifiedAndTxHash } from '../lib/db';
import { generateQrDataUrl } from '../lib/qrCode';
import { supabase } from '../lib/supabase';
import { connectWallet, verifyTouristOnChain } from '../lib/blockchain';

// Light theme matching apphome.jsx
const theme = {
  colors: {
    background: '#F3F6FF',
    backgroundAlt: '#FFFFFF',
    surface: '#FFFFFF',
    text: '#0F172A',
    textSecondary: '#5B6472',
    primary: '#2563EB',
    success: '#16A34A',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  spacing: { xs: 6, sm: 12, md: 16, lg: 20 },
  typography: {
    h1: { fontSize: 24, fontWeight: 700 },
    h2: { fontSize: 18, fontWeight: 700 },
    body: { fontSize: 14, fontWeight: 400 },
    caption: { fontSize: 12, fontWeight: 400 },
  },
};

// Bounds around Shimla for mock projection

export default function PoliceDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedId, setSelectedId] = useState(null);
  const cardsRef = useRef({});
  const mapRef = useRef(null);
  const mapSectionRef = useRef(null);
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 });
  const [tourists, setTourists] = useState([]);
  const [locals, setLocals] = useState([]);
  const [verifiedLocals, setVerifiedLocals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingLocals, setLoadingLocals] = useState(false);
  const [localsError, setLocalsError] = useState('');
  const [verifyingTouristId, setVerifyingTouristId] = useState(null);
  const [verifyMessage, setVerifyMessage] = useState('');
  const heatmapMapRef = useRef(null);
  const [heatmapSize, setHeatmapSize] = useState({ width: 0, height: 0 });
  const [heatmapNameFilter, setHeatmapNameFilter] = useState('');
  const [sosEvents, setSosEvents] = useState(() => loadEvents());
  const [nowTs, setNowTs] = useState(Date.now());
  const [showEfirs, setShowEfirs] = useState(false);
  const asBool = (v) => v === true;
  const historyEvents = [
    { id: 'H-0901', name: 'Expired SOS - Neeraj', phone: '+91 98xxxxxx21', lat: 31.1049, lng: 77.1712, ts: Date.now() - 1000 * 60 * 60 * 5 },
    { id: 'H-0902', name: 'Expired SOS - Mira', phone: '+91 98xxxxxx22', lat: 31.1061, lng: 77.1744, ts: Date.now() - 1000 * 60 * 60 * 26 },
  ];

  // Map bounds around Shimla (rough box)
  const bounds = useMemo(() => ({
    minLat: 31.1015,
    maxLat: 31.1085,
    minLng: 77.1685,
    maxLng: 77.1785,
  }), []);

  function mapTourists(list, timelineCoords = {}) {
    return list.map((t) => {
      const idStr = String(t.id);
      let hash = 0; for (let i = 0; i < idStr.length; i++) hash = (hash * 31 + idStr.charCodeAt(i)) >>> 0;
      const fx = (hash % 1000) / 1000; const fy = ((hash >> 10) % 1000) / 1000;
      const timelineEntry = timelineCoords[t.id];
      const dbLat = t.last_lat != null && !Number.isNaN(Number(t.last_lat)) ? Number(t.last_lat) : null;
      const dbLng = t.last_lng != null && !Number.isNaN(Number(t.last_lng)) ? Number(t.last_lng) : null;
      const hasRealCoords = dbLat != null && dbLng != null;
      const lat = hasRealCoords ? dbLat : (timelineEntry?.latitude ?? (bounds.minLat + fy * (bounds.maxLat - bounds.minLat)));
      const lng = hasRealCoords ? dbLng : (timelineEntry?.longitude ?? (bounds.minLng + fx * (bounds.maxLng - bounds.minLng)));
      const rawZones = t.zones != null ? String(t.zones).trim() : '';
      const zonesOut = rawZones !== '' ? rawZones.toUpperCase() : null;
      const isVerified = t.verified === true || t.verified === 'true' || t.verified === 1;
      return {
        id: typeof t.id === 'string' || typeof t.id === 'number' ? t.id : String(t.id),
        name: t.fullname || t.name || 'Tourist',
        phone: t.phoneno || t.phone || '',
        email: t.email,
        nationality: t.nationality,
        documenttype: t.documenttype,
        registrationpoint: t.registrationpoint,
        wallet: t.wallet_address || '',
        wallet_address: t.wallet_address || null,
        lat: hasRealCoords ? dbLat : (timelineEntry?.latitude ?? '-'),
        lng: hasRealCoords ? dbLng : (timelineEntry?.longitude ?? '-'),
        last_lat: dbLat,
        last_lng: dbLng,
        zones: zonesOut,
        verified: isVerified,
        documentno: t.documentno,
        checkindate: t.checkindate,
        checkoutdate: t.checkoutdate,
      };
    });
  }

  const getZoneCardStyle = (zones) => {
    if (zones == null || String(zones).trim() === '') {
      return { borderColor: '#9CA3AF', background: '#F3F4F6' };
    }
    const z = String(zones).toUpperCase().trim();
    if (z === 'RED') return { borderColor: '#DC2626', background: 'rgba(239,68,68,0.06)' };
    if (z === 'AMBER') return { borderColor: '#D97706', background: 'rgba(245,158,11,0.06)' };
    if (z === 'GREEN') return { borderColor: '#16A34A', background: 'rgba(22,163,74,0.06)' };
    return { borderColor: '#9CA3AF', background: '#F3F4F6' };
  };

  // Fetch locals (pending + verified) when locals tab is active
  useEffect(() => {
    if (activeTab === 'locals') {
      setLocalsError('');
      async function fetchLocals() {
        try {
          setLoadingLocals(true);
          const [pending, verified] = await Promise.all([
            listUnverifiedLocalsDuplicate(),
            listVerifiedLocalsDuplicate()
          ]);
          setLocals(pending || []);
          setVerifiedLocals(verified || []);
        } catch (err) {
          console.error('Failed to fetch locals:', err);
          setLocalsError(err?.message || 'Failed to load locals. Check Supabase table and RLS.');
        } finally {
          setLoadingLocals(false);
        }
      }
      fetchLocals();
    }
  }, [activeTab]);

  // Fetch tourists dynamically from backend and assign real coordinates from timeline
  useEffect(() => {
    async function fetchList() {
      try {
        setLoading(true);
        const [list, timelineCoords] = await Promise.all([
          listTourists(),
          getLatestTimelineCoords() // Use the new function that properly matches user_id with email
        ]);
        setTourists(mapTourists(list, timelineCoords));
      } catch (_) {
        setTourists([]);
      } finally {
        setLoading(false);
      }
    }
    fetchList();
  }, [bounds]);

  // Refetch when switching to Verify or Overview for latest last_lat, last_lng, zones
  useEffect(() => {
    if (activeTab !== 'verify' && activeTab !== 'overview') return;
    (async () => {
      try {
        setLoading(true);
        const [list, timelineCoords] = await Promise.all([
          listTourists(),
          getLatestTimelineCoords() // Use the new function that properly matches user_id with email
        ]);
        setTourists(mapTourists(list, timelineCoords));
      } finally { setLoading(false); }
    })();
  }, [activeTab, bounds]);

  const projectToMap = (lat, lng, width, height) => {
    // Simple linear projection within bounds → x,y in px
    const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * width;
    const y = (1 - (lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * height;
    return { x, y };
  };

  // Observe map size to position pins correctly on mobile
  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;
    const update = () => setMapSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('orientationchange', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  // Heatmap canvas size when heatmap tab is active
  useEffect(() => {
    if (activeTab !== 'heatmap') return;
    const el = heatmapMapRef.current;
    if (!el) return;
    const update = () => setHeatmapSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [activeTab]);

  // Merge local SOS with current emergencies from DB; refresh every 5 minutes
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
          return {
            id: `EM-${t.id}`,
            name: t.fullname || 'Tourist',
            phone: t.phoneno || '',
            lat: timelineEntry?.latitude || 31.105,
            lng: timelineEntry?.longitude || 77.173,
            ts: startMap[`EM-${t.id}`] || Date.now()
          };
        });
        let changed = false; for (const m of mapped) { if (!startMap[m.id]) { startMap[m.id] = m.ts; changed = true; } }
        if (changed) saveEmergencyStartMap(startMap);
        const local = loadEvents();
        const combined = [...local, ...mapped].slice(-20);
        if (!cancelled) setSosEvents(combined);
      } catch (_) {
        if (!cancelled) setSosEvents(loadEvents());
      }
    }
    const onStorage = (e) => {
      if (e.key !== 'travya_sos_events') return;
      try {
        const raw = localStorage.getItem('travya_sos_events') || '[]';
        const parsed = JSON.parse(raw);
        const local = Array.isArray(parsed) ? parsed : [];
        setSosEvents(prev => [...local, ...(prev || []).filter(x => String(x?.id || '').startsWith('EM-'))].slice(-20));
      } catch (_) {}
    };
    window.addEventListener('storage', onStorage);
    refresh();
    const iv = setInterval(refresh, 5000);
    return () => { cancelled = true; window.removeEventListener('storage', onStorage); clearInterval(iv); };
  }, []);

  // 1s ticker for timers
  useEffect(() => {
    const iv = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  // When switching to map tab, scroll map into view
  useEffect(() => {
    if (activeTab === 'map') {
      requestAnimationFrame(() => {
        mapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [activeTab]);

  const resolveSOS = (id) => {
    try {
      const list = loadEvents();
      const next = list.filter((e) => e.id !== id);
      // If not found (e.g., dummy fallback), clear all
      const finalList = next.length === list.length ? [] : next;
      localStorage.setItem('travya_sos_events', JSON.stringify(finalList));
      setSosEvents(finalList);
    } catch (_) {}
  };

  const onPinClick = (id) => {
    setSelectedId(id);
    const el = cardsRef.current[id];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.animate?.([{ boxShadow: '0 0 0 rgba(0,0,0,0)' }, { boxShadow: '0 0 0 rgba(0,0,0,0)' }], { duration: 300 });
    }
  };

  const onCardClick = (id) => {
    setSelectedId(id);
  };

  const [showId, setShowId] = useState(false);
  const [idTourist, setIdTourist] = useState(null);

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
            <div style={styles.badge}>Police Dashboard</div>
            <h1 style={styles.title}>Tourist Tracking</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={styles.tabGroup}>
              <button style={{ ...styles.tabBtn, ...(activeTab === 'overview' ? styles.tabActive : {}) }} onClick={() => setActiveTab('overview')}>Overview</button>
              <button style={{ ...styles.tabBtn, ...(activeTab === 'verify' ? styles.tabActive : {}) }} onClick={() => setActiveTab('verify')}>Verify</button>
              <button style={{ ...styles.tabBtn, ...(activeTab === 'locals' ? styles.tabActive : {}) }} onClick={() => setActiveTab('locals')}>Locals Verification</button>
              <button style={{ ...styles.tabBtn, ...(activeTab === 'report' ? styles.tabActive : {}) }} onClick={() => setActiveTab('report')}>Report</button>
            </div>
          </div>
        </header>

        {/* Live SOS banner + list (hidden in Verify tab)
        {activeTab !== 'verify' && sosEvents.length > 0 && (
          <div style={styles.sosWrap}>
            <div style={styles.sosBanner}>
              <div style={styles.sosDot} />
              <div style={{ flex: 1 }}>
                <div style={styles.sosTitle}>Live SOS</div>
                <div style={styles.sosMeta}>Most recent at {new Date(sosEvents[sosEvents.length - 1].ts).toLocaleTimeString()}</div>
              </div>
              <a href={`https://www.google.com/maps?q=${sosEvents[sosEvents.length - 1].lat},${sosEvents[sosEvents.length - 1].lng}`} target="_blank" rel="noreferrer" style={styles.sosLink}>Open Map</a>
            </div>
            <div style={styles.sosList}>
              {sosEvents.slice(-5).reverse().map((ev) => (
                <div key={ev.id} style={styles.sosItem} onClick={() => { setActiveTab('map'); setSelectedId(ev.id); }}>
                  <div style={styles.sosTime}>{new Date(ev.ts).toLocaleTimeString()}</div>
                  <div style={{ flex: 1 }}>
                    <div style={styles.sosName}>{ev.name || 'Tourist'} • {ev.phone || ''}</div>
                    <div style={styles.sosCoords}>{Number(ev.lat).toFixed(5)}, {Number(ev.lng).toFixed(5)}</div>
                  </div>
                  <a href={`https://www.google.com/maps?q=${ev.lat},${ev.lng}`} target="_blank" rel="noreferrer" style={styles.linkBtn}>Maps</a>
                </div>
              ))}
            </div>
          </div>
        )} */}

        {/* Priority SOS card (hidden in Verify tab). Show all active SOS with individual 5 min timers */}
        {activeTab !== 'verify' && (
        <div style={styles.priorityCard}>
          <div style={styles.priorityHeader}>
            <div style={styles.priorityBadge}>Priority • SOS</div>
            </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {sosEvents.map((r) => {
              const startedAt = getStartTs(r);
              const canStop = !String(r.id).startsWith('EM-');
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
                    <a href={`https://www.google.com/maps?q=${r.lat},${r.lng}`} target="_blank" rel="noreferrer" style={styles.linkBtn} onClick={(e) => e.stopPropagation()}>Open in Maps</a>
                    {canStop && (
                      <button style={styles.stopBtn} onClick={(e) => { e.stopPropagation(); resolveSOS(r.id); }}>Stop</button>
                    )}
                  </div>
                </div>
              );
            })}
            </div>
        </div>
        )}
        
        

        {/* eFIRs quick access row (separate from tabs) moved below cards */}

        {activeTab === 'overview' && (
          <div style={styles.grid}>
            {(loading ? Array.from({ length: 4 }).map((_, i) => ({ id: 's'+i, name: 'Loading...', phone: '', last_lat: null, last_lng: null, zones: null, skeleton: true })) : tourists.filter(t => t.verified)).map((t) => {
              const hasCoords = t.last_lat != null && t.last_lng != null && !Number.isNaN(Number(t.last_lat)) && !Number.isNaN(Number(t.last_lng));
              const latVal = hasCoords ? Number(t.last_lat) : null;
              const lngVal = hasCoords ? Number(t.last_lng) : null;
              const zonesVal = t.zones != null && String(t.zones).trim() !== '' ? String(t.zones).toUpperCase().trim() : null;
              const zoneStyle = getZoneCardStyle(t.zones);
              const dotColor = t.skeleton ? '#E5E7EB' : zonesVal
                ? (zonesVal === 'RED' ? theme.colors.error : zonesVal === 'AMBER' ? theme.colors.warning : zonesVal === 'GREEN' ? theme.colors.success : '#9CA3AF')
                : '#9CA3AF';
              return (
              <div
                key={t.id}
                ref={(el) => (cardsRef.current[t.id] = el)}
                style={{
                  ...styles.card,
                  ...zoneStyle,
                  border: `1px solid ${zoneStyle.borderColor || '#E6EAF2'}`,
                  outline: selectedId === t.id ? `2px solid ${zoneStyle.borderColor || theme.colors.primary}` : 'none',
                }}
                onClick={() => onCardClick(t.id)}
              >
                <div style={styles.cardHeader}>
                  <div style={{ ...styles.dot, background: dotColor }} />
                  <div>
                    <div style={styles.cardTitle}>{t.name}</div>
                  </div>
                </div>
                <div style={styles.coordsRow}>
                  <div>
                    <div style={styles.coordLabel}>Latitude</div>
                    <div style={styles.coordValue}>{latVal != null ? latVal.toFixed(6) + '°' : '-'}</div>
                  </div>
                  <div>
                    <div style={styles.coordLabel}>Longitude</div>
                    <div style={styles.coordValue}>{lngVal != null ? lngVal.toFixed(6) + '°' : '-'}</div>
                  </div>
                </div>
                {!t.skeleton && (
                  <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                    {!hasCoords && (
                      <span style={{
                        display: 'inline-block',
                        padding: '6px 10px',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 600,
                        background: 'rgba(156,163,175,0.15)',
                        color: '#6B7280',
                      }}>
                        Tourist is inactive (location off)
                      </span>
                    )}
                    {zonesVal ? (
                      <span style={{
                        display: 'inline-block',
                        padding: '6px 10px',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 600,
                        background: zonesVal === 'RED' ? 'rgba(239,68,68,0.15)' : zonesVal === 'AMBER' ? 'rgba(245,158,11,0.15)' : 'rgba(22,163,74,0.15)',
                        color: zonesVal === 'RED' ? '#B91C1C' : zonesVal === 'AMBER' ? '#B45309' : '#15803D',
                      }}>
                        Zone: {zonesVal}
                      </span>
                    ) : (
                      <span style={{
                        display: 'inline-block',
                        padding: '6px 10px',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 600,
                        background: 'rgba(156,163,175,0.15)',
                        color: '#6B7280',
                      }}>
                        Not Active
                      </span>
                    )}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                  <div style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                    📍 {hasCoords ? `${latVal.toFixed(5)}, ${lngVal.toFixed(5)}` : 'Tourist is inactive (location off)'}
                  </div>
                  {!t.skeleton && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      {hasCoords && (
                        <a href={`https://www.google.com/maps?q=${latVal},${lngVal}`} target="_blank" rel="noreferrer" style={styles.linkBtn}>Open in Maps</a>
                      )}
                      <button style={styles.viewIdBtn} onClick={(e) => { e.stopPropagation(); setIdTourist(t); setShowId(true); }}>View ID</button>
                    </div>
                  )}
                </div>
              </div>
            );})}
          </div>
        )}

        {activeTab === 'verify' && (
          <div style={{ marginTop: 12 }}>
            <div style={{ padding: 12, borderRadius: 12, marginBottom: 12, background: '#EFF6FF', color: '#1E40AF', fontSize: 13 }}>
              <strong>Verify with MetaMask:</strong> Click Verify → MetaMask will open → <strong>Click Confirm</strong> in the MetaMask popup to sign the transaction. If you close or reject the popup, verification will fail.
            </div>
            {verifyMessage && (
              <div style={{
                padding: 12,
                borderRadius: 12,
                marginBottom: 12,
                background: verifyMessage.includes('Tx:') ? '#DCFCE7' : verifyMessage.includes('Error') ? '#FEF2F2' : '#F8FAFC',
                color: verifyMessage.includes('Tx:') ? '#166534' : verifyMessage.includes('Error') ? '#991B1B' : theme.colors.textSecondary,
                fontSize: 14,
              }}>
                {verifyMessage}
              </div>
            )}
            <div style={styles.grid}>
              {tourists.filter(t => !t.verified).map((t) => (
                <div key={t.id} style={{ ...styles.card, overflow: 'hidden', minWidth: 0 }}>
                  <div style={styles.cardHeader}>
                    <div style={{ ...styles.dot, background: theme.colors.warning }} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ ...styles.cardTitle, wordBreak: 'break-word' }}>{t.name}</div>
                      <div style={styles.cardSub}>Passport: {t.documentno || '—'}</div>
                      {(t.wallet_address || t.wallet) && (
                        <div style={{ fontSize: 11, color: theme.colors.textSecondary, marginTop: 2, wordBreak: 'break-all' }}>
                          Wallet: {String(t.wallet_address || t.wallet).slice(0, 10)}...{String(t.wallet_address || t.wallet).slice(-8)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={styles.coordLabel}>Email</div>
                      <div style={{ ...styles.coordValue, wordBreak: 'break-word', overflowWrap: 'break-word' }}>{t.email || '—'}</div>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={styles.coordLabel}>Phone</div>
                      <div style={{ ...styles.coordValue, wordBreak: 'break-word' }}>{t.phone || '—'}</div>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={styles.coordLabel}>Nationality</div>
                      <div style={{ ...styles.coordValue, wordBreak: 'break-word', overflowWrap: 'break-word' }}>{t.nationality || '—'}</div>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={styles.coordLabel}>Document Type</div>
                      <div style={{ ...styles.coordValue, wordBreak: 'break-word', overflowWrap: 'break-word' }}>{t.documenttype || '—'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, flexWrap: 'wrap', gap: 8 }}>
                    <div style={styles.zonePill('danger')}>Not Verified</div>
                    <button
                      style={styles.glassBtn}
                      disabled={verifyingTouristId === t.id}
                      onClick={async () => {
                        setVerifyMessage('');
                        setVerifyingTouristId(t.id);
                        try {
                          const walletAddress = (t.wallet_address || t.wallet)?.trim?.();
                          const hasWallet = walletAddress && walletAddress.startsWith('0x') && walletAddress.length === 42;
                          if (!hasWallet) {
                            setVerifyMessage('Error: Tourist has no wallet address. Ask them to re-register with MetaMask (Sepolia).');
                            return;
                          }
                          await connectWallet();
                          const txHash = await verifyTouristOnChain(walletAddress);
                          await setTouristVerifiedAndTxHash(t.id, txHash);
                          setTourists((prev) => prev.map((x) => (String(x.id) === String(t.id) ? { ...x, verified: true, blockchain_tx_hash: txHash } : x)));
                          setVerifyMessage(`Success! Tx: ${txHash.slice(0, 18)}...`);
                        } catch (e) {
                          const msg = e?.message || 'Verification failed';
                          const isRejected = msg.includes('rejected') || msg.includes('denied') || msg.includes('User denied');
                          setVerifyMessage(isRejected
                            ? 'Transaction was cancelled. Click Verify again and click Confirm in the MetaMask popup when it appears.'
                            : `Error: ${msg}`);
                        } finally {
                          setVerifyingTouristId(null);
                        }
                      }}
                    >
                      {verifyingTouristId === t.id ? 'Verifying…' : 'Verify'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'locals' && (
          <div style={{ marginTop: 12 }}>
            {loadingLocals ? (
              <div style={{ textAlign: 'center', padding: 40, color: theme.colors.textSecondary }}>
                Loading locals...
              </div>
            ) : localsError ? (
              <div style={{ padding: 16, background: '#FEF2F2', borderRadius: 12, color: theme.colors.error, marginBottom: 12 }}>
                {localsError}
              </div>
            ) : (
              <>
              {/* Pending verification */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, color: theme.colors.text }}>Pending verification</div>
                {locals.length === 0 ? (
                  <div style={{ padding: 16, background: '#F8FAFC', borderRadius: 12, color: theme.colors.textSecondary }}>
                    No pending local volunteer applications.
                  </div>
                ) : (
                  <div style={styles.grid}>
                {locals.map((local) => (
                  <div key={local.id} style={{ ...styles.card, overflow: 'hidden', minWidth: 0 }}>
                    <div style={styles.cardHeader}>
                      <div style={{ ...styles.dot, background: theme.colors.warning }} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ ...styles.cardTitle, wordBreak: 'break-word' }}>{local.full_name || local.name || '—'}</div>
                        <div style={styles.cardSub}>Registered: {new Date(local.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={styles.coordLabel}>Email</div>
                        <div style={{ ...styles.coordValue, wordBreak: 'break-word', overflowWrap: 'break-word' }}>{local.email || '—'}</div>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={styles.coordLabel}>Phone</div>
                        <div style={{ ...styles.coordValue, wordBreak: 'break-word' }}>{local.phone_number || local.phone || '—'}</div>
                      </div>
                      <div style={{ gridColumn: '1 / -1', minWidth: 0 }}>
                        <div style={styles.coordLabel}>Address</div>
                        <div style={{ ...styles.coordValue, wordBreak: 'break-word', overflowWrap: 'break-word' }}>{local.address || '—'}</div>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={styles.coordLabel}>City</div>
                        <div style={{ ...styles.coordValue, wordBreak: 'break-word', overflowWrap: 'break-word' }}>{local.city || '—'}</div>
                      </div>
                      {(local.id_proof_image_url || local.id_proof_url) && (
                        <div style={{ gridColumn: '1 / -1' }}>
                          <div style={styles.coordLabel}>ID Proof</div>
                          <a
                            href={local.id_proof_image_url || local.id_proof_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ ...styles.linkBtn, display: 'inline-block', marginTop: 4 }}
                          >
                            View ID Proof
                          </a>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, flexWrap: 'wrap', gap: 8 }}>
                      <div style={styles.zonePill('danger')}>Pending Verification</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          style={{ ...styles.glassBtn, background: theme.colors.error }}
                          onClick={async () => {
                            if (!confirm(`Reject ${local.full_name || local.name}'s application?`)) return;
                            try {
                              await rejectLocalDuplicate(local.id);
                              setLocals((prev) => prev.filter((x) => x.id !== local.id));
                            } catch (e) {
                              alert('Failed to reject: ' + e.message);
                            }
                          }}
                        >
                          Reject
                        </button>
                        <button
                          style={{ ...styles.glassBtn, background: theme.colors.success }}
                          onClick={async () => {
                            try {
                              const { data: { session } } = await supabase.auth.getSession();
                              const policeEmail = session?.user?.email;
                              if (!policeEmail) throw new Error('Not authenticated');
                              const qrData = `travya://assist?local_id=${local.id}`;
                              const qrCodeDataUrl = await generateQrDataUrl(qrData, { width: 256, margin: 2 });
                              await verifyLocalDuplicate(local.id, policeEmail, qrCodeDataUrl);
                              setLocals((prev) => prev.filter((x) => x.id !== local.id));
                              setVerifiedLocals((prev) => [...prev, { ...local, verification_status: true, qr_code_url: qrCodeDataUrl }]);
                            } catch (e) {
                              console.error('Approve error:', e);
                              alert('Failed to approve: ' + (e?.message || 'Unknown error'));
                            }
                          }}
                        >
                          Approve
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                  </div>
                )}
              </div>
              {/* Verified locals */}
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, color: theme.colors.text }}>Verified locals</div>
                {verifiedLocals.length === 0 ? (
                  <div style={{ padding: 16, background: '#F8FAFC', borderRadius: 12, color: theme.colors.textSecondary }}>
                    No verified locals yet.
                  </div>
                ) : (
                  <div style={styles.grid}>
                    {verifiedLocals.map((local) => (
                      <div key={local.id} style={{ ...styles.card, borderColor: theme.colors.success, overflow: 'hidden', minWidth: 0 }}>
                        <div style={styles.cardHeader}>
                          <div style={{ ...styles.dot, background: theme.colors.success }} />
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ ...styles.cardTitle, wordBreak: 'break-word' }}>{local.full_name || local.name || '—'}</div>
                            <div style={styles.cardSub}>Verified • {new Date(local.created_at).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={styles.coordLabel}>Email</div>
                            <div style={{ ...styles.coordValue, wordBreak: 'break-word', overflowWrap: 'break-word' }}>{local.email || '—'}</div>
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={styles.coordLabel}>Phone</div>
                            <div style={{ ...styles.coordValue, wordBreak: 'break-word' }}>{local.phone_number || local.phone || '—'}</div>
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={styles.coordLabel}>City</div>
                            <div style={{ ...styles.coordValue, wordBreak: 'break-word', overflowWrap: 'break-word' }}>{local.city || '—'}</div>
                          </div>
                        </div>
                        <div style={{ marginTop: 12 }}>
                          <div style={{ ...styles.zonePill('safe'), background: theme.colors.success, color: '#fff' }}>Verified</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'report' && (
          <div>
            <ReportFormContent enabled={true} />
          </div>
        )}


        {activeTab !== 'verify' && activeTab !== 'locals' && activeTab !== 'heatmap' && (
        <div style={styles.efirBar}>
          <div style={styles.efirInfo}>Auto eFIRs due to inactivity</div>
          <button style={styles.efirBtn} onClick={() => setShowEfirs((v) => !v)}>{showEfirs ? 'Hide eFIRs' : 'View eFIRs'}</button>
        </div>
        )}

        {activeTab === 'map' && (
          <div ref={mapSectionRef}>
            <div style={styles.mapCard}>
              <div style={styles.mapHeader}>Shimla Map (mock)</div>
              <div style={styles.mapCanvas} ref={mapRef}>
                {/* Dot layer */}
                {tourists.map((t) => {
                  const width = mapSize.width || 900;
                  const height = mapSize.height || 380;
                  const { x, y } = projectToMap(t.lat, t.lng, width, height);
                  return (
                    <button
                      key={t.id}
                      title={`${t.name} • ${t.zones != null ? t.zones : '—'}`}
                      onClick={() => onPinClick(t.id)}
                      style={{
                        ...styles.pin,
                        left: x,
                        top: y,
                        background: (t.zones && String(t.zones).toUpperCase() === 'RED') ? theme.colors.error : (t.zones && String(t.zones).toUpperCase() === 'AMBER') ? theme.colors.warning : (t.zones && String(t.zones).toUpperCase() === 'GREEN') ? theme.colors.success : '#9CA3AF',
                        transform: selectedId === t.id ? 'translate(-50%, -50%) scale(1.2)' : 'translate(-50%, -50%) scale(1)',
                        boxShadow: selectedId === t.id ? '0 0 0 6px rgba(37,99,235,0.18)' : '0 2px 8px rgba(0,0,0,0.18)'
                      }}
                    />
                  );
                })}
                {/* SOS pins (distinct red, larger) */}
                {sosEvents.map((ev) => {
                  const width = mapSize.width || 900;
                  const height = mapSize.height || 380;
                  const { x, y } = projectToMap(Number(ev.lat), Number(ev.lng), width, height);
                  return (
                    <button
                      key={ev.id}
                      title={`SOS: ${ev.name || 'Tourist'}`}
                      onClick={() => onPinClick(ev.id)}
                      style={{
                        ...styles.pin,
                        left: x,
                        top: y,
                        width: 18,
                        height: 18,
                        background: theme.colors.error,
                        boxShadow: '0 0 0 8px rgba(239,68,68,0.18)',
                        transform: selectedId === ev.id ? 'translate(-50%, -50%) scale(1.2)' : 'translate(-50%, -50%)'
                      }}
                    />
                  );
                })}
              </div>
              <div style={styles.legendRow}>
                <div style={styles.legendItem}><span style={{ ...styles.legendDot, background: theme.colors.success }} /> Safe cluster</div>
                <div style={styles.legendItem}><span style={{ ...styles.legendDot, background: theme.colors.error }} /> Restricted area</div>
                <div style={styles.legendItem}><span style={{ ...styles.legendDot, background: theme.colors.error, width: 14, height: 14 }} /> SOS</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'heatmap' && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 12 }}>
              <input
                type="text"
                placeholder="Filter by tourist name"
                value={heatmapNameFilter}
                onChange={(e) => setHeatmapNameFilter(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #E6EAF2', fontSize: 14, minWidth: 200 }}
              />
              <span style={{ fontSize: 14, color: theme.colors.textSecondary }}>
                Active tourists: <strong style={{ color: theme.colors.text }}>
                  {tourists.filter((t) => {
                    const hasCoords = t.lat !== '-' && t.lng !== '-' && !Number.isNaN(Number(t.lat)) && !Number.isNaN(Number(t.lng));
                    const nameMatch = !heatmapNameFilter.trim() || (t.name || '').toLowerCase().includes(heatmapNameFilter.trim().toLowerCase());
                    return hasCoords && nameMatch;
                  }).length}
                </strong>
              </span>
            </div>
            <div
              ref={heatmapMapRef}
              style={{
                ...styles.mapCard,
                position: 'relative',
                width: '100%',
                height: 380,
                overflow: 'hidden',
                background: "url('https://maps.wikimedia.org/img/osm-intl,13,77.2090,28.6139,900x380.png') center/cover no-repeat, linear-gradient(135deg, #E5EEFF, #F8FBFF)",
                border: '1px solid #E6EAF2',
              }}
            >
              <div style={{ padding: 12, borderBottom: '1px solid #E6EAF2', fontWeight: 700 }}>Tourist density heatmap</div>
              <div style={{ position: 'absolute', inset: 0, top: 49, left: 0, right: 0, bottom: 0 }}>
                {(() => {
                  const width = heatmapSize.width || 400;
                  const height = (heatmapSize.height || 380) - 49;
                  const filtered = tourists.filter((t) => {
                    const hasCoords = t.lat !== '-' && t.lng !== '-' && !Number.isNaN(Number(t.lat)) && !Number.isNaN(Number(t.lng));
                    const nameMatch = !heatmapNameFilter.trim() || (t.name || '').toLowerCase().includes(heatmapNameFilter.trim().toLowerCase());
                    return hasCoords && nameMatch;
                  });
                  return (
                    <>
                      {filtered.map((t) => {
                        const { x, y } = projectToMap(Number(t.lat), Number(t.lng), width, height);
                        return (
                          <div
                            key={t.id}
                            title={`${t.name || 'Tourist'} • ${t.email || ''}`}
                            style={{
                              position: 'absolute',
                              left: x - 24,
                              top: y - 24,
                              width: 48,
                              height: 48,
                              borderRadius: '50%',
                              background: 'radial-gradient(circle, rgba(239,68,68,0.5) 0%, rgba(239,68,68,0.2) 40%, transparent 70%)',
                              pointerEvents: 'none',
                            }}
                          />
                        );
                      })}
                      {filtered.length === 0 && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.colors.textSecondary, fontSize: 14 }}>
                          No tourists to display. Adjust filter or ensure tourists have location data.
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {showEfirs && (
          <div style={styles.grid}>
            {[
              { id: 'EFIR-2025-0012', tourist: 'Arjun Verma', phone: '+91 98xxxxxx45', lastActivity: 'Last seen: 18:35 near Ridge, Shimla', filedAt: 'Today, 19:05', status: 'open' },
              { id: 'EFIR-2025-0013', tourist: 'Neha Patel', phone: '+91 98xxxxxx76', lastActivity: 'Last seen: 17:10 near Mall Road', filedAt: 'Today, 18:00', status: 'open' },
              { id: 'EFIR-2025-0014', tourist: 'Kabir Singh', phone: '+91 98xxxxxx11', lastActivity: 'Last seen: Yesterday 22:40, Jakhu Hill', filedAt: 'Today, 09:15', status: 'closed' },
              { id: 'EFIR-2025-0015', tourist: 'Sara Khan', phone: '+91 98xxxxxx04', lastActivity: 'Last seen: Yesterday 21:20, Lakkar Bazar', filedAt: 'Today, 08:30', status: 'closed' },
            ].map((e) => (
              <div key={e.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={{ fontWeight: 700 }}>{e.id}</div>
                  <div style={styles.statusPill(e.status)}>{e.status === 'closed' ? 'eFIR Closed' : 'Open'}</div>
                </div>
                <div style={styles.line}><span style={styles.label}>Tourist</span><span style={styles.value}>{e.tourist}</span></div>
                <div style={styles.line}><span style={styles.label}>Phone</span><span style={styles.value}>{e.phone}</span></div>
                <div style={styles.line}><span style={styles.label}>Last Activity</span><span style={styles.value}>{e.lastActivity}</span></div>
                <div style={styles.line}><span style={styles.label}>Filed</span><span style={styles.value}>{e.filedAt}</span></div>
                <div style={styles.actionsRow}>
                  <a href="#" onClick={(ev) => ev.preventDefault()} style={styles.linkBtn}>View details</a>
                  <a href={`https://www.google.com/maps?q=31.105,77.173`} target="_blank" rel="noreferrer" style={styles.primaryBtn}>{e.status === 'closed' ? 'Case Solved' : 'Open in Maps'}</a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {showId && idTourist && (
        <div style={styles.modalBackdrop} onClick={() => setShowId(false)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={{ fontWeight: 800 }}>Government Verified ID</div>
              <button onClick={() => setShowId(false)} style={styles.closeBtn}>✕</button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.idBadgeRow}>
                <div style={styles.govBadge}>🇮🇳 Govt. of India</div>
                <div style={styles.idMeta}>Tourist ID • Verified</div>
              </div>
              <div style={styles.idRow}>
                <div style={styles.idLabel}>Name</div>
                <div style={styles.idValue}>{idTourist.name}</div>
              </div>
              <div style={styles.idRow}>
                <div style={styles.idLabel}>Passport</div>
                <div style={styles.idValue}>{idTourist.documentno}</div>
              </div>
              <div style={styles.idRow}>
                <div style={styles.idLabel}>Nationality</div>
                <div style={styles.idValue}>{idTourist.nationality || '—'}</div>
              </div>
              <div style={styles.idRow}>
                <div style={styles.idLabel}>Email</div>
                <div style={styles.idValue}>{idTourist.email || '—'}</div>
              </div>
              <div style={styles.idRow}>
                <div style={styles.idLabel}>Phone</div>
                <div style={styles.idValue}>{idTourist.phone || '—'}</div>
              </div>
              <div style={styles.idRow}>
                <div style={styles.idLabel}>Document</div>
                <div style={styles.idValue}>{idTourist.documenttype || '—'}</div>
              </div>
              <div style={styles.idRow}>
                <div style={styles.idLabel}>Registration Point</div>
                <div style={styles.idValue}>{idTourist.registrationpoint || '—'}</div>
              </div>
              <div style={styles.idRow}>
                <div style={styles.idLabel}>Check-in</div>
                <div style={styles.idValue}>{idTourist.checkindate ? String(idTourist.checkindate).slice(0,10) : '—'}</div>
              </div>
              <div style={styles.idRow}>
                <div style={styles.idLabel}>Check-out</div>
                <div style={styles.idValue}>{idTourist.checkoutdate ? String(idTourist.checkoutdate).slice(0,10) : '—'}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function loadEvents() {
  try {
    const raw = localStorage.getItem('travya_sos_events');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.slice(-20);
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

function getMostRecentSOS(list) {
  if (!list || list.length === 0) {
    // fallback dummy entry if none exists
    return { id: 'D-000', name: 'Demo Tourist', phone: '+91 98xxxxxx99', lat: 31.105, lng: 77.173, ts: Date.now() - 30 * 1000 };
  }
  return list[list.length - 1];
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
  page: {
    minHeight: '100vh',
    background: `linear-gradient(180deg, #EEF4FF 0%, #FFFFFF 35%, #FFFFFF 100%)`,
    color: theme.colors.text,
    paddingBottom: 80,
    overflowX: 'hidden',
  },
  heroSection: { position: 'relative' },
  bgBase: { position: 'absolute', inset: 0, zIndex: 0, background: 'linear-gradient(135deg, #F0F6FF 0%, #FFFFFF 60%, #FFF4F6 100%)' },
  bgBlobLeft: { position: 'absolute', top: -120, left: -120, width: 360, height: 360, borderRadius: 9999, background: 'rgba(125, 211, 252, 0.25)', filter: 'blur(60px)', zIndex: 0 },
  bgBlobRight: { position: 'absolute', bottom: -140, right: -140, width: 380, height: 380, borderRadius: 9999, background: 'rgba(251, 146, 60, 0.25)', filter: 'blur(70px)', zIndex: 0 },
  container: { maxWidth: 920, margin: '0 auto', padding: theme.spacing.lg, marginTop: 64 },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.md },
  badge: { display: 'inline-block', background: '#fff', border: '1px solid #E6EAF2', borderRadius: 999, padding: '6px 10px', color: theme.colors.textSecondary, fontSize: 12 },
  title: { margin: 0, marginTop: 8, fontSize: theme.typography.h1.fontSize, fontWeight: theme.typography.h1.fontWeight },
  tabGroup: { display: 'flex', gap: 8 },
  tabBtn: { background: '#fff', borderWidth: 1, borderStyle: 'solid', borderColor: '#E6EAF2', padding: '8px 12px', borderRadius: 10, cursor: 'pointer', color: theme.colors.textSecondary },
  tabActive: { color: theme.colors.primary, borderColor: theme.colors.primary, background: '#EEF4FF', borderWidth: 1, borderStyle: 'solid' },
  efirBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: 12, background: '#fff', border: '1px solid #E6EAF2', borderRadius: 12, marginBottom: 12 },
  efirInfo: { fontSize: 12, color: theme.colors.textSecondary },
  efirBtn: { padding: '8px 12px', borderRadius: 10, border: '1px solid #2563EB22', background: '#2563EB', color: '#fff', textDecoration: 'none' },

  sosWrap: { background: '#fff', border: '1px solid #E6EAF2', borderRadius: 12, padding: 12, marginBottom: 12 },
  sosBanner: { display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 10, borderBottom: '1px solid #E6EAF2' },
  sosDot: { width: 10, height: 10, borderRadius: 999, background: '#EF4444', boxShadow: '0 0 0 8px rgba(239,68,68,0.12)' },
  sosTitle: { fontWeight: 700 },
  sosMeta: { fontSize: 12, color: theme.colors.textSecondary },
  sosLink: { fontSize: 12, color: theme.colors.primary },
  sosList: { display: 'grid', gap: 8, marginTop: 10 },
  sosItem: { display: 'flex', gap: 10, alignItems: 'center', padding: 8, borderRadius: 10, background: '#F8FAFC', cursor: 'pointer' },
  sosTime: { fontSize: 12, color: theme.colors.textSecondary, minWidth: 84 },
  sosName: { fontWeight: 600 },
  sosCoords: { fontSize: 12, color: theme.colors.textSecondary },

  priorityCard: { background: '#FFF1F2', border: '1px solid #FECACA', borderRadius: 14, padding: 12, marginBottom: 12, cursor: 'pointer' },
  priorityHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  priorityBadge: { fontSize: 12, fontWeight: 700, color: '#B91C1C' },
  priorityTimer: { fontWeight: 700, color: '#B91C1C' },
  priorityBody: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  priorityAvatar: { width: 36, height: 36, borderRadius: 10, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  priorityName: { fontWeight: 700 },
  priorityMeta: { fontSize: 12, color: theme.colors.textSecondary },
  priorityCoords: { fontWeight: 700 },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: theme.spacing.sm },
  card: { background: '#fff', border: '1px solid #E6EAF2', borderRadius: 14, padding: theme.spacing.md, boxShadow: '0 8px 24px rgba(0,0,0,0.06)', cursor: 'pointer' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 },
  dot: { width: 14, height: 14, borderRadius: 999 },
  cardTitle: { fontWeight: 700 },
  cardSub: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 2 },
  coordsRow: { display: 'flex', justifyContent: 'space-between', marginTop: 10 },
  coordLabel: { fontSize: 12, color: theme.colors.textSecondary },
  coordValue: { fontWeight: 700, marginTop: 2 },
  zonePill: (zone) => ({ marginTop: 12, display: 'inline-block', padding: '6px 10px', borderRadius: 999, background: zone === 'danger' ? 'rgba(239,68,68,0.12)' : 'rgba(22,163,74,0.12)', color: zone === 'danger' ? theme.colors.error : theme.colors.success, fontSize: 12, fontWeight: 600 }),
  statusPill: (status) => ({ padding: '6px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, color: status === 'closed' ? theme.colors.success : '#B45309', background: status === 'closed' ? 'rgba(22,163,74,0.12)' : 'rgba(245,158,11,0.12)', border: `1px solid ${status === 'closed' ? '#86efac' : '#fde68a'}` }),
  glassBtn: { padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.7)', boxShadow: '0 6px 18px rgba(37,99,235,0.15)', color: theme.colors.text, cursor: 'pointer' },
  viewIdBtn: { padding: '8px 12px', borderRadius: 10, border: '1px solid #2563EB22', background: '#fff', color: theme.colors.text, cursor: 'pointer' },

  mapCard: { background: '#fff', border: '1px solid #E6EAF2', borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' },
  mapHeader: { padding: theme.spacing.md, borderBottom: '1px solid #E6EAF2', fontWeight: 700 },
  mapCanvas: { position: 'relative', width: '100%', height: 380, background: "url('https://maps.wikimedia.org/img/osm-intl,13,77.2090,28.6139,900x380.png') center/cover no-repeat, linear-gradient(135deg, #E5EEFF, #F8FBFF)", borderBottom: '1px solid #E6EAF2', overflow: 'hidden' },
  pin: { position: 'absolute', width: 14, height: 14, borderRadius: 999, border: '2px solid #fff' },
  legendRow: { display: 'flex', gap: 16, alignItems: 'center', padding: theme.spacing.md },
  legendItem: { display: 'flex', alignItems: 'center', gap: 8, color: theme.colors.textSecondary },
  legendDot: { width: 12, height: 12, borderRadius: 999, display: 'inline-block' },
  modalBackdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalCard: { width: 'min(92vw, 560px)', background: '#fff', borderRadius: 16, boxShadow: '0 24px 60px rgba(0,0,0,0.25)', overflow: 'hidden', border: '1px solid #E6EAF2' },
  modalHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottom: '1px solid #E6EAF2' },
  closeBtn: { border: 'none', background: 'transparent', fontSize: 18, cursor: 'pointer' },
  modalBody: { padding: 16 },
  idBadgeRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  govBadge: { padding: '6px 10px', borderRadius: 999, background: '#EFF6FF', color: '#1D4ED8', fontWeight: 700, fontSize: 12 },
  idMeta: { fontSize: 12, color: theme.colors.textSecondary },
  idRow: { display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, padding: '8px 0', borderBottom: '1px dashed #E6EAF2' },
  idLabel: { fontSize: 12, color: theme.colors.textSecondary },
  idValue: { fontWeight: 600 }
};

