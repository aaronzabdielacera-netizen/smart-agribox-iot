// Database endpoint with authentication token
const dbUrl = "https://smart-agribox-2026-default-rtdb.asia-southeast1.firebasedatabase.app/AgriBox_Status.json?auth=Ov5Mgp1svU6rxpQmivehytuAPwnHcJj0ZS8U6YP3";

// Current readings & thresholds
let currentTemp = 24.2;
let currentHum = 68.5;
const coolingThreshold = 25.0; // Start cooling if above 25°C
let autoCoolingActive = true;
let isCoolingOn = false;
let manualFanState = false;

// Initialize Event Listeners on DOM Ready
document.addEventListener("DOMContentLoaded", () => {
    const autoSwitch = document.getElementById('auto-switch');
    const fanSwitch = document.getElementById('fan-switch');

    if (autoSwitch) {
        autoSwitch.addEventListener('change', (e) => toggleAutoMode(e.target));
    }
    if (fanSwitch) {
        fanSwitch.addEventListener('change', (e) => toggleManualFan(e.target));
    }

    // Initialize System Clock
    updateClock();
    setInterval(updateClock, 10000);

    // Fast polling every 1 second
    fetchLiveCloudTelemetry();
    setInterval(fetchLiveCloudTelemetry, 1000);
});

// Clock display
function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    if (minutes < 10) minutes = "0" + minutes;
    if (hours < 10) hours = "0" + hours;
    const el = document.getElementById('system-clock');
    if (el) el.innerText = `${hours}:${minutes}`;
}

// Main Cooling Logic
function evaluateCooling() {
    const heroBanner = document.getElementById('hero-banner');
    const coolingBadge = document.getElementById('cooling-badge');
    const coolingBadgeText = document.getElementById('cooling-badge-text');
    const statusMessage = document.getElementById('status-message');
    const fanVisual = document.getElementById('fan-visual');
    const fanRelayText = document.getElementById('fan-relay-text');
    const fanSwitch = document.getElementById('fan-switch');
    const badgeIcon = document.getElementById('badge-icon');

    if (autoCoolingActive) {
        // If it is too hot (> 25°C), turn cooling ON
        if (currentTemp > coolingThreshold) {
            isCoolingOn = true;
        }
        // Deactivate cooling as soon as temperature is at or below 25.0°C
        else {
            isCoolingOn = false;
        }
    } else {
        isCoolingOn = manualFanState;
    }

    // Update UI
    if (isCoolingOn) {
        heroBanner.className = 'hero-banner is-cooling';
        coolingBadge.className = 'status-pill cooling';
        coolingBadgeText.innerText = 'Cooling Active';

        badgeIcon.innerHTML = `
            <line x1="12" y1="2" x2="12" y2="22"></line>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path d="M4.93 4.93l14.14 14.14"></path>
            <path d="M19.07 4.93L4.93 19.07"></path>
        `;

        statusMessage.innerText = `Box is too hot (${currentTemp.toFixed(1)}°C) • Fan running`;
        statusMessage.style.color = 'var(--accent-blue)';
        fanVisual.classList.add('active-cooling');
        fanRelayText.innerText = 'Running';
        fanRelayText.style.color = 'var(--accent-blue)';
        if (fanSwitch) fanSwitch.checked = true;
    } else {
        heroBanner.className = 'hero-banner is-stabilized';
        coolingBadge.className = 'status-pill stabilized';
        coolingBadgeText.innerText = 'Normal';

        badgeIcon.innerHTML = `<polyline points="20 6 9 17 4 12"></polyline>`;

        statusMessage.innerText = `Temperature is good • Box is stable`;
        statusMessage.style.color = 'var(--accent-green)';
        fanVisual.classList.remove('active-cooling');
        fanRelayText.innerText = 'Standby';
        fanRelayText.style.color = 'var(--text-muted)';
        if (fanSwitch) fanSwitch.checked = false;
    }
}

// Update UI with new values
function updateDisplay(temp, hum) {
    currentTemp = temp;
    currentHum = hum;

    document.getElementById('live-temp').innerText = currentTemp.toFixed(1);
    document.getElementById('card-temp').innerText = currentTemp.toFixed(1) + "°C";
    document.getElementById('live-hum').innerText = currentHum.toFixed(1) + "%";

    const humStatus = document.getElementById('hum-status');
    if (currentHum > 80) {
        humStatus.innerHTML = '<span style="color: var(--accent-amber);">▲ High Humidity</span>';
    } else if (currentHum < 40) {
        humStatus.innerHTML = '<span style="color: var(--accent-amber);">▼ Dry Air</span>';
    } else {
        humStatus.innerHTML = '<span style="color: var(--accent-green);">● Good Moisture</span>';
    }

    evaluateCooling();
}

// Toggle Handlers
function toggleAutoMode(elem) {
    autoCoolingActive = elem.checked;
    const subtitle = document.getElementById('auto-mode-text');
    if (autoCoolingActive) {
        subtitle.innerText = 'Turns on fan when box gets too hot';
    } else {
        subtitle.innerText = 'Manual mode (automatic cooling paused)';
    }
    evaluateCooling();
}

function toggleManualFan(elem) {
    manualFanState = elem.checked;
    if (manualFanState && autoCoolingActive) {
        autoCoolingActive = false;
        document.getElementById('auto-switch').checked = false;
        document.getElementById('auto-mode-text').innerText = 'Manual mode active';
    }
    evaluateCooling();
}

// Fast Telemetry Polling via REST API (Checks Firebase every 1 second)
async function fetchLiveCloudTelemetry() {
    try {
        const timeParam = "&_t=" + Date.now();
        const fetchUrl = dbUrl + timeParam;

        const response = await fetch(fetchUrl, { cache: "no-store" });
        if (!response.ok) throw new Error("Database offline");

        const data = await response.json();

        if (data) {
            const rawTemp = data.temperature !== undefined ? data.temperature : (data.AgriBox_Status ? data.AgriBox_Status.temperature : null);
            const rawHum = data.humidity !== undefined ? data.humidity : (data.AgriBox_Status ? data.AgriBox_Status.humidity : null);

            if (rawTemp !== null && rawHum !== null) {
                updateDisplay(parseFloat(rawTemp), parseFloat(rawHum));

                document.getElementById('cloud-status').innerText = 'Connected';
                document.getElementById('cloud-status').className = 'status-line-val ok';
                document.getElementById('sensor-status').innerText = 'Working Normally';
                document.getElementById('sensor-status').className = 'status-line-val ok';
            }
        }
    } catch (error) {
        document.getElementById('cloud-status').innerText = 'Connection Error';
        document.getElementById('cloud-status').className = 'status-line-val';
    }
}