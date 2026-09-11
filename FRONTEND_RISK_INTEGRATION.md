# Frontend risk-assessment integration

The controlled prototype panel is in `src/components/RiskAssessmentPanel.jsx`, rendered by `src/pages/touristdashboard.jsx`. The client is `src/lib/riskApi.js`; it uses `VITE_TECHNICAL_BACKEND_URL` (default `http://127.0.0.1:8000`) and exclusively calls `POST /api/v1/risk-assessment`.

The existing frontend does not collect the event history required by the API. Consequently, `src/lib/controlledAssessmentInput.js` supplies four visibly labelled deterministic Controlled Prototype Assessment Input scenarios—not live tourist trajectories or GPS. The UI shows actual backend `final_risk`, `risk_level`, `safety_score`, `safety_category`, plus expandable ML/geofence details. It clears results while submitting and displays validation, unavailable-service, or unexpected errors instead of any static safety state.

The former app-home `safetyScore = 86` and fixed “Safe Zone” state were removed. Existing unrelated group, Supabase, blockchain, authentication, routes, and SOS UI were preserved.
