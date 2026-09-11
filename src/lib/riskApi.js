const backendUrl = (import.meta.env.VITE_TECHNICAL_BACKEND_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')

export class RiskApiError extends Error {
  constructor(message, { kind = 'unexpected', status } = {}) {
    super(message)
    this.kind = kind
    this.status = status
  }
}

export async function assessRisk(requestPayload) {
  let response
  try {
    response = await fetch(`${backendUrl}/api/v1/risk-assessment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestPayload),
    })
  } catch {
    throw new RiskApiError('The technical assessment service is unavailable. Start the local backend and try again.', { kind: 'unavailable' })
  }
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const message = body?.detail?.message || body?.detail || 'The assessment request could not be completed.'
    throw new RiskApiError(message, { kind: response.status === 422 ? 'validation' : response.status === 503 ? 'unavailable' : 'unexpected', status: response.status })
  }
  return body
}
