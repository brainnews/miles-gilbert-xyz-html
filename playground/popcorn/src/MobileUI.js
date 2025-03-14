import { LONG_PRESS_DURATION, MOBILE_CONFIG } from './Config.js';

export class MobileUI {
    constructor(gameState, ui) {
        this.gameState = gameState;
        this.ui = ui;
        this.longPressActive = false;
        this.previousTouchDistance = 0;
        this.touchStartTime = 0;
        this.touchStartPos = { x: 0, y: 0 };
        this.longPressTimer = null;

        if (this.isMobileDevice()) {
            this.setupMobileUI();
        }
    }

    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
            || window.innerWidth <= 768;
    }

    setupMobileUI() {
        this.createFloatingActionButton();
        this.createMobileMenu();
        this.setupMobileMenuItems();
    }

    createFloatingActionButton() {
        const fab = document.createElement('div');
        fab.id = 'mobileFab';
        fab.innerHTML = '<span class="material-symbols-outlined">more_vert</span>';
        document.body.appendChild(fab);
        
        this.styleFAB(fab);
        fab.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.toggleMobileMenu();
        });
    }

    styleFAB(fab) {
        Object.assign(fab.style, {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: '#ffc864',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '1000',
            fontSize: '24px'
        });
    }

    createMobileMenu() {
        const menu = document.createElement('div');
        menu.id = 'mobileMenu';
        Object.assign(menu.style, {
            display: 'none',
            position: 'fixed',
            bottom: '85px',
            right: '20px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '12px',
            padding: '10px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            zIndex: '999'
        });
        
        menu.innerHTML = this.getMobileMenuHTML();
        document.body.appendChild(menu);
    }

    getMobileMenuHTML() {
        return `
            <div class="mobile-menu-item" id="mobileSelectAll">Select All</div>
            <div class="mobile-menu-item" id="mobileColor">Change Color</div>
            <div class="mobile-menu-item" id="mobileShape">Change Shape</div>
            <div class="mobile-menu-item" id="mobileLock">Lock/Unlock</div>
            <div class="mobile-menu-item" id="mobileClear">Clear All</div>
            <div class="mobile-menu-item" id="mobileHelp">Help</div>
        `;
    }

    setupMobileMenuItems() {
        const menuItems = document.querySelectorAll('.mobile-menu-item');
        this.styleMobileMenuItems(menuItems);
        this.setupMobileMenuActions();
    }

    styleMobileMenuItems(items) {
        items.forEach(item => {
            Object.assign(item.style, {
                padding: '12px 16px',
                margin: '4px 0',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 200, 100, 0.2)',
                fontSize: '16px',
                fontWeight: 'bold'
            });
            
            this.setupMobileMenuItemInteraction(item);
        });
    }

    setupMobileMenuItemInteraction(item) {
        item.addEventListener('touchstart', function() {
            this.style.backgroundColor = 'rgba(255, 200, 100, 0.5)';
        });
        
        item.addEventListener('touchend', function() {
            this.style.backgroundColor = 'rgba(255, 200, 100, 0.2)';
        });
    }

    setupMobileMenuActions() {
        document.getElementById('mobileSelectAll').addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.gameState.selectAllParticles();
            this.toggleMobileMenu();
        });
        
        document.getElementById('mobileColor').addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.gameState.selectedParticles.length > 0) {
                document.dispatchEvent(new KeyboardEvent('keydown', { 'key': 'c' }));
            } else {
                this.ui.elements.currentColor.dispatchEvent(new Event('click'));
            }
            this.toggleMobileMenu();
        });
        
        document.getElementById('mobileShape').addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.ui.elements.shapeSelectBtn.dispatchEvent(new Event('click'));
            this.toggleMobileMenu();
        });
        
        document.getElementById('mobileLock').addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.gameState.selectedParticles.length > 0) {
                this.ui.elements.lockBtn.dispatchEvent(new Event('click'));
            }
            this.toggleMobileMenu();
        });
        
        document.getElementById('mobileClear').addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.ui.elements.clearBtn.dispatchEvent(new Event('click'));
            this.toggleMobileMenu();
        });
        
        document.getElementById('mobileHelp').addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.ui.elements.helpBtn.dispatchEvent(new Event('click'));
            this.toggleMobileMenu();
        });
    }

    toggleMobileMenu() {
        const mobileMenu = document.getElementById('mobileMenu');
        mobileMenu.style.display = mobileMenu.style.display === 'none' ? 'block' : 'none';
    }

    handleTouchStart(touches) {
        if (touches.length === 1) {
            this.touchStartTime = millis();
            this.touchStartPos = { x: touches[0].x, y: touches[0].y };
            
            clearTimeout(this.longPressTimer);
            this.longPressTimer = setTimeout(() => {
                if (touches.length === 1 && 
                    dist(touches[0].x, touches[0].y, this.touchStartPos.x, this.touchStartPos.y) < MOBILE_CONFIG.minTouchDistance) {
                    this.handleLongPress(touches[0].x, touches[0].y);
                }
            }, LONG_PRESS_DURATION);
        }
    }

    handleTouchMove(touches) {
        if (touches.length >= 2) {
            const currentDistance = dist(touches[0].x, touches[0].y, touches[1].x, touches[1].y);
            
            if (this.previousTouchDistance > 0) {
                const distanceDelta = currentDistance - this.previousTouchDistance;
                if (abs(distanceDelta) > MOBILE_CONFIG.minPinchThreshold) {
                    this.gameState.adjustSpawnCount(distanceDelta * 0.1);
                }
            }
            
            this.previousTouchDistance = currentDistance;
            return false;
        }
        
        this.previousTouchDistance = 0;
        return false;
    }

    handleTouchEnd() {
        clearTimeout(this.longPressTimer);
        this.longPressActive = false;
        return false;
    }

    handleLongPress(x, y) {
        const nearbyParticles = this.gameState.particles.filter(particle => 
            dist(x, y, particle.body.position.x, particle.body.position.y) < this.gameState.baseSize * MOBILE_CONFIG.longPressRadius
        );
        
        nearbyParticles.forEach(particle => {
            if (!particle.isSelected) {
                this.gameState.selectParticle(particle);
            }
        });
        
        if (nearbyParticles.length > 0) {
            this.longPressActive = true;
            setTimeout(() => {
                this.longPressActive = false;
            }, 300);
        }
    }
} 