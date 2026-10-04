import { useState } from 'react';
import { Droplets, Fish, Dog, Users, AlertTriangle, ShieldCheck, ArrowRight, Info, ChevronRight } from 'lucide-react';

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

export interface StageDetail {
  id: string;
  stepNumber: number;
  label: string;
  icon: any;
  badge: string;
  badgeColor: string;
  headline: string;
  subheadline: string;
  mechanism: string;
  indicators: {
    label: string;
    value: string;
    badge?: string;
    isCritical?: boolean;
  }[];
  atRiskEntities: {
    title: string;
    items: string[];
  };
  keyPathways: string[];
  protocolActions: string[];
  cascadeNext: string;
}

export const CHAIN_STAGE_DETAILS: Record<string, StageDetail> = {
  water: {
    id: 'water',
    stepNumber: 1,
    label: '1. Water Contamination',
    icon: Droplets,
    badge: 'Critical Excursion (+525%)',
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    headline: 'Turbidity Spike & Dissolved Oxygen Depletion Plunge',
    subheadline: 'Extreme precipitation flushes non-point agricultural runoff & municipal stormwater',
    mechanism: 'A 42 mm localized precipitation pulse causes heavy hydraulic shear, resuspending benthic silt and overloading organic sediment into the main channel reach.',
    indicators: [
      { label: 'Turbidity', value: '75.4 NTU', badge: '+4.2σ anomaly (Baseline 12 NTU)', isCritical: true },
      { label: 'Dissolved Oxygen', value: '3.2 mg/L', badge: 'Hypoxic threshold (<4.0 mg/L)', isCritical: true },
      { label: 'Stream Discharge', value: '+180% surge', badge: 'USGS NWIS Telemetry', isCritical: false },
      { label: 'Chemical Oxygen Demand', value: '48 mg/L', badge: '+120% elevation', isCritical: false }
    ],
    atRiskEntities: {
      title: 'Vulnerable Water Reaches',
      items: ['Primary catchment reach', 'Riparian wetland margin', 'Municipal raw intake conduit']
    },
    keyPathways: [
      'Urban sheet runoff flushes surface street contaminants and pet feces into river reach',
      'Rapid benthic sediment resuspension abruptly strips water light penetration (<18 cm Secchi)',
      'Intense organic matter decomposition accelerates microbial dissolved oxygen consumption'
    ],
    protocolActions: [
      'Trigger automated stormwater bypass weirs to redirect peak flush into retention basins',
      'Increase optical turbidimeter telemetry polling rate from 1 hour to 5 minutes',
      'Transmit automated early-warning telemetry packet to downstream treatment intake'
    ],
    cascadeNext: 'Suspended sediments and severe hypoxia trigger acute respiratory distress in aquatic life'
  },
  aquatic: {
    id: 'aquatic',
    stepNumber: 2,
    label: '2. Aquatic Stress',
    icon: Fish,
    badge: 'Acute Gill Stress & Anoxia',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    headline: 'Gill Filament Abrasion & Macroinvertebrate Suffocation',
    subheadline: 'Benthic fauna suffocation and larval fish mortality threaten food web stability',
    mechanism: 'Fine suspended silt clogs fish gill lamellae and smothers spawning gravel beds, while anoxic bottom layers cause acute mortality in benthic organisms.',
    indicators: [
      { label: 'Fish Respiratory Stress', value: 'Severe (86/100)', badge: 'Gill clogging verified', isCritical: true },
      { label: 'Benthic Invertebrate Index', value: '-58% density', badge: 'Critical loss', isCritical: true },
      { label: 'Secchi Transparency', value: '16 cm', badge: 'Euphotic zone collapsed', isCritical: true },
      { label: 'Epilithic Biofilm', value: '45% smothered', badge: 'Algal baseline lost', isCritical: false }
    ],
    atRiskEntities: {
      title: 'Threatened Biota & Species',
      items: ['Benthic macroinvertebrates (Mayflies/Caddisflies)', 'Riparian fry & fingerlings', 'Freshwater carp & tilapia']
    },
    keyPathways: [
      'Physical clogging of fish gills triggers lethargy, surface piping, and acute mortality',
      'Loss of photosynthetic light penetration stalls dissolved oxygen re-aeration by macrophytes',
      'Mass invertebrate die-off destabilizes the riverine food chain foundation'
    ],
    protocolActions: [
      'Deploy mobile micro-bubble aerator barges at deep river bends to oxygenate refugia',
      'Enforce emergency 72-hour moratorium on instream gravel dredging and powerboating',
      'Collect water and tissue samples for environmental DNA (eDNA) bio-monitoring'
    ],
    cascadeNext: 'Stressed and dying aquatic life create high-risk ingestion vectors for terrestrial animals'
  },
  animal: {
    id: 'animal',
    stepNumber: 3,
    label: '3. Animal Exposure',
    icon: Dog,
    badge: 'Zoonotic Ingestion Risk',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    headline: 'Riparian Wildlife & Livestock Ingestion Vector',
    subheadline: 'Livestock herds, domestic pets, and riparian fauna drink from contaminated margins',
    mechanism: 'Mammalian and avian wildlife drinking from turbid riverbanks ingest pathogen-adsorbed particles, enterotoxins, and cyanotoxins, creating zoonotic amplification risks.',
    indicators: [
      { label: 'Exposed Livestock Herds', value: '4 grazing parcels', badge: 'Downstream corridor', isCritical: true },
      { label: 'Fecal Coliform Indicator', value: '1,420 CFU/100mL', badge: 'Safe threshold <200', isCritical: true },
      { label: 'Urban Stray Animal Proximity', value: 'High density', badge: 'Canine/feline access', isCritical: false },
      { label: 'Avian Scavenger Activity', value: '+140% concentration', badge: 'Feeding on fish mortality', isCritical: false }
    ],
    atRiskEntities: {
      title: 'Impacted Fauna & Animals',
      items: ['Downstream dairy cattle & goat herds', 'Urban stray dogs & domestic pets', 'Wading avian predators (Herons/Egrets)']
    },
    keyPathways: [
      'Direct watering from unmonitored bank edges causes acute enteritis & dehydration in cattle',
      'Scavengers feeding on hypoxic moribund fish bioaccumulate enteric pathogens',
      'Stagnant warm pooling in riparian shallows fosters rapid cyanobacterial endotoxin blooms'
    ],
    protocolActions: [
      'Dispatch digital geofenced SMS alerts to 34 registered livestock owners along reach',
      'Erect temporary solar-powered perimeter exclusion tape at primary cattle watering points',
      'Deploy veterinary extension officers to monitor for livestock gastrointestinal clusters'
    ],
    cascadeNext: 'Uncontained animal vectors and contaminated river water cascade into human contact zones'
  },
  human: {
    id: 'human',
    stepNumber: 4,
    label: '4. Human Exposure',
    icon: Users,
    badge: '12,000 Population at Risk',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
    headline: 'Potable Intake Vulnerability & Recreational Contact Hazard',
    subheadline: 'Downstream recreational waders, artisanal fishermen, and municipal water utility',
    mechanism: 'Water reaches human communities via raw drinking intake challenge, aerosolization, recreational contact, and subsistence seafood harvesting.',
    indicators: [
      { label: 'Downstream Population', value: '~12,000 residents', badge: 'Direct floodplain reach', isCritical: true },
      { label: 'Municipal Water Intake', value: '3.8 km downstream', badge: '4.5 hr contaminant travel time', isCritical: true },
      { label: 'Skin Contact Hazard', value: 'Dermatitis alert', badge: 'Recreational wading risk', isCritical: false },
      { label: 'Artisanal Fishing Landings', value: '8 active points', badge: 'Subsistence harvesting', isCritical: false }
    ],
    atRiskEntities: {
      title: 'Human Population & Infrastructure',
      items: ['Informal waterfront communities', 'Recreational waders & children', 'Municipal potable water treatment intake']
    },
    keyPathways: [
      'Accidental ingestion and skin contact induce acute waterborne gastroenteritis and dermatitis',
      'Artisanal harvesting of filter-feeding mollusks and fish with bioaccumulated toxins',
      'High raw-water turbidity challenges filtration capacity of the municipal intake works'
    ],
    protocolActions: [
      'Transmit automated SCADA telemetry advisory to Municipal Water Treatment Plant to ramp coagulants',
      'Issue public health advisory: temporary no-swimming & boil-water guidance for reach',
      'Post warning placards at pedestrian boardwalks, informal ghats, and boat launch points'
    ],
    cascadeNext: 'Cross-species telemetry is synthesized into a unified composite One Health Risk score'
  },
  risk: {
    id: 'risk',
    stepNumber: 5,
    label: '5. One Health Risk',
    icon: AlertTriangle,
    badge: 'Score: 82/100 (Critical Tier)',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    headline: 'Unified Multi-Sector Threat Assessment',
    subheadline: 'Triangulated across USGS hydrological telemetry, weather data, and citizen science',
    mechanism: 'A multi-layer Bayesian model fuses environmental sensor readings, ecological vulnerability, and epidemiological density to calculate holistic planetary health risk.',
    indicators: [
      { label: 'Composite Risk Score', value: '82 / 100', badge: 'Tier 3 Critical Alert', isCritical: true },
      { label: 'Model Confidence', value: '94%', badge: 'Triangulated by 4 sources', isCritical: false },
      { label: 'Warning Lead Time', value: '4.5 hours', badge: 'Pre-downstream arrival', isCritical: true },
      { label: 'Citizen Corroboration', value: '8 verified reports', badge: 'Discolored plume sightings', isCritical: false }
    ],
    atRiskEntities: {
      title: 'Cross-Boundary Ecosystem',
      items: ['Regional watershed basin', 'Downstream urban municipal wards', 'Inter-species ecological corridor']
    },
    keyPathways: [
      'Fused data eliminates departmental blind spots between hydrology, veterinary, and public health',
      'Real-time lead-time calculation enables pre-emptive intervention before downstream human arrival',
      'Rolling z-score anomaly detector flags non-linear risk escalation exceeding +2.5σ baseline'
    ],
    protocolActions: [
      'Elevate incident alert from Local Advisory (Tier 1) to Regional Coordinated Protocol (Tier 3)',
      'Generate automated One Health Incident Briefing Report for district disaster leadership',
      'Synchronize live telemetry risk polygon to public dashboard and mobile field responders'
    ],
    cascadeNext: 'Fused threat analytics trigger synchronized multi-agency coordinated countermeasures'
  },
  response: {
    id: 'response',
    stepNumber: 6,
    label: '6. Coordinated Action',
    icon: ShieldCheck,
    badge: '6 of 6 Countermeasures Active',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-300',
    headline: 'WHO / UNEP One Health Standard Countermeasures',
    subheadline: 'Synchronized real-time intervention uniting water utilities, public health, and ecological teams',
    mechanism: 'Automated dispatch matrix executes tailored standard operating procedures across institutional boundaries simultaneously without departmental latency.',
    indicators: [
      { label: 'Incident Command', value: 'Unified One Health Cell', badge: 'Cross-agency response', isCritical: false },
      { label: 'Protocols Deployed', value: '6 / 6 active', badge: '100% dispatch rate', isCritical: false },
      { label: 'Response Latency', value: '< 14 minutes', badge: 'Automated dispatch', isCritical: false },
      { label: 'Mitigation Status', value: 'Active containment', badge: 'Est. 18-24h resolution', isCritical: false }
    ],
    atRiskEntities: {
      title: 'Coordinated Agency Teams',
      items: ['Water Supply & Drainage Board', 'Public Health Epidemiological Team', 'Pollution Control & Wildlife Rangers']
    },
    keyPathways: [
      'Water utility modulates upstream retention gates and increases chlorine/flocculant dwell time',
      'Public health officers establish active waterborne syndromic surveillance near local clinics',
      'Environmental rangers initiate mobile water quality neutralization and aeration sweeps'
    ],
    protocolActions: [
      'Verify deployment of mobile water quality testing van equipped with spectrophotometers',
      'Broadcast hourly containment progress updates on citizen-facing portal for full transparency',
      'Schedule post-event ecological recovery audit and sediment core sampling program'
    ],
    cascadeNext: 'Continuous telemetry monitors recovery until the system safely returns to baseline'
  }
};

