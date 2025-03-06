let time = 0;
let rotation = 0;
let baseSize; // Base size for scaling
let spawnCount = 37;
let padding = 2.5;
let maxParticles = 1000;
let currentShape = 'circle';
const shapes = ['circle', 'square', 'triangle'];

// Matter.js variables
let engine;
let world;
let particles = [];
let selectedParticles = [];
let lockedParticles = [];
let boundaries = [];
let previousColor;

const emojis = ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '😂', '😒', '👀', '🥵', '👽', '🦶'];

const particleCount = document.getElementById('particleCount');
const instructions = document.getElementById('instructions');
const shapeSelectBtn = document.getElementById('shapeSelectBtn');
const colorPaletteBtn = document.getElementById('colorPaletteBtn');
const cutBtn = document.getElementById('cutBtn');
const lockBtn = document.getElementById('lockBtn');
const clearBtn = document.getElementById('clearBtn');
const helpBtn = document.getElementById('helpBtn');
const toolbar = document.getElementById('toolbar');

function calculateBaseSize() {
    // Calculate base size relative to screen dimensions
    return min(windowWidth, windowHeight) * 0.04;
}

function setupPhysics() {
    // Initialize physics engine
    engine = Matter.Engine.create();
    world = engine.world;
    
    // Reduce gravity for more floaty feel
    engine.world.gravity.y = 0.5;
    
    // Create boundaries
    createBoundaries();
    
    // Run the engine
    Matter.Runner.run(engine);
}

function createBoundaries() {
    // Clear existing boundaries
    for (let boundary of boundaries) {
        Matter.World.remove(world, boundary);
    }
    boundaries = [];

    // Create new boundaries
    let ground = Matter.Bodies.rectangle(windowWidth/2, windowHeight + 25, windowWidth, 50, { 
        isStatic: true,
        friction: 0.3,
        restitution: 0.4
    });
    
    let leftWall = Matter.Bodies.rectangle(-25, windowHeight/2, 50, windowHeight, { isStatic: true });
    let rightWall = Matter.Bodies.rectangle(windowWidth + 25, windowHeight/2, 50, windowHeight, { isStatic: true });
    
    boundaries = [ground, leftWall, rightWall];
    Matter.World.add(world, boundaries);
}

function setup() {
    const canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('#canvasContainer');
    previousColor = [random(0, 255), random(0, 255), random(0, 255)];
    baseSize = calculateBaseSize();
    setupControls();
    setupPhysics();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    baseSize = calculateBaseSize();
    createBoundaries();
}

class PhysicsParticle {
    constructor(x, y, color, shape) {
        this.size = random(baseSize * 0.75, baseSize * 1.5);
        // switch statement to change particle shape
        switch (shape) {
            case 'circle':
                this.body = Matter.Bodies.circle(x, y, this.size/2 + padding, {
                    friction: 0.3,
                    restitution: 0.4,
                    angle: random(TWO_PI),
                    density: 0.001
                });
                break;
            case 'square':
                this.body = Matter.Bodies.rectangle(x, y, this.size + padding, this.size + padding, {
                    friction: 0.3,
                    restitution: 0.4,
                    angle: random(TWO_PI),
                    density: 0.001
                });
                break;
            case 'triangle':
                this.body = Matter.Bodies.polygon(x, y, 3, this.size/1.8, {
                    friction: 0.3,
                    restitution: 0.4,
                    angle: random(TWO_PI),
                    density: 0.001
                });
                break;
            default:
                this.body = Matter.Bodies.circle(x, y, this.size/2 + padding, {
                    friction: 0.3,
                    restitution: 0.4,
                    angle: random(TWO_PI),
                    density: 0.001
                });
                break;
        }
        // Add some initial velocity
        Matter.Body.setVelocity(this.body, { 
            x: random(-5, 5),
            y: random(-5, 0)
        });
        
        Matter.World.add(world, this.body);
        this.alpha = 255;
        this.color = color;
        this.shape = currentShape;
        this.isHovered = false;
        this.isSelected = false;
        this.isLocked = false;
        previousColor = this.color;
    }

