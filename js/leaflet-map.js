// Initialize Leaflet Map
let map;
let drawnItems;
let drawnArea = 0;
let layersControl;
let defaultCenter = [17.3297, 76.8343]; // Kalaburagi (Gulbarga), Karnataka
let defaultZoom = 13;

// Base layers
let osmLayer, satelliteLayer, hybridLayer, colorfulLayer;

// Additional layers
let buildingsLayer, roadsLayer, waterLayer, terrainLayer, boundariesLayer;

// Active drawing tool
let activeDrawingTool = null;

// Location data with population and development info
const locationData = {
    "Kalaburagi City": {
        population: "~700,000",
        famousFor: "Historical monuments, educational institutions, Sharanabasaveshwara Temple",
        developmentNeeds: "Infrastructure improvement, industrial development, tourism promotion"
    },
    "Shahabad": {
        population: "~55,000",
        famousFor: "Cement industry, historical fort",
        developmentNeeds: "Industrial expansion, heritage conservation"
    },
    "Sedam": {
        population: "~35,000",
        famousFor: "Cement factories, limestone quarries",
        developmentNeeds: "Environmental protection, sustainable mining practices"
    },
    "Afzalpur": {
        population: "~40,000",
        famousFor: "Agricultural market, religious sites",
        developmentNeeds: "Agricultural infrastructure, irrigation facilities"
    },
    "Aland": {
        population: "~42,000",
        famousFor: "Border town, agricultural trade",
        developmentNeeds: "Cross-border trade facilities, market infrastructure"
    },
    "Chincholi": {
        population: "~30,000",
        famousFor: "Wildlife sanctuary, forests",
        developmentNeeds: "Eco-tourism, wildlife conservation"
    },
    "Chittapur": {
        population: "~38,000",
        famousFor: "Agricultural center, rural economy",
        developmentNeeds: "Rural infrastructure, agricultural processing units"
    },
    "Jewargi": {
        population: "~25,000",
        famousFor: "Agricultural lands, rural culture",
        developmentNeeds: "Irrigation projects, rural connectivity"
    },
    "Bidar": {
        population: "~220,000",
        famousFor: "Bidar Fort, historical monuments, Bidriware craft",
        developmentNeeds: "Heritage tourism, craft promotion, urban infrastructure"
    },
    "Yadgir": {
        population: "~70,000",
        famousFor: "Agricultural center, historical sites",
        developmentNeeds: "Agricultural modernization, rural infrastructure"
    }
};

// Initialize map when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    setupEventListeners();
});

// Initialize the Leaflet map
function initMap() {
    // Create map
    map = L.map('map', {
        zoomControl: false,
        maxZoom: 28,
        minZoom: 1,
        zoomSnap: 0.5,
        zoomDelta: 0.5,
        drawControl: false // Disable default draw control
    }).setView(defaultCenter, defaultZoom);

    // Add base layers
    osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    });

    satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 20
    }).addTo(map);

    hybridLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        attribution: 'Map data © Google',
        maxZoom: 20
    });
    
    // Create colorful layer
    colorfulLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    });

    // Add new map layers
    terrainLayer = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.{ext}', {
        attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: 'abcd',
        minZoom: 0,
        maxZoom: 18,
        ext: 'png',
        opacity: 0.6
    });

    // Add dark mode layer
    darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    });

    // Add topographic layer
    topoLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
        maxZoom: 17
    });

    // Add transportation layer
    transportLayer = L.tileLayer('https://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=6170aad10dfd42a38d4d8c709a536f38', {
        attribution: '© OpenStreetMap contributors, © Thunderforest',
        maxZoom: 19
    });

    // Initialize additional layers
    initAdditionalLayers();

    // Initialize drawing tools
    initDrawingTools();

    // Update map mode buttons
    updateMapModeButtons('satellite-view');
    
    // Make sure controls are above map layers
    document.querySelector('.map-controls').style.zIndex = '1000';
}

