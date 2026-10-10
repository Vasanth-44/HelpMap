/**
 * HelpMap — Real-time Emergency & Healthcare Network
 * High-performance, zero-nag permissions, interactive telemetry and simulation engine.
 */

/* ==================== GLOBAL STATE ==================== */
const state = {
    userRole: localStorage.getItem("userRole") || "patient",
    userName: localStorage.getItem("userName") || (localStorage.getItem("userRole") === "helper" ? "Dr. Arvind (Responder)" : "Ramesh Kumar"),
    phone: localStorage.getItem("phone") || "9876543210",
    coords: { lat: 13.0827, lng: 80.2707 }, // Default: Realistic initial GPS location
    soundEnabled: true,
    activeEmergency: null,
    helperStatus: "available",
    responderLocation: { lat: 13.0905, lng: 80.2785 },
    simulationTimer: null,
    mainMap: null,
    responderMap: null,
    patientMarker: null,
    responderMarker: null,
    routeLine: null
};

/* ==================== WEB AUDIO SYNTHESIZER ==================== */
// Zero external audio files required - works seamlessly in any browser
let audioCtx = null;

function getAudioContext() {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

function playSound(type) {
    if (!state.soundEnabled) return;
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;

        if (type === 'sos') {
            // High-low emergency siren pulse
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(880, now);
            osc.frequency.linearRampToValueAtTime(440, now + 0.15);
            osc.frequency.linearRampToValueAtTime(880, now + 0.3);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
            osc.start(now);
            osc.stop(now + 0.35);
        } else if (type === 'accept') {
            // Upbeat confirmation chime
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, now); // C5
            osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1); // E5
            osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.2); // G5
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        } else {
            // Gentle tactile blip
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
            osc.start(now);
            osc.stop(now + 0.08);
        }
    } catch (e) {
        // Audio error gracefully ignored
    }
}

function toggleSound() {
    state.soundEnabled = !state.soundEnabled;
    const soundIcon = document.getElementById("soundIcon");
    if (soundIcon) soundIcon.textContent = state.soundEnabled ? "🔔" : "🔕";
    showToast(state.soundEnabled ? "Alert audio enabled" : "Alert audio muted", "info");
}

/* ==================== IN-APP GLASS TOASTS ==================== */
function showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    const icon = type === 'danger' ? '🚨' : (type === 'success' ? '✅' : 'ℹ️');
    toast.innerHTML = `<span style="font-size: 16px;">${icon}</span><span>${message}</span>`;

    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3800);
}

/* ==================== SILENT PERMISSIONS & TELEMETRY ==================== */
function initSilentPermissions() {
    // Read cached coordinates if existing
    const cached = localStorage.getItem("userCoords");
    if (cached) {
        try {
            state.coords = JSON.parse(cached);
        } catch (e) {}
    }

    // Silently request geolocation with immediate fallback, never repeatedly prompts
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                state.coords = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude
                };
                localStorage.setItem("userCoords", JSON.stringify(state.coords));
                updateTelemetryUI();
                initMaps();
            },
            () => {
                // Silently fallback to realistic coordinates
                updateTelemetryUI();
                initMaps();
            },
            { timeout: 3500, enableHighAccuracy: true }
        );
    } else {
        updateTelemetryUI();
        initMaps();
    }

    // Silently request notification permission once without annoying loop
    if ("Notification" in window && Notification.permission === "default") {
        try {
            Notification.requestPermission().catch(() => {});
        } catch (e) {}
    }
}

function updateTelemetryUI() {
    const coordsText = document.getElementById("liveLocationCoordinates");
    if (coordsText) {
        coordsText.textContent = `Live GPS: ${state.coords.lat.toFixed(4)}° N, ${state.coords.lng.toFixed(4)}° E • Accuracy ±4m`;
    }

    const subtitle = document.getElementById("userLocationSubtitle");
    if (subtitle) {
        subtitle.textContent = `📍 GPS Active: ${state.coords.lat.toFixed(4)}, ${state.coords.lng.toFixed(4)} (Lakshmipuram Sector)`;
    }
}

/* ==================== VIEW & TAB SWITCHING ==================== */
function setupTabs() {
    const tabs = document.querySelectorAll(".nav-item");
    const pages = document.querySelectorAll(".page-view");

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const target = tab.dataset.target;
            switchToView(target);
        });
    });
}

