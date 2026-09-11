# Phase 10 controlled validation procedure

1. In `technical_backend`, run `python scripts/prepare_ml_score_normalizer.py`, then start `python -m uvicorn app.main:app --reload`.
2. In this directory, run `npm run dev`, sign in as a tourist, and open `/dashboard`.
3. In **Controlled Prototype Assessment Input**, run each displayed scenario. Confirm the browser network request is `POST /api/v1/risk-assessment`, the UI moves through submitting then success, and results match the returned JSON fields rather than a static score.
4. Stop the backend and run again: confirm the unavailable-service error appears and no prior score remains.
5. Submit a backend-invalid controlled payload only through browser dev tools if needed: confirm a validation error is displayed.

The four scenarios are intentionally controlled prototype inputs, not live GPS or tourist behaviour. Automated frontend component tests are not configured in the current Vite project; `npm run build` is the available automated frontend validation command.
