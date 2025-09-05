# GSO (website)

## Dataset

The Problem Explorer page reads tasks from `assets/gso-dataset.json`.
To refresh this file with the latest data from HuggingFace run:

```bash
python scripts/fetch_gso_dataset.py
```

This requires the `datasets` Python package and writes the dataset to the
`assets` directory so the site can operate offline.
