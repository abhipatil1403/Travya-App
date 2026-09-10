import React from 'react'
import Navbar from './navbar'

const HOTELS = [
  { name: 'The Ridge View Hotel', area: 'Shimla Ridge', rating: 4.6, price: '₹3,800/night', img: 'https://images.unsplash.com/photo-1559599238-0fd6f9b86f5f?q=80&w=1200&auto=format&fit=crop' },
  { name: 'Mall Road Residency', area: 'Mall Road', rating: 4.4, price: '₹2,900/night', img: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1200&auto=format&fit=crop' },
  { name: 'Jakhu Heights Inn', area: 'Jakhu Hill', rating: 4.7, price: '₹4,500/night', img: 'https://images.unsplash.com/photo-1496412705862-e0088f16f791?q=80&w=1200&auto=format&fit=crop' },
  { name: 'Cedar Forest Retreat', area: 'Kufri Road', rating: 4.3, price: '₹2,400/night', img: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=1200&auto=format&fit=crop' },
]

export default function HotelsPage() {
  return (
    <main>
      <Navbar/>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-sky-50 via-white to-rose-50" />
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-sky-200/30 blur-3xl -z-10" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-rose-200/40 blur-3xl -z-10" />

        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="pt-24" />
          <header className="mb-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1 text-xs font-medium ring-1 ring-black/10 backdrop-blur">Services • Hotels</div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900">Popular stays near you</h1>
            <p className="mt-1 text-sm text-gray-600">Browse trusted hotels around key tourist areas.</p>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {HOTELS.map((h) => (
              <div key={h.name} className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/10 shadow">
                <div className="h-40 w-full bg-cover bg-center" style={{ backgroundImage: `url(${h.img})` }} />
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-semibold text-gray-900">{h.name}</div>
                    <div className="text-amber-500 text-sm">★ {h.rating}</div>
                  </div>
                  <div className="text-sm text-gray-600">{h.area}</div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="font-semibold text-gray-900">{h.price}</div>
                    <a href="#" className="rounded-full bg-gray-900 px-4 py-2 text-white text-sm shadow hover:opacity-90">View</a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="my-10" />
        </div>
      </section>
    </main>
  )
}


