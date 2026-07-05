class DialogueManager {
  constructor(speechManager) {
    this.speechManager = speechManager;
    this.dialogues = null;
    this.lastDialogueText = '';
  }

  /**
   * Fetches dialogues.json and parses the quotes. Falls back to hardcoded defaults on failure.
   */
  async loadDialogues() {
    try {
      const response = await fetch('dialogues.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.dialogues = await response.json();
    } catch (err) {
      console.error('Failed to load dialogues.json, using fallback quotes:', err);
      this.dialogues = {
        Greeting: [
          "Hi, I'm Sushi!❤️",
          "Hello! Let's code together!💻"
        ],
        MorningGreeting: [
          "Good morning! Ready for a productive coding session? 🌅",
          "Rise and shine! Let's build something awesome!☀️"
        ],
        EveningGreeting: [
          "Good evening! Let's wrap up our code nicely.🌇",
          "Evening! Hope you had a successful day of building!✨"
        ],
        Coding: [
          "Keep coding!😊",
          "Push to GitHub!",
          "Let's build something!✨"
        ],
        Water: [
          "Drink water 💧"
        ],
        Break: [
          "Small progress counts."
        ],
        Cute: [
          "You're doing amazing!😘"
        ],
        Motivation: [
          "Small progress counts."
        ]
      };
    }
  }

  /**
   * Displays a random dialogue from across all categories.
   * Guarantees that the same dialogue is never played twice consecutively.
   */
  showRandomDialogue() {
    if (!this.dialogues) return;

    // Flatten all dialogues from all categories
    const allDialogues = [];
    Object.keys(this.dialogues).forEach(category => {
      allDialogues.push(...this.dialogues[category]);
    });

    if (allDialogues.length === 0) return;

    // Filter out the last shown dialogue to prevent repetition
    const availableDialogues = allDialogues.filter(d => d !== this.lastDialogueText);
    
    let selectedDialogue;
    if (availableDialogues.length > 0) {
      selectedDialogue = availableDialogues[Math.floor(Math.random() * availableDialogues.length)];
    } else {
      selectedDialogue = allDialogues[0];
    }

    this.lastDialogueText = selectedDialogue;
    this.speechManager.show(selectedDialogue);
  }

  /**
   * Displays a random greeting dialogue when the application launches.
   */
  showRandomGreeting() {
    if (!this.dialogues) {
      this.speechManager.show("Hi, I'm Sushi!❤️");
      return;
    }

    const hour = new Date().getHours();
    let greetingsList = this.dialogues.Greeting;

    if (hour >= 5 && hour < 12) {
      // Morning (5:00 AM - 11:59 AM)
      if (this.dialogues.MorningGreeting && this.dialogues.MorningGreeting.length > 0) {
        greetingsList = this.dialogues.MorningGreeting;
      }
    } else if (hour >= 17 && hour < 22) {
      // Evening (5:00 PM - 9:59 PM)
      if (this.dialogues.EveningGreeting && this.dialogues.EveningGreeting.length > 0) {
        greetingsList = this.dialogues.EveningGreeting;
      }
    }

    if (!greetingsList || greetingsList.length === 0) {
      greetingsList = ["Hi, I'm Sushi!❤️"];
    }

    const selectedGreeting = greetingsList[Math.floor(Math.random() * greetingsList.length)];
    this.lastDialogueText = selectedGreeting;
    this.speechManager.show(selectedGreeting);
  }
}

// Expose class to window scope
window.DialogueManager = DialogueManager;
