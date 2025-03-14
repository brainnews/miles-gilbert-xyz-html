import { PHYSICS_CONFIG } from './Config.js';

export class PhysicsManager {
    constructor() {
        this.engine = Matter.Engine.create();
        this.world = this.engine.world;
        this.boundaries = [];
        
        // Set gravity
        this.engine.world.gravity.y = PHYSICS_CONFIG.gravity;
        
        // Start the physics engine
        Matter.Runner.run(this.engine);
    }

    createBoundaries(windowWidth, windowHeight) {
        // Clear existing boundaries
        for (let boundary of this.boundaries) {
            Matter.World.remove(this.world, boundary);
        }
        this.boundaries = [];

        // Create new boundaries
        const ground = Matter.Bodies.rectangle(
            windowWidth/2, 
            windowHeight + 25, 
            windowWidth, 
            50, 
            { 
                isStatic: true,
                friction: PHYSICS_CONFIG.friction,
                restitution: PHYSICS_CONFIG.restitution
            }
        );
        
        const leftWall = Matter.Bodies.rectangle(
            -25, 
            windowHeight/2, 
            50, 
            windowHeight, 
            { isStatic: true }
        );
        
        const rightWall = Matter.Bodies.rectangle(
            windowWidth + 25, 
            windowHeight/2, 
            50, 
            windowHeight, 
            { isStatic: true }
        );
        
        this.boundaries = [ground, leftWall, rightWall];
        Matter.World.add(this.world, this.boundaries);
    }

    resize(windowWidth, windowHeight) {
        this.createBoundaries(windowWidth, windowHeight);
    }
} 