function switchToView(viewId) {
    playSound('blip');
    const tabs = document.querySelectorAll(".nav-item");
    const pages = document.querySelectorAll(".page-view");

    tabs.forEach(t => t.classList.toggle("active", t.dataset.target === viewId));
    pages.forEach(p => p.classList.toggle("active", p.id === viewId));

    // Force Leaflet map resize whenever map views become visible
    setTimeout(() => {
        if (state.mainMap) state.mainMap.invalidateSize();
        if (state.responderMap) state.responderMap.invalidateSize();
    }, 200);
}

/* ==================== ROLE SWITCHING ==================== */
function toggleRole() {
    state.userRole = state.userRole === "patient" ? "helper" : "patient";
    localStorage.setItem("userRole", state.userRole);
    applyRole();
    showToast(`Switched active profile to ${state.userRole === "helper" ? "Responder" : "Patient"}`, "info");
}

function applyRole() {
    const navRole = document.getElementById("navRoleDisplay");
    const userAvatar = document.getElementById("userAvatar");
    const userNameDisplay = document.getElementById("userNameDisplay");
    const userRoleSubtitle = document.getElementById("userRoleSubtitle");

    if (state.userRole === "helper") {
        if (navRole) navRole.textContent = "Responder";
        if (userAvatar) userAvatar.textContent = "🤝";
        if (userNameDisplay) userNameDisplay.textContent = "Dr. Arvind";
        if (userRoleSubtitle) userRoleSubtitle.textContent = "Verified Community Medical Responder • Tier 1";
    } else {
        if (navRole) navRole.textContent = "Patient";
        if (userAvatar) userAvatar.textContent = "🧑‍⚕️";
        if (userNameDisplay) userNameDisplay.textContent = "Ramesh Kumar";
        if (userRoleSubtitle) userRoleSubtitle.textContent = "Registered Network Patient • Emergency Telemetry Active";
    }
}

/* ==================== LEAFLET MAP & TELEMETRY ==================== */
function initMaps() {
    if (typeof L === 'undefined') return;

    const patientLat = state.coords.lat;
    const patientLng = state.coords.lng;

    // Relative responder offset
    state.responderLocation = {
        lat: patientLat + 0.008,
        lng: patientLng + 0.007
    };

    // 1. Full Main Map
    const mapEl = document.getElementById("map");
    if (mapEl && !state.mainMap) {
        state.mainMap = L.map('map', {
            zoomControl: true,
            attributionControl: false
        }).setView([patientLat, patientLng], 15);

        // CartoDB Dark Matter tiles for ultra-sleek aesthetic
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
        }).addTo(state.mainMap);

        // Custom pulsing marker for Patient
        const patientIcon = L.divIcon({
            className: 'radar-pulse-marker',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });

        state.patientMarker = L.marker([patientLat, patientLng], { icon: patientIcon })
            .addTo(state.mainMap)
            .bindPopup("<b>Emergency Location</b><br>Ramesh Kumar (Patient)")
            .openPopup();

        // Responder marker
        const helperIcon = L.divIcon({
            className: 'helper-marker',
            iconSize: [26, 26],
            iconAnchor: [13, 13]
        });

        state.responderMarker = L.marker([state.responderLocation.lat, state.responderLocation.lng], { icon: helperIcon })
            .addTo(state.mainMap)
            .bindPopup("<b>Dr. Arvind (Responder)</b><br>Equipped with First Aid & AED");

        // Nearby Hospital Marker
        const hospitalIcon = L.circleMarker([patientLat - 0.006, patientLng - 0.005], {
            radius: 8,
            fillColor: "#06b6d4",
            color: "#ffffff",
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9
        }).addTo(state.mainMap).bindPopup("<b>District Community Hospital</b><br>24/7 Trauma Care Center");

        // Route line
        state.routeLine = L.polyline([
            [state.responderLocation.lat, state.responderLocation.lng],
            [patientLat, patientLng]
        ], {
            color: '#10b981',
            weight: 4,
            dashArray: '8, 8',
            opacity: 0.8
        }).addTo(state.mainMap);
    }

    // 2. Responder Hub Map Preview
    const respMapEl = document.getElementById("mapResponder");
    if (respMapEl && !state.responderMap) {
        state.responderMap = L.map('mapResponder', {
            zoomControl: false,
            attributionControl: false
        }).setView([patientLat, patientLng], 14);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
        }).addTo(state.responderMap);

        L.circleMarker([patientLat, patientLng], {
            radius: 10,
            fillColor: "#f43f5e",
            color: "#fff",
            weight: 2,
            fillOpacity: 0.8
        }).addTo(state.responderMap).bindPopup("Incident Point");

        L.circleMarker([state.responderLocation.lat, state.responderLocation.lng], {
            radius: 8,
            fillColor: "#10b981",
            color: "#fff",
            weight: 2,
            fillOpacity: 0.8
        }).addTo(state.responderMap).bindPopup("Your Location");
    }
}