export function OneHealthChainBanner({ activeNode = 'water', onSelectNode }: { activeNode?: string; onSelectNode?: (node: string) => void }) {
  const [selectedNodeId, setSelectedNodeId] = useState<string>(activeNode || 'water');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Sync if parent updates activeNode
  const currentNodeId = onSelectNode ? activeNode : selectedNodeId;
  const currentDetail = CHAIN_STAGE_DETAILS[currentNodeId] || CHAIN_STAGE_DETAILS.water;

  const nodeKeys = ['water', 'aquatic', 'animal', 'human', 'risk', 'response'];
  const currentIndex = nodeKeys.indexOf(currentNodeId);

  const handleSelect = (id: string) => {
    setSelectedNodeId(id);
    setIsExpanded(true);
    onSelectNode?.(id);
  };

  const handlePrev = () => {
    const prevIndex = (currentIndex - 1 + nodeKeys.length) % nodeKeys.length;
    handleSelect(nodeKeys[prevIndex]);
  };

  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % nodeKeys.length;
    handleSelect(nodeKeys[nextIndex]);
  };

  const nodes = [
    { id: 'water', label: '1. Water Contamination', icon: Droplets, color: 'text-cyan-700 bg-cyan-50 border-cyan-300' },
    { id: 'aquatic', label: '2. Aquatic Stress', icon: Fish, color: 'text-blue-700 bg-blue-50 border-blue-300' },
    { id: 'animal', label: '3. Animal Exposure', icon: Dog, color: 'text-amber-700 bg-amber-50 border-amber-300' },
    { id: 'human', label: '4. Human Exposure', icon: Users, color: 'text-rose-700 bg-rose-50 border-rose-300' },
    { id: 'risk', label: '5. One Health Risk', icon: AlertTriangle, color: 'text-purple-700 bg-purple-50 border-purple-300' },
    { id: 'response', label: '6. Coordinated Action', icon: ShieldCheck, color: 'text-teal-700 bg-teal-50 border-teal-300' }
  ];

  return (
    <div className="panel p-4 overflow-hidden border border-[hsl(var(--primary)/.2)] bg-gradient-to-r from-teal-950/[0.03] to-cyan-950/[0.05] transition-all">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[hsl(var(--border))] pb-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-teal-600 text-white text-[11px] font-bold">1H</span>
          <div>
            <span className="text-xs font-bold text-slate-800 tracking-wide uppercase">One Health Impact Transmission Chain</span>
            <span className="ml-2 text-[11px] text-[hsl(var(--muted-foreground))]">Connecting water quality, wildlife biology, and human community health</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-teal-50 border border-teal-200 px-2.5 py-0.5 text-[10px] font-bold text-teal-800">
            WHO / UNEP One Health Standard
          </span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 bg-white/70 hover:bg-white px-2.5 py-0.5 rounded border border-teal-200/80 transition"
          >
            {isExpanded ? 'Hide Stage Breakdown ▲' : 'Show Stage Breakdown ▼'}
          </button>
        </div>
      </div>

      {/* 6 Interactive Step Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {nodes.map((node, i) => {
          const Icon = node.icon;
          const isSelected = currentNodeId === node.id;
          return (
            <button
              key={node.id}
              onClick={() => handleSelect(node.id)}
              className={`relative flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all cursor-pointer ${
                isSelected
                  ? 'border-teal-600 bg-white shadow-md ring-2 ring-teal-500/30 font-bold scale-[1.02]'
                  : 'border-teal-800/15 bg-white/60 hover:bg-white/90 hover:border-teal-700/30'
              }`}
            >
              <div className={`p-2 rounded-lg ${node.color} mb-1.5`}>
                <Icon size={16} />
              </div>
              <div className="text-[11px] text-teal-950">{node.label}</div>

              {isSelected && (
                <div className="mt-1 flex items-center gap-1 text-[9px] text-teal-700 font-bold uppercase tracking-wider">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-600 animate-pulse"></span>
                  Active Step
                </div>
              )}

              {i < nodes.length - 1 && (
                <span className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-slate-400">
                  <ArrowRight size={10} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Interactive Detail Drawer for Selected Step */}
      {isExpanded && currentDetail && (
        <div className="mt-4 rounded-xl border border-teal-200/90 bg-white/90 backdrop-blur-xs p-4 shadow-xs animate-in fade-in duration-200">
          {/* Detail Header */}
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-teal-100 pb-3">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 mt-0.5">
                <currentDetail.icon size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
                    Stage {currentDetail.stepNumber} of 6
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${currentDetail.badgeColor}`}>
                    {currentDetail.badge}
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-900 mt-0.5">{currentDetail.headline}</h4>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{currentDetail.subheadline}</p>
              </div>
            </div>

            {/* Stepper Navigation */}
            <div className="flex items-center gap-1.5 self-center">
              <button
                onClick={handlePrev}
                className="px-2.5 py-1 text-xs font-semibold rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition flex items-center gap-1"
                title="Previous transmission stage"
              >
                ← Prev
              </button>
              <span className="font-mono text-xs text-slate-500 px-1">
                {currentDetail.stepNumber}/6
              </span>
              <button
                onClick={handleNext}
                className="px-2.5 py-1 text-xs font-semibold rounded border border-teal-600 bg-teal-600 text-white hover:bg-teal-700 transition flex items-center gap-1"
                title="Next transmission stage"
              >
                Next →
              </button>
            </div>
          </div>

          {/* Core Mechanism */}
          <div className="mt-3 p-3 rounded-lg bg-teal-950/[0.03] border border-teal-800/10 text-xs text-slate-800 leading-relaxed">
            <strong className="text-teal-950 font-semibold">Transmission Mechanism: </strong>
            {currentDetail.mechanism}
          </div>

          {/* Telemetry & Biomarkers Grid */}
          <div className="mt-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2">
              📊 Live Telemetry & Biomarker Indicators
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {currentDetail.indicators.map((ind, idx) => (
                <div key={idx} className="p-2.5 rounded-lg border border-slate-200/80 bg-white shadow-2xs">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase">{ind.label}</div>
                  <div className={`text-sm font-bold mt-1 ${ind.isCritical ? 'text-rose-700' : 'text-teal-900'}`}>
                    {ind.value}
                  </div>
                  {ind.badge && (
                    <div className="text-[9px] text-slate-600 mt-0.5 font-medium truncate" title={ind.badge}>
                      {ind.badge}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Two-Column Breakdown: Impacted Entities vs Recommended Interventions */}
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {/* Impacted Entities & Exposure Pathways */}
            <div className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/60">
              <div className="text-xs font-bold text-slate-900 mb-1.5 flex items-center justify-between">
                <span>🎯 {currentDetail.atRiskEntities.title}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {currentDetail.atRiskEntities.items.map((item, idx) => (
                  <span key={idx} className="rounded bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-800">
                    {item}
                  </span>
                ))}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">
                Exposure Pathways:
              </div>
              <ul className="space-y-1 text-[11px] text-slate-600">
                {currentDetail.keyPathways.map((path, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-teal-600 font-bold">•</span>
                    <span>{path}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommended Cross-Agency Countermeasures */}
            <div className="p-3 rounded-lg border border-teal-200/80 bg-teal-50/40">
              <div className="text-xs font-bold text-teal-950 mb-1.5 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-teal-700" />
                <span>One Health Countermeasure Protocol</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-teal-950/80">
                {currentDetail.protocolActions.map((action, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 bg-white/80 p-1.5 rounded border border-teal-100 shadow-2xs">
                    <span className="text-teal-600 font-bold">✓</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Cascade to Next Stage Footer */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
              <span className="font-semibold text-teal-900">Cascade sequence:</span>
              <span>{currentDetail.cascadeNext}</span>
            </div>
            <button
              onClick={handleNext}
              className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
            >
              Step into next stage <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
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
