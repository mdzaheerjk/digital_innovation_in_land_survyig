// Initialize chatbot elements
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');
const sendMessageButton = document.getElementById('send-message');

// Gemini API Configuration
const GEMINI_API_KEY = 'AIzaSyAbtEr7XCgdMzjGKrmqLPvEr5_uY9Y04_4';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

// Conversation history to maintain context
let conversationHistory = [];

// Custom context for land surveying project
const CHATBOT_CONTEXT = `
You are an AI assistant specializing in land surveying and rural planning.
You help users understand:
- Land regulations and zoning laws
- Property boundary issues
- Rural land development guidelines
- Optimal land usage for agriculture and construction
- Environmental considerations for rural planning

Keep responses concise but informative. If the user mentions a specific area size,
provide relevant information about what can typically be built on that size of land
according to common rural development guidelines.

When responding about land areas, include specific measurements in square meters (sq.m).
Format important information in bold using markdown syntax (**bold text**).
Use bullet points for lists of recommendations.

Respond in a conversational, helpful tone similar to ChatGPT. Be engaging and personable.
If you don't know something, admit it rather than making up information.
`;

// Suggested questions for quick access
const SUGGESTED_QUESTIONS = [
    "What can I build on 500 sq.m of rural land?",
    "What are common zoning regulations?",
    "How do I measure property boundaries?",
    "What environmental factors should I consider?",
    "What's the minimum land size for a residential building?",
    "How do I calculate the value of my land?",
    "What permits do I need for rural construction?"
];

// Add initial bot message and suggested questions
document.addEventListener('DOMContentLoaded', () => {
    // Initial message is now in HTML
    setTimeout(() => {
        addSuggestedQuestions();
    }, 1500);
});

// Send message function
async function sendMessage() {
    const chatInput = document.getElementById('chat-input');
    const message = chatInput.value.trim();

    if (message === '') return;

    // Add user message to chat
    addMessage('user', message);
    
    // Clear input and reset height
        chatInput.value = '';
    chatInput.style.height = 'auto';
    
    // Get the current drawing context if available
    const hasDrawnArea = document.querySelector('.leaflet-interactive') !== null;
    
    // Show loading indicator
        showLoadingIndicator();
    
    // Get response from API
    try {
        // If there's a drawn area, include that context
        let botResponse;
        if (hasDrawnArea && message.toLowerCase().includes('area') || 
            message.toLowerCase().includes('land') || 
            message.toLowerCase().includes('development') ||
            message.toLowerCase().includes('agriculture') ||
            message.toLowerCase().includes('build')) {
            
            // Get current area analysis
            const landAnalysis = analyzeLandType();
            botResponse = await getGeminiResponse(message, landAnalysis);
        } else {
            botResponse = await getGeminiResponse(message);
        }
        
        // Add bot response to chat
        addMessage('bot', botResponse);
        
        // Check if we should offer suggestions
        if (Math.random() > 0.7) {
            addSuggestedQuestions();
        }
    } catch (error) {
        console.error('Error getting response:', error);
        addMessage('bot', "I'm sorry, I encountered an error. Please try again.");
    }
    
    // Hide loading indicator
    hideLoadingIndicator();
    
    // Scroll to bottom of chat
    const chatWindow = document.getElementById('chat-window');
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Add message to chat window with streaming effect for bot messages
function addMessage(sender, message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender);
    
    if (sender === 'bot') {
        // Add typing animation initially
        messageElement.classList.add('typing');
        messageElement.textContent = '';
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Process markdown-like formatting
        const formattedMessage = formatBotMessage(message);
        
        // Simulate streaming effect for bot messages
        streamBotMessage(messageElement, message, formattedMessage);
        
        // Add to conversation history
        conversationHistory.push({
            role: 'assistant',
            content: message
        });
        
        // Limit conversation history to last 10 messages to avoid token limits
        if (conversationHistory.length > 10) {
            conversationHistory = conversationHistory.slice(-10);
        }
        
        // If it's a bot message about land area, trigger map interaction
        if (message.includes('sq.m') && !message.includes('You have drawn an area')) {
            setTimeout(() => {
                highlightAreaOnMap(message);
            }, 1000);
        }
    } else {
        // User messages are displayed immediately
    messageElement.textContent = message;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
        // Add to conversation history
        conversationHistory.push({
            role: 'user',
            content: message
        });
    }
}

// Format bot message with markdown-like syntax
function formatBotMessage(message) {
    // Convert **text** to <strong>text</strong>
    message = message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert - item to bullet points
    message = message.replace(/^- (.*?)$/gm, '<li>$1</li>');
    message = message.replace(/<li>(.*?)<\/li>/g, '<ul><li>$1</li></ul>');
    message = message.replace(/<\/ul><ul>/g, '');
    
    // Make sq.m references stand out
    message = message.replace(/(\d+(\.\d+)?)\s*sq\.m/g, '<span class="measurement">$1 sq.m</span>');
    
    // Add links for URLs
    message = message.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
    
    return message;
}

