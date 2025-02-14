let cols;
let rows;
let current;
let previous;
let dampening = 0.899;
let rocks = [];
let lilies = [];
let fish = [];
let tiltAngle = { x: 0, y: 0 };
let placeMode = 'rock'; // 'rock' or 'lily'
let isMobile = false;
let splashSound;
let bubbleSound;
let audioContext;
let splashBuffer;

async function loadSounds() {
    try {
        const response = await fetch('splash1.wav');
        const arrayBuffer = await response.arrayBuffer();
        splashBuffer = await audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
        console.error('Error loading sound:', error);
    }
}

function createSplashSound() {
    if (!splashBuffer) return;
    
    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();
    
    source.buffer = splashBuffer;
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Random slight pitch variation for variety
    source.playbackRate.value = 0.9 + Math.random() * 0.2;
    
    gainNode.gain.setValueAtTime(0.7, audioContext.currentTime);
    source.start();
}

function createClickSound() {
    const clickOsc = audioContext.createOscillator();
    const clickGain = audioContext.createGain();
    const noiseNode = audioContext.createBufferSource();
    const noiseGain = audioContext.createGain();
    
    const bufferSize = audioContext.sampleRate * 0.1;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    noiseNode.buffer = buffer;
    noiseNode.connect(noiseGain);
    clickOsc.connect(clickGain);
    noiseGain.connect(audioContext.destination);
    clickGain.connect(audioContext.destination);
    
    const time = audioContext.currentTime;
    
    clickOsc.frequency.setValueAtTime(2000, time);
    clickGain.gain.setValueAtTime(0, time);
    clickGain.gain.linearRampToValueAtTime(0.3, time + 0.005);
    clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
    
    noiseGain.gain.setValueAtTime(0, time);
    noiseGain.gain.linearRampToValueAtTime(0.15, time + 0.001);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    
    clickOsc.start(time);
    clickOsc.stop(time + 0.03);
    noiseNode.start(time);
    noiseNode.stop(time + 0.05);
}

class Fish {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = random(15, 25);
        this.angle = random(TWO_PI);
        this.velocity = random(2, 4);
        this.targetVelocity = this.velocity;
        this.turnSpeed = 0;
        this.color = color(random([
            '#FF6B6B', // Red
            '#4ECDC4', // Turquoise
            '#FFD93D', // Yellow
            '#95E1D3'  // Mint
        ]));
        this.lastRippleTime = 0;
        this.carryingPollen = false;
        this.pollenSourceLily = null;
    }

    update() {
        // Natural swimming motion
        this.turnSpeed = noise(frameCount * 0.02, this.x * 0.01, this.y * 0.01) - 0.5;
        this.angle += this.turnSpeed * 0.1;
        
        // Randomly dart occasionally
        if (random(1) < 0.005) { // 0.5% chance each frame
            this.targetVelocity = random(6, 8); // Start darting
        }
        
        // Smooth velocity transition
        this.velocity = lerp(this.velocity, this.targetVelocity, 0.1);
        
        // Create ripples when moving fast
        if (this.velocity > 5) {
            // Convert position to grid coordinates
            let gridX = Math.floor(this.x / 4);
            let gridY = Math.floor(this.y / 4);
            
            // Only create ripple every few frames to avoid overwhelming the system
            if (frameCount - this.lastRippleTime > 5) {
                if (gridX > 0 && gridX < cols - 1 && gridY > 0 && gridY < rows - 1) {
                    previous[gridX][gridY] = 200;
                    this.lastRippleTime = frameCount;
                }
            }
            
            // Gradually return to normal speed
            this.targetVelocity = lerp(this.targetVelocity, random(2, 4), 0.02);
        }
        
        // Update position
        this.x += cos(this.angle) * this.velocity;
        this.y += sin(this.angle) * this.velocity;
        
        // Wrap around screen
        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;
        
        // Interact with lilies for pollination
        for (let lily of lilies) {
            let d = dist(this.x, this.y, lily.x, lily.y);
            if (d < lily.size) {
                // Check for pollination interactions
                if (lily.hasFlower && !this.carryingPollen && lily !== this.pollenSourceLily) {
                    this.carryingPollen = true;
                    this.pollenSourceLily = lily;
                } else if (this.carryingPollen && lily !== this.pollenSourceLily) {
                    // Try to pollinate
                    if (lily.hasFlower) {
                        // 1% chance to spawn new lily
                        if (random(1) < 0.01) {
                            let newX = lily.x + random(-20, 20);
                            let newY = lily.y + random(-20, 20);
                            lilies.push(new WaterLily(newX, newY));
                        }
                    } else {
                        // 1.5% chance to spawn flower on target lily
                        if (random(1) < 0.015) {
                            lily.hasFlower = true;
                        }
                    }
                    this.carryingPollen = false;
                    this.pollenSourceLily = null;
                }
                
                // Steer away from lily
                let angle = atan2(this.y - lily.y, this.x - lily.x);
                this.angle = lerp(this.angle, angle, 0.2);
            }
        }
        
        // Avoid rocks
        for (let rock of rocks) {
            let d = dist(this.x, this.y, rock.x, rock.y);
            if (d < rock.size) {
                // Steer away from rock
                let angle = atan2(this.y - rock.y, this.x - rock.x);
                this.angle = lerp(this.angle, angle, 0.2);
            }
        }
    }

    draw() {
        push();
        translate(this.x, this.y);
        rotate(this.angle);
        
        // Draw fish body with transparency
        let c = color(red(this.color), green(this.color), blue(this.color), 100); // 180/255 opacity
        fill(c);
        noStroke();
        
        // Body
        rect(-this.size, -this.size/2, this.size * 1.5, this.size, 4);
        
        // Tail
        triangle(
            -this.size, -this.size/2,
            -this.size, this.size/2,
            -this.size * 1.5, 0
        );
        
        // Eye
        if (this.carryingPollen) { // Show eye if carrying pollen
            fill(255);
            noStroke();
            circle(0, 0, this.size/4);
        } else {
            fill(0);
            noStroke();
            circle(0, 0, this.size/4);
        }
        
        pop();
    }
}
class WaterLily {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.originalX = x;  // Store original position
        this.originalY = y;
        this.targetX = x;
        this.targetY = y;
        this.size = random(60, 100);
        this.rotation = random(TWO_PI);
        this.vx = 0;
        this.vy = 0;
        this.hasFlower = random() < 0.5;
        