/* ==================== EMERGENCY DISPATCH SYSTEM ==================== */
function setupCategorySelection() {
    const pills = document.querySelectorAll(".category-pill");
    pills.forEach(pill => {
        pill.addEventListener("click", () => {
            playSound('blip');
            pills.forEach(p => p.classList.remove("active"));
            pill.classList.add("active");
        });
    });
}

function triggerSOS() {
    playSound('sos');
    const activeCategoryPill = document.querySelector(".category-pill.active");
    const category = activeCategoryPill ? activeCategoryPill.dataset.type : "General Emergency";

    state.activeEmergency = {
        id: "EMG-" + Date.now().toString().slice(-4),
        type: category,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: "Broadcasted",
        coords: state.coords
    };

    // Show Tracker Card
    const tracker = document.getElementById("dispatchTrackerCard");
    if (tracker) tracker.classList.add("active");

    const detailsText = document.getElementById("dispatchDetailsText");
    if (detailsText) {
        detailsText.textContent = `Broadcasting ${category} request to 6 nearby responders...`;
    }

    // Update steps
    setStepper(1);
    showToast(`🚨 ${category} alert dispatched to nearby responders!`, "danger");
    saveActivity("patient", `Triggered SOS for ${category}`);

    // Simulate auto-match response after 2.5 seconds
    setTimeout(() => {
        if (!state.activeEmergency) return;
        playSound('accept');
        setStepper(2);
        showToast("🤝 Responder Accepted: Dr. Arvind (1.8 km away, ETA 4 mins)", "success");
        if (detailsText) {
            detailsText.textContent = "Responder Matched: Dr. Arvind (Rapid Bike Unit) • En route";
        }
        const etaBadge = document.getElementById("dispatchEtaBadge");
        if (etaBadge) etaBadge.textContent = "ETA: 4 mins (1.8 km)";
        
        // Advance to en route
        setTimeout(() => {
            if (!state.activeEmergency) return;
            setStepper(3);
            simulateMovement();
        }, 1500);
    }, 2800);
}

function setStepper(stepNumber) {
    for (let i = 1; i <= 4; i++) {
        const el = document.getElementById(`step${i}`);
        if (!el) continue;
        el.classList.remove("active", "done");
        if (i < stepNumber) el.classList.add("done");
        else if (i === stepNumber) el.classList.add("active");
    }
}

function cancelSOS() {
    playSound('blip');
    state.activeEmergency = null;
    const tracker = document.getElementById("dispatchTrackerCard");
    if (tracker) tracker.classList.remove("active");
    showToast("Emergency request cancelled", "info");
    saveActivity("patient", "Cancelled Emergency SOS");
    if (state.simulationTimer) clearInterval(state.simulationTimer);
}

/* ==================== RESPONDER HUB ACTIONS ==================== */
function updateHelperStatus(val) {
    state.helperStatus = val;
    const badge = document.getElementById("helperStatusBadge");
    if (!badge) return;

    badge.className = `status-badge ${val}`;
    if (val === "available") {
        badge.innerHTML = `<span class="role-dot"></span> Ready & On Radar`;
        showToast("You are marked Available for emergency calls", "success");
    } else if (val === "busy") {
        badge.innerHTML = `⚠️ On Active Mission`;
        showToast("Status updated to On Mission", "info");
    } else {
        badge.innerHTML = `Offline`;
        showToast("You are now Offline", "info");
    }
}

