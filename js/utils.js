// Add these methods to Utils class
static convertTemperature(value, fromUnit, toUnit) {
    if (fromUnit === toUnit) return value;
    
    // Convert to Celsius first
    let celsius;
    if (fromUnit === 'kelvin') {
        celsius = value - 273.15;
    } else if (fromUnit === 'imperial') {
        celsius = (value - 32) * 5/9;
    } else {
        celsius = value;
    }
    
    // Convert from Celsius to target
    if (toUnit === 'kelvin') {
        return celsius + 273.15;
    } else if (toUnit === 'imperial') {
        return (celsius * 9/5) + 32;
    } else {
        return celsius;
    }
}

static formatTemperature(value, unit) {
    const symbol = unit === 'metric' ? '°C' : unit === 'imperial' ? '°F' : 'K';
    const rounded = Math.round(value);
    return `${rounded}${symbol}`;
}