        this.fishForceX = 0;
        this.fishForceY = 0;
        this.rotationVelocity = 0;
        
        // Lifecycle properties
        this.lastReproductionTime = frameCount;
        this.age = 0;
        this.maturityAge = 1200;
        this.energy = 400;
        this.maxAge = random(7200 / fish.length, 10000 / fish.length);
        this.decompositionStage = 0;
        this.decompositionTime = 0;
        this.shouldRemove = false;
    }

    update(rippleForce) {
        this.age++;
        
        // Energy management
        if (this.energy > 0) {
            this.energy -= 0.02;
            if (this.hasFlower && this.age < this.maxAge * 0.7) {
                this.energy += 0.03;
            }
        } else if (this.hasFlower) {
            this.hasFlower = false;
        }

        // Age-based decomposition
        if (this.age > this.maxAge * 0.7 && this.decompositionStage === 0) {
            this.decompositionStage = 1;
        } else if (this.age > this.maxAge && this.decompositionStage === 1) {
            this.decompositionStage = 2;
            this.decompositionTime = frameCount;
        }

        // Mark for removal after decomposition period
        if (this.decompositionStage === 2 && frameCount - this.decompositionTime > 300) {
            this.shouldRemove = true;
            let gridX = Math.floor(this.x / 4);
            let gridY = Math.floor(this.y / 4);
            if (gridX > 0 && gridX < cols - 1 && gridY > 0 && gridY < rows - 1) {
                previous[gridX][gridY] = 100;
            }
            return;
        }
        
        // Fish interaction forces - reduced strength
        this.fishForceX *= 0.9;  // Faster decay of fish forces
        this.fishForceY *= 0.9;
        this.rotationVelocity *= 0.5;
        
        // Check for nearby fish with reduced impact
        for (let f of fish) {
            let d = dist(this.x, this.y, f.x, f.y);
            if (d < this.size * 1) {
                let dx = (this.x - f.x) / d;
                let dy = (this.y - f.y) / d;
                let forceMultiplier = map(this.decompositionStage, 0, 2, 0.3, 0.1); // Reduced force multiplier
                let strength = map(d, 0, this.size * 2, 0.2, 0) * f.velocity * forceMultiplier; // Reduced base strength
                
                this.fishForceX += dx * strength * 2;
                this.fishForceY += dy * strength * 2;
                let angle = atan2(dy, dx);
                let rotationForce = sin(angle - this.rotation) * strength * 0.01; // Reduced rotation
                this.rotationVelocity += rotationForce;
            }
        }

        // Check for lily interactions
        if (!this.shouldRemove) {
            for (let lily of lilies) {
                if (lily !== this && !lily.shouldRemove) {
                    let d = dist(this.x, this.y, lily.x, lily.y);
                    if (d < (this.size + lily.size) / 2) {
                        // Reduced flower transfer probability (from 2% to 0.5%)
                        if (this.hasFlower && !lily.hasFlower && random(1) < 0.005) {
                            lily.hasFlower = true;
                            lily.energy = min(lily.energy + 20, 100);
                        }
                        
                        // Reproduction check
                        if (this.canReproduce() && lily.canReproduce()) {
                            if (this.tryReproduce(lily)) {
                                this.reproduce(lily);
                            }
                        }
                    }
                }
            }
        }

        // Regular movement updates with reduced forces
        let totalForceX = rippleForce.x * 0.05 + this.fishForceX; // Reduced ripple force impact
        let totalForceY = rippleForce.y * 0.05 + this.fishForceY;
        
        this.vx = lerp(this.vx, totalForceX, 0.1);
        this.vy = lerp(this.vy, totalForceY, 0.1);
        
        this.vx *= 0.95;
        this.vy *= 0.95;
        
        // Update position
        this.x += this.vx;
        this.y += this.vy;
        
        // Update rotation with reduced effect
        this.rotation += this.rotationVelocity + (this.vx + this.vy) * 0.01;
        
        // Boundary behavior
        let bounceForce = 0.3; // Reduced bounce force
        let margin = this.size / 2;
        
        if (this.x < margin) {
            this.x = margin;
            this.vx = abs(this.vx) * bounceForce;
            this.targetX = this.x + 30;
        } else if (this.x > width - margin) {
            this.x = width - margin;
            this.vx = -abs(this.vx) * bounceForce;
            this.targetX = this.x - 30;
        }
        
        if (this.y < margin) {
            this.y = margin;
            this.vy = abs(this.vy) * bounceForce;
            this.targetY = this.y + 30;
        } else if (this.y > height - margin) {
            this.y = height - margin;
            this.vy = -abs(this.vy) * bounceForce;
            this.targetY = this.y - 30;
        }
        
        // Gradually return to original position
        this.targetX = lerp(this.targetX, this.originalX, 0.002); // Very slow return to original X
        this.targetY = lerp(this.targetY, this.originalY, 0.002); // Very slow return to original Y
        
        // Move current position toward target
        this.x = lerp(this.x, this.targetX, 0.01);
        this.y = lerp(this.y, this.targetY, 0.01);
    }

    reproduce(otherLily) {
        let newX = (this.x + otherLily.x) / 2 + random(-200, 200); // Add random offset
        let newY = (this.y + otherLily.y) / 2 + random(-200, 200);
        
        if (!this.isAreaOvercrowded(newX, newY)) {
            newX = constrain(newX, 0, width);
            newY = constrain(newY, 0, height);
            
            lilies.push(new WaterLily(newX, newY));
            
            // Consume energy from both parents
            this.energy -= 50;
            otherLily.energy -= 50;
            
            // Create ripple effect
            let gridX = Math.floor(newX / 4);
            let gridY = Math.floor(newY / 4);
            if (gridX > 0 && gridX < cols - 1 && gridY > 0 && gridY < rows - 1) {
                previous[gridX][gridY] = 200;
            }
        }
    }

    canReproduce() {
        return this.age > this.maturityAge &&  // Must be mature
               this.hasFlower &&               // Must have flower
               this.energy >= 50 &&            // Must have enough energy
               this.decompositionStage === 0 && // Must be healthy
               frameCount - this.lastReproductionTime > 600; // 10 second cooldown
    }

    tryReproduce(otherLily) {
        return random(1) < 0.01;  // 1% chance
    }

    isAreaOvercrowded(x, y) {
        let nearbyCount = 0;
        let checkRadius = 150;
        
        for (let lily of lilies) {
            if (dist(x, y, lily.x, lily.y) < checkRadius) {
                nearbyCount++;
                if (nearbyCount >= 3) {
                    return true;
                }
            }
        }
        return false;
    }

    draw() {
        push();
        translate(this.x, this.y);
        rotate(this.rotation);
        
        noStroke();
        
        // Adjust colors based on decomposition stage
        let alphaBase = this.decompositionStage === 2 ? 100 : 200;
        let colorMult = map(this.decompositionStage, 0, 2, 1, 0.4);
        
        // Base shadow
        fill(34 * colorMult, 80 * colorMult, 34 * colorMult, alphaBase);
        rect(-this.size/2 + 4, -this.size*0.4 + 4, this.size/4, this.size*0.4, 2);
        rect(-this.size/4, -this.size*0.4 + 4, this.size/2, this.size*0.4, 2);
        
        // Main green blocks
        fill(67 * colorMult, 124 * colorMult, 23 * colorMult, alphaBase + 30);
        rect(-this.size/2, -this.size*0.4, this.size/4, this.size*0.4, 2);
        rect(-this.size/4, -this.size*0.4, this.size/2, this.size*0.4, 2);
        
        // Highlight blocks
        if (this.decompositionStage < 2) {
            fill(162 * colorMult, 201 * colorMult, 39 * colorMult, 180);
            rect(-this.size/2 + 2, -this.size*0.4 + 2, this.size/8, this.size*0.2, 1);
        }
        
        if (this.hasFlower && this.decompositionStage === 0) {
            // Only show flower if lily is healthy
            fill(219, 112, 147, 200);
            rect(-12, -12, 8, 8);
            rect(4, -12, 8, 8);
            rect(-12, 4, 8, 8);
            rect(4, 4, 8, 8);
            
            fill(255, 182, 193, 230);
            rect(-6, -6, 12, 12);
            
            fill(255, 223, 51, 250);
            rect(-4, -4, 8, 8);
        }
        
        pop();
    }
}
function initAudio() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create splash sound
    const splashOsc = audioContext.createOscillator();
    const splashGain = audioContext.createGain();
    splashOsc.connect(splashGain);
    splashGain.connect(audioContext.destination);
    
    splashSound = {
        play: () => {
            const time = audioContext.currentTime;
            
            // Reset oscillator and gain
            splashOsc.frequency.setValueAtTime(400, time);
            splashGain.gain.setValueAtTime(0, time);
            
            // Frequency sweep down
            splashOsc.frequency.exponentialRampToValueAtTime(100, time + 0.1);
            
            // Quick attack, longer decay
            splashGain.gain.linearRampToValueAtTime(0.3, time + 0.02);
            splashGain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
            
            splashOsc.start(time);
            splashOsc.stop(time + 0.3);
        }
    };
    
    // Create bubble sound
    const bubbleOsc = audioContext.createOscillator();
    const bubbleGain = audioContext.createGain();
    bubbleOsc.connect(bubbleGain);
    bubbleGain.connect(audioContext.destination);
    
    // Create mechanical click sound
    const clickOsc = audioContext.createOscillator();
    const clickGain = audioContext.createGain();
    const noiseNode = audioContext.createBufferSource();
    const noiseGain = audioContext.createGain();
    
    // Create noise buffer for the mechanical click
    const bufferSize = audioContext.sampleRate * 0.1; // 100ms buffer
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    noiseNode.buffer = buffer;
    noiseNode.connect(noiseGain);
    clickOsc.connect(clickGain);
    noiseGain.connect(audioContext.destination);
    clickGain.connect(audioContext.destination);
    
    bubbleSound = {
        play: () => {
            const time = audioContext.currentTime;
            
            // High-frequency click
            clickOsc.frequency.setValueAtTime(2000, time);
            clickGain.gain.setValueAtTime(0, time);
            clickGain.gain.linearRampToValueAtTime(0.3, time + 0.005);
            clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
            
            // Mechanical noise component
            noiseGain.gain.setValueAtTime(0, time);
            noiseGain.gain.linearRampToValueAtTime(0.15, time + 0.001);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
            
            clickOsc.start(time);
            clickOsc.stop(time + 0.03);
            noiseNode.start(time);
            noiseNode.stop(time + 0.05);
        }
    };
}
function setupControls() {
    const buttons = document.querySelectorAll('.control-btn');
    const screenElement = document.getElementById('screen');

    buttons.forEach(button => {
        ['click', 'touchstart'].forEach(eventType => {
            button.addEventListener(eventType, (e) => {
                e.preventDefault();
                
                if (!audioContext) {
                    audioContext = new (window.AudioContext || window.webkitAudioContext)();
                }
                
                buttons.forEach(btn => btn.classList.remove('active'));
                
                if (button.id === 'rockBtn') {
                    placeMode = 'rock';
                    button.classList.add('active');
                    createClickSound();
                } else if (button.id === 'lilyBtn') {
                    placeMode = 'lily';
                    button.classList.add('active');
                    createClickSound();
                } else if (button.id === 'fishBtn') {
                    placeMode = 'fish';
                    button.classList.add('active');
                    createClickSound();
                } else if (button.id === 'resetBtn') {
                    screenElement.style.filter = 'blur(10px)';
                    rocks = [];
                    lilies = [];
                    fish = [];
                    current = new Array(cols).fill(0).map(() => new Array(rows).fill(0));
                    previous = new Array(cols).fill(0).map(() => new Array(rows).fill(0));
                    setTimeout(() => screenElement.style.filter = 'none', 500);
                }
            }, { passive: false });
        });
    });
}

