class AnimationEngine {
  constructor(characterManager) {
    this.characterManager = characterManager;
    this.timerId = null;
    this.walkTimerId = null;
    this.drinkReminderId = null;
    this.blinkTimerId = null;
    this.isLooping = false;
    this.isWalking = false;
    this.isWalkEnabled = true;
    this.isSleeping = false;
    this.idleStates = ['idle', 'happy'];
  }

  start() {
    if (this.isLooping) return;
    this.isLooping = true;
    // Note: Timers and scheduling are driven by BehaviorManager.js
  }

  /**
   * Stops all loops, timers, walking, blinking, and reminders.
   */
  stop() {
    this.isLooping = false;
    this.isWalking = false;
    this.isSleeping = false;

    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.walkTimerId) {
      clearTimeout(this.walkTimerId);
      this.walkTimerId = null;
    }
    if (this.blinkTimerId) {
      clearTimeout(this.blinkTimerId);
      this.blinkTimerId = null;
    }
    if (this.drinkReminderId) {
      clearInterval(this.drinkReminderId);
      this.drinkReminderId = null;
    }
  }

  /**
   * Transition the character to the sleep state, clearing timers.
   */
  sleep() {
    this.isSleeping = true;
    this.abortWalk();
  }

  /**
   * Wake up the character, returning to the idle loop.
   */
  wakeUp() {
    this.isSleeping = false;
  }

  /**
   * Start the recurring natural blinking schedule (quick blinks every 2 to 6 seconds).
   */
  startNaturalBlinking() {
    // Legacy loop disabled. Blinking is managed by BehaviorManager.
  }

  /**
   * Triggers a quick 150ms blink state swap if in idle or happy state.
   */
  triggerBlink() {
    if (this.isSleeping || this.isWalking) return;

    const currentState = this.characterManager.getCurrentState();
    if (currentState === 'idle' || currentState === 'happy') {
      this.characterManager.setState('blink');
      setTimeout(() => {
        if (this.characterManager.getCurrentState() === 'blink') {
          this.characterManager.setState(currentState);
        }
      }, 150);
    }
  }

  /**
   * Start a recurring interval timer for drink water reminders (every 45 minutes).
   */
  startDrinkReminder() {
    // Legacy loop disabled. Drink reminder is managed by BehaviorManager.
  }

  /**
   * Trigger the drink animation and the water reminder speech bubble.
   */
  triggerDrinkReminder() {
    // Legacy loop disabled.
  }

  /**
   * Schedules the next random idle state switch (every 3 to 7 seconds).
   */
  scheduleNextStateChange() {
    // Legacy loop disabled.
  }

  /**
   * Selects a random state from idle, happy and sets it.
   */
  playRandomIdleState() {
    if (this.isSleeping) return;
    this.characterManager.setState('idle');
  }

  /**
   * Transitions to a specific state. Resumes random idle loop after duration if specified.
   */
  playState(stateName, duration = null) {
    this.characterManager.setState(stateName);
  }

  /**
   * Schedules the next walk behavior to trigger in 2 to 5 minutes.
   */
  scheduleNextWalk() {
    // Legacy loop disabled.
  }

  /**
   * Aborts any currently active walk. Called when the user drags the character.
   */
  abortWalk() {
    if (this.isWalking) {
      this.isWalking = false;
      const characterImg = document.getElementById('character');
      if (characterImg) {
        characterImg.classList.remove('flipped');
      }
    }
  }

  /**
   * Coordinates the walk sequence: pauses idle loop, performs smooth walking, flips character,
   * respects boundaries, and returns to idle loop upon completion.
   */
  async performWalk() {
    if (this.isWalking || this.isSleeping) return;
    this.isWalking = true;

    try {
      const [currentX, currentY] = await window.sushiAPI.getWindowPosition();
      const workArea = await window.sushiAPI.getWorkArea();
      
      const windowWidth = 640;
      
      // Boundaries to stay near bottom-right of the screen and never leave it
      const defaultX = workArea.x + workArea.width - windowWidth - 20;
      const minX = defaultX - 300; // Walk up to 300px away from the bottom-right corner
      const maxX = defaultX;

      // Pick a random distance between 40 and 120 pixels
      const distance = Math.floor(Math.random() * (120 - 40 + 1)) + 40;

      // Choose walking direction (left or right)
      let direction = Math.random() < 0.5 ? -1 : 1;

      // If chosen direction exceeds bounds, invert it
      let targetX = currentX + direction * distance;
      if (targetX < minX) {
        direction = 1;
        targetX = currentX + direction * distance;
      } else if (targetX > maxX) {
        direction = -1;
        targetX = currentX + direction * distance;
      }

      // Clamp target to ensure it absolutely never leaves the bottom-right screen region
      targetX = Math.max(minX, Math.min(maxX, targetX));

      // Perform smooth movement animation
      await this.animateWalk(currentX, targetX);

    } catch (err) {
      console.error('Error during Sushi walk sequence:', err);
    } finally {
      this.isWalking = false;
      
      // Ensure we clean up classes and return to idle state
      const characterImg = document.getElementById('character');
      if (characterImg) {
        characterImg.classList.remove('flipped');
      }

      // Return to idle state unless sleeping has started
      if (!this.isSleeping) {
        this.characterManager.setState('idle');
      }
    }
  }

  /**
   * Animates moving the Electron window smoothly using requestAnimationFrame.
   */
  animateWalk(startX, targetX) {
    return new Promise((resolve) => {
      const distance = targetX - startX;
      if (distance === 0) {
        resolve();
        return;
      }

      // Flip character sprite horizontally if walking to the right
      const characterImg = document.getElementById('character');
      if (characterImg) {
        if (distance > 0) {
          characterImg.classList.add('flipped');
        } else {
          characterImg.classList.remove('flipped');
        }
      }

      this.characterManager.setState('walk');

      const speed = 40; // Walk speed in pixels per second
      const duration = (Math.abs(distance) / speed) * 1000;
      const startTime = performance.now();
      let lastX = startX;

      const animate = (currentTime) => {
        // Abort animation loop if isWalking became false or sleeping started
        if (!this.isWalking || this.isSleeping) {
          resolve();
          return;
        }

        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const currentX = startX + distance * progress;
        const dx = Math.round(currentX - lastX);

        if (dx !== 0) {
          window.sushiAPI.moveWindow(dx, 0);
          lastX += dx;
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }
}

// Expose class to window scope
window.AnimationEngine = AnimationEngine;
