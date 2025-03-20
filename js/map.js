// Initialize Mapbox
let mapStyle = 'satellite-streets-v12'; // Default style
let drawnArea = 0;

// Initialize map
const map = new mapboxgl.Map({
    container: 'map',
    style: `mapbox://styles/mapbox/${mapStyle}`,
    center: CONFIG.MAP_CENTER,
    zoom: CONFIG.MAP_ZOOM,
    accessToken: CONFIG.MAPBOX_ACCESS_TOKEN
});

// Add navigation controls
map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

// Initialize drawing tools
const draw = new MapboxDraw({
    displayControlsDefault: false,
    controls: {
        polygon: true,
        trash: true
    },
    styles: [
        {
            'id': 'gl-draw-polygon-fill',
            'type': 'fill',
            'filter': ['all', ['==', '$type', 'Polygon']],
            'paint': {
                'fill-color': '#2563eb',
                'fill-outline-color': '#2563eb',
                'fill-opacity': 0.2
            }
        },
        {
            'id': 'gl-draw-polygon-stroke',
            'type': 'line',
            'filter': ['all', ['==', '$type', 'Polygon']],
            'paint': {
                'line-color': '#2563eb',
                'line-width': 2
            }
        },
        {
            'id': 'gl-draw-point',
            'type': 'circle',
            'filter': ['all', ['==', '$type', 'Point']],
            'paint': {
                'circle-radius': 5,
                'circle-color': '#2563eb'
            }
        }
    ]
});

// Map event listeners
map.on('load', () => {
    // Add initial marker for village center
    new mapboxgl.Marker({
        color: '#ef4444'
    })
        .setLngLat(CONFIG.MAP_CENTER)
        .setPopup(
            new mapboxgl.Popup({ offset: 25 })
                .setHTML('<h3>Village Center</h3><p>Central area of the village</p>')
        )
        .addTo(map);
});

// Add the drawing tools to the map
map.addControl(draw);

// Update area measurement when a polygon is drawn or updated
map.on('draw.create', updateArea);
map.on('draw.delete', updateArea);
map.on('draw.update', updateArea);

// Update coordinates display as mouse moves
map.on('mousemove', (e) => {
    document.getElementById('coordinates').textContent = 
        `Coordinates: ${e.lngLat.lng.toFixed(4)}, ${e.lngLat.lat.toFixed(4)}`;
});

// Calculate the area of the drawn polygon
function updateArea(e) {
    const data = draw.getAll();
    if (data.features.length > 0) {
        const area = turf.area(data);
        drawnArea = Math.round(area * 100) / 100;
        document.getElementById('area-size').textContent = `Area: ${drawnArea} sq.m`;
        
        // Send area information to chatbot
        updateChatbotWithAreaInfo(drawnArea);
    } else {
        document.getElementById('area-size').textContent = 'Area: --- sq.m';
    }
}

// Update chatbot with area information
function updateChatbotWithAreaInfo(area) {
    // Only add this message if not already present
    const messages = document.getElementById('chat-messages');
    if (!messages.innerHTML.includes('You have drawn an area')) {
        addMessage('bot', `I notice you have drawn an area of ${area} sq.m. Would you like some information about land regulations for this size of plot?`);
    }
}

// Toggle map view
document.getElementById('satellite-view').addEventListener('click', () => {
    map.setStyle('mapbox://styles/mapbox/satellite-streets-v12');
    document.getElementById('satellite-view').classList.add('active');
    document.getElementById('street-view').classList.remove('active');
});

document.getElementById('street-view').addEventListener('click', () => {
    map.setStyle('mapbox://styles/mapbox/streets-v12');
    document.getElementById('street-view').classList.add('active');
    document.getElementById('satellite-view').classList.remove('active');
});

// Custom map controls
document.getElementById('zoom-in').addEventListener('click', () => {
    map.zoomIn();
});

document.getElementById('zoom-out').addEventListener('click', () => {
    map.zoomOut();
});

document.getElementById('reset-map').addEventListener('click', () => {
    map.flyTo({
        center: CONFIG.MAP_CENTER,
        zoom: CONFIG.MAP_ZOOM,
        essential: true
    });
});

document.getElementById('draw-area').addEventListener('click', () => {
    draw.changeMode('draw_polygon');
});