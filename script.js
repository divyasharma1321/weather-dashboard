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