function setup() {
    let canvas;
    let screen = document.getElementById('screen');
    // detect mobile device and adjust canvas size
    if (typeof window.orientation !== 'undefined') {
        if (window.orientation === 90 || window.orientation === -90) {
            canvas = createCanvas(600, windowHeight);
        } else {
            canvas = createCanvas(screen.offsetWidth + 100, screen.offsetHeight);
        }
    } else {
        canvas = createCanvas(600, 460);
    }
    canvas.parent("screen");
    //canvas.getContext('2d', { willReadFrequently: true });
    pixelDensity(1);
    // Reduce resolution - each cell represents 4x4 pixels
    cols = Math.floor(width/4);
    rows = Math.floor(height/4);
    
    // Create 2D arrays
    current = new Array(cols).fill(0).map(() => new Array(rows).fill(0));
    previous = new Array(cols).fill(0).map(() => new Array(rows).fill(0));
    
    // Load sounds
    loadSounds();
    
    // Initialize audio
    initAudio();
    
    // Setup controls
    setupControls();
    
    // Set initial button state
    document.getElementById('rockBtn').classList.add('active');
}
// Add touch event handling for the canvas
function touchStarted() {
    if (touches.length > 0) {
        let touch = touches[0];
        // check if touch is on a button
        const buttons = document.querySelectorAll('.control-btn');
        const clickedButton = Array.from(buttons).some(button => {
            const rect = button.getBoundingClientRect();
            return (
                touch.x >= rect.left && 
                touch.x <= rect.right && 
                touch.y >= rect.top && 
                touch.y <= rect.bottom
            );
        });
        
        if (clickedButton) return false;
        
        // check if touch is on canvas
        if (touch.x > 0 && touch.x < width && touch.y > 0 && touch.y < height) {
            if (placeMode === 'rock') {
                rocks.push({ x: touch.x, y: touch.y, size: random(40, 80) });
            } else if (placeMode === 'lily') {
                lilies.push(new WaterLily(touch.x, touch.y));
            } else if (placeMode === 'fish') {
                fish.push(new Fish(touch.x, touch.y));
            }
        }
    }
    return false; // Prevent default
}

