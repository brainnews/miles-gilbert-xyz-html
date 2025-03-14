import { PADDING, PHYSICS_CONFIG } from './Config.js';

export class PhysicsParticle {
    constructor(x, y, color, shape, world, baseSize) {
        this.size = random(baseSize * 0.75, baseSize * 1.5);
        this.createBody(x, y, shape);
        Matter.World.add(world, this.body);
        this.color = color;
        this.shape = shape;
        this.alpha = 255;
        this.isHovered = false;
        this.isSelected = false;
        this.isLocked = false;
    }

    createBody(x, y, shape) {
        const options = {
            friction: PHYSICS_CONFIG.friction,
            restitution: PHYSICS_CONFIG.restitution,
            angle: random(TWO_PI),
            density: PHYSICS_CONFIG.density
        };

        switch (shape) {
            case 'circle':
                this.body = Matter.Bodies.circle(x, y, this.size/2 + PADDING, options);
                break;
            case 'square':
                this.body = Matter.Bodies.rectangle(x, y, this.size + PADDING, this.size + PADDING, options);
                break;
            case 'triangle':
                this.body = Matter.Bodies.polygon(x, y, 3, this.size/1.8, options);
                break;
            default:
                this.body = Matter.Bodies.circle(x, y, this.size/2 + PADDING, options);
        }

        // Add initial velocity
        Matter.Body.setVelocity(this.body, { 
            x: random(-5, 5),
            y: random(-5, 0)
        });
    }

    draw() {
        let pos = this.body.position;
        let angle = this.body.angle;
        
        push();
        translate(pos.x, pos.y);
        rotate(angle);
        rectMode(CENTER);
        noStroke();
        
        this.drawParticleWithEffects();
        pop();
    }

    drawParticleWithEffects() {
        if (this.isHovered || this.isSelected) {
            this.drawSelectionEffect();
        }
        
        this.setParticleFill();
        this.drawParticleShape();
    }

    drawSelectionEffect() {
        fill(255, 255, 255, 100);
        stroke(255, 255, 255, 100);
        strokeWeight(4);
        this.drawParticleShape();
    }

    setParticleFill() {
        if (this.isLocked) {
            fill(
                this.color[0] + (255 - this.color[0]) * 0.4, 
                this.color[1] + (255 - this.color[1]) * 0.4, 
                this.color[2] + (255 - this.color[2]) * 0.4, 
                this.alpha
            );
        } else {
            fill(this.color[0], this.color[1], this.color[2], this.alpha);
        }
    }

    drawParticleShape() {
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
        }
    }

    remove(world) {
        Matter.World.remove(world, this.body);
    }

    setLocked(locked) {
        this.isLocked = locked;
        Matter.Body.setStatic(this.body, locked);
    }

    split(world, numFragments = random(4, 8)) {
        const fragments = [];
        const sizeReduction = 0.6;
        const newBaseSize = this.size * sizeReduction / 1.125;

        for (let i = 0; i < numFragments; i++) {
            const pos = this.body.position;
            const newParticle = new PhysicsParticle(pos.x, pos.y, this.color, this.shape, world, newBaseSize);
            
            const angle = random(TWO_PI);
            const force = random(2, 5);
            Matter.Body.setVelocity(newParticle.body, {
                x: cos(angle) * force,
                y: sin(angle) * force
            });
            
            fragments.push(newParticle);
        }

        return fragments;
    }
} 