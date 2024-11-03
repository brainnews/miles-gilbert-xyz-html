document.addEventListener('DOMContentLoaded', () => {
    const images = document.querySelectorAll('.fade-in');

    const options = {
        root: null, // Use the viewport as the container
        threshold: 1 // Trigger when 100% of the image is visible
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-animation'); // Add wiggle class
                observer.unobserve(entry.target); // Stop observing after animation
            }
        });
    }, options);

    images.forEach(image => {
        observer.observe(image); // Observe each image
    });
});
