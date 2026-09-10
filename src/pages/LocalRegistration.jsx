import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from './navbar'
import { supabase } from '../lib/supabase'
import { createLocalDuplicate } from '../lib/db'

export default function LocalRegistration() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    age: '',
    gender: '',
    phoneNumber: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    idProofType: '',
    idProofNumber: '',
    policeStation: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  })
  const [idProof, setIdProof] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [generatedPassword, setGeneratedPassword] = useState('')

  function updateField(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function getLocalPassword(fullName) {
    const baseName = (fullName || '').trim().split(/\s+/)[0] || 'user'
    return `${baseName.toLowerCase().replace(/\W/g, '')}123`
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')
    setGeneratedPassword('')

    const password = getLocalPassword(form.fullName)

    try {
      const { error: authError } = await supabase.auth.signUp({
        email: form.email,
        password,
        options: { data: { role: 'local' } },
      })

      if (authError) throw authError

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password,
      })

      if (signInError) {
        setMessage('Account created but sign-in failed. Please sign in with your password: ' + password)
        return
      }

      localStorage.setItem('role', 'local')

      const { data: { session } } = await supabase.auth.getSession()
      const authUserId = session?.user?.id || null

      await createLocalDuplicate({
        form,
        authUserId,
        idProofFile: idProof,
      })

      setGeneratedPassword(password)
      setMessage('Registration successful! Your application is pending police verification.')

      setTimeout(() => navigate('/local-dashboard'), 3500)
    } catch (err) {
      setMessage(`Error: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls = 'w-full rounded-lg bg-white px-3 py-2 text-gray-900 ring-1 ring-black/10 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300'
  const labelCls = 'block mb-1 text-sm text-gray-700'

  return (
    <main>
      <Navbar />
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-sky-50 via-white to-rose-50" />
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-sky-200/30 blur-3xl -z-10" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-rose-200/40 blur-3xl -z-10" />

        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="pt-24" />

          <div className="rounded-2xl bg-white/90 p-6 ring-1 ring-black/10 shadow">
            <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">Register as Local Volunteer</h2>
            <p className="mt-2 text-sm text-gray-600">
              Help keep tourists safe. Your application will be reviewed by police.
            </p>
            {message && (
              <div className={`mt-4 mb-4 p-3 rounded-lg text-sm ${message.includes('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                {message}
                {generatedPassword && (
                  <div className="mt-2 font-semibold">
                    Your login password: <code className="bg-white/80 px-1 rounded">{generatedPassword}</code> — save it.
                  </div>
                )}
              </div>
            )}
            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Full Name *</label>
                    <input className={inputCls} name="fullName" placeholder="Full Name" value={form.fullName} onChange={updateField} required />
                  </div>
                  <div>
                    <label className={labelCls}>Email *</label>
                    <input className={inputCls} name="email" type="email" placeholder="Email" value={form.email} onChange={updateField} required />
                  </div>
                  <div>
                    <label className={labelCls}>Age (optional)</label>
                    <input className={inputCls} name="age" type="number" placeholder="Age" value={form.age} onChange={updateField} min={18} />
                  </div>
                  <div>
                    <label className={labelCls}>Gender (optional)</label>
                    <select className={inputCls} name="gender" value={form.gender} onChange={updateField}>
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Phone Number (optional)</label>
                    <input className={inputCls} name="phoneNumber" placeholder="Phone" value={form.phoneNumber} onChange={updateField} />
                  </div>
                  <div>
                    <label className={labelCls}>Police Station (optional)</label>
                    <input className={inputCls} name="policeStation" placeholder="Nearest police station" value={form.policeStation} onChange={updateField} />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelCls}>Emergency Contact Name (optional)</label>
                    <input className={inputCls} name="emergencyContactName" placeholder="Name" value={form.emergencyContactName} onChange={updateField} />
                  </div>
                  <div>
                    <label className={labelCls}>Emergency Contact Phone (optional)</label>
                    <input className={inputCls} name="emergencyContactPhone" placeholder="Phone" value={form.emergencyContactPhone} onChange={updateField} />
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Location Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className={labelCls}>Address (optional)</label>
                    <input className={inputCls} name="address" placeholder="Address / Area" value={form.address} onChange={updateField} />
                  </div>
                  <div>
                    <label className={labelCls}>City (optional)</label>
                    <input className={inputCls} name="city" placeholder="City" value={form.city} onChange={updateField} />
                  </div>
                  <div>
                    <label className={labelCls}>State (optional)</label>
                    <input className={inputCls} name="state" placeholder="State" value={form.state} onChange={updateField} />
                  </div>
                  <div>
                    <label className={labelCls}>Postal Code (optional)</label>
                    <input className={inputCls} name="postalCode" placeholder="Postal code" value={form.postalCode} onChange={updateField} />
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">ID Proof (optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>ID Proof Type</label>
                    <select className={inputCls} name="idProofType" value={form.idProofType} onChange={updateField}>
                      <option value="">Select</option>
                      <option value="Aadhaar">Aadhaar</option>
                      <option value="PAN">PAN</option>
                      <option value="Voter ID">Voter ID</option>
                      <option value="Driving License">Driving License</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>ID Proof Number</label>
                    <input className={inputCls} name="idProofNumber" placeholder="ID number" value={form.idProofNumber} onChange={updateField} />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelCls}>ID Proof Image</label>
                    <input className={inputCls} type="file" accept="image/*,.pdf" onChange={e => setIdProof(e.target.files?.[0] || null)} />
                    <p className="mt-1 text-xs text-gray-500">Upload Aadhaar, PAN, or other government ID</p>
                  </div>
                </div>
              </section>

              <div className="pt-2">
                <button disabled={submitting} className="inline-flex items-center rounded-lg bg-gray-900 px-5 py-2.5 text-white shadow hover:opacity-90 disabled:opacity-50">
                  {submitting ? 'Submitting...' : 'Register as Local'}
                </button>
              </div>
            </form>
            <div className="mt-4 text-sm text-gray-700">
              Already have an account? <Link to="/signin" className="text-sky-700 hover:underline">Sign in</Link>
            </div>
          </div>

          <div className="my-10" />
        </div>
      </section>
    </main>
  )
}
