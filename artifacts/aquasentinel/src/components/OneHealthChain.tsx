import { useState } from 'react';
import { Droplets, Fish, Dog, Users, AlertTriangle, ShieldCheck, ArrowRight, Info } from 'lucide-react';

export interface OneHealthImpactData {
  waterImpact: {
    severity: 'low' | 'moderate' | 'critical';
    summary: string;
    details: string[];
  };
  aquaticImpact: {
    severity: 'low' | 'moderate' | 'critical';
    summary: string;
    speciesAtRisk: string[];
    details: string[];
  };
  animalExposure: {
    severity: 'low' | 'moderate' | 'critical';
    summary: string;
    vectors: string[];
    details: string[];
  };
  humanExposure: {
    severity: 'low' | 'moderate' | 'critical';
    summary: string;
    pathways: string[];
    populationAtRisk: string;
    details: string[];
  };
  overallRisk: {
    score: number;
    severityBand: string;
    leadTimeHours: number;
  };
  supportingEvidence: string[];
}

export const DEFAULT_ONE_HEALTH_IMPACT: OneHealthImpactData = {
  waterImpact: {
    severity: 'critical',
    summary: 'Severe turbidity spike (+525%) & dissolved oxygen depletion (-62%)',
    details: [
      'Turbidity elevated to 75 NTU against 12 NTU baseline (z-score +4.2σ)',
      'Dissolved oxygen plunged to 3.2 mg/L, entering hypoxic stress range (<4.0 mg/L)',
      'Surface runoff coefficient multiplied by 42 mm intense 24h storm precipitation'
    ]
  },
  aquaticImpact: {
    severity: 'critical',
    summary: 'High fish stress, macroinvertebrate mortality, and disrupted spawning beds',
    speciesAtRisk: ['Benthic macroinvertebrates', 'Riparian fry & fingerlings', 'Freshwater carp & tilapia'],
    details: [
      'High suspended sediment clogs fish gill filaments and inhibits filter feeders',
      'Low DO creates anoxic bottom layer threatening benthic invertebrate populations',
      'Loss of light penetration inhibits macrophyte photosynthesis'
    ]
  },
  animalExposure: {
    severity: 'moderate',
    summary: 'Riparian wildlife & livestock drinking water contamination vector',
    vectors: ['Downstream livestock watering', 'Urban stray dogs & domestic pets', 'Wading avian predators'],
    details: [
      'High bacterial and particulate ingestion potential for animals grazing near riparian edges',
      'Secondary exposure via bioaccumulation from feeding on stressed aquatic prey',
      'Potential cyanotoxin exposure risk if stagnation follows storm flush'
    ]
  },
  humanExposure: {
    severity: 'critical',
    summary: 'Downstream recreational contact, artisanal fishing, and potable intake risk',
    pathways: ['Artisanal subsistence fishing', 'Recreational wading & bathing', 'Municipal storm overflow cross-contamination'],
    populationAtRisk: '~12,000 residents in direct downstream floodplain',
    details: [
      'Aerosolization and skin contact dermatitis hazard for waterfront communities',
      'Elevated pathogen ingestion risk for informal settlements along the canal reach',
      'Municipal water utility alerted to ramp up coagulant dosing at downstream intake'
    ]
  },
  overallRisk: {
    score: 82,
    severityBand: 'Critical One Health Alert',
    leadTimeHours: 4.5
  },
  supportingEvidence: [
    'USGS NWIS Telemetry: Stream discharge +180% surge & turbidity excursion',
    'Open-Meteo Weather: 42 mm localized precipitation pulse',
    '8 Independent Citizen Reports: Clustered sightings of foul odor & discolored plume',
    'Rolling Z-Score Anomaly Detector: Exceeds +2.5σ critical threshold'
  ]
};

