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
        
        // Avoid lilies and rocks
        for (let lily of lilies) {
            let d = dist(this.x, this.y, lily.x, lily.y);
            if (d < lily.size) {
                // Steer away from lily
                let angle = atan2(this.y - lily.y, this.x - lily.x);
                this.angle = lerp(this.angle, angle, 0.2);
            }
        }
        
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
        let c = color(red(this.color), green(this.color), blue(this.color), 80); // 180/255 opacity
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
        fill(0);
        circle(0, 0, this.size/4);
        
        pop();
    }
}
class WaterLily {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.size = random(60, 100);
        this.rotation = random(TWO_PI);
        this.vx = 0;
        this.vy = 0;
        // Add hasFlower property that stays constant
        this.hasFlower = random() < 0.5;
    }

    update(rippleForce) {
        // Very gentle ripple force scaling
        let amplifiedForceX = rippleForce.x * 0.1;
        let amplifiedForceY = rippleForce.y * 0.1;
        
        // Move lily pad based on water ripples with minimal sensitivity
        this.vx = lerp(this.vx, amplifiedForceX, 0.05);
        this.vy = lerp(this.vy, amplifiedForceY, 0.05);
        
        // Very strong damping for minimal movement
        this.vx *= 0.92;
        this.vy *= 0.92;
        
        this.x += this.vx;
        this.y += this.vy;
        
        // Minimal rotation
        this.rotation += (this.vx + this.vy) * 0.01;
        
        // Quick return to original position
        this.x = lerp(this.x, this.targetX, 0.04);
        this.y = lerp(this.y, this.targetY, 0.04);
        
        // Keep within bounds
        this.x = constrain(this.x, 0, width);
        this.y = constrain(this.y, 0, height);
        
        this.x += this.vx;
        this.y += this.vy;
        
        // More pronounced rotation based on ripple movement
        this.rotation += (this.vx + this.vy) * 0.05;
        
        // Slower return to original position for more drifting
        this.x = lerp(this.x, this.targetX, 0.002);
        this.y = lerp(this.y, this.targetY, 0.002);
        
        // Keep within bounds
        this.x = constrain(this.x, 0, width);
        this.y = constrain(this.y, 0, height);
    }

    draw() {
        push();
        translate(this.x, this.y);
        rotate(this.rotation);
        
        // Draw lily pad with pixelated retro style
        noStroke();
        
        // Main pad shape - simplified and chunky
        // Base shadow
        fill(34, 80, 34, 200);
        rect(-this.size/2 + 4, -this.size*0.4 + 4, this.size/4, this.size*0.4, 2);
        rect(-this.size/4, -this.size*0.4 + 4, this.size/2, this.size*0.4, 2);
        
        // Main green blocks
        fill(67, 124, 23, 230);
        rect(-this.size/2, -this.size*0.4, this.size/4, this.size*0.4, 2);
        rect(-this.size/4, -this.size*0.4, this.size/2, this.size*0.4, 2);
        
        // Highlight blocks
        fill(162, 201, 39, 180);
        rect(-this.size/2 + 2, -this.size*0.4 + 2, this.size/8, this.size*0.2, 1);
        
        // Draw retro-style flower with chunky pixels
        if (this.hasFlower) {
            // Flower base - larger pixels
            fill(219, 112, 147, 200);
            rect(-12, -12, 8, 8);
            rect(4, -12, 8, 8);
            rect(-12, 4, 8, 8);
            rect(4, 4, 8, 8);
            
            // Brighter center
            fill(255, 182, 193, 230);
            rect(-6, -6, 12, 12);
            
            // Yellow center pixel
            fill(255, 223, 51, 250);
            rect(-4, -4, 8, 8);
        }
        
        pop();
    }
}
function setupControls() {
    const buttons = document.querySelectorAll('.control-btn');
    
    buttons.forEach(button => {
        ['click', 'touchstart'].forEach(eventType => {
            button.addEventListener(eventType, (e) => {
                e.preventDefault();
                
                buttons.forEach(btn => btn.classList.remove('active'));
                
                if (button.id === 'rockBtn') {
                    placeMode = 'rock';
                    button.classList.add('active');
                } else if (button.id === 'lilyBtn') {
                    placeMode = 'lily';
                    button.classList.add('active');
                } else if (button.id === 'fishBtn') {
                    placeMode = 'fish';
                    button.classList.add('active');
                } else if (button.id === 'resetBtn') {
                    rocks = [];
                    lilies = [];
                    fish = [];
                    current = new Array(cols).fill(0).map(() => new Array(rows).fill(0));
                    previous = new Array(cols).fill(0).map(() => new Array(rows).fill(0));
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
    
    setupControls();
    
    // Set initial button state
    document.getElementById('rockBtn').classList.add('active');
    
    // Setup device motion
    if (typeof DeviceMotionEvent !== 'undefined' && 
        typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission()
            .then(response => {
                if (response == 'granted') {
                    window.addEventListener('devicemotion', handleMotion);
                }
            })
            .catch(console.error);
    } else {
        window.addEventListener('devicemotion', handleMotion);
    }
}
    // Add touch event handling for the canvas
    function touchStarted() {
    if (touches.length > 0) {
        let touch = touches[0];
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
function handleMotion(event) {
    tiltAngle.x = event.accelerationIncludingGravity.x * 2;
    tiltAngle.y = event.accelerationIncludingGravity.y * 2;
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
    if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return false;
    
    switch(placeMode) {
        case 'rock':
            rocks.push({ x: mouseX, y: mouseY, size: random(40, 80) });
            break;
        case 'lily':
            lilies.push(new WaterLily(mouseX, mouseY));
            break;
        case 'fish':
            fish.push(new Fish(mouseX, mouseY));
            break;
    }
    return false;
}

function updateCreatures() {
    // Update and draw fish first (so they appear under lilies)
    for (let f of fish) {
        f.update();
        f.draw();
    }
}

function draw() {
    background(0);
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
                        }
                        pixels[index + 3] = 255;
                    }
                }
            }
        }
    }

    updatePixels();
    updateCreatures();
    // Update and draw lilies
    for (let lily of lilies) {
        // Convert lily position to grid coordinates
        let gridX = Math.floor(lily.x / 4);
        let gridY = Math.floor(lily.y / 4);
        
        // Ensure we're within grid bounds
        if (gridX > 0 && gridX < cols-1 && gridY > 0 && gridY < rows-1) {
            // Calculate ripple forces from surrounding cells
        // Calculate ripple forces from surrounding cells
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