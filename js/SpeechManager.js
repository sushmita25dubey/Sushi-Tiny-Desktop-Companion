class SpeechManager {
  constructor(bubbleElementId) {
    this.bubbleElement = document.getElementById(bubbleElementId);
    this.timeoutId = null;
    this.isSpeechEnabled = true;
  }

  /**
   * Displays the speech bubble with text, fades it in, and schedules a fade-out.
   * @param {string} text - Message to display
   * @param {number} duration - Time in milliseconds to show the speech (default 4000)
   */
  show(text, duration = 4000) {
    if (!this.bubbleElement || !this.isSpeechEnabled) return;

    // Clear any active fade-out timers
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    // Update text content
    this.bubbleElement.textContent = text;

    // Add class to trigger CSS fade-in
    this.bubbleElement.classList.add('show');

    // Schedule fade-out
    this.timeoutId = setTimeout(() => {
      this.bubbleElement.classList.remove('show');
      this.timeoutId = null;
    }, duration);
  }

  /**
   * Instantly hides the speech bubble.
   */
  hide() {
    if (this.bubbleElement) {
      this.bubbleElement.classList.remove('show');
    }
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}

// Expose class to window scope
window.SpeechManager = SpeechManager;
