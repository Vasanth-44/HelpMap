/**
 * HealthSafe — Core Utility Script
 * Cross-dashboard state management and synchronization
 */

function getActiveRole() {
    return localStorage.getItem("userRole") || "patient";
}

function getStoredCoordinates() {
    const raw = localStorage.getItem("userCoords");
    if (raw) {
        try { return JSON.parse(raw); } catch (e) {}
    }
    return { lat: 13.0827, lng: 80.2707 };
}

function logoutUser() {
    localStorage.removeItem("userRole");
    window.location.href = "index.html";
}
