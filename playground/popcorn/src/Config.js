// Configuration constants for the application
export const LONG_PRESS_DURATION = 500; // ms
export const MAX_PARTICLES = 1000;
export const DEFAULT_SPAWN_COUNT = 37;
export const PADDING = 2.5;
export const SHAPES = ['circle', 'square', 'triangle'];

// Physics configuration
export const PHYSICS_CONFIG = {
    gravity: 0.5,
    friction: 0.3,
    restitution: 0.4,
    density: 0.001
};

// UI configuration
export const UI_CONFIG = {
    toolbarBlur: '10px',
    baseGlowColor: '#ffc864',
    modalBackgroundColor: 'rgba(0, 0, 0, 0.5)'
};

// Mobile configuration
export const MOBILE_CONFIG = {
    minTouchDistance: 20,
    longPressRadius: 6, // In baseSize units
    minPinchThreshold: 2
}; 