# Raksha AI – Intelligent Road Safety Ecosystem

> Preventing accidents. Saving lives. Empowering citizens.

## 🌍 Problem Statement

India records one of the highest numbers of road accidents globally. The main challenges are:

- Delayed emergency response.
- Poor road infrastructure monitoring.
- Lack of real-time safety insights.
- Limited awareness of traffic laws and risky zones.

## 💡 Our Solution

Raksha AI is a unified road safety platform designed to:

- Respond instantly during accidents.
- Detect and report road issues using AI.
- Visualize accident-prone zones.
- Predict and warn about high-risk areas.

## 🔥 Current Feature Status

### 🚨 Smart SOS System

- Simulated emergency alert generation.
- Live location fallback support.
- Emergency contacts and incident log output.
- Backend endpoint available for dispatch.

### 🛣️ AI Road Issue Detection

- Image upload and validation.
- Road issue classification with confidence and severity.
- Detection job flow for asynchronous processing.

### 📊 Interactive Dashboard

- Summary, hotspots, recent issues, and map payload endpoints.
- Static landing page prototype for product storytelling.

### ⚠️ Accident Risk Alert

- Risk score and coordinate-based prediction endpoints.
- Route profile and alert generation support.

### ⚖️ Legal Awareness Module

- Prototype UI remains in progress.
- Future scope for location-aware traffic law guidance.

## 🏗️ System Architecture

```text
User (Web App)
     ↓
Frontend (static landing page + React-ready source folders)
     ↓
Backend (Flask)
     ↓
AI / ML Models
     ↓
Firebase / Maps integrations (planned and partially wired)
```

## 🛠️ Tech Stack

### 💻 Frontend

- HTML/CSS landing page prototype
- JSX source folders under `frontend/src/`

### ⚙️ Backend

- Flask

### 🧠 AI / ML

- Lightweight mock AI models for potholes and road issues
- Training scripts and demos in `ai-models/`

### 🗄️ Database / Services

- Firebase status support in backend
- Google Maps helpers for nearest hospitals and reverse geocoding

## 📂 Project Structure

```text
raksha-ai/
├── assets/                # Demo assets and media
├── ai-models/             # AI / ML scripts and demo models
├── backend/               # Flask backend
│   ├── config.py
│   ├── main.py
│   ├── models/
│   ├── routers/
│   ├── services/
│   └── uploads/
├── docs/                  # Documentation
├── frontend/              # Frontend prototype and source folders
│   ├── index.html         # Current root HTML entry point
│   ├── public/
│   └── src/
├── tests/                 # Backend validation tests
├── .env.example
├── .gitignore
├── docker-compose.yml
├── LICENSE
├── README.md
└── CONTRIBUTING.md
```

## ⚙️ Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-username/raksha-ai.git
cd raksha-ai
```

### 2. Configure environment variables

```bash
copy .env.example .env
```

Fill in the required API keys and service configuration in `.env`.

### 3. Run the project locally

#### Option A: Docker Compose

```bash
docker compose up --build
```

#### Option B: Backend only

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r backend/Requirements.txt
python backend/main.py
```

### 4. Frontend preview

The current frontend is a static prototype. Open `frontend/public/index.html` in a browser or serve `frontend/` through your preferred local web server.

## 🧪 Validation

The backend exposes the following tested routes:

- `/health`
- `/risk/score`
- `/dashboard/summary`
- `/sos/activate`
- `/roads/detect`

Run the automated validation suite:

```bash
python -m unittest discover tests
```

If you want to test the backend manually after starting it, use the Flask test client or a tool like Postman.

## 🚀 Future Scope

- Real-time IoT vehicle sensor integration.
- Direct hospital and ambulance coordination.
- Advanced ML-based accident prediction.
- AI voice assistant for emergency support.
- Smart traffic system integration.

## 🧠 Innovation Highlights

- Combines emergency response, infrastructure monitoring, and AI prediction.
- Designed specifically for Indian road conditions.
- Scalable into a national-level safety platform.

## 🎯 Primary Use Cases

- Daily commuters
- Emergency services
- Government authorities
- Smart city initiatives

## 👤 Maintainer

- Saket Pathak
