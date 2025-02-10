// Function to resize an image (unchanged)
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

// Function to save artwork to portfolio
function saveToPortfolio(studentImage) {
  try {
    const portfolio = JSON.parse(localStorage.getItem('artPortfolio') || '[]');
    // Add new entry
    const newEntry = {
      id: Date.now(),
      date: new Date().toISOString(),
      image: studentImage
    };
    
    // Add to beginning of array (most recent first)
    portfolio.unshift(newEntry);
    
    // Keep only the most recent 50 entries to manage localStorage size
    const trimmedPortfolio = portfolio.slice(0, 50);
    
    // Check if we can store this data
    const dataString = JSON.stringify(trimmedPortfolio);
    if (dataString.length > 4.5 * 1024 * 1024) { // 4.5MB safety limit
      throw new Error('Portfolio storage is full. Please clear some old entries.');
    }
    
    localStorage.setItem('artPortfolio', dataString);
  } catch (error) {
    console.error('Error saving to portfolio:', error);
    alert('There was an error saving to your portfolio. ' + error.message);
  }
}

// Function to display portfolio
// Function to clear the portfolio
function clearPortfolio() {
  if (confirm('Are you sure you want to clear your portfolio? This cannot be undone.')) {
    localStorage.removeItem('artPortfolio');
    // hide portfolio
    document.getElementById('portfolio-container').innerHTML = '';
    document.getElementById('portfolio').classList.add('hidden');
    document.getElementById('showPortfolio').classList.remove('active');
  }
}

// add event listener to clearPortfolio button
document.getElementById('clearPortfolio').addEventListener('click', clearPortfolio);

function updatePortfolioDisplay() {
  const portfolioDiv = document.getElementById('portfolio-container');
  if (!portfolioDiv) return;

  const portfolio = JSON.parse(localStorage.getItem('artPortfolio') || '[]');
  
  if (portfolio.length === 0) return;

  portfolioDiv.innerHTML = '';

  // Show all entries in the portfolio in reverse order
  portfolio.forEach(entry => {
    const entryElement = document.createElement('div');
    entryElement.className = 'portfolio-entry';
    entryElement.innerHTML = `
      <div class="portfolio-image">
        <img src="${entry.image}" alt="Artwork from ${new Date(entry.date).toLocaleDateString()}" />
      </div>
      <p class="portfolio-date">${new Date(entry.date).toLocaleDateString()}</p>
    `;
     // Add the new entry at the beginning of the portfolio
     portfolioDiv.appendChild(entryElement);
  })
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
      printBtn.textContent = 'Capturing...';

      const canvas = document.getElementById('defaultCanvas0');
      if (!canvas) {
        throw new Error('Canvas element not found');
      }

      const referenceImage = document.getElementById('referenceImage');
      if (!referenceImage) {
        throw new Error('Reference image not found');
      }

      const studentImageBase64 = await resizeImage(canvas.toDataURL());
      
      // Save to portfolio
      saveToPortfolio(studentImageBase64);
      
      // update portfolio display
      updatePortfolioDisplay();

    } catch (error) {
      console.error('Error analyzing image:', error);
      alert('There was an error analyzing your artwork. Please try again.');
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
});