function acceptIncident() {
    playSound('accept');
    showToast("Incident Accepted! Navigating to patient location...", "success");
    saveActivity("helper", "Accepted Road Collision Emergency response");
    
    // Switch to map & simulate navigation
    switchToView("location");
    simulateMovement();
}

function dismissIncident() {
    playSound('blip');
    const card = document.getElementById("sampleIncidentCard");
    if (card) {
        card.style.opacity = '0.4';
        card.style.pointerEvents = 'none';
    }
    showToast("Incident passed to next nearby responder", "info");
}

/* ==================== REAL-TIME MOVEMENT SIMULATION ==================== */
function simulateMovement() {
    if (state.simulationTimer) clearInterval(state.simulationTimer);

    showToast("⚡ Responder dispatch simulation initiated", "info");
    const target = state.coords;
    let currLat = state.responderLocation.lat;
    let currLng = state.responderLocation.lng;

    let steps = 25;
    let stepCount = 0;
    const dLat = (target.lat - currLat) / steps;
    const dLng = (target.lng - currLng) / steps;

    state.simulationTimer = setInterval(() => {
        stepCount++;
        currLat += dLat;
        currLng += dLng;

        state.responderLocation = { lat: currLat, lng: currLng };

        if (state.responderMarker) {
            state.responderMarker.setLatLng([currLat, currLng]);
        }

        if (state.routeLine) {
            state.routeLine.setLatLngs([
                [currLat, currLng],
                [target.lat, target.lng]
            ]);
        }

        // Calculate approximate remaining distance
        const remainingDist = Math.max(0.1, (1.8 * (1 - stepCount / steps))).toFixed(1);
        const mapLiveStatus = document.getElementById("mapLiveStatusText");
        if (mapLiveStatus) {
            mapLiveStatus.textContent = `Responder in transit: ${remainingDist} km away`;
        }

        const etaBadge = document.getElementById("dispatchEtaBadge");
        if (etaBadge) {
            etaBadge.textContent = `ETA: ${Math.ceil(remainingDist * 2)} min (${remainingDist} km)`;
        }

        if (stepCount >= steps) {
            clearInterval(state.simulationTimer);
            setStepper(4);
            playSound('accept');
            showToast("✅ Responder has reached the patient location!", "success");
            if (mapLiveStatus) {
                mapLiveStatus.textContent = "Responder Arrived at Patient Site";
            }
            saveActivity("helper", "Arrived at emergency location • Patient Assisted");
        }
    }, 400);
}

function openExternalGoogleMaps() {
    const lat = state.coords.lat;
    const lng = state.coords.lng;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
}

/* ==================== PERSISTENT ACTIVITY HISTORY ==================== */
function saveActivity(role, description) {
    const history = JSON.parse(localStorage.getItem("helpmap_history") || "[]");
    history.unshift({
        id: Date.now(),
        role: role,
        description: description,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    // Keep last 15 items
    localStorage.setItem("helpmap_history", JSON.stringify(history.slice(0, 15)));
    renderHistory();
}

function renderHistory() {
    const container = document.getElementById("historyFeed");
    if (!container) return;

    const history = JSON.parse(localStorage.getItem("helpmap_history") || "[]");
    container.innerHTML = "";

    if (history.length === 0) {
        container.innerHTML = `<p style="color: var(--text-dim); font-size: 13px; text-align: center; padding: 20px;">No recent incidents recorded</p>`;
        return;
    }

    history.forEach(item => {
        const div = document.createElement("div");
        div.className = "history-item";
        const icon = item.role === 'patient' ? '🧑‍⚕️' : '🤝';
        div.innerHTML = `
            <div class="history-meta">
                <span>${icon}</span>
                <span>${item.description}</span>
            </div>
            <span class="history-time">${item.time}</span>
        `;
        container.appendChild(div);
    });
}

function clearHistory() {
    localStorage.removeItem("helpmap_history");
    renderHistory();
    showToast("Incident history cleared", "info");
}

/* ==================== INITIALIZATION ==================== */
document.addEventListener("DOMContentLoaded", () => {
    applyRole();
    setupTabs();
    setupCategorySelection();
    initSilentPermissions();
    renderHistory();

    // Default sample history if brand new
    if (!localStorage.getItem("helpmap_history")) {
        saveActivity("patient", "Portal registration verified");
        saveActivity("helper", "Telemetry check passed");
    }
});
