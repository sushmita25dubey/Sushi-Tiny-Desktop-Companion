class CharacterManager {
  constructor(imageElementId, containerElementId) {
    this.imageElement = document.getElementById(imageElementId);
    this.containerElement = document.getElementById(containerElementId);
    this.currentState = 'idle';
    this.cache = {};

    this.states = {
      idle: 'assets/idle.png',
      walk: 'assets/walk.png',
      blink: 'assets/blink.png',
      drink: 'assets/drink.png',
      happy: 'assets/happy.png',
      wave: 'assets/wave.png',
      sleep: 'assets/sleep.png',
      laptop: 'assets/laptop.png',
      water: 'assets/water.png',
      'look-around': 'assets/idle.png',
      'tiny-bounce': 'assets/idle.png'
    };

    // Complete list of all assets to preload (including reference.png)
    this.assetPaths = [
      'assets/idle.png',
      'assets/walk.png',
      'assets/blink.png',
      'assets/drink.png',
      'assets/happy.png',
      'assets/wave.png',
      'assets/sleep.png',
      'assets/laptop.png',
      'assets/water.png',
      'assets/reference.png'
    ];
  }

  /**
   * Preloads every PNG asset and caches them.
   * Gracefully handles loading errors, printing the filename to console and continuing.
   */
  async preloadAssets() {
    const promises = this.assetPaths.map(path => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = path;
        img.onload = () => {
          // Decode the image off-main-thread to avoid any UI frame drops when swapping src
          if (typeof img.decode === 'function') {
            img.decode()
              .then(() => {
                this.cache[path] = img;
                resolve();
              })
              .catch(err => {
                // If decoding fails, cache it as is
                this.cache[path] = img;
                resolve();
              });
          } else {
            this.cache[path] = img;
            resolve();
          }
        };
        img.onerror = () => {
          // Error Handling: print the filename in console and continue running
          const filename = path.split('/').pop();
          console.error(`Failed to load asset: ${filename}`);
          resolve();
        };
      });
    });

    await Promise.all(promises);
  }

  /**
   * Switches the character state and updates the img element's source.
   * @param {string} stateName
   */
  setState(stateName) {
    if (!this.states[stateName]) {
      console.warn(`State "${stateName}" is not supported.`);
      return;
    }

    const path = this.states[stateName];
    this.currentState = stateName;

    if (this.imageElement) {
      // Set image source directly
      this.imageElement.src = path;

      // Update hardware-accelerated CSS animations based on character state
      this.imageElement.classList.remove('breathe', 'walking-bob', 'sleeping-breathe', 'look-around', 'tiny-bounce');

      if (stateName === 'idle' || stateName === 'happy' || stateName === 'blink') {
        this.imageElement.classList.add('breathe');
      } else if (stateName === 'walk') {
        this.imageElement.classList.add('walking-bob');
      } else if (stateName === 'sleep') {
        this.imageElement.classList.add('sleeping-breathe');
      } else if (stateName === 'look-around') {
        this.imageElement.classList.add('look-around');
      } else if (stateName === 'tiny-bounce') {
        this.imageElement.classList.add('tiny-bounce');
      }
    }
  }

  /**
   * Exposes the current character state.
   * @returns {string}
   */
  getCurrentState() {
    return this.currentState;
  }
}

// Expose to window scope so other scripts (like renderer.js) can instantiate it
window.CharacterManager = CharacterManager;
