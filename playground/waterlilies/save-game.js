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
async function saveGame() {
  try {
    const portfolio = JSON.parse(localStorage.getItem('artPortfolio') || '[]');
    
    // Capture thumbnail of current state
    const canvas = document.getElementById('defaultCanvas0');
    const thumbnailDataUrl = await resizeImage(canvas.toDataURL(), 200, 200);

    // Get wallet value from DOM
    const walletElement = document.getElementById('wallet');
    const walletValue = parseInt(walletElement.textContent.replace('₳', ''));

    // Create a state object with the current placement of all elements
    const newState = {
      id: Date.now(),
      date: new Date().toISOString(),
      thumbnail: thumbnailDataUrl,
      // Game objects
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
        targetY: lily.targetY,
        age: lily.age,
        energy: lily.energy,
        maturityAge: lily.maturityAge,
        maxAge: lily.maxAge,
        decompositionStage: lily.decompositionStage,
        lastReproductionTime: lily.lastReproductionTime
      })),
      fish: fish.map(fish => ({
        x: fish.x,
        y: fish.y,
        size: fish.size,
        angle: fish.angle,
        velocity: fish.velocity,
        color: fish.color.toString(),
        age: fish.age,
        maxAge: fish.maxAge,
        energy: fish.energy,
        isHungry: fish.isHungry,
        eatingSpeed: fish.eatingSpeed
      })),
      foodParticles: foodParticles.map(food => ({
        x: food.x,
        y: food.y,
        size: food.size,
        energy: food.energy,
        age: food.age,
        maxAge: food.maxAge,
        lastRippleTime: food.lastRippleTime
      })),
      // Game state
      wallet: walletValue,
      timeController: {
        currentDate: timeController.getCurrentDate().toISOString(),
        isPlaying: timeController.isPlaying,
        milestones: timeController.milestones.map(milestone => ({
          date: milestone.date.toISOString(),
          id: milestone.id,
          title: milestone.title,
          triggered: milestone.triggered
        }))
      }
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
function loadGame(state) {
  try {
    // Clear current state
    rocks = [];
    lilies = [];
    fish = [];
    foodParticles = [];
    
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
      lily.age = lilyData.age;
      lily.energy = lilyData.energy;
      lily.maturityAge = lilyData.maturityAge;
      lily.maxAge = lilyData.maxAge;
      lily.decompositionStage = lilyData.decompositionStage;
      lily.lastReproductionTime = lilyData.lastReproductionTime;
      lilies.push(lily);
    });
    
    // Load fish
    state.fish.forEach(fishData => {
      const newFish = new Fish(fishData.x, fishData.y);
      newFish.size = fishData.size;
      newFish.angle = fishData.angle;
      newFish.velocity = fishData.velocity;
      newFish.color = color(fishData.color);
      newFish.age = fishData.age;
      newFish.maxAge = fishData.maxAge;
      newFish.energy = fishData.energy;
      newFish.isHungry = fishData.isHungry;
      newFish.eatingSpeed = fishData.eatingSpeed;
      fish.push(newFish);
    });

    // Load food particles
    if (state.foodParticles) {
      state.foodParticles.forEach(foodData => {
        const food = new FoodParticle(foodData.x, foodData.y);
        food.size = foodData.size;
        food.energy = foodData.energy;
        food.age = foodData.age;
        food.maxAge = foodData.maxAge;
        food.lastRippleTime = foodData.lastRippleTime;
        foodParticles.push(food);
      });
    }

    // Load wallet
    if (state.wallet !== undefined) {
      const walletElement = document.getElementById('wallet');
      walletElement.textContent = `₳${state.wallet}`;
    }

    // Load time controller state
    if (state.timeController) {
      timeController.currentDate = new Date(state.timeController.currentDate);
      timeController.isPlaying = state.timeController.isPlaying;
      
      // Load milestone states
      state.timeController.milestones.forEach((savedMilestone, index) => {
        timeController.milestones[index].date = new Date(savedMilestone.date);
        timeController.milestones[index].triggered = savedMilestone.triggered;
      });

      // Update UI
      timeController.updateDateDisplay();
      timeController.updatePlayPauseButton();
    }
    
    // Reset water simulation
    current = new Array(cols).fill(0).map(() => new Array(rows).fill(0));
    previous = new Array(cols).fill(0).map(() => new Array(rows).fill(0));
    
    // Hide portfolio after loading
    document.getElementById('portfolio').classList.add('hidden');
    document.getElementById('loadGameBtn').classList.remove('active');
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
          <button class="load-btn control-btn small">Load</button>
          <button class="control-btn small delete-btn">Delete</button>
        </div>
      </div>
    `;

    // Add event listeners
    entryElement.querySelector('.load-btn').addEventListener('click', () => loadGame(state));
    entryElement.querySelector('.delete-btn').addEventListener('click', () => {
      if (confirm('Are you sure you want to delete this saved state?')) {
        const updatedPortfolio = portfolio.filter(item => item.id !== state.id);
        localStorage.setItem('artPortfolio', JSON.stringify(updatedPortfolio));
        updatePortfolioDisplay();
      }
    });

    // add touch event listeners
    entryElement.querySelector('.load-btn').addEventListener('touchstart', (e) => {
      e.preventDefault(); // Prevent default touch behavior
      loadGame(state);
    });

    entryElement.querySelector('.delete-btn').addEventListener('touchstart', (e) => {
      e.preventDefault(); // Prevent default touch behavior
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
  const saveGameBtn = document.querySelector('#saveGameBtn');
  if (!saveGameBtn) {
    console.error('Save game button not found');
    return;
  }

  // Initialize portfolio display
  updatePortfolioDisplay();

  // Add event listener for printing
  saveGameBtn.addEventListener('click', async (e) => {
    try {
      saveGameBtn.disabled = true;
      saveGameBtn.innerHTML = 'Saving <span>⏳</span>';
      document.getElementById('defaultCanvas0').classList.add('claude-mode');
      document.querySelector('.claude-monet').classList.remove('hide');
      
      // Save the current state
      saveGame();

    } catch (error) {
      console.error('Error saving state:', error);
      alert('There was an error saving your artwork. Please try again.');
    } finally {
      setTimeout(() => {
        saveGameBtn.disabled = false;
        saveGameBtn.innerHTML = 'Saved <span>👍</span>';
        setTimeout(() => {
          document.getElementById('defaultCanvas0').classList.remove('claude-mode');
          document.querySelector('.claude-monet').classList.add('hide');
          saveGameBtn.innerHTML = 'Save game <span>💾</span>';
          document.getElementById('gameMenu').classList.add('hidden');
        }, 1000);
      }, 1000);
    }
  });

  saveGameBtn.addEventListener('touchstart', async (e) => {
    try {
      saveGameBtn.disabled = true;
      saveGameBtn.textContent = '⏳';
      
      // Save the current state
      saveGame();

    } catch (error) {
      console.error('Error saving state:', error);
      alert('There was an error saving your artwork. Please try again.');
    } finally {
      setTimeout(() => {
        saveGameBtn.disabled = false;
        saveGameBtn.innerHTML = '👍 <span class="hide-on-mobile">Enregistrée</span>';
        setTimeout(() => {
          saveGameBtn.innerHTML = '📸 <span class="hide-on-mobile">Enregistrer</span>';
        }, 1000);
      }, 1000);
    }
  });

  const clearGameSavesBtn = document.getElementById('clearGameSavesBtn');
  // Add event listener for clearing portfolio
  clearGameSavesBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear your portfolio? This cannot be undone.')) {
      localStorage.removeItem('artPortfolio');
      updatePortfolioDisplay();
    }
  });

  clearGameSavesBtn.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent default touch behavior
    if (confirm('Are you sure you want to clear your portfolio? This cannot be undone.')) {
      localStorage.removeItem('artPortfolio');
      updatePortfolioDisplay();
    }
  });
});