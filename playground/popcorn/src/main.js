import { PhysicsManager } from './Physics.js';
import { UI } from './UI.js';
import { Controls } from './Controls.js';
import { MobileUI } from './MobileUI.js';
import { GameState } from './GameState.js';

let physics;
let gameState;
let ui;
let controls;
let mobileUI;
let time = 0;
let rotation = 0;

function setup() {
    const canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('#canvasContainer');
    
    physics = new PhysicsManager();
    physics.createBoundaries(windowWidth, windowHeight);
    
    ui = new UI();
    gameState = new GameState(physics, ui);
    controls = new Controls(gameState);
    mobileUI = new MobileUI(gameState, ui);
}

function draw() {
    drawBackground();
    gameState.draw();
    controls.drawMarquee();
    time += 0.02;
    rotation += 0.01;
}

function drawBackground() {
    let c1 = color(255, 200, 100);
    let c2 = color(200, 100, 255);
    
    for(let y = 0; y < height; y++){
        let inter = map(y, 0, height, 0, 1);
        let c = lerpColor(c1, c2, inter);
        stroke(c);
        line(0, y, width, y);
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    physics.resize(windowWidth, windowHeight);
    gameState.resize();
}

// Mouse event handlers
function mousePressed() {
    controls.handleMousePressed(mouseX, mouseY, ui.elements.toolbar);
}

function mouseMoved() {
    if (controls.isMarqueeSelecting) {
        controls.handleMouseDragged(mouseX, mouseY);
        return false;
    }
    
    let hovering = false;
    gameState.clearParticleHoverStates();
    
    for (let particle of gameState.particles) {
        if (dist(mouseX, mouseY, particle.body.position.x, particle.body.position.y) < particle.size/2) {
            particle.isHovered = true;
            hovering = true;
            break;
        }
    }
    
    cursor(hovering ? 'pointer' : (controls.shiftPressed ? 'crosshair' : 'default'));
    return false;
}

function mouseDragged() {
    return controls.handleMouseDragged(mouseX, mouseY);
}

function mouseReleased() {
    return controls.handleMouseReleased();
}

function mouseWheel(event) {
    gameState.adjustSpawnCount(event.delta < 0 ? 7 : -7);
}

// Keyboard event handlers
function keyPressed() {
    controls.handleKeyPressed(keyCode, key);
}

function keyReleased() {
    controls.handleKeyReleased(keyCode, key);
    return false;
}

// Touch event handlers
function touchStarted() {
    if (ui.elements.toolbar && touches.length === 1) {
        const touch = touches[0];
        if (touch.x > ui.elements.toolbar.offsetLeft && 
            touch.x < ui.elements.toolbar.offsetLeft + ui.elements.toolbar.offsetWidth && 
            touch.y > ui.elements.toolbar.offsetTop && 
            touch.y < ui.elements.toolbar.offsetTop + ui.elements.toolbar.offsetHeight) {
            return false;
        }
    }
    
    mobileUI.handleTouchStart(touches);
    return false;
}

function touchMoved() {
    return mobileUI.handleTouchMove(touches);
}

function touchEnded() {
    return mobileUI.handleTouchEnd();
}

// Make functions globally available
window.setup = setup;
window.draw = draw;
window.windowResized = windowResized;
window.mousePressed = mousePressed;
window.mouseMoved = mouseMoved;
window.mouseDragged = mouseDragged;
window.mouseReleased = mouseReleased;
window.mouseWheel = mouseWheel;
window.keyPressed = keyPressed;
window.keyReleased = keyReleased;
window.touchStarted = touchStarted;
window.touchMoved = touchMoved;
window.touchEnded = touchEnded; 