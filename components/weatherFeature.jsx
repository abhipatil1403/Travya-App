import React, { useState, useEffect } from "react";
import { getWeatherByCoords } from "../api/weatherAPI";

const WeatherFeature = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(0);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeather(position.coords.latitude, position.coords.longitude);
        },
        () => {
          setError("Location access denied");
          setLoading(false);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
    }
  }, []);

  const fetchWeather = async (lat, lon) => {
    try {
      const result = await getWeatherByCoords(lat, lon);
      setData(result.weather);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (weatherCode) => {
    const code = parseInt(weatherCode);
    if (code >= 0 && code <= 2) return "☀️"; // Clear sky
    if (code >= 3 && code <= 48) return "☁️"; // Cloudy
    if (code >= 51 && code <= 67) return "🌧️"; // Rain
    if (code >= 71 && code <= 77) return "❄️"; // Snow
    if (code >= 80 && code <= 86) return "⛈️"; // Thunderstorm
    return "🌤️"; // Default
  };

  const getWeatherDescription = (weatherCode) => {
    const code = parseInt(weatherCode);
    if (code >= 0 && code <= 2) return "Clear sky";
    if (code >= 3 && code <= 48) return "Cloudy";
    if (code >= 51 && code <= 67) return "Rain";
    if (code >= 71 && code <= 77) return "Snow";
    if (code >= 80 && code <= 86) return "Thunderstorm";
    return "Unknown";
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const isToday = (dateString) => {
    const today = new Date().toDateString();
    const date = new Date(dateString).toDateString();
    return today === date;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
        {/* Animated Weather Icon */}
        <div className="relative mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center animate-pulse">
            <div className="text-4xl animate-bounce">🌤️</div>
          </div>
          {/* Rotating ring around the icon */}
          <div className="absolute inset-0 w-20 h-20 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
        
        {/* Loading text with typing animation */}
        <div className="text-center">
          <h3 className="text-xl font-semibold text-blue-800 mb-2">
            <span className="animate-pulse">Loading Weather Data</span>
          </h3>
          <div className="flex items-center justify-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
          </div>
          <p className="text-blue-600 text-sm mt-3 opacity-75">
            Fetching your local weather information...
          </p>
        </div>
        
        {/* Progress bar */}
        <div className="w-64 h-2 bg-blue-200 rounded-full mt-6 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-600">
        {error}
      </div>
    );
  }

  if (!data || !data.current) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-600">
        No weather data available
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Current Weather Header */}
      <div className="bg-gradient-to-r from-blue-400 to-blue-500 text-white p-6 rounded-t-xl">
        <h2 className="text-2xl font-bold mb-2">Current Weather</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-4xl">{getWeatherIcon(data.current.condition)}</div>
            <div>
              <div className="text-3xl font-bold">{Math.round(data.current.temperature)}°C</div>
              <div className="text-blue-100">{getWeatherDescription(data.current.condition)}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg">💧 {data.current.humidity}%</div>
            <div className="text-blue-100">Humidity</div>
          </div>
        </div>
      </div>

      {/* Daily Forecast Tabs */}
      {data.daily && data.daily.length > 0 && (
        <div className="bg-white border-x border-b border-blue-200 rounded-b-xl overflow-hidden">
          <div className="flex overflow-x-auto bg-blue-50">
            {data.daily.map((day, index) => (
              <button
                key={index}
                onClick={() => setSelectedDay(index)}
                className={`flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                  selectedDay === index
                    ? 'bg-blue-500 text-white'
                    : 'text-blue-600 hover:bg-blue-100'
                } ${isToday(day.date) ? 'border-b-2 border-blue-500' : ''}`}
              >
                <div className="text-center">
                  <div className="text-xs opacity-75">
                    {isToday(day.date) ? 'Today' : formatDate(day.date)}
                  </div>
                  <div className="text-lg">{getWeatherIcon(day.weatherCode)}</div>
                  <div className="text-xs">
                    {Math.round(day.maxTemp)}°/{Math.round(day.minTemp)}°
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Selected Day Details */}
          {data.daily[selectedDay] && (
            <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Weather Overview */}
                <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-800 mb-3">Weather Overview</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-blue-600">Condition:</span>
                      <span className="font-medium">{getWeatherDescription(data.daily[selectedDay].weatherCode)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-blue-600">High:</span>
                      <span className="font-medium">{Math.round(data.daily[selectedDay].maxTemp)}°C</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-blue-600">Low:</span>
                      <span className="font-medium">{Math.round(data.daily[selectedDay].minTemp)}°C</span>
                    </div>
                  </div>
                </div>

                {/* Temperature Range */}
                <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-800 mb-3">Temperature Range</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <span className="text-sm text-blue-600">Maximum</span>
                      <span className="font-medium">{Math.round(data.daily[selectedDay].maxTemp)}°C</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                      <span className="text-sm text-blue-600">Minimum</span>
                      <span className="font-medium">{Math.round(data.daily[selectedDay].minTemp)}°C</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-400 to-red-400 h-2 rounded-full"
                        style={{
                          width: `${((data.daily[selectedDay].maxTemp - data.daily[selectedDay].minTemp) / 30) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-800 mb-3">Additional Info</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-blue-600">Date:</span>
                      <span className="font-medium">{formatDate(data.daily[selectedDay].date)}</span>
                    </div>
                    {data.daily[selectedDay].precipitationChance !== null && (
                      <div className="flex items-center justify-between">
                        <span className="text-blue-600">Rain Chance:</span>
                        <span className="font-medium">{data.daily[selectedDay].precipitationChance}%</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-blue-600">Weather:</span>
                      <span className="text-2xl">{getWeatherIcon(data.daily[selectedDay].weatherCode)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WeatherFeature;
