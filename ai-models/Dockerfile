FROM python:3.12-slim

WORKDIR /ai-models

COPY . .

RUN pip install --no-cache-dir -r pothole_detection/requirements.txt || true
RUN pip install --no-cache-dir -r risk_prediction/requirements.txt 2>/dev/null || \
    pip install --no-cache-dir -r risk_pridiction/requirements.txt 2>/dev/null || true

CMD ["tail", "-f", "/dev/null"]
