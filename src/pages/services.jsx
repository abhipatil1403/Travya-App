import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './navbar';

// Replace with your own content: external services
const apps = {
  cabs: [
    { name: 'Uber', url: 'https://m.uber.com' },
    { name: 'Ola', url: 'https://book.olacabs.com' },
    { name: 'Rapido', url: 'https://www.rapido.bike' },
  ],
  food: [
    { name: 'Zomato', url: 'https://www.zomato.com' },
    { name: 'Swiggy', url: 'https://www.swiggy.com' },
  ],
  grocery: [
    { name: 'Blinkit', url: 'https://blinkit.com' },
    { name: 'Zepto', url: 'https://www.zepto.com' },
  ],
};

export default function ServicesHub() {
  const navigate = useNavigate();

  const open = (url) => window.open(url, '_blank');

  const Section = ({ title, emoji, items, icons = {} }) => (
    <section className="mt-10">
      <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">{emoji} {title}</h2>
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
        {items.map((it) => (
          <button key={it.name} onClick={() => open(it.url)} className="flex items-center gap-4 rounded-2xl bg-white p-6 ring-1 ring-black/10 shadow hover:opacity-95 text-left">
            {icons[it.name] ? (
              <img src={icons[it.name]} alt={it.name} className="h-14 w-14 object-contain rounded" />
            ) : (
              <div className="h-14 w-14 rounded-xl bg-sky-50 flex items-center justify-center text-2xl">{emoji}</div>
            )}
            <div>
              <div className="text-lg font-semibold text-gray-900">{it.name}</div>
              <div className="text-sm text-gray-600">Open in browser/app</div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );

  return (
    <main>
      <Navbar/>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-sky-50 via-white to-rose-50" />
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-sky-200/30 blur-3xl -z-10" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-rose-200/40 blur-3xl -z-10" />

        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="pt-24" />

          <header className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1 text-xs font-medium ring-1 ring-black/10 backdrop-blur">Explore</div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900">Travel Services</h1>
            <p className="mt-2 text-sm text-gray-600">Quick access to hotels, cabs, food and grocery apps</p>
        </header>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <button onClick={() => navigate('/services/hotels')} className="flex items-center gap-4 rounded-2xl bg-white p-6 ring-1 ring-black/10 shadow text-left">
              <div className="h-14 w-14 rounded-xl bg-sky-50 flex items-center justify-center text-2xl">🏨</div>
            <div>
                <div className="text-lg font-semibold text-gray-900">Your Hotels</div>
                <div className="text-sm text-gray-600">Manage photos, address, booking</div>
            </div>
          </button>
            <button onClick={() => navigate('/services/events')} className="flex items-center gap-4 rounded-2xl bg-white p-6 ring-1 ring-black/10 shadow text-left">
              <div className="h-14 w-14 rounded-xl bg-rose-50 flex items-center justify-center text-2xl">📅</div>
            <div>
                <div className="text-lg font-semibold text-gray-900">Local Events</div>
                <div className="text-sm text-gray-600">Add fairs, shows, activities</div>
            </div>
          </button>
        </div>

        <Section
          title="Cabs"
          emoji="🚕"
          items={apps.cabs}
          icons={{
            Uber: 'https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png',
            Ola: 'https://upload.wikimedia.org/wikipedia/commons/3/3b/Ola_Cabs_Logo.png',
            Rapido: 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Rapido_logo.svg',
          }}
        />
        <Section
          title="Food Delivery"
          emoji="🍽️"
          items={apps.food}
          icons={{
            Zomato: 'https://upload.wikimedia.org/wikipedia/commons/7/75/Zomato_logo.png',
            Swiggy: 'https://upload.wikimedia.org/wikipedia/commons/1/13/Swiggy_logo.png',
          }}
        />
        <Section
          title="Grocery"
          emoji="🛒"
          items={apps.grocery}
          icons={{
            Blinkit: 'https://upload.wikimedia.org/wikipedia/commons/7/7f/Blinkit_logo.svg',
            Zepto: 'https://upload.wikimedia.org/wikipedia/commons/4/4f/Zepto_logo.png',
          }}
        />

          <div className="my-10" />
      </div>
      </section>
    </main>
  );
}


