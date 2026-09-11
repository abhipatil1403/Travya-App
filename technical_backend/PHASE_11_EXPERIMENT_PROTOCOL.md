# Phase 11 experiment protocol

Run `python scripts/run_phase11_experiments.py` from `technical_backend` after the Phase 5.5 selected artifacts and train-only normalizer exist. The runner reads existing artifacts only: it never invokes model fitting, modifies the selected threshold, or writes over `models/ORIGINAL_CONFIGURATION`.

It produces actual dataset, held-out performance, scenario, API matrix, monotonicity, determinism, local timing, and error-handling outputs under `results/`. Every generated result states that it is controlled synthetic prototype evaluation data, not validated real-world tourist behaviour.
