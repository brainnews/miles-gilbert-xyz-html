// Function to resize an image
async function resizeImage(imageDataUrl, maxWidth = 256, maxHeight = 256) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.src = imageDataUrl;
  });
}

// Function to save canvas state to portfolio
async function saveToPortfolio() {
  try {
    const portfolio = JSON.parse(localStorage.getItem('artPortfolio') || '[]');
    
    // Capture thumbnail of current state
    const canvas = document.getElementById('defaultCanvas0');
    const thumbnailDataUrl = await resizeImage(canvas.toDataURL(), 150, 150);

    // Create a state object with the current placement of all elements
    const newState = {
      id: Date.now(),
      date: new Date().toISOString(),
      thumbnail: thumbnailDataUrl,
      rocks: rocks.map(rock => ({
        x: rock.x,
        y: rock.y,
        size: rock.size
      })),
      lilies: lilies.map(lily => ({
        x: lily.x,
        y: lily.y,
        size: lily.size,
        rotation: lily.rotation,
        hasFlower: lily.hasFlower,
        targetX: lily.targetX,
        targetY: lily.targetY
      })),
      fish: fish.map(fish => ({
        x: fish.x,
        y: fish.y,
        size: fish.size,
        angle: fish.angle,
        velocity: fish.velocity,
        color: fish.color.toString()
      }))
    };
    
    // Add to beginning of array (most recent first)
    portfolio.unshift(newState);
    
    // Keep only the most recent 50 states
    const trimmedPortfolio = portfolio.slice(0, 50);
    
    // Check if we can store this data
    const dataString = JSON.stringify(trimmedPortfolio);
    if (dataString.length > 4.5 * 1024 * 1024) {
      throw new Error('Portfolio storage is full. Please clear some old entries.');
    }
    
    localStorage.setItem('artPortfolio', dataString);
    
    // Update the portfolio display
    updatePortfolioDisplay();
    
  } catch (error) {
    console.error('Error saving to portfolio:', error);
    alert('There was an error saving to your portfolio. ' + error.message);
  }
}

// Function to load a state from portfolio
function loadState(state) {
  try {
    // Clear current state
    rocks = [];
    lilies = [];
    fish = [];
    
    // Load rocks
    state.rocks.forEach(rockData => {
      rocks.push({
        x: rockData.x,
        y: rockData.y,
        size: rockData.size
      });
    });
    
    // Load lilies
    state.lilies.forEach(lilyData => {
      const lily = new WaterLily(lilyData.x, lilyData.y);
      lily.size = lilyData.size;
      lily.rotation = lilyData.rotation;
      lily.hasFlower = lilyData.hasFlower;
      lily.targetX = lilyData.targetX;
      lily.targetY = lilyData.targetY;
      lilies.push(lily);
    });
    
    // Load fish
    state.fish.forEach(fishData => {
      const newFish = new Fish(fishData.x, fishData.y);
      newFish.size = fishData.size;
      newFish.angle = fishData.angle;
      newFish.velocity = fishData.velocity;
      newFish.color = color(fishData.color);
      fish.push(newFish);
    });
    
    // Reset water simulation
    current = new Array(cols).fill(0).map(() => new Array(rows).fill(0));
    previous = new Array(cols).fill(0).map(() => new Array(rows).fill(0));
    
    // Hide portfolio after loading
    document.getElementById('portfolio').classList.add('hidden');
    document.getElementById('showPortfolio').classList.remove('active');
    document.getElementById('screen').classList.remove('hidden');
    
  } catch (error) {
    console.error('Error loading state:', error);
    alert('There was an error loading the saved state. ' + error.message);
  }
}

// Function to display portfolio
function updatePortfolioDisplay() {
  const portfolioDiv = document.getElementById('portfolio-container');
  if (!portfolioDiv) return;

  const portfolio = JSON.parse(localStorage.getItem('artPortfolio') || '[]');
  
  if (portfolio.length === 0) {
    portfolioDiv.innerHTML = '<div class="portfolio-empty">No saved states yet. Create something beautiful and save it!</div>';
    return;
  }

  portfolioDiv.innerHTML = '';

  // Show all entries in the portfolio
  portfolio.forEach(state => {
    const entryElement = document.createElement('div');
    entryElement.className = 'portfolio-entry';
    entryElement.innerHTML = `
      <div class="portfolio-content">
        <div class="portfolio-thumbnail">
          <img src="${state.thumbnail}" alt="State thumbnail" />
        </div>
        <div class="portfolio-info">
          <p class="portfolio-date">${new Date(state.date).toLocaleDateString()}</p>
          <p class="portfolio-stats">
            ${state.rocks.length} rocks, 
            ${state.lilies.length} lilies, 
            ${state.fish.length} fish
          </p>
        </div>
        <div class="portfolio-actions">
          <button class="load-btn small">Load</button>
          <button class="delete-btn small">Delete</button>
        </div>
      </div>
    `;

    // Add event listeners
    entryElement.querySelector('.load-btn').addEventListener('click', () => loadState(state));
    entryElement.querySelector('.delete-btn').addEventListener('click', () => {
      if (confirm('Are you sure you want to delete this saved state?')) {
        const updatedPortfolio = portfolio.filter(item => item.id !== state.id);
        localStorage.setItem('artPortfolio', JSON.stringify(updatedPortfolio));
        updatePortfolioDisplay();
      }
    });

    portfolioDiv.appendChild(entryElement);
  });
}

// Handle both click and touch events
function addTouchAndClickHandler(element, handler) {
  let touchTimeout;
  let isTouch = false;

  element.addEventListener('touchstart', (e) => {
    isTouch = true;
    touchTimeout = setTimeout(() => {
      handler(e);
    }, 200);
  }, { passive: true });

  element.addEventListener('touchend', (e) => {
    if (touchTimeout) {
      clearTimeout(touchTimeout);
    }
  }, { passive: true });

  element.addEventListener('touchmove', (e) => {
    if (touchTimeout) {
      clearTimeout(touchTimeout);
    }
  }, { passive: true });

  element.addEventListener('click', (e) => {
    if (!isTouch) {  // Only handle click if it's not a touch event
      handler(e);
    }
    isTouch = false;
  });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const printBtn = document.querySelector('#printBtn');
  if (!printBtn) {
    console.error('Print button not found');
    return;
  }

  // Initialize portfolio display
  updatePortfolioDisplay();

  addTouchAndClickHandler(printBtn, async (e) => {
    try {
      printBtn.disabled = true;
      printBtn.textContent = 'Saving...';
      
      // Save the current state
      saveToPortfolio();

    } catch (error) {
      console.error('Error saving state:', error);
      alert('There was an error saving your artwork. Please try again.');
    } finally {
      setTimeout(() => {
        printBtn.disabled = false;
        printBtn.textContent = '👍';
        setTimeout(() => {
          printBtn.textContent = '📸';
        }, 1000);
      }, 1000);
    }
  });

  // Add event listener for clearing portfolio
  document.getElementById('clearPortfolio').addEventListener('click', () => {
    if (confirm('Are you sure you want to clear your portfolio? This cannot be undone.')) {
      localStorage.removeItem('artPortfolio');
      updatePortfolioDisplay();
    }
  });

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
});