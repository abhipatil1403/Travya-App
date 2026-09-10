import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { incrementLocalAssist } from '../lib/assist'

export default function ScanAssist() {
  const [searchParams] = useSearchParams()
  const localId = searchParams.get('local_id')
  const [status, setStatus] = useState('loading') // loading | success | error
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!localId) {
      setStatus('error')
      setMessage('Missing local_id parameter. Use /scan-assist?local_id=UUID')
      return
    }
    let mounted = true
    ;(async () => {
      try {
        await incrementLocalAssist(localId)
        if (mounted) {
          setStatus('success')
          setMessage('Assist recorded successfully.')
        }
      } catch (err) {
        if (mounted) {
          setStatus('error')
          setMessage(err?.message || 'Failed to record assist.')
        }
      }
    })()
    return () => { mounted = false }
  }, [localId])

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>QR Assist</h1>
        {status === 'loading' && (
          <p style={styles.text}>Recording assist...</p>
        )}
        {status === 'success' && (
          <>
            <div style={styles.successIcon}>✓</div>
            <p style={{ ...styles.text, color: '#16A34A', fontWeight: 600 }}>{message}</p>
          </>
        )}
        {status === 'error' && (
          <p style={{ ...styles.text, color: '#EF4444' }}>{message}</p>
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
    background: 'linear-gradient(180deg, #EEF4FF 0%, #FFFFFF 100%)',
    padding: 24,
  },
  card: {
    background: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    maxWidth: 400,
    width: '100%',
    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
    textAlign: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    margin: '0 0 16px 0',
    color: '#0F172A',
  },
  text: {
    fontSize: 16,
    margin: 0,
    color: '#5B6472',
  },
  successIcon: {
    width: 56,
    height: 56,
    lineHeight: '56px',
    borderRadius: '50%',
    background: '#16A34A',
    color: '#fff',
    fontSize: 28,
    fontWeight: 700,
    margin: '0 auto 16px',
  },
}
