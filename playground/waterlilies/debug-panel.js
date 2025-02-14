// Global simulation parameters
window.simulationParams = {
    dampening: 0.899,
    fishSpeed: { min: 2, max: 4 },
    fishDartSpeed: { min: 6, max: 8 },
    dartChance: 0.005,
    lilyReproductionChance: 0.01,
    lilyEnergyDrain: 0.02,
    lilyEnergyGain: 0.03,
    showStats: false
};

// Helper function to setup dual sliders (min/max pairs)
function setupDualSlider(minId, maxId, displayId, onMinChange, onMaxChange) {
    const minSlider = document.getElementById(minId);
    const maxSlider = document.getElementById(maxId);
    const display = document.getElementById(displayId);

    if (!minSlider || !maxSlider || !display) {
        console.error(`Could not find elements for dual slider: ${minId}, ${maxId}, ${displayId}`);
        return;
    }

    function updateDisplay() {
        display.textContent = `${parseFloat(minSlider.value).toFixed(1)}-${parseFloat(maxSlider.value).toFixed(1)}`;
    }

    minSlider.addEventListener('input', function(e) {
        const value = parseFloat(e.target.value);
        if (value <= parseFloat(maxSlider.value)) {
            onMinChange(value);
            updateDisplay();
        }
    });

    maxSlider.addEventListener('input', function(e) {
        const value = parseFloat(e.target.value);
        if (value >= parseFloat(minSlider.value)) {
            onMaxChange(value);
            updateDisplay();
        }
    });

    // Initial display update
    updateDisplay();
}

// Helper function to setup single sliders
function setupSlider(id, onChange) {
    console.log(`Setting up slider for ${id}`);
    const slider = document.getElementById(id);
    const display = document.getElementById(`${id}Value`);
    
    if (!slider || !display) {
        console.error(`Could not find elements for slider: ${id}`);
        return;
    }

    console.log(`Found slider and display elements for ${id}`);
    
    function onInput(e) {
        console.log(`Slider ${id} changed to ${e.target.value}`);
        const value = parseFloat(e.target.value);
        display.textContent = value.toFixed(3);
        onChange(value);
    }

    slider.addEventListener('input', onInput);
    slider.addEventListener('change', onInput);
    slider.addEventListener('mousedown', () => console.log(`Mousedown on ${id}`));
    slider.addEventListener('mouseup', () => console.log(`Mouseup on ${id}`));

    // Initial display update
    display.textContent = parseFloat(slider.value).toFixed(3);
    console.log(`Initialized ${id} with value ${slider.value}`);
}

// Setup all event listeners
function setupEventListeners() {
    // Panel toggle
    const debugHeader = document.querySelector('.debug-header');
    const debugContent = document.getElementById('debugContent');
    const toggleIcon = document.getElementById('toggleIcon');
    
    if (debugHeader && debugContent && toggleIcon) {
        debugHeader.addEventListener('click', () => {
            debugContent.classList.toggle('collapsed');
            toggleIcon.textContent = debugContent.classList.contains('collapsed') ? '▲' : '▼';
        });
    }

    // Water Physics
    setupSlider('dampening', value => {
        window.simulationParams.dampening = value;
        window.dampening = value; // Update the simulation variable
    });

    // Fish Speed Controls
    setupDualSlider('fishMinSpeed', 'fishMaxSpeed', 'fishSpeedValue', 
        value => window.simulationParams.fishSpeed.min = value,
        value => window.simulationParams.fishSpeed.max = value
    );

    setupDualSlider('fishDartMinSpeed', 'fishDartMaxSpeed', 'fishDartSpeedValue',
        value => window.simulationParams.fishDartSpeed.min = value,
        value => window.simulationParams.fishDartSpeed.max = value
    );

    // Dart Chance
    setupSlider('dartChance', value => {
        window.simulationParams.dartChance = value;
    });

    // Lily Controls
    setupSlider('lilyReproductionChance', value => {
        window.simulationParams.lilyReproductionChance = value;
    });

    setupSlider('lilyEnergyDrain', value => {
        window.simulationParams.lilyEnergyDrain = value;
    });

    setupSlider('lilyEnergyGain', value => {
        window.simulationParams.lilyEnergyGain = value;
    });

    // Show Stats Toggle
    const statsCheckbox = document.getElementById('showStats');
    if (statsCheckbox) {
        statsCheckbox.addEventListener('change', function(e) {
            window.simulationParams.showStats = e.target.checked;
        });
    }
}

