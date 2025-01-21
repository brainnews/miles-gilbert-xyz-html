document.addEventListener('DOMContentLoaded', () => {
    // Define the component
    class ProgressMeter extends HTMLElement {
        static get observedAttributes() {
            return ['enabled'];
        }

        constructor() {
            super();
            console.log('[ProgressMeter] Constructor called');
            
            // Create shadow root only if it doesn't exist
            if (!this.shadowRoot) {
                this.attachShadow({ mode: 'open' });
            }
            
            // Initialize state
            this._initialized = false;
            this._mounted = false;
            
            // Bind methods
            this.handleScroll = this.handleScroll.bind(this);
            this.handleIndicatorClick = this.handleIndicatorClick.bind(this);
        }
        
        render() {
            console.log('[ProgressMeter] Rendering');
            if (!this.shadowRoot) return;
            
            // Clear existing content
            this.shadowRoot.innerHTML = '';
            
            // Add styles
            this.shadowRoot.appendChild(this.createStyles());
            
            // Create and add main elements
            const elements = this.createElements();
            Object.values(elements).forEach(element => {
                this.shadowRoot.appendChild(element);
            });
            
            // Store references to elements we need to update
            this.progressBar = elements.container.querySelector('.progress-bar');
            this.scrollIndicator = elements.indicator;
            
            // Add click handler to scroll indicator
            this.scrollIndicator.addEventListener('click', this.handleIndicatorClick);
            
            this._initialized = true;
        }
        
        createStyles() {
            const style = document.createElement('style');
            style.textContent = `
                :host {
                    display: block;
                    position: fixed;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    pointer-events: none;
                    z-index: 1000;
                }
                
                .progress-container {
                    position: absolute;
                    right: 0;
                    top: 0;
                    width: 4px;
                    height: 100vh;
                    background: #eee;
                    pointer-events: auto;
                }
                
                .progress-bar {
                    width: 100%;
                    height: 0%;
                    background: #2563eb;
                    transition: height 0.1s;
                }
                
                .scroll-indicator {
                    position: fixed;
                    right: 12px;
                    width: 40px;
                    height: 40px;
                    background: #2563eb;
                    border-radius: 50%;
                    transform: translateY(-50%);
                    transition: top 0.1s;
                    cursor: pointer;
                    pointer-events: auto;
                }
                
                .scroll-indicator:hover {
                    background: #1d4ed8;
                }
            `;
            return style;
        }
        
        createElements() {
            const container = document.createElement('div');
            container.setAttribute('class', 'progress-container');
            
            const progressBar = document.createElement('div');
            progressBar.setAttribute('class', 'progress-bar');
            container.appendChild(progressBar);
            
            const indicator = document.createElement('div');
            indicator.setAttribute('class', 'scroll-indicator');
            
            return {
                container,
                indicator
            };
        }
        
        handleIndicatorClick() {
            window.scrollTo({
                top: this.currentScrollPercentage * this.maxScroll,
                behavior: 'smooth'
            });
        }
        
        handleScroll() {
            if (!this._initialized || !this._mounted) return;
            
            const windowHeight = window.innerHeight;
            this.maxScroll = document.documentElement.scrollHeight - windowHeight;
            const currentScroll = window.scrollY;
            this.currentScrollPercentage = currentScroll / this.maxScroll;
            
            if (this.progressBar && this.scrollIndicator) {
                this.progressBar.style.height = `${this.currentScrollPercentage * 100}%`;
                this.scrollIndicator.style.top = `${this.currentScrollPercentage * 100}%`;
            }
        }
        
        connectedCallback() {
            console.log('[ProgressMeter] Connected');
            this._mounted = true;
            
            // Initial render if not already done
            if (!this._initialized) {
                this.render();
            }
            
            // Add event listeners
            window.addEventListener('scroll', this.handleScroll, { passive: true });
            window.addEventListener('resize', this.handleScroll, { passive: true });
            
            // Initial position
            requestAnimationFrame(() => {
                this.handleScroll();
            });
        }
        
        disconnectedCallback() {
            console.log('[ProgressMeter] Disconnected');
            this._mounted = false;
            
            window.removeEventListener('scroll', this.handleScroll);
            window.removeEventListener('resize', this.handleScroll);
            
            if (this.scrollIndicator) {
                this.scrollIndicator.removeEventListener('click', this.handleIndicatorClick);
            }
        }
    }

    // Register the component if it hasn't been registered yet
    if (!customElements.get('progress-meter')) {
        console.log('[ProgressMeter] Registering component');
        customElements.define('progress-meter', ProgressMeter);
    }
});