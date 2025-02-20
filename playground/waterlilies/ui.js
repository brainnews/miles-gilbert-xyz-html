// Buttons
const closeGameSavesBtn = document.getElementById('closeGameSavesBtn');
const loadGameBtn = document.getElementById('loadGameBtn');
const showAboutBtn = document.getElementById('aboutBtn');
const closeAboutBtn = document.getElementById('closeAboutBtn');
const gameMenuBtn = document.getElementById('gameMenuBtn');
const gameMenu = document.getElementById('gameMenu');

// Containers
const screen = document.getElementById('screen');
const portfolio = document.getElementById('portfolio');
const about = document.getElementById('about');


// close load game view
closeGameSavesBtn.addEventListener('click', () => {
    portfolio.classList.add('hidden');
    screen.classList.remove('hidden');
});

closeGameSavesBtn.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent default touch behavior
    portfolio.classList.add('hidden');
    screen.classList.remove('hidden');
});

// show load game view
loadGameBtn.addEventListener('click', () => {
    portfolio.classList.remove('hidden');
    screen.classList.add('hidden');
    gameMenu.classList.add('hidden');
});

loadGameBtn.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent default touch behavior
    portfolio.classList.remove('hidden');
    screen.classList.add('hidden');
    gameMenu.classList.add('hidden');
});

// close about view
closeAboutBtn.addEventListener('click', () => {
    about.classList.add('hidden');
    screen.classList.remove('hidden');
});

closeAboutBtn.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent default touch behavior
    about.classList.add('hidden');
    screen.classList.remove('hidden');
});

// show about view
showAboutBtn.addEventListener('click', () => {
    about.classList.remove('hidden');
    screen.classList.add('hidden');
    gameMenu.classList.add('hidden');
});

showAboutBtn.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent default touch behavior
    about.classList.remove('hidden');
    screen.classList.add('hidden');
    gameMenu.classList.add('hidden');
});

// Game menu
gameMenuBtn.addEventListener('click', () => {
    const gameMenu = document.getElementById('gameMenu');
    gameMenu.classList.toggle('hidden');
});

gameMenuBtn.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent default touch behavior
    const gameMenu = document.getElementById('gameMenu');
    gameMenu.classList.toggle('hidden');
});

// listen for click and touch events on any element that does not have the id "gameMenu"
document.addEventListener('click', (e) => {
    if (e.target.id !== 'gameMenu' && e.target.id !== 'gameMenuBtn' && e.target.id !== 'loadGameBtn' && e.target.id !== 'saveGameBtn' && e.target.id !== 'resetGameBtn' && e.target.id !== 'debugBtn' && e.target.id !== 'aboutBtn') {
        gameMenu.classList.add('hidden');
    }
});

document.addEventListener('touchstart', (e) => {
    if (e.target.id !== 'gameMenu' && e.target.id !== 'gameMenuBtn') {
        gameMenu.classList.add('hidden');
    }
});