function mouseMoved() {
    if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
        let gridX = Math.floor(mouseX/4);
        let gridY = Math.floor(mouseY/4);
        if (gridX > 0 && gridX < cols && gridY > 0 && gridY < rows) {
            previous[gridX][gridY] = 500;
        }
    }
    return false;
}

function touchMoved(event) {
    if (touches.length > 0) {
        let touch = touches[0];
        let gridX = Math.floor(touch.x/4);
        let gridY = Math.floor(touch.y/4);
        if (gridX > 0 && gridX < cols && gridY > 0 && gridY < rows) {
            previous[gridX][gridY] = 500;
        }
    }
    return false;
}

function mousePressed() {
    // Check if click is on a button
    const buttons = document.querySelectorAll('.control-btn');
    const clickedButton = Array.from(buttons).some(button => {
        const rect = button.getBoundingClientRect();
        return (
            mouseX >= rect.left && 
            mouseX <= rect.right && 
            mouseY >= rect.top && 
            mouseY <= rect.bottom
        );
    });

    if (clickedButton) return false;
    
    if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return false;
    
    switch(placeMode) {
        case 'rock':
            rocks.push({ x: mouseX, y: mouseY, size: random(40, 80) });
            createSplashSound();
            break;
        case 'lily':
            lilies.push(new WaterLily(mouseX, mouseY));
            createSplashSound();
            break;
        case 'fish':
            fish.push(new Fish(mouseX, mouseY));
            createSplashSound();
            break;
    }
    return false;
}