// Initialize additional map layers
function initAdditionalLayers() {
    // Buildings layer (from OpenStreetMap)
    buildingsLayer = L.tileLayer('https://{s}.data.osmbuildings.org/0.2/anonymous/tile/{z}/{x}/{y}.png', {
        attribution: '© OSM Buildings',
        maxZoom: 19,
        opacity: 0.7
    });

    // Roads layer (from Thunderforest)
    roadsLayer = L.tileLayer('https://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=6170aad10dfd42a38d4d8c709a536f38', {
        attribution: '© OpenStreetMap contributors, © Thunderforest',
        maxZoom: 19,
        opacity: 0.7
    });

    // Water layer (from Stamen)
    waterLayer = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.{ext}', {
        attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: 'abcd',
        minZoom: 1,
        maxZoom: 16,
        ext: 'jpg',
        opacity: 0.5
    });

    // Administrative boundaries layer
    boundariesLayer = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lines/{z}/{x}/{y}{r}.{ext}', {
        attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: 'abcd',
        minZoom: 0,
        maxZoom: 20,
        ext: 'png',
        opacity: 0.4
    });
}

// Initialize drawing tools
function initDrawingTools() {
    // Initialize FeatureGroup to store editable layers
    drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    // Initialize draw control with proper options
    const drawControl = new L.Control.Draw({
        position: 'topright',
        draw: {
            polyline: false,
            rectangle: {
                shapeOptions: {
                    color: '#2563eb',
                    weight: 3
                }
            },
            circle: {
                shapeOptions: {
                    color: '#2563eb',
                    weight: 3
                }
            },
            circlemarker: false,
            marker: true,
            polygon: {
                allowIntersection: false,
                drawError: {
                    color: '#e1e100',
                    message: '<strong>Error:</strong> Polygon edges cannot cross!'
                },
                shapeOptions: {
                    color: '#2563eb',
                    weight: 3
                }
            }
        },
        edit: {
            featureGroup: drawnItems,
            remove: true
        }
    });

    // Add draw control to map but hide it (we'll use our custom buttons)
    map.addControl(drawControl);
    
    // Hide the default Leaflet draw control but ensure it's accessible
    const leafletDrawElement = document.querySelector('.leaflet-draw');
    if (leafletDrawElement) {
        leafletDrawElement.style.display = 'none';
        leafletDrawElement.style.zIndex = '1000';
    }

    // Handle draw events
    map.on('draw:created', function(e) {
        let layer = e.layer;
        drawnItems.addLayer(layer);
        
        // Calculate area
        const area = calculateArea(layer);
        updateAreaDisplay(area);
        
        // Store area globally for access by other scripts
        window.drawnArea = area;
        
        // Detect if the area is over water
        const waterInfo = detectWaterBody(layer);
        if (waterInfo) {
            // Add water-specific styling
            layer.setStyle({
                color: '#2563eb',
                fillColor: '#3b82f6',
                fillOpacity: 0.3,
                weight: 2,
                dashArray: '5, 5'
            });
            
            // Add water info to the layer
            layer.waterInfo = waterInfo;
        }
        
        // Notify chatbot with water information if applicable
        if (typeof updateChatbotWithAreaInfo === 'function') {
            updateChatbotWithAreaInfo(area, waterInfo);
        }
        
        // Reset active drawing tool after drawing is complete
        document.querySelectorAll('.drawing-tools button').forEach(btn => {
            btn.classList.remove('active');
        });
        activeDrawingTool = null;
    });

    map.on('draw:edited', function(e) {
        let layers = e.layers;
        layers.eachLayer(function(layer) {
            // Calculate area
            const area = calculateArea(layer);
            updateAreaDisplay(area);
            
            // Store area globally for access by other scripts
            window.drawnArea = area;
            
            // Detect if the area is over water
            const waterInfo = detectWaterBody(layer);
            if (waterInfo) {
                // Add water-specific styling
                layer.setStyle({
                    color: '#2563eb',
                    fillColor: '#3b82f6',
                    fillOpacity: 0.3,
                    weight: 2,
                    dashArray: '5, 5'
                });
                
                // Add water info to the layer
                layer.waterInfo = waterInfo;
            }
            
            // Notify chatbot with water information if applicable
            if (typeof updateChatbotWithAreaInfo === 'function') {
                updateChatbotWithAreaInfo(area, waterInfo);
            }
        });
    });

    map.on('draw:deleted', function(e) {
        // Reset area display
        updateAreaDisplay(0);
        
        // Reset global area
        window.drawnArea = 0;
        
        // Reset coordinates display
        document.getElementById('coordinates').textContent = "Coordinates: ---, ---";
    });
    
    // Ensure drawing tools are visible
    const drawingTools = document.querySelector('.drawing-tools');
    if (drawingTools) {
        drawingTools.style.zIndex = '1000';
    }
}

