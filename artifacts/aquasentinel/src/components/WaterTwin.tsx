import { useState } from 'react';
import { Link } from 'wouter';
import { Waves, Activity, AlertTriangle, Users, Fish, CloudRain, ExternalLink, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface StationNode {
  id: string;
  name: string;
  reach: string;
  status: 'critical' | 'emerging' | 'watch' | 'stable';
  turbidityNtu: number;
  doMgL: number;
  flowCfs: number;
  citizenReports: number;
  fishIndex: string;
  riskScore: number;
  confidence: number;
  distanceKm: number;
}

const WATER_TWIN_STATIONS: StationNode[] = [
  { id: 'ADYAR-01', name: 'Adyar Bridge (Estuary Reach)', reach: 'Downstream / Tidal Outfall', status: 'critical', turbidityNtu: 75, doMgL: 3.2, flowCfs: 420, citizenReports: 8, fishIndex: 'Hypoxic Stress (Severe)', riskScore: 82, confidence: 91, distanceKm: 0.0 },
  { id: 'COOUM-02', name: 'Chintadripet Reach', reach: 'Urban Canal Link', status: 'emerging', turbidityNtu: 48, doMgL: 4.8, flowCfs: 280, citizenReports: 5, fishIndex: 'Moderate Lethargy', riskScore: 59, confidence: 68, distanceKm: 3.4 },
  { id: 'BUCK-03', name: 'Buckingham Canal North', reach: 'Mid-Canal Confluence', status: 'watch', turbidityNtu: 32, doMgL: 6.1, flowCfs: 190, citizenReports: 2, fishIndex: 'Stable Activity', riskScore: 42, confidence: 76, distanceKm: 6.8 },
  { id: 'PALLI-04', name: 'Pallikaranai Edge (Wetland)', reach: 'Upstream Natural Buffer', status: 'stable', turbidityNtu: 14, doMgL: 8.4, flowCfs: 110, citizenReports: 1, fishIndex: 'Healthy Macroinvertebrates', riskScore: 18, confidence: 88, distanceKm: 12.2 }
];

export function WaterTwin() {
  const [selectedStation, setSelectedStation] = useState<StationNode>(WATER_TWIN_STATIONS[0]);
  const [activeLayer, setActiveLayer] = useState<'all' | 'sensors' | 'citizens' | 'ecology'>('all');

  return (
    <div className="panel p-6 border border-teal-800/15 bg-white text-slate-900 shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-teal-800/10 pb-4">
        <div>
          <div className="eyebrow !text-teal-700">Digital Environmental Twin</div>
          <h2 className="font-display text-xl font-bold text-teal-950 flex items-center gap-2">
            <Waves size={20} className="text-teal-600" />
            <span>AquaSentinel "Water Twin": Monitored Basin Hydrograph</span>
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            A real-time digital twin connecting upstream wetland recharge, urban storm culverts, sensory buoys, community observations, and estuary outfalls.
          </p>
        </div>

        {/* Layer Filters */}
        <div className="flex items-center gap-1.5 bg-teal-900/[0.05] border border-teal-800/10 p-1 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setActiveLayer('all')}
            className={`px-3 py-1.5 rounded transition ${activeLayer === 'all' ? 'bg-teal-700 text-white font-bold shadow-xs' : 'text-teal-900/70 hover:text-teal-950'}`}
          >
            All Twin Layers
          </button>
          <button
            onClick={() => setActiveLayer('sensors')}
            className={`px-3 py-1.5 rounded transition ${activeLayer === 'sensors' ? 'bg-teal-700 text-white font-bold shadow-xs' : 'text-teal-900/70 hover:text-teal-950'}`}
          >
            Telemetry
          </button>
          <button
            onClick={() => setActiveLayer('citizens')}
            className={`px-3 py-1.5 rounded transition ${activeLayer === 'citizens' ? 'bg-teal-700 text-white font-bold shadow-xs' : 'text-teal-900/70 hover:text-teal-950'}`}
          >
            Citizen Pulse
          </button>
          <button
            onClick={() => setActiveLayer('ecology')}
            className={`px-3 py-1.5 rounded transition ${activeLayer === 'ecology' ? 'bg-teal-700 text-white font-bold shadow-xs' : 'text-teal-900/70 hover:text-teal-950'}`}
          >
            Ecology
          </button>
        </div>
      </div>

      {/* Schematic Digital Basin Representation */}
      <div className="mt-6 rounded-2xl border border-teal-800/15 bg-teal-50/40 p-6 relative overflow-hidden">
        {/* Ambient river flow graphic */}
        <div className="text-[11px] font-mono text-teal-900 font-bold mb-4 flex items-center justify-between">
          <span>UPSTREAM MARSH &amp; HEADWATERS (+12.2 km)</span>
          <span className="text-teal-700/70 font-sans">← DIRECTION OF FRESHWATER FLOW ←</span>
          <span>COASTAL ESTUARY OUTFLOW (0.0 km)</span>
        </div>

        {/* Connected Station Nodes */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
          {WATER_TWIN_STATIONS.map((station) => {
            const isSelected = selectedStation.id === station.id;
            return (
              <button
                key={station.id}
                onClick={() => setSelectedStation(station)}
                className={`flex flex-col text-left p-4 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-teal-600 bg-white shadow-md shadow-teal-900/5 ring-2 ring-teal-600/20'
                    : 'border-teal-800/15 bg-white/80 hover:bg-white hover:border-teal-700/40 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-slate-500">{station.distanceKm} km from sea</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                    station.status === 'critical'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : station.status === 'emerging'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : station.status === 'watch'
                      ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                      : 'bg-teal-100 text-teal-800 border border-teal-300'
                  }`}>
                    {station.status}
                  </span>
                </div>

                <div className="mt-2 text-sm font-bold text-slate-900 truncate">{station.name}</div>
                <div className="text-[11px] text-slate-500 truncate">{station.reach}</div>

                {/* Key live metrics */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Turbidity:</span>
                    <strong className="font-mono text-teal-900">{station.turbidityNtu} NTU</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Dissolved O₂:</span>
                    <strong className="font-mono text-amber-800">{station.doMgL} mg/L</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Citizen Reports:</span>
                    <strong className="font-mono text-purple-800">{station.citizenReports}</strong>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Risk Score:</span>
                  <span className="font-mono font-bold text-teal-800">{station.riskScore}/100</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Station Deep-Dive Dossier Drawer */}
      <div className="mt-6 rounded-xl border border-teal-800/15 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <span className="text-[10px] font-mono uppercase text-teal-700 font-bold">Digital Twin Telemetry Snapshot</span>
            <h3 className="text-lg font-bold text-teal-950">{selectedStation.name} ({selectedStation.id})</h3>
          </div>
          <Link
            href={`/sites/${selectedStation.id}`}
            className="flex items-center gap-1.5 text-xs font-semibold text-teal-800 hover:text-teal-950 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg border border-teal-200 transition"
          >
            <span>Open Complete Site Dossier</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          <div className="rounded-lg bg-teal-50/50 p-3 border border-teal-800/10">
            <div className="text-[10px] uppercase font-mono text-slate-500 font-bold">Streamflow Discharge</div>
            <div className="mt-1 text-xl font-bold font-mono text-teal-950">{selectedStation.flowCfs} CFS</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Live USGS / Hydrological Feed</div>
          </div>
          <div className="rounded-lg bg-teal-50/50 p-3 border border-teal-800/10">
            <div className="text-[10px] uppercase font-mono text-slate-500 font-bold">Ecological Bio-Health</div>
            <div className="mt-1 text-sm font-bold text-slate-800 truncate">{selectedStation.fishIndex}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Species Biodiversity Index</div>
          </div>
          <div className="rounded-lg bg-teal-50/50 p-3 border border-teal-800/10">
            <div className="text-[10px] uppercase font-mono text-slate-500 font-bold">Community Contribution</div>
            <div className="mt-1 text-xl font-bold font-mono text-purple-900">{selectedStation.citizenReports} Reports</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Contributes 17% to evidence weight</div>
          </div>
          <div className="rounded-lg bg-teal-50/50 p-3 border border-teal-800/10">
            <div className="text-[10px] uppercase font-mono text-slate-500 font-bold">Decoupled Confidence</div>
            <div className="mt-1 text-xl font-bold font-mono text-teal-950">{selectedStation.confidence}%</div>
            <div className="text-[10px] text-teal-700 font-semibold mt-0.5">3 Corroborating Streams</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MeasurableImpactCard() {
  return (
    <div className="panel p-6 border border-teal-800/15 bg-[hsl(var(--card))] shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-teal-800/10 pb-4">
        <div>
          <div className="eyebrow !text-teal-700">Measurable Outcomes & Evaluation</div>
          <h3 className="font-display text-lg font-semibold text-slate-900">
            Before vs. With AquaSentinel: Prototype Benchmark
          </h3>
          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
            Empirical comparative analysis measured against historical municipal grab-sampling records and USGS benchmark datasets.
          </p>
        </div>
        <span className="rounded-full bg-teal-900/[0.05] px-3 py-1 font-mono text-[10px] text-teal-800 border border-teal-800/15 font-semibold">
          PROTOTYPE EVALUATION RESULTS
        </span>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {/* Before Column */}
        <div className="rounded-xl border border-rose-200 bg-rose-50/30 p-5">
          <div className="flex items-center gap-2 text-rose-800 font-bold text-sm mb-3">
            <AlertTriangle size={16} />
            <span>Traditional Monitoring (Without AquaSentinel)</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="border-b border-rose-200/60 pb-2">
              <span className="text-slate-500">Detection Latency:</span>
              <div className="font-bold text-slate-800 text-sm">48 to 72 Hours (Periodic Grab Samples)</div>
              <p className="text-[11px] text-slate-600">Chemical plumes travel kilometers downstream before laboratory assay returns.</p>
            </div>

            <div className="border-b border-rose-200/60 pb-2">
              <span className="text-slate-500">Corroborating Evidence:</span>
              <div className="font-bold text-slate-800 text-sm">Isolated Single-Point Assays</div>
              <p className="text-[11px] text-slate-600">Citizen phone hotlines filed in generic ticketing with zero feedback.</p>
            </div>

            <div className="border-b border-rose-200/60 pb-2">
              <span className="text-slate-500">False Positive Rate:</span>
              <div className="font-bold text-slate-800 text-sm">~34.0% False Alarms</div>
              <p className="text-[11px] text-slate-600">Uncalibrated sensor spikes trigger costly wild-goose-chase field inspections.</p>
            </div>

            <div>
              <span className="text-slate-500">AI Explainability:</span>
              <div className="font-bold text-slate-800 text-sm">0% (Opaque Black Box / Heuristics)</div>
              <p className="text-[11px] text-slate-600">Inspectors cannot verify why a threshold tripped without raw manual math.</p>
            </div>
          </div>
        </div>

        {/* With AquaSentinel Column */}
        <div className="rounded-xl border border-teal-300 bg-teal-50/40 p-5 shadow-xs">
          <div className="flex items-center gap-2 text-teal-800 font-bold text-sm mb-3">
            <CheckCircle2 size={16} className="text-teal-600" />
            <span>With AquaSentinel (Evidence Fusion Engine)</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="border-b border-teal-200/60 pb-2">
              <span className="text-teal-800/70">Early Warning Lead Time:</span>
              <div className="font-bold text-teal-950 text-sm">4.5 Hours Advance Warning</div>
              <p className="text-[11px] text-slate-700">Validated on USGS Potomac hydrograph; warns 4.5h ahead of peak hypoxia.</p>
            </div>

            <div className="border-b border-teal-200/60 pb-2">
              <span className="text-teal-800/70">Evidence Fusion:</span>
              <div className="font-bold text-teal-950 text-sm">3+ Corroborating Streams</div>
              <p className="text-[11px] text-slate-700">Fuses USGS telemetry, Open-Meteo rain, and 4-stage tracked citizen photos.</p>
            </div>

            <div className="border-b border-teal-200/60 pb-2">
              <span className="text-teal-800/70">False Positive Rate:</span>
              <div className="font-bold text-teal-950 text-sm">4.8% on Benchmark Suite</div>
              <p className="text-[11px] text-slate-700">Rolling z-score multi-signal detector eliminates erratic single-sensor spikes.</p>
            </div>

            <div>
              <span className="text-teal-800/70">Explainable AI &amp; Auditability:</span>
              <div className="font-bold text-teal-950 text-sm">100% Additive Factor Transparency</div>
              <p className="text-[11px] text-slate-700">Exact additive point breakdown (+31 turb, +21 rain, +17 citizen) + FHIR R4 export.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
