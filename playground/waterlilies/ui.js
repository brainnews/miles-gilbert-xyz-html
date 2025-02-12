// Buttons
const closePortfolioBtn = document.getElementById('closePortfolioBtn');
const showPortfolioBtn = document.getElementById('showPortfolio');
const showAboutBtn = document.getElementById('aboutBtn');
const closeAboutBtn = document.getElementById('closeAboutBtn');

// Containers
const screen = document.getElementById('screen');
const portfolio = document.getElementById('portfolio');
const about = document.getElementById('about');

closePortfolioBtn.addEventListener('click', () => {
    portfolio.classList.add('hidden');
    screen.classList.remove('hidden');
});

showPortfolioBtn.addEventListener('click', () => {
    portfolio.classList.remove('hidden');
    screen.classList.add('hidden');
});

closeAboutBtn.addEventListener('click', () => {
    about.classList.add('hidden');
    screen.classList.remove('hidden');
});

showAboutBtn.addEventListener('click', () => {
    about.classList.remove('hidden');
    screen.classList.add('hidden');
});

// Touch events
closePortfolioBtn.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent default touch behavior
    portfolio.classList.add('hidden');
    screen.classList.remove('hidden');
});

showPortfolioBtn.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent default touch behavior
    portfolio.classList.remove('hidden');
    screen.classList.add('hidden');
});

closeAboutBtn.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent default touch behavior
    about.classList.add('hidden');
    screen.classList.remove('hidden');
});

showAboutBtn.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent default touch behavior
    about.classList.remove('hidden');
    screen.classList.add('hidden');
});