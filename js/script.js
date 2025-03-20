// DOM Elements
const toggleChatbot = document.getElementById('toggle-chatbot');
const chatbotContainer = document.getElementById('chatbot-container');
const mapTutorial = document.getElementById('map-tutorial');
const closeTutorial = document.getElementById('close-tutorial');
const focusAreaButton = document.getElementById('focus-area');
const chatInput = document.getElementById('chat-input');
const charCount = document.getElementById('char-count');
const charCounter = document.querySelector('.char-counter');

// Toggle chatbot visibility
toggleChatbot.addEventListener('click', () => {
    chatbotContainer.classList.toggle('collapsed');
    toggleChatbot.classList.toggle('collapsed');
    
    // Change icon based on state
    if (chatbotContainer.classList.contains('collapsed')) {
        toggleChatbot.innerHTML = '<i class="fas fa-chevron-up"></i>';
    } else {
        toggleChatbot.innerHTML = '<i class="fas fa-chevron-down"></i>';
    }
});

// Close tutorial
closeTutorial.addEventListener('click', () => {
    mapTutorial.style.display = 'none';
    localStorage.setItem('mapTutorialClosed', 'true');
});

// Focus on drawn area
focusAreaButton.addEventListener('click', () => {
    if (window.drawnArea && window.drawnArea > 0) {
        try {
            map.fitBounds(draw.getBoundingBox());
            
            // Add a pulse effect to highlight the area
            const data = draw.getAll();
            if (data.features.length > 0) {
                // Flash effect on the drawn area
                const originalFillColor = draw.getAll().features[0].properties.fill;
                
                // Pulse animation
                let pulseCount = 0;
                const pulseInterval = setInterval(() => {
                    if (pulseCount % 2 === 0) {
                        draw.getAll().features[0].properties.fill = '#10b981';
                    } else {
                        draw.getAll().features[0].properties.fill = originalFillColor || '#2563eb';
                    }
                    draw.update(draw.getAll());
                    
                    pulseCount++;
                    if (pulseCount >= 6) {
                        clearInterval(pulseInterval);
                    }
                }, 300);
            }
        } catch (error) {
            console.error('Error focusing on area:', error);
        }
    } else {
        // If no area is drawn, show a message in the chatbot
        addMessage('bot', 'Please draw an area on the map first using the polygon tool <i class="fas fa-draw-polygon"></i>');
    }
});

// Auto-resize textarea
function autoResizeTextarea() {
    // Reset height to auto to get the correct scrollHeight
    chatInput.style.height = 'auto';
    
    // Set new height based on scrollHeight (with a max height)
    const newHeight = Math.min(chatInput.scrollHeight, 150);
    chatInput.style.height = `${newHeight}px`;
}

// Update character counter
function updateCharCounter() {
    const length = chatInput.value.length;
    charCount.textContent = length;
    
    // Update counter color based on length
    if (length > 400) {
        charCounter.classList.add('limit-near');
        if (length >= 500) {
            charCounter.classList.add('limit-reached');
        } else {
            charCounter.classList.remove('limit-reached');
        }
    } else {
        charCounter.classList.remove('limit-near', 'limit-reached');
    }
}

// Handle textarea input events
chatInput.addEventListener('input', () => {
    autoResizeTextarea();
    updateCharCounter();
});

// Reset textarea height on focus
chatInput.addEventListener('focus', autoResizeTextarea);

