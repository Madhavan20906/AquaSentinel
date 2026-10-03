import { useState } from 'react';
import { Activity, AlertTriangle, ArrowDown, ArrowRight, Check, CheckCircle2, ChevronRight, ClipboardCheck, CloudRain, Cpu, Database, Eye, FileCheck, Gauge, Globe2, Layers, MapPin, Play, RefreshCw, Send, ShieldAlert, ShieldCheck, Sparkles, UserCheck, Waves } from 'lucide-react';
import { Link } from 'wouter';

export function OneHealthWorkflow() {
  const [activeStage, setActiveStage] = useState<number>(1);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [dispatchedMission, setDispatchedMission] = useState<boolean>(false);
  const [exportedFhir, setExportedFhir] = useState<boolean>(false);

  const runSimulation = () => {
    setSimulating(true);
    setDispatchedMission(false);
    setExportedFhir(false);
    setActiveStage(1);

    const stages = [1, 2, 3, 4, 5, 6, 7];
    stages.forEach((st, idx) => {
      setTimeout(() => {
        setActiveStage(st);
        if (st === 7) {
          setDispatchedMission(true);
          setExportedFhir(true);
          setSimulating(false);
        }
      }, (idx + 1) * 750);
    });
  };

  return (
    <div className="panel p-6 border-teal-500/20 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-teal-300">
            <Sparkles size={12} />
            Unified Environmental-Health Architecture
          </div>
          <h2 className="font-display text-xl font-bold text-slate-100 mt-1">
            End-to-End One Health Operational Loop
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Seamless pipeline linking environmental sensors, citizen signals, statistical anomaly detection, GIS risk modeling, human decision review, and HL7 FHIR R4 clinical interoperability.
          </p>
        </div>

        <button
          onClick={runSimulation}
          disabled={simulating}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-teal-900/40 hover:bg-teal-500 disabled:opacity-50 transition"
        >
          <Play size={13} className={simulating ? 'animate-spin' : ''} />
          {simulating ? 'Simulating Pipeline Flow...' : 'Simulate End-to-End Workflow'}
        </button>
      </div>

      {/* Visual Pipeline Interactive Breadcrumb */}
      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7 text-center">
        {[
          { num: 1, label: 'Multi-Signal Inputs', sub: 'Sensors · Weather · Reports', icon: Waves },
          { num: 2, label: 'Evidence Fusion', sub: 'Cross-Modal Corroboration', icon: Layers },
          { num: 3, label: 'Anomaly Detection', sub: 'Statistical Rolling Z-Score', icon: Activity },
          { num: 4, label: 'Risk Assessment', sub: 'Risk + Confidence', icon: Gauge },
          { num: 5, label: 'GIS Risk Map', sub: 'Plume Buffer & Intakes', icon: MapPin },
          { num: 6, label: 'Human Review', sub: 'Officer Decision & Audit', icon: UserCheck },
          { num: 7, label: 'Dual Action', sub: 'Missions + FHIR Export', icon: ShieldCheck },
        ].map(({ num, label, sub, icon: Icon }) => {
          const isActive = activeStage === num;
          const isPassed = activeStage > num;
          return (
            <button
              key={num}
              onClick={() => setActiveStage(num)}
              className={`rounded-xl border p-2.5 text-left transition-all ${
                isActive
                  ? 'border-teal-400 bg-teal-950/60 shadow-lg shadow-teal-950 text-white'
                  : isPassed
                  ? 'border-teal-800/60 bg-slate-900/60 text-teal-300'
                  : 'border-slate-800 bg-slate-950/40 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold">STAGE 0{num}</span>
                <Icon size={14} className={isActive ? 'text-teal-300' : isPassed ? 'text-teal-500' : 'text-slate-600'} />
              </div>
              <div className="mt-2 text-xs font-semibold text-slate-200 truncate">{label}</div>
              <div className="text-[10px] text-slate-400 truncate">{sub}</div>
            </button>
          );
        })}
      </div>

      {/* Stage Detail Inspector Card */}
      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/80 p-6 shadow-inner">
        {activeStage === 1 && (
          <div className="space-y-4 fade-up">
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-400">
              <span className="h-2 w-2 rounded-full bg-teal-400" />
              Stage 1: Multi-Source Heterogeneous Ingestion
            </div>
            <h3 className="font-display text-lg font-bold text-slate-100">
              Three Independent Streams Converge on the Watershed
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-center justify-between text-xs font-semibold text-teal-300">
                  <span>Physical Sensors</span>
                  <span className="rounded bg-teal-950 px-1.5 py-0.5 text-[9px] font-mono">LIVE / NWIS</span>
                </div>
                <div className="mt-3 font-mono text-xl font-bold text-slate-100">48 NTU</div>
                <p className="mt-1 text-[11px] text-slate-400">Turbidity sensor reading; +31% departure from baseline (USGS Station 01646500).</p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-center justify-between text-xs font-semibold text-sky-300">
                  <span>Atmospheric Weather</span>
                  <span className="rounded bg-sky-950 px-1.5 py-0.5 text-[9px] font-mono">OPEN-METEO</span>
                </div>
                <div className="mt-3 font-mono text-xl font-bold text-slate-100">42 mm / 24h</div>
                <p className="mt-1 text-[11px] text-slate-400">Intense precipitation shock; high correlation with non-point sediment wash-off.</p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-center justify-between text-xs font-semibold text-amber-300">
                  <span>Citizen Reports</span>
                  <span className="rounded bg-amber-950 px-1.5 py-0.5 text-[9px] font-mono">CROWDSOURCED</span>
                </div>
                <div className="mt-3 font-mono text-xl font-bold text-slate-100">5 Observations</div>
                <p className="mt-1 text-[11px] text-slate-400">Community field photos clustered at Adyar Bridge with AI vision turbidity confirmation.</p>
              </div>
            </div>
          </div>
        )}

        {activeStage === 2 && (
          <div className="space-y-4 fade-up">
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-400">
              <span className="h-2 w-2 rounded-full bg-teal-400" />
              Stage 2: Cross-Modal Evidence Fusion
            </div>
            <h3 className="font-display text-lg font-bold text-slate-100">
              Corroborating Disparate Evidence into Unified Confidence
            </h3>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Neither the sensor spike nor the community photograph stands alone. AquaSentinel's fusion engine cross-references physical water telemetry against rainfall hydrographs and geolocated citizen reports to establish spatial-temporal coincidence.
            </p>
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 font-mono text-xs text-slate-300 space-y-2">
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span>Signal Corroboration Factor:</span>
                <strong className="text-teal-300">4 distinct channels active (Sensors, Rainfall, Citizen, Historical Baseline)</strong>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span>Spatial Concurrence:</span>
                <strong className="text-teal-300">Radius &lt; 850m from outfall</strong>
              </div>
              <div className="flex justify-between">
                <span>Evidence Confidence Tensor:</span>
                <strong className="text-teal-300">0.84 (High corroboration certainty)</strong>
              </div>
            </div>
          </div>
        )}

        {activeStage === 3 && (
          <div className="space-y-4 fade-up">
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-400">
              <span className="h-2 w-2 rounded-full bg-rose-400 animate-pulse" />
              Stage 3: Statistical Rolling Z-Score Anomaly Detection
            </div>
            <h3 className="font-display text-lg font-bold text-slate-100">
              Sensor Excursion Exceeds +2.8σ Statistical Threshold
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-4">
                <div className="text-xs font-bold text-rose-300">Statistical Excursion Metrics</div>
                <div className="mt-2 font-mono text-3xl font-bold text-rose-200">+2.84σ</div>
                <div className="mt-1 text-xs text-rose-300/80">Exceeds critical threshold (±2.5σ)</div>
                <div className="mt-3 text-[11px] text-slate-400 space-y-1">
                  <div>Current Turbidity: <strong>48 NTU</strong></div>
                  <div>Rolling 7-day Baseline Mean: <strong>37.2 NTU</strong></div>
                  <div>Rolling Standard Deviation: <strong>3.8 NTU</strong></div>
                </div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-300 flex flex-col justify-center">
                <div className="font-semibold text-slate-100 mb-1">Explainable AI Rule Triggered:</div>
                <p className="text-slate-400 leading-relaxed">
                  "CRITICAL ANOMALY: Turbidity spiked to 48 NTU (+2.84σ deviation from rolling baseline of 37.2 NTU). High probability of upstream sediment pulse or effluent breach."
                </p>
              </div>
            </div>
          </div>
        )}

        {activeStage === 4 && (
          <div className="space-y-4 fade-up">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Stage 4: Dual Risk & Confidence Assessment
            </div>
            <h3 className="font-display text-lg font-bold text-slate-100">
              Separating Likelihood of Harm from Evidence Uncertainty
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-4 text-center">
                <div className="text-xs uppercase font-mono text-amber-300">Estimated Hazard Risk</div>
                <div className="mt-2 font-display text-4xl font-bold text-amber-200">78 / 100</div>
                <div className="mt-1 text-[11px] text-amber-400 font-semibold">Elevated Impairment Level</div>
              </div>
              <div className="rounded-xl border border-teal-500/40 bg-teal-950/20 p-4 text-center">
                <div className="text-xs uppercase font-mono text-teal-300">Evidence Confidence</div>
                <div className="mt-2 font-display text-4xl font-bold text-teal-200">84%</div>
                <div className="mt-1 text-[11px] text-teal-400 font-semibold">High Multi-Source Agreement</div>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              Risk evaluates severity and consequence; confidence indicates how well the available evidence backs that claim. They are never conflated into a single opaque index.
            </p>
          </div>
        )}

        {activeStage === 5 && (
          <div className="space-y-4 fade-up">
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-400">
              <span className="h-2 w-2 rounded-full bg-teal-400" />
              Stage 5: Geospatial Plume Projection & Receptor Analysis
            </div>
            <h3 className="font-display text-lg font-bold text-slate-100">
              Downstream Plume Buffer & Drinking Water Intake Interception
            </h3>
            <div className="rounded-xl border border-rose-500/40 bg-rose-950/20 p-4">
              <div className="flex items-center justify-between text-xs text-rose-300 font-semibold">
                <span className="flex items-center gap-1.5"><ShieldAlert size={14} /> Intake At Risk: Adyar Estuary Desalination Intake #1</span>
                <span className="font-mono text-rose-400">ETA: ~48 Minutes</span>
              </div>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                Stream velocity 0.62 m/s propagates suspended plume downstream. Contaminant front will intersect municipal intake in 48 minutes. Pre-emptive gate closure recommended.
              </p>
              <div className="mt-3 flex gap-2">
                <Link href="/dashboard" className="text-xs font-semibold text-teal-400 hover:underline">
                  Inspect in GIS Map →
                </Link>
              </div>
            </div>
          </div>
        )}

        {activeStage === 6 && (
          <div className="space-y-4 fade-up">
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-400">
              <span className="h-2 w-2 rounded-full bg-teal-400" />
              Stage 6: Human Officer Review & Cryptographic Governance
            </div>
            <h3 className="font-display text-lg font-bold text-slate-100">
              Human-in-the-Loop Decision Authority
            </h3>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              No public health shutdown or regulatory enforcement occurs automatically. The system delivers a synthesized evidence dossier with full provenance to the designated environmental health officer.
            </p>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs font-mono text-slate-300 space-y-1.5">
              <div className="flex justify-between">
                <span>Reviewing Actor:</span>
                <strong className="text-teal-300">Dr. Elena Ramos, Lead Environmental Officer</strong>
              </div>
              <div className="flex justify-between">
                <span>Decision Verdict:</span>
                <strong className="text-amber-300">VERIFY & DISPATCH (Dual Response Action)</strong>
              </div>
              <div className="flex justify-between">
                <span>Audit Block Hash:</span>
                <strong className="text-slate-400">SHA256: 4a9f8e...7b21 (Tamper-Free Chained)</strong>
              </div>
            </div>
          </div>
        )}

        {activeStage === 7 && (
          <div className="space-y-4 fade-up">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Stage 7: Connected Dual-Response Execution
            </div>
            <h3 className="font-display text-lg font-bold text-slate-100">
              Simultaneous Environmental Action & Health Interoperability
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Branch 1: Environmental Response */}
              <div className="rounded-xl border border-teal-500/40 bg-teal-950/30 p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-teal-300">
                  <ClipboardCheck size={15} />
                  <span>Branch A: Environmental Response</span>
                </div>
                <div className="mt-3 space-y-1 text-xs text-slate-300">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <CheckCircle2 size={13} /> Field Mission Dispatched
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Mobile responder assigned with GPS coordinates, turbidity meter, and chain-of-custody sampling vial.
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <Link href="/missions" className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1">
                    View active missions queue <ArrowRight size={13} />
                  </Link>
                </div>
              </div>

              {/* Branch 2: Health Interoperability (HL7 FHIR R4) */}
              <div className="rounded-xl border border-sky-500/40 bg-sky-950/30 p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-sky-300">
                  <Database size={15} />
                  <span>Branch B: Health Interoperability</span>
                </div>
                <div className="mt-3 space-y-1 text-xs text-slate-300">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <CheckCircle2 size={13} /> Canonical FHIR R4 Export Ready
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Standardized <code>Observation</code> (LOINC 14788-4) &amp; <code>RiskAssessment</code> (SNOMED 704128003) ready for municipal EHR ingestion.
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex gap-3 text-xs">
                  <a href="/api/fhir/r4/Observation" target="_blank" rel="noreferrer" className="font-mono text-sky-400 hover:underline">
                    GET /fhir/r4/Observation
                  </a>
                  <a href="/api/fhir/r4/RiskAssessment" target="_blank" rel="noreferrer" className="font-mono text-sky-400 hover:underline">
                    GET /fhir/r4/RiskAssessment
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
