/**
 * Dev test page: verify QR generation works.
 * Visit /qr-test to debug QR code generation.
 */
import { useState } from 'react'
import { generateQrDataUrl } from '../lib/qrCode'

export default function QrTest() {
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [dataUrl, setDataUrl] = useState('')
  const [error, setError] = useState('')

  async function handleTest() {
    setStatus('loading')
    setError('')
    setDataUrl('')
    try {
      const url = await generateQrDataUrl('travya://assist?local_id=test-uuid-123', { width: 200, margin: 2 })
      setDataUrl(url)
      setStatus('success')
    } catch (e) {
      setError(e?.message || 'Unknown error')
      setStatus('error')
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>QR Generation Test</h1>
        <p style={styles.hint}>Use this page to verify QR code generation works in your environment.</p>
        <button style={styles.btn} onClick={handleTest} disabled={status === 'loading'}>
          {status === 'loading' ? 'Generating...' : 'Generate Test QR'}
        </button>
        {status === 'success' && dataUrl && (
          <div style={styles.result}>
            <div style={styles.resultLabel}>Success</div>
            <img src={dataUrl} alt="QR" style={styles.qrImg} />
            <p style={styles.dataUrlHint}>Data URL length: {dataUrl.length} chars</p>
          </div>
        )}
        {status === 'error' && (
          <div style={styles.error}>
            <div style={styles.errorLabel}>Error</div>
            <pre style={styles.errorPre}>{error}</pre>
            <p style={styles.errorHint}>Run in project root: <code>npm install qrcode</code></p>
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f1f5f9',
    padding: 24,
  },
  card: {
    background: '#fff',
    borderRadius: 16,
    padding: 32,
    maxWidth: 400,
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    textAlign: 'center',
  },
  title: { fontSize: 20, fontWeight: 700, margin: '0 0 8px 0' },
  hint: { fontSize: 14, color: '#64748b', margin: '0 0 20px 0' },
  btn: {
    padding: '10px 20px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    cursor: 'pointer',
  },
  result: { marginTop: 24 },
  resultLabel: { color: '#16a34a', fontWeight: 600, marginBottom: 12 },
  qrImg: { width: 200, height: 200 },
  dataUrlHint: { fontSize: 12, color: '#94a3b8', marginTop: 8 },
  error: { marginTop: 24, textAlign: 'left' },
  errorLabel: { color: '#dc2626', fontWeight: 600, marginBottom: 8 },
  errorPre: {
    background: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    fontSize: 12,
    overflow: 'auto',
    margin: 0,
  },
  errorHint: { fontSize: 12, color: '#64748b', marginTop: 8 },
}
