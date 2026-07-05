// renderer.js - Frontend controller for the Sushi character

console.log('renderer started');

let characterManager, animationEngine, speechManager, dialogueManager, behaviorManager;

try {
  characterManager = new CharacterManager('character', 'sushi');
  console.log('CharacterManager initialized');

  animationEngine = new AnimationEngine(characterManager);

  speechManager = new SpeechManager('speech-bubble');
  console.log('SpeechManager initialized');

  dialogueManager = new DialogueManager(speechManager);

  behaviorManager = new BehaviorManager(characterManager, speechManager, dialogueManager, animationEngine);
  console.log('BehaviorManager initialized');
} catch (err) {
  console.error('Synchronous instantiation failed with error:', err);
}

// Preload assets, load dialogues, start loops, and display welcome greeting
if (characterManager && dialogueManager && behaviorManager) {
  console.log('Starting Promise.all for asset preloading and dialogues loading...');
  Promise.all([
    characterManager.preloadAssets().then(() => console.log('preloadAssets resolved')),
    dialogueManager.loadDialogues().then(() => console.log('loadDialogues resolved'))
  ])
    .then(() => {
      console.log('Promise.all resolved successfully');
      characterManager.setState('idle');
      console.log('Character state set to idle');
      behaviorManager.start();
      console.log('BehaviorManager started');
      
      // Display welcome greeting as startup behavior
      behaviorManager.enqueueBehavior('startupGreeting', 2, () => {
        return new Promise(resolve => {
          let greeting = "Hi, I'm Sushi!❤️";
          if (dialogueManager.dialogues) {
            const hour = new Date().getHours();
            let list = dialogueManager.dialogues.Greeting || [];
            if (hour >= 5 && hour < 12 && dialogueManager.dialogues.MorningGreeting) {
              list = dialogueManager.dialogues.MorningGreeting;
            } else if (hour >= 17 && hour < 22 && dialogueManager.dialogues.EveningGreeting) {
              list = dialogueManager.dialogues.EveningGreeting;
            }
            if (list.length > 0) {
              greeting = list[Math.floor(Math.random() * list.length)];
            }
          }
          console.log('Showing greeting:', greeting);
          speechManager.show(greeting, 4000);
          behaviorManager.activePromiseResolver = resolve;
          behaviorManager.activeTimeout = setTimeout(() => {
            behaviorManager.activePromiseResolver = null;
            resolve();
          }, 4000);
        });
      });
      console.log('Startup greeting behavior enqueued');
    })
    .catch(err => {
      console.error('Error initializing Sushi application:', err);
    });
} else {
  console.error('Cannot proceed with initialization as managers failed to initialize.');
}

// Expose on window for state switching, animations, and diagnostics
window.characterManager = characterManager;
window.animationEngine = animationEngine;
window.speechManager = speechManager;
window.dialogueManager = dialogueManager;
window.behaviorManager = behaviorManager;

// DOM Elements
const sushiContainer = document.getElementById('sushi');
const characterImg = document.getElementById('character');
const contextMenu = document.getElementById('context-menu');
const settingsModal = document.getElementById('settings-modal');
const closeSettingsBtn = document.getElementById('close-settings');
const toggleWalkCheckbox = document.getElementById('toggle-walk');
const toggleSpeechCheckbox = document.getElementById('toggle-speech');

const menuSettings = document.getElementById('menu-settings');
const menuHide = document.getElementById('menu-hide');
const menuExit = document.getElementById('menu-exit');

// Dragging and Click Disambiguation State
let isDragging = false;
let startX = 0;
let startY = 0;
let clickTimeout = null;
let clickCount = 0;
let mousedownX = 0;
let mousedownY = 0;
let mousedownTime = 0;

// Hover logic: Look toward mouse horizontally
window.addEventListener('mousemove', (e) => {
  // Do not flip character while walking, dragging, sleeping, or on laptop
  if (animationEngine.isWalking || isDragging || behaviorManager.isSleeping || characterManager.getCurrentState() === 'laptop') return;

  if (sushiContainer && characterImg) {
    const rect = sushiContainer.getBoundingClientRect();
    const centerX = window.screenX + rect.left + rect.width / 2;
    const mouseX = e.screenX;

    if (mouseX > centerX) {
      characterImg.classList.add('flipped');
    } else {
      characterImg.classList.remove('flipped');
    }
  }
});

