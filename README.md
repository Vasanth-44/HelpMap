# HelpMap 🚨📍

A real-time emergency healthcare coordination web application connecting patients with nearby medical responders, volunteers, and emergency services using location-based telemetry.

---

## ✨ Features

- **Screen 1: Authentication & Role Selection**
  - Instant portal login with phone verification.
  - Role switcher (Patient vs. Responder).
  - 1-Click quick demo access for rapid testing.
  - Automatic silent GPS location detection with fallback coordinates.

- **Screen 2: Patient Emergency Command Hub**
  - Pulsing One-Touch SOS Alert with multi-ring radar animation.
  - Emergency Category selector (Accident, Cardiac / Chest Pain, Maternal, Severe Trauma, Sudden Illness).
  - Real-time Dispatch Stepper: Broadcast ➔ Responder Accepted ➔ En Route ➔ Arrived.
  - Live distance & ETA countdown with synthesizer alert chimes.

- **Screen 3: Responder Hub & Interactive Radar**
  - Availability status toggle (Available & Ready, On Mission, Offline).
  - Incoming emergency call cards with urgency tags, distance, and condition.
  - Accept & Navigate / Pass incident workflows.
  - Interactive Leaflet dark radar map with live telemetry and route line.
  - Simulated responder movement engine for interactive demonstrations.

- **Frictionless Experience**
  - **Zero-nag permissions:** Handled gracefully without blocking alerts or repetitive dialogs.
  - **Web Audio API Synthesizer:** Built-in siren, accept, and UI feedback tones without external audio dependencies.
  - **Dark Glassmorphic UI:** Built with Vanilla CSS, responsive typography, and glowing telemetry badges.

---

## 🚀 Getting Started

To run locally:
```bash
# Start a local static server
python -m http.server 8000
```

Open your browser at `http://localhost:8000`.
