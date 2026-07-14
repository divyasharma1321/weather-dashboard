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