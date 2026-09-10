import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from './navbar'
import { supabase } from '../lib/supabase'
import { registerTourist } from '../lib/db'

export default function TouristRegistration({ onSuccess }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', phoneNo: '', nationality: '',
    documentType: '', documentNo: '', registrationPoint: '', checkInDate: '', checkOutDate: ''
  })
  const [photo, setPhoto] = useState(null)
  const [documentPhoto, setDocumentPhoto] = useState(null)
  const [emergencyContacts, setEmergencyContacts] = useState([{ name: '', phoneNo: '', relationship: '' }])
  const [travelItinerary, setTravelItinerary] = useState([{ location: '', date: '', activity: '' }])
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  // Require auth and prefill email from Supabase session
  useEffect(() => {
    let mounted = true
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      const userEmail = session?.user?.email || ''
      if (!userEmail) {
        navigate('/signup')
        return
      }
      if (mounted) {
        setForm(prev => ({ ...prev, email: userEmail }))
      }
    }
    load()
    return () => { mounted = false }
  }, [navigate])

  function updateField(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function updateArray(setter, index, field, value) {
    setter(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  function addRow(setter, empty) {
    setter(prev => [...prev, empty])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')
    try {
      await registerTourist({
        form,
        emergencyContacts,
        travelItinerary,
        photoFile: photo,
        documentPhotoFile: documentPhoto,
      })
      setMessage('Tourist registered successfully! Police can verify you on-chain.')

      if (typeof onSuccess === 'function') {
        onSuccess()
      } else {
        navigate('/')
      }
    } catch (err) {
      setMessage(`Error: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main>
      <Navbar/>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-sky-50 via-white to-rose-50" />
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-sky-200/30 blur-3xl -z-10" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-rose-200/40 blur-3xl -z-10" />

        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="pt-24" />

          <div className="rounded-2xl bg-white/90 p-6 ring-1 ring-black/10 shadow">
            <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">Tourist Registration</h2>
            {message && <div className="mt-2 mb-4 text-sm text-gray-700">{message}</div>}
            <form onSubmit={handleSubmit} className="mt-4 space-y-8">
        <section>
          <h3 className="text-xl font-semibold text-gray-900">Personal Information</h3>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="w-full rounded-lg bg-white px-3 py-2 text-gray-900 ring-1 ring-black/10 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300" name="fullName" placeholder="Full Name" value={form.fullName} onChange={updateField} required />
            <input className="w-full rounded-lg bg-gray-100 px-3 py-2 text-gray-900 ring-1 ring-black/10 shadow-sm placeholder:text-gray-400 focus:outline-none" name="email" type="email" placeholder="Email" value={form.email} disabled readOnly required />
            <input className="w-full rounded-lg bg-white px-3 py-2 text-gray-900 ring-1 ring-black/10 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300" name="password" type="password" placeholder="Password" value={form.password} onChange={updateField} required />
            <input className="w-full rounded-lg bg-white px-3 py-2 text-gray-900 ring-1 ring-black/10 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300" name="phoneNo" placeholder="Phone No" value={form.phoneNo} onChange={updateField} required />
            <input className="w-full rounded-lg bg-white px-3 py-2 text-gray-900 ring-1 ring-black/10 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300" name="nationality" placeholder="Nationality" value={form.nationality} onChange={updateField} required />
            <div>
              <label className="block mb-1 text-sm text-gray-700">Photo</label>
              <input className="w-full rounded-lg bg-white px-3 py-2 text-gray-900 ring-1 ring-black/10 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300" type="file" accept="image/*" onChange={e => setPhoto(e.target.files?.[0] || null)} />
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold text-gray-900">Document for Verification</h3>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
            <input className="w-full rounded-lg bg-white px-3 py-2 text-gray-900 ring-1 ring-black/10 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300" name="documentType" placeholder="Document Type" value={form.documentType} onChange={updateField} required />
            <input className="w-full rounded-lg bg-white px-3 py-2 text-gray-900 ring-1 ring-black/10 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300" name="documentNo" placeholder="Document No" value={form.documentNo} onChange={updateField} required />
            <div>
              <label className="block mb-1 text-sm text-gray-700">Document Photo</label>
              <input className="w-full rounded-lg bg-white px-3 py-2 text-gray-900 ring-1 ring-black/10 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300" type="file" accept="image/*" onChange={e => setDocumentPhoto(e.target.files?.[0] || null)} />
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold text-gray-900">Travel Info</h3>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
            <input className="w-full rounded-lg bg-white px-3 py-2 text-gray-900 ring-1 ring-black/10 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300" name="registrationPoint" placeholder="Registration Point" value={form.registrationPoint} onChange={updateField} required />
            <input className="w-full rounded-lg bg-white px-3 py-2 text-gray-900 ring-1 ring-black/10 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300" name="checkInDate" type="date" placeholder="Check-in Date" value={form.checkInDate} onChange={updateField} required />
            <input className="w-full rounded-lg bg-white px-3 py-2 text-gray-900 ring-1 ring-black/10 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300" name="checkOutDate" type="date" placeholder="Check-out Date" value={form.checkOutDate} onChange={updateField} required />
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">Emergency Contacts</h3>
            <button type="button" className="text-sky-700 hover:opacity-90" onClick={() => addRow(setEmergencyContacts, { name: '', phoneNo: '', relationship: '' })}>+ Add</button>
          </div>
          {emergencyContacts.map((c, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
              <input className="w-full rounded-lg bg-white px-3 py-2 text-gray-900 ring-1 ring-black/10 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300" placeholder="Name" value={c.name} onChange={e => updateArray(setEmergencyContacts, i, 'name', e.target.value)} required />
              <input className="w-full rounded-lg bg-white px-3 py-2 text-gray-900 ring-1 ring-black/10 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300" placeholder="Phone No" value={c.phoneNo} onChange={e => updateArray(setEmergencyContacts, i, 'phoneNo', e.target.value)} required />
              <input className="w-full rounded-lg bg-white px-3 py-2 text-gray-900 ring-1 ring-black/10 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300" placeholder="Relationship" value={c.relationship} onChange={e => updateArray(setEmergencyContacts, i, 'relationship', e.target.value)} required />
            </div>
          ))}
        </section>

        <section>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">Travel Itinerary</h3>
            <button type="button" className="text-sky-700 hover:opacity-90" onClick={() => addRow(setTravelItinerary, { location: '', date: '', activity: '' })}>+ Add</button>
          </div>
          {travelItinerary.map((t, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
              <input className="w-full rounded-lg bg-white px-3 py-2 text-gray-900 ring-1 ring-black/10 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300" placeholder="Location" value={t.location} onChange={e => updateArray(setTravelItinerary, i, 'location', e.target.value)} required />
              <input className="w-full rounded-lg bg-white px-3 py-2 text-gray-900 ring-1 ring-black/10 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300" type="date" placeholder="Date" value={t.date} onChange={e => updateArray(setTravelItinerary, i, 'date', e.target.value)} required />
              <input className="w-full rounded-lg bg-white px-3 py-2 text-gray-900 ring-1 ring-black/10 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300" placeholder="Activity" value={t.activity} onChange={e => updateArray(setTravelItinerary, i, 'activity', e.target.value)} required />
            </div>
          ))}
        </section>

        <div className="pt-2">
          <button disabled={submitting} className="inline-flex items-center rounded-lg bg-gray-900 px-5 py-2.5 text-white shadow hover:opacity-90 disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Register Tourist'}
          </button>
        </div>
      </form>
    </div>

          <div className="my-10" />
        </div>
      </section>
    </main>
  )
}