export function OneHealthChainBanner({ activeNode = 'water', onSelectNode }: { activeNode?: string; onSelectNode?: (node: string) => void }) {
  const nodes = [
    { id: 'water', label: '1. Water Contamination', icon: Droplets, color: 'text-cyan-700 bg-cyan-50 border-cyan-300' },
    { id: 'aquatic', label: '2. Aquatic Stress', icon: Fish, color: 'text-blue-700 bg-blue-50 border-blue-300' },
    { id: 'animal', label: '3. Animal Exposure', icon: Dog, color: 'text-amber-700 bg-amber-50 border-amber-300' },
    { id: 'human', label: '4. Human Exposure', icon: Users, color: 'text-rose-700 bg-rose-50 border-rose-300' },
    { id: 'risk', label: '5. One Health Risk', icon: AlertTriangle, color: 'text-purple-700 bg-purple-50 border-purple-300' },
    { id: 'response', label: '6. Coordinated Action', icon: ShieldCheck, color: 'text-teal-700 bg-teal-50 border-teal-300' }
  ];

  return (
    <div className="panel p-4 overflow-hidden border border-[hsl(var(--primary)/.2)] bg-gradient-to-r from-teal-950/[0.03] to-cyan-950/[0.05]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[hsl(var(--border))] pb-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-teal-600 text-white text-[11px] font-bold">1H</span>
          <div>
            <span className="text-xs font-bold text-slate-800 tracking-wide uppercase">One Health Impact Transmission Chain</span>
            <span className="ml-2 text-[11px] text-[hsl(var(--muted-foreground))]">Connecting water quality, wildlife biology, and human community health</span>
          </div>
        </div>
        <span className="rounded-full bg-teal-50 border border-teal-200 px-2.5 py-0.5 text-[10px] font-bold text-teal-800">
          WHO / UNEP One Health Standard
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {nodes.map((node, i) => {
          const Icon = node.icon;
          const isSelected = activeNode === node.id;
          return (
            <button
              key={node.id}
              onClick={() => onSelectNode?.(node.id)}
              className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all ${
                isSelected
                  ? 'border-teal-600 bg-white/95 shadow-xs ring-2 ring-teal-500/20'
                  : 'border-teal-800/15 bg-white/60 hover:bg-white/90 hover:border-teal-700/30'
              }`}
            >
              <div className={`p-2 rounded-lg ${node.color} mb-1.5`}>
                <Icon size={16} />
              </div>
              <div className="text-[11px] font-bold text-teal-950">{node.label}</div>
              {i < nodes.length - 1 && (
                <span className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-slate-400">
                  <ArrowRight size={10} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function OneHealthImpactCard({ data = DEFAULT_ONE_HEALTH_IMPACT }: { data?: OneHealthImpactData }) {
  const [activeTab, setActiveTab] = useState<'all' | 'water' | 'aquatic' | 'animal' | 'human'>('all');

  return (
    <div className="panel p-5 border-l-4 border-l-teal-600">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[hsl(var(--border))] pb-4">
        <div>
          <div className="eyebrow !text-teal-700">One Health Impact Assessment</div>
          <h3 className="font-display text-lg font-semibold text-slate-900">
            Cross-Species & Human Environmental Exposure Facets
          </h3>
          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
            Evaluating how physical water anomalies cascade into ecological, zoonotic, and public health vulnerabilities.
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-teal-900/[0.05] border border-teal-800/10 p-1 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-2.5 py-1 rounded transition ${activeTab === 'all' ? 'bg-white/95 text-teal-950 shadow-xs border border-teal-700/20 font-bold' : 'text-teal-900/70 hover:text-teal-950'}`}
          >
            All Facets
          </button>
          <button
            onClick={() => setActiveTab('water')}
            className={`px-2.5 py-1 rounded transition ${activeTab === 'water' ? 'bg-white/95 text-teal-950 shadow-xs border border-teal-700/20 font-bold' : 'text-teal-900/70 hover:text-teal-950'}`}
          >
            💧 Water
          </button>
          <button
            onClick={() => setActiveTab('aquatic')}
            className={`px-2.5 py-1 rounded transition ${activeTab === 'aquatic' ? 'bg-white/95 text-teal-950 shadow-xs border border-teal-700/20 font-bold' : 'text-teal-900/70 hover:text-teal-950'}`}
          >
            🐟 Aquatic
          </button>
          <button
            onClick={() => setActiveTab('animal')}
            className={`px-2.5 py-1 rounded transition ${activeTab === 'animal' ? 'bg-white/95 text-teal-950 shadow-xs border border-teal-700/20 font-bold' : 'text-teal-900/70 hover:text-teal-950'}`}
          >
            🐕 Animal
          </button>
          <button
            onClick={() => setActiveTab('human')}
            className={`px-2.5 py-1 rounded transition ${activeTab === 'human' ? 'bg-white/95 text-teal-950 shadow-xs border border-teal-700/20 font-bold' : 'text-teal-900/70 hover:text-teal-950'}`}
          >
            👨‍👩‍👧 Human
          </button>
        </div>
      </div>

      {/* Grid of Facets */}
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {/* Facet 1: Water Impact */}
        {(activeTab === 'all' || activeTab === 'water') && (
          <div className="rounded-xl border border-cyan-200 bg-cyan-50/40 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-cyan-100 text-cyan-800">
                  <Droplets size={16} />
                </span>
                <span className="font-bold text-sm text-cyan-950">💧 Water Body Impact</span>
              </div>
              <span className="rounded bg-rose-100 text-rose-800 px-2 py-0.5 text-[10px] font-bold uppercase">
                {data.waterImpact.severity}
              </span>
            </div>
            <p className="mt-2.5 text-xs font-semibold text-slate-800">{data.waterImpact.summary}</p>
            <ul className="mt-2 space-y-1.5 text-[11px] text-slate-600">
              {data.waterImpact.details.map((d, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-cyan-600 mt-0.5">•</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Facet 2: Aquatic Ecosystem Impact */}
        {(activeTab === 'all' || activeTab === 'aquatic') && (
          <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-100 text-blue-800">
                  <Fish size={16} />
                </span>
                <span className="font-bold text-sm text-blue-950">🐟 Aquatic & Ecological Impact</span>
              </div>
              <span className="rounded bg-rose-100 text-rose-800 px-2 py-0.5 text-[10px] font-bold uppercase">
                {data.aquaticImpact.severity}
              </span>
            </div>
            <p className="mt-2.5 text-xs font-semibold text-slate-800">{data.aquaticImpact.summary}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {data.aquaticImpact.speciesAtRisk.map((sp, i) => (
                <span key={i} className="rounded bg-white border border-blue-200 px-2 py-0.5 text-[10px] text-blue-800">
                  {sp}
                </span>
              ))}
            </div>
            <ul className="mt-2 space-y-1.5 text-[11px] text-slate-600">
              {data.aquaticImpact.details.map((d, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Facet 3: Animal Exposure Potential */}
        {(activeTab === 'all' || activeTab === 'animal') && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                  <Dog size={16} />
                </span>
                <span className="font-bold text-sm text-amber-950">🐕 Animal Exposure Potential</span>
              </div>
              <span className="rounded bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-bold uppercase">
                {data.animalExposure.severity}
              </span>
            </div>
            <p className="mt-2.5 text-xs font-semibold text-slate-800">{data.animalExposure.summary}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {data.animalExposure.vectors.map((vec, i) => (
                <span key={i} className="rounded bg-white border border-amber-200 px-2 py-0.5 text-[10px] text-amber-800">
                  {vec}
                </span>
              ))}
            </div>
            <ul className="mt-2 space-y-1.5 text-[11px] text-slate-600">
              {data.animalExposure.details.map((d, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-amber-600 mt-0.5">•</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Facet 4: Human Exposure Potential */}
        {(activeTab === 'all' || activeTab === 'human') && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-rose-100 text-rose-800">
                  <Users size={16} />
                </span>
                <span className="font-bold text-sm text-rose-950">👨‍👩‍👧 Human Exposure Potential</span>
              </div>
              <span className="rounded bg-rose-100 text-rose-800 px-2 py-0.5 text-[10px] font-bold uppercase">
                {data.humanExposure.severity}
              </span>
            </div>
            <p className="mt-2.5 text-xs font-semibold text-slate-800">{data.humanExposure.summary}</p>
            <div className="mt-2 text-[11px] font-semibold text-rose-900">
              At-Risk Exposure: <span className="font-normal">{data.humanExposure.populationAtRisk}</span>
            </div>
            <ul className="mt-2 space-y-1.5 text-[11px] text-slate-600">
              {data.humanExposure.details.map((d, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-rose-600 mt-0.5">•</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Supporting Evidence Banner */}
      <div className="mt-4 rounded-lg bg-teal-900/[0.04] border border-teal-800/15 p-3.5">
        <div className="flex items-center gap-2 text-xs font-bold text-teal-950 mb-2">
          <Info size={14} className="text-teal-700" />
          <span>🔎 Corroborating Evidence Behind This Assessment</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-teal-900/80">
          {data.supportingEvidence.map((ev, i) => (
            <div key={i} className="flex items-start gap-1.5 bg-white/80 backdrop-blur-xs p-2 rounded border border-teal-800/15 shadow-xs">
              <span className="text-teal-600 font-bold">✓</span>
              <span>{ev}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
