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
let pollinationChance = 0.01;
let foodParticles = [];
let dayLength = 72000; // 20 minute day
let debug = false;
const debugBtn = document.getElementById('debugBtn');
let timeController;

document.addEventListener('DOMContentLoaded', () => {
    if (debug) {
        debugBtn.innerHTML = 'Debugging on <span>✅</span>';
    } else {
        debugBtn.innerHTML = 'Debugging off <span>❌</span>';
    }
    document.getElementById('debugBtn').addEventListener('click', () => {
        debug = !debug;
        debugBtn.innerHTML = debug ? 'Debugging on <span>✅</span>' : 'Debugging off <span>❌</span>';
    });
});

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

class FoodParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = random(4, 8);
        this.energy = 5;
        this.color = color(218, 165, 32); // Golden color for food
        this.shouldRemove = false;
        this.lastRippleTime = 0;
        this.age = 0;
        this.maxAge = random(400, 600);
        
        // Create initial ripple effect
        let gridX = Math.floor(this.x / 4);
        let gridY = Math.floor(this.y / 4);
        if (gridX > 0 && gridX < cols - 1 && gridY > 0 && gridY < rows - 1) {
            previous[gridX][gridY] = 100;
        }
    }

    update() {
        // Create occasional ripples
        if (frameCount - this.lastRippleTime > 30) {
            let gridX = Math.floor(this.x / 4);
            let gridY = Math.floor(this.y / 4);
            if (gridX > 0 && gridX < cols - 1 && gridY > 0 && gridY < rows - 1) {
                previous[gridX][gridY] = 50;
                this.lastRippleTime = frameCount;
            }
        }

        // Slowly sink and drift
        this.y += random(-0.5, 0.5);
        this.x += random(-0.5, 0.5);

        // Check boundaries
        if (this.y > height) {
            this.shouldRemove = true;
        }

        // Increase age
        this.age++;

        // Check for death conditions
        if (this.age > this.maxAge) {
            this.shouldRemove = true;
        }
    }

    draw() {
        push();
        noStroke();
        fill(this.color);
        rect(this.x, this.y, this.size);
        pop();
    }

    consume(amount) {
        this.energy -= amount;
        this.size = map(this.energy, 0, 5, 2, 8);
        if (this.energy <= 0) {
            this.shouldRemove = true;
        }
    }
}

class Fish {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = random(5, 10);
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
        
        // Lifecycle properties
        this.age = 0;
        this.maxAge = random(3600, 7200); // 60-120 seconds at 60fps
        this.shouldRemove = false;
        this.energy = 100;

