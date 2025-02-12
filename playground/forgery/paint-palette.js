class PaintPalette extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        
        // Component state
        this.paints = [];
        this.selectedTube = null;
        this.mixing = false;
        this.lastMixPos = null;
        this.recentColors = [];
        this.MAX_RECENT_COLORS = 10;
        
        // Setup the component
        this.setupComponent();
    }

    setupComponent() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .paint-tubes {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
                    gap: 10px;
                    margin-bottom: 20px;
                    padding: 20px;
                    background: #f8f8f8;
                    border-radius: 8px;
                }
                .paint-tube {
                    width: 60px;
                    height: 80px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    position: relative;
                    transition: transform 0.1s;
                }
                .paint-tube:active {
                    transform: scale(0.95);
                }
                .paint-tube::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 20px;
                    height: 10px;
                    background: #ddd;
                    border-radius: 0 0 10px 10px;
                }
                .controls {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 20px;
                }
                .btn {
                    padding: 8px 16px;
                    background: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                .btn:hover {
                    opacity: 0.9;
                }
                .canvas-container {
                    position: relative;
                    margin-bottom: 20px;
                    visibility: visible !important;
                }
                .canvas-container canvas {
                    visibility: visible !important;
                    display: block;
                }
                .current-color {
                    margin-top: 20px;
                }
                .color-preview {
                    width: 60px;
                    height: 60px;
                    border: 2px solid #ddd;
                    border-radius: 4px;
                    margin-bottom: 10px;
                }
                .recent-colors {
                    display: grid;
                    grid-template-columns: repeat(5, 1fr);
                    gap: 10px;
                    margin-top: 20px;
                    padding: 15px;
                    background: #f8f8f8;
                    border-radius: 8px;
                }
                .recent-color {
                    width: 40px;
                    height: 40px;
                    border: 2px solid #ddd;
                    border-radius: 4px;
                    cursor: pointer;
                }
                .recent-color:hover {
                    transform: scale(1.1);
                }
            </style>
            <div class="paint-tubes">
                <button class="paint-tube" style="background: #FF0000" data-color="[255,0,0]"></button>
                <button class="paint-tube" style="background: #FFFF00" data-color="[255,255,0]"></button>
                <button class="paint-tube" style="background: #0000FF" data-color="[0,0,255]"></button>
                <button class="paint-tube" style="background: #FFFFFF" data-color="[255,255,255]"></button>
                <button class="paint-tube" style="background: #000000" data-color="[0,0,0]"></button>
                <button class="paint-tube" style="background: #FF9900" data-color="[255,153,0]"></button>
                <button class="paint-tube" style="background: #800080" data-color="[128,0,128]"></button>
                <button class="paint-tube" style="background: #008000" data-color="[0,128,0]"></button>
            </div>

            <div class="controls">
                <button class="btn" id="clearPalette">Clear Palette</button>
            </div>

            <div class="canvas-container" id="canvas-container"></div>

            <div class="current-color">
                <h3>Current Color</h3>
                <div class="color-preview" id="currentColor"></div>
            </div>

            <div class="recent-colors-section">
                <h3>Recent Colors</h3>
                <div class="recent-colors" id="recentColors"></div>
            </div>
        `;

        // Initialize p5 instance
        this.initializeP5();
        this.setupEventListeners();
    }

    initializeP5() {
        const sketch = (p) => {
            let canvas;
            let palette;

            p.setup = () => {
                console.log('Setting up p5 canvas');
                canvas = p.createCanvas(600, 400);
                canvas.parent(this.shadowRoot.getElementById('canvas-container'));
                // Ensure canvas is visible
                canvas.style('visibility', 'visible');
                canvas.style('display', 'block');
                palette = p.createGraphics(p.width, p.height);
                this.clearPalette(p, palette);
            };

            p.draw = () => {
                p.image(palette, 0, 0);
                this.drawPaints(p);

                if (p.mouseIsPressed && 
                    p.mouseX > 0 && p.mouseX < p.width && 
                    p.mouseY > 0 && p.mouseY < p.height) {
                    this.mixing = true;
                    this.mixPaints(p);
                } else {
                    this.mixing = false;
                    this.lastMixPos = null;
                }
            };

            this.p5Instance = p;
        };

        new p5(sketch);
    }

    setupEventListeners() {
        this.shadowRoot.querySelectorAll('.paint-tube').forEach(tube => {
            tube.addEventListener('click', () => {
                this.shadowRoot.querySelectorAll('.paint-tube').forEach(t => 
                    t.style.outline = 'none'
                );
                
                if (this.selectedTube === tube) {
                    this.selectedTube = null;
                    tube.style.outline = 'none';
                    this.p5Instance.cursor(this.p5Instance.ARROW);
                } else {
                    this.selectedTube = tube;
                    tube.style.outline = '3px solid #333';
                    this.p5Instance.cursor('crosshair');
                }
            });
        });

        this.shadowRoot.getElementById('clearPalette').addEventListener('click', () => {
            this.clearPalette(this.p5Instance, this.p5Instance.createGraphics(this.p5Instance.width, this.p5Instance.height));
        });

        // Canvas click handler for adding paint
        this.shadowRoot.getElementById('canvas-container').addEventListener('mousedown', (event) => {
            if (this.selectedTube) {
                const rect = event.target.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;
                
                if (x > 0 && x < this.p5Instance.width && y > 0 && y < this.p5Instance.height) {
                    const color = JSON.parse(this.selectedTube.dataset.color);
                    this.paints.push(new Paint(x, y, color));
                    this.selectedTube.style.outline = 'none';
                    this.selectedTube = null;
                    this.p5Instance.cursor(this.p5Instance.ARROW);
                }
            }
        });
    }

    clearPalette(p, palette) {
        palette.background(240);
        palette.loadPixels();
        for (let i = 0; i < palette.width; i++) {
            for (let j = 0; j < palette.height; j++) {
                let noise = p.map(palette.noise(i * 0.02, j * 0.02), 0, 1, -20, 20);
                let brown = p.color(139 + noise, 69 + noise, 19 + noise);
                palette.set(i, j, brown);
            }
        }
        palette.updatePixels();
        this.paints = [];
    }

    drawPaints(p) {
        this.paints.forEach(paint => {
            const c = p.color(paint.color[0], paint.color[1], paint.color[2]);
            p.noStroke();
            p.fill(c);
            p.circle(paint.x, paint.y, paint.radius * 2 * paint.amount);
        });
    }

    mixPaints(p) {
        if (!this.lastMixPos) {
            this.lastMixPos = { x: p.mouseX, y: p.mouseY };
            return;
        }

        const dx = p.mouseX - this.lastMixPos.x;
        const dy = p.mouseY - this.lastMixPos.y;
        const distance = p.sqrt(dx * dx + dy * dy);
        const steps = p.max(1, p.floor(distance / 5));

        for (let i = 0; i < steps; i++) {
            const x = p.lerp(this.lastMixPos.x, p.mouseX, i / steps);
            const y = p.lerp(this.lastMixPos.y, p.mouseY, i / steps);
            
            let mixedColor = [0, 0, 0];
            let totalWeight = 0;

            this.paints = this.paints.filter(paint => paint.amount > 0.1);

            this.paints.forEach(paint => {
                const d = p.dist(x, y, paint.x, paint.y);
                if (d < paint.radius * 2) {
                    const weight = 1 - (d / (paint.radius * 2));
                    totalWeight += weight;
                    
                    mixedColor[0] += paint.color[0] * weight;
                    mixedColor[1] += paint.color[1] * weight;
                    mixedColor[2] += paint.color[2] * weight;

                    const angle = p.atan2(y - paint.y, x - paint.x);
                    const moveAmount = 0.5;
                    paint.x += p.cos(angle) * moveAmount;
                    paint.y += p.sin(angle) * moveAmount;
                    paint.amount *= 0.995;
                }
            });

            if (totalWeight > 0) {
                mixedColor = mixedColor.map(c => c / totalWeight);
                const newPaint = new Paint(x, y, mixedColor, 0.5);
                newPaint.radius = 10;
                this.paints.push(newPaint);
                
                const rgbColor = `rgb(${Math.round(mixedColor[0])},${Math.round(mixedColor[1])},${Math.round(mixedColor[2])})`;
                this.shadowRoot.getElementById('currentColor').style.backgroundColor = rgbColor;
                this.addToRecentColors(mixedColor);
                
                // Dispatch color selected event
                this.dispatchEvent(new CustomEvent('colorselected', {
                    detail: { color: rgbColor },
                    bubbles: true,
                    composed: true
                }));
            }
        }

        this.lastMixPos = { x: p.mouseX, y: p.mouseY };
    }

    addToRecentColors(color) {
        const rgbStr = `rgb(${Math.round(color[0])},${Math.round(color[1])},${Math.round(color[2])})`;
        if (!this.recentColors.includes(rgbStr)) {
            this.recentColors.unshift(rgbStr);
            if (this.recentColors.length > this.MAX_RECENT_COLORS) {
                this.recentColors.pop();
            }
            this.updateRecentColorsDisplay();
        }
    }

    updateRecentColorsDisplay() {
        const container = this.shadowRoot.getElementById('recentColors');
        container.innerHTML = '';
        this.recentColors.forEach(color => {
            const colorBtn = document.createElement('button');
            colorBtn.className = 'recent-color';
            colorBtn.style.backgroundColor = color;
            colorBtn.addEventListener('click', () => {
                this.shadowRoot.getElementById('currentColor').style.backgroundColor = color;
                this.dispatchEvent(new CustomEvent('colorselected', {
                    detail: { color },
                    bubbles: true,
                    composed: true
                }));
            });
            container.appendChild(colorBtn);
        });
    }
}

class Paint {
    constructor(x, y, color, amount = 1.0) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.amount = amount;
        this.radius = 20;
    }
}

// Register the custom element
customElements.define('paint-palette', PaintPalette);