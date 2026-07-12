// ==================== DOM Elements ====================
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const weatherDisplay = document.getElementById("weatherDisplay");
const clearBtn = document.getElementById("clearBtn");

// ==================== API ====================
const API_KEY = "YOUR_API_KEY"; // Replace with your OpenWeatherMap API key
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

// ==================== Local Storage ====================
let recentSearches =
  JSON.parse(localStorage.getItem("recentSearches")) || [];

// ==================== Event Listeners ====================
searchBtn.addEventListener("click", getWeather);

cityInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    getWeather();
  }
});

clearBtn.addEventListener("click", () => {
  weatherDisplay.innerHTML = "";
  cityInput.value = "";
  clearBtn.style.display = "none";
});

// ==================== Loading ====================
function showLoading() {
  weatherDisplay.innerHTML = `
        <div class="weather-card">
            <h3>🔄 Loading weather data...</h3>
        </div>
    `;
}

// ==================== Main Function ====================
async function getWeather() {
  const city = cityInput.value.trim();

  if (!city) {
    showError("Please enter a city name");
    return;
  }

  showLoading();

  try {
    const response = await fetch(
      `${BASE_URL}?q=${city}&appid=${API_KEY}&units=metric`
    );

    const data = await response.json();

    if (response.ok) {
      displayWeather(data);
      saveSearch(city);
    } else {
      showError("City not found.");
    }
  } catch (error) {
    showError("Network Error. Please check your connection.");
  }
}

// ==================== Display Weather ====================
function displayWeather(data) {
  const { name, main, weather, wind } = data;

  const icon = getWeatherIcon(weather[0].main);

  weatherDisplay.innerHTML = `
        <div class="weather-card">
            <div class="weather-icon">${icon}</div>

            <div class="temperature">
                ${Math.round(main.temp)}°C
            </div>

            <div class="city-name">
                ${name}
            </div>

            <div class="weather-description">
                ${weather[0].description}
            </div>

            <div class="details">

                <div class="detail-item">
                    <span>💧 Humidity</span>
                    <strong>${main.humidity}%</strong>
                </div>

                <div class="detail-item">
                    <span>💨 Wind</span>
                    <strong>${Math.round(wind.speed)} km/h</strong>
                </div>

                <div class="detail-item">
                    <span>🌡️ Feels Like</span>
                    <strong>${Math.round(main.feels_like)}°C</strong>
                </div>

            </div>
        </div>
    `;

  clearBtn.style.display = "inline-block";

  displayRecentSearches();
}

// ==================== Weather Icons ====================
function getWeatherIcon(condition) {
  const icons = {
    Clear: "☀️",
    Clouds: "☁️",
    Rain: "🌧️",
    Snow: "❄️",
    Thunderstorm: "⛈️",
    Drizzle: "🌦️",
    Mist: "🌫️",
    Smoke: "💨",
    Haze: "🌫️",
    Dust: "💨",
    Fog: "🌫️",
  };

  return icons[condition] || "🌤️";
}

// ==================== Error ====================
function showError(message) {
  weatherDisplay.innerHTML = `
        <div class="weather-card" style="color:red;">
            <h3>⚠️ ${message}</h3>
        </div>
    `;
}

// ==================== Recent Searches ====================
function saveSearch(city) {
  city = city.trim();

  if (!recentSearches.includes(city)) {
    recentSearches.unshift(city);

    if (recentSearches.length > 5) {
      recentSearches.pop();
    }

    localStorage.setItem(
      "recentSearches",
      JSON.stringify(recentSearches)
    );
  }

  displayRecentSearches();
}

function displayRecentSearches() {
  let container = document.getElementById("recentSearches");

  if (!container) return;

  container.innerHTML = "";

  recentSearches.forEach((city) => {
    const btn = document.createElement("button");

    btn.textContent = city;

    btn.onclick = () => {
      cityInput.value = city;
      getWeather();
    };

    container.appendChild(btn);
  });
}
// Initialize history
const weatherHistory = new WeatherHistory();

// Update in getWeather function
async function getWeather() {
    // ... existing code ...
    const data = await response.json();
    
    // Save to history
    weatherHistory.add(data);
    weatherHistory.render();
    
    // ... rest of code ...
}

// Clear history
document.getElementById('clearHistory')?.addEventListener('click', () => {
    if (confirm('Clear all search history?')) {
        weatherHistory.clear();
    }
});

// Load history on page load
window.addEventListener('DOMContentLoaded', () => {
    weatherHistory.render();
});