        // Food-seeking properties
        this.isHungry = true;
        this.targetFood = null;
        this.eatingSpeed = random(0.5, 1.5);
    }

    update() {
        // Update age
        this.age++;
        
        // Decrease energy over time
        this.energy = max(0, this.energy - 0.02);
        
        // Check for death conditions
        if (this.age >= this.maxAge || this.energy <= 0) {
            this.shouldRemove = true;
            // Create a final ripple effect when fish dies
            let gridX = Math.floor(this.x / 4);
            let gridY = Math.floor(this.y / 4);
            if (gridX > 0 && gridX < cols - 1 && gridY > 0 && gridY < rows - 1) {
                previous[gridX][gridY] = 150;
            }
            return;
        }

        // Handle food-seeking behavior
        if (this.isHungry) {
            // Look for nearby food if not currently targeting any
            if (!this.targetFood) {
                this.findNearestFood();
            }
            
            // If we have a target food, move towards it
            if (this.targetFood) {
                // Check if the target food still exists and isn't being consumed
                if (this.targetFood.shouldRemove) {
                    this.targetFood = null;
                    return;
                }

                // Calculate angle to food
                let angleToFood = atan2(
                    this.targetFood.y - this.y,
                    this.targetFood.x - this.x
                );

                // Adjust fish's angle towards food
                let angleDiff = angleToFood - this.angle;
                if (angleDiff > PI) angleDiff -= TWO_PI;
                if (angleDiff < -PI) angleDiff += TWO_PI;
                this.angle += angleDiff * 0.1;

                // Increase speed when approaching food
                this.targetVelocity = 5;

                // Check if close enough to eat
                let d = dist(this.x, this.y, this.targetFood.x, this.targetFood.y);
                if (d < this.size) {
                    // Consume some of the food
                    this.targetFood.consume(this.eatingSpeed);
                    
                    // Gain energy from eating
                    this.energy = min(100, this.energy + this.eatingSpeed);
                    
                    // If food is consumed, clear target and become temporarily satisfied
                    if (this.targetFood.shouldRemove) {
                        this.targetFood = null;
                        this.isHungry = false;
                        setTimeout(() => this.isHungry = true, random(5000, 10000));
                    }
                } else {
                    // swim away from food
                    this.targetFood = null;
                }
            }
        }

        // Adjust velocity based on age
        let ageRatio = this.age / this.maxAge;
        if (ageRatio > 0.8) {
            // Slow down in old age
            this.targetVelocity = max(1, this.targetVelocity * 0.99);
        }

        // Movement behavior when not pursuing food
        if (!this.targetFood) {
            this.turnSpeed = noise(frameCount * 0.02, this.x * 0.01, this.y * 0.01) - 0.5;
            this.angle += this.turnSpeed * 0.5;
            
            if (random(1) < 0.005) {
                this.targetVelocity = random(6, 8);
            }
            
            this.velocity = lerp(this.velocity, this.targetVelocity, 0.1);
            
            if (this.velocity > 5) {
                let gridX = Math.floor(this.x / 4);
                let gridY = Math.floor(this.y / 4);
                
                if (frameCount - this.lastRippleTime > 5) {
                    if (gridX > 0 && gridX < cols - 1 && gridY > 0 && gridY < rows - 1) {
                        previous[gridX][gridY] = 200;
                        this.lastRippleTime = frameCount;
                    }
                }
                
                this.targetVelocity = lerp(this.targetVelocity, random(2, 4), 0.02);
            }
        }
        
        // Update position
        this.x += cos(this.angle) * this.velocity;
        this.y += sin(this.angle) * this.velocity;
        
        // Wrap around screen edges
        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;
        
        // Lily interaction logic
        for (let lily of lilies) {
            let d = dist(this.x, this.y, lily.x, lily.y);
            if (d < lily.size) {
                if (lily.hasFlower && lily.age >= lily.maturityAge && !this.carryingPollen && lily !== this.pollenSourceLily) {
                    this.carryingPollen = true;
                    this.pollenSourceLily = lily;
                    // Gain energy from collecting pollen
                    this.energy = min(100, this.energy + 10);
                } else if (this.carryingPollen && lily !== this.pollenSourceLily) {
                    if (lily.hasFlower) {
                        if (random(1) < pollinationChance) {
                            let newX = lily.x + random(-200, 200);
                            let newY = lily.y + random(-200, 200);
                            lilies.push(new WaterLily(newX, newY));
                        }
                    } else {
                        if (random(1) < pollinationChance) {
                            lily.hasFlower = true;
                        }
                    }
                    this.carryingPollen = false;
                    this.pollenSourceLily = null;
                    // Gain energy from successful pollination
                    this.energy = min(100, this.energy + 5);
                }
                
                let angle = atan2(this.y - lily.y, this.x - lily.x);
                this.angle = lerp(this.angle, angle, 0.2);
            }
        }
        
        // Rock avoidance logic
        for (let rock of rocks) {
            let d = dist(this.x, this.y, rock.x, rock.y);
            if (d < rock.size) {
                let angle = atan2(this.y - rock.y, this.x - rock.x);
                this.angle = lerp(this.angle, angle, 0.2);
            }
        }
    }

    findNearestFood() {
        let nearestDist = Infinity;
        let nearestFood = null;

        for (let food of foodParticles) {
            if (!food.shouldRemove) {
                let d = dist(this.x, this.y, food.x, food.y);
                if (d < 100 && d < nearestDist) { // Detection radius of 200 pixels
                    nearestDist = d;
                    nearestFood = food;
                }
            }
        }

        this.targetFood = nearestFood;
    }

    draw() {
        push();
        translate(this.x, this.y);
        rotate(this.angle);
        
        // Calculate transparency based on energy only
        let alpha = map(this.energy, 0, 100, 100, 255);
        
        // Modify color based on energy
        let c = color(
            red(this.color), 
            green(this.color), 
            blue(this.color), 
            alpha
        );
        fill(c);
        noStroke();
        
        // Draw body with normal size
        rect(-this.size, -this.size/2, this.size * 1.5, this.size, 4);
        
        // Draw tail
        triangle(
            -this.size + 1, -this.size/2,
            -this.size + 1, this.size/2,
            -this.size * 1.5, 0
        );
        
        // Eye color changes with age and energy
        if (this.carryingPollen) {
            fill(255);
        } else {
            let eyeColor = map(this.energy, 0, 100, 150, 0);
            fill(eyeColor);
        }
        noStroke();
        circle(0, 0, this.size/4);
        
        pop();
    }
}
class WaterLily {
    constructor(x, y) {
        // Constrain initial position based on lily size
        this.size = random(50, 90);
        const margin = this.size / 2;
        
        // Constrain x and y to be within safe bounds
        this.x = constrain(x, margin, width - margin);
        this.y = constrain(y, margin, height - margin);
        
        // Store constrained positions as original positions
        this.originalX = this.x;
        this.originalY = this.y;
        this.targetX = this.x;
        this.targetY = this.y;
        
        this.rotation = random(TWO_PI);
        this.vx = 0;
        this.vy = 0;
        this.hasBloomed = false;
        this.hasFlower = random() < 0.4;
        
        this.fishForceX = 0;
        this.fishForceY = 0;
        this.rotationVelocity = 0;
        
        // Lifecycle properties
        this.lastReproductionTime = frameCount;
        this.age = 0;
        this.maturityAge = 600;
        this.energy = 400;
        this.maxAge = random(7200, 14400);
        this.decompositionStage = 0;
        this.decompositionTime = 0;
        this.shouldRemove = false;
        this.isHovered = false;
    }