function updateCreatures() {
    if (random(lilies.length) < lilies.length * 0.0008 && fish.length < lilies.length * 2) {
        fish.push(new Fish(random(width), random(height)));
    }
    // Update and draw fish first (so they appear under lilies)
    for (let f of fish) {
        f.update();
        f.draw();
    }
}

function draw() {
    background(232);
    loadPixels();
    
    // Apply tilt effect
    let tiltForceX = map(tiltAngle.x, -10, 10, -2, 2);
    let tiltForceY = map(tiltAngle.y, -10, 10, -2, 2);
    
    // Calculate water ripples with rock collision
    for (let i = 1; i < cols - 1; i++) {
        for (let j = 1; j < rows - 1; j++) {
            // Check if current point is inside any rock
            let isRock = rocks.some(rock => {
                let dx = i*4 - rock.x;
                let dy = j*4 - rock.y;
                return dx * dx + dy * dy < rock.size * rock.size / 4;
            });
            
            if (!isRock) {
                current[i][j] = (
                    previous[i-1][j] + 
                    previous[i+1][j] + 
                    previous[i][j-1] + 
                    previous[i][j+1]
                ) / 2 - current[i][j];
                current[i][j] = current[i][j] * dampening;
                current[i][j] += tiltForceX + tiltForceY;
            } else {
                current[i][j] = -previous[i][j];
            }
            
            // Scale back up to screen coordinates
            let rippleIntensity = current[i][j];
            let baseR = 70 + rippleIntensity;
            let baseG = 100 + rippleIntensity;
            let baseB = 170 + rippleIntensity;
            
            // Add subtle purple variations using simplified noise
            let noiseVal = noise(i * 0.1, j * 0.1, frameCount * 0.01);
            if (noiseVal > 0.5) {
                baseR += 20;
                baseB += 10;
            }
            
            // Fill 4x4 pixel block
            for (let x = 0; x < 4; x++) {
                for (let y = 0; y < 4; y++) {
                    let index = ((i * 4 + x) + (j * 4 + y) * width) * 4;
                    if (index < pixels.length - 4) {
                        if (isRock) {
                            pixels[index + 0] = 150;
                            pixels[index + 1] = 150;
                            pixels[index + 2] = 150;
                            pixels[index + 3] = 180; // Changed from 255 to 180 for transparency
                        } else {
                            pixels[index + 0] = baseR;
                            pixels[index + 1] = baseG;
                            pixels[index + 2] = baseB;
                            // Calculate transparency based on ripple intensity
                            //let alpha = map(abs(rippleIntensity), 0, 100, 100, 200);
                            pixels[index + 3] = 200;
                        }
                        pixels[index + 3] = 255;
                    }
                }
            }
        }
    }

    updatePixels();
    updateCreatures();

    // First filter out any lilies marked for removal
    lilies = lilies.filter(lily => !lily.shouldRemove);

    // Then update and draw the remaining lilies
    for (let lily of lilies) {
        // Convert lily position to grid coordinates
        let gridX = Math.floor(lily.x / 4);
        let gridY = Math.floor(lily.y / 4);
        
        // Ensure we're within grid bounds
        if (gridX > 0 && gridX < cols-1 && gridY > 0 && gridY < rows-1) {
            let rippleForce = {
                x: (current[gridX+1][gridY] - current[gridX-1][gridY]) * 0.15,
                y: (current[gridX][gridY+1] - current[gridX][gridY-1]) * 0.15
            };
            lily.update(rippleForce);
        }
        lily.draw();
    }
    
    // Swap buffers
    let temp = previous;
    previous = current;
    current = temp;
}