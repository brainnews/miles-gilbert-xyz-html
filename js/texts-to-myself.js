const CHANNEL_SLUG = 'texts-to-myself';
let currentIndex = 0;

async function fetchArenaChannel() {
    try {
        const response = await fetch(`https://api.are.na/v2/channels/${CHANNEL_SLUG}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.contents
            .filter(block => block.class === 'Text')
            .map(block => block.content);
    } catch (error) {
        console.error('Error fetching from Are.na:', error);
        return [];
    }
}

function showText(texts) {
    const container = document.querySelector('.texts-to-myself');
    if (!container) return;
    
    // Clear current text
    container.innerHTML = '';
    
    // Create and show new text
    const div = document.createElement('div');
    div.className = 'texts active';
    div.textContent = texts[currentIndex];
    container.appendChild(div);
    
    // Update index for next time
    currentIndex = (currentIndex + 1) % texts.length;
}

async function initialize() {
    const texts = await fetchArenaChannel();
    if (texts.length === 0) return;
    
    // Show first text immediately
    showText(texts);
    
    // Cycle every 5 seconds
    setInterval(() => showText(texts), 5000);
}

// Start when page loads
document.addEventListener('DOMContentLoaded', initialize);