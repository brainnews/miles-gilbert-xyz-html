document.addEventListener('DOMContentLoaded', () => {
    const images = document.querySelectorAll('.fade-in');
    const nav = document.querySelector('nav');
    nav.innerHTML = '<a class="nav-link" href="../../"><span class="material-symbols-outlined">arrow_back</span><img class="logo" src="../../images/wordmark.svg"></a>';

    const options = {
        root: null, // Use the viewport as the container
        threshold: .2 // Trigger when 100% of the image is visible
    };

    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-animation'); // Add wiggle class
                imageObserver.unobserve(entry.target); // Stop observing after animation
            }
        });
    }, options);

    images.forEach(image => {
        imageObserver.observe(image); // Observe each image
    });
});


function createSideBar() {
    const nav = document.querySelector('nav');
    const sections = document.querySelectorAll('section');
    //append to nav
    sections.forEach(section => {
        //only apply to sections with class "target-section"
        if (section.classList.contains('target-section')) {
            const link = document.createElement('a');
            link.className = 'nav-link';
            link.href = '#' + section.id;
            //get the text content of the h3 from the section
            link.textContent = section.children[0].textContent;
            link.dataset.target = section.id;
            nav.appendChild(link);
        }
    });

    const navLinks = document.querySelectorAll('.nav-link');
    navLinks[0].textContent = 'Intro';

    const sectionObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.target.classList.contains('target-section')) {
                    const targetButton = document.querySelector(`.nav-link[data-target="${entry.target.id}"]`);
                    if (entry.isIntersecting) {
                        targetButton.style.opacity = '1';
                    } else {
                        targetButton.style.opacity = '0.3';
                    }
                }
            });
        },
        { threshold: 0.15 }
    );

    sections.forEach(section => sectionObserver.observe(section));

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent default anchor behavior
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            const yOffset = -54; // 30px offset
            const y = targetSection.getBoundingClientRect().top + window.pageYOffset + yOffset;

            window.scrollTo({top: y, behavior: 'smooth'});
        });
    });
}