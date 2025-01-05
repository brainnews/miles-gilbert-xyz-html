class ImageCarousel extends HTMLElement {
    constructor() {
        super();
        this.currentSlide = 0;
        this.slides = [];
        this.attachShadow({ mode: 'open' });

        // Initial render
        this.render();
        this.setupEventListeners();
    }

    static get observedAttributes() {
        return ['data-source']; // JSON data source URL
    }

    get template() {
        return `
            <style>
                :host {
                    display: block;
                    width: 100%;
                }

                .carousel-container {
                    position: relative;
                    width: 100%;
                    max-width: 1200px;
                    margin: 0 auto;
                }

                .work-image {
                    position: relative;
                    width: 100%;
                    padding-top: 56.25%; /* 16:9 Aspect Ratio */
                    border-radius: 20px;
                    overflow: hidden;
                }

                .work-image img {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    filter: saturate(130%);
                    transition: transform 0.3s ease;
                }

                .work-info {
                    position: absolute;
                    bottom: 20px;
                    left: 20px;
                    background-color: rgba(0, 0, 0, 0.75);
                    border-radius: 10px;
                    padding: 15px;
                    color: blanchedalmond;
                    transition: all 0.3s ease;
                }

                .work-info h2 {
                    margin: 0 80px 5px 0;
                    font-size: 1em;
                }

                .work-info p {
                    margin: 0;
                    font-size: 1em;
                    opacity: 0.9;
                }

                .work-info .year {
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    font-size: 0.9em;
                    opacity: 0.8;
                }

                .carousel-nav {
                    position: absolute;
                    top: 47%;
                    transform: translateY(-50%);
                    width: 100%;
                    display: flex;
                    justify-content: space-between;
                    padding: 0 20px;
                    pointer-events: none;
                    box-sizing: border-box;
                }

                .nav-button {
                    background: rgba(0, 0, 0, 0.75);
                    border: none;
                    color: white;
                    padding: 15px;
                    cursor: pointer;
                    border-radius: 10px;
                    transition: all 0.3s ease;
                    pointer-events: auto;
                }

                .nav-button:hover {
                    background: rgba(0, 0, 0, 0.9);
                    transform: scale(1.1);
                }

                .carousel-dots {
                    display: flex;
                    justify-content: center;
                    gap: 6px;
                    margin-top: 20px;
                    padding: 0 20px;
                }

                .dot {
                    width: 10px;
                    height: 4px;
                    border-radius: 20px;
                    background-color: rgb(255 235 205 / 20%);
                    cursor: pointer;
                    transition: all 0.3s ease;
                    flex-grow: 1;
                    border: none;
                }

                .dot.active {
                    background: blanchedalmond;
                }

                .slide {
                    display: none;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }

                .slide.active {
                    display: block;
                    opacity: 1;
                }

                .no-featured {
                    text-align: center;
                    padding: 2rem;
                    color: #666;
                }

                @media (max-width: 768px) {
                    .work-image {
                        border-radius: 0px;
                    }
                    .work-info {
                        padding: 10px;
                        bottom: 10px;
                        left: 10px;
                        right: 10px;
                    }

                    .work-info h2 {
                        font-size: 1em;
                    }

                    .nav-button {
                        padding: 10px;
                    }
                }
            </style>
            <div class="carousel-container">
                <div class="carousel-slides"></div>
                <div class="carousel-nav">
                    <button class="nav-button prev" aria-label="Previous slide">←</button>
                    <button class="nav-button next" aria-label="Next slide">→</button>
                </div>
                <div class="carousel-dots"></div>
            </div>
        `;
    }

    async connectedCallback() {
        await this.loadProjects();
    }

    async loadProjects() {
        try {
            const dataSource = this.getAttribute('data-source');
            if (!dataSource) {
                throw new Error('No data source specified');
            }

            const response = await fetch(dataSource);
            const allProjects = await response.json();
            
            // Filter for featured projects only
            const featuredProjects = allProjects.filter(project => project.featured === true);
            
            if (featuredProjects.length === 0) {
                this.showNoFeaturedMessage();
            } else {
                this.setupSlides(featuredProjects);
            }
            
        } catch (error) {
            console.error('Error loading projects:', error);
            // Load placeholder data for demo
            this.setupSlides([
                {
                    title: "AI Feedback Tool",
                    tagline: "Streamlining creative review process with AI",
                    year: "2024",
                    image: "/api/placeholder/1200/675",
                    featured: true
                }
            ]);
        }
    }

    showNoFeaturedMessage() {
        const slidesContainer = this.shadowRoot.querySelector('.carousel-slides');
        slidesContainer.innerHTML = `
            <div class="no-featured">
                <h2>No Featured Projects</h2>
                <p>Check back later for featured work samples.</p>
            </div>
        `;
        
        // Hide navigation and dots when there are no featured projects
        this.shadowRoot.querySelector('.carousel-nav').style.display = 'none';
        this.shadowRoot.querySelector('.carousel-dots').style.display = 'none';
    }

    render() {
        this.shadowRoot.innerHTML = this.template;
    }

    setupSlides(projects) {
        const slidesContainer = this.shadowRoot.querySelector('.carousel-slides');
        slidesContainer.innerHTML = '';

        projects.forEach((project, index) => {
            const slide = document.createElement('div');
            slide.className = `slide ${index === 0 ? 'active' : ''}`;
            slide.innerHTML = `
                <div class="work-image">
                    <img src="./images/thumbs/${project.slug}.jpg" 
                         alt="${project.title}" 
                         loading="${index === 0 ? 'eager' : 'lazy'}"
                         aria-label="${project.title} - ${project.tagline}">
                    <div class="work-info">
                        <h2>${project.title}</h2>
                        <p>${project.tagline}</p>
                        <span class="year">${project.year}</span>
                    </div>
                </div>
            `;
            slidesContainer.appendChild(slide);
        });

        this.slides = Array.from(this.shadowRoot.querySelectorAll('.slide'));
        
        // Only show navigation and dots if there's more than one slide
        if (this.slides.length > 1) {
            this.setupDots(projects.length);
            this.shadowRoot.querySelector('.carousel-nav').style.display = 'flex';
            this.shadowRoot.querySelector('.carousel-dots').style.display = 'flex';
        } else {
            this.shadowRoot.querySelector('.carousel-nav').style.display = 'none';
            this.shadowRoot.querySelector('.carousel-dots').style.display = 'none';
        }
        
        this.updateAriaLabels();
    }

    setupEventListeners() {
        // Navigation buttons
        this.shadowRoot.querySelector('.prev').addEventListener('click', () => this.prevSlide());
        this.shadowRoot.querySelector('.next').addEventListener('click', () => this.nextSlide());

        // Keyboard navigation
        this.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Touch events
        let touchStartX = 0;
        this.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        });

        this.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const diff = touchStartX - touchEndX;
            
            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    this.nextSlide();
                } else {
                    this.prevSlide();
                }
            }
        });
    }

    setupDots(count) {
        const dotsContainer = this.shadowRoot.querySelector('.carousel-dots');
        dotsContainer.innerHTML = '';
        
        for (let i = 0; i < count; i++) {
            const dot = document.createElement('button');
            dot.className = `dot ${i === 0 ? 'active' : ''}`;
            dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
            dot.addEventListener('click', () => this.goToSlide(i));
            dotsContainer.appendChild(dot);
        }
    }

    nextSlide() {
        this.currentSlide = (this.currentSlide + 1) % this.slides.length;
        this.updateSlides();
    }

    prevSlide() {
        this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
        this.updateSlides();
    }

    goToSlide(index) {
        this.currentSlide = index;
        this.updateSlides();
    }

    updateSlides() {
        this.slides.forEach((slide, index) => {
            slide.className = `slide ${index === this.currentSlide ? 'active' : ''}`;
        });

        this.shadowRoot.querySelectorAll('.dot').forEach((dot, index) => {
            dot.className = `dot ${index === this.currentSlide ? 'active' : ''}`;
        });

        this.updateAriaLabels();
    }

    updateAriaLabels() {
        this.slides.forEach((slide, index) => {
            slide.setAttribute('aria-hidden', index !== this.currentSlide);
        });
    }

    handleKeyboard(e) {
        if (e.key === 'ArrowLeft') {
            this.prevSlide();
        } else if (e.key === 'ArrowRight') {
            this.nextSlide();
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'data-source' && oldValue !== newValue) {
            this.loadProjects();
        }
    }
}

// Register the custom element
customElements.define('image-carousel', ImageCarousel);