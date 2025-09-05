# /// script
# requires-python = ">=3.12"
# dependencies = [
#     "datasets",
# ]
# ///
import json
from pathlib import Path
import os

try:
    from datasets import load_dataset
except ImportError as exc:
    raise SystemExit("The 'datasets' package is required to fetch the dataset") from exc


def main() -> None:
    token = os.getenv("HF_TOKEN")
    if not token:
        raise SystemExit(
            "Environment variable HF_TOKEN is required to fetch the dataset"
        )

    ds = load_dataset("gso-bench/gso", split="test", token=token)
    records = [row for row in ds]
    out_path = Path(__file__).resolve().parent.parent / "assets" / "gso-dataset.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as f:
        json.dump(records, f, indent=2)
    print(f"Wrote {len(records)} tasks to {out_path}")


if __name__ == "__main__":
    main()
