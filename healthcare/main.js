/* ===================== MENU NAVIGATION ===================== */
const menuItems = document.querySelectorAll(".menu li");
const pages = document.querySelectorAll(".page");

menuItems.forEach((item, index) => {
    item.addEventListener("click", () => {

        // Menu active state
        menuItems.forEach(i => i.classList.remove("active"));
        item.classList.add("active");

        // Page switching
        pages.forEach(page => page.classList.remove("active"));
        pages[index].classList.add("active");

        // Location tracking control
        if (pages[index].id === "location") {
            startLiveLocation();
        } else {
            stopLiveLocation();
        }

        // Reload history when Home opens
        if (pages[index].id === "home") {
            loadHistory();
        }
    });
});


/* ===================== HELPER STATUS ===================== */
const statusSelect = document.getElementById("statusSelect");
const statusBadge = document.getElementById("statusBadge");

if (statusSelect && statusBadge) {
    statusSelect.addEventListener("change", () => {
        const value = statusSelect.value;

        statusBadge.classList.remove("available", "busy", "offline");
        statusBadge.classList.add(value);
        statusBadge.textContent = value.charAt(0).toUpperCase() + value.slice(1);
    });
}


/* ===================== CURSOR REACTIVE BACKGROUND ===================== */
document.addEventListener("mousemove", (e) => {
    const x = (e.clientX / window.innerWidth) * 120;
    const y = (e.clientY / window.innerHeight) * 120;

    document.body.style.setProperty("--x", `${x}%`);
    document.body.style.setProperty("--y", `${y}%`);
});

// Disable cursor effect on mobile
if (/Mobi|Android/i.test(navigator.userAgent)) {
    document.body.style.setProperty("--x", "50%");
    document.body.style.setProperty("--y", "50%");
}


/* ===================== REAL-TIME LOCATION TRACKING ===================== */
let watchId = null;

function startLiveLocation() {
    const mapFrame = document.getElementById("mapFrame");
    const locationText = document.getElementById("locationText");

    if (!mapFrame || !locationText) return;

    if (!navigator.geolocation) {
        locationText.textContent = "Geolocation not supported";
        return;
    }

    locationText.textContent = "Tracking live location...";

    watchId = navigator.geolocation.watchPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            mapFrame.src =
                `https://www.google.com/maps?q=${lat},${lon}&z=17&output=embed`;
        },
        () => {
            locationText.textContent = "Location permission denied";
        },
        {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 5000
        }
    );
}

function stopLiveLocation() {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
}


/* ===================== NAVIGATE BUTTON ===================== */
const navigateBtn = document.getElementById("navigateBtn");

if (navigateBtn) {
    navigateBtn.addEventListener("click", () => {

        if (!navigator.geolocation) {
            alert("Geolocation not supported");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                const mapsUrl =
                    `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;

                window.open(mapsUrl, "_blank");
            },
            () => {
                alert("Unable to fetch location");
            }
        );
    });
}


/* ===================== ACTIVITY HISTORY ===================== */
function loadHistory() {
    const history = JSON.parse(localStorage.getItem("activityHistory")) || [];

    const patientDiv = document.getElementById("patientHistory");
    const helperDiv = document.getElementById("helperHistory");

    if (!patientDiv || !helperDiv) return;

    patientDiv.innerHTML = "";
    helperDiv.innerHTML = "";

    let patientCount = 0;
    let helperCount = 0;

    history.forEach(item => {
        const entry = document.createElement("p");
        entry.innerHTML = `• ${item.type} <br><small>${item.time}</small>`;

        if (item.role === "patient") {
            patientDiv.appendChild(entry);
            patientCount++;
        }

        if (item.role === "helper") {
            helperDiv.appendChild(entry);
            helperCount++;
        }
    });

    if (patientCount === 0) {
        patientDiv.innerHTML = `<p style="color:#aaa;">No patient activity yet</p>`;
    }

    if (helperCount === 0) {
        helperDiv.innerHTML = `<p style="color:#aaa;">No helper activity yet</p>`;
    }
}

function savePatientActivity(type) {
    const history = JSON.parse(localStorage.getItem("activityHistory")) || [];

    history.push({
        role: "patient",
        type: type,
        time: new Date().toLocaleString()
    });

    localStorage.setItem("activityHistory", JSON.stringify(history));
}

function saveHelperActivity() {
    const history = JSON.parse(localStorage.getItem("activityHistory")) || [];

    history.push({
        role: "helper",
        type: "Helped a patient",
        time: new Date().toLocaleString()
    });

    localStorage.setItem("activityHistory", JSON.stringify(history));
}


/* ===================== INITIAL LOAD ===================== */
document.addEventListener("DOMContentLoaded", loadHistory);
