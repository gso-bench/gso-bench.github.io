"""Download the GSO benchmark dataset and store it locally.

This utility requires the `datasets` library:
    pip install datasets

Running the script writes the dataset to `assets/gso-dataset.json` so the
Problem Explorer can load tasks without contacting the HuggingFace API.
"""

import json
from pathlib import Path

try:
    from datasets import load_dataset
except ImportError as exc:
    raise SystemExit("The 'datasets' package is required to fetch the dataset") from exc


def main() -> None:
    ds = load_dataset("gso-bench/gso", split="train")
    records = [row for row in ds]
    out_path = Path(__file__).resolve().parent.parent / "assets" / "gso-dataset.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as f:
        json.dump(records, f, indent=2)
    print(f"Wrote {len(records)} tasks to {out_path}")


if __name__ == "__main__":
    main()
