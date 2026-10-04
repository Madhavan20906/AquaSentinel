import { useState } from 'react';
import { Database, ShieldCheck, Copy, Check, Download, X } from 'lucide-react';

interface FhirExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteId?: string;
  siteName?: string;
}

interface SampleValidationResult {
  valid: boolean;
  status: string;
  resourceType: string;
  resourceId: string;
  validatorEngine: string;
  issues: { severity: string; diagnostics: string }[];
}

export function FhirExportModal({ isOpen, onClose, siteId = 'ADYAR-01', siteName = 'Adyar Bridge' }: FhirExportModalProps) {
  const [copied, setCopied] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<SampleValidationResult[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
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
    code: {
      coding: [{ system: 'https://aquasentinel.io/fhir/codes', code: 'watershed-risk-assessment', display: 'Watershed ecosystem stress risk assessment' }],
      text: 'Watershed ecosystem stress assessment'
    },
    subject: {
      reference: `Location/${siteId}`,
      display: siteName
    },
    occurrenceDateTime: new Date().toISOString(),
    condition: { display: 'Water pollution event and related water-quality stress' },
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
    type: 'collection',
    timestamp: new Date().toISOString(),
    entry: [
      { resource: sampleObservation },
      { resource: sampleRiskAssessment }
    ]
  };

  const payload =
    selectedResourceType === 'Bundle'
      ? sampleBundle
      : selectedResourceType === 'Observation'
      ? sampleObservation
      : sampleRiskAssessment;

  const jsonString = JSON.stringify(payload, null, 2);
  const resourcesToValidate = selectedResourceType === 'Bundle'
    ? sampleBundle.entry.map((entry) => entry.resource)
    : [payload];

  const selectResourceType = (resourceType: 'Bundle' | 'Observation' | 'RiskAssessment') => {
    setSelectedResourceType(resourceType);
    setValidationResults([]);
    setValidationError(null);
    setActionError(null);
  };

  const handleValidate = async () => {
    setValidating(true);
    setValidationError(null);
    setValidationResults([]);
    try {
      const results = await Promise.all(resourcesToValidate.map(async (resource) => {
        const response = await fetch('/api/fhir/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(resource),
        });
        const result = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(typeof result?.error === 'string' ? result.error : 'FHIR validator returned HTTP ' + response.status);
        }
        return result as SampleValidationResult;
      }));
      setValidationResults(results);
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'FHIR validation could not be completed.');
    } finally {
      setValidating(false);
    }
  };

  const handleCopy = async () => {
    setActionError(null);
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard access is unavailable in this browser context.');
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not copy the sample payload.');
    }
  };

  const handleDownload = () => {
    setActionError(null);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aquasentinel-fhir-${selectedResourceType.toLowerCase()}-${siteId}.json`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4 backdrop-blur-xs">
      <div className="panel max-h-[90dvh] min-h-0 w-full max-w-3xl overflow-hidden flex flex-col bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b p-5 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal-500 text-slate-950">
              <Database size={18} />
            </span>
            <div>
              <h3 className="font-display text-lg font-bold">FHIR R4 Sample Export</h3>
              <p className="text-xs text-slate-300">
                Sample FHIR R4 payload for inspection only; this preview does not send data to a health system.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Transmission Diagram Banner */}
        <div className="p-4 bg-teal-950/[0.04] border-b border-slate-200">
          <div className="text-[11px] font-mono uppercase text-teal-800 font-bold mb-2">Sample Resource Flow</div>
          <div className="grid grid-cols-2 gap-2 text-center text-xs lg:grid-cols-4">
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
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            {/* Resource Type Selector */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
              <button
                onClick={() => selectResourceType('Bundle')}
                className={`px-3 py-1 rounded transition ${selectedResourceType === 'Bundle' ? 'bg-white text-teal-800 shadow-xs font-bold' : 'text-slate-600'}`}
              >
                FHIR Bundle
              </button>
              <button
                onClick={() => selectResourceType('Observation')}
                className={`px-3 py-1 rounded transition ${selectedResourceType === 'Observation' ? 'bg-white text-teal-800 shadow-xs font-bold' : 'text-slate-600'}`}
              >
                Observation
              </button>
              <button
                onClick={() => selectResourceType('RiskAssessment')}
                className={`px-3 py-1 rounded transition ${selectedResourceType === 'RiskAssessment' ? 'bg-white text-teal-800 shadow-xs font-bold' : 'text-slate-600'}`}
              >
                RiskAssessment
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                onClick={() => void handleValidate()}
                disabled={validating}
                className="flex items-center gap-1 text-xs border border-teal-300 rounded px-2.5 py-1 text-teal-800 hover:bg-teal-50 font-medium disabled:opacity-50"
              >
                <ShieldCheck size={12} className={validating ? 'animate-spin' : ''} />
                {validating ? 'Validating…' : 'Validate sample'}
              </button>
              <button
                onClick={() => void handleCopy()}
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

                    {validationError && (
            <div role="alert" className="mb-3 rounded-lg border border-rose-300 bg-rose-50 p-3 text-xs text-rose-900">
              FHIR validation request failed: {validationError}
            </div>
          )}
          {actionError && (
            <div role="alert" className="mb-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
              {actionError}
            </div>
          )}
          {validationResults.length > 0 && (
            <div role="status" className="mb-3 space-y-2">
              {validationResults.map((result, index) => (
                <div key={index} className={"rounded-lg border p-3 text-xs " + (result.valid ? "border-teal-300 bg-teal-50 text-teal-950" : "border-rose-300 bg-rose-50 text-rose-950")}>
                  <div className="font-semibold">{result.resourceType}/{result.resourceId}: {result.status}</div>
                  <div className="mt-1 text-[10px]">Validator: {result.validatorEngine}</div>
                  {result.issues.map((issue, issueIndex) => (
                    <div key={issueIndex} className={"mt-1 font-mono text-[10px] " + (issue.severity === "error" || issue.severity === "fatal" ? "text-rose-800" : issue.severity === "warning" ? "text-amber-800" : "text-slate-700")}>
                      [{issue.severity.toUpperCase()}] {issue.diagnostics}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

<pre className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-teal-300 overflow-x-auto max-h-72">
            {jsonString}
          </pre>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 border-t bg-slate-50 p-4 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
            <span>{selectedResourceType === 'Bundle' ? 'Sample collection resources:' : 'Canonical Endpoint:'}</span>
            <code className="break-all rounded border bg-white px-2 py-0.5 font-mono text-[11px] text-teal-800">
              {selectedResourceType === 'Bundle' ? 'GET /api/fhir/r4/Observation · GET /api/fhir/r4/RiskAssessment' : 'GET /api/fhir/r4/' + selectedResourceType}
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
