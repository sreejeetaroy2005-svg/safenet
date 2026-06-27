/**
 * weatherService.js
 * Fetches live weather data from OpenWeatherMap to provide early warnings.
 */
export async function getWeatherAlert(lat, lon) {
  const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
  if (!API_KEY) {
    // Return mock data for demonstration if no API key is set
    return {
      severity: 'warning',
      title: 'Weather Warning',
      message: 'Heavy rain alert in your area. Potential waterlogging.',
      icon: 'CloudRain'
    };
  }

  try {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
    const data = await res.json();
    if (!data.weather || !data.weather[0]) return null;

    const code = data.weather[0].id;
    const desc = data.weather[0].description;

    if (code >= 200 && code < 300) {
      return { severity: 'critical', title: 'Critical Alert', message: `Thunderstorm (${desc}) detected. Stay indoors.`, icon: 'CloudLightning' };
    }
    if (code >= 500 && code <= 504) {
      return { severity: 'warning', title: 'Heavy Rain Warning', message: `Continuous rain (${desc}) expected. Watch for flooding.`, icon: 'CloudRain' };
    }
    if (code >= 600 && code < 700) {
      return { severity: 'warning', title: 'Snow Alert', message: `Snowfall (${desc}) detected. Roads may be slippery.`, icon: 'CloudSnow' };
    }
    if (code === 781) {
      return { severity: 'critical', title: 'Tornado Warning', message: 'Tornado detected in your vicinity. Seek shelter immediately.', icon: 'Wind' };
    }

    return { severity: 'info', title: 'Weather Update', message: `Current conditions: ${desc}. No immediate threat.`, icon: 'Cloud' };
  } catch (error) {
    console.error('Weather service error:', error);
    return null;
  }
}
