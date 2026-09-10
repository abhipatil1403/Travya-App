import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from './navbar'
import { createReport } from '../lib/db'

export function ReportFormContent({ enabled = true }) {
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    areaName: '',
    description: '',
    latitude: '',
    longitude: '',
    reporterName: '',
    reporterPhone: '',
    radius_km: '',
    status_color: 'red'
  })

  useEffect(() => {
    if (!enabled) setMessage('Report filing is disabled at the moment')
  }, [enabled])

  async function getLiveLocation() {
    try {
      if (!('geolocation' in navigator)) {
        setMessage('Geolocation not supported')
        return
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude?.toFixed?.(6))
          const lng = Number(pos.coords.longitude?.toFixed?.(6))
          setForm(prev => ({ ...prev, latitude: lat, longitude: lng }))
          setMessage('Location captured')
        },
        () => setMessage('Unable to fetch location. Enter manually if needed.')
      )
    } catch (e) {
      setMessage('Unable to fetch location')
    }
  }

  function updateField(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!enabled) { setMessage('Report filing is disabled'); return }
    setSubmitting(true)
    setMessage('')
    try {
      const payload = {
        areaName: form.areaName,
        description: form.description,
        latitude: form.latitude === '' ? null : Number(form.latitude),
        longitude: form.longitude === '' ? null : Number(form.longitude),
        reporterName: form.reporterName || null,
        reporterPhone: form.reporterPhone || null,
        radius_km: form.radius_km === '' ? null : Number(form.radius_km),
        status_color: form.status_color || null
      }

      await createReport(payload)
      setMessage('Report submitted successfully')
      setForm({ areaName: '', description: '', latitude: '', longitude: '', reporterName: '', reporterPhone: '', radius_km: '', status_color: 'red' })
    } catch (err) {
      setMessage('Error: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-2xl bg-white/90 p-6 ring-1 ring-black/10 shadow">
      <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">Police: Create Area Report</h2>
      {message && <div className="mt-2 mb-4 text-sm text-gray-700">{message}</div>}
      <form onSubmit={handleSubmit} className="mt-4 grid gap-4">
        <input name="areaName" value={form.areaName} onChange={updateField} placeholder="Area name" className="w-full rounded-lg bg-white px-3 py-2 text-gray-900 ring-1 ring-black/10 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300" required />
        <textarea name="description" value={form.description} onChange={updateField} placeholder="Description" rows={4} className="w-full rounded-lg bg-white px-3 py-2 text-gray-900 ring-1 ring-black/10 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300" required />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="number" step="0.000001" name="latitude" value={form.latitude} onChange={updateField} placeholder="Latitude (optional)" className="w-full rounded-lg bg-white px-3 py-2 text-gray-900 ring-1 ring-black/10 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300" />
          <input type="number" step="0.000001" name="longitude" value={form.longitude} onChange={updateField} placeholder="Longitude (optional)" className="w-full rounded-lg bg-white px-3 py-2 text-gray-900 ring-1 ring-black/10 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300" />
          <div className="md:col-span-2">
            <button type="button" onClick={getLiveLocation} className="inline-flex items-center rounded-lg bg-white px-3 py-2 text-gray-900 ring-1 ring-black/10 shadow hover:bg-gray-50">Use current location</button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input name="reporterName" value={form.reporterName} onChange={updateField} placeholder="Officer Name (optional)" className="w-full rounded-lg bg-white px-3 py-2 text-gray-900 ring-1 ring-black/10 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300" />
          <input name="reporterPhone" value={form.reporterPhone} onChange={updateField} placeholder="Officer Phone (optional)" className="w-full rounded-lg bg-white px-3 py-2 text-gray-900 ring-1 ring-black/10 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300" />
          <input type="number" step="0.01" min="0" name="radius_km" value={form.radius_km} onChange={updateField} placeholder="Radius (km)" className="w-full rounded-lg bg-white px-3 py-2 text-gray-900 ring-1 ring-black/10 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300" />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Status color</label>
          <select name="status_color" value={form.status_color} onChange={updateField} className="w-full rounded-lg bg-white px-3 py-2 text-gray-900 ring-1 ring-black/10 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300">
            <option value="red">Red</option>
            <option value="amber">Amber</option>
            <option value="green">Green</option>
          </select>
        </div>
        <div className="pt-2">
          <button disabled={submitting || !enabled} className={`inline-flex items-center rounded-lg px-5 py-2.5 text-white shadow ${enabled ? 'bg-gray-900 hover:opacity-90' : 'bg-gray-400 opacity-60 cursor-not-allowed'}`}>
            {submitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function Report() {
  return (
    <main>
      <Navbar/>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-sky-50 via-white to-rose-50" />
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-sky-200/30 blur-3xl -z-10" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-rose-200/40 blur-3xl -z-10" />

        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="pt-24" />
          <ReportFormContent enabled={false} />
          <div className="my-10" />
        </div>
      </section>
    </main>
  )
}
