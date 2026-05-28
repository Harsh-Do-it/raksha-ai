from __future__ import annotations

import subprocess
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DEMO_SCRIPTS = [
    ("risk_prediction", BASE_DIR / "risk_prediction" / "demo.py"),
    ("pothole_detection", BASE_DIR / "pothole_detection" / "demo.py"),
]


def run_demo(name: str, script_path: Path) -> None:
    print(f"\n=== Running {name} demo ===")
    result = subprocess.run([sys.executable, str(script_path)], cwd=BASE_DIR.parent)
    if result.returncode != 0:
        raise SystemExit(result.returncode)


def main() -> None:
    for name, script_path in DEMO_SCRIPTS:
        run_demo(name, script_path)

    print("\nAll AI demos completed successfully.")


if __name__ == "__main__":
    main()
