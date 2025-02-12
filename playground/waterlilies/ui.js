// Add event listener for closing portfolio
document.getElementById('closePortfolioBtn').addEventListener('click', () => {
    document.getElementById('portfolio').classList.add('hidden');
    document.getElementById('screen').classList.remove('hidden');
});

// Add event listener for opening portfolio
document.getElementById('showPortfolio').addEventListener('click', () => {
    document.getElementById('portfolio').classList.remove('hidden');
    document.getElementById('screen').classList.add('hidden');
});

// add event listener for closing about
document.getElementById('closeAboutBtn').addEventListener('click', () => {
    document.getElementById('about').classList.add('hidden');
    document.getElementById('screen').classList.remove('hidden');
});

// add event listener for opening about
document.getElementById('aboutBtn').addEventListener('click', () => {
    document.getElementById('about').classList.remove('hidden');
    document.getElementById('screen').classList.add('hidden');
});