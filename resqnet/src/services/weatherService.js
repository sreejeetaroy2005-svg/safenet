/**
 * weatherService.js
 * Fetches live weather via the SafeNet backend proxy on Render.
 * The OpenWeatherMap key stays server-side only.
 */

const API_URL = import.meta.env.VITE_API_URL  // e.g. https://safenet-backend.onrender.com

export async function getWeatherAlert(lat, lon) {
  if (!API_URL) {
    // Return mock data when backend URL is not configured
    return {
      severity: 'warning',
      title:    'Weather Warning',
      message:  'Heavy rain alert in your area. Potential waterlogging.',
      icon:     'CloudRain',
    }
  }

  try {
    const res  = await fetch(`${API_URL}/api/weather?lat=${lat}&lon=${lon}`)
    if (!res.ok) return null
    const data = await res.json()

    if (!data.weather?.[0]) return null

    const code = data.weather[0].id
    const desc = data.weather[0].description

    if (code >= 200 && code < 300)
      return { severity: 'critical', title: 'Critical Alert',       message: `Thunderstorm (${desc}) detected. Stay indoors.`,              icon: 'CloudLightning' }
    if (code >= 500 && code <= 504)
      return { severity: 'warning',  title: 'Heavy Rain Warning',   message: `Continuous rain (${desc}) expected. Watch for flooding.`,      icon: 'CloudRain' }
    if (code >= 600 && code < 700)
      return { severity: 'warning',  title: 'Snow Alert',           message: `Snowfall (${desc}) detected. Roads may be slippery.`,          icon: 'CloudSnow' }
    if (code === 781)
      return { severity: 'critical', title: 'Tornado Warning',      message: 'Tornado detected in your vicinity. Seek shelter immediately.', icon: 'Wind' }

    return { severity: 'info', title: 'Weather Update', message: `Current conditions: ${desc}. No immediate threat.`, icon: 'Cloud' }
  } catch (err) {
    console.error('[SAFENET] Weather proxy error:', err)
    return null
  }
}
