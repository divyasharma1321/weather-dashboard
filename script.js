 // DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const weatherDisplay = document.getElementById('weatherDisplay');

// API Configuration
const API_KEY = 'YOUR_API_KEY'; // Get from OpenWeatherMap (free)
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

// Event Listeners
searchBtn.addEventListener('click', getWeather);
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        getWeather();
    }
});

// Main Function
async function getWeather() {
    const city = cityInput.value.trim();
    if (!city) {
        showError('Please enter a city name');
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}?q=${city}&appid=${API_KEY}&units=metric`);
        const data = await response.json();
        
        if (response.ok) {
            displayWeather(data);
        } else {
            showError('City not found. Please try again.');
        }
    } catch (error) {
        showError('Network error. Please check your connection.');
    }
}
function displayWeather(data) {
    const { name, main, weather, wind } = data;
    const icon = getWeatherIcon(weather[0].main);
    
    weatherDisplay.innerHTML = `
        <div class="weather-card">
            <div class="weather-icon">${icon}</div>
            <div class="temperature">${Math.round(main.temp)}°C</div>
            <div class="city-name">${name}</div>
            <div class="weather-description">${weather[0].description}</div>
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
}

function getWeatherIcon(condition) {
    const icons = {
        'Clear': '☀️',
        'Clouds': '☁️',
        'Rain': '🌧️',
        'Snow': '❄️',
        'Thunderstorm': '⛈️',
        'Drizzle': '🌦️',
        'Mist': '🌫️',
        'Smoke': '💨',
        'Haze': '🌫️',
        'Dust': '💨',
        'Fog': '🌫️'
    };
    return icons[condition] || '🌤️';
}

function showError(message) {
    weatherDisplay.innerHTML = `
        <div class="weather-card" style="color: #dc3545;">
            <h3>⚠️ ${message}</h3>
        </div>
    `;
}