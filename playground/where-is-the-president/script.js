// State management
const state = {
    allEvents: [],
    filteredEvents: [],
    eventTypes: new Set(),
    currentPage: 1,
    eventsPerPage: 9,
    isLoading: true,
    hasError: false,
    errorMessage: '',
    searchTerm: '',
    selectedType: 'all'
};

// DOM elements
const eventsContainer = document.getElementById('events');
const statusElement = document.getElementById('status');
const filtersContainer = document.getElementById('filters');
const lastUpdatedElement = document.getElementById('last-updated');
const searchElement = document.getElementById('search');
const searchButton = document.getElementById('search-btn');
const clearSearchButton = document.getElementById('clear-search');
const backupButton = document.getElementById('backup-btn');
const backupStatusElement = document.getElementById('backup-status');
const paginationElement = document.getElementById('pagination');
const prevButton = document.getElementById('prev-btn');
const nextButton = document.getElementById('next-btn');
const pageInfoElement = document.getElementById('page-info');

// Format date for display
function formatDate(dateString) {
    // Add time (noon) to ensure consistent timezone handling
    const date = new Date(`${dateString}T12:00:00`);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Format date for section headers
function formatDateForSection(dateString) {
    // Add time (noon) to ensure consistent timezone handling
    const date = new Date(`${dateString}T12:00:00`);
    const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Format time for display
function formatTime(timeString) {
    if (!timeString) return 'Time not specified';
    
    const options = { hour: 'numeric', minute: '2-digit', hour12: true };
    const date = new Date(`2000-01-01T${timeString}`);
    return date.toLocaleTimeString('en-US', options);
}

// Get source class name based on event type
function getSourceClassName(type) {
    if (!type) return '';
    
    const sourceType = type.toLowerCase();
    if (sourceType.includes('press briefing')) return 'source-press-briefing';
    if (sourceType.includes('official schedule')) return 'source-official-schedule';
    if (sourceType.includes('pool call time')) return 'source-pool-call-time';
    if (sourceType.includes('potus_schedule')) return 'source-potus-schedule';
    if (sourceType.includes('pool report')) return 'source-pool-report';
    if (sourceType.includes('axios')) return 'source-axios';
    
    return '';
}

// Format source name for display
function formatSourceName(type) {
    if (!type) return 'Unspecified Source';
    
    if (type.toLowerCase().includes('potus_schedule')) return '@POTUS_Schedule';
    
    // Convert camelCase or underscores to spaces and capitalize
    return type
        .replace(/_/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
        .trim();
}

// Create event card
function createEventCard(event) {
    const card = document.createElement('div');
    card.className = 'event-card';
    
    // Format time display
    const startTimeStr = formatTime(event.timeStart);
    const endTimeStr = event.timeEnd ? formatTime(event.timeEnd) : '';
    const timeDisplay = endTimeStr ? `${startTimeStr} - ${endTimeStr}` : startTimeStr;
    
    // Get source information
    const sourceClassName = getSourceClassName(event.type);
    const sourceName = formatSourceName(event.type);

    card.innerHTML = `
        <div class="event-date">
            <div class="event-time">${timeDisplay}</div>
        </div>
        ${sourceClassName ? `<div class="event-source ${sourceClassName}">${sourceName}</div>` : ''}
        <div class="event-details">
            <div class="event-location">${event.location || 'Location not specified'}</div>
            ${event.description ? `<div class="event-description">${event.description}</div>` : ''}
            ${event.url ? `<a href="${event.url}" target="_blank" class="event-link">More information</a>` : ''}
            ${!sourceClassName ? `<div class="event-source-tag">Source: ${sourceName}</div>` : ''}
        </div>
    `;

    return card;
}

// Filter events based on current filters
function filterEvents() {
    state.filteredEvents = state.allEvents.filter(event => {
        // Search filter
        const searchLower = state.searchTerm.toLowerCase();
        const searchMatch = !state.searchTerm || 
            (event.title && event.title.toLowerCase().includes(searchLower)) ||
            (event.description && event.description.toLowerCase().includes(searchLower)) ||
            (event.location && event.location.toLowerCase().includes(searchLower));
        
        return searchMatch;
    });

    state.currentPage = 1;
    renderEvents();
    updatePagination();
}

// Clear search and reset filters
function clearSearch() {
    searchElement.value = '';
    state.searchTerm = '';
    filterEvents();
}

// Save current data to localStorage
function backupData() {
    try {
        const dataToSave = {
            events: state.allEvents,
            lastUpdated: new Date().toISOString(),
            version: '1.0'
        };
        
        localStorage.setItem('presidentCalendarBackup', JSON.stringify(dataToSave));
        
        showBackupStatus('✓ Data saved successfully!', 'success');
        
        setTimeout(() => {
            backupStatusElement.textContent = '';
            backupStatusElement.className = 'backup-status';
        }, 3000);
        
        return true;
    } catch (error) {
        console.error('Error saving data to localStorage:', error);
        showBackupStatus('❌ Failed to save data', 'error');
        return false;
    }
}

// Show backup status message
function showBackupStatus(message, type = 'info') {
    backupStatusElement.textContent = message;
    backupStatusElement.className = `backup-status ${type}`;
}

// Load data from localStorage (if available)
function loadBackupData() {
    try {
        const savedData = localStorage.getItem('presidentCalendarBackup');
        
        if (!savedData) {
            return null;
        }
        
        return JSON.parse(savedData);
    } catch (error) {
        console.error('Error loading backup data:', error);
        return null;
    }
}

// Render events to DOM
function renderEvents() {
    eventsContainer.innerHTML = '';
    
    if (state.filteredEvents.length === 0) {
        const noEvents = document.createElement('div');
        noEvents.textContent = 'No events found matching your criteria.';
        noEvents.style.textAlign = 'center';
        noEvents.style.gridColumn = '1 / -1';
        noEvents.style.padding = '40px 20px';
        noEvents.style.color = 'var(--muted-text-color)';
        eventsContainer.appendChild(noEvents);
        return;
    }

    const startIndex = (state.currentPage - 1) * state.eventsPerPage;
    const endIndex = startIndex + state.eventsPerPage;
    const currentPageEvents = state.filteredEvents.slice(startIndex, endIndex);
    
    // Group events by date for better organization
    const eventsByDate = {};
    
    currentPageEvents.forEach(event => {
        if (!event.date) return;
        
        const dateKey = event.date.split('T')[0]; // Get just the date part
        if (!eventsByDate[dateKey]) {
            eventsByDate[dateKey] = [];
        }
        eventsByDate[dateKey].push(event);
    });
    
    // Sort dates in reverse chronological order (newest first)
    const sortedDates = Object.keys(eventsByDate).sort((a, b) => new Date(b) - new Date(a));
    
    // Render events grouped by date
    sortedDates.forEach(dateKey => {
        // Create date section header
        const dateHeader = document.createElement('h2');
        dateHeader.className = 'event-date-section';
        dateHeader.textContent = formatDateForSection(dateKey);
        eventsContainer.appendChild(dateHeader);
        
        // Sort events within each date by time in REVERSE order (latest first)
        const sortedEvents = eventsByDate[dateKey].sort((a, b) => {
            if (!a.timeStart) return 1;
            if (!b.timeStart) return -1;
            return b.timeStart.localeCompare(a.timeStart); // Reverse order
        });
        
        // Create event list for this date
        const dateEventsList = document.createElement('div');
        dateEventsList.className = 'event-list';
        
        // Add each event card
        sortedEvents.forEach(event => {
            dateEventsList.appendChild(createEventCard(event));
        });
        
        eventsContainer.appendChild(dateEventsList);
    });
}

// Update pagination controls
function updatePagination() {
    const totalPages = Math.ceil(state.filteredEvents.length / state.eventsPerPage);
    
    pageInfoElement.textContent = `Page ${state.currentPage} of ${totalPages || 1}`;
    prevButton.disabled = state.currentPage <= 1;
    nextButton.disabled = state.currentPage >= totalPages;
    
    paginationElement.style.display = totalPages > 1 ? 'flex' : 'none';
}

// Initialize search functionality
function initializeFilters() {
    // Set up event listeners
    searchButton.addEventListener('click', () => {
        state.searchTerm = searchElement.value.trim();
        filterEvents();
    });

    searchElement.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            state.searchTerm = searchElement.value.trim();
            filterEvents();
        }
    });
    
    // Clear search button functionality
    clearSearchButton.addEventListener('click', clearSearch);
    
    // Toggle clear button visibility based on search input
    searchElement.addEventListener('input', () => {
        if (searchElement.value.trim() !== '') {
            clearSearchButton.style.display = 'block';
        } else {
            clearSearchButton.style.display = 'none';
        }
    });
    
    // Initially hide the clear button if search is empty
    clearSearchButton.style.display = searchElement.value.trim() !== '' ? 'block' : 'none';

    // Set up backup button functionality
    backupButton.addEventListener('click', backupData);

    prevButton.addEventListener('click', () => {
        if (state.currentPage > 1) {
            state.currentPage--;
            renderEvents();
            updatePagination();
        }
    });

    nextButton.addEventListener('click', () => {
        const totalPages = Math.ceil(state.filteredEvents.length / state.eventsPerPage);
        if (state.currentPage < totalPages) {
            state.currentPage++;
            renderEvents();
            updatePagination();
        }
    });
}

