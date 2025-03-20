// Dark Mode Toggle Implementation
document.addEventListener('DOMContentLoaded', function() {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    
    if (!darkModeToggle) {
        console.error('Dark mode toggle button not found!');
        return;
    }
    
    console.log('Dark mode toggle button found and event listener attached');
    
    // Function to toggle dark mode
    function toggleDarkMode() {
        console.log('Toggling dark mode');
        document.body.classList.toggle('dark-mode');
        
        // Save preference to localStorage
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkMode);
        
        // Update icon
        darkModeToggle.innerHTML = isDarkMode ? 
            '<i class="fas fa-sun"></i>' : 
            '<i class="fas fa-moon"></i>';
        
        // Update map style if map is available
        try {
            if (typeof map !== 'undefined' && map && map.getStyle) {
                const currentStyle = map.getStyle();
                const isSatellite = currentStyle && currentStyle.sprite && 
                                   currentStyle.sprite.includes('satellite');
                
                console.log('Map style update - Dark mode:', isDarkMode, 'Satellite:', isSatellite);
                
                if (isDarkMode) {
                    if (isSatellite) {
                        map.setStyle('mapbox://styles/mapbox/satellite-streets-v12');
                    } else {
                        map.setStyle('mapbox://styles/mapbox/dark-v11');
                    }
                } else {
                    if (isSatellite) {
                        map.setStyle('mapbox://styles/mapbox/satellite-streets-v12');
                    } else {
                        map.setStyle('mapbox://styles/mapbox/streets-v12');
                    }
                }
            } else {
                console.warn('Map or map.getStyle is not available');
            }
        } catch (error) {
            console.error('Error updating map style:', error);
        }
    }
    
    // Attach click event
    darkModeToggle.addEventListener('click', toggleDarkMode);
    
    // Check for saved dark mode preference
    if (localStorage.getItem('darkMode') === 'true') {
        // Apply dark mode
        document.body.classList.add('dark-mode');
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        
        // Set appropriate map style on load
        setTimeout(() => {
            try {
                if (typeof map !== 'undefined' && map && map.getStyle && 
                    map.getStyle().sprite && map.getStyle().sprite.includes('streets')) {
                    map.setStyle('mapbox://styles/mapbox/dark-v11');
                }
            } catch (error) {
                console.error('Error setting initial map style:', error);
            }
        }, 1000);
    }
}); 