// Time management system
class TimeController {
    constructor() {
        this.startYear = 1897;
        this.endYear = 1926;
        this.currentDate = new Date(this.startYear, 0, 1);
        this.isPlaying = false;
        this.timeSpeed = 1; // months per second
        this.lastUpdate = Date.now();
        
        // Chapter/milestone system
        this.milestones = [
            {
                date: new Date(1897, 5, 1), // June 1897
                id: 'giverny-purchase',
                title: 'Purchase of Giverny',
                triggered: false
            },
            {
                date: new Date(1899, 3, 15), // April 1899
                id: 'water-garden-start',
                title: 'Water Garden Construction Begins',
                triggered: false
            },
            {
                date: new Date(1900, 8, 1), // September 1900
                id: 'first-lilies',
                title: 'First Water Lilies Planted',
                triggered: false
            },
            {
                date: new Date(1914, 6, 1), // July 1914
                id: 'large-studio',
                title: 'Large Studio Construction',
                triggered: false
            },
            {
                date: new Date(1922, 11, 15), // December 1922
                id: 'grandes-decorations',
                title: 'Grandes Décorations Installation',
                triggered: false
            }
        ];

        // Initialize DOM elements
        this.initializeDOM();
        this.setupEventListeners();
    }

    initializeDOM() {
        // Update existing date display element
        this.dateDisplay = document.getElementById('currentDate');
        
        // Update play/pause button
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.updatePlayPauseButton();
    }

    setupEventListeners() {
        this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
    }

    togglePlayPause() {
        this.isPlaying = !this.isPlaying;
        this.lastUpdate = Date.now();
        this.updatePlayPauseButton();
    }

    updatePlayPauseButton() {
        // Update button icon based on state
        this.playPauseBtn.innerHTML = this.isPlaying ? 
            '<svg class="pause" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ffffff" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>' :
            '<svg class="arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ffffff" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 5v14l11-7z" width="20" height="20"></path></svg>';
    }

    update() {
        if (!this.isPlaying) return;

        const now = Date.now();
        const deltaTime = (now - this.lastUpdate) / 1000; // Convert to seconds
        this.lastUpdate = now;

        // Update current date
        const monthsToAdd = deltaTime * this.timeSpeed;
        this.currentDate.setMonth(this.currentDate.getMonth() + monthsToAdd);

        // Check if we've reached the end date
        if (this.currentDate.getFullYear() > this.endYear) {
            this.currentDate = new Date(this.endYear, 11, 31);
            this.isPlaying = false;
            this.updatePlayPauseButton();
        }

        // Update display
        this.updateDateDisplay();
        
        // Check milestones
        this.checkMilestones();
    }

    updateDateDisplay() {
        const monthNames = [
            'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
        ];
        
        const month = monthNames[this.currentDate.getMonth()];
        const year = this.currentDate.getFullYear();
        this.dateDisplay.textContent = `${month} ${year}`;
    }

    checkMilestones() {
        for (let milestone of this.milestones) {
            if (!milestone.triggered && this.currentDate >= milestone.date) {
                milestone.triggered = true;
                this.triggerMilestone(milestone);
            }
        }
    }

    triggerMilestone(milestone) {
        // Pause the simulation
        this.isPlaying = false;
        this.updatePlayPauseButton();

        // Dispatch custom event for milestone trigger
        const event = new CustomEvent('milestone-triggered', {
            detail: milestone
        });
        document.dispatchEvent(event);
    }

    getCurrentDate() {
        return this.currentDate;
    }

    setTimeSpeed(speed) {
        this.timeSpeed = speed;
    }
}

// Export the controller
export const timeController = new TimeController();

// Update the main game loop
let lastFrameTime = 0;
function gameLoop(currentTime) {
    const deltaTime = currentTime - lastFrameTime;
    lastFrameTime = currentTime;

    // Update time controller
    timeController.update();

    requestAnimationFrame(gameLoop);
}

// Start the game loop
requestAnimationFrame(gameLoop);