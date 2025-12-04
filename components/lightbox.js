/**
 * Simple Lightbox Module
 * Automatically activates for all images on the page
 */
class Lightbox {
    constructor() {
        this.lightboxElement = null;
        this.imageElement = null;
        this.closeButton = null;
        this.isOpen = false;
        this.focusedElementBeforeOpen = null;

        this.init();
    }

    init() {
        // Bind event handlers first
        this.handleClose = this.handleClose.bind(this);
        this.handleKeydown = this.handleKeydown.bind(this);

        // Create lightbox DOM structure
        this.createLightbox();

        // Add click listeners to all images on the page
        this.attachImageListeners();
    }

    createLightbox() {
        // Create lightbox container
        this.lightboxElement = document.createElement('div');
        this.lightboxElement.className = 'lightbox';
        this.lightboxElement.setAttribute('role', 'dialog');
        this.lightboxElement.setAttribute('aria-modal', 'true');
        this.lightboxElement.setAttribute('aria-label', 'Image viewer');

        // Create close button
        this.closeButton = document.createElement('button');
        this.closeButton.className = 'lightbox-close';
        this.closeButton.setAttribute('aria-label', 'Close lightbox');
        this.closeButton.innerHTML = '×';
        this.closeButton.addEventListener('click', this.handleClose);

        // Create image container
        const imageContainer = document.createElement('div');
        imageContainer.className = 'lightbox-image-container';

        // Create image element
        this.imageElement = document.createElement('img');
        this.imageElement.className = 'lightbox-image';
        this.imageElement.alt = '';

        // Assemble structure
        imageContainer.appendChild(this.imageElement);
        this.lightboxElement.appendChild(this.closeButton);
        this.lightboxElement.appendChild(imageContainer);

        // Add to document
        document.body.appendChild(this.lightboxElement);

        // Add click listener to close on any click
        this.lightboxElement.addEventListener('click', this.handleClose);
        this.imageElement.addEventListener('click', this.handleClose);
    }

    attachImageListeners() {
        // Get all images on the page
        const images = document.querySelectorAll('img');

        images.forEach(img => {
            // Don't add lightbox to images inside links or with specific classes to exclude
            const isInsideLink = img.closest('a') !== null;
            const hasExcludeClass = img.classList.contains('no-lightbox');

            if (!isInsideLink && !hasExcludeClass) {
                img.style.cursor = 'pointer';
                img.addEventListener('click', (e) => {
                    this.open(img.src, img.alt);
                });
            }
        });
    }

    open(imageSrc, imageAlt) {
        // Store currently focused element
        this.focusedElementBeforeOpen = document.activeElement;

        // Set image source and alt text
        this.imageElement.src = imageSrc;
        this.imageElement.alt = imageAlt || '';

        // Show lightbox
        this.lightboxElement.classList.add('lightbox-active');
        this.isOpen = true;

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        // Add keyboard listener
        document.addEventListener('keydown', this.handleKeydown);

        // Focus close button for accessibility
        setTimeout(() => {
            this.closeButton.focus();
        }, 100);
    }

    close() {
        // Hide lightbox
        this.lightboxElement.classList.remove('lightbox-active');
        this.isOpen = false;

        // Restore body scroll
        document.body.style.overflow = '';

        // Remove keyboard listener
        document.removeEventListener('keydown', this.handleKeydown);

        // Clear image source
        this.imageElement.src = '';

        // Return focus to element that opened lightbox
        if (this.focusedElementBeforeOpen) {
            this.focusedElementBeforeOpen.focus();
        }
    }

    handleClose(e) {
        e.preventDefault();
        this.close();
    }

    handleKeydown(e) {
        if (e.key === 'Escape' && this.isOpen) {
            this.close();
        }
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new Lightbox();
    });
} else {
    new Lightbox();
}

// Add CSS styles
const style = document.createElement('style');
style.textContent = `
    .lightbox {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(232, 230, 225, 0.95);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
    }

    .lightbox-active {
        opacity: 1;
        pointer-events: auto;
    }

    .lightbox-image-container {
        max-width: 70vw;
        max-height: 70vh;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .lightbox-image {
        max-width: 100%;
        max-height: 70vh;
        height: auto;
        width: auto;
        object-fit: contain;
        border-radius: 4px;
        cursor: pointer;
    }

    .lightbox-close {
        position: fixed;
        top: 24px;
        right: 24px;
        background: none;
        border: none;
        font-size: 32px;
        line-height: 1;
        color: var(--text-color, #1a1a1a);
        cursor: pointer;
        padding: 4px;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: opacity 0.2s ease;
        font-family: inherit;
        z-index: 10001;
    }

    .lightbox-close:hover {
        opacity: 0.7;
    }

    .lightbox-close:focus {
        outline: none;
    }

    /* Mobile adjustments */
    @media (max-width: 768px) {
        .lightbox-close {
            top: 16px;
            right: 16px;
            font-size: 28px;
            width: 36px;
            height: 36px;
        }

        .lightbox-image-container {
            max-width: 80vw;
            max-height: 80vh;
        }
    }
`;
document.head.appendChild(style);
