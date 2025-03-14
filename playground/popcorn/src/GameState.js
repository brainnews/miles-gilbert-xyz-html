import { DEFAULT_SPAWN_COUNT, MAX_PARTICLES } from './Config.js';
import { PhysicsParticle } from './Particle.js';

export class GameState {
    constructor(physics, ui) {
        this.physics = physics;
        this.ui = ui;
        this.particles = [];
        this.selectedParticles = [];
        this.lockedParticles = [];
        this.spawnCount = DEFAULT_SPAWN_COUNT;
        this.baseSize = this.calculateBaseSize();
        this.previousColor = [random(0, 255), random(0, 255), random(0, 255)];
    }

    calculateBaseSize() {
        return min(windowWidth, windowHeight) * 0.04;
    }

    createParticles(x, y) {
        let color;
        
        if (this.ui.isRandomColor) {
            color = this.generateRandomColor();
        } else {
            color = [...this.ui.currentPickedColor];
        }

        for (let i = 0; i < this.spawnCount; i++) {
            const particle = new PhysicsParticle(x, y, color, this.ui.currentShape, this.physics.world, this.baseSize);
            this.particles.push(particle);
        }

        this.previousColor = color;
        this.updateUI();
    }

    generateRandomColor() {
        let noiseValue1 = noise(this.previousColor[0]);
        let noiseValue2 = noise(this.previousColor[1]);
        let noiseValue3 = noise(this.previousColor[2]);
        return [
            map(noiseValue1, 0, 1, 0, 255),
            map(noiseValue2, 0, 1, 0, 255),
            map(noiseValue3, 0, 1, 0, 255)
        ];
    }

    removeSelectedParticles() {
        for (let particle of this.selectedParticles) {
            const lockedIndex = this.lockedParticles.indexOf(particle);
            if (lockedIndex !== -1) {
                this.lockedParticles.splice(lockedIndex, 1);
            }
            
            particle.remove(this.physics.world);
            this.particles.splice(this.particles.indexOf(particle), 1);
        }
        this.selectedParticles = [];
        this.updateUI();
    }

    clearAllParticles() {
        for (let particle of this.particles) {
            particle.remove(this.physics.world);
        }
        this.particles = [];
        this.lockedParticles = [];
        this.selectedParticles = [];
        this.updateUI();
    }

    toggleSelectedParticlesLock() {
        for (let particle of this.selectedParticles) {
            if (!particle.isLocked) {
                particle.setLocked(true);
                this.lockedParticles.push(particle);
            } else {
                particle.setLocked(false);
                const index = this.lockedParticles.indexOf(particle);
                if (index !== -1) {
                    this.lockedParticles.splice(index, 1);
                }
            }
        }
        
        this.deselectAllParticles();
    }

    selectParticle(particle) {
        if (this.selectedParticles.indexOf(particle) === -1) {
            this.selectedParticles.push(particle);
            particle.isSelected = true;
        }
        this.updateUI();
    }

    deselectParticle(particle) {
        const index = this.selectedParticles.indexOf(particle);
        if (index !== -1) {
            this.selectedParticles.splice(index, 1);
            particle.isSelected = false;
            particle.isHovered = false;
        }
        this.updateUI();
    }

    toggleParticleSelection(particle) {
        if (particle.isSelected) {
            this.deselectParticle(particle);
        } else {
            this.selectParticle(particle);
        }
    }

    deselectAllParticles() {
        for (let particle of this.particles) {
            particle.isSelected = false;
            particle.isHovered = false;
        }
        this.selectedParticles = [];
        this.updateUI();
    }

    selectAllParticles() {
        this.deselectAllParticles();
        for (let particle of this.particles) {
            this.selectParticle(particle);
        }
    }

    selectParticlesInArea(x1, y1, x2, y2) {
        for (let particle of this.particles) {
            const pos = particle.body.position;
            if (pos.x >= x1 && pos.x <= x2 && pos.y >= y1 && pos.y <= y2) {
                this.selectParticle(particle);
            }
            particle.isHovered = false;
        }
    }

    clearParticleHoverStates() {
        for (let particle of this.particles) {
            if (!particle.isSelected) {
                particle.isHovered = false;
            }
        }
    }

    changeSelectedParticlesColor() {
        for (let particle of this.selectedParticles) {
            if (this.ui.isRandomColor) {
                particle.color = this.generateRandomColor();
            } else {
                particle.color = [...this.ui.currentPickedColor];
            }
        }
    }

    splitParticle(particle) {
        const fragments = particle.split(this.physics.world);
        
        // Remove the original particle
        this.removeParticle(particle);
        
        // Add the new fragments
        this.particles.push(...fragments);
        this.updateUI();
    }

    removeParticle(particle) {
        particle.remove(this.physics.world);
        
        // Remove from all arrays
        this.particles = this.particles.filter(p => p !== particle);
        this.selectedParticles = this.selectedParticles.filter(p => p !== particle);
        this.lockedParticles = this.lockedParticles.filter(p => p !== particle);
        
        this.updateUI();
    }

    adjustSpawnCount(delta) {
        this.spawnCount = constrain(this.spawnCount + delta, 10, 100);
    }

    resetParticles() {
        if (this.particles.length === 0) return;
        
        const unlockParticles = this.particles.filter(p => !p.isLocked);
        if (unlockParticles.length === 0) return;
        
        const centerParticle = random(unlockParticles);
        const centerPos = centerParticle.body.position;
        const removalRadius = min(windowWidth, windowHeight) * 0.15;
        
        const toRemove = this.particles.filter(particle => {
            if (particle.isLocked) return false;
            const pos = particle.body.position;
            return dist(centerPos.x, centerPos.y, pos.x, pos.y) <= removalRadius;
        });
        
        for (let particle of toRemove) {
            this.removeParticle(particle);
        }
    }

    updateUI() {
        this.ui.updateParticleCount(this.particles.length);
        this.ui.updateSelectionButtons(this.selectedParticles.length > 0);
        
        // Clean up if too many particles
        while (this.particles.length > MAX_PARTICLES) {
            this.removeParticle(this.particles[0]);
        }
    }

    resize() {
        this.baseSize = this.calculateBaseSize();
    }

    draw() {
        for (let particle of this.particles) {
            particle.draw();
        }
    }
} 