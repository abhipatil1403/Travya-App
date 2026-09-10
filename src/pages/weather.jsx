import React, { useEffect, useState } from 'react'
import Navbar from './navbar'

export default function WeatherPage() {
  const [coords, setCoords] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [weather, setWeather] = useState(null)

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported')
      setLoading(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setCoords({ latitude, longitude })
      },
      (err) => {
        setError(err.message || 'Unable to get location')
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  useEffect(() => {
    async function fetchWeather() {
      if (!coords) return
      try {
        setLoading(true)
        setError('')
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;
        const resp = await fetch(url)
        const json = await resp.json()
        setWeather(json)
      } catch (e) {
        setError('Failed to fetch weather')
      } finally {
        setLoading(false)
      }
    }
    fetchWeather()
  }, [coords])

  const current = weather?.current
  const temp = current?.temperature_2m
  const feels = current?.apparent_temperature
  const wind = current?.wind_speed_10m
  const precip = current?.precipitation
  const isDay = current?.is_day === 1
  const daily = weather?.daily
  const days = daily?.time || []
  const tMax = daily?.temperature_2m_max || []
  const tMin = daily?.temperature_2m_min || []
  const wCode = daily?.weather_code || []

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
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Local Weather</h1>
              {coords && (
                <div className="text-xs text-gray-600">{coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}</div>
              )}
            </div>

            {loading && (
              <div className="mt-6 text-gray-700">Loading...</div>
            )}
            {error && (
              <div className="mt-6 text-red-600">{error}</div>
            )}

            {!loading && !error && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl bg-white p-4 ring-1 ring-black/10 shadow">
                  <div className="text-sm text-gray-600">Temperature</div>
                  <div className="mt-1 text-3xl font-extrabold text-gray-900">{temp ?? '-'}°C</div>
                  <div className="text-xs text-gray-500">Feels like {feels ?? '-'}°C</div>
                </div>
                <div className="rounded-xl bg-white p-4 ring-1 ring-black/10 shadow">
                  <div className="text-sm text-gray-600">Wind</div>
                  <div className="mt-1 text-3xl font-extrabold text-gray-900">{wind ?? '-'} km/h</div>
                  <div className="text-xs text-gray-500">{isDay ? 'Daytime' : 'Night'}</div>
                </div>
                <div className="rounded-xl bg-white p-4 ring-1 ring-black/10 shadow">
                  <div className="text-sm text-gray-600">Precipitation</div>
                  <div className="mt-1 text-3xl font-extrabold text-gray-900">{precip ?? '-'} mm</div>
                  <div className="text-xs text-gray-500">Rain probability nearby</div>
                </div>
              </div>
            )}

            {/* Next 6 days forecast */}
            {!loading && !error && days.length >= 2 && (
              <div className="mt-8">
                <div className="text-sm font-semibold text-gray-900 mb-3">Next 6 days</div>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {days.slice(1, 7).map((d, i) => {
                    const idx = i + 1
                    const dateObj = new Date(days[idx])
                    const label = dateObj.toLocaleDateString(undefined, { weekday: 'short' })
                    const max = tMax[idx]
                    const min = tMin[idx]
                    return (
                      <div key={d} className="min-w-[120px] rounded-xl bg-white p-4 ring-1 ring-black/10 shadow text-center">
                        <div className="text-xs text-gray-600">{label}</div>
                        <div className="mt-1 text-lg font-extrabold text-gray-900">{Math.round(max)}° / {Math.round(min)}°</div>
                        <div className="text-xs text-gray-500">wcode {wCode[idx] ?? '-'}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="mt-8 flex items-center gap-3">
              <a href="/" className="inline-flex items-center rounded-lg bg-gray-900 px-5 py-2.5 text-white shadow hover:opacity-90">Back to Home</a>
            </div>
          </div>

          <div className="my-10" />
        </div>
      </section>
    </main>
  )
}


