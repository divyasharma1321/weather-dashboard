// Add to UI class
initializeMap() {
    const map = new WeatherMap('mapCanvas');
    
    // Set map data when weather updates
    if (this.weatherData) {
        map.setData(this.weatherData);
    }
    
    // Layer buttons
    document.querySelectorAll('.map-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.map-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            map.changeLayer(e.target.dataset.layer);
        });
    });
}