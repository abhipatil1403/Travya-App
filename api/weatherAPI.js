/**
 * Frontend-only weather fetch via Open-Meteo (no backend).
 * Replaces localhost API for Netlify static deployment.
 */
export const getWeatherByCoords = async (lat, lon) => {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data?.reason || 'Weather fetch failed');
    // Map to expected format for WeatherFeature component
    const current = data.current || {};
    const daily = (data.daily || {}).time || [];
    return {
      weather: {
        current: {
          temperature: current.temperature_2m,
          humidity: current.relative_humidity_2m,
          condition: current.weather_code,
        },
        daily: daily.map((date, i) => ({
          date,
          weatherCode: (data.daily.weather_code || [])[i],
          maxTemp: (data.daily.temperature_2m_max || [])[i],
          minTemp: (data.daily.temperature_2m_min || [])[i],
          precipitationChance: (data.daily.precipitation_probability_max || [])[i],
        })),
      },
    };
  } catch (err) {
    throw new Error(err?.message || 'Error fetching weather');
  }
};
