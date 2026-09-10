import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from './navbar'
import { supabase } from '../lib/supabase'
import { getLocalDuplicateByAuthId, listActiveSosTourists } from '../lib/db'

const theme = {
  colors: {
    text: '#0F172A',
    textSecondary: '#5B6472',
    primary: '#2563EB',
    success: '#16A34A',
    error: '#EF4444',
    warning: '#F59E0B',
    background: '#F3F6FF',
    surface: '#FFFFFF',
  },
  spacing: { xs: 6, sm: 12, md: 16, lg: 20 },
}

export default function LocalDashboard() {
  const navigate = useNavigate()
  const [local, setLocal] = useState(null)
  const [sosAlerts, setSosAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refreshLocal = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user?.id) return
    try {
      const record = await getLocalDuplicateByAuthId(session.user.id)
      setLocal(record)
    } catch (_) {}
  }, [])

  const refreshSosAlerts = useCallback(async () => {
    try {
      const list = await listActiveSosTourists()
      setSosAlerts(list || [])
    } catch (_) {
      setSosAlerts([])
    }
  }, [])

  // Initial load + auth check
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user?.id) {
          navigate('/signin')
          return
        }
        const record = await getLocalDuplicateByAuthId(session.user.id)
        if (mounted) {
          setLocal(record)
          if (!record) setError('No registration found. Please register first.')
        }
      } catch (e) {
        if (mounted) setError(e?.message || 'Failed to load')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [navigate])

  // Refresh local profile (assist count etc.) every 5s
  useEffect(() => {
    if (!local?.id) return
    const iv = setInterval(refreshLocal, 5000)
    return () => clearInterval(iv)
  }, [local?.id, refreshLocal])

  // Refresh SOS alerts every 5s (only for verified locals)
  useEffect(() => {
    if (!local?.verification_status) return
    refreshSosAlerts()
    const iv = setInterval(refreshSosAlerts, 5000)
    return () => clearInterval(iv)
  }, [local?.verification_status, refreshSosAlerts])

  if (loading) {
    return (
      <main>
        <Navbar />
        <div style={styles.page}>
          <div style={styles.card}>Loading...</div>
        </div>
      </main>
    )
  }

  if (error || !local) {
    return (
      <main>
        <Navbar />
        <div style={styles.page}>
          <div style={{ ...styles.card, borderColor: theme.colors.warning }}>
            <p style={{ color: theme.colors.text, margin: 0 }}>{error || 'Not found'}</p>
            <button style={styles.btn} onClick={() => navigate('/local-register')}>Register as Local</button>
          </div>
        </div>
      </main>
    )
  }

  const verified = local.verification_status === true
  const totalAssists = local.total_assists ?? 0
  const rating = local.rating != null ? Number(local.rating) : null

  return (
    <main>
      <Navbar />
      <div style={styles.page}>
        <div style={styles.container}>
          {/* Profile Card */}
          <div style={styles.card}>
            <div style={styles.profileHeader}>
              <div>
                <h1 style={styles.title}>{local.full_name || 'Local Volunteer'}</h1>
                <p style={styles.sub}>{local.email}</p>
              </div>
              {verified ? (
                <div style={styles.verifiedBadge}>✓ Verified</div>
              ) : (
                <div style={styles.pendingBadge}>Pending</div>
              )}
            </div>

            {!verified && (
              <div style={styles.pendingBox}>
                <div style={styles.pendingIcon}>⏳</div>
                <div style={styles.pendingText}>Waiting for police verification</div>
                <p style={styles.pendingHint}>You will see SOS alerts, QR code, and assist count after verification.</p>
              </div>
            )}

            {verified && (
              <div style={styles.profileDetails}>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Police station</span>
                  <span style={styles.detailValue}>{local.police_station || '—'}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Contact</span>
                  <span style={styles.detailValue}>{local.phone_number || '—'}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>City</span>
                  <span style={styles.detailValue}>{local.city || '—'}</span>
                </div>
                <div style={styles.statsRow}>
                  <div style={styles.statCard}>
                    <div style={styles.statValue}>{totalAssists}</div>
                    <div style={styles.statLabel}>Total Assists</div>
                  </div>
                  {rating != null && (
                    <div style={styles.statCard}>
                      <div style={styles.statValue}>⭐ {rating.toFixed(1)}</div>
                      <div style={styles.statLabel}>Rating</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {verified && local.qr_code_url && (
              <div style={styles.qrSection}>
                <div style={styles.qrLabel}>Your Assist QR Code</div>
                <div style={styles.qrWrap}>
                  <img src={local.qr_code_url} alt="QR Code" style={styles.qrImg} />
                </div>
                <p style={styles.qrHint}>Tourists scan this to record an assist</p>
              </div>
            )}
          </div>

          {/* Live SOS Alerts - verified locals only */}
          {verified && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Live Tourist Alerts</h2>
              {sosAlerts.length === 0 ? (
                <div style={styles.emptyAlerts}>No active SOS alerts nearby.</div>
              ) : (
                <div style={styles.alertGrid}>
                  {sosAlerts.map((t) => {
                    const lat = t.last_lat != null && !Number.isNaN(Number(t.last_lat)) ? Number(t.last_lat) : null
                    const lng = t.last_lng != null && !Number.isNaN(Number(t.last_lng)) ? Number(t.last_lng) : null
                    const mapsUrl = lat != null && lng != null
                      ? `https://maps.google.com/?q=${lat},${lng}`
                      : null
                    const zones = t.zones ? String(t.zones).trim().toUpperCase() : null
                    const zoneStyle = zones === 'RED' ? styles.zoneRed : zones === 'AMBER' ? styles.zoneAmber : styles.zoneGreen
                    return (
                      <div key={t.id} style={styles.alertCard}>
                        <div style={styles.alertHeader}>
                          <div style={styles.alertName}>{t.fullname || 'Tourist'}</div>
                          {zones && <div style={{ ...styles.zonePill, ...zoneStyle }}>{zones}</div>}
                        </div>
                        <div style={styles.alertBody}>
                          <div style={styles.coordRow}>
                            <span style={styles.coordLabel}>Location</span>
                            <span style={styles.coordValue}>
                              {lat != null && lng != null
                                ? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
                                : '—'}
                            </span>
                          </div>
                          {t.phoneno && (
                            <div style={styles.coordRow}>
                              <span style={styles.coordLabel}>Phone</span>
                              <span style={styles.coordValue}>{t.phoneno}</span>
                            </div>
                          )}
                        </div>
                        {mapsUrl && (
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={styles.mapsBtn}
                          >
                            Open in Maps
                          </a>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    padding: theme.spacing.lg,
    paddingBottom: 80,
    background: `linear-gradient(180deg, ${theme.colors.background} 0%, #FFFFFF 100%)`,
  },
  container: {
    maxWidth: 560,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.lg,
  },
  card: {
    background: theme.colors.surface,
    borderRadius: 16,
    padding: theme.spacing.lg,
    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
    border: '1px solid #E6EAF2',
    overflow: 'hidden',
  },
  profileHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  title: { fontSize: 22, fontWeight: 700, margin: 0, color: theme.colors.text },
  sub: { fontSize: 14, color: theme.colors.textSecondary, margin: '4px 0 0 0' },
  verifiedBadge: {
    padding: '6px 12px',
    borderRadius: 999,
    background: 'rgba(22,163,74,0.15)',
    color: theme.colors.success,
    fontSize: 13,
    fontWeight: 600,
  },
  pendingBadge: {
    padding: '6px 12px',
    borderRadius: 999,
    background: 'rgba(245,158,11,0.15)',
    color: theme.colors.warning,
    fontSize: 13,
    fontWeight: 600,
  },
  pendingBox: {
    textAlign: 'center',
    padding: 24,
    background: 'rgba(245,158,11,0.08)',
    borderRadius: 12,
    border: '1px solid rgba(245,158,11,0.3)',
  },
  pendingIcon: { fontSize: 40, marginBottom: 8 },
  pendingText: { fontSize: 16, fontWeight: 600, color: theme.colors.warning, marginBottom: 4 },
  pendingHint: { fontSize: 13, color: theme.colors.textSecondary, margin: 0 },
  profileDetails: { display: 'flex', flexDirection: 'column', gap: 10 },
  detailRow: {
    display: 'grid',
    gridTemplateColumns: '120px 1fr',
    gap: 8,
  },
  detailLabel: { fontSize: 13, color: theme.colors.textSecondary },
  detailValue: { fontSize: 14, fontWeight: 500 },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: 12,
    marginTop: 12,
  },
  statCard: {
    padding: 16,
    background: 'rgba(22,163,74,0.08)',
    borderRadius: 12,
    textAlign: 'center',
    border: '1px solid rgba(22,163,74,0.2)',
  },
  statValue: { fontSize: 24, fontWeight: 700, color: theme.colors.success },
  statLabel: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 4 },
  qrSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTop: '1px solid #E6EAF2',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  qrLabel: { fontSize: 16, fontWeight: 600, marginBottom: 12, color: theme.colors.text },
  qrWrap: {
    padding: 12,
    background: '#fff',
    borderRadius: 12,
    border: '1px solid #E6EAF2',
  },
  qrImg: { display: 'block', width: 180, height: 180 },
  qrHint: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 8, margin: 0 },
  section: { marginTop: 0 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 700,
    margin: '0 0 12px 0',
    color: theme.colors.text,
  },
  emptyAlerts: {
    padding: 24,
    background: theme.colors.surface,
    borderRadius: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    border: '1px solid #E6EAF2',
  },
  alertGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  alertCard: {
    background: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    border: '1px solid #E6EAF2',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    overflow: 'hidden',
  },
  alertHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  alertName: { fontSize: 16, fontWeight: 700, color: theme.colors.text },
  zonePill: {
    padding: '4px 10px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
  },
  zoneRed: { background: 'rgba(239,68,68,0.15)', color: theme.colors.error },
  zoneAmber: { background: 'rgba(245,158,11,0.15)', color: theme.colors.warning },
  zoneGreen: { background: 'rgba(22,163,74,0.15)', color: theme.colors.success },
  alertBody: { display: 'flex', flexDirection: 'column', gap: 6 },
  coordRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  coordLabel: { fontSize: 12, color: theme.colors.textSecondary },
  coordValue: { fontSize: 13, fontWeight: 500, wordBreak: 'break-all' },
  mapsBtn: {
    display: 'inline-block',
    marginTop: 12,
    padding: '8px 16px',
    background: theme.colors.primary,
    color: '#fff',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    textDecoration: 'none',
  },
  btn: {
    marginTop: 16,
    padding: '10px 20px',
    background: theme.colors.primary,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    cursor: 'pointer',
  },
}
