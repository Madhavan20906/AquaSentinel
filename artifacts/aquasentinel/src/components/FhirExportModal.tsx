import { useState } from 'react';
import { Database, ShieldCheck, Copy, Check, Download, X, ArrowRight, ExternalLink } from 'lucide-react';

interface FhirExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteId?: string;
  siteName?: string;
}

export function FhirExportModal({ isOpen, onClose, siteId = 'ADYAR-01', siteName = 'Adyar Bridge' }: FhirExportModalProps) {
  const [copied, setCopied] = useState(false);
  const [selectedResourceType, setSelectedResourceType] = useState<'Bundle' | 'Observation' | 'RiskAssessment'>('Bundle');

  if (!isOpen) return null;

  const sampleObservation = {
    resourceType: 'Observation',
    id: `obs-${siteId.toLowerCase()}-turbidity`,
    meta: { profile: ['http://hl7.org/fhir/StructureDefinition/Observation'] },
    status: 'final',
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'activity',
            display: 'Activity'
          }
        ]
      }
    ],
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: '14788-4',
          display: 'Water turbidity'
        }
      ],
      text: 'Water Turbidity Level'
    },
    subject: {
      reference: `Location/${siteId}`,
      display: `${siteName} Monitoring Station`
    },
    effectiveDateTime: new Date().toISOString(),
    valueQuantity: {
      value: 75.0,
      unit: 'NTU',
      system: 'http://unitsofmeasure.org',
      code: 'NTU'
    },
    interpretation: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
            code: 'AA',
            display: 'Critical abnormal'
          }
        ]
      }
    ]
  };

  const sampleRiskAssessment = {
    resourceType: 'RiskAssessment',
    id: `risk-${siteId.toLowerCase()}-01`,
    meta: { profile: ['http://hl7.org/fhir/StructureDefinition/RiskAssessment'] },
    status: 'final',
    subject: {
      reference: `Location/${siteId}`,
      display: siteName
    },
    occurrenceDateTime: new Date().toISOString(),
    condition: {
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: '418700000',
          display: 'Water pollution event'
        }
      ],
      text: 'Acute stormwater runoff & hypoxic water quality stress'
    },
    prediction: [
      {
        outcome: {
          coding: [
            {
              system: 'http://snomed.info/sct',
              code: '442111000124103',
              display: 'Adverse ecological and human exposure risk'
            }
          ],
          text: 'Ecosystem degradation and public health recreational contact hazard'
        },
        probabilityDecimal: 0.82,
        qualitativeRisk: {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/risk-probability',
              code: 'high',
              display: 'High Likelihood'
            }
          ]
        },
        rationale: 'Turbidity is +525% above baseline, DO plunged to 3.2 mg/L, corroborated by 8 independent citizen reports.'
      }
    ]
  };

  const sampleBundle = {
    resourceType: 'Bundle',
    type: 'transaction',
    timestamp: new Date().toISOString(),
    entry: [
      { fullUrl: `urn:uuid:observation-${siteId}`, resource: sampleObservation },
      { fullUrl: `urn:uuid:risk-${siteId}`, resource: sampleRiskAssessment }
    ]
  };

  const payload =
    selectedResourceType === 'Bundle'
      ? sampleBundle
      : selectedResourceType === 'Observation'
      ? sampleObservation
      : sampleRiskAssessment;

  const jsonString = JSON.stringify(payload, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aquasentinel-fhir-${selectedResourceType.toLowerCase()}-${siteId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4 backdrop-blur-xs">
      <div className="panel max-h-[90vh] w-full max-w-3xl overflow-hidden flex flex-col bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b p-5 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal-500 text-slate-950">
              <Database size={18} />
            </span>
            <div>
              <h3 className="font-display text-lg font-bold">Export to Health System (HL7 FHIR R4)</h3>
              <p className="text-xs text-slate-300">
                Zero-friction epidemiological data exchange with municipal EHRs, CDC registries, and environmental GIS.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Transmission Diagram Banner */}
        <div className="p-4 bg-teal-950/[0.04] border-b border-slate-200">
          <div className="text-[11px] font-mono uppercase text-teal-800 font-bold mb-2">Interoperability Pipeline Flow</div>
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="rounded-lg border border-slate-200 bg-white p-2">
              <div className="font-bold text-slate-800">AquaSentinel</div>
              <div className="text-[10px] text-slate-500">Telemetry & Citizens</div>
            </div>
            <div className="rounded-lg border border-teal-300 bg-teal-50 p-2">
              <div className="font-bold text-teal-900">FHIR Observation</div>
              <div className="text-[10px] text-teal-700">LOINC 14788-4</div>
            </div>
            <div className="rounded-lg border border-teal-300 bg-teal-50 p-2">
              <div className="font-bold text-teal-900">FHIR RiskAssessment</div>
              <div className="text-[10px] text-teal-700">SNOMED-CT 418700000</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-2">
              <div className="font-bold text-slate-800">Hospital EHR / CDC</div>
              <div className="text-[10px] text-slate-500">Public Health Registry</div>
            </div>
          </div>
        </div>

        {/* Payload Viewer Body */}
        <div className="p-5 flex-1 overflow-y-auto">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            {/* Resource Type Selector */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setSelectedResourceType('Bundle')}
                className={`px-3 py-1 rounded transition ${selectedResourceType === 'Bundle' ? 'bg-white text-teal-800 shadow-xs font-bold' : 'text-slate-600'}`}
              >
                FHIR Bundle
              </button>
              <button
                onClick={() => setSelectedResourceType('Observation')}
                className={`px-3 py-1 rounded transition ${selectedResourceType === 'Observation' ? 'bg-white text-teal-800 shadow-xs font-bold' : 'text-slate-600'}`}
              >
                Observation
              </button>
              <button
                onClick={() => setSelectedResourceType('RiskAssessment')}
                className={`px-3 py-1 rounded transition ${selectedResourceType === 'RiskAssessment' ? 'bg-white text-teal-800 shadow-xs font-bold' : 'text-slate-600'}`}
              >
                RiskAssessment
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                <ShieldCheck size={13} /> Validated Against HAPI FHIR R4
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs border border-slate-300 rounded px-2.5 py-1 hover:bg-slate-50 font-medium"
              >
                {copied ? <Check size={12} className="text-teal-600" /> : <Copy size={12} />}
                {copied ? 'Copied!' : 'Copy JSON'}
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1 text-xs bg-slate-900 text-white rounded px-2.5 py-1 hover:bg-slate-800 font-medium"
              >
                <Download size={12} /> Download
              </button>
            </div>
          </div>

          <pre className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-teal-300 overflow-x-auto max-h-72">
            {jsonString}
          </pre>
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>Canonical Endpoint:</span>
            <code className="font-mono bg-white px-2 py-0.5 rounded border text-[11px] text-teal-800">
              GET /api/fhir/r4/{selectedResourceType === 'Bundle' ? 'Observation' : selectedResourceType}
            </code>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-teal-700 text-white px-4 py-2 font-semibold hover:bg-teal-800"
          >
            Done Inspecting
          </button>
        </div>
      </div>
    </div>
  );
}
