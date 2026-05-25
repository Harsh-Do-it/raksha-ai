# Risk Prediction

This folder contains a starter implementation for accident-risk scoring and optional model training.

## Files

- `model.py` — explainable risk scoring module
- `predict.py` — CLI for producing a risk prediction from input values
- `train.py` — optional training script for a tabular classifier
- `requirements.txt` — Python dependencies for training and inference
- `sample_training_data.csv` — small synthetic dataset you can use immediately

## Quick start

```bash
python predict.py --lat 28.61 --lng 77.20 --time peak --weather rain --road pothole --traffic heavy --zone "NH-48"
```

## Sample training run

```bash
python train.py sample_training_data.csv --output artifacts/sample_risk_model.joblib
```

## End-to-end demo

```bash
python demo.py
```

This trains a demo model from `sample_training_data.csv` and prints a risk prediction.

## Run both AI demos together

From the repository root:

```bash
python ai-models/run_demos.py
```

This launches the risk and pothole demos in sequence.

## Training

Prepare a CSV with columns:

- `lat`
- `lng`
- `time_of_day`
- `weather`
- `road_condition`
- `traffic_level`
- `zone`
- `label`

Then run:

```bash
python train.py path/to/training_data.csv
```