    draw() {
        let pos = this.body.position;
        let angle = this.body.angle;
        
        push();
        translate(pos.x, pos.y);
        rotate(angle);
        rectMode(CENTER);
        noStroke();
        
        // Change appearance based on state
        if (this.isHovered || this.isSelected) {
            // Draw hover/selection effect with white glow
            fill(255, 255, 255, 100);
            stroke(255, 255, 255, 100);
            strokeWeight(4);
            
            // Draw the glow shape
            switch (this.shape) {
                case 'circle':
                    circle(0, 0, this.size);
                    break;
                case 'square':
                    rect(0, 0, this.size, this.size);
                    break;
                case 'triangle':
                    triangle(-this.size/2, this.size/2, this.size/2, this.size/2, 0, -this.size/2);
                    break;
                default:
                    circle(0, 0, this.size);
                    break;
            }
            
            // Main particle fill
            fill(this.color[0], this.color[1], this.color[2], 120);
        } else {
            // Normal or locked state (no glow)
            if (this.isLocked) {
                // Locked particles are paler in color (higher alpha/brightness)
                fill(
                    this.color[0] + (255 - this.color[0]) * 0.4, 
                    this.color[1] + (255 - this.color[1]) * 0.4, 
                    this.color[2] + (255 - this.color[2]) * 0.4, 
                    this.alpha
                );
            } else {
                // Normal color
                fill(this.color[0], this.color[1], this.color[2], this.alpha);
            }
        }
        
        // switch statement to change particle shape
        switch (this.shape) {
            case 'circle':
                circle(0, 0, this.size);
                break;
            case 'square':
                rect(0, 0, this.size, this.size);
                break;
            case 'triangle':
                triangle(-this.size/2, this.size/2, this.size/2, this.size/2, 0, -this.size/2);
                break;
            default:
                circle(0, 0, this.size);
                break;
        }
        pop();
    }

    remove() {
        Matter.World.remove(world, this.body);
    }
}

function draw() {
    if (selectedParticles.length > 0) {
        cutBtn.classList.remove('disabled');
        lockBtn.classList.remove('disabled');
    } else {
        cutBtn.classList.add('disabled');
        lockBtn.classList.add('disabled');
    }
    
    if (particles.length > 0) {
        clearBtn.classList.remove('disabled');
    } else {
        clearBtn.classList.add('disabled');
    }
    cursor('default');
    // Create gradient background
    let c1 = color(255, 200, 100);
    let c2 = color(200, 100, 255);
    
    for(let y = 0; y < height; y++){
        let inter = map(y, 0, height, 0, 1);
        let c = lerpColor(c1, c2, inter);
        stroke(c);
        line(0, y, width, y);
    }
    
    // Draw all particles
    for (let particle of particles) {
        particle.draw();
    }
    
    // Clean up particles if too many
    if (particles.length > maxParticles) {
        let oldParticle = particles.shift();
        oldParticle.remove();
    }

    particleCount.innerHTML = particles.length;

    if (particles.length === 0) {
        instructions.style.display = 'block';
    } else {
        instructions.style.display = 'none';
    }
    
    time += 0.02;
    rotation += 0.01;
}

function drawConcentricSquares(x, y, size) {
    push();
    translate(x + size/2, y + size/2);
    rotate(rotation);
    
    let d = dist(mouseX, mouseY, x + size/2, y + size/2);
    let maxDist = size * 2;
    let scaleFactor = map(constrain(d, 0, maxDist), 0, maxDist, 1.5, 1);
    
    noFill();
    for(let i = size; i > 0; i -= size/10) {
        let hue = (time * 50 + i * 10) % 360;
        stroke(hue, 70, 70, 0.5);
        rectMode(CENTER);
        
        let wave = sin(time + x * 0.05 + y * 0.05) * (size/8);
        let squareSize = i * scaleFactor + wave;
        
        rect(0, 0, squareSize, squareSize);
    }
    pop();
    
    if(d < size) {
        noStroke();
        fill(255, map(d, 0, size, 255, 0));
        rect(x, y, size, size);
    }
}
// create a function that detects mouse wheel movement to set the amount of particles to spawn
function mouseWheel(event) {
    if (event.delta < 0) {
        spawnCount += 7;
    } else {
        spawnCount -= 7;
    }
    spawnCount = constrain(spawnCount, 10, 100);
}