// Calculate area function
function calculateArea(layer) {
    if (layer instanceof L.Polygon) {
        const latlngs = layer.getLatLngs()[0];
        const area = L.GeometryUtil.geodesicArea(latlngs);
        return Math.round(area);
    } else if (layer instanceof L.Circle) {
        const radius = layer.getRadius();
        const area = Math.PI * radius * radius;
        return Math.round(area);
    } else if (layer instanceof L.Marker) {
        // Markers don't have area, but we can add popup functionality
        const latlng = layer.getLatLng();
        layer.bindPopup(`
            <div class="location-popup">
                <h3>Custom Marker</h3>
                <p>Coordinates: ${latlng.lng.toFixed(4)}, ${latlng.lat.toFixed(4)}</p>
                <p>Add your notes here...</p>
            </div>
        `).openPopup();
        return 0;
    }
    return 0;
}

// Update area display
function updateAreaDisplay(area) {
    document.getElementById('area-size').textContent = `Area: ${area} sq.m`;
}

// Set up event listeners for map controls
function setupEventListeners() {
    // Map mode buttons
    document.getElementById('satellite-view').addEventListener('click', () => setMapMode('satellite'));
    document.getElementById('street-view').addEventListener('click', () => setMapMode('street'));
    document.getElementById('hybrid-view').addEventListener('click', () => setMapMode('hybrid'));
    document.getElementById('colorful-view').addEventListener('click', () => setMapMode('colorful'));
    document.getElementById('topo-view').addEventListener('click', () => setMapMode('topo'));
    document.getElementById('transport-view').addEventListener('click', () => setMapMode('transport'));

    // Zoom controls
    document.getElementById('zoom-in').addEventListener('click', function() {
        map.zoomIn(1);
        this.classList.add('hover-effect');
        setTimeout(() => {
            this.classList.remove('hover-effect');
        }, 300);
    });

    document.getElementById('zoom-out').addEventListener('click', function() {
        map.zoomOut(1);
        this.classList.add('hover-effect');
        setTimeout(() => {
            this.classList.remove('hover-effect');
        }, 300);
    });

    // Reset map
    document.getElementById('reset-map').addEventListener('click', function() {
        map.setView(defaultCenter, defaultZoom);
    });

    // Drawing tools
    document.getElementById('draw-area').addEventListener('click', function() {
        activateDrawingTool('polygon', this);
    });
    
    document.getElementById('draw-rectangle').addEventListener('click', function() {
        activateDrawingTool('rectangle', this);
    });
    
    document.getElementById('draw-circle').addEventListener('click', function() {
        activateDrawingTool('circle', this);
    });
    
    document.getElementById('draw-marker').addEventListener('click', function() {
        activateDrawingTool('marker', this);
    });
    
    // Delete all drawings
    document.getElementById('delete-drawings').addEventListener('click', function() {
        // Clear all drawn items
        drawnItems.clearLayers();
        
        // Reset area display
        updateAreaDisplay(0);
        drawnArea = 0;
        
        // Add visual feedback
        this.classList.add('hover-effect');
        setTimeout(() => {
            this.classList.remove('hover-effect');
        }, 300);
        
        // Show confirmation message in chatbot if available
        if (typeof addMessage === 'function') {
            addMessage('bot', 'All drawings have been cleared from the map.');
        }
    });

    // Focus on drawn area
    document.getElementById('focus-area').addEventListener('click', function() {
        if (drawnItems.getLayers().length > 0) {
            map.fitBounds(drawnItems.getBounds());
        } else {
            // If no area is drawn, show a message in the chatbot
            if (typeof addMessage === 'function') {
                addMessage('bot', 'Please draw an area on the map first using the polygon tool <i class="fas fa-draw-polygon"></i>');
            }
        }
    });

    // City selector
    document.getElementById('city-select').addEventListener('change', function() {
        const value = this.value;
        if (value) {
            const [lat, lng, zoom] = value.split(',');
            const selectedLocation = this.options[this.selectedIndex].text;
            
            // Set view to selected location
            map.setView([parseFloat(lat), parseFloat(lng)], parseInt(zoom));
            
            // Show popup with location information
            showLocationPopup(parseFloat(lat), parseFloat(lng), selectedLocation);
        }
    });

    // Toggle layers panel
    document.getElementById('toggle-layers').addEventListener('click', function() {
        const layersPanel = document.getElementById('layers-panel');
        layersPanel.classList.toggle('active');
    });

    // Close layers panel
    document.getElementById('close-layers').addEventListener('click', function() {
        document.getElementById('layers-panel').classList.remove('active');
    });

    // Add layer toggle event listeners
    document.getElementById('layer-buildings').addEventListener('change', function() {
        toggleLayer(this.checked, buildingsLayer, 'buildings');
    });
    
    document.getElementById('layer-roads').addEventListener('change', function() {
        toggleLayer(this.checked, roadsLayer, 'roads');
    });
    
    document.getElementById('layer-water').addEventListener('change', function() {
        toggleLayer(this.checked, waterLayer, 'water');
    });
    
    document.getElementById('layer-terrain').addEventListener('change', function() {
        toggleLayer(this.checked, terrainLayer, 'terrain');
    });
    
    document.getElementById('layer-boundaries').addEventListener('change', function() {
        toggleLayer(this.checked, boundariesLayer, 'boundaries');
    });

    // Update coordinates on mouse move
    map.on('mousemove', function(e) {
        document.getElementById('coordinates').textContent = 
            `Coordinates: ${e.latlng.lng.toFixed(4)}, ${e.latlng.lat.toFixed(4)}`;
    });

    // Tutorial controls
    document.getElementById('close-tutorial').addEventListener('click', function() {
        document.getElementById('map-tutorial').style.display = 'none';
    });
    
    document.getElementById('hide-tutorial-permanently').addEventListener('click', function() {
        document.getElementById('map-tutorial').style.display = 'none';
        // Save preference in localStorage
        localStorage.setItem('hideTutorial', 'true');
    });
    
    // Check if tutorial should be hidden based on user preference
    if (localStorage.getItem('hideTutorial') === 'true') {
        document.getElementById('map-tutorial').style.display = 'none';
    }
}

