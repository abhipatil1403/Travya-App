import React, { useState, useEffect } from 'react'
import Navbar from './navbar'

export default function Home() {
  const [showDemo, setShowDemo] = useState(false)
  const [wx, setWx] = useState({ loading: true, error: '', temp: null, code: null })

  useEffect(() => {
    let cancelled = false
    if (!('geolocation' in navigator)) {
      setWx({ loading: false, error: 'No geolocation', temp: null, code: null })
      return
    }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude, longitude } = pos.coords
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,is_day`;
        const resp = await fetch(url)
        const json = await resp.json()
        if (!cancelled) setWx({ loading: false, error: '', temp: json?.current?.temperature_2m ?? null, code: json?.current?.weather_code ?? null })
      } catch (_) {
        if (!cancelled) setWx({ loading: false, error: 'Weather unavailable', temp: null, code: null })
      }
    }, () => {
      setWx({ loading: false, error: 'Location denied', temp: null, code: null })
    }, { timeout: 8000 })
    return () => { cancelled = true }
  }, [])

  // Close on Escape key
  useEffect(() => {
    if (!showDemo) return
    const onKey = (e) => {
      if (e.key === 'Escape') setShowDemo(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showDemo])

  return (
    <main>
      <Navbar/>
      <section className="relative overflow-hidden">
        {/* Soft background base */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-sky-50 via-white to-rose-50" />
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-sky-200/30 blur-3xl -z-10" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-rose-200/40 blur-3xl -z-10" />

        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="pt-24" />

          {/* 1. Hero Section */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              
              <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900">
                Travya — Your Trusted Companion for <span className="text-sky-600">Tourist Safety</span>
              </h1>
              <p className="mt-4 text-gray-600">
                Real‑time alerts, verified stays, safe routes, and a secure Tourist ID powered by modern tech.
              </p>

              {/* Download badges */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a href="#" className="h-12 w-36 rounded-lg bg-black text-white flex items-center justify-center shadow">Google Play</a>
                <a href="#" className="h-12 w-36 rounded-lg bg-gray-900 text-white flex items-center justify-center shadow">App Store</a>
                <a href="#sos-demo" className="h-12 rounded-lg bg-red-500 px-4 text-white flex items-center justify-center shadow hover:opacity-95">Try SOS Demo</a>
                <a href="/local-register" className="h-12 rounded-lg bg-sky-600 px-4 text-white flex items-center justify-center shadow hover:opacity-95">Register Yourself as Local</a>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg:white/80 bg-white/80 px-4 py-1 text-xs font-medium ring-1 ring-black/10 backdrop-blur">
                Travel Safe. Explore Free.
              </div>
              {/* Compact Weather Widget */}
              <div className="mt-3 inline-flex items-center gap-3 rounded-xl bg-white/90 px-3 py-2 ring-1 ring-black/10 shadow">
                <span>☁️</span>
                <span className="text-sm text-gray-700">
                  {wx.loading ? 'Loading weather…' : (wx.error ? wx.error : `${wx.temp}°C near you`)}
                </span>
                <a href="/weather" className="text-xs text-sky-700 hover:opacity-80">details</a>
              </div>
            </div>

            {/* Hero media */}
            <div className="relative">
              <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl ring-1 ring-black/10 shadow">
                {/* Background image/video placeholder of India travel */}
                <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=1400&auto=format&fit=crop')" }} />
              </div>
            </div>
          </section>

          {/* 2. Why choose Travya (Revamped Feature Grid) */}
          <section className="mt-14">
            <h2 className="text-xl font-semibold text-gray-900">Why choose Travya</h2>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: 'Digital Tourist ID', desc: 'Secure blockchain‑based ID for seamless verification.', color: 'bg-sky-50 text-sky-700 ring-sky-200', icon: '🪪' },
                { title: 'SOS Panic Button', desc: 'Instant alert with live location to verified locals & police.', color: 'bg-rose-50 text-rose-700 ring-rose-200', icon: '🚨' },
                { title: 'Geo‑fencing Alerts', desc: 'Smart warnings when entering unsafe or restricted areas.', color: 'bg-amber-50 text-amber-700 ring-amber-200', icon: '📍' },
                { title: 'AI Safety Monitoring', desc: 'Detects inactivity, unusual routes, and drop‑offs.', color: 'bg-indigo-50 text-indigo-700 ring-indigo-200', icon: '🔍' },
                { title: 'Auto eFIR Filing', desc: 'No activity >24h? System files eFIR with last known details.', color: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200', icon: '🕒' },
                { title: 'Real‑time Tracking', desc: 'Family and authorities can follow your journey live.', color: 'bg-emerald-50 text-emerald-700 ring-emerald-200', icon: '👀' },
                { title: 'AI Chatbot Assistant', desc: '24/7 translator + guide for tips, emergencies, and local info.', color: 'bg-teal-50 text-teal-700 ring-teal-200', icon: '🤖' },
                { title: 'Tourist Safety Score', desc: 'Dynamic score based on travel patterns & area sensitivity.', color: 'bg-cyan-50 text-cyan-700 ring-cyan-200', icon: '🛡️' },
                { title: 'Report Scams & Frauds', desc: 'One‑tap reporting of harassment, scams, or unsafe acts.', color: 'bg-gray-50 text-gray-700 ring-gray-200', icon: '📝' },
              ].map((f, i) => (
                <div key={i} className="group relative overflow-hidden rounded-2xl bg-white p-6 ring-1 ring-black/10 shadow">
                  <div className={`inline-flex items-center gap-2 rounded-full ${f.color} px-3 py-1 text-xs font-medium ring-1`}> 
                    <span>{f.icon}</span>
                    <span>{f.title}</span>
                  </div>
                  <p className="mt-3 text-sm text-gray-600">{f.desc}</p>
                  <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-white/0 to-black/5 opacity-0 transition group-hover:opacity-100" />
                </div>
              ))}
            </div>
          </section>

          {/* Classy: 3. Minimal Horizontal Stepper */}
          <section className="mt-16">
            <div className="text-center">
              <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">How Travya Works</h2>
              <p className="mt-2 text-sm text-gray-600">A calm, simple journey from sign‑up to always‑on protection.</p>
            </div>

            <div className="mt-10">
              {/* Gradient line */}
              <div className="relative">
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                <ol className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {[
                    { n: '01', t: 'Sign up & Digital ID', d: 'Secure blockchain identity in seconds.' },
                    { n: '02', t: 'Dashboard', d: 'Safety Score, Chatbot, features.' },
                    { n: '03', t: 'Smart Protection', d: 'Geo‑fencing, tracking, AI monitoring.' },
                    { n: '04', t: 'Emergency Suite', d: 'SOS, auto eFIR, report incidents.' },
                  ].map((s, i) => (
                    <li key={i} className="text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white shadow ring-1 ring-black/10">
                        <span className="text-sm font-semibold tracking-widest text-gray-900">{s.n}</span>
                      </div>
                      <div className="mt-3 text-base font-semibold text-gray-900">{s.t}</div>
                      <div className="mt-1 text-xs text-gray-600">{s.d}</div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Refined CTA below */}
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a href="#" className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-6 py-3 text-white shadow hover:opacity-90">
                  <span>Download Travya</span>
                </a>
                <button onClick={() => setShowDemo(true)} className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-gray-900 ring-1 ring-black/10 shadow hover:bg-gray-50">
                  <span>Watch Demo</span>
                </button>
              </div>
            </div>
          </section>

          {/* Essential Apps in India (E-commerce, Food, Rides) */}
          <section className="mt-14 rounded-2xl bg-white/80 p-6 ring-1 ring-black/10 shadow backdrop-blur">
            <h2 className="text-xl font-semibold text-gray-900">Essential apps in India</h2>
            <p className="mt-1 text-sm text-gray-600">Popular apps tourists use for daily convenience.</p>
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[ 
                { name: 'Blinkit', url: 'https://www.blinkit.com', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Blinkit_logo.svg/512px-Blinkit_logo.svg.png', bg: 'bg-[#e7f8e8]' },
                { name: 'Zomato', url: 'https://www.zomato.com', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Zomato_logo.png/512px-Zomato_logo.png', bg: 'bg-[#ffe9e9]' },
                { name: 'Rapido', url: 'https://www.rapido.bike', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Rapido_logo.svg/512px-Rapido_logo.svg.png', bg: 'bg-[#fff7d6]' },
                { name: 'Uber', url: 'https://www.uber.com', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Uber_logo_2018.png/512px-Uber_logo_2018.png', bg: 'bg-gray-100' },
                { name: 'Amazon', url: 'https://www.amazon.in', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/512px-Amazon_logo.svg.png', bg: 'bg-[#fff7e6]' },
                { name: 'Flipkart', url: 'https://www.flipkart.com', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Flipkart_logo.svg/512px-Flipkart_logo.svg.png', bg: 'bg-[#e7f1ff]' },
              ].map((app, i) => (
                <a key={i} href={app.url} target="_blank" rel="noopener noreferrer" className={`flex h-16 items-center justify-center rounded-lg ${app.bg} ring-1 ring-black/10 hover:opacity-90 transition`}>
                  <img src={app.logo} alt={`${app.name} logo`} className="max-h-8 object-contain" />
                </a>
              ))}
            </div>
          </section>

          {/* 6. Testimonials */}
          <section className="mt-14">
            <h2 className="text-xl font-semibold text-gray-900">What travelers say</h2>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { q: 'I felt safe traveling in Delhi with this app.', r: 5 },
                { q: 'Live alerts and safe routes were a game changer.', r: 5 },
                { q: 'Verified stays helped me avoid scams.', r: 4 },
              ].map((t, i) => (
                <div key={i} className="rounded-2xl bg-white/80 p-6 ring-1 ring-black/10 shadow backdrop-blur">
                  <div className="text-amber-500">{'★★★★★'.slice(0, t.r)}</div>
                  <p className="mt-2 text-gray-700">“{t.q}”</p>
                </div>
              ))}
            </div>
          </section>

          {/* 7. Repeated Download CTA with QR */}
          <section className="mt-16 rounded-2xl bg-white/80 p-6 ring-1 ring-black/10 shadow backdrop-blur">
            <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-6">
              <div className="md:col-span-2">
                <h3 className="text-2xl font-extrabold text-gray-900">Get Travya today</h3>
                <p className="mt-2 text-gray-600">Scan or tap to download the app and travel with confidence.</p>
                <div className="mt-4 flex items-center gap-3">
                  <a href="#" className="h-12 w-36 rounded-lg bg-black text-white flex items-center justify-center shadow">Google Play</a>
                  <a href="#" className="h-12 w-36 rounded-lg bg-gray-900 text-white flex items-center justify-center shadow">App Store</a>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="h-28 w-28 rounded-lg bg-white ring-1 ring-black/10 shadow flex items-center justify-center text-gray-400">
                  QR
                </div>
              </div>
            </div>
          </section>

          {/* 8. Footer */}
          <footer className="mt-16 mb-10 grid grid-cols-1 md:grid-cols-4 gap-8 text-sm text-gray-600">
            <div>
              <div className="text-gray-900 font-semibold">About Us</div>
              <p className="mt-2">Travya is building the safest travel experience with real‑time intelligence.</p>
            </div>
            <div>
              <div className="text-gray-900 font-semibold">Contact & Support</div>
              <ul className="mt-2 space-y-1">
                <li><a href="#" className="hover:underline">Help Center</a></li>
                <li><a href="#" className="hover:underline">support@travya.app</a></li>
                <li><a href="#" className="hover:underline">+91‑00000‑00000</a></li>
              </ul>
            </div>
            <div>
              <div className="text-gray-900 font-semibold">Privacy & Terms</div>
              <ul className="mt-2 space-y-1">
                <li><a href="#" className="hover:underline">Privacy Policy</a></li>
                <li><a href="#" className="hover:underline">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <div className="text-gray-900 font-semibold">Follow</div>
              <div className="mt-2 flex items-center gap-3">
                <a href="#" className="rounded-full bg-white p-2 ring-1 ring-black/10 shadow">𝕏</a>
                <a href="#" className="rounded-full bg-white p-2 ring-1 ring-black/10 shadow">📘</a>
                <a href="#" className="rounded-full bg-white p-2 ring-1 ring-black/10 shadow">📸</a>
              </div>
            </div>
            <div className="md:col-span-4 mt-6 text-center">© {new Date().getFullYear()} Travya</div>
          </footer>
        </div>
      </section>

      {/* Demo Video Modal */}
      {showDemo && (
        <div onClick={() => setShowDemo(false)} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-4xl rounded-2xl bg-white/90 ring-1 ring-black/10 shadow-xl overflow-hidden">
            <button onClick={() => setShowDemo(false)} className="absolute right-3 top-3 rounded-full bg-white/80 px-3 py-1 text-sm ring-1 ring-black/10 shadow hover:bg-white">Close</button>
            <div className="relative aspect-video w-full">
              <iframe
                src="https://www.veed.io/view/7db28026-8736-4543-adc3-ddac6ee4b55c?panel=share"
                title="Travya Demo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            </div>
          </div>
        </div>
      )}
    </main>
  )
}