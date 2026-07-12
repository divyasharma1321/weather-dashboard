 // Settings Controller
class SettingsController {
    constructor() {
        this.unit = localStorage.getItem('weatherUnit') || 'metric';
        this.theme = localStorage.getItem('weatherTheme') || 'light';
        this.language = localStorage.getItem('weatherLanguage') || 'en';
    }

    initialize() {
        // Load saved settings
        this.applyTheme(this.theme);
        this.applyUnit(this.unit);
        
        // Setup event listeners
        document.querySelectorAll('.unit-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const unit = e.target.dataset.unit;
                this.applyUnit(unit);
                this.saveSettings();
            });
        });
        
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });
    }

    applyUnit(unit) {
        this.unit = unit;
        document.querySelectorAll('.unit-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.unit === unit);
        });
        
        // Update API unit
        if (window.weatherAPI) {
            window.weatherAPI.setUnits(unit);
        }
        
        // Update display
        this.updateAllTemperatures();
        localStorage.setItem('weatherUnit', unit);
    }

    updateAllTemperatures() {
        // Find all temperature displays and update them
        const tempElements = document.querySelectorAll('[data-temp]');
        tempElements.forEach(el => {
            const value = parseFloat(el.dataset.temp);
            if (!isNaN(value)) {
                const converted = Utils.convertTemperature(value, 'metric', this.unit);
                el.textContent = Math.round(converted);
                el.dataset.unit = this.unit;
            }
        });
        
        // Update unit symbols
        const symbol = this.unit === 'metric' ? '°C' : this.unit === 'imperial' ? '°F' : 'K';
        document.querySelectorAll('.unit-symbol').forEach(el => {
            el.textContent = symbol;
        });
    }

    toggleTheme() {
        const newTheme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
        this.saveSettings();
    }

    applyTheme(theme) {
        this.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        const icon = document.querySelector('#themeToggle i');
        if (icon) {
            icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        }
        localStorage.setItem('weatherTheme', theme);
    }

    saveSettings() {
        localStorage.setItem('weatherUnit', this.unit);
        localStorage.setItem('weatherTheme', this.theme);
        localStorage.setItem('weatherLanguage', this.language);
    }
}

// Initialize
const settings = new SettingsController();
settings.initialize();