import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from './navbar'
import { supabase } from '../lib/supabase'

export default function Signup() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { role: 'tourist' } }
      })
      if (error) throw error
      // Proactively sign in after signup
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        setMessage(signInError.message || 'Please confirm your email')
        return
      }
      localStorage.setItem('role', 'tourist')
      setMessage('Account created and signed in.')
      navigate('/register')
    } catch (err) {
      setMessage(err.message || 'Signup failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main>
      <Navbar/>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-sky-50 via-white to-rose-50" />
        <div className="mx-auto max-w-md px-4 sm:px-6">
          <div className="pt-24" />
          <div className="rounded-2xl bg-white/90 p-6 ring-1 ring-black/10 shadow">
            <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">Sign up</h2>
            {message && <div className="mt-2 mb-4 text-sm text-gray-700">{message}</div>}
            <form onSubmit={handleSubmit} className="mt-4 grid gap-4">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="w-full rounded-lg bg-white px-3 py-2 text-gray-900 ring-1 ring-black/10 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required className="w-full rounded-lg bg-white px-3 py-2 text-gray-900 ring-1 ring-black/10 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300" />
              <div className="pt-2">
                <button disabled={submitting} className="inline-flex items-center rounded-lg bg-gray-900 px-5 py-2.5 text-white shadow hover:opacity-90 disabled:opacity-50">
                  {submitting ? 'Creating account...' : 'Create account'}
                </button>
              </div>
            </form>
            <div className="mt-3 text-sm text-gray-700">Already have an account? <Link to="/signin" className="text-sky-700">Log in</Link></div>
          </div>
          <div className="my-10" />
        </div>
      </section>
    </main>
  )
}


