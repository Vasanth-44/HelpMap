# HelpMap 📍🚨

A clean, minimalist community emergency and healthcare assistance web application connecting patients with nearby responders, volunteers, and emergency healthcare services using real-time location mapping.

---

## 🌟 Key Features

### 1. Dedicated Patient Dashboard (`patient.html`)
- **Emergency Help Request:** Quick form to select emergency category (Accident, Cardiac, Maternal, Severe Trauma, Sudden Illness).
- **Auto-detected GPS:** Seamless location tracking with fallback coordinates.
- **Assigned Responder Telemetry:** When a responder accepts, the patient sees responder contact, estimated arrival time, and a live map showing their route.
- **One-Tap Emergency Numbers:** Direct links to Ambulance (108), National Emergency (112), and Police (100).
- **Request History:** Log of past assistance requests.

### 2. Dedicated Responder Dashboard (`helper.html`)
- **Persistent Live Map:** Prominently featured interactive OpenStreetMap on the responder dashboard displaying the responder's current location, nearby healthcare facilities, and incoming/active patient emergency markers.
- **Incoming Calls Feed:** Real-time feed of emergency calls from nearby patients with one-click **"Accept & Navigate"** or **"Pass"**.
- **Active Mission Panel:** Full patient details, direct "Call Patient" button, and map navigation.
- **Duty Availability:** Toggle between Available, Busy, and Offline.
- **Performance & Rescue History:** Monthly statistics and assisted cases log.

### 3. Portal Login & Role Routing (`index.html`)
- Phone-number login with distinct Patient and Responder selection.
- One-click demo buttons for rapid testing.
- Direct redirection to the appropriate separate dashboard.

---

## 💻 Running Locally

Start a local static web server:
```bash
python -m http.server 8000
```

Open your browser at [http://localhost:8000](http://localhost:8000).
