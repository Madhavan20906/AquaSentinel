import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useLocation } from 'wouter';
import { Activity, AlertTriangle, CloudRain, Download, Eye, Layers, Maximize2, ShieldAlert, Thermometer, Waves, Wind } from 'lucide-react';

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
  const geoJsonLayersRef = useRef<{
    basins?: L.GeoJSON;
    flowlines?: L.GeoJSON;
    plume?: L.GeoJSON;
    intakes?: L.LayerGroup;
  }>({});

  const [, setLocation] = useLocation();

  const [activeLayer, setActiveLayer] = useState<'osm' | 'topo'>('osm');
  const [showBasins, setShowBasins] = useState(true);
  const [showFlowlines, setShowFlowlines] = useState(true);
  const [showPlume, setShowPlume] = useState(true);
  const [showIntakes, setShowIntakes] = useState(true);

  const [selectedWeather, setSelectedWeather] = useState<{
    siteId: string;
    temperature: number;
    precipitation: number;
    windSpeed: number;
    source: string;
    timestamp: string;
  } | null>(null);

  const [activePlume, setActivePlume] = useState<{
    siteId: string;
    siteName: string;
    flowVelocityMs: number;
    affectedIntakes: any[];
  } | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

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

    L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Fetch and Render Watershed Basins, Flowlines, and Drinking Water Intakes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    fetch('/api/gis/features')
      .then((res) => res.json())
      .then((data) => {
        // 1. Basins GeoJSON
        if (geoJsonLayersRef.current.basins) {
          geoJsonLayersRef.current.basins.remove();
        }
        if (data.basins && showBasins) {
          const basinLayer = L.geoJSON(data.basins, {
            style: (feature) => ({
              color: feature?.properties?.strokeColor || '#0284c7',
              weight: 2,
              fillColor: feature?.properties?.fillColor || '#0ea5e9',
              fillOpacity: 0.12,
              dashArray: '4, 4',
            }),
            onEachFeature: (feature, layer) => {
              layer.bindPopup(`
                <div style="font-family: inherit; font-size: 11px; padding: 4px;">
                  <strong style="color: #0369a1; text-transform: uppercase;">Watershed Basin</strong>
                  <div style="font-size: 13px; font-weight: bold; margin-top: 2px;">${feature.properties.name}</div>
                  <div style="color: #64748b; margin-top: 4px;">Drainage Area: <b>${feature.properties.drainageAreaKm2} km²</b></div>
                  <div style="color: #64748b;">Soil Type: ${feature.properties.soilType}</div>
                </div>
              `);
            },
          }).addTo(map);
          geoJsonLayersRef.current.basins = basinLayer;
        }

        // 2. Flowlines GeoJSON
        if (geoJsonLayersRef.current.flowlines) {
          geoJsonLayersRef.current.flowlines.remove();
        }
        if (data.flowlines && showFlowlines) {
          const flowLayer = L.geoJSON(data.flowlines, {
            style: (feature) => ({
              color: feature?.properties?.strokeColor || '#0284c7',
              weight: feature?.properties?.strokeWidth || 3.5,
              opacity: 0.85,
            }),
            onEachFeature: (feature, layer) => {
              layer.bindPopup(`
                <div style="font-family: inherit; font-size: 11px; padding: 4px;">
                  <strong style="color: #0d9488; text-transform: uppercase;">Hydrographic Reach</strong>
                  <div style="font-size: 13px; font-weight: bold; margin-top: 2px;">${feature.properties.reachName}</div>
                  <div style="color: #64748b; margin-top: 4px;">Flow Direction: ${feature.properties.flowDirection}</div>
                  <div style="color: #64748b;">Velocity: <b>${feature.properties.velocityMs} m/s</b></div>
                </div>
              `);
            },
          }).addTo(map);
          geoJsonLayersRef.current.flowlines = flowLayer;
        }

        // 3. Municipal Drinking Water Intakes
        if (geoJsonLayersRef.current.intakes) {
          geoJsonLayersRef.current.intakes.remove();
        }
        if (data.intakes && showIntakes) {
          const intakeGroup = L.layerGroup();
          data.intakes.forEach((intake: any) => {
            const intakeIcon = L.divIcon({
              className: 'custom-intake-pin',
              html: `
                <div style="
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  width: 24px;
                  height: 24px;
                  border-radius: 6px;
                  background-color: ${intake.status === 'urgent_gate_closure_recommended' ? '#ef4444' : '#0284c7'};
                  border: 2px solid white;
                  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
                  color: white;
                  font-size: 11px;
                " title="Municipal Water Intake: ${intake.name}">
                  💧
                </div>
              `,
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            });

            const intakeMarker = L.marker([intake.latitude, intake.longitude], { icon: intakeIcon });
            intakeMarker.bindPopup(`
              <div style="font-family: inherit; font-size: 11px; padding: 4px;">
                <span style="background: ${intake.status === 'urgent_gate_closure_recommended' ? '#fee2e2' : '#e0f2fe'}; color: ${intake.status === 'urgent_gate_closure_recommended' ? '#b91c1c' : '#0369a1'}; padding: 2px 6px; border-radius: 4px; font-weight: bold; text-transform: uppercase;">
                  ${intake.status === 'urgent_gate_closure_recommended' ? '⚠️ URGENT ADVISORY' : 'DRINKING WATER INTAKE'}
                </span>
                <div style="font-size: 13px; font-weight: bold; margin-top: 5px; color: #0f172a;">${intake.name}</div>
                <div style="color: #475569; margin-top: 4px;">Capacity: <b>${intake.capacityMld} MLD</b> · Pop: <b>${(intake.populationServed / 1000).toFixed(0)}k</b></div>
                <div style="color: #64748b; margin-top: 2px;">Distance from Outfall: <b>${intake.distanceKmFromOutfall} km</b></div>
                <div style="color: #b91c1c; font-weight: 600; margin-top: 4px;">Plume Arrival ETA: ~${intake.estimatedPlumeArrivalMinutes} mins</div>
              </div>
            `);
            intakeGroup.addLayer(intakeMarker);
          });
          intakeGroup.addTo(map);
          geoJsonLayersRef.current.intakes = intakeGroup;
        }
      })
      .catch((err) => console.error('GIS features load error', err));
  }, [showBasins, showFlowlines, showIntakes]);

  // Load Plume Dispersion Buffer for target site
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const targetSite = selectedSiteId
      ? sites.find((s) => s.id === selectedSiteId)
      : sites.find((s) => s.status === 'critical') || sites[0];

    if (!targetSite) return;

    fetch(`/api/gis/plume/${targetSite.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((plumeData) => {
        if (!plumeData) return;
        setActivePlume({
          siteId: plumeData.siteId,
          siteName: plumeData.siteName,
          flowVelocityMs: plumeData.flowVelocityMs,
          affectedIntakes: plumeData.affectedIntakes || [],
        });

        if (geoJsonLayersRef.current.plume) {
          geoJsonLayersRef.current.plume.remove();
        }

        if (plumeData.bufferGeoJson && showPlume) {
          const plumeLayer = L.geoJSON(plumeData.bufferGeoJson, {
            style: (feature) => ({
              color: feature?.properties?.strokeColor || '#ef4444',
              weight: 2,
              fillColor: feature?.properties?.fillColor || '#ef4444',
              fillOpacity: feature?.properties?.fillOpacity || 0.35,
            }),
            onEachFeature: (feature, layer) => {
              layer.bindPopup(`
                <div style="font-family: inherit; font-size: 11px; padding: 4px;">
                  <strong style="color: #b91c1c;">${feature.properties.name}</strong>
                  <p style="color: #475569; margin-top: 4px; line-height: 1.4;">${feature.properties.description}</p>
                  <div style="color: #64748b; margin-top: 4px;">Travel Time: ~${feature.properties.travelTimeMinutes} mins</div>
                </div>
              `);
            },
          }).addTo(map);
          geoJsonLayersRef.current.plume = plumeLayer;
        }
      })
      .catch((err) => console.error('Plume calculation error', err));
  }, [selectedSiteId, sites, showPlume]);

  // Update site markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !sites.length) return;

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

      const popupHtml = `
        <div style="font-family: inherit; min-width: 210px; padding: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600;">${site.waterBody}</span>
            ${site.simulated ? '<span style="font-size: 9px; background: #f1f5f9; padding: 1px 4px; border-radius: 3px; color: #64748b;">SIM</span>' : '<span style="font-size: 9px; background: #ecfdf5; color: #047857; font-weight: bold; padding: 1px 4px; border-radius: 3px;">LIVE USGS</span>'}
          </div>
          <div style="font-size: 14px; font-weight: bold; margin-top: 3px; color: #0f172a;">${site.name}</div>
          <div style="font-size: 12px; color: #475569;">${site.city}, ${site.country}</div>
          <div style="display: flex; gap: 8px; margin-top: 8px; font-size: 11px;">
            <span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">Risk: <b>${site.risk.toFixed(0)}/100</b></span>
            <span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">Confidence: <b>${site.confidence.toFixed(0)}%</b></span>
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
    <div className={`relative overflow-hidden rounded-xl border border-teal-800/20 bg-white ${className}`}>
      {/* Top Map HUD Controls */}
      <div className="absolute left-3 top-3 z-[1000] flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 rounded-lg border border-teal-800/20 bg-white/95 px-3 py-1.5 text-xs font-bold text-teal-950 shadow-md backdrop-blur-md">
          <Layers size={13} className="text-teal-600" />
          Production GIS Risk Engine
        </span>

        {/* Layer Toggles */}
        <div className="hidden sm:flex items-center gap-1 rounded-lg border border-teal-800/20 bg-white/95 p-1 text-[11px] shadow-md backdrop-blur-md">
          <button
            onClick={() => setShowBasins(!showBasins)}
            className={`rounded px-2 py-0.5 transition ${showBasins ? 'bg-sky-100 text-sky-950 font-bold border border-sky-300' : 'text-slate-600 hover:text-slate-900'}`}
            title="Toggle watershed catchment polygons"
          >
            Catchment
          </button>
          <button
            onClick={() => setShowFlowlines(!showFlowlines)}
            className={`rounded px-2 py-0.5 transition ${showFlowlines ? 'bg-teal-100 text-teal-950 font-bold border border-teal-300' : 'text-slate-600 hover:text-slate-900'}`}
            title="Toggle hydrographic flowlines"
          >
            Flowlines
          </button>
          <button
            onClick={() => setShowPlume(!showPlume)}
            className={`rounded px-2 py-0.5 transition ${showPlume ? 'bg-rose-100 text-rose-950 font-bold border border-rose-300' : 'text-slate-600 hover:text-slate-900'}`}
            title="Toggle dynamic plume dispersion corridor"
          >
            Plume Buffer
          </button>
          <button
            onClick={() => setShowIntakes(!showIntakes)}
            className={`rounded px-2 py-0.5 transition ${showIntakes ? 'bg-indigo-100 text-indigo-950 font-bold border border-indigo-300' : 'text-slate-600 hover:text-slate-900'}`}
            title="Toggle municipal water intakes"
          >
            Intakes
          </button>
        </div>

        <button
          onClick={resetView}
          className="flex items-center gap-1 rounded-lg border border-teal-800/20 bg-white/95 px-2.5 py-1.5 text-xs font-semibold text-teal-950 hover:bg-teal-50 shadow-md backdrop-blur-md transition"
          title="Fit all stations"
        >
          <Maximize2 size={12} /> Fit
        </button>

        {/* GeoJSON Export Button */}
        <a
          href="/api/gis/export"
          download="aquasentinel-gis-layers.geojson"
          className="flex items-center gap-1.5 rounded-lg border border-teal-700 bg-teal-700 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 transition shadow-md"
          title="Export standard RFC 7946 GeoJSON FeatureCollection for QGIS / ArcGIS"
        >
          <Download size={12} />
          <span>Export GeoJSON</span>
        </a>
      </div>

      {/* Downstream Drinking Water Intake Alert Banner */}
      {activePlume && activePlume.affectedIntakes.length > 0 && (
        <div className="absolute top-14 left-3 right-3 sm:right-auto sm:max-w-md z-[1000] rounded-xl border border-rose-300 bg-white/95 p-3 text-xs text-slate-900 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2 text-rose-700 font-bold border-b border-rose-100 pb-1.5">
            <ShieldAlert size={14} className="animate-pulse" />
            <span>Downstream Receptor Vulnerability Analysis</span>
          </div>
          <div className="mt-2 space-y-1.5 text-[11px]">
            {activePlume.affectedIntakes.map((intake: any) => (
              <div key={intake.id} className="flex justify-between items-center rounded bg-rose-50/70 border border-rose-200/60 px-2 py-1">
                <div>
                  <div className="font-semibold text-slate-900">{intake.name}</div>
                  <div className="text-[10px] text-slate-600">{intake.distanceKmFromOutfall} km downstream · {intake.capacityMld} MLD</div>
                </div>
                <div className="text-right">
                  <span className="rounded bg-rose-100 border border-rose-300 px-1.5 py-0.5 text-[10px] font-mono text-rose-800 font-bold">
                    ETA: {intake.estimatedPlumeArrivalMinutes}m
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-[10px] text-amber-800 font-medium flex items-center gap-1 bg-amber-50 p-1.5 rounded border border-amber-200">
            <AlertTriangle size={11} className="text-amber-700" /> Pre-emptive gate closure recommended for intakes within plume path.
          </div>
        </div>
      )}

      {/* Live Weather Overlay Card */}
      {selectedWeather && (
        <div className="absolute bottom-3 left-3 z-[1000] max-w-xs rounded-xl border border-teal-800/20 bg-white/95 p-3 text-xs text-slate-900 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-teal-100 pb-2">
            <span className="font-bold text-teal-900">Live Weather Telemetry</span>
            <span className="font-mono text-[9px] text-slate-500 font-medium">{selectedWeather.source}</span>
          </div>
          <div className="mt-2.5 grid grid-cols-3 gap-2 text-center">
            <div className="rounded bg-teal-50/80 border border-teal-100 p-1.5">
              <Thermometer size={14} className="mx-auto text-amber-600" />
              <div className="mt-1 font-mono font-bold text-slate-900">{selectedWeather.temperature}°C</div>
              <div className="text-[9px] text-slate-500">Temp</div>
            </div>
            <div className="rounded bg-teal-50/80 border border-teal-100 p-1.5">
              <CloudRain size={14} className="mx-auto text-sky-600" />
              <div className="mt-1 font-mono font-bold text-slate-900">{selectedWeather.precipitation} mm</div>
              <div className="text-[9px] text-slate-500">Rain</div>
            </div>
            <div className="rounded bg-teal-50/80 border border-teal-100 p-1.5">
              <Wind size={14} className="mx-auto text-teal-600" />
              <div className="mt-1 font-mono font-bold text-slate-900">{selectedWeather.windSpeed} km/h</div>
              <div className="text-[9px] text-slate-500">Wind</div>
            </div>
          </div>
        </div>
      )}

      {/* Map DOM Canvas */}
      <div ref={mapContainerRef} className="h-[460px] w-full" data-testid="gis-map-canvas" />
    </div>
  );
}