function touchStarted() {
    if (event.touches.length === 2) {
        resetParticles();
    }
}

function mousePressed() {
    // detect if click is inside the "toolbar" and prevent adding particles
    if (mouseX > toolbar.offsetLeft && mouseX < toolbar.offsetLeft + toolbar.offsetWidth && mouseY > toolbar.offsetTop && mouseY < toolbar.offsetTop + toolbar.offsetHeight) {
        return;
    }
    if (particles.length === 0) {
        createParticles(mouseX, mouseY);
        return;
    }
    let clicked = false;
    // detect if mouse click is on a particle
    for (let particle of particles) {
        if (dist(mouseX, mouseY, particle.body.position.x, particle.body.position.y) < particle.size/2) {
            if (selectedParticles.indexOf(particle) === -1) {
                selectedParticles.push(particle);
                particle.isSelected = true;
            } else {
                selectedParticles.splice(selectedParticles.indexOf(particle), 1);
                particle.isSelected = false;
                particle.isHovered = false;
            }
            clicked = true;
            break;
        }
    }
    if (!clicked) {
        createParticles(mouseX, mouseY);
    }
}

function touchStarted() {
    if (touches.length === 1) {
        createParticles(touches[0].x, touches[0].y);
    } else if (touches.length === 2) {
        resetParticles();
    } else if (touches.length === 3) {
        // Remove only unlocked particles
        for (let i = particles.length - 1; i >= 0; i--) {
            if (!particles[i].isLocked) {
                particles[i].remove();
                particles.splice(i, 1);
            }
        }
    }
    return false;
}

function createParticles(x, y) {
    // use noise to determine color based on rgb value of previousColor
    let noiseValue1 = noise(previousColor[0]);
    let noiseValue2 = noise(previousColor[1]);
    let noiseValue3 = noise(previousColor[2]);
    let r = map(noiseValue1, 0, 1, 0, 255);
    let g = map(noiseValue2, 0, 1, 0, 255);
    let b = map(noiseValue3, 0, 1, 0, 255);
    let color = [r, g, b];

    for (let i = 0; i < spawnCount; i++) {
        particles.push(new PhysicsParticle(x, y, color, currentShape));
    }
}

function keyPressed() {
    if (key === 'Backspace') {
        if (selectedParticles.length > 0) {
            // Remove selected particles (even if locked)
            for (let particle of selectedParticles) {
                // Also remove from lockedParticles if it was locked
                const lockedIndex = lockedParticles.indexOf(particle);
                if (lockedIndex !== -1) {
                    lockedParticles.splice(lockedIndex, 1);
                }
                
                particle.remove();
                particles.splice(particles.indexOf(particle), 1);
            }
            selectedParticles = [];
        } else {
            resetParticles();
        }
    }
    // detect escape key to deselect all particles
    if (key === 'Escape') {
        for (let particle of particles) {
            particle.isSelected = false;
            particle.isHovered = false;
        }
        selectedParticles = [];
    }
    // L key to toggle lock/unlock for selected particles
    if (key === 'l' || key === 'L') {
        if (selectedParticles.length > 0) {
            const event = new Event('click');
            lockBtn.dispatchEvent(event);
        }
    }
}

