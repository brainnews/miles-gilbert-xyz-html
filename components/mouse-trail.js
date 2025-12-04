/**
 * Pixelated Mouse Trail Effect with Gravity
 * Creates a playful retro-style trail that falls and piles up at the bottom
 */
class MouseTrail {
    constructor() {
        this.particles = [];
        this.maxParticles = 200;
        this.colors = ['#7c5cff', '#9d7dff', '#5c4cdd', '#8c6cef'];
        this.isEnabled = true;
        this.animationId = null;
        this.gravity = 0.5;
        this.maxVelocity = 15;

        this.init();
    }

    init() {
        // Bind event handlers
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.animate = this.animate.bind(this);

        // Start listening to mouse movement
        document.addEventListener('mousemove', this.handleMouseMove);

        // Start animation loop
        this.animate();
    }

    handleMouseMove(e) {
        if (!this.isEnabled) return;

        // Create particle every few pixels of movement to avoid spam
        const now = Date.now();
        if (!this.lastSpawn || now - this.lastSpawn > 50) {
            this.createParticle(e.clientX, e.clientY);
            this.lastSpawn = now;
        }

        // Clean up old particles
        if (this.particles.length > this.maxParticles) {
            const oldParticle = this.particles.shift();
            if (oldParticle.element && oldParticle.element.parentNode) {
                oldParticle.element.parentNode.removeChild(oldParticle.element);
            }
        }
    }

    createParticle(x, y) {
        const element = document.createElement('div');
        element.className = 'mouse-trail-pixel';

        // Random size for pixelated effect
        const size = Math.random() > 0.5 ? 10 : 8;

        // Random color from palette
        const color = this.colors[Math.floor(Math.random() * this.colors.length)];

        // Position at cursor with slight random offset
        const offsetX = (Math.random() - 0.5) * 8;

        element.style.width = `${size}px`;
        element.style.height = `${size}px`;
        element.style.backgroundColor = color;

        document.body.appendChild(element);

        // Create particle object with physics properties
        const particle = {
            element: element,
            x: x + offsetX,
            y: y,
            velocityY: 1, // Start with initial downward velocity
            size: size,
            age: 0,
            isResting: false
        };

        this.particles.push(particle);

        // Remove particle after some time
        setTimeout(() => {
            this.removeParticle(particle);
        }, 15000);
    }

    animate() {
        const windowHeight = window.innerHeight;

        // Update all particles
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];

            if (!particle.isResting) {
                // Apply gravity
                particle.velocityY += this.gravity;

                // Cap velocity
                if (particle.velocityY > this.maxVelocity) {
                    particle.velocityY = this.maxVelocity;
                }

                // Update position
                particle.y += particle.velocityY;

                // Check collision with bottom
                // Account for translate(-50%, -50%) which centers the particle on its coordinates
                if (particle.y + (particle.size / 2) >= windowHeight) {
                    particle.y = windowHeight - (particle.size / 2);
                    particle.velocityY = 0;
                    particle.isResting = true;
                } else {
                    // Check collision with other particles
                    const collision = this.checkCollision(particle, i);
                    if (collision) {
                        particle.y = collision.restY;
                        particle.velocityY = 0;
                        particle.isResting = true;
                    }
                }

                // Update DOM position
                particle.element.style.left = `${particle.x}px`;
                particle.element.style.top = `${particle.y}px`;
            }

            particle.age++;
        }

        // Continue animation loop
        this.animationId = requestAnimationFrame(this.animate);
    }

    checkCollision(particle, currentIndex) {
        // Check if particle collides with any particle below it
        for (let i = 0; i < this.particles.length; i++) {
            if (i === currentIndex) continue;

            const other = this.particles[i];

            // Only check particles that are resting (not still falling)
            if (!other.isResting) continue;

            // Only check particles that are below and close horizontally
            if (other.y < particle.y) continue;

            const dx = Math.abs(particle.x - other.x);
            const dy = particle.y + particle.size - other.y;

            // Check if particles overlap horizontally and vertically touching/overlapping
            if (dx < particle.size && dy >= 0 && dy < particle.size + 2) {
                return {
                    restY: other.y - particle.size
                };
            }
        }

        return null;
    }

    removeParticle(particle) {
        if (particle.element && particle.element.parentNode) {
            particle.element.classList.add('mouse-trail-fade');

            setTimeout(() => {
                if (particle.element && particle.element.parentNode) {
                    particle.element.parentNode.removeChild(particle.element);
                }

                const index = this.particles.indexOf(particle);
                if (index > -1) {
                    this.particles.splice(index, 1);
                }
            }, 600);
        }
    }

    destroy() {
        this.isEnabled = false;
        document.removeEventListener('mousemove', this.handleMouseMove);

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        // Clean up all particles
        this.particles.forEach(particle => {
            if (particle.element && particle.element.parentNode) {
                particle.element.parentNode.removeChild(particle.element);
            }
        });
        this.particles = [];
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.mouseTrail = new MouseTrail();
    });
} else {
    window.mouseTrail = new MouseTrail();
}

// Add CSS styles
const style = document.createElement('style');
style.textContent = `
    .mouse-trail-pixel {
        position: fixed;
        pointer-events: none;
        z-index: 9999;
        border-radius: 2px;
        opacity: 0.9;
        transform: translate(-50%, -50%);
        transition: none;
    }

    .mouse-trail-fade {
        opacity: 0 !important;
        transition: opacity 0.6s ease !important;
    }
`;
document.head.appendChild(style);