    update(rippleForce) {
        if (this.hasFlower) {
            this.hasBloomed = true;
        }
        this.age++;
        
        // Energy management
        if (this.energy > 0) {
            this.energy -= 0.02;
            if (this.hasFlower && this.age < this.maxAge * 0.7 && this.energy > 0) {
                this.energy += 0.03;
            }
        } else if (this.hasFlower) {
            this.hasFlower = false;
        }

        // small chance to grow a flower
        if (random(1) < 0.0003 && !this.hasFlower && !this.hasBloomed) {
            this.hasFlower = true;
            this.hasBloomed = true;
        }

        // Age-based decomposition
        if (this.age > this.maxAge * 0.7 && this.decompositionStage === 0) {
            this.decompositionStage = 1;
        } else if (this.age > this.maxAge && this.decompositionStage === 1) {
            this.decompositionStage = 2;
            this.decompositionTime = frameCount;
        }

        // increase energy loss based on amount of other lilies
        let nearbyLilies = 0;
        for (let lily of lilies) {
            let d = dist(this.x, this.y, lily.x, lily.y);
            if (d < this.size * 2) {
                nearbyLilies++;
            }
        }
        this.energy -= 0.01 * nearbyLilies;

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
                        if (this.hasFlower && !lily.hasFlower && random(1) < 0.005 && !lily.hasBloomed) {
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
        
        // Boundary behavior with size-aware constraints
        const margin = this.size / 2;
        let bounceForce = 0.3;
        
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
        // Calculate new position with random offset
        let newX = (this.x + otherLily.x) / 2 + random(-200, 200);
        let newY = (this.y + otherLily.y) / 2 + random(-200, 200);
        
        // Get the size that the new lily would have
        const newSize = random(60, 100);
        const margin = newSize / 2;
        
        // Constrain position accounting for the new lily's size
        newX = constrain(newX, margin, width - margin);
        newY = constrain(newY, margin, height - margin);
        
        if (!this.isAreaOvercrowded(newX, newY)) {
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
        let alphaBase = this.decompositionStage === 2 ? 100 : 200;
        let colorMult = map(this.decompositionStage, 0, 2, 1, 0.4);
        
        // Draw shadow first - calculated based on fixed light source from top-right
        push();
        translate(this.x, this.y);
        noStroke();
        
        // Base shadow with fixed light direction (top-right source)
        const shadowOffset = 4;
        fill(34 * colorMult, 80 * colorMult, 34 * colorMult, alphaBase);
        
        // Draw the shadow by transforming the lily's rectangles
        // First save the current rotation
        const currentRotation = this.rotation;
        
        // Calculate shadow positions by applying the current rotation to the lily's shape
        // but keeping shadow offset direction constant
        const rectPoints = [
            // First rectangle points
            {x: -this.size/2, y: -this.size*0.4},
            {x: -this.size/4, y: -this.size*0.4},
            {x: -this.size/4, y: 0},
            {x: -this.size/2, y: 0},
            // Second rectangle points
            {x: -this.size/4, y: -this.size*0.4},
            {x: this.size/4, y: -this.size*0.4},
            {x: this.size/4, y: 0},
            {x: -this.size/4, y: 0}
        ];
        
        // Rotate points according to lily rotation
        const rotatedPoints = rectPoints.map(point => {
            const rotatedX = point.x * cos(currentRotation) - point.y * sin(currentRotation);
            const rotatedY = point.x * sin(currentRotation) + point.y * cos(currentRotation);
            return {
                x: rotatedX + shadowOffset,
                y: rotatedY + shadowOffset
            };
        });
        
        // Draw first rectangle shadow
        beginShape();
        for(let i = 0; i < 4; i++) {
            vertex(rotatedPoints[i].x, rotatedPoints[i].y);
        }
        endShape(CLOSE);
        
        // Draw second rectangle shadow
        beginShape();
        for(let i = 4; i < 8; i++) {
            vertex(rotatedPoints[i].x, rotatedPoints[i].y);
        }
        endShape(CLOSE);
        pop();
        
        // Draw the main lily with rotation
        push();
        translate(this.x, this.y);
        rotate(this.rotation);
        noStroke();
        
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

            // if lily is mature, color flower white
            if (this.age > this.maturityAge) {
                fill(255);
                rect(-4, -4, 8, 8);
            }
        }
        // display lily age, marurity age, and energy
        if (debug && this.isHovered) {
            fill(255);
            textSize(9);
            textAlign(LEFT, TOP);
            text("Max age: " + this.maxAge.toFixed(0) + "\nAge: " + this.age + "\nMaturity: " + this.maturityAge + "\nEnergy: " + this.energy.toFixed(0) + "\nRotation: " + this.rotation.toFixed(0), 0, 0);
        }
        
        pop();
    }
}
// Time management system
// Time management system
class TimeController {
    constructor() {
        this.startYear = 1897;
        this.endYear = 1926;
        this.currentDate = new Date(this.startYear, 0, 1);
        this.isPlaying = true; // Start playing by default
        
        // Time progression settings
        this.framesPerMonth = 60 * 60 * 5; // 5 minutes worth of frames at 60fps
        this.frameCounter = 0;
        
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
    }

