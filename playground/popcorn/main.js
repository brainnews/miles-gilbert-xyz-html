let time = 0;
let rotation = 0;
let baseSize; // Base size for scaling
let spawnCount = 37;
let padding = 2.5;
let maxParticles = 1000;

// Matter.js variables
let engine;
let world;
let particles = [];
let boundaries = [];
let previousColor;

const emojis = ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '😂', '😒', '👀', '🥵', '👽', '🦶'];


const reduceBtn = document.getElementById('reduceBtn');
const particleCount = document.getElementById('particleCount');
const instructions = document.getElementById('instructions');

document.addEventListener('DOMContentLoaded', () => {
    // add event listener for reduceBtn
    reduceBtn.addEventListener('click', () => {
        resetParticles();
    });

    reduceBtn.addEventListener('touchstart', () => {
        resetParticles();
    });
});

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
    setupPhysics();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    baseSize = calculateBaseSize();
    createBoundaries();
}

class PhysicsParticle {
    constructor(x, y, color) {
        this.size = random(baseSize * 0.75, baseSize * 1.5);
        // this.body = Matter.Bodies.rectangle(x, y, this.size, this.size, {
        //     friction: 0.3,
        //     restitution: 0.4,
        //     angle: random(TWO_PI),
        //     density: 0.001
        // });
        // create a circular body
        this.body = Matter.Bodies.circle(x, y, this.size/2 + padding, {
           friction: 0.3,
           restitution: 0.4,
           angle: random(TWO_PI),
           density: 0.001
        });
        // Add some initial velocity
        Matter.Body.setVelocity(this.body, { 
            x: random(-5, 5),
            y: random(-5, 0)
        });
        
        Matter.World.add(world, this.body);
        this.alpha = 255;
        this.color = color;
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
        fill(this.color[0], this.color[1], this.color[2], this.alpha);
        circle(0, 0, this.size);
        // draw text
        //fill(255);
        // textAlign(CENTER, CENTER);
        // textSize(baseSize);
        // text(this.emoji, 0, 0);
        pop();
    }

    remove() {
        Matter.World.remove(world, this.body);
    }
}

function draw() {
    cursor('none');
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

    if (particles.length === 0) {
        reduceBtn.style.display = 'none';
    } else {
        reduceBtn.style.display = 'block';
    }
    
    time += 0.02;
    rotation += 0.01;
    // Draw grid of animated squares
    let gridSize = baseSize;
    for(let x = 0; x < width; x += gridSize) {
        for(let y = 0; y < height; y += gridSize) {
            drawConcentricSquares(x, y, gridSize);
        }
    }
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
    // Create burst of physics particles
    //let spawnCount = floor(map(min(windowWidth, windowHeight), 0, 2000, 10, 30));
    createParticles(mouseX, mouseY);
    return false;
}

function touchStarted() {
    if (touches.length === 1) {
        createParticles(touches[0].x, touches[0].y);
    }
    return false;
}

function createParticles(x, y) {
    // detect if mouse click is inside div with id "reduceBtn"
    if (document.getElementById('reduceBtn').contains(event.target)) {
        return;
    }
    // use noise to determine color based on rgb value of previousColor
    console.log(previousColor);
    let noiseValue1 = noise(previousColor[0]);
    let noiseValue2 = noise(previousColor[1]);
    let noiseValue3 = noise(previousColor[2]);
    let r = map(noiseValue1, 0, 1, 0, 255);
    let g = map(noiseValue2, 0, 1, 0, 255);
    let b = map(noiseValue3, 0, 1, 0, 255);
    let color = [r, g, b];

    for (let i = 0; i < spawnCount; i++) {
        particles.push(new PhysicsParticle(x, y, color));
    }
}

function keyPressed() {
    if (key === ' ') {
        resetParticles();
    }
}

function resetParticles() {
    if (particles.length === 0) return;
    
    // Pick a random particle as the center of removal
    let centerIndex = floor(random(particles.length));
    let centerParticle = particles[centerIndex];
    let centerPos = centerParticle.body.position;
    
    // Calculate radius based on screen size
    let removalRadius = min(windowWidth, windowHeight) * 0.15;
    
    // Find particles within radius
    let particlesToRemove = [];
    for (let i = particles.length - 1; i >= 0; i--) {
        let particle = particles[i];
        let pos = particle.body.position;
        let distance = dist(centerPos.x, centerPos.y, pos.x, pos.y);
        
        if (distance <= removalRadius) {
            particlesToRemove.push(i);
        }
    }
    
    // Remove the particles (in reverse order to maintain indices)
    for (let i = particlesToRemove.length - 1; i >= 0; i--) {
        let index = particlesToRemove[i];
        particles[index].remove();
        particles.splice(index, 1);
    }
}

function mouseMoved() {
    return false;
}