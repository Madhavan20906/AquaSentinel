import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useLocation } from 'wouter';
import { Activity, CloudRain, Eye, Layers, Maximize2, Thermometer, Wind } from 'lucide-react';

export interface GisSite {
  id: string;
  name: string;
  waterBody: string;
  city: string;
  country: string;
  region: string;
  status: string;
  risk: number;
  confidence: number;
  latitude: number;
  longitude: number;
  simulated?: boolean;
}

interface GisMapProps {
  sites: GisSite[];
  selectedSiteId?: string;
  onSelectSite?: (siteId: string) => void;
  className?: string;
}

export function GisMap({ sites, selectedSiteId, onSelectSite, className = '' }: GisMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const [, setLocation] = useLocation();

  const [activeLayer, setActiveLayer] = useState<'osm' | 'topo'>('osm');
  const [selectedWeather, setSelectedWeather] = useState<{
    siteId: string;
    temperature: number;
    precipitation: number;
    windSpeed: number;
    source: string;
    timestamp: string;
  } | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    // Default center on Chennai / Adyar or global view
    const defaultCenter: L.LatLngExpression = [13.0067, 80.257];
    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 12,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const tileUrl =
      activeLayer === 'osm'
        ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers when sites change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !sites.length) return;

    // Clear old markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    const bounds = L.latLngBounds([]);

    sites.forEach((site) => {
      const lat = site.latitude;
      const lng = site.longitude;
      if (typeof lat !== 'number' || typeof lng !== 'number') return;

      bounds.extend([lat, lng]);

      const isCritical = site.status === 'critical';
      const isEmerging = site.status === 'emerging' || site.status === 'watch';
      const color = isCritical ? '#e11d48' : isEmerging ? '#d97706' : '#0d9488';

      const customIcon = L.divIcon({
        className: 'custom-gis-pin',
        html: `
          <div style="
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
          ">
            <span style="
              position: absolute;
              width: 100%;
              height: 100%;
              border-radius: 50%;
              background-color: ${color};
              opacity: 0.35;
              animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></span>
            <div style="
              position: relative;
              display: flex;
              align-items: center;
              justify-content: center;
              width: 22px;
              height: 22px;
              border-radius: 50%;
              background-color: ${color};
              border: 2px solid white;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
              color: white;
              font-size: 10px;
              font-weight: bold;
            ">
              ${site.name.slice(0, 2).toUpperCase()}
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

      // Bind rich popup
      const popupHtml = `
        <div style="font-family: inherit; min-width: 200px; padding: 4px;">
          <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600;">${site.waterBody}</div>
          <div style="font-size: 14px; font-weight: bold; margin-top: 2px; color: #0f172a;">${site.name}</div>
          <div style="font-size: 12px; color: #475569;">${site.city}, ${site.country}</div>
          <div style="display: flex; gap: 8px; margin-top: 8px; font-size: 11px;">
            <span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">Risk: <b>${site.risk.toFixed(2)}</b></span>
            <span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">Conf: <b>${site.confidence.toFixed(2)}</b></span>
          </div>
          <div style="margin-top: 10px; border-top: 1px solid #e2e8f0; padding-top: 8px; display: flex; justify-content: space-between;">
            <a href="/sites/${site.id}" style="color: #0d9488; font-weight: 600; text-decoration: none; font-size: 12px;">Open Dossier →</a>
          </div>
        </div>
      `;
      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        if (onSelectSite) onSelectSite(site.id);
        fetchWeatherForSite(site.id);
      });

      markersRef.current.set(site.id, marker);
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [sites]);

  const fetchWeatherForSite = async (siteId: string) => {
    setLoadingWeather(true);
    try {
      const res = await fetch(`/api/sites/${siteId}/live-weather`);
      if (res.ok) {
        const data = await res.json();
        if (data.weather) {
          setSelectedWeather({
            siteId,
            temperature: data.weather.temperature,
            precipitation: data.weather.precipitation,
            windSpeed: data.weather.windSpeed,
            source: data.weather.source,
            timestamp: data.weather.timestamp,
          });
        }
      }
    } catch {
      // ignore
    } finally {
      setLoadingWeather(false);
    }
  };

  const resetView = () => {
    const map = mapInstanceRef.current;
    if (!map || !sites.length) return;
    const bounds = L.latLngBounds(sites.map((s) => [s.latitude, s.longitude]));
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-slate-900 ${className}`}>
      {/* Top Map HUD Controls */}
      <div className="absolute left-3 top-3 z-[1000] flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-white shadow-md backdrop-blur-md">
          <Layers size={13} className="text-teal-400" />
          Production GIS View
        </span>
        <button
          onClick={resetView}
          className="flex items-center gap-1 rounded-lg border border-slate-700/60 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
          title="Fit all stations"
        >
          <Maximize2 size={12} /> Fit stations
        </button>
      </div>

      {/* Live Weather Overlay Card */}
      {selectedWeather && (
        <div className="absolute bottom-3 left-3 z-[1000] max-w-xs rounded-xl border border-slate-700/80 bg-slate-900/95 p-3 text-xs text-white shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-semibold text-teal-400">Live Weather Telemetry</span>
            <span className="font-mono text-[9px] text-slate-400">{selectedWeather.source}</span>
          </div>
          <div className="mt-2.5 grid grid-cols-3 gap-2 text-center">
            <div className="rounded bg-slate-800/60 p-1.5">
              <Thermometer size={14} className="mx-auto text-amber-400" />
              <div className="mt-1 font-mono font-bold">{selectedWeather.temperature}°C</div>
              <div className="text-[9px] text-slate-400">Temp</div>
            </div>
            <div className="rounded bg-slate-800/60 p-1.5">
              <CloudRain size={14} className="mx-auto text-sky-400" />
              <div className="mt-1 font-mono font-bold">{selectedWeather.precipitation} mm</div>
              <div className="text-[9px] text-slate-400">Rain</div>
            </div>
            <div className="rounded bg-slate-800/60 p-1.5">
              <Wind size={14} className="mx-auto text-teal-400" />
              <div className="mt-1 font-mono font-bold">{selectedWeather.windSpeed} km/h</div>
              <div className="text-[9px] text-slate-400">Wind</div>
            </div>
          </div>
        </div>
      )}

      {/* Map DOM Canvas */}
      <div ref={mapContainerRef} className="h-[420px] w-full" data-testid="gis-map-canvas" />
    </div>
  );
}
