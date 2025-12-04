/**
 * Simple Image Carousel Module
 * Reusable carousel component with keyboard navigation and lightbox integration
 */
class ImageCarousel {
    constructor(element) {
        this.carousel = element;
        this.images = Array.from(element.querySelectorAll('.carousel-image'));
        this.currentIndex = 0;
        this.prevButton = null;
        this.nextButton = null;

        this.init();
    }

    init() {
        // Bind event handlers
        this.handlePrev = this.handlePrev.bind(this);
        this.handleNext = this.handleNext.bind(this);
        this.handleKeydown = this.handleKeydown.bind(this);

        // Create navigation buttons
        this.createControls();

        // Set initial state
        this.showImage(0);

        // Add keyboard navigation
        document.addEventListener('keydown', this.handleKeydown);
    }

    createControls() {
        // Create previous button
        this.prevButton = document.createElement('button');
        this.prevButton.className = 'carousel-prev';
        this.prevButton.setAttribute('aria-label', 'Previous image');
        this.prevButton.innerHTML = '‹';
        this.prevButton.addEventListener('click', this.handlePrev);

        // Create next button
        this.nextButton = document.createElement('button');
        this.nextButton.className = 'carousel-next';
        this.nextButton.setAttribute('aria-label', 'Next image');
        this.nextButton.innerHTML = '›';
        this.nextButton.addEventListener('click', this.handleNext);

        // Add buttons to carousel
        this.carousel.appendChild(this.prevButton);
        this.carousel.appendChild(this.nextButton);
    }

    showImage(index) {
        // Hide all images
        this.images.forEach(img => {
            img.classList.remove('carousel-image-active');
        });

        // Show current image
        this.images[index].classList.add('carousel-image-active');
        this.currentIndex = index;

        // Update button states
        this.updateButtons();
    }

    updateButtons() {
        // Disable prev button on first image
        if (this.currentIndex === 0) {
            this.prevButton.disabled = true;
            this.prevButton.style.opacity = '0.3';
        } else {
            this.prevButton.disabled = false;
            this.prevButton.style.opacity = '1';
        }

        // Disable next button on last image
        if (this.currentIndex === this.images.length - 1) {
            this.nextButton.disabled = true;
            this.nextButton.style.opacity = '0.3';
        } else {
            this.nextButton.disabled = false;
            this.nextButton.style.opacity = '1';
        }
    }

    handlePrev(e) {
        e.preventDefault();
        if (this.currentIndex > 0) {
            this.showImage(this.currentIndex - 1);
        }
    }

    handleNext(e) {
        e.preventDefault();
        if (this.currentIndex < this.images.length - 1) {
            this.showImage(this.currentIndex + 1);
        }
    }

    handleKeydown(e) {
        // Only handle keyboard events when carousel is in view
        const rect = this.carousel.getBoundingClientRect();
        const isInView = rect.top < window.innerHeight && rect.bottom > 0;

        if (isInView) {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.handlePrev(e);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                this.handleNext(e);
            }
        }
    }

    destroy() {
        document.removeEventListener('keydown', this.handleKeydown);
        this.prevButton.removeEventListener('click', this.handlePrev);
        this.nextButton.removeEventListener('click', this.handleNext);
    }
}

// Auto-initialize all carousels when DOM is ready
function initCarousels() {
    const carousels = document.querySelectorAll('.image-carousel');
    carousels.forEach(carousel => {
        new ImageCarousel(carousel);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCarousels);
} else {
    initCarousels();
}

// Add CSS styles
const style = document.createElement('style');
style.textContent = `
    .image-carousel {
        position: relative;
        width: 100%;
        overflow: hidden;
        margin: 40px 0 0 0;
    }

    .carousel-track {
        position: relative;
        width: 100%;
        padding-bottom: 66.67%; /* 3:2 aspect ratio */
    }

    .carousel-image {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: contain;
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
        cursor: pointer;
    }

    .carousel-image-active {
        opacity: 1;
        pointer-events: auto;
    }

    .carousel-prev,
    .carousel-next {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        background: rgba(232, 230, 225, 0.9);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(26, 26, 26, 0.1);
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        line-height: 1;
        color: var(--text-color, #1a1a1a);
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: inherit;
        z-index: 10;
    }

    .carousel-prev {
        left: 16px;
    }

    .carousel-next {
        right: 16px;
    }

    .carousel-prev:hover:not(:disabled),
    .carousel-next:hover:not(:disabled) {
        border-color: var(--link-underline, #4a7c59);
        background: rgba(232, 230, 225, 1);
    }

    .carousel-prev:disabled,
    .carousel-next:disabled {
        cursor: not-allowed;
    }

    .carousel-prev:focus,
    .carousel-next:focus {
        outline: none;
        border-color: var(--link-underline, #4a7c59);
    }

    /* Mobile adjustments */
    @media (max-width: 768px) {
        .carousel-prev,
        .carousel-next {
            width: 36px;
            height: 36px;
            font-size: 20px;
        }

        .carousel-prev {
            left: 12px;
        }

        .carousel-next {
            right: 12px;
        }
    }
`;
document.head.appendChild(style);
