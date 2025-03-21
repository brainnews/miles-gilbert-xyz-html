let longPressActive = false;
let previousTouchDistance = 0;
let touchStartTime = 0;
let touchStartPos = { x: 0, y: 0 };
let longPressTimer = null;
const LONG_PRESS_DURATION = 500; // ms
let time = 0;
let rotation = 0;
let baseSize; // Base size for scaling
let spawnCount = 37;
let padding = 2.5;
let maxParticles = 1000;
let currentShape = 'circle';
const shapes = ['circle', 'square', 'triangle'];

// Marquee selection variables
let isMarqueeSelecting = false;
let marqueeStartX = 0;
let marqueeStartY = 0;
let marqueeEndX = 0;
let marqueeEndY = 0;
let shiftPressed = false;
let mKeyPressed = false;
let xKeyPressed = false;

// Matter.js variables
let engine;
let world;
let particles = [];
let selectedParticles = [];
let lockedParticles = [];
let boundaries = [];
let previousColor;
let isRandomColor = true; // Flag to toggle between random and chosen color
let currentPickedColor = [255, 100, 100]; // Default custom color (will be initialized properly in setup)

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

    if (isMobileDevice()) {
        setupMobileControls();
    }
}

// Utility function to detect mobile devices
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
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
    
    // If marquee selecting, update particle hover states
    if (isMarqueeSelecting) {
        let x1 = min(marqueeStartX, marqueeEndX);
        let y1 = min(marqueeStartY, marqueeEndY);
        let x2 = max(marqueeStartX, marqueeEndX);
        let y2 = max(marqueeStartY, marqueeEndY);
        
        // Update particle hover states based on marquee position
        for (let particle of particles) {
            const pos = particle.body.position;
            
            // Check if particle is inside marquee
            if (pos.x >= x1 && pos.x <= x2 && pos.y >= y1 && pos.y <= y2) {
                // If not already selected, mark as hovered
                if (!particle.isSelected) {
                    particle.isHovered = true;
                }
            } else if (!particle.isSelected) {
                // If not inside marquee and not selected, remove hover state
                particle.isHovered = false;
            }
        }
    }

    // If long press is active, draw a selection circle
    if (longPressActive && touches.length > 0) {
        noFill();
        stroke(255, 255, 255, 180);
        strokeWeight(2);
        circle(touchStartPos.x, touchStartPos.y, baseSize * 6);
    }
    
    // Draw all particles
    for (let particle of particles) {
        particle.draw();
    }
    
    // Draw marquee selection box if active
    if (isMarqueeSelecting) {
        noFill();
        stroke(255, 255, 255, 180);
        strokeWeight(2);
        let x = min(marqueeStartX, marqueeEndX);
        let y = min(marqueeStartY, marqueeEndY);
        let w = abs(marqueeEndX - marqueeStartX);
        let h = abs(marqueeEndY - marqueeStartY);
        rect(x, y, w, h);
        
        // Add dashed line effect
        strokeWeight(1);
        stroke(255, 255, 255, 120);
        drawingContext.setLineDash([5, 5]);
        rect(x, y, w, h);
        drawingContext.setLineDash([]);
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

function mousePressed() {
    // detect if click is inside the "toolbar" and prevent adding particles
    if (mouseX > toolbar.offsetLeft && mouseX < toolbar.offsetLeft + toolbar.offsetWidth && mouseY > toolbar.offsetTop && mouseY < toolbar.offsetTop + toolbar.offsetHeight) {
        return;
    }

    // detect if click is inside helpModal
    // if (mouseX > helpModal.offsetLeft && mouseX < helpModal.offsetLeft + helpModal.offsetWidth && mouseY > helpModal.offsetTop && mouseY < helpModal.offsetTop + helpModal.offsetHeight) {
    //     return;
    // }
    
    // Start marquee selection if shift is pressed
    if (shiftPressed) {
        isMarqueeSelecting = true;
        marqueeStartX = mouseX;
        marqueeStartY = mouseY;
        marqueeEndX = mouseX;
        marqueeEndY = mouseY;
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
            if (xKeyPressed) {
                // Split the particle if M key is pressed
                splitParticle(particle);
                clicked = true;
                break;
            } else if (selectedParticles.indexOf(particle) === -1) {
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
    // Only track single touches for long press
    if (touches.length === 1) {
        touchStartTime = millis();
        touchStartPos = { x: touches[0].x, y: touches[0].y };
        
        // Set a timer for long press
        clearTimeout(longPressTimer);
        longPressTimer = setTimeout(() => {
            // Check if we're still touching the same position
            if (touches.length === 1 && 
                dist(touches[0].x, touches[0].y, touchStartPos.x, touchStartPos.y) < 20) {
                handleLongPress(touches[0].x, touches[0].y);
            }
        }, LONG_PRESS_DURATION);
    }
    // First check if the touch is within the toolbar or help modal
    if (toolbar && touches.length === 1) {
        const touch = touches[0];
        if (touch.x > toolbar.offsetLeft && touch.x < toolbar.offsetLeft + toolbar.offsetWidth && 
            touch.y > toolbar.offsetTop && touch.y < toolbar.offsetTop + toolbar.offsetHeight) {
            return false;
        }
    }
    
    // Check if help modal is open and touch is inside it
    const helpModal = document.getElementById('helpModal');
    if (helpModal && helpModal.style.display !== 'none' && touches.length === 1) {
        const touch = touches[0];
        // Simple check to see if touch is in the modal
        const helpContent = helpModal.querySelector('.help-content');
        if (helpContent) {
            const rect = helpContent.getBoundingClientRect();
            if (touch.x >= rect.left && touch.x <= rect.right && 
                touch.y >= rect.top && touch.y <= rect.bottom) {
                return false;
            } else {
                // Close the modal if clicking outside
                helpModal.style.display = 'none';
                return false;
            }
        }
    }

    if (touches.length === 1) {
        // Check if touching a particle
        let touchedParticle = false;
        for (let particle of particles) {
            if (dist(touches[0].x, touches[0].y, particle.body.position.x, particle.body.position.y) < particle.size/2) {
                if (selectedParticles.indexOf(particle) === -1) {
                    selectedParticles.push(particle);
                    particle.isSelected = true;
                } else {
                    selectedParticles.splice(selectedParticles.indexOf(particle), 1);
                    particle.isSelected = false;
                    particle.isHovered = false;
                }
                touchedParticle = true;
                break;
            }
        }
        
        // If not touching a particle, create new ones
        if (!touchedParticle) {
            createParticles(touches[0].x, touches[0].y);
        }
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

function touchEnded() {
    // Clear the long press timer
    clearTimeout(longPressTimer);
    return false;
}

function touchMoved() {
    // Handle pinch-to-zoom behavior
    if (touches.length >= 2) {
        const touch1 = touches[0];
        const touch2 = touches[1];
        const currentDistance = dist(touch1.x, touch1.y, touch2.x, touch2.y);
        
        // If we have a previous distance, calculate the change
        if (previousTouchDistance > 0) {
            const distanceDelta = currentDistance - previousTouchDistance;
            
            // Adjust spawn count based on pinch gesture
            if (abs(distanceDelta) > 2) { // Threshold to avoid small fluctuations
                spawnCount += distanceDelta * 0.1;
                spawnCount = constrain(spawnCount, 10, 100);
            }
        }
        
        previousTouchDistance = currentDistance;
        return false;
    } else {
        // Reset for next gesture
        previousTouchDistance = 0;
    }
    
    return false;
}

function handleLongPress(x, y) {
    // Find particles near the long press position
    let nearbyParticles = [];
    
    for (let particle of particles) {
        if (dist(x, y, particle.body.position.x, particle.body.position.y) < baseSize * 3) {
            nearbyParticles.push(particle);
        }
    }
    
    // Select all nearby particles
    for (let particle of nearbyParticles) {
        if (selectedParticles.indexOf(particle) === -1) {
            selectedParticles.push(particle);
            particle.isSelected = true;
        }
    }
    
    // Show a visual feedback for the selection
    if (nearbyParticles.length > 0) {
        // Flash effect or some other visual indicator
        // This could be implemented in the draw function
        longPressActive = true;
        setTimeout(() => {
            longPressActive = false;
        }, 300);
    }
}

function setupMobileControls() {
    // Create a floating action button (FAB) for mobile
    const fab = document.createElement('div');
    fab.id = 'mobileFab';
    fab.innerHTML = '<span class="material-symbols-outlined">more_vert</span>';
    
    document.body.appendChild(fab);
    
    // Style the FAB
    fab.style.position = 'fixed';
    fab.style.bottom = '20px';
    fab.style.right = '20px';
    fab.style.width = '56px';
    fab.style.height = '56px';
    fab.style.borderRadius = '50%';
    fab.style.backgroundColor = '#ffc864';
    fab.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
    fab.style.display = 'flex';
    fab.style.alignItems = 'center';
    fab.style.justifyContent = 'center';
    fab.style.zIndex = '1000';
    fab.style.fontSize = '24px';
    
    // Add touch event
    fab.addEventListener('touchstart', function(e) {
        e.preventDefault();
        toggleMobileMenu();
    });
    
    // Create mobile menu (initially hidden)
    const mobileMenu = document.createElement('div');
    mobileMenu.id = 'mobileMenu';
    mobileMenu.style.display = 'none';
    mobileMenu.style.position = 'fixed';
    mobileMenu.style.bottom = '85px';
    mobileMenu.style.right = '20px';
    mobileMenu.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    mobileMenu.style.borderRadius = '12px';
    mobileMenu.style.padding = '10px';
    mobileMenu.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    mobileMenu.style.zIndex = '999';
    
    // Add mobile menu buttons
    mobileMenu.innerHTML = `
        <div class="mobile-menu-item" id="mobileSelectAll">Select All</div>
        <div class="mobile-menu-item" id="mobileColor">Change Color</div>
        <div class="mobile-menu-item" id="mobileShape">Change Shape</div>
        <div class="mobile-menu-item" id="mobileLock">Lock/Unlock</div>
        <div class="mobile-menu-item" id="mobileClear">Clear All</div>
        <div class="mobile-menu-item" id="mobileHelp">Help</div>
    `;
    
    document.body.appendChild(mobileMenu);
    
    // Style the menu items
    const menuItems = document.querySelectorAll('.mobile-menu-item');
    menuItems.forEach(item => {
        item.style.padding = '12px 16px';
        item.style.margin = '4px 0';
        item.style.borderRadius = '8px';
        item.style.backgroundColor = 'rgba(255, 200, 100, 0.2)';
        item.style.fontSize = '16px';
        item.style.fontWeight = 'bold';
        
        // Add active state styling
        item.addEventListener('touchstart', function() {
            this.style.backgroundColor = 'rgba(255, 200, 100, 0.5)';
        });
        
        item.addEventListener('touchend', function() {
            this.style.backgroundColor = 'rgba(255, 200, 100, 0.2)';
        });
    });
    
    // Implement menu functionality
    document.getElementById('mobileSelectAll').addEventListener('touchstart', function(e) {
        e.preventDefault();
        for (let particle of particles) {
            if (!particle.isSelected) {
                selectedParticles.push(particle);
                particle.isSelected = true;
            }
        }
        toggleMobileMenu();
    });
    
    document.getElementById('mobileColor').addEventListener('touchstart', function(e) {
        e.preventDefault();
        if (selectedParticles.length > 0) {
            const event = new KeyboardEvent('keydown', { 'key': 'c' });
            document.dispatchEvent(event);
        } else {
            // Toggle the color mode
            const event = new Event('click');
            currentColor.dispatchEvent(event);
        }
        toggleMobileMenu();
    });
    
    document.getElementById('mobileShape').addEventListener('touchstart', function(e) {
        e.preventDefault();
        const event = new Event('click');
        shapeSelectBtn.dispatchEvent(event);
        toggleMobileMenu();
    });
    
    document.getElementById('mobileLock').addEventListener('touchstart', function(e) {
        e.preventDefault();
        if (selectedParticles.length > 0) {
            const event = new Event('click');
            lockBtn.dispatchEvent(event);
        }
        toggleMobileMenu();
    });
    
    document.getElementById('mobileClear').addEventListener('touchstart', function(e) {
        e.preventDefault();
        const event = new Event('click');
        clearBtn.dispatchEvent(event);
        toggleMobileMenu();
    });
    
    document.getElementById('mobileHelp').addEventListener('touchstart', function(e) {
        e.preventDefault();
        const event = new Event('click');
        helpBtn.dispatchEvent(event);
        toggleMobileMenu();
    });
}

function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu.style.display === 'none') {
        mobileMenu.style.display = 'block';
    } else {
        mobileMenu.style.display = 'none';
    }
}

function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu.style.display === 'none') {
        mobileMenu.style.display = 'block';
    } else {
        mobileMenu.style.display = 'none';
    }
}

function createParticles(x, y) {
    let color;
    
    if (isRandomColor) {
        // Use noise to determine color based on rgb value of previousColor
        let noiseValue1 = noise(previousColor[0]);
        let noiseValue2 = noise(previousColor[1]);
        let noiseValue3 = noise(previousColor[2]);
        let r = map(noiseValue1, 0, 1, 0, 255);
        let g = map(noiseValue2, 0, 1, 0, 255);
        let b = map(noiseValue3, 0, 1, 0, 255);
        color = [r, g, b];
    } else {
        // Use the manually picked color
        color = [...currentPickedColor]; // Use a copy to avoid reference issues
    }

    for (let i = 0; i < spawnCount; i++) {
        particles.push(new PhysicsParticle(x, y, color, currentShape));
    }
}

function keyPressed() {
    // Track shift key state
    if (keyCode === SHIFT) {
        shiftPressed = true;
    }

    // Track M key state
    if (key === 'm' || key === 'M') {
        mKeyPressed = true;
    }

    // Track C key state
    if (key === 'x' || key === 'X') {
        xKeyPressed = true;
    }
    
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
        
        // Also cancel any ongoing marquee selection
        isMarqueeSelecting = false;
    }
    // L key to toggle lock/unlock for selected particles
    if (key === 'l' || key === 'L') {
        if (selectedParticles.length > 0) {
            const event = new Event('click');
            lockBtn.dispatchEvent(event);
        }
    }
    // C key to change color of selected particles
    if (key === 'c' || key === 'C') {
        if (selectedParticles.length > 0) {
            for (let particle of selectedParticles) {
                if (isRandomColor) {
                    // Generate a new random color
                    let noiseValue1 = noise(previousColor[0]);
                    let noiseValue2 = noise(previousColor[1]);
                    let noiseValue3 = noise(previousColor[2]);
                    let r = map(noiseValue1, 0, 1, 0, 255);
                    let g = map(noiseValue2, 0, 1, 0, 255);
                    let b = map(noiseValue3, 0, 1, 0, 255);
                    particle.color = [r, g, b];
                } else {
                    // Use the current picked color
                    particle.color = [...currentPickedColor];
                }
            }
        }
    }
}

