import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, CloudRain, Droplets, User, Cpu, Link2, AlertTriangle, ShieldCheck, CheckCircle2, ChevronRight } from 'lucide-react';

export interface ReplayStep {
  time: string;
  title: string;
  icon: any;
  category: 'weather' | 'sensor' | 'citizen' | 'ai' | 'correlation' | 'risk' | 'officer' | 'response';
  riskScore: number;
  confidenceScore: number;
  severity: 'stable' | 'watch' | 'emerging' | 'critical';
  turbidityNtu: number;
  turbidityChangePct: number;
  doMgL: number;
  rainfallMm: number;
  citizenReportsCount: number;
  description: string;
  factorAdditions: { name: string; points: number; note: string }[];
  confidenceReasons: string[];
}

export const INCIDENT_STEPS: ReplayStep[] = [
  {
    time: '14:02',
    title: 'Heavy Rainfall Detected',
    icon: CloudRain,
    category: 'weather',
    riskScore: 28,
    confidenceScore: 54,
    severity: 'watch',
    turbidityNtu: 18,
    turbidityChangePct: 15,
    doMgL: 7.8,
    rainfallMm: 42.0,
    citizenReportsCount: 0,
    description: 'Open-Meteo precipitation feed registers an intense 42 mm localized convective cloudburst upstream in the catchment.',
    factorAdditions: [
      { name: 'Baseline watershed condition', points: 18, note: 'Normal dry-weather flow' },
      { name: 'Rainfall runoff multiplier', points: 10, note: '42 mm precipitation recorded' }
    ],
    confidenceReasons: [
      'Single meteorological data stream active'
    ]
  },
  {
    time: '14:07',
    title: 'Turbidity Surge (+42%)',
    icon: Droplets,
    category: 'sensor',
    riskScore: 46,
    confidenceScore: 68,
    severity: 'watch',
    turbidityNtu: 38,
    turbidityChangePct: 42,
    doMgL: 6.9,
    rainfallMm: 42.0,
    citizenReportsCount: 0,
    description: 'USGS NWIS hydrological station registers sudden increase in suspended particulate load at Adyar Bridge reach.',
    factorAdditions: [
      { name: 'Turbidity excursion', points: 18, note: 'Elevated from 12 NTU to 38 NTU' },
      { name: 'Rainfall runoff correlation', points: 15, note: 'Lagged response to 14:02 storm surge' },
      { name: 'Baseline historical variation', points: 13, note: 'Within seasonal storm envelope' }
    ],
    confidenceReasons: [
      '2 independent data sources active (USGS + Open-Meteo)',
      'Physical hydrological lag matches basin geometry'
    ]
  },
  {
    time: '14:09',
    title: 'Citizen Reports Murky Water & Odor',
    icon: User,
    category: 'citizen',
    riskScore: 62,
    confidenceScore: 78,
    severity: 'emerging',
    turbidityNtu: 54,
    turbidityChangePct: 180,
    doMgL: 5.4,
    rainfallMm: 45.0,
    citizenReportsCount: 3,
    description: 'Local community members submit 3 geo-tagged observations with photos noting murky brownish tint and chemical odor.',
    factorAdditions: [
      { name: 'Turbidity anomaly', points: 24, note: '54 NTU stream load (+180%)' },
      { name: 'Rainfall storm correlation', points: 18, note: 'Surface wash-off multiplier' },
      { name: 'Citizen visual observations', points: 12, note: '3 corroborated reports with photos' },
      { name: 'Dissolved oxygen decline', points: 8, note: 'DO dropping below 6 mg/L' }
    ],
    confidenceReasons: [
      'Ground-level visual observation corroborates sensor spike',
      'Citizen photo passes quality assurance check (88/100)'
    ]
  },
  {
    time: '14:11',
    title: 'Statistical Anomaly Detected (+2.85σ)',
    icon: Cpu,
    category: 'ai',
    riskScore: 74,
    confidenceScore: 84,
    severity: 'emerging',
    turbidityNtu: 68,
    turbidityChangePct: 340,
    doMgL: 4.2,
    rainfallMm: 48.0,
    citizenReportsCount: 5,
    description: 'Rolling Z-Score Anomaly Detector flags a +2.85σ excursion on turbidity, breaching the +2.5σ critical warning threshold.',
    factorAdditions: [
      { name: 'Turbidity z-score spike', points: 28, note: 'Z-score +2.85σ above 30-day rolling μ' },
      { name: 'Rainfall/runoff correlation', points: 20, note: 'Catchment saturation reached' },
      { name: 'Citizen observations', points: 14, note: '5 clustered reports in 30 mins' },
      { name: 'Hypoxic DO stress', points: 12, note: 'DO dropped to 4.2 mg/L' }
    ],
    confidenceReasons: [
      'Statistical threshold breach verified (p < 0.01)',
      'Multiple independent sensing modalities aligned'
    ]
  },
  {
    time: '14:12',
    title: 'Multi-Source Evidence Correlation: HIGH',
    icon: Link2,
    category: 'correlation',
    riskScore: 79,
    confidenceScore: 89,
    severity: 'critical',
    turbidityNtu: 72,
    turbidityChangePct: 450,
    doMgL: 3.6,
    rainfallMm: 50.0,
    citizenReportsCount: 7,
    description: 'Evidence Fusion Engine cross-correlates USGS NWIS streamflow, Open-Meteo precipitation, and 7 citizen notes. High spatial concordance.',
    factorAdditions: [
      { name: 'Multi-signal turbidity pulse', points: 30, note: '72 NTU vs 12 NTU baseline' },
      { name: 'Rainfall runoff correlation', points: 20, note: 'High correlation with upstream pulse' },
      { name: 'Citizen ground observations', points: 16, note: '7 independent community observations' },
      { name: 'Severe DO depletion', points: 13, note: 'DO at 3.6 mg/L (critical hypoxia)' }
    ],
    confidenceReasons: [
      'Spatial clustering: reports within 450m of sensor station',
      'Cross-source corroboration score: 94.2%'
    ]
  },
  {
    time: '14:13',
    title: 'Risk Upgraded: MODERATE → CRITICAL (82)',
    icon: AlertTriangle,
    category: 'risk',
    riskScore: 82,
    confidenceScore: 91,
    severity: 'critical',
    turbidityNtu: 75,
    turbidityChangePct: 525,
    doMgL: 3.2,
    rainfallMm: 52.0,
    citizenReportsCount: 8,
    description: 'Risk assessment escalated to Critical (82/100, 91% confidence). Plain-language explainability cites exact factors. Early warning lead time: 4.5h.',
    factorAdditions: [
      { name: 'Turbidity anomaly', points: 31, note: '+525% above baseline (z-score +4.2σ)' },
      { name: 'Rainfall/runoff correlation', points: 21, note: '52 mm accumulation wash-off' },
      { name: 'Citizen observations', points: 17, note: '8 corroborated ground reports' },
      { name: 'Historical deviation', points: 13, note: 'Exceeds 5-year storm baseline' }
    ],
    confidenceReasons: [
      '3 independent evidence sources agree (Weather, USGS Sensor, Citizen)',
      'Anomaly magnitude exceeds 2.5σ baseline threshold',
      'Citizen observations corroborate physical sensor signals'
    ]
  },
  {
    time: '14:15',
    title: 'Human Officer Reviews Decision Console',
    icon: ShieldCheck,
    category: 'officer',
    riskScore: 82,
    confidenceScore: 91,
    severity: 'critical',
    turbidityNtu: 75,
    turbidityChangePct: 525,
    doMgL: 3.2,
    rainfallMm: 52.0,
    citizenReportsCount: 8,
    description: 'Duty Environmental Officer verifies the signal, inspecting the plain-language factor ledger and photos. Officer confirms alert with 1 click.',
    factorAdditions: [
      { name: 'Turbidity anomaly', points: 31, note: 'Verified by sensor telemetry' },
      { name: 'Rainfall/runoff correlation', points: 21, note: 'Storm event confirmed' },
      { name: 'Citizen observations', points: 17, note: 'Photo evidence verified' },
      { name: 'Historical deviation', points: 13, note: 'Downstream vulnerability confirmed' }
    ],
    confidenceReasons: [
      'Human-in-the-loop verification recorded in audit trail',
      'Accountability attributed to authenticated officer'
    ]
  },
  {
    time: '14:17',
    title: 'Response Dispatched Across Channels',
    icon: CheckCircle2,
    category: 'response',
    riskScore: 82,
    confidenceScore: 91,
    severity: 'critical',
    turbidityNtu: 75,
    turbidityChangePct: 525,
    doMgL: 3.2,
    rainfallMm: 52.0,
    citizenReportsCount: 8,
    description: 'Emergency actions initiated: Telegram alert broadcast to response team, field inspection mission created, and validated HL7 FHIR R4 record published.',
    factorAdditions: [
      { name: 'Turbidity anomaly', points: 31, note: 'Field sampling crew dispatched' },
      { name: 'Rainfall/runoff correlation', points: 21, note: 'Weir gate diversion alerted' },
      { name: 'Citizen observations', points: 17, note: 'Citizens notified via tracker token' },
      { name: 'Historical deviation', points: 13, note: 'FHIR R4 record published to health registry' }
    ],
    confidenceReasons: [
      'Complete end-to-end resilience loop executed',
      'Total response latency: 15 minutes from storm to dispatch'
    ]
  }
];