// Click and Drag event listeners
if (sushiContainer) {
  sushiContainer.addEventListener('mousedown', (e) => {
    // Only capture left click for drag/click actions
    if (e.button === 0) {
      mousedownX = e.screenX;
      mousedownY = e.screenY;
      mousedownTime = performance.now();

      // Abort any active walking cycle when grabbing character
      if (animationEngine.isWalking) {
        animationEngine.abortWalk();
      }

      isDragging = true;
      startX = e.screenX;
      startY = e.screenY;
      e.preventDefault();
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const dx = e.screenX - startX;
      const dy = e.screenY - startY;

      if (dx !== 0 || dy !== 0) {
        window.sushiAPI.moveWindow(dx, dy);
        startX = e.screenX;
        startY = e.screenY;
      }
    }
  });

  window.addEventListener('mouseup', (e) => {
    if (isDragging) {
      isDragging = false;
      const elapsed = performance.now() - mousedownTime;
      const dist = Math.hypot(e.screenX - mousedownX, e.screenY - mousedownY);

      // Distinguish click: moved < 5px and duration < 400ms
      if (dist < 5 && elapsed < 400) {
        clickCount++;

        if (clickCount === 1) {
          clickTimeout = setTimeout(() => {
            handleSingleClick();
            clickCount = 0;
          }, 250);
        } else if (clickCount === 2) {
          clearTimeout(clickTimeout);
          clickTimeout = null;
          handleDoubleClick();
          clickCount = 0;
        }
      } else {
        clickCount = 0;
      }
    }
  });
}

// Single Click handler: Wave animation & random greeting
function handleSingleClick() {
  behaviorManager.handleSingleClick();
}

// Double Click handler: Happy animation & random compliment
function handleDoubleClick() {
  behaviorManager.handleDoubleClick();
}

// Right Click: Show custom context menu
if (sushiContainer) {
  sushiContainer.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    hideContextMenu();

    if (contextMenu) {
      // Keep menu inside transparent window bounds
      const x = Math.min(e.clientX, 640 - 130);
      const y = Math.min(e.clientY, 640 - 120);

      contextMenu.style.left = `${x}px`;
      contextMenu.style.top = `${y}px`;
      contextMenu.classList.add('show');
    }
  });
}

function hideContextMenu() {
  if (contextMenu) {
    contextMenu.classList.remove('show');
  }
}

// Hide context menu on left-click outside or window blur
window.addEventListener('click', hideContextMenu);
window.addEventListener('blur', hideContextMenu);

// Context Menu Action Listeners
if (menuSettings) {
  menuSettings.addEventListener('click', (e) => {
    e.stopPropagation();
    hideContextMenu();
    openSettings();
  });
}

if (menuHide) {
  menuHide.addEventListener('click', (e) => {
    e.stopPropagation();
    hideContextMenu();
    window.sushiAPI.minimize();
  });
}

if (menuExit) {
  menuExit.addEventListener('click', (e) => {
    e.stopPropagation();
    hideContextMenu();
    window.sushiAPI.close();
  });
}

// Settings Modal Management
function openSettings() {
  if (settingsModal) {
    // Sync UI controls with engine properties
    if (toggleWalkCheckbox) {
      toggleWalkCheckbox.checked = behaviorManager.isWalkEnabled;
    }
    if (toggleSpeechCheckbox) {
      toggleSpeechCheckbox.checked = speechManager.isSpeechEnabled;
    }
    settingsModal.classList.add('show');
  }
}

function closeSettings() {
  if (settingsModal) {
    settingsModal.classList.remove('show');
  }
}

if (closeSettingsBtn) {
  closeSettingsBtn.addEventListener('click', closeSettings);
}

if (settingsModal) {
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      closeSettings();
    }
  });
}

// Settings Checkbox Bindings
if (toggleWalkCheckbox) {
  toggleWalkCheckbox.addEventListener('change', () => {
    behaviorManager.setWalkEnabled(toggleWalkCheckbox.checked);
  });
}

if (toggleSpeechCheckbox) {
  toggleSpeechCheckbox.addEventListener('change', () => {
    speechManager.isSpeechEnabled = toggleSpeechCheckbox.checked;
    if (!speechManager.isSpeechEnabled) {
      speechManager.hide();
    }
  });
}

// Bind system-wide sleep and wake events from main process
if (window.sushiAPI.onSystemSleep) {
  window.sushiAPI.onSystemSleep(() => {
    if (window.behaviorManager) {
      window.behaviorManager.sleep();
    }
  });
}

if (window.sushiAPI.onSystemWake) {
  window.sushiAPI.onSystemWake(() => {
    if (window.behaviorManager) {
      window.behaviorManager.wakeUp();
    }
  });
}

// Wake up on local input interactions
function wakeUpOnInteraction() {
  if (window.behaviorManager && window.behaviorManager.isSleeping) {
    window.behaviorManager.wakeUp();
  }
}

window.addEventListener('mousemove', wakeUpOnInteraction);
window.addEventListener('keydown', wakeUpOnInteraction);

