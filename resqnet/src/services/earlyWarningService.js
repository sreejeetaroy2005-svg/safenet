/**
 * earlyWarningService.js
 * Fetches multi-hazard early warning data from public APIs.
 *
 * Sources used:
 *  - USGS Earthquake Feed (public, no key)      → real data
 *  - OpenWeatherMap (key optional via env)       → weather-based warnings
 *  - Mock data for cyclone / flood / AQI         → realistic fallback
 *
 * All fetches have 8-second timeouts and fall back to curated mock data
 * so the page always renders something useful even offline.
 */

const USGS_URL =
  'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson'

const OWM_KEY  = import.meta.env.VITE_WEATHER_API_KEY || ''

export function earthquakeSeverity(mag) {
  if (mag >= 7.0) return 'CRITICAL'
  if (mag >= 5.5) return 'HIGH'
  if (mag >= 4.0) return 'MEDIUM'
  return 'LOW'
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export const SEVERITY_CONFIG = {
  CRITICAL: { color: 'text-red-500',    bg: 'bg-red-500/10',    border: 'border-red-500/30',    dot: 'bg-red-500',    label: 'Critical' },
  HIGH:     { color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/30', dot: 'bg-orange-500', label: 'High' },
  MEDIUM:   { color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', dot: 'bg-yellow-500', label: 'Medium' },
  LOW:      { color: 'text-green-500',  bg: 'bg-green-500/10',  border: 'border-green-500/30',  dot: 'bg-green-500',  label: 'Low' },
  INFO:     { color: 'text-blue-500',   bg: 'bg-blue-500/10',   border: 'border-blue-500/10',   dot: 'bg-blue-500',   label: 'Info' },
}

/* ── Timed fetch ────────────────────────────────────────────── */
async function fetchWithTimeout(url, ms = 8000) {
  const ctrl = new AbortController()
  const tid  = setTimeout(() => ctrl.abort(), ms)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    clearTimeout(tid)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  } catch (e) {
    clearTimeout(tid)
    throw e
  }
}

/* ── USGS Earthquakes ───────────────────────────────────────── */
export async function fetchEarthquakes() {
  try {
    const data = await fetchWithTimeout(USGS_URL)
    return data.features
      .filter(f => f.properties.mag >= 2.5)
      .slice(0, 12)
      .map(f => ({
        id:       f.id,
        type:     'earthquake',
        title:    f.properties.title,
        mag:      f.properties.mag,
        place:    f.properties.place,
        time:     f.properties.time,
        severity: earthquakeSeverity(f.properties.mag),
        url:      f.properties.url,
        depth:    f.geometry?.coordinates?.[2] ?? null,
        coords:   f.geometry ? { lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] } : null,
        source:   'USGS',
      }))
  } catch {
    return MOCK_EARTHQUAKES
  }
}

/* ── OpenWeatherMap weather warnings ────────────────────────── */
export async function fetchWeatherWarnings(lat = 20.5937, lng = 78.9629) {
  if (!OWM_KEY) return MOCK_WEATHER_WARNINGS
  try {
    const data = await fetchWithTimeout(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${OWM_KEY}&units=metric`
    )
    const warnings = []
    const w = data.weather?.[0]
    if (!w) return MOCK_WEATHER_WARNINGS

    const windMs = data.wind?.speed || 0
    const rain   = data.rain?.['1h'] || 0
    const temp   = data.main?.temp || 25

    if (windMs > 17)  warnings.push({ id: 'wind',  type: 'cyclone',  severity: windMs > 28 ? 'HIGH' : 'MEDIUM', title: `Strong Winds: ${Math.round(windMs * 3.6)} km/h`,  desc: 'Secure outdoor objects. Avoid exposed areas.', source: 'OpenWeatherMap' })
    if (rain  > 10)   warnings.push({ id: 'rain',  type: 'flood',    severity: rain  > 30  ? 'HIGH' : 'MEDIUM', title: `Heavy Rainfall: ${rain} mm/hr`,                   desc: 'Risk of waterlogging. Avoid low-lying areas.', source: 'OpenWeatherMap' })
    if (temp  > 42)   warnings.push({ id: 'heat',  type: 'heatwave', severity: temp  > 46  ? 'CRITICAL' : 'HIGH', title: `Extreme Heat: ${Math.round(temp)}°C`,            desc: 'Stay indoors. Drink water frequently.', source: 'OpenWeatherMap' })
    if (temp  < 5)    warnings.push({ id: 'cold',  type: 'cold',     severity: 'MEDIUM',                          title: `Cold Wave: ${Math.round(temp)}°C`,               desc: 'Wear warm clothing. Check on elderly neighbours.', source: 'OpenWeatherMap' })

    return warnings.length ? warnings : MOCK_WEATHER_WARNINGS
  } catch {
    return MOCK_WEATHER_WARNINGS
  }
}

export async function fetchAllWarnings(userLat, userLng) {
  const [quakes, weather] = await Promise.all([
    fetchEarthquakes(),
    fetchWeatherWarnings(userLat, userLng),
  ])
  
  const filterByDistance = (items, maxRadius) => {
    return items.filter(item => {
      if (!item.coords) return true; // Keep items without coords just in case
      return haversineKm(userLat, userLng, item.coords.lat, item.coords.lng) <= maxRadius;
    });
  }

  // Generate a dynamic local mock warning so the user always sees something at their location
  const localWeatherWarning = {
    id: 'local-w1',
    type: 'flood',
    severity: 'HIGH',
    title: 'Heavy Rainfall Alert (Local)',
    desc: 'Localized heavy rainfall expected in your immediate vicinity over the next 12 hours.',
    source: 'Local Sensors (Demo)',
    affected: `Within 10km of your location`,
    validUntil: Date.now() + 86400000,
    coords: { lat: userLat, lng: userLng }
  };

  const filterWeatherByDistance = (items) => {
    return items.filter(item => {
      if (!item.coords) return true;
      const dist = haversineKm(userLat, userLng, item.coords.lat, item.coords.lng);
      if (item.type === 'cyclone') return dist <= 300;
      if (item.type === 'flood') return dist <= 150;
      return dist <= 500;
    });
  }

  const localWeather = weather === MOCK_WEATHER_WARNINGS ? [localWeatherWarning, ...filterWeatherByDistance(weather)] : weather;

  return {
    earthquakes:  filterByDistance(quakes, 800),
    weather:      localWeather,
    cyclone:      filterByDistance(MOCK_CYCLONE_WARNINGS, 300),
    flood:        filterByDistance(MOCK_FLOOD_WARNINGS, 150),
    aqi:          filterByDistance(MOCK_AQI, 80),
    lastUpdated:  Date.now(),
  }
}

/* ── Mock data (realistic India-centric) ────────────────────── */
const MOCK_EARTHQUAKES = [
  { id: 'eq1', type: 'earthquake', title: 'M 5.2 - 48 km NNE of Gangtok, India', mag: 5.2, place: 'Gangtok, Sikkim', time: Date.now() - 7200000,  severity: 'HIGH',   depth: 10,  coords: { lat: 27.65, lng: 88.62 }, source: 'USGS (demo)' },
  { id: 'eq2', type: 'earthquake', title: 'M 4.1 - 22 km S of Imphal, India',    mag: 4.1, place: 'Imphal, Manipur', time: Date.now() - 18000000, severity: 'MEDIUM', depth: 35,  coords: { lat: 24.65, lng: 93.92 }, source: 'USGS (demo)' },
  { id: 'eq3', type: 'earthquake', title: 'M 3.4 - Andaman Islands, India',       mag: 3.4, place: 'Andaman Islands', time: Date.now() - 86400000, severity: 'LOW',    depth: 15,  coords: { lat: 11.7,  lng: 92.6  }, source: 'USGS (demo)' },
]

const MOCK_WEATHER_WARNINGS = [
  { id: 'w1', type: 'cyclone',  severity: 'HIGH',     title: 'Cyclone Alert — Bay of Bengal',             desc: 'Cyclonic circulation intensifying. Coastal districts on high alert. Fishermen advised not to venture into sea.', source: 'IMD (demo)', affected: 'Odisha, West Bengal, Andhra Pradesh', validUntil: Date.now() + 86400000 * 2, coords: { lat: 19.8, lng: 85.8 } },
  { id: 'w2', type: 'flood',    severity: 'MEDIUM',   title: 'Flood Watch — Brahmaputra Basin',           desc: 'Water levels rising above danger mark at Dibrugarh and Guwahati gauges. Riverside communities should prepare.', source: 'CWC (demo)',  affected: 'Assam, Arunachal Pradesh',           validUntil: Date.now() + 86400000, coords: { lat: 26.2, lng: 91.7 } },
  { id: 'w3', type: 'heatwave', severity: 'MEDIUM',   title: 'Heat Wave Advisory — Central India',        desc: 'Maximum temperatures 4–6°C above normal. Avoid outdoor activity between 12 PM – 4 PM.', source: 'IMD (demo)',  affected: 'MP, Rajasthan, Vidarbha',            validUntil: Date.now() + 86400000 * 3, coords: { lat: 23.2, lng: 77.4 } },
]

const MOCK_CYCLONE_WARNINGS = [
  { id: 'cy1', type: 'cyclone', severity: 'HIGH',     title: 'Deep Depression — Arabian Sea',             desc: 'Deep depression likely to intensify into cyclonic storm in 24 hours. Gujarat and Goa coast on Yellow Alert.', source: 'IMD',  affected: 'Gujarat, Goa, Maharashtra',          validUntil: Date.now() + 86400000 * 2,   windSpeed: '55–65 km/h', category: 'Deep Depression', coords: { lat: 18.5, lng: 70.0 } },
  { id: 'cy2', type: 'cyclone', severity: 'CRITICAL', title: 'Cyclone BIPARJOY — Active Warning',         desc: 'Category 3 equivalent. Landfall expected within 36 hours. Evacuations underway in low-lying coastal areas.',  source: 'IMD',  affected: 'Odisha, West Bengal coastline',      validUntil: Date.now() + 86400000,        windSpeed: '120–135 km/h', category: 'Very Severe', coords: { lat: 21.0, lng: 88.0 } },
]

const MOCK_FLOOD_WARNINGS = [
  { id: 'fl1', type: 'flood', severity: 'CRITICAL', title: 'Red Alert — Godavari River Flooding',       desc: 'River level 3.2m above danger mark. Immediate evacuation ordered for villages within 5 km of riverbank.', source: 'CWC', affected: 'Telangana, AP',           validUntil: Date.now() + 86400000,     waterLevel: '+3.2m above danger', trend: 'Rising ↑', coords: { lat: 17.5, lng: 80.5 } },
  { id: 'fl2', type: 'flood', severity: 'HIGH',     title: 'Orange Alert — Krishna Basin',              desc: 'Sustained heavy rainfall in catchment area. Dams releasing water at capacity. Downstream communities alert.', source: 'CWC', affected: 'Karnataka, Maharashtra',   validUntil: Date.now() + 86400000 * 2, waterLevel: '+1.8m above danger', trend: 'Rising ↑', coords: { lat: 16.5, lng: 75.0 } },
  { id: 'fl3', type: 'flood', severity: 'MEDIUM',   title: 'Yellow Alert — Yamuna River',               desc: 'Water levels at warning mark. Situation being monitored closely. No immediate evacuation required.', source: 'CWC', affected: 'Delhi, UP',               validUntil: Date.now() + 86400000 / 2, waterLevel: 'At warning mark',   trend: 'Stable →', coords: { lat: 28.6, lng: 77.2 } },
]

const MOCK_AQI = [
  { id: 'aqi1', type: 'aqi', severity: 'CRITICAL', title: 'Severe AQI — Delhi NCR (AQI 420)',  desc: 'Hazardous air quality. N95 mask mandatory outdoors. Schools advised to close. Avoid all outdoor physical activity.', source: 'CPCB', affected: 'Delhi, Gurugram, Noida', aqi: 420, category: 'Severe', coords: { lat: 28.6, lng: 77.2 } },
  { id: 'aqi2', type: 'aqi', severity: 'HIGH',     title: 'Very Poor AQI — Mumbai (AQI 310)', desc: 'Very poor visibility and air quality. Sensitive groups (elderly, children, respiratory patients) should stay indoors.', source: 'CPCB', affected: 'Mumbai Metropolitan',   aqi: 310, category: 'Very Poor', coords: { lat: 19.0, lng: 72.8 } },
]