// Create and initialize the debug panel
function createDebugPanel() {
    const existingPanel = document.getElementById('debugPanel');
    if (existingPanel) {
        existingPanel.remove();
    }

    const debugPanel = document.createElement('div');
    debugPanel.id = 'debugPanel';
    debugPanel.className = 'debug-panel';
    
    debugPanel.innerHTML = `
        <div class="debug-header">
            Debug Controls <span id="toggleIcon">▼</span>
        </div>
        <div id="debugContent" class="debug-content">
            <div class="parameter-group">
                <h3>Water Physics</h3>
                <div class="parameter-control">
                    <label for="dampening">Dampening: <span id="dampeningValue" class="value-display">0.899</span></label>
                    <input type="range" id="dampening" min="0.5" max="0.99" step="0.001" value="0.899">
                </div>
            </div>

            <div class="parameter-group">
                <h3>Fish Settings</h3>
                <div class="parameter-control">
                    <label>Base Speed: <span id="fishSpeedValue" class="value-display">2-4</span></label>
                    <div class="dual-slider">
                        <input type="range" id="fishMinSpeed" min="0.5" max="5" step="0.1" value="2">
                        <input type="range" id="fishMaxSpeed" min="1" max="8" step="0.1" value="4">
                    </div>
                </div>
                <div class="parameter-control">
                    <label>Dart Speed: <span id="fishDartSpeedValue" class="value-display">6-8</span></label>
                    <div class="dual-slider">
                        <input type="range" id="fishDartMinSpeed" min="4" max="10" step="0.1" value="6">
                        <input type="range" id="fishDartMaxSpeed" min="5" max="12" step="0.1" value="8">
                    </div>
                </div>
                <div class="parameter-control">
                    <label for="dartChance">Dart Chance: <span id="dartChanceValue" class="value-display">0.005</span></label>
                    <input type="range" id="dartChance" min="0" max="0.02" step="0.001" value="0.005">
                </div>
            </div>

            <div class="parameter-group">
                <h3>Lily Settings</h3>
                <div class="parameter-control">
                    <label for="lilyReproductionChance">Reproduction Chance: <span id="lilyReproductionChanceValue" class="value-display">0.01</span></label>
                    <input type="range" id="lilyReproductionChance" min="0" max="0.05" step="0.001" value="0.01">
                </div>
                <div class="parameter-control">
                    <label for="lilyEnergyDrain">Energy Drain: <span id="lilyEnergyDrainValue" class="value-display">0.02</span></label>
                    <input type="range" id="lilyEnergyDrain" min="0" max="0.1" step="0.001" value="0.02">
                </div>
                <div class="parameter-control">
                    <label for="lilyEnergyGain">Energy Gain: <span id="lilyEnergyGainValue" class="value-display">0.03</span></label>
                    <input type="range" id="lilyEnergyGain" min="0" max="0.1" step="0.001" value="0.03">
                </div>
            </div>

            <div class="parameter-group">
                <h3>Display Settings</h3>
                <div class="parameter-control">
                    <label for="showStats">
                        Show Stats
                        <input type="checkbox" id="showStats">
                    </label>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(debugPanel);
    
    // Setup event listeners after the panel is in the DOM
    setupEventListeners();
}

// Initialize when the document is loaded
function initDebugPanel() {
    console.log('Initializing debug panel');
    createDebugPanel();
    console.log('Debug panel created');
}

if (document.readyState === 'loading') {
    console.log('Document still loading, waiting for DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', initDebugPanel);
} else {
    console.log('Document already loaded, creating panel immediately');
    initDebugPanel();
}

// Also create panel when p5.js setup runs
if (typeof window.setup === 'function') {
    const originalSetup = window.setup;
    window.setup = function() {
        originalSetup.call(this);
        console.log('Creating debug panel after p5.js setup');
        initDebugPanel();
    };
}