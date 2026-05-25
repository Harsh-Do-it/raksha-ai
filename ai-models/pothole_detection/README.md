# Pothole Detection

This folder contains a starter pipeline for pothole detection.

## Files

- `model.py` — wrapper around a saved sklearn model
- `predict.py` — CLI inference script for a single image
- `train.py` — training script for image-derived features
- `requirements.txt` — Python dependencies
- `sample_training_data.csv` — small synthetic dataset you can use immediately
- `generate_sample_image.py` — creates a tiny sample PNG for inference

## Quick start

```bash
python generate_sample_image.py
python predict.py sample_image.png
```

## Sample training run

```bash
python train.py sample_training_data.csv --output artifacts/sample_pothole_model.joblib
```

## End-to-end demo

```bash
python demo.py
```

This trains a demo classifier from `sample_training_data.csv` and scores a sample feature vector.

## Run both AI demos together

From the repository root:

```bash
python ai-models/run_demos.py
```

This launches the risk and pothole demos in sequence.

## Training data

The `train.py` script expects a CSV with columns:

- `mean_red`
- `mean_green`
- `mean_blue`
- `std_red`
- `std_green`
- `std_blue`
- `label`