// Handle window resize
window.addEventListener('resize', () => {
    // Adjust map height on mobile
    if (window.innerWidth <= 768) {
        document.getElementById('map').style.height = '350px';
    } else {
        document.getElementById('map').style.height = '500px';
    }
    
    // Readjust textarea height
    autoResizeTextarea();
    
    // Ensure map redraws correctly after resize
    if (typeof map !== 'undefined' && map) {
        map.invalidateSize();
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check if tutorial should be shown
    if (localStorage.getItem('mapTutorialClosed')) {
        mapTutorial.style.display = 'none';
    } else {
        mapTutorial.style.display = 'block';
    }
    
    // Show welcome message or tutorial on first visit
    if (!localStorage.getItem('landSurveyingVisited')) {
        setTimeout(() => {
            if (typeof addMessage === 'function') {
                addMessage('bot', 'Welcome to the Land Surveying Project! You can use the interactive map to draw areas and I can help you understand land regulations. Try drawing a polygon on the map or ask me a question about land planning.');
                localStorage.setItem('landSurveyingVisited', 'true');
            }
        }, 1000);
    }
    
    // Add keyboard shortcut for sending messages
    document.addEventListener('keydown', (e) => {
        // If Enter is pressed and Shift is not held down
        if (e.key === 'Enter' && !e.shiftKey && document.activeElement === chatInput) {
            e.preventDefault();
            if (typeof sendMessage === 'function') {
                sendMessage();
            }
        }
    });
    
    // Add animation to map controls
    const mapControls = document.querySelectorAll('.map-controls button');
    mapControls.forEach(button => {
        button.addEventListener('mouseenter', () => {
            button.classList.add('hover-effect');
        });
        button.addEventListener('mouseleave', () => {
            button.classList.remove('hover-effect');
        });
    });
    
    // Initialize character counter
    updateCharCounter();
});

// Handle errors gracefully
window.addEventListener('error', (event) => {
    console.error('Application error:', event.error);
    // Could implement error reporting or recovery here
});

// Ensure drawing tools are visible and functional
document.addEventListener('DOMContentLoaded', function() {
    // Fix z-index issues with map controls and drawing tools
    setTimeout(function() {
        // Set high z-index for map controls
        const mapControls = document.querySelector('.map-controls');
        if (mapControls) {
            mapControls.style.zIndex = '1000';
        }
        
        // Set high z-index for drawing tools
        const drawingTools = document.querySelector('.drawing-tools');
        if (drawingTools) {
            drawingTools.style.zIndex = '1000';
        }
        
        // Set high z-index for Leaflet controls
        const leafletControls = document.querySelectorAll('.leaflet-control-container, .leaflet-draw, .leaflet-draw-toolbar');
        leafletControls.forEach(control => {
            if (control) {
                control.style.zIndex = '1000';
            }
        });
        
        // Check if tutorial should be hidden based on user preference
        if (localStorage.getItem('hideTutorial') === 'true') {
            const mapTutorial = document.getElementById('map-tutorial');
            if (mapTutorial) {
                mapTutorial.style.display = 'none';
            }
        }
        
        // Ensure delete drawings button is properly styled
        const deleteDrawingsBtn = document.getElementById('delete-drawings');
        if (deleteDrawingsBtn) {
            deleteDrawingsBtn.style.zIndex = '1000';
        }
        
        console.log("Drawing tools visibility fixed");
    }, 1000); // Delay to ensure map is fully loaded
});

// Feedback Form Functionality
document.addEventListener('DOMContentLoaded', function() {
    const feedbackForm = document.getElementById('feedback-form');
    const feedbackSuccess = document.getElementById('feedback-success');
    
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Basic form validation
            const name = document.getElementById('feedback-name').value.trim();
            const email = document.getElementById('feedback-email').value.trim();
            const subject = document.getElementById('feedback-subject').value.trim();
            const message = document.getElementById('feedback-message').value.trim();
            const phone = document.getElementById('feedback-phone').value.trim();
            const rating = document.querySelector('input[name="rating"]:checked');
            
            // Validate required fields
            if (!name || !email || !subject || !message) {
                showFormError('Please fill in all required fields');
                return;
            }
            
            // Validate email format
            if (!isValidEmail(email)) {
                showFormError('Please enter a valid email address');
                return;
            }
            
            // Validate phone if provided
            if (phone && !isValidPhone(phone)) {
                showFormError('Please enter a valid phone number');
                return;
            }
            
            // Prepare email body
            const emailBody = `
Name: ${name}
Email: ${email}
Phone: ${phone || 'Not provided'}
Subject: ${subject}
Rating: ${rating ? rating.value + ' stars' : 'Not rated'}

Message:
${message}
            `.trim();
            
            // Create mailto link
            const mailtoLink = `mailto:info.zaheerjk@gmail.com?subject=Feedback: ${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
            
            // Open email client
            window.location.href = mailtoLink;
            
            // Show success message
            feedbackForm.style.display = 'none';
            feedbackSuccess.classList.add('active');
            
            // Reset form after 5 seconds and show it again
            setTimeout(() => {
                feedbackForm.reset();
                feedbackForm.style.display = 'flex';
                feedbackSuccess.classList.remove('active');
            }, 5000);
        });
        
        // Reset button functionality
        const resetButton = document.getElementById('reset-feedback');
        if (resetButton) {
            resetButton.addEventListener('click', function() {
                clearFormErrors();
            });
        }
    }
    
    // Helper functions for form validation
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    function isValidPhone(phone) {
        // Basic phone validation - allows various formats
        const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
        return phoneRegex.test(phone);
    }
    
    function showFormError(message) {
        // Remove any existing error
        clearFormErrors();
        
        // Create error element
        const errorDiv = document.createElement('div');
        errorDiv.className = 'form-error';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        
        // Insert at the top of the form
        feedbackForm.insertBefore(errorDiv, feedbackForm.firstChild);
        
        // Scroll to error
        errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    function clearFormErrors() {
        const errors = feedbackForm.querySelectorAll('.form-error');
        errors.forEach(error => error.remove());
    }
});

// Add event listener for home button
document.getElementById('home-button').addEventListener('click', () => {
    window.location.href = 'index.html'; // Redirect to the homepage
});