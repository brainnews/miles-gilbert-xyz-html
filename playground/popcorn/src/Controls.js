export class Controls {
    constructor(gameState) {
        this.gameState = gameState;
        this.shiftPressed = false;
        this.mKeyPressed = false;
        this.xKeyPressed = false;
        this.isMarqueeSelecting = false;
        this.marqueeStartX = 0;
        this.marqueeStartY = 0;
        this.marqueeEndX = 0;
        this.marqueeEndY = 0;
    }

    handleKeyPressed(keyCode, key) {
        if (keyCode === SHIFT) {
            this.shiftPressed = true;
        }
        if (key === 'm' || key === 'M') {
            this.mKeyPressed = true;
        }
        if (key === 'x' || key === 'X') {
            this.xKeyPressed = true;
        }
        
        this.handleSpecialKeys(key);
    }

    handleKeyReleased(keyCode, key) {
        if (keyCode === SHIFT) {
            this.shiftPressed = false;
            if (this.isMarqueeSelecting) {
                this.finalizeMarqueeSelection();
                this.isMarqueeSelecting = false;
            }
        }
        if (key === 'm' || key === 'M') {
            this.mKeyPressed = false;
        }
        if (key === 'x' || key === 'X') {
            this.xKeyPressed = false;
        }
    }

    handleSpecialKeys(key) {
        switch(key) {
            case 'Backspace':
                this.handleBackspace();
                break;
            case 'Escape':
                this.handleEscape();
                break;
            case 'l':
            case 'L':
                this.handleLockKey();
                break;
            case 'c':
            case 'C':
                this.handleColorKey();
                break;
        }
    }

    handleBackspace() {
        if (this.gameState.selectedParticles.length > 0) {
            this.gameState.removeSelectedParticles();
        } else {
            this.gameState.resetParticles();
        }
    }

    handleEscape() {
        this.gameState.deselectAllParticles();
        this.isMarqueeSelecting = false;
    }

    handleLockKey() {
        if (this.gameState.selectedParticles.length > 0) {
            const event = new Event('click');
            document.getElementById('lockBtn').dispatchEvent(event);
        }
    }

    handleColorKey() {
        if (this.gameState.selectedParticles.length > 0) {
            this.gameState.changeSelectedParticlesColor();
        }
    }

    handleMousePressed(mouseX, mouseY, toolbar) {
        // Check if click is inside toolbar
        if (this.isClickInsideToolbar(mouseX, mouseY, toolbar)) {
            return;
        }

        if (this.shiftPressed) {
            this.startMarqueeSelection(mouseX, mouseY);
            return;
        }

        if (this.gameState.particles.length === 0) {
            this.gameState.createParticles(mouseX, mouseY);
            return;
        }

        this.handleParticleClick(mouseX, mouseY);
    }

    isClickInsideToolbar(mouseX, mouseY, toolbar) {
        return mouseX > toolbar.offsetLeft && 
               mouseX < toolbar.offsetLeft + toolbar.offsetWidth && 
               mouseY > toolbar.offsetTop && 
               mouseY < toolbar.offsetTop + toolbar.offsetHeight;
    }

    startMarqueeSelection(mouseX, mouseY) {
        this.isMarqueeSelecting = true;
        this.marqueeStartX = mouseX;
        this.marqueeStartY = mouseY;
        this.marqueeEndX = mouseX;
        this.marqueeEndY = mouseY;
    }

    handleParticleClick(mouseX, mouseY) {
        let clicked = false;
        for (let particle of this.gameState.particles) {
            if (this.isClickOnParticle(mouseX, mouseY, particle)) {
                if (this.xKeyPressed) {
                    this.gameState.splitParticle(particle);
                } else {
                    this.gameState.toggleParticleSelection(particle);
                }
                clicked = true;
                break;
            }
        }
        
        if (!clicked) {
            this.gameState.createParticles(mouseX, mouseY);
        }
    }

    isClickOnParticle(mouseX, mouseY, particle) {
        return dist(mouseX, mouseY, particle.body.position.x, particle.body.position.y) < particle.size/2;
    }

    handleMouseDragged(mouseX, mouseY) {
        if (this.isMarqueeSelecting) {
            this.marqueeEndX = mouseX;
            this.marqueeEndY = mouseY;
            return false;
        }
        return true;
    }

    handleMouseReleased() {
        if (this.isMarqueeSelecting) {
            this.finalizeMarqueeSelection();
            this.isMarqueeSelecting = false;
            return false;
        }
        return true;
    }

    finalizeMarqueeSelection() {
        const x1 = min(this.marqueeStartX, this.marqueeEndX);
        const y1 = min(this.marqueeStartY, this.marqueeEndY);
        const x2 = max(this.marqueeStartX, this.marqueeEndX);
        const y2 = max(this.marqueeStartY, this.marqueeEndY);
        
        // Minimum size check
        if (abs(x2 - x1) < 10 || abs(y2 - y1) < 10) {
            this.gameState.clearParticleHoverStates();
            return;
        }
        
        this.gameState.selectParticlesInArea(x1, y1, x2, y2);
    }

    drawMarquee() {
        if (!this.isMarqueeSelecting) return;
        
        noFill();
        stroke(255, 255, 255, 180);
        strokeWeight(2);
        
        const x = min(this.marqueeStartX, this.marqueeEndX);
        const y = min(this.marqueeStartY, this.marqueeEndY);
        const w = abs(this.marqueeEndX - this.marqueeStartX);
        const h = abs(this.marqueeEndY - this.marqueeStartY);
        
        rect(x, y, w, h);
        
        // Dashed line effect
        strokeWeight(1);
        stroke(255, 255, 255, 120);
        drawingContext.setLineDash([5, 5]);
        rect(x, y, w, h);
        drawingContext.setLineDash([]);
    }
} 