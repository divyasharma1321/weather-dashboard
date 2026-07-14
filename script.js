// ---------- Config & constants ----------
const API_KEY = CONFIG.API_KEY;
const CURRENT_URL = "https://api.openweathermap.org/data/2.5/weather";
const FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";

// ---------- State ----------
let unit = localStorage.getItem("unit") || "metric";
let recentSearches = JSON.parse(localStorage.getItem("recentSearches")) || [];
let lastCurrentData = null;
let lastForecastData = null;
let iconCounter = 0;

// ---------- DOM references ----------
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locateBtn = document.getElementById("locateBtn");
const unitToggle = document.getElementById("unitToggle");
const weatherDisplay = document.getElementById("weatherDisplay");
const forecastDisplay = document.getElementById("forecastDisplay");
const recentSearchesEl = document.getElementById("recentSearches");
const sky = document.getElementById("sky");
const celestial = document.getElementById("celestial");
const particles = document.getElementById("particles");

// ---------- Init ----------
unitToggle.textContent = unit === "metric" ? "°C" : "°F";
renderRecentSearches();

// ---------- Event listeners ----------
searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (!city) return;
  fetchByCity(city);
});

cityInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const city = cityInput.value.trim();
    if (city) fetchByCity(city);
  }
});

locateBtn.addEventListener("click", useMyLocation);

unitToggle.addEventListener("click", () => {
  unit = unit === "metric" ? "imperial" : "metric";
  localStorage.setItem("unit", unit);
  unitToggle.textContent = unit === "metric" ? "°C" : "°F";
  if (lastCurrentData) renderWeather(lastCurrentData);
  if (lastForecastData) renderForecast(lastForecastData);
});
// ---------- Fetching ----------
async function fetchByCity(city) {
  showLoading();
  try {
    const [current, forecast] = await Promise.all([
      fetchJSON(`${CURRENT_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`),
      fetchJSON(`${FORECAST_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`),
    ]);
    handleSuccess(current, forecast);
    saveSearch(current.name);
  } catch (err) {
    handleError(err, () => fetchByCity(city));
  }
}

async function fetchByCoords(lat, lon) {
  showLoading();
  try {
    const [current, forecast] = await Promise.all([
      fetchJSON(`${CURRENT_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`),
      fetchJSON(`${FORECAST_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`),
    ]);
    handleSuccess(current, forecast);
    saveSearch(current.name);
  } catch (err) {
    handleError(err, () => fetchByCoords(lat, lon));
  }
}

async function fetchJSON(url) {
  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 404) throw new Error("NOT_FOUND");
    throw new Error("SERVER_ERROR");
  }
  return response.json();
}

function handleSuccess(current, forecast) {
  lastCurrentData = current;
  lastForecastData = forecast;
  renderWeather(current);
  renderForecast(forecast);
}

function useMyLocation() {
  if (!navigator.geolocation) {
    showError({ message: "GEO_UNSUPPORTED" }, null);
    return;
  }
  locateBtn.disabled = true;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      locateBtn.disabled = false;
      fetchByCoords(pos.coords.latitude, pos.coords.longitude);
    },
    () => {
      locateBtn.disabled = false;
      showError({ message: "GEO_DENIED" }, null);
    }
  );
}
// ---------- Rendering: loading & error ----------
function showLoading() {
  weatherDisplay.innerHTML = `
    <div class="skeleton">
      <div class="skel-block" style="width:84px;height:84px;border-radius:50%;"></div>
      <div class="skel-block" style="width:120px;height:44px;"></div>
      <div class="skel-block" style="width:160px;height:18px;"></div>
    </div>
  `;
  forecastDisplay.innerHTML = "";
}

function handleError(err, retryFn) {
  const key = err.message || "UNKNOWN";
  showError({ message: key }, retryFn);
}

function showError({ message }, retryFn) {
  const messages = {
    NOT_FOUND: ["City not found", "Double-check the spelling and try again."],
    SERVER_ERROR: ["Something went wrong", "The weather service didn't respond. Try again shortly."],
    GEO_DENIED: ["Location access denied", "Allow location access, or search for a city instead."],
    GEO_UNSUPPORTED: ["Location not supported", "Your browser doesn't support geolocation. Try searching instead."],
    UNKNOWN: ["Network error", "Check your internet connection and try again."],
  };
  const [title, sub] = messages[message] || messages.UNKNOWN;

  weatherDisplay.innerHTML = `
    <div class="error-card">
      <div class="error-title">⚠️ ${title}</div>
      <div class="error-sub">${sub}</div>
      ${retryFn ? `<button class="retry-btn" id="retryBtn">Try again</button>` : ""}
    </div>
  `;

  if (retryFn) {
    document.getElementById("retryBtn").addEventListener("click", retryFn);
  }
}