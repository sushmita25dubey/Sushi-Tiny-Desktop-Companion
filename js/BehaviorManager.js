class BehaviorManager {
  constructor(characterManager, speechManager, dialogueManager, animationEngine) {
    this.characterManager = characterManager;
    this.speechManager = speechManager;
    this.dialogueManager = dialogueManager;
    this.animationEngine = animationEngine;

    this.currentState = 'idle'; // 'idle', 'busy'
    this.isWalkEnabled = true;

    this.schedulerTimeoutId = null;
    this.lastAction = '';
    this.lastDialogueText = '';

    // Action dialogue pools categorized by pose
    this.dialoguePools = {
      Idle: [
        "Keep coding! 💻",
        "One more bug!",
        "Push to GitHub!",
        "You got this!"
      ],
      Drink: [
        "Take a sip of water 💧",
        "Stay hydrated!",
        "Don't forget water!"
      ],
      Wave: [
        "Hi! 🌸",
        "I'm here!",
        "Let's build something!",
        "Need motivation?"
      ],
      Blink: [
        "Stretch a little!",
        "Rest your eyes 👀",
        "Take a short break!"
      ],
      Laptop: [
        "I'm checking your code 👀",
        "Looks productive!",
        "Need help?"
      ],
      Happy: [
        "Yay! 🎉",
        "Awesome!",
        "You're amazing!"
      ],
      Sleep: [
        "Zzz...",
        "Dreaming of clean code... 💤",
        "Napping..."
      ]
    };

    // Double click compliments
    this.compliments = [
      "You're doing amazing!😘",
      "You got this! Fighting!✊",
      "I'm super happy to be here with you!❤️",
      "You make coding look easy!🌟",
      "You're an absolute star!⭐",
      "Awesome job, keep it up!🚀"
    ];
  }

  /**
   * Starts the behavior selector loop.
   */
  start() {
    this.stop();
    this.currentState = 'idle';
    this.lastAction = '';
    this.lastDialogueText = '';

    console.log('BehaviorManager started');
    this.scheduleNextAction();
  }

  /**
   * Stops the behavior selector loop.
   */
  stop() {
    if (this.schedulerTimeoutId) {
      clearTimeout(this.schedulerTimeoutId);
      this.schedulerTimeoutId = null;
    }
  }

  /**
   * Helper to get a random delay.
   */
  getRandomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Selects a random dialogue from the category matching the pose.
   */
  selectDialogue(poseName) {
    const pool = this.dialoguePools[poseName] || ["Hi! 🌸"];
    const filtered = pool.filter(text => text !== this.lastDialogueText);
    const chosen = filtered[Math.floor(Math.random() * filtered.length)] || pool[0];
    this.lastDialogueText = chosen;
    return chosen;
  }

  /**
   * Selects the next behavior randomly from the 7 possible actions, with no consecutive repetitions.
   */
  selectNextAction() {
    const possibleActions = ['Idle', 'Blink', 'Wave', 'Happy', 'Sleep', 'Laptop', 'Drink'];
    const filtered = possibleActions.filter(act => act !== this.lastAction);
    return filtered[Math.floor(Math.random() * filtered.length)];
  }

  /**
   * Schedules the next action to run after a random delay of 5 to 10 seconds.
   */
  scheduleNextAction() {
    if (this.schedulerTimeoutId) {
      clearTimeout(this.schedulerTimeoutId);
      this.schedulerTimeoutId = null;
    }

    const nextActionName = this.selectNextAction();
    console.log(`Next behavior: ${nextActionName}`);

    const delay = this.getRandomDelay(5000, 10000);

    this.schedulerTimeoutId = setTimeout(() => {
      this.executeBehavior(nextActionName);
    }, delay);
  }

  /**
   * Executes the chosen behavior.
   */
  executeBehavior(name) {
    this.currentState = 'busy';

    // 1. Choose a random dialogue matching the pose
    const speechText = this.selectDialogue(name);

    // 2. Set the pose state based on name
    const stateMapping = {
      Idle: 'idle',
      Blink: 'blink',
      Wave: 'wave',
      Happy: 'happy',
      Laptop: 'laptop',
      Drink: 'drink',
      Sleep: 'sleep'
    };
    const characterState = stateMapping[name] || 'idle';

    // 3. Switch the PNG state
    this.characterManager.setState(characterState);

    // 4. Display the matching speech bubble for 4 seconds
    this.speechManager.show(speechText, 4000);

    // 5. Determine the duration for this action
    let duration = 5000;
    switch (name) {
      case 'Idle':
        duration = 5000;
        break;
      case 'Blink':
        duration = 1000;
        break;
      case 'Wave':
        duration = 4000;
        break;
      case 'Happy':
        duration = 4000;
        break;
      case 'Laptop':
        duration = 10000;
        break;
      case 'Drink':
        duration = 10000;
        break;
      case 'Sleep':
        duration = 4000;
        break;
    }

    // 6. Run the action logic
    console.log(`FSM running: ${name} action`);
    const actionPromise = new Promise(resolve => setTimeout(resolve, duration));

    actionPromise
      .catch(err => {
        console.error(`Error during action "${name}":`, err);
      })
      .finally(() => {
        this.currentState = 'idle';
        this.lastAction = name;
        this.characterManager.setState('idle');
        this.scheduleNextAction();
      });
  }

  /**
   * Sleep mode (disabled for now).
   */
  sleep() {
    console.log('Sleep requested (disabled for now).');
  }

  /**
   * Wake up mode (disabled for now).
   */
  wakeUp() {
    console.log('Wake up requested (disabled for now).');
  }

  /**
   * Enqueue a user-triggered behavior (e.g. clicks).
   */
  enqueueBehavior(name, priorityOrRunFn, runFn) {
    const actualRunFn = typeof priorityOrRunFn === 'function' ? priorityOrRunFn : runFn;

    if (this.currentState === 'idle') {
      if (this.schedulerTimeoutId) {
        clearTimeout(this.schedulerTimeoutId);
        this.schedulerTimeoutId = null;
      }
      this.runOneOffBehavior(name, actualRunFn);
    } else {
      console.log(`Busy: Ignored enqueuing of behavior "${name}"`);
    }
  }

  /**
   * Executes a user-triggered one-off behavior immediately.
   */
  runOneOffBehavior(name, runFn) {
    this.currentState = 'busy';
    console.log(`FSM running: ${name}`);

    runFn()
      .catch(err => {
        console.error(`Error running one-off behavior "${name}":`, err);
      })
      .finally(() => {
        this.currentState = 'idle';
        this.characterManager.setState('idle');
        this.scheduleNextAction();
      });
  }

  /**
   * Synchronize walking enable state from UI.
   */
  setWalkEnabled(enabled) {
    this.isWalkEnabled = enabled;
    if (!enabled) {
      if (this.animationEngine) {
        this.animationEngine.abortWalk();
      }
    }
  }

  /**
   * Single click handler.
   */
  handleSingleClick() {
    if (this.animationEngine) {
      this.animationEngine.abortWalk();
    }

    let greeting = "Hi, I'm Sushi!❤️";
    if (this.dialogueManager && this.dialogueManager.dialogues) {
      const hour = new Date().getHours();
      let list = this.dialogueManager.dialogues.Greeting || [];
      if (hour >= 5 && hour < 12 && this.dialogueManager.dialogues.MorningGreeting) {
        list = this.dialogueManager.dialogues.MorningGreeting;
      } else if (hour >= 17 && hour < 22 && this.dialogueManager.dialogues.EveningGreeting) {
        list = this.dialogueManager.dialogues.EveningGreeting;
      }
      if (list.length > 0) {
        greeting = list[Math.floor(Math.random() * list.length)];
      }
    }

    this.enqueueBehavior('clickWave', () => {
      return new Promise(resolve => {
        this.characterManager.setState('wave');
        this.speechManager.show(greeting, 4000);
        setTimeout(() => {
          resolve();
        }, 2000);
      });
    });
  }

  /**
   * Double click handler.
   */
  handleDoubleClick() {
    if (this.animationEngine) {
      this.animationEngine.abortWalk();
    }

    let compliment = this.compliments[Math.floor(Math.random() * this.compliments.length)];
    if (this.dialogueManager && this.dialogueManager.dialogues) {
      const list = this.dialogueManager.dialogues.Cute || this.dialogueManager.dialogues.Motivation || [];
      if (list.length > 0) {
        compliment = list[Math.floor(Math.random() * list.length)];
      }
    }

    this.enqueueBehavior('clickHappy', () => {
      return new Promise(resolve => {
        this.characterManager.setState('happy');
        this.speechManager.show(compliment, 4000);
        setTimeout(() => {
          resolve();
        }, 2000);
      });
    });
  }
}

// Expose to window scope
window.BehaviorManager = BehaviorManager;
