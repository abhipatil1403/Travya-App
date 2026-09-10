import React, { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

/**
 * Protects routes by session and role.
 * - No session -> redirect to /signin
 * - Session but role not in allowedRoles -> redirect to / (access denied)
 * - Session and role allowed -> render children
 */
export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const location = useLocation()
  const [state, setState] = useState({ status: 'loading', role: '' })

  useEffect(() => {
    let cancelled = false
    async function check() {
      const { data: { session } } = await supabase.auth.getSession()
      if (cancelled) return
      const role = session?.user?.user_metadata?.role || (typeof localStorage !== 'undefined' ? localStorage.getItem('role') : '') || ''
      if (!session) {
        setState({ status: 'no_session', role: '' })
        return
      }
      const allowed = Array.isArray(allowedRoles) && allowedRoles.length > 0
        ? allowedRoles.includes(role)
        : true
      if (!allowed) {
        setState({ status: 'forbidden', role })
        return
      }
      setState({ status: 'allowed', role })
    }
    check()
    return () => { cancelled = true }
  }, [])

  if (state.status === 'loading') {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-gray-500">
        Loading...
      </div>
    )
  }
  if (state.status === 'no_session') {
    return <Navigate to="/signin" state={{ from: location }} replace />
  }
  if (state.status === 'forbidden') {
    return <Navigate to="/" replace />
  }
  return children
}