function resetParticles() {
    if (particles.length === 0) return;
    
    // Make a copy of the particles array for processing
    let particlesCopy = [...particles];
    
    // Filter out locked particles for determining the center
    let unlockParticles = particlesCopy.filter(p => !p.isLocked);
    
    // If all particles are locked, nothing to do
    if (unlockParticles.length === 0) return;
    
    // Pick a random unlocked particle as the center of removal
    let centerIndex = floor(random(unlockParticles.length));
    let centerParticle = unlockParticles[centerIndex];
    let centerPos = centerParticle.body.position;
    
    // Calculate radius based on screen size
    let removalRadius = min(windowWidth, windowHeight) * 0.15;
    
    // Identify which ORIGINAL particles to remove (maintaining the original indices)
    let toRemove = [];
    
    for (let i = 0; i < particles.length; i++) {
        let particle = particles[i];
        
        // Skip locked particles
        if (particle.isLocked) {
            continue;
        }
        
        let pos = particle.body.position;
        let distance = dist(centerPos.x, centerPos.y, pos.x, pos.y);
        
        if (distance <= removalRadius) {
            // Store the actual particle reference to remove
            toRemove.push(particle);
        }
    }
    
    // Remove each particle from the physics world first
    for (let particle of toRemove) {
        particle.remove();
    }
    
    // Then filter the particles array to remove these particles
    particles = particles.filter(p => !toRemove.includes(p));
}

function mouseMoved() {
    // Change cursor when hovering over a particle
    let hovering = false;
    
    // Reset all particles to not hovered
    for (let particle of particles) {
        particle.isHovered = false;
    }
    
    // Check for hover on each particle
    for (let particle of particles) {
        if (dist(mouseX, mouseY, particle.body.position.x, particle.body.position.y) < particle.size/2) {
            particle.isHovered = true;
            hovering = true;
            break; // Only hover one particle at a time
        }
    }
    
    // Change cursor based on hover state
    if (hovering) {
        cursor('pointer'); // Change cursor to pointer when hovering
    } else {
        cursor('default');
    }
    
    return false;
}

function setupControls () {
    shapeSelectBtn.addEventListener('click', () => {
        // cycle through shapes in shapes array
        currentShape = shapes[(shapes.indexOf(currentShape) + 1) % shapes.length];
        let shapeName;
        if (currentShape === 'triangle') {
            shapeName = 'change_history';
        } else {
            shapeName = currentShape;
        }
        shapeSelectBtn.innerHTML = '<span class="material-symbols-outlined">' + shapeName + '</span>'
    });
    
    cutBtn.addEventListener('click', () => {
        if (selectedParticles.length > 0) {
            for (let particle of selectedParticles) {
                // Also remove from lockedParticles if it was locked
                const lockedIndex = lockedParticles.indexOf(particle);
                if (lockedIndex !== -1) {
                    lockedParticles.splice(lockedIndex, 1);
                }
                
                particle.remove();
                particles.splice(particles.indexOf(particle), 1);
            }
            selectedParticles = [];
        }
    });
    
    clearBtn.addEventListener('click', () => {
        // Remove all particles (even if locked)
        for (let particle of particles) {
            particle.remove();
        }
        particles = [];
        lockedParticles = [];
        selectedParticles = [];
    });

    lockBtn.addEventListener('click', () => {
        if (selectedParticles.length > 0) {
            for (let particle of selectedParticles) {
                if (!particle.isLocked) {
                    // Lock the particle
                    particle.isLocked = true;
                    
                    // Make it static to remove gravity and physics effects
                    Matter.Body.setStatic(particle.body, true);
                    
                    // Add to locked particles array if not already there
                    if (lockedParticles.indexOf(particle) === -1) {
                        lockedParticles.push(particle);
                    }
                } else {
                    // Unlock the particle
                    particle.isLocked = false;
                    
                    // Make it dynamic again
                    Matter.Body.setStatic(particle.body, false);
                    
                    // Remove from locked particles array
                    const index = lockedParticles.indexOf(particle);
                    if (index !== -1) {
                        lockedParticles.splice(index, 1);
                    }
                }
            }
        }
        // Deselect all particles
        for (let particle of particles) {
            particle.isSelected = false;
            particle.isHovered = false;
        }
        selectedParticles = [];
    });
}