    initialize() {
        // Update existing date display element
        this.dateDisplay = document.getElementById('currentDate');
        
        // Update play/pause button
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.updatePlayPauseButton();
        
        // Setup event listeners
        this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        
        // Initial display update
        this.updateDateDisplay();
    }

    togglePlayPause() {
        this.isPlaying = !this.isPlaying;
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

        // Increment frame counter
        this.frameCounter++;

        // Check if we should advance the month
        if (this.frameCounter >= this.framesPerMonth) {
            // Reset frame counter
            this.frameCounter = 0;

            // Advance the date by one month
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);

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

    setTimeSpeed(minutesPerMonth) {
        // Convert minutes to frames (assuming 60fps)
        this.framesPerMonth = minutesPerMonth * 60 * 60;
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
                } else if (button.id === 'foodBtn') {
                    placeMode = 'food';
                    button.classList.add('active');
                    createClickSound();
                } else if (button.id === 'resetBtn') {
                    screenElement.style.filter = 'blur(10px)';
                    rocks = [];
                    lilies = [];
                    fish = [];
                    foodParticles = [];
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
    pixelDensity(1);
    // Reduce resolution - each cell represents 4x4 pixels
    cols = Math.floor(width/4);
    rows = Math.floor(height/4);
    
    // Create 2D arrays
    current = new Array(cols).fill(0).map(() => new Array(rows).fill(0));
    previous = new Array(cols).fill(0).map(() => new Array(rows).fill(0));
    
    // Initialize time controller
    timeController = new TimeController();
    timeController.initialize();
    
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
        case 'food':
            // Add 5-10 food particles in a small area
            const numParticles = random(2, 5);
            for (let i = 0; i < numParticles; i++) {
                const offsetX = random(-20, 20);
                const offsetY = random(-20, 20);
                foodParticles.push(new FoodParticle(mouseX + offsetX, mouseY + offsetY));
            }
            createSplashSound();
            break;
    }
    return false;
}
function updateFoodParticles() {
    // Remove consumed food
    foodParticles = foodParticles.filter(food => !food.shouldRemove);

    // Update and draw remaining food
    for (let food of foodParticles) {
        food.update();
        food.draw();
    }
}

function updateCreatures() {
    // Remove dead fish and update remaining ones
    fish = fish.filter(f => !f.shouldRemove);

    // Spawn new fish if there aren't enough
    if (random(rocks.length) < rocks.length * 0.0008 && fish.length < rocks.length * 2) {
        fish.push(new Fish(random(width), random(height)));
    }
    
    // Update and draw remaining fish
    for (let f of fish) {
        f.update();
        f.draw();
    }
}

function updateTimeOfDay(frameCount) {
    // 36000 frames = 24 hours
    // So each frame represents 24*60*60/36000 = 2.4 seconds of game time
    const gameHour = 24*60*60/dayLength;
    const totalGameSeconds = (frameCount * gameHour) % (24 * 60 * 60);
    
    // Convert to hours, minutes
    const hours = Math.floor(totalGameSeconds / 3600);
    const minutes = Math.floor((totalGameSeconds % 3600) / 60);
    
    // Format with leading zeros
    const formattedHours = hours.toString().padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');
    
    // Update the display
    document.getElementById('timeOfDay').textContent = `${formattedHours}:${formattedMinutes}`;
}

function drawCursor() {
    const iconOffset = 24;
    fill(255, 255, 255);
    stroke(255, 255, 255, 70);
    strokeWeight(2);
    circle(mouseX + iconOffset, mouseY + iconOffset, 40);
    textSize(24);
    textAlign(CENTER, CENTER);
    cursor('none');
    if (placeMode === 'rock') {
        text('🪨', mouseX + iconOffset, mouseY + iconOffset + 1);
    } else if (placeMode === 'lily') {
        text('🌺', mouseX + iconOffset, mouseY + iconOffset + 2);
    } else if (placeMode === 'fish') {
        text('🐟', mouseX + iconOffset, mouseY + iconOffset + 1);
    } else if (placeMode === 'food') {
        text('🍞', mouseX + iconOffset, mouseY + iconOffset + 2);
    }
    fill(255);
    stroke(0);
    strokeWeight(0);
    triangle(
        mouseX, mouseY,
        mouseX + 8, mouseY + 3,
        mouseX + 3, mouseY + 8
    );
    // detect if mouse is over a lily
    for (let lily of lilies) {
        if (mouseX > lily.x - lily.size/2 && mouseX < lily.x + lily.size/2 && mouseY > lily.y - lily.size/2 && mouseY < lily.y + lily.size/2) {
            lily.isHovered = true;
        } else {
            lily.isHovered = false;
        }
    }
}

function draw() {
    // Update time controller
    timeController?.update();

    if (debug) {
        timeController.setTimeSpeed(0.1);
    } else {
        timeController.setTimeSpeed(5);
    }
    
    if (timeController && !timeController.isPlaying) {
        cursor('default');
        screen.classList.add('paused');
        document.getElementById('pausedNotification').classList.remove('hidden');
        return;
    } else {
        screen.classList.remove('paused');
        document.getElementById('pausedNotification').classList.add('hidden');
    }

    const fishPopulation = document.getElementById('fishPopulation');
    const lilyPopulation = document.getElementById('lilyPopulation');

    // update population counters
    fishPopulation.innerText = fish.length;
    lilyPopulation.innerText = lilies.length;

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
    updateFoodParticles();
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
    drawCursor();
    // Swap buffers
    let temp = previous;
    previous = current;
    current = temp;
}