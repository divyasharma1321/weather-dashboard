// ---------- Config & constants ----------
const API_KEY = CONFIG.API_KEY;
const CURRENT_URL = "https://api.openweathermap.org/data/2.5/weather";
const FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";
const AIR_QUALITY_URL = "https://api.openweathermap.org/data/2.5/air_pollution";

// ---------- State ----------
let unit = localStorage.getItem("unit") || "metric";
let recentSearches = JSON.parse(localStorage.getItem("recentSearches")) || [];
let lastCurrentData = null;
let lastForecastData = null;
let iconCounter = 0;
let isLoading = false;

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
  if (isLoading) return;
  isLoading = true;
  searchBtn.disabled = true;
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
  } finally {
    isLoading = false;
    searchBtn.disabled = false;
  }
}

async function fetchByCoords(lat, lon) {

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
  lastUpdatedAt = Date.now();
  renderWeather(current);
  renderForecast(forecast);
  updateFooterTimestamp();
  fetchAirQuality(current.coord.lat, current.coord.lon);
}

async function fetchAirQuality(lat, lon) {
  try {
    const data = await fetchJSON(`${AIR_QUALITY_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
    renderAirQuality(data);
  } catch (err) {
    // Air quality is a bonus feature — fail silently if it's unavailable
  }
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
// ---------- Rendering: current weather ----------
function renderWeather(data) {
  const { name, main, weather, wind, sys, dt, timezone } = data;
  const condition = weather[0].main;
  const description = weather[0].description;
  const isDay = dt > sys.sunrise && dt < sys.sunset;

  const temp = convertTemp(main.temp);
  const feelsLike = convertTemp(main.feels_like);
  const windSpeed = unit === "metric" ? Math.round(wind.speed * 3.6) : Math.round(wind.speed);

  weatherDisplay.innerHTML = `
    <div class="weather-card">
      <div class="wc-icon">${weatherIconSVG(condition, isDay)}</div>
      <div class="wc-temp">${temp}°</div>
      <div class="wc-city">${escapeHTML(name)}</div>
      <div class="wc-desc">${escapeHTML(description)}</div>
      <div class="wc-localtime">${getLocalTime(dt, timezone)}</div>
      <div class="wc-details">
        <div class="detail-item">
          <span class="label">Feels like</span>
          <span class="value">${feelsLike}°</span>
        </div>
        <div class="detail-item">
          <span class="label">Humidity</span>
          <span class="value">${main.humidity}%</span>
        </div>
        <div class="detail-item">
          <span class="label">Wind</span>
          <span class="value">${windSpeed}</span>
        </div>
      </div>
      <div class="sun-times">
        <span>🌅 Sunrise <strong>${formatTime(sys.sunrise)}</strong></span>
        <span>🌇 Sunset <strong>${formatTime(sys.sunset)}</strong></span>
      </div>
    </div>
  `;

  updateSky(condition, isDay);
}
// ---------- Rendering: 5-day forecast ----------
function renderForecast(forecastData) {
  const dailyMap = {};

  forecastData.list.forEach((entry) => {
    const date = entry.dt_txt.split(" ")[0];
    if (!dailyMap[date]) dailyMap[date] = [];
    dailyMap[date].push(entry);
  });

  const days = Object.keys(dailyMap).slice(0, 5);

  forecastDisplay.innerHTML = days
    .map((date, i) => {
      const entries = dailyMap[date];
      const midday = entries.reduce((best, e) => {
        const hour = Number(e.dt_txt.split(" ")[1].split(":")[0]);
        const bestHour = Number(best.dt_txt.split(" ")[1].split(":")[0]);
        return Math.abs(hour - 12) < Math.abs(bestHour - 12) ? e : best;
      });
      const high = Math.round(Math.max(...entries.map((e) => e.main.temp_max)));
      const low = Math.round(Math.min(...entries.map((e) => e.main.temp_min)));
      const label = i === 0 ? "Today" : new Date(date).toLocaleDateString(undefined, { weekday: "short" });

      return `
        <div class="forecast-card">
          <div class="forecast-day">${label}</div>
          <div class="forecast-icon">${weatherIconSVG(midday.weather[0].main, true)}</div>
          <div class="forecast-temps">${convertTemp(high)}°<span class="low">${convertTemp(low)}°</span></div>
        </div>
      `;
    })
    .join("");
}
// ---------- Recent searches ----------
function saveSearch(city) {
  recentSearches = recentSearches.filter((c) => c.toLowerCase() !== city.toLowerCase());
  recentSearches.unshift(city);
  if (recentSearches.length > 5) recentSearches.pop();
  localStorage.setItem("recentSearches", JSON.stringify(recentSearches));
  renderRecentSearches();
}

function renderRecentSearches() {
  recentSearchesEl.innerHTML = recentSearches
    .map(
      (city) => `
      <span class="chip">
        <button class="chip-label" data-city="${escapeHTML(city)}">${escapeHTML(city)}</button>
        <button class="chip-remove" data-city="${escapeHTML(city)}" aria-label="Remove ${escapeHTML(city)}">✕</button>
      </span>
    `
    )
    .join("");

  recentSearchesEl.querySelectorAll(".chip-label").forEach((btn) => {
    btn.addEventListener("click", () => {
      cityInput.value = btn.dataset.city;
      fetchByCity(btn.dataset.city);
    });
  });

  recentSearchesEl.querySelectorAll(".chip-remove").forEach((btn) => {
    btn.addEventListener("click", () => removeSearch(btn.dataset.city));
  });
}

function removeSearch(city) {
  recentSearches = recentSearches.filter((c) => c !== city);
  localStorage.setItem("recentSearches", JSON.stringify(recentSearches));
  renderRecentSearches();
}
// ---------- Dynamic sky background ----------
function updateSky(condition, isDay) {
  const themes = {
    Clear: isDay
      ? "linear-gradient(180deg, #4a90d9 0%, #87ceeb 45%, #ffe5a8 100%)"
      : "linear-gradient(180deg, #0b1120 0%, #131c31 55%, #1b2a4a 100%)",
    Clouds: isDay
      ? "linear-gradient(180deg, #7f97b3 0%, #c9d3de 100%)"
      : "linear-gradient(180deg, #1e2634 0%, #38455a 100%)",
    Rain: isDay
      ? "linear-gradient(180deg, #4a5f72 0%, #6c8296 100%)"
      : "linear-gradient(180deg, #0e161d 0%, #202f3b 100%)",
    Drizzle: isDay
      ? "linear-gradient(180deg, #5a7184 0%, #7c95a8 100%)"
      : "linear-gradient(180deg, #101c24 0%, #23333f 100%)",
    Thunderstorm: "linear-gradient(180deg, #1e1b2e 0%, #362f4d 100%)",
    Snow: isDay
      ? "linear-gradient(180deg, #c9d9e8 0%, #eef4f9 100%)"
      : "linear-gradient(180deg, #1c2534 0%, #2f3f56 100%)",
  };
  const mistGroup = ["Mist", "Smoke", "Haze", "Dust", "Fog", "Sand", "Ash", "Squall", "Tornado"];

  let gradient;
  if (themes[condition]) {
    gradient = themes[condition];
  } else if (mistGroup.includes(condition)) {
    gradient = isDay
      ? "linear-gradient(180deg, #8a93a1 0%, #b7bfc9 100%)"
      : "linear-gradient(180deg, #262c35 0%, #454e5c 100%)";
  } else {
    gradient = "linear-gradient(180deg, #2b3a55 0%, #4a5f80 100%)";
  }

  sky.style.background = gradient;
  renderCelestial(condition, isDay);
  renderParticles(condition, isDay);
}

function renderCelestial(condition, isDay) {
  if (condition === "Clouds" || ["Rain", "Drizzle", "Thunderstorm", "Snow"].includes(condition)) {
    celestial.innerHTML = "";
    return;
  }
  if (isDay) {
    celestial.innerHTML = `
      <div class="sun">
        <div class="sun-core"></div>
        ${Array.from({ length: 8 })
          .map((_, i) => `<div class="sun-ray" style="transform: translate(-50%,-50%) rotate(${i * 45}deg) translateY(-32px);"></div>`)
          .join("")}
      </div>
    `;
  } else {
    celestial.innerHTML = `
      <div class="moon"></div>
      <div class="stars">
        ${Array.from({ length: 18 })
          .map(() => {
            const top = Math.random() * 300 - 100;
            const left = Math.random() * 300 - 220;
            const delay = (Math.random() * 3).toFixed(1);
            return `<div class="star" style="top:${top}px; left:${left}px; animation-delay:${delay}s;"></div>`;
          })
          .join("")}
      </div>
    `;
  }
}

function renderParticles(condition, isDay) {
  const rainGroup = ["Rain", "Drizzle", "Thunderstorm"];
  const mistGroup = ["Mist", "Smoke", "Haze", "Dust", "Fog", "Sand", "Ash", "Squall", "Tornado"];

  if (rainGroup.includes(condition)) {
    const count = 40;
    particles.innerHTML = Array.from({ length: count })
      .map(() => {
        const left = Math.random() * 100;
        const duration = (0.5 + Math.random() * 0.6).toFixed(2);
        const delay = (Math.random() * 2).toFixed(2);
        return `<div class="raindrop" style="left:${left}%; animation-duration:${duration}s; animation-delay:${delay}s;"></div>`;
      })
      .join("");
    if (condition === "Thunderstorm") {
      particles.innerHTML += `<div class="flash"></div>`;
    }
  } else if (condition === "Snow") {
    const count = 30;
    particles.innerHTML = Array.from({ length: count })
      .map(() => {
        const left = Math.random() * 100;
        const size = 3 + Math.random() * 4;
        const duration = (4 + Math.random() * 4).toFixed(2);
        const delay = (Math.random() * 4).toFixed(2);
        return `<div class="snowflake" style="left:${left}%; width:${size}px; height:${size}px; animation-duration:${duration}s; animation-delay:${delay}s;"></div>`;
      })
      .join("");
  } else if (mistGroup.includes(condition)) {
    const count = 5;
    particles.innerHTML = Array.from({ length: count })
      .map((_, i) => {
        const top = 15 + i * 15;
        const width = 40 + Math.random() * 30;
        const left = Math.random() * 40;
        return `<div class="mist-line" style="top:${top}%; left:${left}%; width:${width}%;"></div>`;
      })
      .join("");
  } else if (condition === "Clouds") {
    particles.innerHTML = `
      <div class="cloud" style="top:15%; left:-10%;">${cloudSVG(70)}</div>
      <div class="cloud" style="top:28%; left:40%; animation-delay:-20s; opacity:0.7;">${cloudSVG(50)}</div>
    `;
  } else {
    particles.innerHTML = "";
  }
}

function cloudSVG(size) {
  return `
    <svg width="${size}" height="${size * 0.6}" viewBox="0 0 64 40">
      <ellipse cx="20" cy="26" rx="14" ry="11" fill="#ffffff"/>
      <ellipse cx="34" cy="20" rx="17" ry="15" fill="#ffffff"/>
      <rect x="12" y="24" width="38" height="13" rx="6.5" fill="#ffffff"/>
    </svg>
  `;
}
// ---------- Weather condition icon (card + forecast) ----------
function weatherIconSVG(condition, isDay) {
  iconCounter++;
  const id = iconCounter;

  const rainGroup = ["Rain", "Drizzle"];
  const mistGroup = ["Mist", "Smoke", "Haze", "Dust", "Fog", "Sand", "Ash", "Squall", "Tornado"];

  if (condition === "Clear") return isDay ? sunIcon() : moonIcon(id);
  if (condition === "Clouds") return cloudIcon();
  if (rainGroup.includes(condition)) return rainIcon();
  if (condition === "Thunderstorm") return thunderIcon();
  if (condition === "Snow") return snowIcon();
  if (mistGroup.includes(condition)) return mistIcon();
  return cloudIcon();
}

function sunIcon() {
  return `
    <svg viewBox="0 0 64 64" width="100%" height="100%">
      <g class="icon-sun-group">
        <circle cx="32" cy="32" r="13" fill="#ffd35c"/>
        ${Array.from({ length: 8 })
          .map((_, i) => {
            const angle = i * 45;
            return `<line x1="32" y1="32" x2="32" y2="10" stroke="#ffd35c" stroke-width="3" stroke-linecap="round" transform="rotate(${angle} 32 32)"/>`;
          })
          .join("")}
      </g>
    </svg>
  `;
}

function moonIcon(id) {
  return `
    <svg viewBox="0 0 64 64" width="100%" height="100%">
      <mask id="moonMask-${id}">
        <rect width="64" height="64" fill="#fff"/>
        <circle cx="40" cy="24" r="16" fill="#000"/>
      </mask>
      <circle cx="32" cy="32" r="18" fill="#e8ecf5" mask="url(#moonMask-${id})"/>
    </svg>
  `;
}

function cloudIcon() {
  return `
    <svg viewBox="0 0 64 64" width="100%" height="100%">
      <g class="icon-cloud">
        <ellipse cx="24" cy="38" rx="14" ry="11" fill="#f4f8ff"/>
        <ellipse cx="38" cy="32" rx="17" ry="15" fill="#f4f8ff"/>
        <rect x="15" y="36" width="38" height="14" rx="7" fill="#f4f8ff"/>
      </g>
    </svg>
  `;
}

function rainIcon() {
  return `
    <svg viewBox="0 0 64 64" width="100%" height="100%">
      <g class="icon-cloud">
        <ellipse cx="24" cy="26" rx="14" ry="10" fill="#f4f8ff"/>
        <ellipse cx="38" cy="21" rx="16" ry="13" fill="#f4f8ff"/>
        <rect x="15" y="24" width="36" height="13" rx="6.5" fill="#f4f8ff"/>
      </g>
      <line class="icon-rain-drop" x1="24" y1="46" x2="21" y2="54" stroke="#7dd3fc" stroke-width="3" stroke-linecap="round"/>
      <line class="icon-rain-drop" x1="34" y1="46" x2="31" y2="54" stroke="#7dd3fc" stroke-width="3" stroke-linecap="round"/>
      <line class="icon-rain-drop" x1="44" y1="46" x2="41" y2="54" stroke="#7dd3fc" stroke-width="3" stroke-linecap="round"/>
    </svg>
  `;
}

function thunderIcon() {
  return `
    <svg viewBox="0 0 64 64" width="100%" height="100%">
      <g>
        <ellipse cx="24" cy="24" rx="14" ry="10" fill="#f4f8ff"/>
        <ellipse cx="38" cy="19" rx="16" ry="13" fill="#f4f8ff"/>
        <rect x="15" y="22" width="36" height="13" rx="6.5" fill="#f4f8ff"/>
      </g>
      <polygon class="icon-bolt" points="34,36 24,52 32,52 28,60 42,42 34,42" fill="#ffd35c"/>
    </svg>
  `;
}

function snowIcon() {
  return `
    <svg viewBox="0 0 64 64" width="100%" height="100%">
      <g class="icon-cloud">
        <ellipse cx="24" cy="24" rx="14" ry="10" fill="#f4f8ff"/>
        <ellipse cx="38" cy="19" rx="16" ry="13" fill="#f4f8ff"/>
        <rect x="15" y="22" width="36" height="13" rx="6.5" fill="#f4f8ff"/>
      </g>
      <circle class="icon-snow-dot" cx="24" cy="48" r="2.6" fill="#dceeff"/>
      <circle class="icon-snow-dot" cx="34" cy="50" r="2.6" fill="#dceeff"/>
      <circle class="icon-snow-dot" cx="44" cy="48" r="2.6" fill="#dceeff"/>
    </svg>
  `;
}

function mistIcon() {
  return `
    <svg viewBox="0 0 64 64" width="100%" height="100%">
      <line class="icon-mist-line" x1="12" y1="24" x2="52" y2="24" stroke="#dbe4f0" stroke-width="4" stroke-linecap="round"/>
      <line class="icon-mist-line" x1="12" y1="34" x2="52" y2="34" stroke="#dbe4f0" stroke-width="4" stroke-linecap="round"/>
      <line class="icon-mist-line" x1="12" y1="44" x2="52" y2="44" stroke="#dbe4f0" stroke-width="4" stroke-linecap="round"/>
    </svg>
  `;
}
// ---------- Helpers ----------
function convertTemp(celsius) {
  if (unit === "imperial") return Math.round((celsius * 9) / 5 + 32);
  return Math.round(celsius);
}

function formatTime(unixSeconds) {
  return new Date(unixSeconds * 1000).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
function getLocalTime(dt, timezoneOffsetSeconds) {
  const localMs = (dt + timezoneOffsetSeconds) * 1000;
  return new Date(localMs).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}
// ---------- Last updated timestamp ----------
let lastUpdatedAt = null;
const footerText = document.getElementById("footerText");

function updateFooterTimestamp() {
  if (!lastUpdatedAt) return;
  const minutesAgo = Math.floor((Date.now() - lastUpdatedAt) / 60000);
  const label = minutesAgo < 1 ? "just now" : `${minutesAgo} min ago`;
  footerText.textContent = `Data by OpenWeatherMap · Updated ${label}`;
}

setInterval(updateFooterTimestamp, 30000);
// ---------- Clear all recent searches ----------
const clearSearchesBtn = document.getElementById("clearSearchesBtn");
clearSearchesBtn.addEventListener("click", () => {
  recentSearches = [];
  localStorage.setItem("recentSearches", JSON.stringify(recentSearches));
  renderRecentSearches();
});
// ---------- Rendering: air quality ----------
function renderAirQuality(data) {
  const aqi = data.list[0].main.aqi; // 1 (Good) to 5 (Very Poor)
  const labels = {
    1: ["Good", "#4ade80"],
    2: ["Fair", "#a3e635"],
    3: ["Moderate", "#facc15"],
    4: ["Poor", "#fb923c"],
    5: ["Very Poor", "#ff6b6b"],
  };
  const [label, color] = labels[aqi] || ["Unknown", "#b9c6e0"];

  const existing = document.querySelector(".aqi-badge");
  if (existing) existing.remove();

  const card = document.querySelector(".weather-card");
  if (!card) return;

  const badge = document.createElement("div");
  badge.className = "aqi-badge";
  badge.innerHTML = `Air Quality: <strong style="color:${color}">${label}</strong>`;
  card.appendChild(badge);
}
// ---------- Auto-refresh ----------
setInterval(() => {
  if (!lastCurrentData) return;
  const { lat, lon } = lastCurrentData.coord;
  fetchByCoords(lat, lon);
}, 10 * 60 * 1000);