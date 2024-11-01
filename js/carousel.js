const carousel = document.querySelector('.carousel-inner');
const items = document.querySelectorAll('.carousel-item');
const descriptions = document.querySelectorAll('.carousel-description');
const dotsContainer = document.querySelector('.carousel-dots');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const autoplayBtn = document.getElementById('autoplayBtn');
const infoContainer = document.querySelector('.carousel-info');
let currentIndex = 0;
let autoplayInterval;
const autoplayDelay = 5000; // 5 seconds

// Touch variables
let touchStartX = 0;
let touchEndX = 0;

// Create dots
items.forEach((_, index) => {
    const dot = document.createElement('div');
    dot.classList.add('carousel-dot');
    dot.addEventListener('click', () => goToSlide(index));
    dotsContainer.appendChild(dot);
});

function updateCarousel() {
    carousel.style.transform = `translateX(-${currentIndex * 100}%)`;
    document.querySelectorAll('.carousel-dot').forEach((dot, index) => {
        dot.classList.toggle('active', index === currentIndex);
    });
    updateDescription();
}

function updateDescription() {
    infoContainer.style.opacity = '0';
    setTimeout(() => {
        descriptions.forEach((desc, index) => {
            desc.classList.toggle('active', index === currentIndex);
        });
        infoContainer.style.opacity = '1';
    }, 300);
}

function goToSlide(index) {
    currentIndex = index;
    updateCarousel();
}

function nextSlide() {
    currentIndex = (currentIndex + 1) % items.length;
    updateCarousel();
}

function prevSlide() {
    currentIndex = (currentIndex - 1 + items.length) % items.length;
    updateCarousel();
}

function toggleAutoplay() {
    if (autoplayInterval) {
        clearInterval(autoplayInterval);
        autoplayInterval = null;
        autoplayBtn.classList.remove('playing');
        autoplayBtn.classList.add('paused');
    } else {
        autoplayInterval = setInterval(nextSlide, autoplayDelay);
        autoplayBtn.classList.remove('paused');
        autoplayBtn.classList.add('playing');
    }
}

prevBtn.addEventListener('click', () => {
    prevSlide();
    if (autoplayInterval) toggleAutoplay(); // Pause autoplay on manual navigation
});

nextBtn.addEventListener('click', () => {
    nextSlide();
    if (autoplayInterval) toggleAutoplay(); // Pause autoplay on manual navigation
});

autoplayBtn.addEventListener('click', toggleAutoplay);

// Touch events for swipe
carousel.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
});

carousel.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
});

function handleSwipe() {
    const swipeThreshold = 50; // minimum distance for swipe
    if (touchStartX - touchEndX > swipeThreshold) {
        nextSlide();
    } else if (touchEndX - touchStartX > swipeThreshold) {
        prevSlide();
    }
    if (autoplayInterval) toggleAutoplay(); // Pause autoplay on swipe
}

// Initialize
updateCarousel();

// Start autoplay by default
toggleAutoplay();