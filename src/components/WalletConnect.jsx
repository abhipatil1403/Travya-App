import { useState } from 'react'
import { connectWallet } from '../lib/blockchain'

/**
 * Reusable MetaMask connect button for Ethereum (Sepolia).
 * Calls onConnect(walletAddress) on success.
 */
export default function WalletConnect({ onConnect, buttonLabel = 'Connect MetaMask', connectedLabel = 'Wallet Connected', className = '' }) {
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleConnect() {
    setError('')
    setLoading(true)
    try {
      const acc = await connectWallet()
      setAddress(acc)
      if (typeof onConnect === 'function') onConnect(acc)
    } catch (e) {
      setError(e?.message || 'Connection failed')
    } finally {
      setLoading(false)
    }
  }

  const displayAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleConnect}
        disabled={loading}
        className="inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-white shadow hover:opacity-90 disabled:opacity-50"
      >
        {loading ? 'Connecting...' : address ? `${connectedLabel} (${displayAddress})` : buttonLabel}
      </button>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}
