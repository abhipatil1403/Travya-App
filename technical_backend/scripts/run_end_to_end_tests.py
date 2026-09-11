"""Execute Phase 9 API integration tests and save actual unittest output."""
from __future__ import annotations
import io, sys, unittest
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; sys.path.insert(0, str(ROOT))
if __name__ == "__main__":
    suite = unittest.defaultTestLoader.discover(str(ROOT / "tests"), pattern="test_end_to_end_api.py")
    stream = io.StringIO(); result = unittest.TextTestRunner(stream=stream, verbosity=2).run(suite)
    output = stream.getvalue() + f"\nexecuted={result.testsRun}; successful={result.wasSuccessful()}\n"
    target = ROOT / "results"; target.mkdir(exist_ok=True)
    (target / "end_to_end_test_execution.txt").write_text(output, encoding="utf-8")
    print(output); raise SystemExit(0 if result.wasSuccessful() else 1)
