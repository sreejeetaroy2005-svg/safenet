import { useEffect, useState } from 'react';
import { useApp } from '../context/useApp';
import { getWeatherAlert } from '../services/weatherService';
import { X, CloudRain, CloudLightning, Wind, CloudSnow, Cloud, AlertTriangle } from 'lucide-react';

const icons = { CloudRain, CloudLightning, Wind, CloudSnow, Cloud };

export default function WeatherBanner() {
  const { location } = useApp();
  const [alert, setAlert] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!location || dismissed) return;
    
    let isMounted = true;
    
    const fetchWeather = async () => {
      const data = await getWeatherAlert(location.lat, location.lng);
      if (isMounted && data && data.severity !== 'info') {
        setAlert(data);
      }
    };
    
    fetchWeather();
    
    // Poll every 10 minutes (600000 ms)
    const interval = setInterval(fetchWeather, 600000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [location, dismissed]);

  if (!alert || dismissed) return null;
  
  const Icon = icons[alert.icon] || AlertTriangle;
  
  const colors = {
    critical: 'bg-red-500/10 border border-red-500/30 text-red-500',
    warning: 'bg-amber-500/10 border border-amber-500/30 text-amber-500',
    info: 'bg-blue-500/10 border border-blue-500/30 text-blue-500'
  };

  const bgClasses = colors[alert.severity] || colors.info;

  return (
    <div className={`mb-5 rounded-2xl p-4 flex items-start gap-3 relative ${bgClasses}`}>
      <div className="shrink-0 p-2 rounded-xl bg-current/10">
        <Icon size={24} className="opacity-80" />
      </div>
      <div className="flex-1 min-w-0 pr-6">
        <h3 className="font-bold text-sm mb-0.5 uppercase tracking-wide">{alert.title}</h3>
        <p className="text-xs opacity-90 leading-relaxed">{alert.message}</p>
      </div>
      <button 
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 p-1.5 rounded-lg opacity-60 hover:opacity-100 transition-opacity"
      >
        <X size={14} />
      </button>
    </div>
  );
}