// Simulate streaming effect for bot messages
function streamBotMessage(element, rawMessage, formattedMessage) {
    // First, remove HTML tags to get plain text for streaming
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = formattedMessage;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';
    
    let charIndex = 0;
    const streamingSpeed = 15; // milliseconds per character
    
    // Start with empty content
    element.innerHTML = '';
    
    // Stream the text character by character
    const streamInterval = setInterval(() => {
        if (charIndex < plainText.length) {
            // Add one character at a time
            element.textContent += plainText[charIndex];
            charIndex++;
            chatMessages.scrollTop = chatMessages.scrollHeight;
        } else {
            // When done streaming text, add the fully formatted HTML
            clearInterval(streamInterval);
            element.innerHTML = formattedMessage;
            element.classList.remove('typing');
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }, streamingSpeed);
}

// Add suggested questions as clickable buttons
function addSuggestedQuestions() {
    // Remove existing suggestions
    const existingSuggestions = document.querySelector('.suggested-questions');
    if (existingSuggestions) {
        existingSuggestions.remove();
    }
    
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.classList.add('suggested-questions');
    
    const heading = document.createElement('div');
    heading.classList.add('suggestions-heading');
    heading.textContent = 'You might want to ask:';
    suggestionsContainer.appendChild(heading);
    
    const questionsContainer = document.createElement('div');
    questionsContainer.classList.add('questions-container');
    
    // Get random questions (2-3) from the suggestions list
    const shuffled = [...SUGGESTED_QUESTIONS].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.floor(Math.random() * 2) + 2);
    
    selected.forEach(question => {
        const questionButton = document.createElement('button');
        questionButton.classList.add('suggested-question');
        questionButton.textContent = question;
        questionButton.addEventListener('click', () => {
            chatInput.value = question;
            sendMessage();
            suggestionsContainer.remove();
        });
        questionsContainer.appendChild(questionButton);
    });
    
    suggestionsContainer.appendChild(questionsContainer);
    chatMessages.appendChild(suggestionsContainer);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Get Gemini API response with context
async function getGeminiResponse(userMessage, landAnalysis = null) {
    // In a real implementation, this would call an actual AI API
    // For this prototype, we'll simulate responses
    
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Check for sustainability and solar related queries
    if (landAnalysis && 
        (userMessage.toLowerCase().includes('solar') || 
         userMessage.toLowerCase().includes('green') || 
         userMessage.toLowerCase().includes('sustainable') ||
         userMessage.toLowerCase().includes('pollution') ||
         userMessage.toLowerCase().includes('environment'))) {
        
        return getSolarRecommendations(window.drawnArea, landAnalysis);
    }
    
    // Check for timeline related queries
    if (landAnalysis && 
        (userMessage.toLowerCase().includes('time') || 
         userMessage.toLowerCase().includes('duration') || 
         userMessage.toLowerCase().includes('schedule') ||
         userMessage.toLowerCase().includes('timeline'))) {
        
        if (landAnalysis.isDeveloped) {
            return `## Development Timeline for Developed Area

### Planning Phase: 6-8 months
- **Month 1-2**: Initial design and feasibility studies
- **Month 3-5**: Regulatory approvals and permits
- **Month 6-8**: Detailed architectural plans and engineering

### Infrastructure Upgrades: 4-6 months
- **Month 1-2**: Utility connections and upgrades
- **Month 3-4**: Road improvements and access enhancement
- **Month 5-6**: Site preparation and existing structure modifications

### Construction Phase: 18-24 months
- **Month 1-6**: Foundation and structural work
- **Month 7-14**: Core and shell construction
- **Month 15-20**: Interior work and finishing
- **Month 21-24**: Landscaping and final touches

### Total Project Timeline: 2.5-3 years
- **Critical path items**: Regulatory approvals and structural integration with existing infrastructure
- **Potential delays**: Unexpected conditions in existing structures, permit delays
- **Acceleration opportunities**: Phased occupancy, parallel work streams

This timeline assumes standard construction practices and normal regulatory processing times in urban Indian settings.`;
        } else {
            return `## Development Timeline for Undeveloped Land

### Planning Phase: 8-12 months
- **Month 1-3**: Master planning and concept development
- **Month 4-8**: Land conversion and zoning approvals
- **Month 9-12**: Detailed engineering and architectural plans

### Infrastructure Development: 10-14 months
- **Month 1-4**: Site clearing and grading
- **Month 5-9**: Road network construction
- **Month 10-14**: Utility installation (water, electricity, sewage)

### Construction Phase: 24-36 months
- **Month 1-8**: Foundation work
- **Month 9-20**: Structural construction
- **Month 21-30**: Building envelope and systems
- **Month 31-36**: Finishing and commissioning

### Total Project Timeline: 3.5-5 years
- **Critical path items**: Land conversion approvals, infrastructure development
- **Potential delays**: Monsoon season impacts, regulatory clearances
- **Acceleration opportunities**: Modular construction techniques, multiple work fronts

This timeline is longer for undeveloped land due to the need for complete infrastructure development and additional regulatory requirements.`;
        }
    }
    
    // Check for resource requirement queries
    if (landAnalysis && 
        (userMessage.toLowerCase().includes('resource') || 
         userMessage.toLowerCase().includes('material') || 
         userMessage.toLowerCase().includes('labor') ||
         userMessage.toLowerCase().includes('worker') ||
         userMessage.toLowerCase().includes('people'))) {
        
        const squareFeet = Math.round(window.drawnArea * 10.764);
        
        if (landAnalysis.isDeveloped) {
            return `## Resource Requirements for Developed Area

### Labor Requirements
- **Peak workforce**: 150-200 workers
- **Skilled labor**: 40% (masons, electricians, plumbers, etc.)
- **Semi-skilled labor**: 35% (equipment operators, carpenters)
- **Unskilled labor**: 25% (helpers, cleaners)
- **Supervision team**: 10-15 engineers and managers

### Material Requirements
- **Cement**: ~${Math.round(squareFeet * 0.1).toLocaleString()} tons
- **Steel**: ~${Math.round(squareFeet * 0.05).toLocaleString()} tons
- **Bricks/Blocks**: ~${Math.round(squareFeet * 0.8).toLocaleString()} pieces
- **Sand**: ~${Math.round(squareFeet * 0.15).toLocaleString()} cubic meters
- **Aggregate**: ~${Math.round(squareFeet * 0.2).toLocaleString()} cubic meters

### Equipment Requirements
- **Tower cranes**: 1-2 depending on site layout
- **Concrete pumps**: 1-2 units
- **Excavators/Loaders**: 2-3 units
- **Transit mixers**: 3-4 units
- **Generators**: 2-3 units (100-250 kVA)

### Utility Requirements
- **Water**: ~${Math.round(squareFeet * 0.02).toLocaleString()} kiloliters
- **Power**: ~${Math.round(squareFeet * 0.05).toLocaleString()} kW connected load
- **Temporary facilities**: Site offices, worker accommodations, material storage

### Population Impact
- **Direct beneficiaries**: ~${Math.round(squareFeet * 0.01).toLocaleString()} people
- **Jobs created**: ~${Math.round(squareFeet * 0.005).toLocaleString()} permanent positions
- **Indirect beneficiaries**: ~${Math.round(squareFeet * 0.025).toLocaleString()} people in surrounding areas`;
        } else {
            return `## Resource Requirements for Undeveloped Land

### Labor Requirements
- **Peak workforce**: 250-350 workers
- **Skilled labor**: 35% (masons, electricians, plumbers, etc.)
- **Semi-skilled labor**: 40% (equipment operators, carpenters)
- **Unskilled labor**: 25% (helpers, cleaners)
- **Supervision team**: 15-25 engineers and managers

### Material Requirements
- **Cement**: ~${Math.round(squareFeet * 0.15).toLocaleString()} tons
- **Steel**: ~${Math.round(squareFeet * 0.08).toLocaleString()} tons
- **Bricks/Blocks**: ~${Math.round(squareFeet * 1.2).toLocaleString()} pieces
- **Sand**: ~${Math.round(squareFeet * 0.25).toLocaleString()} cubic meters
- **Aggregate**: ~${Math.round(squareFeet * 0.3).toLocaleString()} cubic meters

### Equipment Requirements
- **Bulldozers/Graders**: 3-4 units for land development
- **Tower cranes**: 2-3 depending on site layout
- **Concrete batching plant**: 1 unit (recommended for large developments)
- **Excavators/Loaders**: 4-6 units
- **Transit mixers**: 5-8 units
- **Generators**: 4-5 units (100-500 kVA)

### Utility Requirements
- **Water**: ~${Math.round(squareFeet * 0.03).toLocaleString()} kiloliters
- **Power**: ~${Math.round(squareFeet * 0.08).toLocaleString()} kW connected load
- **Temporary infrastructure**: Access roads, site offices, worker camps

### Population Impact
- **Direct beneficiaries**: ~${Math.round(squareFeet * 0.008).toLocaleString()} people
- **Jobs created**: ~${Math.round(squareFeet * 0.006).toLocaleString()} permanent positions
- **Indirect beneficiaries**: ~${Math.round(squareFeet * 0.024).toLocaleString()} people in surrounding areas`;
        }
    }
    
    // Check for land/area related queries with development keywords
    if (landAnalysis && 
        (userMessage.toLowerCase().includes('area') || 
         userMessage.toLowerCase().includes('land') || 
         userMessage.toLowerCase().includes('development') ||
         userMessage.toLowerCase().includes('build') ||
         userMessage.toLowerCase().includes('cost') ||
         userMessage.toLowerCase().includes('road') ||
         userMessage.toLowerCase().includes('building') ||
         userMessage.toLowerCase().includes('factory') ||
         userMessage.toLowerCase().includes('industr'))) {
        
        // More specific responses based on query type
        if (userMessage.toLowerCase().includes('road') || 
            userMessage.toLowerCase().includes('infrastructure')) {
            
            if (landAnalysis.isDeveloped) {
                return `## Road & Infrastructure Analysis for Developed Area

For developed land of this size, **infrastructure improvement** rather than new construction would be the focus:

### Road Requirements
- **Main Roads**: Widening existing roads to 4-lane (15m width)
- **Internal Roads**: Improving to 9m width with proper drainage
- **Junctions**: Adding traffic signals/roundabouts at key intersections
- **Pedestrian Infrastructure**: Sidewalks (2m width) and crossings

### Estimated Infrastructure Costs (₹)
- **Road improvements**: ₹3,500-5,000 per sq.m (₹${Math.round(3500 * window.drawnArea/10).toLocaleString()} - ₹${Math.round(5000 * window.drawnArea/10).toLocaleString()})
- **Drainage systems**: ₹2,000-3,000 per linear meter
- **Street lighting**: ₹25,000-35,000 per pole with 30m spacing
- **Traffic management**: ₹15-20 lakhs per junction

### Timeline for Infrastructure Development
- **Design and approvals**: 3-4 months
- **Road widening/improvements**: 4-6 months
- **Utility upgrades**: 3-5 months
- **Total infrastructure timeline**: 8-12 months

### Resource Requirements
- **Labor**: 50-80 workers for infrastructure work
- **Equipment**: Road rollers, pavers, excavators
- **Materials**: Bitumen, concrete, aggregates

Infrastructure would account for approximately 20-25% of the total project budget in developed areas.`;
            } else {
                return `## Road & Infrastructure Analysis for Undeveloped Land

For undeveloped land of this size, you'll need to build **complete infrastructure from scratch**:

### Road Network Requirements
- **Main Access Road**: 2-lane (10m width) connecting to nearest highway
- **Internal Roads**: Grid pattern with 9m width for primary & 6m for secondary
- **Total Road Length Required**: Approximately ${Math.sqrt(window.drawnArea/10000).toFixed(2)}km of internal roads
- **Culverts & Bridges**: Required based on local topography

### Estimated Infrastructure Costs (₹)
- **New road construction**: ₹5,000-7,000 per sq.m (₹${Math.round(5000 * window.drawnArea/10).toLocaleString()} - ₹${Math.round(7000 * window.drawnArea/10).toLocaleString()})
- **Water supply network**: ₹10-15 lakhs per hectare
- **Electricity infrastructure**: ₹5-8 lakhs for transformer & distribution
- **Drainage & Sewage**: ₹3,000-4,000 per linear meter

### Timeline for Infrastructure Development
- **Design and approvals**: 4-6 months
- **Site preparation**: 2-3 months
- **Road construction**: 6-8 months
- **Utility installation**: 4-6 months
- **Total infrastructure timeline**: 12-18 months

### Resource Requirements
- **Labor**: 100-150 workers for infrastructure development
- **Equipment**: Bulldozers, graders, rollers, pavers
- **Materials**: Soil, aggregates, bitumen, concrete, pipes

Infrastructure would account for approximately 35-40% of the total project budget for undeveloped land.`;
            }
        }
        
        // Default response with general land analysis
        return getSuggestionForArea(window.drawnArea, landAnalysis);
    }
    
    // Handle other general queries as before
    const genericResponses = [
        "Based on my analysis of the area, this land would be suitable for mixed-use development, considering its topography and proximity to existing infrastructure.",
        "I've analyzed similar land patterns before. This area would benefit from sustainable development practices that preserve natural drainage and vegetation where possible.",
        "From a planning perspective, this location would require careful consideration of access roads and utility connections before development can proceed.",
        "Looking at the characteristics of this area, I would recommend conducting a detailed environmental impact assessment before finalizing any development plans."
    ];
    
    return genericResponses[Math.floor(Math.random() * genericResponses.length)];
}

// Show loading indicator
function showLoadingIndicator() {
    const loadingElement = document.createElement('div');
    loadingElement.classList.add('loading');
    loadingElement.innerHTML = '<div class="spinner"></div> <span class="loading-text">Thinking</span>';
    
    // Add animated dots
    const dotsElement = document.createElement('span');
    dotsElement.classList.add('loading-dots');
    loadingElement.querySelector('.loading-text').appendChild(dotsElement);
    
    let dotCount = 0;
    const dotInterval = setInterval(() => {
        dotCount = (dotCount % 3) + 1;
        dotsElement.textContent = '.'.repeat(dotCount);
    }, 300);
    
    // Store the interval ID on the element
    loadingElement.dotInterval = dotInterval;
    
    chatMessages.appendChild(loadingElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Hide loading indicator
function hideLoadingIndicator() {
    const loadingElement = document.querySelector('.loading');
    if (loadingElement) {
        // Clear the dot animation interval
        if (loadingElement.dotInterval) {
            clearInterval(loadingElement.dotInterval);
        }
        loadingElement.remove();
    }
}

// Integration with map - highlight area mentioned in chat
function highlightAreaOnMap(message) {
    // Extract area size from message (if any)
    const areaMatch = message.match(/(\d+(\.\d+)?)\s*sq\.m/);
    if (areaMatch && areaMatch[1]) {
        const mentionedArea = parseFloat(areaMatch[1]);
        
        // If the mentioned area is close to the drawn area, highlight the drawn area
        if (window.drawnArea > 0 && Math.abs(mentionedArea - window.drawnArea) / window.drawnArea < 0.1) {
            // The drawn area is already highlighted, just focus on it
            map.fitBounds(draw.getBoundingBox());
        } else {
            // Visualize a hypothetical area of this size
            visualizeHypotheticalArea(mentionedArea);
        }
    }
}

// Visualize a hypothetical area on the map
function visualizeHypotheticalArea(areaSize) {
    // Remove any existing hypothetical area
    const existingArea = document.querySelector('.hypothetical-area-overlay');
    if (existingArea) {
        existingArea.remove();
    }
    
    // Create a visual overlay to represent the area
    const overlay = document.createElement('div');
    overlay.classList.add('hypothetical-area-overlay');
    
    // Calculate dimensions for a square of the given area
    const sideLength = Math.sqrt(areaSize);
    const scaleFactor = 0.5; // Adjust based on your map scale
    
    overlay.style.width = `${sideLength * scaleFactor}px`;
    overlay.style.height = `${sideLength * scaleFactor}px`;
    
    // Add info to the overlay
    const infoElement = document.createElement('div');
    infoElement.classList.add('area-info');
    infoElement.textContent = `${areaSize} sq.m`;
    overlay.appendChild(infoElement);
    
    // Add to map container
    document.getElementById('map').appendChild(overlay);
    
    // Position in center of visible map
    const mapRect = document.getElementById('map').getBoundingClientRect();
    overlay.style.left = `${(mapRect.width - overlay.offsetWidth) / 2}px`;
    overlay.style.top = `${(mapRect.height - overlay.offsetHeight) / 2}px`;
    
    // Add animation
    overlay.classList.add('appear');
    
    // Remove after some time
    setTimeout(() => {
        overlay.classList.add('disappear');
        setTimeout(() => overlay.remove(), 1000);
    }, 5000);
}

// Event listeners
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

sendMessageButton.addEventListener('click', sendMessage);

// Function that can be called from other scripts
function updateChatbotWithAreaInfo(area) {
    const sizeInAcres = (area / 4046.86).toFixed(2);
    const sizeInHectares = (area / 10000).toFixed(2);
    
    // Get land analysis
    const landAnalysis = analyzeLandType();
    let recommendation = getSuggestionForArea(area, landAnalysis);
    
    addMessage('bot', recommendation);
}

// Update the getSuggestionForArea function to include development timelines, resources, and sustainability
function getSuggestionForArea(area, landAnalysis) {
    const sizeInAcres = (area / 4046.86).toFixed(2);
    const sizeInHectares = (area / 10000).toFixed(2);
    
    // Convert area to square feet for Indian real estate calculations
    const squareFeet = Math.round(area * 10.764);
    
    // Adjusted price per square foot for more realistic cost estimates
    const pricePerSquareFootDeveloped = 3000; // Reduced from 4000
    const pricePerSquareFootUndeveloped = 800; // Reduced from 1200

    // Calculate current price per acre with adjusted values
    const pricePerAcreDeveloped = pricePerSquareFootDeveloped * 43560; // 1 acre = 43,560 sq.ft
    const pricePerAcreUndeveloped = pricePerSquareFootUndeveloped * 43560;

    // Assume an annual growth rate of 5% for developed and 7% for undeveloped land
    const growthRateDeveloped = 0.05;
    const growthRateUndeveloped = 0.07;

    // Calculate future value over 10 years
    const futureValueDeveloped = pricePerAcreDeveloped * Math.pow(1 + growthRateDeveloped, 10);
    const futureValueUndeveloped = pricePerAcreUndeveloped * Math.pow(1 + growthRateUndeveloped, 10);

    // Create a more detailed response based on land analysis
    let message = `I've analyzed the selected area of **${sizeInAcres} acres** (${sizeInHectares} hectares or approximately ${squareFeet.toLocaleString()} sq.ft).`;
    
    if (landAnalysis.isDeveloped) {
        // Recommendations for developed areas
        message += `\n\n📍 **Land Analysis**: This appears to be a **developed area** with relatively high population density.`;
        
        message += `\n\n**Key Observations**:
- 🏙️ This is a crowded area with existing development
- 🚦 The area has established infrastructure
- 🏢 Limited space for new large-scale construction
- 📱 Good connectivity and network coverage likely exists`;
        
        message += `\n\n**Development Recommendations**:`;
        
        // Buildings recommendations for developed area
        message += `\n\n🏗️ **Building Options**:
- **Mixed-use commercial buildings**: 4-6 floors with retail on ground floor
- **Residential apartments**: Mid-rise (8-10 floors) with amenities
- **Office spaces** for services/IT companies
- **Public facilities**: Community centers, healthcare facilities`;

        // Infrastructure recommendations for developed area
        message += `\n\n🛣️ **Infrastructure Needs**:
- **Road improvements**: Widening existing roads, adding service lanes
- **Parking solutions**: Multi-level parking structures recommended
- **Utility upgrades**: Water, electricity, sewage capacity enhancement
- **Public transport hubs**: Local bus stops, ride-sharing pickup points`;

        // Cost estimates for developed area (in rupees) with adjusted values
        const landValue = Math.round(squareFeet * pricePerSquareFootDeveloped); // Adjusted land value
        const infrastructureCost = Math.round(squareFeet * 600); // Reduced infrastructure cost
        const buildingCost = Math.round(squareFeet * 2000); // Reduced building cost
        const totalEstimate = landValue + infrastructureCost + buildingCost;
        
        message += `\n\n💰 **Estimated Costs (₹)**:
- **Land value**: ₹${landValue.toLocaleString()}
- **Infrastructure development**: ₹${infrastructureCost.toLocaleString()}
- **Building construction**: ₹${buildingCost.toLocaleString()} (varies by type)
- **Total estimated investment**: ₹${totalEstimate.toLocaleString()}`;
        
        // Add development timeline
        message += `\n\n⏱️ **Development Timeline**:
- **Planning & approvals**: 6-8 months
- **Infrastructure upgrades**: 4-6 months
- **Construction phase**: 18-24 months
- **Total project timeline**: 2.5-3 years`;

        // Add resource requirements
        message += `\n\n🔨 **Resource Requirements**:
- **Labor force**: 150-200 workers during peak construction
- **Construction materials**: ~${Math.round(squareFeet * 0.1).toLocaleString()} tons of cement, ${Math.round(squareFeet * 0.05).toLocaleString()} tons of steel
- **Water requirement**: ~${Math.round(squareFeet * 0.02).toLocaleString()} kiloliters
- **Power requirement**: ~${Math.round(squareFeet * 0.05).toLocaleString()} kW connected load`;

        // Add population impact
        const peopleCapacity = Math.round(squareFeet * 0.01);
        const jobsCreated = Math.round(squareFeet * 0.005);
        
        message += `\n\n👥 **Population Impact**:
- **Direct beneficiaries**: ~${peopleCapacity.toLocaleString()} people can occupy/use the space
- **Jobs created**: ~${jobsCreated.toLocaleString()} permanent positions
- **Construction jobs**: ~200 temporary positions
- **Indirect beneficiaries**: ~${Math.round(peopleCapacity * 2.5).toLocaleString()} people in surrounding areas`;

        // Add sustainability features
        message += `\n\n♻️ **Sustainability Recommendations**:
- **Solar installation**: ${Math.round(squareFeet * 0.1).toLocaleString()} sq.ft rooftop solar (${Math.round(squareFeet * 0.01).toLocaleString()} kW capacity)
- **Energy savings**: ~${Math.round(squareFeet * 0.015).toLocaleString()} kWh per day
- **Pollution reduction**: ${Math.round(squareFeet * 0.002).toLocaleString()} tons CO₂ offset annually
- **Green building features**: Rainwater harvesting, energy-efficient lighting, waste management systems`;
        
        message += `\n\n**Note**: Costs will be higher in developed areas due to premium land rates and the need for demolition of existing structures.`;
        
        // Add price estimation and future projection
        message += `\n\n💵 **Price Estimation for 1 Acre**:
- **Current Price**: ₹${pricePerAcreDeveloped.toLocaleString()}
- **Projected Price in 10 Years**: ₹${futureValueDeveloped.toLocaleString()}`;
        
        // Add recommendations for public and commercial facilities
        message += `\n\n🏢 **Public and Commercial Facilities**:
- **Government Offices**: Administrative buildings, public service centers
- **Educational Institutions**: Schools, colleges, vocational training centers
- **Commercial Spaces**: Shopping malls, retail marts, entertainment complexes`;
        
    } else {
        // Recommendations for undeveloped/empty land
        message += `\n\n📍 **Land Analysis**: This appears to be **undeveloped land** with low population density.`;
        
        message += `\n\n**Key Observations**:
- 🌾 Potential for agricultural or industrial development
- 🛣️ Limited existing roads - new infrastructure needed
- 🏕️ Not crowded - excellent for new development projects
- 📡 Limited internet connectivity and utilities`;
        
        message += `\n\n**Development Recommendations**:`;

        // Buildings recommendations for undeveloped land
        message += `\n\n🏭 **Building Options**:
- **Industrial facilities**: Manufacturing units, warehouses, processing plants
- **Residential townships**: Low-density housing with green spaces
- **Tech parks**: Campus-style layouts with multiple buildings
- **Agricultural facilities**: Storage, processing, and distribution centers`;

        // Infrastructure recommendations for undeveloped land
        message += `\n\n🛣️ **Infrastructure Needs**:
- **New road network**: Primary 2-lane roads with expansion capability
- **Water management systems**: Borewells, water tanks, drainage
- **Electricity infrastructure**: Substations and distribution network
- **Connectivity**: Cell towers, fiber optic networks for internet`;

        // Cost estimates for undeveloped land (in rupees) with adjusted values
        const landValue = Math.round(squareFeet * pricePerSquareFootUndeveloped); // Adjusted land value
        const infrastructureCost = Math.round(squareFeet * 1200); // Reduced infrastructure cost
        const buildingCost = Math.round(squareFeet * 1500); // Reduced building cost
        const totalEstimate = landValue + infrastructureCost + buildingCost;
        
        message += `\n\n💰 **Estimated Costs (₹)**:
- **Land acquisition**: ₹${landValue.toLocaleString()}
- **Infrastructure development**: ₹${infrastructureCost.toLocaleString()}
- **Building construction**: ₹${buildingCost.toLocaleString()} (varies by type)
- **Total estimated investment**: ₹${totalEstimate.toLocaleString()}`;
        
        // Add development timeline
        message += `\n\n⏱️ **Development Timeline**:
- **Planning & approvals**: 8-12 months (longer due to land conversion)
- **Infrastructure development**: 10-14 months
- **Construction phase**: 24-36 months
- **Total project timeline**: 3.5-5 years`;

        // Add resource requirements
        message += `\n\n🔨 **Resource Requirements**:
- **Labor force**: 250-350 workers during peak construction
- **Construction materials**: ~${Math.round(squareFeet * 0.15).toLocaleString()} tons of cement, ${Math.round(squareFeet * 0.08).toLocaleString()} tons of steel
- **Water requirement**: ~${Math.round(squareFeet * 0.03).toLocaleString()} kiloliters
- **Power requirement**: ~${Math.round(squareFeet * 0.08).toLocaleString()} kW connected load`;

        // Add population impact
        const peopleCapacity = Math.round(squareFeet * 0.008);
        const jobsCreated = Math.round(squareFeet * 0.006);
        
        message += `\n\n👥 **Population Impact**:
- **Direct beneficiaries**: ~${peopleCapacity.toLocaleString()} people can occupy/use the space
- **Jobs created**: ~${jobsCreated.toLocaleString()} permanent positions
- **Construction jobs**: ~300 temporary positions
- **Indirect beneficiaries**: ~${Math.round(peopleCapacity * 3).toLocaleString()} people in surrounding areas`;

        // Add sustainability features with emphasis on solar for undeveloped land
        message += `\n\n♻️ **Sustainability Recommendations**:
- **Solar installation**: ${Math.round(squareFeet * 0.2).toLocaleString()} sq.ft dedicated solar farm (${Math.round(squareFeet * 0.02).toLocaleString()} kW capacity)
- **Energy savings**: ~${Math.round(squareFeet * 0.025).toLocaleString()} kWh per day
- **Pollution reduction**: ${Math.round(squareFeet * 0.003).toLocaleString()} tons CO₂ offset annually
- **Green infrastructure**: Permeable pavements, natural drainage, waste treatment plant, EV charging stations`;
        
        message += `\n\n**Note**: While land costs are lower, infrastructure development expenses will be significant due to the need to build everything from scratch.`;
        
        // Add price estimation and future projection
        message += `\n\n💵 **Price Estimation for 1 Acre**:
- **Current Price**: ₹${pricePerAcreUndeveloped.toLocaleString()}
- **Projected Price in 10 Years**: ₹${futureValueUndeveloped.toLocaleString()}`;

        // Add recommendations for public and commercial facilities
        message += `\n\n🏢 **Public and Commercial Facilities**:
- **Government Offices**: Local administrative offices, community centers
- **Educational Institutions**: Primary and secondary schools, colleges
- **Commercial Spaces**: Local markets, small shopping complexes, community marts`;
    }
    
    message += `\n\n*Would you like more detailed analysis for specific development types or cost breakdowns?*`;
    
    return message;
}

// Add a new function to provide detailed solar panel recommendations
function getSolarRecommendations(area, landAnalysis) {
    const squareFeet = Math.round(area * 10.764);
    const sizeInAcres = (area / 4046.86).toFixed(2);
    
    let solarCapacity, roofArea, groundArea, annualGeneration, costSavings, installationCost, paybackPeriod, co2Reduction;
    
    if (landAnalysis.isDeveloped) {
        // For developed areas - focus on rooftop solar
        roofArea = Math.round(squareFeet * 0.3); // Assume 30% of area can be used for rooftop solar
        solarCapacity = Math.round(roofArea / 100); // Approx 1kW per 100 sq.ft
        annualGeneration = Math.round(solarCapacity * 1500); // 1500 kWh per kW in India
        costSavings = Math.round(annualGeneration * 8); // Rs 8 per kWh saved
        installationCost = Math.round(solarCapacity * 60000); // Rs 60,000 per kW
        paybackPeriod = Math.round((installationCost / costSavings) * 10) / 10; // Round to 1 decimal
        co2Reduction = Math.round(annualGeneration * 0.82 / 1000); // 0.82 kg CO2 per kWh
        
        return `## Solar Power Recommendations for Developed Area (${sizeInAcres} acres)

### Rooftop Solar Installation
- **Available roof area**: ~${roofArea.toLocaleString()} sq.ft
- **Recommended capacity**: ${solarCapacity.toLocaleString()} kW
- **Annual generation**: ${annualGeneration.toLocaleString()} kWh
- **Installation type**: Grid-connected rooftop system

### Financial Analysis
- **Installation cost**: ₹${installationCost.toLocaleString()}
- **Annual savings**: ₹${costSavings.toLocaleString()}
- **Payback period**: ${paybackPeriod} years
- **Government subsidies**: 20-40% available through MNRE schemes

### Environmental Impact
- **CO₂ reduction**: ${co2Reduction} tons annually
- **Equivalent to**: Planting ${Math.round(co2Reduction * 40)} trees
- **Pollution reduction**: Significant NOx and SOx reduction

### Implementation Strategy
- **Phase 1**: Install ${Math.round(solarCapacity * 0.6)} kW on main buildings
- **Phase 2**: Expand to parking areas with solar carports
- **Maintenance**: Annual cleaning and inspection costs ~₹${Math.round(solarCapacity * 1000)}

This system would cover approximately ${Math.round(annualGeneration / (squareFeet * 0.12) * 100)}% of the development's electricity needs.`;
        
    } else {
        // For undeveloped land - focus on dedicated solar farm
        groundArea = Math.round(squareFeet * 0.15); // Assume 15% of area can be used for ground-mounted solar
        solarCapacity = Math.round(groundArea / 80); // Approx 1kW per 80 sq.ft for ground-mounted
        annualGeneration = Math.round(solarCapacity * 1600); // 1600 kWh per kW in India (better for ground-mounted)
        costSavings = Math.round(annualGeneration * 7); // Rs 7 per kWh (potentially selling to grid)
        installationCost = Math.round(solarCapacity * 50000); // Rs 50,000 per kW (economies of scale)
        paybackPeriod = Math.round((installationCost / costSavings) * 10) / 10; // Round to 1 decimal
        co2Reduction = Math.round(annualGeneration * 0.82 / 1000); // 0.82 kg CO2 per kWh
        
        return `## Solar Power Recommendations for Undeveloped Land (${sizeInAcres} acres)

### Dedicated Solar Farm
- **Available ground area**: ~${groundArea.toLocaleString()} sq.ft
- **Recommended capacity**: ${solarCapacity.toLocaleString()} kW
- **Annual generation**: ${annualGeneration.toLocaleString()} kWh
- **Installation type**: Ground-mounted solar farm with tracking system

### Financial Analysis
- **Installation cost**: ₹${installationCost.toLocaleString()}
- **Annual revenue/savings**: ₹${costSavings.toLocaleString()}
- **Payback period**: ${paybackPeriod} years
- **Additional incentives**: Accelerated depreciation, priority grid access

### Environmental Impact
- **CO₂ reduction**: ${co2Reduction} tons annually
- **Equivalent to**: Planting ${Math.round(co2Reduction * 40)} trees
- **Land use efficiency**: Dual-use possible with certain agricultural activities

### Implementation Strategy
- **Phase 1**: Initial ${Math.round(solarCapacity * 0.5)} kW installation
- **Phase 2**: Expansion based on development needs
- **Grid connection**: ${solarCapacity > 100 ? 'Dedicated substation required' : 'Standard grid connection possible'}
- **Maintenance**: Annual costs ~₹${Math.round(solarCapacity * 800)}

This solar farm could power the entire development and potentially generate surplus electricity for the grid.`;
    }
}

// Add new function to analyze land type
function analyzeLandType(drawingType) {
    // This would be connected to actual data in a real implementation
    // For now, we'll simulate with a toggle or based on drawing type
    const isResidentialArea = document.getElementById('layer-buildings')?.checked || Math.random() > 0.5;
    
    return {
        isDeveloped: isResidentialArea,
        populationDensity: isResidentialArea ? 'high' : 'low',
        hasRoads: isResidentialArea ? true : Math.random() > 0.7,
        hasInternet: isResidentialArea ? true : Math.random() > 0.6,
        nearbyFacilities: isResidentialArea ? Math.random() > 0.3 : Math.random() > 0.8,
        soilQuality: !isResidentialArea ? (Math.random() > 0.5 ? 'good' : 'moderate') : 'poor'
    };
}

// Add a function to be called from the map script when layers change
window.updateChatbotWithLayerInfo = function(layerName, isActive) {
    // Only process if an area is drawn
    const hasDrawnArea = document.querySelector('.leaflet-interactive') !== null;
    if (!hasDrawnArea) return;
    
    // If buildings layer is toggled, give feedback
    if (layerName === 'buildings' && isActive) {
        addMessage('bot', "I notice you've toggled on the buildings layer. This helps me analyze the development density of the selected area.");
    }
    
    // If terrain layer is toggled, give feedback about solar potential
    if (layerName === 'terrain' && isActive) {
        addMessage('bot', "I see you've activated the terrain layer. This helps me assess the topography for optimal solar panel placement and drainage planning.");
    }
    
    // If water layer is toggled, give feedback about environmental considerations
    if (layerName === 'water' && isActive) {
        addMessage('bot', "With the water bodies layer active, I can better evaluate flood risks and water management requirements for sustainable development.");
    }
    
    // Get current area if available and update assessment
    if (window.drawnArea && window.drawnArea > 0) {
        // Wait a moment to avoid too many messages
        setTimeout(() => {
            const landAnalysis = analyzeLandType();
            let recommendation = getSuggestionForArea(window.drawnArea, landAnalysis);
            addMessage('bot', "With the updated layer information, I can provide a more accurate assessment:");
            addMessage('bot', recommendation);
        }, 1500);
    }
}