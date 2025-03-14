import { SHAPES } from './Config.js';

export class UI {
    constructor(gameState) {
        this.gameState = gameState;
        this.isRandomColor = true;
        this.currentPickedColor = [255, 100, 100];
        this.currentShape = 'circle';
        this.setupUI();
    }

    setupUI() {
        this.setupElements();
        this.setupColorControls();
        this.setupShapeControls();
        this.setupActionButtons();
        this.setupHelpButton();
    }

    setupElements() {
        this.elements = {
            particleCount: document.getElementById('particleCount'),
            instructions: document.getElementById('instructions'),
            shapeSelectBtn: document.getElementById('shapeSelectBtn'),
            currentColor: document.getElementById('currentColor'),
            colorPickerInput: document.getElementById('colorPickerInput'),
            cutBtn: document.getElementById('cutBtn'),
            lockBtn: document.getElementById('lockBtn'),
            clearBtn: document.getElementById('clearBtn'),
            helpBtn: document.getElementById('helpBtn'),
            toolbar: document.getElementById('toolbar')
        };
    }

    setupColorControls() {
        // Initialize color picker with a random color
        const initialR = Math.floor(random(0, 255));
        const initialG = Math.floor(random(0, 255));
        const initialB = Math.floor(random(0, 255));
        this.currentPickedColor = [initialR, initialG, initialB];
        this.elements.colorPickerInput.value = this.rgbToHex(initialR, initialG, initialB);
        
        this.elements.currentColor.addEventListener('click', () => this.toggleColorMode());
        this.elements.colorPickerInput.addEventListener('input', (event) => this.handleColorPick(event));
    }

    setupShapeControls() {
        this.elements.shapeSelectBtn.addEventListener('click', () => {
            this.currentShape = SHAPES[(SHAPES.indexOf(this.currentShape) + 1) % SHAPES.length];
            let shapeName = this.currentShape === 'triangle' ? 'change_history' : this.currentShape;
            this.elements.shapeSelectBtn.innerHTML = `<span class="material-symbols-outlined">${shapeName}</span>`;
        });
    }

    setupActionButtons() {
        this.elements.cutBtn.addEventListener('click', () => {
            if (this.gameState.selectedParticles.length > 0) {
                this.gameState.removeSelectedParticles();
            }
        });

        this.elements.clearBtn.addEventListener('click', () => {
            this.gameState.clearAllParticles();
        });

        this.elements.lockBtn.addEventListener('click', () => {
            if (this.gameState.selectedParticles.length > 0) {
                this.gameState.toggleSelectedParticlesLock();
            }
        });
    }

    setupHelpButton() {
        this.elements.helpBtn.addEventListener('click', () => this.toggleHelpModal());
    }

    toggleColorMode() {
        if (this.isRandomColor) {
            // Switch to custom color mode
            this.isRandomColor = false;
            this.elements.currentColor.classList.remove('rainbow-bg');
            this.elements.currentColor.style.backgroundColor = 
                `rgb(${this.currentPickedColor[0]}, ${this.currentPickedColor[1]}, ${this.currentPickedColor[2]})`;
            this.elements.colorPickerInput.click();
        } else {
            // Switch back to random color mode
            this.isRandomColor = true;
            this.elements.currentColor.classList.add('rainbow-bg');
            this.elements.currentColor.style.backgroundColor = '';
        }
    }

    handleColorPick(event) {
        const hexColor = event.target.value;
        this.currentPickedColor = this.hexToRgb(hexColor);
        
        if (!this.isRandomColor) {
            this.elements.currentColor.style.backgroundColor = 
                `rgb(${this.currentPickedColor[0]}, ${this.currentPickedColor[1]}, ${this.currentPickedColor[2]})`;
        }
    }

    updateParticleCount(count) {
        this.elements.particleCount.innerHTML = count;
        this.elements.instructions.style.display = count === 0 ? 'block' : 'none';
        this.elements.clearBtn.classList.toggle('disabled', count === 0);
    }

    updateSelectionButtons(hasSelection) {
        this.elements.cutBtn.classList.toggle('disabled', !hasSelection);
        this.elements.lockBtn.classList.toggle('disabled', !hasSelection);
    }

    // Helper functions for color conversion
    rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (Math.floor(r) << 16) + (Math.floor(g) << 8) + Math.floor(b)).toString(16).slice(1);
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : [0, 0, 0];
    }

    toggleHelpModal() {
        let helpModal = document.getElementById('helpModal');
        
        if (helpModal) {
            helpModal.style.display = helpModal.style.display === 'none' ? 'flex' : 'none';
            return;
        }
        
        helpModal = this.createHelpModal();
        document.body.appendChild(helpModal);
        
        document.getElementById('closeHelpBtn').addEventListener('click', () => {
            helpModal.style.display = 'none';
        });
        
        helpModal.addEventListener('click', (event) => {
            if (event.target === helpModal) {
                helpModal.style.display = 'none';
            }
        });
    }

    createHelpModal() {
        const modal = document.createElement('div');
        modal.id = 'helpModal';
        modal.classList.add('help-modal');
        
        const content = document.createElement('div');
        content.classList.add('help-content');
        
        const mobileTips = this.isMobileDevice() ? this.getMobileTipsHTML() : '';
        content.innerHTML = this.getHelpContentHTML(mobileTips);
        
        modal.appendChild(content);
        return modal;
    }

    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
            || window.innerWidth <= 768;
    }

    getMobileTipsHTML() {
        return `
            <p>Mobile Gestures</p>
            <table>
                <tr><td><b>Tap</b></td><td>Create particles or select/deselect a particle</td></tr>
                <tr><td><b>Long Press</b></td><td>Select all particles in the area</td></tr>
                <tr><td><b>Two-Finger Tap</b></td><td>Remove particles in a circular area</td></tr>
                <tr><td><b>Three-Finger Tap</b></td><td>Remove all unlocked particles</td></tr>
                <tr><td><b>Pinch</b></td><td>Adjust number of particles per spawn</td></tr>
                <tr><td><b>Floating Button</b></td><td>Access mobile-specific controls</td></tr>
            </table>
        `;
    }

    getHelpContentHTML(mobileTips) {
        return `
            <p>Hotkeys</p>
            <table>
                <!-- ... rest of the help content HTML ... -->
            </table>
            
            <div class="tip">
                <b>Tip:</b> Click on particles to select them individually. Hold Shift and drag to select multiple particles at once.
            </div>
            
            <p>Toolbar</p>
            <table>
                <!-- ... toolbar content HTML ... -->
            </table>
            
            ${mobileTips}
            
            <div class="tip">
                <b>Creative tip:</b> Try locking some particles in place to create obstacles, then spawn more particles to interact with them!
            </div>
            
            <button id="closeHelpBtn">Got it!</button>
        `;
    }
} 