// Update UI based on loading/error state
function updateStatus() {
    if (state.isLoading) {
        statusElement.className = 'status-message loading';
        statusElement.textContent = 'Loading events...';
        statusElement.style.display = 'block';
        filtersContainer.style.display = 'none';
        paginationElement.style.display = 'none';
    } else if (state.hasError) {
        statusElement.className = 'status-message error';
        statusElement.textContent = state.errorMessage || 'An error occurred while loading events.';
        statusElement.style.display = 'block';
        filtersContainer.style.display = 'none';
        paginationElement.style.display = 'none';
    } else {
        statusElement.style.display = 'none';
        filtersContainer.style.display = 'flex';
        updatePagination();
    }
}

// Fetch and process data
async function fetchCalendarData() {
    try {
        state.isLoading = true;
        updateStatus();

        // Try to fetch online data first
        let data;
        let usingBackup = false;
        
        try {
            // Use the Cloudflare Worker URL
            const workerUrl = 'https://where-is-the-president.miles-gilbert.workers.dev/';
            console.log("Fetching data from:", workerUrl);
            
            const response = await fetch(workerUrl);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
            }

            const rawText = await response.text();
            
            // Try to parse the JSON
            try {
                data = JSON.parse(rawText);
            } catch (jsonError) {
                throw new Error(`Failed to parse JSON: ${jsonError.message}`);
            }
        } catch (fetchError) {
            console.warn("Failed to fetch online data, trying backup:", fetchError);
            
            // Try to load from backup
            const backupData = loadBackupData();
            
            if (backupData && backupData.events && backupData.events.length > 0) {
                console.log("Using backup data from:", backupData.lastUpdated);
                data = { data: backupData.events };
                usingBackup = true;
            } else {
                // If no backup is available, rethrow the original error
                throw fetchError;
            }
        }
        
        // Check if data has the expected structure
        if (!data) {
            throw new Error("Invalid data format received");
        }
        
        // If using backup data, show a message to the user
        if (usingBackup) {
            const backupMessage = document.createElement('div');
            backupMessage.className = 'status-message warning';
            backupMessage.textContent = 'Using locally saved data. Connect to the internet for the latest information.';
            eventsContainer.prepend(backupMessage);
        }
        
        // Process the data, being more flexible with the structure
        const events = [];
        
        // Check for different possible data structures
        if (data && Array.isArray(data)) {
            events.push(...data);
        } else if (data && data.data && Array.isArray(data.data)) {
            events.push(...data.data);
        } else if (data && typeof data === 'object') {
            Object.values(data).forEach(value => {
                if (Array.isArray(value)) {
                    value.forEach(item => {
                        if (item && typeof item === 'object' && (item.title || item.date)) {
                            events.push(item);
                        }
                    });
                }
            });
        }
        
        if (events.length === 0) {
            throw new Error("No events found in the data");
        }
        
        // Filter out events without dates and normalize
        state.allEvents = events
            .filter(event => event.date || event.startDate || event.start)
            .map(event => {
                // Normalize the data structure
                const normalizedEvent = {
                    date: event.date || event.startDate || event.start,
                    timeStart: event.timeStart || event.time || (event.startTime ? event.startTime : null),
                    timeEnd: event.timeEnd || event.endTime || null,
                    title: event.title || event.summary || event.name || "Untitled Event",
                    location: event.location || event.venue || "",
                    description: event.description || event.details || "",
                    type: event.type || event.source || event.category || "",
                    url: event.url || event.link || ""
                };
                
                // Ensure the date is valid and has correct day of week
                try {
                    // Add time (noon) to ensure consistent timezone handling
                    let dateStr = normalizedEvent.date;
                    if (!dateStr.includes('T')) {
                        dateStr = `${dateStr}T12:00:00`;
                    }
                    
                    const eventDate = new Date(dateStr);
                    // If the date is valid, make sure we use the correct format
                    if (!isNaN(eventDate.getTime())) {
                        // Store the date in consistent format with manual UTC handling
                        // to avoid timezone issues
                        const year = eventDate.getFullYear();
                        const month = String(eventDate.getMonth() + 1).padStart(2, '0');
                        const day = String(eventDate.getDate()).padStart(2, '0');
                        normalizedEvent.date = `${year}-${month}-${day}`;
                    }
                } catch (e) {
                    console.warn("Error processing date:", normalizedEvent.date);
                }
                
                return normalizedEvent;
            });
        
        // Sort by date, newest first
        state.allEvents.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Extract event types
        state.allEvents.forEach(event => {
            if (event.type) {
                state.eventTypes.add(event.type);
            }
        });
        
        state.filteredEvents = [...state.allEvents];
        
        // Update last updated timestamp
        if (data.meta && data.meta.last_updated) {
            const lastUpdated = new Date(data.meta.last_updated);
            lastUpdatedElement.textContent = `Last updated: ${lastUpdated.toLocaleString()}`;
        } else {
            lastUpdatedElement.textContent = `Last updated: ${new Date().toLocaleString()}`;
        }
        
        // Initialize UI
        initializeFilters();
        renderEvents();
        
    } catch (error) {
        console.error('Error fetching calendar data:', error);
        state.hasError = true;
        state.errorMessage = error.message;
    } finally {
        state.isLoading = false;
        updateStatus();
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    try {
        fetchCalendarData();
    } catch(e) {
        console.error("Error initializing application:", e);
        const errorElement = document.createElement('div');
        errorElement.className = 'status-message error';
        errorElement.textContent = 'There was an error initializing the application. Please try refreshing the page.';
        document.querySelector('.container').prepend(errorElement);
    }
});