// Activate drawing tool
function activateDrawingTool(tool, buttonElement) {
    console.log("Activating drawing tool:", tool); // Debug log
    
    // Remove active class from all drawing buttons
    document.querySelectorAll('.drawing-tools button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // If the same tool is clicked again, deactivate it
    if (activeDrawingTool === tool) {
        console.log("Deactivating tool:", tool); // Debug log
        activeDrawingTool = null;
        
        // Disable any active drawing handlers
        if (map._handler) {
            map._handler.disable();
        }
        
        return;
    }
    
    // Add active class to clicked button
    buttonElement.classList.add('active');
    activeDrawingTool = tool;
    
    // Disable any active drawing handlers
    if (map._handler) {
        map._handler.disable();
    }
    
    // Bring drawing tools to front
    document.querySelector('.map-controls').style.zIndex = '1000';
    
    // Activate the selected drawing tool
    let drawingTool;
    
    switch (tool) {
        case 'polygon':
            drawingTool = new L.Draw.Polygon(map, {
                shapeOptions: {
                    color: '#2563eb',
                    weight: 3
                }
            });
            break;
        case 'rectangle':
            drawingTool = new L.Draw.Rectangle(map, {
                shapeOptions: {
                    color: '#2563eb',
                    weight: 3
                }
            });
            break;
        case 'circle':
            drawingTool = new L.Draw.Circle(map, {
                shapeOptions: {
                    color: '#2563eb',
                    weight: 3
                }
            });
            break;
        case 'marker':
            drawingTool = new L.Draw.Marker(map);
            break;
    }
    
    if (drawingTool) {
        console.log("Enabling drawing tool"); // Debug log
        drawingTool.enable();
        
        // Ensure Leaflet draw controls are visible
        const leafletDrawElement = document.querySelector('.leaflet-draw');
        if (leafletDrawElement) {
            leafletDrawElement.style.zIndex = '1000';
        }
        
        // Ensure all Leaflet controls are visible
        document.querySelectorAll('.leaflet-control-container, .leaflet-draw-section').forEach(el => {
            el.style.zIndex = '1000';
        });
    }
}

// Toggle layer visibility
function toggleLayer(isChecked, layer, layerName) {
    if (isChecked) {
        layer.addTo(map);
    } else {
        map.removeLayer(layer);
    }
    
    // Notify chatbot about layer changes
    if (typeof window.updateChatbotWithLayerInfo === 'function') {
        window.updateChatbotWithLayerInfo(layerName, isChecked);
    }
}

// Set map mode (satellite, street, hybrid, colorful)
function setMapMode(mode) {
    // Remove all base layers
    map.removeLayer(osmLayer);
    map.removeLayer(satelliteLayer);
    map.removeLayer(hybridLayer);
    map.removeLayer(colorfulLayer);
    map.removeLayer(terrainLayer);
    map.removeLayer(darkLayer);
    map.removeLayer(topoLayer);
    map.removeLayer(transportLayer);

    // Add selected base layer
    switch (mode) {
        case 'satellite':
            map.addLayer(satelliteLayer);
            break;
        case 'street':
            map.addLayer(osmLayer);
            break;
        case 'hybrid':
            map.addLayer(hybridLayer);
            break;
        case 'colorful':
            map.addLayer(colorfulLayer);
            break;
        case 'topo':
            map.addLayer(topoLayer);
            break;
        case 'transport':
            map.addLayer(transportLayer);
            break;
        default:
            map.addLayer(satelliteLayer);
    }
}

// Update map mode buttons
function updateMapModeButtons(activeMode) {
    const buttons = {
        'satellite-view': 'satellite',
        'street-view': 'street',
        'hybrid-view': 'hybrid',
        'colorful-view': 'colorful',
        'topo-view': 'topo',
        'transport-view': 'transport'
    };

    Object.entries(buttons).forEach(([buttonId, mode]) => {
        const button = document.getElementById(buttonId);
        if (button) {
            if (mode === activeMode) {
                button.classList.add('active');
            } else {
        button.classList.remove('active');
            }
        }
    });
}

// Show popup with location information
function showLocationPopup(lat, lng, locationName) {
    // Clear any existing popups
    map.closePopup();
    
    // Get location data
    const locationInfo = locationData[locationName.split(',')[0]] || {};
    
    // Create popup content
    let popupContent = `
        <div class="location-popup">
            <h3>${locationName}</h3>
            <p>Coordinates: ${lng.toFixed(4)}, ${lat.toFixed(4)}</p>
    `;
    
    // Add population data if available
    if (locationInfo.population) {
        popupContent += `<p><strong>Population:</strong> ${locationInfo.population}</p>`;
    }
    
    // Add famous for information if available
    if (locationInfo.famousFor) {
        popupContent += `<p><strong>Known for:</strong> ${locationInfo.famousFor}</p>`;
    }
    
    // Add development needs if available
    if (locationInfo.developmentNeeds) {
        popupContent += `<p><strong>Development needs:</strong> ${locationInfo.developmentNeeds}</p>`;
    }
    
    popupContent += `</div>`;
    
    // Create and open popup
    L.popup()
        .setLatLng([lat, lng])
        .setContent(popupContent)
        .openOn(map);
}

// Add water detection functionality
function detectWaterBody(layer) {
    if (!layer) return null;
    
    // Get the bounds of the drawn area
    const bounds = layer.getBounds();
    const center = bounds.getCenter();
    
    // Check if water layer is active
    const waterLayerActive = document.getElementById('layer-water')?.checked;
    
    if (waterLayerActive) {
        // Simulate water detection based on coordinates
        // In a real implementation, this would use actual water body data
        const isOverWater = Math.random() > 0.3; // Simulating water detection
        
        if (isOverWater) {
            return {
                type: Math.random() > 0.5 ? 'sea' : 'lake',
                depth: Math.random() > 0.7 ? 'deep' : 'shallow',
                hasExistingStructures: Math.random() > 0.8,
                environmentalSensitivity: Math.random() > 0.6 ? 'high' : 'moderate'
            };
        }
    }
    
    return null;
}

// Add function to detect nearest highway
function detectNearestHighway(layer) {
    if (!layer) return null;
    
    // Get the center point of the drawn area
    const bounds = layer.getBounds();
    const center = bounds.getCenter();
    
    // Check if roads layer is active
    const roadsLayerActive = document.getElementById('layer-roads')?.checked;
    
    if (roadsLayerActive) {
        // Simulate highway detection based on coordinates
        // In a real implementation, this would use actual highway data
        const hasNearbyHighway = Math.random() > 0.3; // Simulating highway detection
        
        if (hasNearbyHighway) {
            // Simulate distance to highway (in meters)
            const distance = Math.floor(Math.random() * 5000) + 500; // Between 500m and 5.5km
            
            return {
                distance: distance,
                type: Math.random() > 0.5 ? 'National Highway' : 'State Highway',
                direction: ['North', 'South', 'East', 'West'][Math.floor(Math.random() * 4)],
                accessType: Math.random() > 0.7 ? 'Direct Access' : 'Requires Connecting Road'
            };
        }
    }
    
    return null;
}

// Update the updateChatbotWithAreaInfo function
function updateChatbotWithAreaInfo(area, waterInfo) {
    // Only add this message if not already present
    const messages = document.getElementById('chat-messages');
    if (!messages.innerHTML.includes('You have drawn an area')) {
        let message = `I notice you have drawn an area of ${area} sq.m. `;
        
        // Get highway information
        const highwayInfo = detectNearestHighway(drawnItems.getLayers()[0]);
        
        if (waterInfo) {
            message += `This area appears to be over ${waterInfo.type === 'sea' ? 'sea' : 'a water body'}. `;
            message += `Would you like information about development possibilities for this water area?`;
        } else {
            message += `Would you like some information about land regulations for this size of plot?`;
            
            // Add highway information if available
            if (highwayInfo) {
                message += `\n\nI've detected a ${highwayInfo.type} approximately ${highwayInfo.distance} meters to the ${highwayInfo.direction} of your selected area. `;
                message += `This ${highwayInfo.accessType.toLowerCase()}.`;
            }
        }
        
        addMessage('bot', message);
    }
}

// Make functions available globally
window.drawnArea = drawnArea;
window.map = map; 