function keyReleased() {
    // Track shift key state
    if (keyCode === SHIFT) {
        shiftPressed = false;
        
        // If a marquee selection was in progress, finalize it
        if (isMarqueeSelecting) {
            finalizeMarqueeSelection();
            isMarqueeSelecting = false;
        }
    }

    // Track M key state
    if (key === 'm' || key === 'M') {
        mKeyPressed = false;
    }

    if (key === 'x' || key === 'X') {
        xKeyPressed = false;
    }

    return false;
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
    // Update marquee selection if active
    if (isMarqueeSelecting) {
        marqueeEndX = mouseX;
        marqueeEndY = mouseY;
        return false;
    }
    
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
    } else if (shiftPressed) {
        cursor('crosshair'); // Change cursor to crosshair when shift is pressed
    } else {
        cursor('default');
    }
    
    return false;
}

function mouseDragged() {
    // Update marquee selection if active
    if (isMarqueeSelecting) {
        marqueeEndX = mouseX;
        marqueeEndY = mouseY;
        return false;
    }
    return true;
}

function mouseReleased() {
    // Finalize marquee selection if active
    if (isMarqueeSelecting) {
        finalizeMarqueeSelection();
        isMarqueeSelecting = false;
        return false;
    }
    return true;
}

function finalizeMarqueeSelection() {
    // Calculate the marquee box coordinates
    let x1 = min(marqueeStartX, marqueeEndX);
    let y1 = min(marqueeStartY, marqueeEndY);
    let x2 = max(marqueeStartX, marqueeEndX);
    let y2 = max(marqueeStartY, marqueeEndY);
    
    // Minimum size check to avoid accidental tiny selections
    if (abs(x2 - x1) < 10 || abs(y2 - y1) < 10) {
        // Reset hover states for particles
        for (let particle of particles) {
            if (!particle.isSelected) {
                particle.isHovered = false;
            }
        }
        return;
    }
    
    // Always keep existing selections (requirement #1)
    // No need to clear previous selections anymore
    
    // Select all particles inside the marquee
    for (let particle of particles) {
        const pos = particle.body.position;
        
        // Check if particle position is inside the marquee box
        if (pos.x >= x1 && pos.x <= x2 && pos.y >= y1 && pos.y <= y2) {
            // Only add if not already selected
            if (selectedParticles.indexOf(particle) === -1) {
                selectedParticles.push(particle);
                particle.isSelected = true;
            }
        }
        
        // Clear hover state as we've now completed selection
        particle.isHovered = false;
    }
}

