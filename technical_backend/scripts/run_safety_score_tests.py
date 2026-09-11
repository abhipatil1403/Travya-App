"""Execute and preserve actual Phase 8 Safety Score test output."""
from __future__ import annotations
import io, sys, unittest
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; sys.path.insert(0, str(ROOT))
if __name__ == "__main__":
    suite = unittest.defaultTestLoader.discover(str(ROOT / "tests"), pattern="test_safety_score.py")
    stream = io.StringIO(); result = unittest.TextTestRunner(stream=stream, verbosity=2).run(suite)
    output = stream.getvalue() + f"\nexecuted={result.testsRun}; successful={result.wasSuccessful()}\n"
    target = ROOT / "results"; target.mkdir(exist_ok=True)
    (target / "safety_score_test_execution.txt").write_text(output, encoding="utf-8")
    print(output); raise SystemExit(0 if result.wasSuccessful() else 1)
