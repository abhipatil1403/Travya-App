import { useState } from 'react'
import { assessRisk, RiskApiError } from '../lib/riskApi'
import { CONTROLLED_SCENARIOS, controlledAssessmentPayload } from '../lib/controlledAssessmentInput'

export default function RiskAssessmentPanel() {
  const [scenario, setScenario] = useState(CONTROLLED_SCENARIOS[0].id)
  const [state, setState] = useState('idle')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  async function submit() {
    setState('submitting'); setError(''); setResult(null)
    try { setResult(await assessRisk(controlledAssessmentPayload(scenario))); setState('success') }
    catch (err) { setState(err instanceof RiskApiError ? err.kind : 'unexpected'); setError(err.message) }
  }
  return <section className="rounded-2xl bg-white/90 p-6 ring-1 ring-black/10 shadow mb-6" aria-live="polite">
    <h3 className="text-xl font-semibold text-gray-900">Controlled Prototype Assessment Input</h3>
    <p className="mt-2 text-sm text-amber-800 bg-amber-50 rounded-lg p-3">This test mode submits deterministic controlled input to the technical backend. It is not live GPS data or a real tourist assessment.</p>
    <div className="mt-4 flex flex-col sm:flex-row gap-3">
      <select value={scenario} onChange={(event) => { setScenario(event.target.value); setState('collecting'); setResult(null) }} className="flex-1 rounded-lg border border-gray-300 px-3 py-2">
        {CONTROLLED_SCENARIOS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
      </select>
      <button onClick={submit} disabled={state === 'submitting'} className="rounded-lg bg-sky-600 px-4 py-2 text-white disabled:opacity-50">{state === 'submitting' ? 'Assessing…' : 'Run controlled assessment'}</button>
    </div>
    {state === 'submitting' && <p className="mt-3 text-sm text-gray-600">Submitting to the technical backend…</p>}
    {['validation', 'unavailable', 'unexpected'].includes(state) && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {result && <div className="mt-4 rounded-lg border border-sky-100 bg-sky-50 p-4">
      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4"><Metric label="Final risk" value={result.risk_assessment.final_risk.toFixed(3)} /><Metric label="Risk level" value={result.risk_assessment.risk_level} /><Metric label="Safety Score" value={result.safety_assessment.safety_score} /><Metric label="Safety category" value={result.safety_assessment.safety_category} /></div>
      <details className="mt-4 text-sm text-gray-700"><summary className="cursor-pointer font-medium">Technical explanation</summary><dl className="mt-2 grid grid-cols-2 gap-2"><Metric label="ML risk" value={result.anomaly_detection.ml_risk.toFixed(3)} /><Metric label="Geofence risk" value={result.geofencing.geofence_risk.toFixed(3)} /><Metric label="Anomaly status" value={result.anomaly_detection.anomaly_status} /><Metric label="Zone" value={result.geofencing.zone} /></dl></details>
    </div>}
  </section>
}
function Metric({ label, value }) { return <div><dt className="text-gray-500">{label}</dt><dd className="font-semibold text-gray-900">{value}</dd></div> }