// Helper function to convert RGB to Hex
function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (Math.floor(r) << 16) + (Math.floor(g) << 8) + Math.floor(b)).toString(16).slice(1);
}

// Helper function to convert Hex to RGB
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : [0, 0, 0];
}

function setupControls() {
    const particleCount = document.getElementById('particleCount');
    const instructions = document.getElementById('instructions');
    const shapeSelectBtn = document.getElementById('shapeSelectBtn');
    const currentColor = document.getElementById('currentColor');
    const colorPickerInput = document.getElementById('colorPickerInput');
    const cutBtn = document.getElementById('cutBtn');
    const lockBtn = document.getElementById('lockBtn');
    const clearBtn = document.getElementById('clearBtn');
    const helpBtn = document.getElementById('helpBtn');
    const toolbar = document.getElementById('toolbar');
    
    // Initialize color picker with a random color
    const initialR = Math.floor(random(0, 255));
    const initialG = Math.floor(random(0, 255));
    const initialB = Math.floor(random(0, 255));
    currentPickedColor = [initialR, initialG, initialB];
    colorPickerInput.value = rgbToHex(initialR, initialG, initialB);
    
    // Set up current color click handler
    currentColor.addEventListener('click', () => {
        if (isRandomColor) {
            // Switch to custom color mode
            isRandomColor = false;
            currentColor.classList.remove('rainbow-bg');
            currentColor.style.backgroundColor = `rgb(${currentPickedColor[0]}, ${currentPickedColor[1]}, ${currentPickedColor[2]})`;
            
            // Open the color picker
            colorPickerInput.click();
        } else {
            // Switch back to random color mode
            isRandomColor = true;
            currentColor.classList.add('rainbow-bg');
            currentColor.style.backgroundColor = '';
        }
    });
    
    // Set up color picker change handler
    colorPickerInput.addEventListener('input', (event) => {
        const hexColor = event.target.value;
        currentPickedColor = hexToRgb(hexColor);
        
        if (!isRandomColor) {
            currentColor.style.backgroundColor = `rgb(${currentPickedColor[0]}, ${currentPickedColor[1]}, ${currentPickedColor[2]})`;
        }
    });
    
    // Set up shape select button
    shapeSelectBtn.addEventListener('click', () => {
        // cycle through shapes in shapes array
        currentShape = shapes[(shapes.indexOf(currentShape) + 1) % shapes.length];
        let shapeName;
        if (currentShape === 'triangle') {
            shapeName = 'change_history';
        } else {
            shapeName = currentShape;
        }
        shapeSelectBtn.innerHTML = '<span class="material-symbols-outlined">' + shapeName + '</span>';
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
    helpBtn.addEventListener('click', () => {
        // Create modal container if it doesn't exist
        let helpModal = document.getElementById('helpModal');
        
        if (helpModal) {
            // If modal exists already, just toggle its visibility
            helpModal.style.display = helpModal.style.display === 'none' ? 'flex' : 'none';
            return;
        }
        
        // Create the modal
        helpModal = document.createElement('div');
        helpModal.id = 'helpModal';
        helpModal.classList.add('help-modal');
        
        // Create the content container
        const helpContent = document.createElement('div');
        helpContent.classList.add('help-content');
        
        // Define mobile-specific tips
        const mobileTips = isMobileDevice() ? `
            <p>Mobile Gestures</p>
            <table>
                <tr>
                    <td><b>Tap</b></td>
                    <td>Create particles or select/deselect a particle</td>
                </tr>
                <tr>
                    <td><b>Long Press</b></td>
                    <td>Select all particles in the area</td>
                </tr>
                <tr>
                    <td><b>Two-Finger Tap</b></td>
                    <td>Remove particles in a circular area</td>
                </tr>
                <tr>
                    <td><b>Three-Finger Tap</b></td>
                    <td>Remove all unlocked particles</td>
                </tr>
                <tr>
                    <td><b>Pinch</b></td>
                    <td>Adjust number of particles per spawn</td>
                </tr>
                <tr>
                    <td><b>Floating Button</b></td>
                    <td>Access mobile-specific controls</td>
                </tr>
            </table>
        ` : '';

        // Add help content
        helpContent.innerHTML = `
            <p>Hotkeys</p>
            <table>
                <tr>
                    <td><b>Click/Tap</b></td>
                    <td>Create particles at cursor position</td>
                </tr>
                <tr>
                    <td><b>Mouse Wheel</b></td>
                    <td>Adjust number of particles per spawn (10-100)</td>
                </tr>
                <tr>
                    <td><span class="key">Esc</span></td>
                    <td>Deselect all particles</td>
                </tr>
                <tr>
                    <td><span class="key">Backspace</span></td>
                    <td>Delete selected particles (or all if none selected)</td>
                </tr>
                <tr>
                    <td><span class="key">C</span></td>
                    <td>Change color of selected particles</td>
                </tr>
                <tr>
                    <td><span class="key">L</span></td>
                    <td>Lock/unlock selected particles</td>
                </tr>
                <tr>
                    <td><span class="key">M</span> + Click</td>
                    <td>Split a particle into smaller fragments</td>
                </tr>
                <tr>
                    <td><span class="key">Shift</span> + Drag</td>
                    <td>Marquee selection (draw a box to select multiple particles)</td>
                </tr>
            </table>
            
            <div class="tip">
                <b>Tip:</b> Click on particles to select them individually. Hold Shift and drag to select multiple particles at once.
            </div>
            
            <p>Toolbar</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                    <td><span class="material-symbols-outlined">palette</span></td>
                    <td>Toggle between random colors and manual color picking</td>
                </tr>
                <tr>
                    <td><span class="material-symbols-outlined">circle</span></td>
                    <td>Cycle between Circle, Square, and Triangle</td>
                </tr>
                <tr>
                    <td><span class="material-symbols-outlined">content_cut</span></td>
                    <td>Remove selected particles</td>
                </tr>
                <tr>
                    <td><span class="material-symbols-outlined">lock</span></td>
                    <td>Fix selected particles in place</td>
                </tr>
                <tr>
                    <td><span class="material-symbols-outlined">cleaning_services</span></td>
                    <td>Remove all particles</td>
                </tr>
                <tr>
                    <td><span class="material-symbols-outlined">help</span></td>
                    <td>Show this guide</td>
                </tr>
            </table>
            
            <p>Mobile controls</p>
            
            ${mobileTips}
            
            <div class="tip">
                <b>Creative tip:</b> Try locking some particles in place to create obstacles, then spawn more particles to interact with them!
            </div>
            
            <button id="closeHelpBtn">Got it!</button>
        `;
        
        helpModal.appendChild(helpContent);
        document.body.appendChild(helpModal);
        
        // Close button functionality
        document.getElementById('closeHelpBtn').addEventListener('click', () => {
            helpModal.style.display = 'none';
        });
        
        // Close when clicking outside the content
        helpModal.addEventListener('click', (event) => {
            if (event.target === helpModal) {
                helpModal.style.display = 'none';
            }
        });
        
        // Prevent closing when clicking inside the content
        helpContent.addEventListener('click', (event) => {
            event.stopPropagation();
        });
    });
}

function splitParticle(particle) {
    // Get original particle properties
    const originalSize = particle.size;
    const pos = particle.body.position;
    const originalColor = particle.color;
    const originalShape = particle.shape;
    
    // Remove the original particle
    particle.remove();
    const index = particles.indexOf(particle);
    if (index !== -1) {
        particles.splice(index, 1);
    }
    
    // Also remove from selected and locked arrays if needed
    const selectedIndex = selectedParticles.indexOf(particle);
    if (selectedIndex !== -1) {
        selectedParticles.splice(selectedIndex, 1);
    }
    
    const lockedIndex = lockedParticles.indexOf(particle);
    if (lockedIndex !== -1) {
        lockedParticles.splice(lockedIndex, 1);
    }
    
    // Number of smaller particles to create
    const numFragments = floor(random(4, 8));
    
    // Size reduction factor - particles will be 60% of original size
    const sizeReduction = 0.6;
    
    // Store the original base size
    const originalBaseSize = baseSize;
    
    // Temporarily reduce base size for creating smaller particles
    // We want new particles that are sizeReduction (e.g. 60%) of the original's size
    // PhysicsParticle constructor uses random(baseSize * 0.75, baseSize * 1.5)
    // So we adjust baseSize so the middle of this range (baseSize * 1.125) is sizeReduction * originalSize
    baseSize = originalSize * sizeReduction / 1.125;
    
    // Create smaller particles
    for (let i = 0; i < numFragments; i++) {
        // Create a new particle with temporarily reduced baseSize
        const newParticle = new PhysicsParticle(pos.x, pos.y, originalColor, originalShape);
        
        // Apply random velocity for explosion effect
        const angle = random(TWO_PI);
        const force = random(2, 5);
        Matter.Body.setVelocity(newParticle.body, {
            x: cos(angle) * force,
            y: sin(angle) * force
        });
        
        // Add to particles array
        particles.push(newParticle);
    }
    
    // Restore original base size
    baseSize = originalBaseSize;
}