import React from 'react'
import Navbar from './navbar'

const EVENTS = [
  { title: 'Shimla Summer Festival', date: 'June 5 - June 9', venue: 'Ridge, Shimla', tag: 'Festival', img: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?q=80&w=1200&auto=format&fit=crop' },
  { title: 'Mall Road Night Market', date: 'Every Saturday, 6pm - 10pm', venue: 'Mall Road', tag: 'Market', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200&auto=format&fit=crop' },
  { title: 'Himalayan Folk Music Night', date: 'July 14, 7pm', venue: 'Gaiety Theatre', tag: 'Music', img: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=1200&auto=format&fit=crop' },
  { title: 'Jakhu Temple Trek', date: 'Sundays, 7am', venue: 'Jakhu Hill Base', tag: 'Outdoor', img: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?q=80&w=1200&auto=format&fit=crop' },
]

export default function LocalEventsPage() {
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
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1 text-xs font-medium ring-1 ring-black/10 backdrop-blur">Services • Events</div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900">Upcoming local events</h1>
            <p className="mt-1 text-sm text-gray-600">Fairs, markets, music and outdoor activities.</p>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {EVENTS.map((ev) => (
              <div key={ev.title} className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/10 shadow">
                <div className="h-40 w-full bg-cover bg-center" style={{ backgroundImage: `url(${ev.img})` }} />
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-semibold text-gray-900">{ev.title}</div>
                    <div className="rounded-full bg-sky-50 px-2.5 py-1 text-xs text-sky-700 ring-1 ring-sky-200">{ev.tag}</div>
                  </div>
                  <div className="text-sm text-gray-600">{ev.venue}</div>
                  <div className="mt-1 text-xs text-gray-500">{ev.date}</div>
                  <div className="mt-3 flex items-center justify-between">
                    <a href="#" className="text-sm text-sky-700 hover:opacity-80">View details</a>
                    <a href="#" className="rounded-full bg-gray-900 px-4 py-2 text-white text-sm shadow hover:opacity-90">Save</a>
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


