import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Navbar() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [role, setRole] = useState('')
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (cancelled) return
      setHasSession(!!session)
      const r = session?.user?.user_metadata?.role || localStorage.getItem('role') || ''
      setRole(r)
      setSessionReady(true)
    }
    init()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return
      setHasSession(!!session)
      if (!session) {
        setRole('')
        return
      }
      const r = session?.user?.user_metadata?.role || localStorage.getItem('role') || ''
      setRole(r)
    })
    return () => {
      cancelled = true
      subscription?.unsubscribe?.()
    }
  }, [])

  async function logout() {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      try {
        await supabase.auth.signOut({ scope: 'local' })
      } catch (_) {}
    }
    localStorage.removeItem('role')
    setRole('')
    setHasSession(false)
    navigate('/', { replace: true })
  }

  const isGuest = !role
  const isTourist = role === 'tourist'
  const isLocal = role === 'local'
  const isPolice = role === 'police'

  const linkCls = 'text-sm hover:opacity-80 transition-opacity'
  const mobileLinkCls = 'rounded-lg px-3 py-2 text-sm text-gray-900 hover:bg-gray-50'

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-black/10 shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-semibold tracking-wide">
              Travya
            </Link>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className={linkCls}>Home</Link>
            <Link to="/services" className={linkCls}>Services</Link>
            <Link to="/weather" className={linkCls}>Weather</Link>

            {!sessionReady ? (
              <>
                <Link to="/signin" className={linkCls}>Login</Link>
              </>
            ) : hasSession ? (
              isTourist ? (
              <>
                <Link to="/dashboard" className={linkCls}>Tourist Dashboard</Link>
                <Link to="/dashboard" className={linkCls}>Group / Family</Link>
                <button type="button" onClick={logout} className={linkCls}>Logout</button>
              </>
            ) : isLocal ? (
              <>
                <Link to="/local-dashboard" className={linkCls}>Local Dashboard</Link>
                <button type="button" onClick={logout} className={linkCls}>Logout</button>
              </>
            ) : isPolice ? (
              <>
                <Link to="/police" className={linkCls}>Police Dashboard</Link>
                <button type="button" onClick={logout} className={linkCls}>Logout</button>
              </>
            ) : (
              <>
                <Link to="/dashboard" className={linkCls}>Dashboard</Link>
                <button type="button" onClick={logout} className={linkCls}>Logout</button>
              </>
            )
            ) : (
              <Link to="/signin" className={linkCls}>Login</Link>
            )}
          </div>
          <button aria-label="Open menu" onClick={() => setOpen(v => !v)} className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-lg ring-1 ring-black/10 shadow bg-white">
            <div className="flex flex-col items-center justify-center gap-1.5">
              <span className="block h-0.5 w-6 bg-gray-900 rounded" />
              <span className="block h-0.5 w-6 bg-gray-900 rounded" />
              <span className="block h-0.5 w-6 bg-gray-900 rounded" />
            </div>
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden absolute right-3 top-16 z-50 w-44 rounded-xl bg-white ring-1 ring-black/10 shadow">
          <div className="p-2 grid">
            <Link to="/" onClick={() => setOpen(false)} className={mobileLinkCls}>Home</Link>
            <Link to="/services" onClick={() => setOpen(false)} className={mobileLinkCls}>Services</Link>
            <Link to="/weather" onClick={() => setOpen(false)} className={mobileLinkCls}>Weather</Link>
            {!sessionReady ? (
              <Link to="/signin" onClick={() => setOpen(false)} className={mobileLinkCls}>Login</Link>
            ) : hasSession ? (
              isTourist ? (
              <>
                <Link to="/dashboard" onClick={() => setOpen(false)} className={mobileLinkCls}>Tourist Dashboard</Link>
                <Link to="/dashboard" onClick={() => setOpen(false)} className={mobileLinkCls}>Group / Family</Link>
                <button type="button" onClick={() => { setOpen(false); logout() }} className={`text-left w-full ${mobileLinkCls}`}>Logout</button>
              </>
            ) : isLocal ? (
              <>
                <Link to="/local-dashboard" onClick={() => setOpen(false)} className={mobileLinkCls}>Local Dashboard</Link>
                <button type="button" onClick={() => { setOpen(false); logout() }} className={`text-left w-full ${mobileLinkCls}`}>Logout</button>
              </>
            ) : isPolice ? (
              <>
                <Link to="/police" onClick={() => setOpen(false)} className={mobileLinkCls}>Police Dashboard</Link>
                <button type="button" onClick={() => { setOpen(false); logout() }} className={`text-left w-full ${mobileLinkCls}`}>Logout</button>
              </>
            ) : (
              <>
                <Link to="/dashboard" onClick={() => setOpen(false)} className={mobileLinkCls}>Dashboard</Link>
                <button type="button" onClick={() => { setOpen(false); logout() }} className={`text-left w-full ${mobileLinkCls}`}>Logout</button>
              </>
            )
            ) : (
              <Link to="/signin" onClick={() => setOpen(false)} className={mobileLinkCls}>Login</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