export function IncidentReplay() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const step = INCIDENT_STEPS[currentStep];

  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= INCIDENT_STEPS.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 3000);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  const reset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };

  return (
    <div className="panel p-6 border-2 border-teal-500/30 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="eyebrow !text-teal-400">Interactive Hackathon Feature Demo</div>
          <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
            <span>🎬 Live Incident Replay: Storm Runoff & Contamination Cascade</span>
            <span className="rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-0.5 text-[10px] font-mono">
              LIVE SIMULATION
            </span>
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Experience how AquaSentinel transforms a sudden storm and contamination pulse into an explainable, human-verified early warning.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-2 rounded-lg bg-teal-500 hover:bg-teal-400 px-4 py-2 text-xs font-bold text-slate-950 transition shadow-lg shadow-teal-500/20"
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            {isPlaying ? 'Pause Replay' : 'Play Scenario'}
          </button>
          <button
            onClick={reset}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition"
          >
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      {/* Progress Scrubber (Steps 1 to 8) */}
      <div className="mt-6">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
          <span>EVENT TIMELINE (14:02 — 14:17)</span>
          <span>STEP {currentStep + 1} OF {INCIDENT_STEPS.length}</span>
        </div>
        <div className="grid grid-cols-8 gap-1.5">
          {INCIDENT_STEPS.map((s, idx) => {
            const isPast = idx < currentStep;
            const isCurr = idx === currentStep;
            return (
              <button
                key={idx}
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentStep(idx);
                }}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all ${
                  isCurr
                    ? 'border-teal-400 bg-teal-950/80 text-teal-300 ring-2 ring-teal-400/30'
                    : isPast
                    ? 'border-slate-700 bg-slate-800 text-slate-300'
                    : 'border-slate-800 bg-slate-900/60 text-slate-600'
                }`}
              >
                <span className="text-[10px] font-mono font-bold">{s.time}</span>
                <span className="text-[9px] truncate max-w-full font-semibold">{s.title.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Active Step Display */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_.7fr]">
        {/* Left: Step Narrative & Live Gauges */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-800/50 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  <step.icon size={20} />
                </span>
                <div>
                  <div className="font-mono text-xs text-teal-400 font-semibold">{step.time} UTC+05:30</div>
                  <h3 className="text-lg font-bold text-white">{step.title}</h3>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                step.severity === 'critical'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                  : step.severity === 'emerging'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
              }`}>
                {step.severity}
              </span>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-300">
              {step.description}
            </p>

            {/* Live Metrics at this point */}
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-3">
                <div className="text-[10px] uppercase font-mono text-slate-400">Turbidity</div>
                <div className="mt-1 text-xl font-bold font-mono text-teal-300">
                  {step.turbidityNtu} <span className="text-xs font-normal text-slate-400">NTU</span>
                </div>
                <div className="text-[10px] text-rose-400 font-semibold">+{step.turbidityChangePct}% vs baseline</div>
              </div>

              <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-3">
                <div className="text-[10px] uppercase font-mono text-slate-400">Dissolved O₂</div>
                <div className="mt-1 text-xl font-bold font-mono text-amber-300">
                  {step.doMgL} <span className="text-xs font-normal text-slate-400">mg/L</span>
                </div>
                <div className="text-[10px] text-slate-400">Hypoxic threshold &lt;4.0</div>
              </div>

              <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-3">
                <div className="text-[10px] uppercase font-mono text-slate-400">24h Rainfall</div>
                <div className="mt-1 text-xl font-bold font-mono text-cyan-300">
                  {step.rainfallMm} <span className="text-xs font-normal text-slate-400">mm</span>
                </div>
                <div className="text-[10px] text-cyan-400">Storm Runoff Active</div>
              </div>

              <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-3">
                <div className="text-[10px] uppercase font-mono text-slate-400">Citizen Reports</div>
                <div className="mt-1 text-xl font-bold font-mono text-purple-300">
                  {step.citizenReportsCount} <span className="text-xs font-normal text-slate-400">reports</span>
                </div>
                <div className="text-[10px] text-purple-400">Geo-corroborated</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: The Explainable "Why Does AI Believe This?" Factor Ledger */}
        <div className="rounded-xl border border-slate-800 bg-slate-850 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[11px] font-mono uppercase text-teal-400 font-bold">Explainable AI Ledger</span>
                <div className="text-sm font-bold text-white">Why Does the AI Believe This?</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold font-mono text-teal-400">{step.riskScore}/100</div>
                <div className="text-[10px] text-slate-400">Risk Score</div>
              </div>
            </div>

            {/* Auditable Additive Factor Breakdown */}
            <div className="mt-4 space-y-2 text-xs">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wide">Additive Risk Factors:</div>
              {step.factorAdditions.map((fac, idx) => (
                <div key={idx} className="flex items-center justify-between rounded bg-slate-900 p-2 border border-slate-800/80">
                  <div>
                    <span className="font-semibold text-slate-200">{fac.name}</span>
                    <div className="text-[10px] text-slate-400">{fac.note}</div>
                  </div>
                  <span className="font-mono text-teal-400 font-bold">+{fac.points}</span>
                </div>
              ))}
              <div className="border-t border-slate-700 pt-2 flex justify-between font-mono font-bold text-white text-sm">
                <span>Total Composite Risk:</span>
                <span className="text-teal-300">{step.riskScore}</span>
              </div>
            </div>

            {/* Confidence Justification */}
            <div className="mt-4 rounded-lg bg-teal-950/40 border border-teal-800/40 p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-teal-300">Confidence Score:</span>
                <span className="font-mono font-bold text-teal-300 text-sm">{step.confidenceScore}%</span>
              </div>
              <div className="mt-2 space-y-1 text-[11px] text-slate-300">
                <div className="text-[10px] font-mono text-teal-400 uppercase">Because:</div>
                {step.confidenceReasons.map((reason, idx) => (
                  <div key={idx} className="flex items-start gap-1.5">
                    <span className="text-teal-400 font-bold">✓</span>
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Human-in-the-Loop Safeguard: ACTIVE</span>
            <span>No Autonomous Interventions</span>
          </div>
        </div>
      </div>
    </div>
  );
}
