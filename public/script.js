const socket = io();

// Globale Variablen für Spieleinstellungen
let gameSettings = {
  mode: null,
  difficulty: 'medium'
};

// Phase 3: Advanced Features
let gamificationSystem = {
  xp: parseInt(localStorage.getItem('playerXP')) || 0,
  level: parseInt(localStorage.getItem('playerLevel')) || 1,
  achievements: JSON.parse(localStorage.getItem('playerAchievements')) || []
};

let roomCode = null;
let isHost = false;
let chatVisible = false;

// Theme Management
let currentTheme = localStorage.getItem('theme') || 'dark';
let touchStartX = 0;
let touchEndX = 0;

// Global variable to prevent multiple typing effects
let typingInProgress = false;

// Theme Toggle Functionality
function toggleTheme() {
  const body = document.body;
  const themeToggle = document.getElementById('theme-toggle');
  
  if (currentTheme === 'dark') {
    body.classList.add('light-mode');
    currentTheme = 'light';
    themeToggle.innerHTML = '🌙';
    themeToggle.setAttribute('aria-label', 'Switch to Dark Mode');
  } else {
    body.classList.remove('light-mode');
    currentTheme = 'dark';
    themeToggle.innerHTML = '☀️';
    themeToggle.setAttribute('aria-label', 'Switch to Light Mode');
  }
  
  localStorage.setItem('theme', currentTheme);
  
  // Theme transition animation
  body.style.transition = 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
  setTimeout(() => {
    body.style.transition = '';
  }, 500);
}

// Initialize Theme
function initializeTheme() {
  const body = document.body;
  const themeToggle = document.getElementById('theme-toggle');
  
  if (currentTheme === 'light') {
    body.classList.add('light-mode');
    themeToggle.innerHTML = '🌙';
    themeToggle.setAttribute('aria-label', 'Switch to Dark Mode');
  } else {
    themeToggle.innerHTML = '☀️';
    themeToggle.setAttribute('aria-label', 'Switch to Light Mode');
  }
}

// Swipe Gesture Handler
function handleSwipeGesture() {
  const swipeDistance = touchEndX - touchStartX;
  const minSwipeDistance = 100;
  
  if (Math.abs(swipeDistance) > minSwipeDistance) {
    if (swipeDistance > 0) {
      // Swipe right - zurück zum vorherigen Screen
      handleSwipeRight();
    } else {
      // Swipe left - vorwärts zum nächsten Screen
      handleSwipeLeft();
    }
  }
}

function handleSwipeRight() {
  const currentScreen = getCurrentScreen();
  
  switch(currentScreen) {
    case 'football-settings':
      showStartMenu();
      break;
    case 'lobby':
      if (gameSettings.mode === 'football') {
        showFootballSettings();
      } else {
        showStartMenu();
      }
      break;
  }
}

function handleSwipeLeft() {
  const currentScreen = getCurrentScreen();
  
  switch(currentScreen) {
    case 'start-menu':
      // Swipe to first available game mode
      const firstMode = document.querySelector('.game-mode-card:not(.disabled)');
      if (firstMode) {
        selectGameMode(firstMode.dataset.mode);
      }
      break;
  }
}

function getCurrentScreen() {
  if (!document.getElementById('start-menu').classList.contains('hidden')) return 'start-menu';
  if (!document.getElementById('football-settings').classList.contains('hidden')) return 'football-settings';
  if (!document.getElementById('game-container').classList.contains('hidden')) return 'game-container';
  return 'start-menu'; // default fallback
}

// Enhanced Theme Management with Smooth Transitions
function createThemeTransition() {
  const overlay = document.createElement('div');
  overlay.className = 'theme-transition-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle, rgba(255,255,255,0.9) 0%, transparent 70%);
    z-index: 9999;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
  `;
  document.body.appendChild(overlay);
  
  // Trigger animation
  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
    setTimeout(() => {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 300);
    }, 200);
  });
}

// Enhanced Swipe Detection with Visual Feedback
let swipeThreshold = 50;
let isSwipeActive = false;

function enhancedSwipeHandler() {
  const containers = document.querySelectorAll('.game-container');
  
  document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    isSwipeActive = false;
  }, { passive: true });
  
  document.addEventListener('touchmove', (e) => {
    if (!isSwipeActive) {
      const currentX = e.changedTouches[0].screenX;
      const deltaX = currentX - touchStartX;
      
      if (Math.abs(deltaX) > swipeThreshold) {
        isSwipeActive = true;
        containers.forEach(container => {
          if (!container.classList.contains('hidden')) {
            container.classList.add('swipe-active');
          }
        });
      }
    }
  }, { passive: true });
  
  document.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    
    containers.forEach(container => {
      container.classList.remove('swipe-active');
    });
    
    if (isSwipeActive) {
      handleSwipeGesture();
    }
    
    isSwipeActive = false;
  }, { passive: true });
}

// Screen Transition Effects
function transitionToScreen(fromScreen, toScreen, direction = 'left') {
  const fromElement = document.getElementById(fromScreen);
  const toElement = document.getElementById(toScreen);
  
  if (!fromElement || !toElement) return;
  
  // Add transition classes
  fromElement.style.transform = direction === 'left' ? 'translateX(-100%)' : 'translateX(100%)';
  fromElement.style.opacity = '0';
  
  setTimeout(() => {
    fromElement.classList.add('hidden');
    toElement.classList.remove('hidden');
    toElement.style.transform = direction === 'left' ? 'translateX(100%)' : 'translateX(-100%)';
    toElement.style.opacity = '0';
    
    requestAnimationFrame(() => {
      toElement.style.transform = 'translateX(0)';
      toElement.style.opacity = '1';
    });
    
    // Reset styles after transition
    setTimeout(() => {
      fromElement.style.transform = '';
      fromElement.style.opacity = '';
      toElement.style.transform = '';
      toElement.style.opacity = '';
    }, 500);
  }, 250);
}

// Glassmorphism Interaction Effects
function addGlassmorphismInteractions() {
  const cards = document.querySelectorAll('.game-mode-card');
  
  cards.forEach(card => {
    let glowTimeout;
    
    card.addEventListener('mouseenter', () => {
      clearTimeout(glowTimeout);
      card.style.setProperty('--glow-opacity', '0.6');
    });
    
    card.addEventListener('mouseleave', () => {
      glowTimeout = setTimeout(() => {
        card.style.setProperty('--glow-opacity', '0.3');
      }, 100);
    });
    
    // Add click wave effect
    card.addEventListener('click', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const wave = document.createElement('div');
      wave.className = 'click-wave';
      wave.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        width: 0;
        height: 0;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 70%);
        transform: translate(-50%, -50%);
        animation: waveExpand 0.6s ease-out;
        pointer-events: none;
        z-index: 10;
      `;
      
      card.appendChild(wave);
      setTimeout(() => wave.remove(), 600);
    });
  });
}

// Create glassmorphism particles (referenced in DOMContentLoaded)
function createGlassmorphismParticles() {
  const container = document.querySelector('.glassmorphism-particles');
  if (!container) {
    // Create particle container if it doesn't exist
    const particleContainer = document.createElement('div');
    particleContainer.className = 'glassmorphism-particles';
    document.body.appendChild(particleContainer);
  }
  
  // Use the optimized particles function
  createOptimizedParticles();
}

// Performance optimized particle system
function createOptimizedParticles() {
  const particleCount = window.innerWidth < 768 ? 3 : 6;
  const container = document.querySelector('.glassmorphism-particles');
  
  if (!container) return;
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'glass-particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 4 + 's';
    particle.style.animationDuration = (Math.random() * 3 + 4) + 's';
    
    // Add size variation
    const size = Math.random() * 40 + 20;
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';
    
    container.appendChild(particle);
  }
}

// Advanced Hover Effects for Cards
function enhanceCardEffects() {
  document.querySelectorAll('.game-mode-card').forEach(card => {
    card.addEventListener('mouseenter', (e) => {
      createHoverRipple(e.target, e.clientX, e.clientY);
    });
    
    card.addEventListener('mousemove', (e) => {
      updateCardTilt(e.target, e.clientX, e.clientY);
    });
    
    card.addEventListener('mouseleave', (e) => {
      resetCardTilt(e.target);
    });
  });
}

function createHoverRipple(element, x, y) {
  const rect = element.getBoundingClientRect();
  const ripple = document.createElement('div');
  ripple.className = 'hover-ripple';
  ripple.style.left = (x - rect.left) + 'px';
  ripple.style.top = (y - rect.top) + 'px';
  element.appendChild(ripple);
  
  setTimeout(() => {
    ripple.remove();
  }, 600);
}

function updateCardTilt(element, mouseX, mouseY) {
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const rotateX = (mouseY - centerY) / 10;
  const rotateY = (centerX - mouseX) / 10;
  
  element.style.transform = `translateY(-8px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
}

function resetCardTilt(element) {
  element.style.transform = '';
}

// Hide all screens function
function hideAllScreens() {
  const screens = [
    'start-menu',
    'football-settings', 
    'game-container'
  ];
  
  screens.forEach(screenId => {
    const screen = document.getElementById(screenId);
    if (screen) {
      screen.classList.add('hidden');
      screen.style.display = 'none';
      screen.style.opacity = '0';
    }
  });
}

// Startmenü Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  // Initialize Theme
  initializeTheme();
  
  // Create glassmorphism particles
  createGlassmorphismParticles();
  
  // Enhance card effects
  enhanceCardEffects();
  
  // Initialize Chat
  initializeChat();
  
  // Check URL parameters for auto-join
  checkUrlParameters();
  
  // Show start menu by default
  if (!window.autoJoinRoomCode) {
    showStartMenu();
  }
  
  // Theme Toggle Event Listener
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      createThemeTransition();
      setTimeout(toggleTheme, 100);
    });
  }
  
  // Enhanced Touch Event Listeners for Swipe Gestures
  enhancedSwipeHandler();
  
  // Add glassmorphism interactions
  addGlassmorphismInteractions();
  
  // Create optimized particles
  setTimeout(createOptimizedParticles, 500);
  
  // Enhanced Haptic Feedback for Mobile
  document.querySelectorAll('button, .game-mode-card').forEach(element => {
    element.addEventListener('touchstart', () => {
      // Simulate haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
    }, { passive: true });
  });

  // Spielmodus-Auswahl
  document.querySelectorAll('.game-mode-card:not(.disabled)').forEach(card => {
    card.addEventListener('click', () => {
      const mode = card.dataset.mode;
      selectGameMode(mode);
    });
  });

  // Fußball-Einstellungen
  document.getElementById('back-to-menu').addEventListener('click', () => {
    showStartMenu();
  });

  document.getElementById('continue-football').addEventListener('click', () => {
    const difficulty = document.getElementById('difficulty').value;
    gameSettings.difficulty = difficulty;
    startLobby();
  });

  // Typing-Effekt für Lobby - entfernt, da startLobby() bereits Typing-Effekt hat
  function startTypingEffect() {
    // Dieser wird nicht mehr verwendet, da startLobby() bereits den Typing-Effekt handhabt
    console.log('Typing effect handled by startLobby()');
  }

  // Starte mit Startmenü
  showStartMenu();
});


// ===== LEGACY FUNCTIONS (COMPATIBILITY) =====
function selectGameMode(mode) {
  gameSettings.mode = mode;
  
  if (mode === 'football') {
    showFootballSettings();
  } else if (mode === 'gamemaster') {
    startLobby();
  }
}

function showStartMenu() {
  hideAllScreens();
  const startMenu = document.getElementById('start-menu');
  if (startMenu) {
    startMenu.classList.remove('hidden');
    startMenu.style.display = 'block';
    startMenu.style.transform = 'translateX(0) rotateY(0deg)';
    startMenu.style.opacity = '1';
  }
}

function showFootballSettings() {
  hideAllScreens();
  const footballSettings = document.getElementById('football-settings');
  if (footballSettings) {
    footballSettings.classList.remove('hidden');
    footballSettings.style.display = 'block';
    footballSettings.style.transform = 'translateX(0) rotateY(0deg)';
    footballSettings.style.opacity = '1';
  }
}

function startLobby() {
  hideAllScreens();
  const gameContainer = document.getElementById('game-container');
  if (gameContainer) {
    gameContainer.classList.remove('hidden');
    gameContainer.style.display = 'block';
    gameContainer.style.transform = 'translateX(0) rotateY(0deg)';
    gameContainer.style.opacity = '1';
  }
  
  // Clear previous content
  const welcomeEl = document.getElementById("welcome");
  const welcome2El = document.getElementById("welcome2");
  
  if (welcomeEl) welcomeEl.innerHTML = '';
  if (welcome2El) welcome2El.innerHTML = '';
  
  // Start enhanced typing effect only if elements exist
  if (welcomeEl && welcome2El && !typingInProgress) {
    typingInProgress = true;
    setTimeout(() => {
      const txt1 = 'Willkommen', txt2 = 'Erstelle einen Raum oder tritt einem bei!', speed = 80;
      let i = 0, j = 0;
      
      function type1() {
        if (i < txt1.length && welcomeEl) {
          welcomeEl.innerHTML += txt1.charAt(i++);
          setTimeout(type1, speed);
        } else {
          setTimeout(type2, 300);
        }
      }
      
      function type2() {
        if (j < txt2.length && welcome2El) {
          welcome2El.innerHTML += txt2.charAt(j++);
          setTimeout(type2, speed);
        } else {
          typingInProgress = false; // Reset when done
        }
      }
      
      type1();
    }, 300);
  }
}

// Function to hide lobby elements when room is joined/created
function minimizeLobbyView() {
  // Hide welcome messages
  const lobbyHeader = document.querySelector('.lobby-header');
  if (lobbyHeader) lobbyHeader.style.display = 'none';
  
  // Hide join section (username input and room creation/join options)
  const joinSection = document.querySelector('.join-section');
  if (joinSection) joinSection.style.display = 'none';
  
  // Hide specific welcome elements
  const welcomeElements = document.querySelectorAll('#welcome, #welcome2');
  welcomeElements.forEach(el => {
    if (el) el.style.display = 'none';
  });
  
  // Hide username input field
  const usernameField = document.getElementById('username');
  if (usernameField && usernameField.parentElement) {
    usernameField.parentElement.style.display = 'none';
  }
  
  // Hide join/create buttons
  const joinOptions = document.querySelectorAll('.join-option');
  joinOptions.forEach(option => {
    if (option) option.style.display = 'none';
  });
  
  // Hide room input sections
  const roomSections = document.querySelectorAll('#create-room-section, #join-room-section');
  roomSections.forEach(section => {
    if (section) section.style.display = 'none';
  });
  
  // Don't hide result div during game - it shows the football player name or topic
  // const resultDiv = document.getElementById('result');
  // if (resultDiv) resultDiv.style.display = 'none';
  
  // Add a minimized state class to the game container
  const gameContainer = document.getElementById('game-container');
  if (gameContainer) {
    gameContainer.classList.add('minimized-lobby');
  }
  
  console.log('Lobby view minimized - all lobby elements hidden');
}

// Function to restore lobby view (for returning to lobby)
function restoreLobbyView() {
  // Show welcome messages
  const lobbyHeader = document.querySelector('.lobby-header');
  if (lobbyHeader) lobbyHeader.style.display = 'block';
  
  // Show join section
  const joinSection = document.getElementById('join-section');
  if (joinSection) joinSection.style.display = 'block';
  
  // Show welcome elements
  const welcomeElements = document.querySelectorAll('#welcome, #welcome2');
  welcomeElements.forEach(el => {
    if (el) el.style.display = 'block';
  });
  
  // Show username input field
  const usernameField = document.getElementById('username');
  if (usernameField && usernameField.parentElement) {
    usernameField.parentElement.style.display = 'block';
  }
  
  // Show join/create buttons
  const joinOptions = document.querySelectorAll('.join-option');
  joinOptions.forEach(option => {
    if (option) option.style.display = 'block';
  });
  
  // Show room input sections
  const roomSections = document.querySelectorAll('#create-room-section, #join-room-section');
  roomSections.forEach(section => {
    if (section) section.style.display = 'block';
  });
  
  // Show result div
  const resultDiv = document.getElementById('result');
  if (resultDiv) resultDiv.style.display = 'block';
  
  // Remove minimized state class
  const gameContainer = document.getElementById('game-container');
  if (gameContainer) {
    gameContainer.classList.remove('minimized-lobby');
  }
  
  console.log('Lobby view restored - all lobby elements visible');
}

// ===== LEGACY SOCKET HANDLERS =====
// Host-Controls anzeigen
socket.on('host', receivedIsHost => {
  isHost = receivedIsHost;
  
  if (isHost) {
    document.getElementById('host-controls').style.display = 'block';
    
    // Thema-Input nur im Gamemaster-Modus anzeigen
    const topicInput = document.getElementById('topic-input');
    if (gameSettings.mode === 'gamemaster') {
      topicInput.style.display = 'block';
      topicInput.placeholder = 'Gib hier das Thema ein (z.B. Tiere, Länder, etc.)';
    } else if (gameSettings.mode === 'football') {
      topicInput.style.display = 'none';
    }
    
    addXP(25, 'Host geworden');
    showAchievement('Gastgeber', 'Du bist jetzt der Spielleiter!');
  }
});

// Start-Button: Thema oder Fallback
document.addEventListener('DOMContentLoaded', function() {
  const startGameButton = document.getElementById('start-game-button');
  if (startGameButton) {
    startGameButton.addEventListener('click', () => {
      const room = roomCode || document.getElementById('room-input')?.value;
      const topic = document.getElementById('topic-input').value.trim();
      
      // Im Gamemaster-Modus wird das Thema immer vom Host gesetzt
      if (gameSettings.mode === 'gamemaster') {
        if (!topic) {
          showErrorMessage('Bitte gib ein Thema ein!');
          triggerHapticFeedback('error');
          return;
        }
        socket.emit('setTopic', room, topic);
      } else if (gameSettings.mode === 'football') {
        // Im Fußball-Modus wird das Topic-Feld ausgeblendet/ignoriert
        socket.emit('setTopic', room, null); // Kein spezifisches Thema
      }
      
      socket.emit('startGame', room);
      triggerHapticFeedback('success');
    });
  }
});

// Auto-join from URL parameter
if (window.autoJoinRoomCode) {
  console.log('Auto-joining room:', window.autoJoinRoomCode);
  
  // Show game container directly and set join mode
  startLobby();
  
  // Set join option to active
  const joinOption = document.querySelector('.join-option[data-option="join"]');
  const createOption = document.querySelector('.join-option[data-option="create"]');
  const createSection = document.getElementById('create-room-section');
  const joinSection = document.getElementById('join-room-section');
  
  if (joinOption && createOption && createSection && joinSection) {
    createOption.classList.remove('active');
    joinOption.classList.add('active');
    createSection.style.display = 'none';
    joinSection.style.display = 'block';
  }
  
  // Pre-fill room code
  const roomCodeInput = document.getElementById('room-code-input');
  if (roomCodeInput) {
    roomCodeInput.value = window.autoJoinRoomCode;
  }
  
  // Show helpful message - nur wenn wir nicht bereits im Lobby-Modus sind
  const welcomeElement = document.getElementById('welcome2');
  const gameContainer = document.getElementById('game-container');
  
  // Nur das welcome2 Element ändern, wenn wir noch nicht in der Lobby sind
  if (welcomeElement && gameContainer && gameContainer.style.display === 'none') {
    welcomeElement.innerHTML = `Gib deinen Namen ein und tritt Raum ${window.autoJoinRoomCode} bei!`;
  }
}

// Imposter-Status mit verbesserten Hintergründen
socket.on('imposterStatus', (isImposter) => {
  if (isImposter) {
    console.log('Imposter reached');
    document.body.classList.add('imposter');
    document.body.style.backgroundImage = 'url("data:image/svg+xml,%3Csvg id=\'visual\' viewBox=\'0 0 900 600\' width=\'900\' height=\'600\' xmlns=\'http://www.w3.org/2000/svg\' xmlns:xlink=\'http://www.w3.org/1999/xlink\' version=\'1.1\'%3E%3Crect x=\'0\' y=\'0\' width=\'900\' height=\'600\' fill=\'%23001220\'%3E%3C/rect%3E%3Cdefs%3E%3ClinearGradient id=\'grad1_0\' x1=\'33.3%25\' y1=\'0%25\' x2=\'100%25\' y2=\'100%25\'%3E%3Cstop offset=\'20%25\' stop-color=\'%23001220\' stop-opacity=\'1\'%3E%3C/stop%3E%3Cstop offset=\'80%25\' stop-color=\'%23001220\' stop-opacity=\'1\'%3E%3C/stop%3E%3C/linearGradient%3E%3C/defs%3E%3Cdefs%3E%3ClinearGradient id=\'grad2_0\' x1=\'0%25\' y1=\'0%25\' x2=\'66.7%25\' y2=\'100%25\'%3E%3Cstop offset=\'20%25\' stop-color=\'%23001220\' stop-opacity=\'1\'%3E%3C/stop%3E%3Cstop offset=\'80%25\' stop-color=\'%23001220\' stop-opacity=\'1\'%3E%3C/stop%3E%3C/linearGradient%3E%3C/defs%3E%3Cg transform=\'translate(900, 0)\'%3E%3Cpath d=\'M0 270.4C-38.9 270.4 -77.7 270.4 -103.5 249.8C-129.3 229.3 -142 188.2 -159.8 159.8C-177.6 131.4 -200.6 115.6 -219.9 91.1C-239.2 66.6 -254.8 33.3 -270.4 0L0 0Z\' fill=\'%23d01829\'%3E%3C/path%3E%3C/g%3E%3Cg transform=\'translate(0, 600)\'%3E%3Cpath d=\'M0 -270.4C37.2 -268.2 74.4 -265.9 103.5 -249.8C132.6 -233.8 153.7 -203.8 178.2 -178.2C202.7 -152.5 230.7 -131.2 246.7 -102.2C262.6 -73.2 266.5 -36.6 270.4 0L0 0Z\' fill=\'%23d01829\'%3E%3C/path%3E%3C/g%3E%3C/svg%3E")';
    addXP(30, 'Imposter geworden');
    showAchievement('Imposter!', 'Du bist der Imposter! 🎭');
    triggerHapticFeedback('heavy');
  } else {
    console.log('Not Imposter');
    document.body.classList.remove('imposter');
    document.body.style.backgroundImage = 'url("data:image/svg+xml,%3Csvg id=\'visual\' viewBox=\'0 0 900 600\' width=\'900\' height=\'600\' xmlns=\'http://www.w3.org/2000/svg\' xmlns:xlink=\'http://www.w3.org/1999/xlink\' version=\'1.1\'%3E%3Crect x=\'0\' y=\'0\' width=\'900\' height=\'600\' fill=\'%23001220\'%3E%3C/rect%3E%3Cdefs%3E%3ClinearGradient id=\'grad1_0\' x1=\'33.3%25\' y1=\'0%25\' x2=\'100%25\' y2=\'100%25\'%3E%3Cstop offset=\'20%25\' stop-color=\'%23001220\' stop-opacity=\'1\'%3E%3C/stop%3E%3Cstop offset=\'80%25\' stop-color=\'%23001220\' stop-opacity=\'1\'%3E%3C/stop%3E%3C/linearGradient%3E%3C/defs%3E%3Cdefs%3E%3ClinearGradient id=\'grad2_0\' x1=\'0%25\' y1=\'0%25\' x2=\'66.7%25\' y2=\'100%25\'%3E%3Cstop offset=\'20%25\' stop-color=\'%23001220\' stop-opacity=\'1\'%3E%3C/stop%3E%3Cstop offset=\'80%25\' stop-color=\'%23001220\' stop-opacity=\'1\'%3E%3C/stop%3E%3C/linearGradient%3E%3C/defs%3E%3Cg transform=\'translate(900, 0)\'%3E%3Cpath d=\'M0 270.4C-38.9 270.4 -77.7 270.4 -103.5 249.8C-129.3 229.3 -142 188.2 -159.8 159.8C-177.6 131.4 -200.6 115.6 -219.9 91.1C-239.2 66.6 -254.8 33.3 -270.4 0L0 0Z\' fill=\'%236bd764\'%3E%3C/path%3E%3C/g%3E%3Cg transform=\'translate(0, 600)\'%3E%3Cpath d=\'M0 -270.4C37.2 -268.2 74.4 -265.9 103.5 -249.8C132.6 -233.8 153.7 -203.8 178.2 -178.2C202.7 -152.5 230.7 -131.2 246.7 -102.2C262.6 -73.2 266.5 -36.6 270.4 0L0 0Z\' fill=\'%236bd764\'%3E%3C/path%3E%3C/g%3E%3C/svg%3E")';
    addXP(20, 'Normaler Spieler');
    triggerHapticFeedback('success');
  }
  document.body.style.opacity = 0;
  setTimeout(() => document.body.style.opacity = 1, 50);
});

// Nachrichten
socket.on('message', msg => {
  document.getElementById('result').innerHTML = `<p>${msg}</p>`;
});

// Spieler-Liste
socket.on('updatePlayersList', players => {
  const ul = document.getElementById('playersList');
  ul.innerHTML = '';
  players.forEach((p,i) => {
    const li = document.createElement('li');
    li.textContent = `${i+1}. ${p.username || 'Unbenannter Spieler'}`;
    ul.appendChild(li);
  });
});

// ===== MAIN INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
  // Initialize theme
  initializeTheme();
  
  // Room System Event Listeners
  const createRoomBtn = document.getElementById('create-room-button');
  const joinRoomBtn = document.getElementById('join-room-button');
  const joinOptions = document.querySelectorAll('.join-option');
  const roomCodeInput = document.getElementById('room-code-input');
  
  // Join Option Toggle
  joinOptions.forEach(option => {
    option.addEventListener('click', () => {
      joinOptions.forEach(opt => opt.classList.remove('active'));
      option.classList.add('active');
      
      const optionType = option.dataset.option;
      const createSection = document.getElementById('create-room-section');
      const joinSection = document.getElementById('join-room-section');
      
      if (optionType === 'create') {
        createSection.style.display = 'block';
        joinSection.style.display = 'none';
      } else {
        createSection.style.display = 'none';
        joinSection.style.display = 'block';
      }
    });
  });
  
  // Create Room Event
  if (createRoomBtn) {
    createRoomBtn.addEventListener('click', () => {
      const username = document.getElementById('username').value.trim();
      if (!username) {
        alert('Bitte gib einen Benutzernamen ein!');
        return;
      }
      
      // Set username first
      socket.emit('setUsername', username);
      
      // Set game settings
      socket.emit('setGameSettings', {
        mode: gameSettings.mode,
        difficulty: gameSettings.difficulty
      });
      
      // Create room with current settings
      socket.emit('createRoom', {
        mode: gameSettings.mode,
        difficulty: gameSettings.difficulty
      });
      
      console.log('Creating room with settings:', gameSettings);
    });
  }
  
  // Join Room Event
  if (joinRoomBtn) {
    joinRoomBtn.addEventListener('click', () => {
      const username = document.getElementById('username').value.trim();
      const inputRoomCode = roomCodeInput.value.trim().toUpperCase();
      
      if (!username) {
        alert('Bitte gib einen Benutzernamen ein!');
        return;
      }
      
      if (!inputRoomCode || inputRoomCode.length !== 6) {
        alert('Bitte gib einen gültigen 6-stelligen Raumcode ein!');
        return;
      }
      
      // Set username first
      socket.emit('setUsername', username);
      
      // Set game settings
      socket.emit('setGameSettings', {
        mode: gameSettings.mode,
        difficulty: gameSettings.difficulty
      });
      
      // Join room
      socket.emit('joinRoom', inputRoomCode);
      
      roomCode = inputRoomCode;
      console.log('Joining room:', roomCode);
    });
  }
  
  // Room code input formatting
  if (roomCodeInput) {
    roomCodeInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    });
  }
  
  // Enhanced touch gestures
  document.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
    triggerHapticFeedback('light');
  });
  
  document.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipeGesture();
  });
  
  // Theme toggle
  document.getElementById('theme-toggle').addEventListener('click', () => {
    toggleTheme();
    triggerHapticFeedback('medium');
  });
  
  // Enhanced button interactions
  document.querySelectorAll('.btn, .game-mode-card').forEach(element => {
    element.addEventListener('click', () => {
      triggerHapticFeedback('medium');
    });
  });
  
  // Game mode selection with enhanced effects
  document.querySelectorAll('.game-mode-card').forEach((card, index) => {
    card.style.setProperty('--index', index);
    
    card.addEventListener('click', function() {
      if (this.classList.contains('disabled')) {
        triggerHapticFeedback('error');
        showErrorMessage('Dieser Modus ist noch nicht verfügbar!');
        return;
      }
      
      const mode = this.dataset.mode;
      selectGameMode(mode);
      triggerHapticFeedback('success');
      addXP(5, 'Modus gewählt');
    });
  });

  // Settings navigation
  const backToMenuBtn = document.getElementById('back-to-menu');
  if (backToMenuBtn) {
    backToMenuBtn.addEventListener('click', () => {
      showStartMenu();
      triggerHapticFeedback('light');
    });
  }
  
  const continueFootballBtn = document.getElementById('continue-football');
  if (continueFootballBtn) {
    continueFootballBtn.addEventListener('click', () => {
      gameSettings.difficulty = document.getElementById('difficulty').value;
      startLobby();
      triggerHapticFeedback('success');
      addXP(5, 'Einstellungen gespeichert');
    });
  }

  // New Round and Leave Room Event Listeners
  const newRoundBtn = document.getElementById('new-round-button');
  const leaveRoomBtn = document.getElementById('leave-room-button');
  
  if (newRoundBtn) {
    newRoundBtn.addEventListener('click', () => {
      if (isHost) {
        socket.emit('startNewRound', roomCode);
        addXP(10, 'Neue Runde gestartet');
        console.log('Starting new round in room:', roomCode);
      } else {
        alert('Nur der Host kann eine neue Runde starten!');
      }
    });
  }
  
  if (leaveRoomBtn) {
    leaveRoomBtn.addEventListener('click', () => {
      if (confirm('Möchtest du wirklich den Raum verlassen?')) {
        socket.emit('leaveRoom', roomCode);
        
        // Reset game state
        roomCode = null;
        isHost = false;
        gameSettings = { mode: null, difficulty: 'medium' };
        
        // Return to start menu
        showStartMenu();
        
        // Hide game over controls
        document.getElementById('game-over-controls').style.display = 'none';
        document.getElementById('host-controls').style.display = 'none';
        document.getElementById('room-info').style.display = 'none';
        
        addXP(5, 'Raum verlassen');
        console.log('Left room');
      }
    });
  }

  // Start with start menu
  showStartMenu();
  
  // Display initial XP level if available
  if (gamificationSystem.xp > 0) {
    setTimeout(() => {
      showSuccessMessage(`Willkommen zurück! Level ${gamificationSystem.level} (${gamificationSystem.xp} XP)`);
    }, 1000);
  }
  
  // Add CSS for wave animation (only once)
  if (!document.getElementById('wave-styles')) {
    const waveStyles = document.createElement('style');
    waveStyles.id = 'wave-styles';
    waveStyles.textContent = `
      @keyframes waveExpand {
        to {
          width: 300px;
          height: 300px;
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(waveStyles);
  }
});

// Room Code Generation
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Room System Event Handlers
socket.on('roomCreated', (data) => {
  console.log('Room created successfully:', data);
  roomCode = data.code;
  isHost = true;
  
  // Show room info
  showRoomInfo(data.code);
  
  // Minimize lobby view to show only game elements
  minimizeLobbyView();
  
  // Show host controls
  document.getElementById('host-controls').style.display = 'block';
  
  // Enable chat for created room
  const liveChat = document.getElementById('live-chat');
  if (liveChat) {
    liveChat.style.display = 'block';
  }
  
  // Add XP for creating room
  addXP(25, 'Raum erstellt');
  showAchievement('Gastgeber', 'Du hast einen Raum erstellt!');
});

// Room Info Display Function
function showRoomInfo(code) {
  const roomInfo = document.getElementById('room-info');
  const roomCodeText = document.getElementById('room-code-text');
  const copyCodeBtn = document.getElementById('copy-code-btn');
  
  if (roomInfo && roomCodeText) {
    roomCodeText.textContent = code;
    roomInfo.style.display = 'block';
    
    // Show lobby screen
    showLobby();
    
    // Setup copy button
    if (copyCodeBtn) {
      copyCodeBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(code).then(() => {
          copyCodeBtn.textContent = '✅';
          setTimeout(() => copyCodeBtn.textContent = '📋', 2000);
        });
      });
    }
    
    // Setup share buttons
    setupShareButtons(code);
  }
}

// Show Lobby Function
function showLobby() {
  // Hide all screens
  document.getElementById('start-menu').style.display = 'none';
  const footballSettings = document.getElementById('football-settings');
  if (footballSettings) footballSettings.style.display = 'none';
  const gamemasterSettings = document.getElementById('gamemaster-settings');
  if (gamemasterSettings) gamemasterSettings.style.display = 'none';
  
  // Show lobby screen
  const lobbyScreen = document.getElementById('lobby');
  if (lobbyScreen) {
    lobbyScreen.style.display = 'block';
  }
  
  // Add screen transition animation
  document.querySelector('.game-container').classList.add('screen-transition');
  setTimeout(() => {
    document.querySelector('.game-container').classList.remove('screen-transition');
  }, 300);
}

socket.on('roomJoined', (data) => {
  console.log('Room joined successfully:', data);
  roomCode = data.code;
  isHost = false;
  
  // Show room info
  showRoomInfo(data.code);
  
  // Minimize lobby view to show only game elements
  minimizeLobbyView();
  
  // Enable chat for joined room
  const liveChat = document.getElementById('live-chat');
  if (liveChat) {
    liveChat.style.display = 'block';
  }
  
  // Add XP for joining room
  addXP(15, 'Raum beigetreten');
});

socket.on('roomError', (error) => {
  console.error('Room error:', error);
  showErrorMessage(error.message || 'Ein Fehler ist aufgetreten');
});

// ===== NEUE SOCKET EVENTS FÜR NEUE RUNDE & RAUM VERLASSEN =====

// Handle game started event
socket.on('gameStarted', () => {
  console.log('Game started - minimizing lobby view');
  
  // Minimize lobby view when game actually starts
  minimizeLobbyView();
  
  // Hide any remaining lobby elements that might still be visible
  const welcomeElements = document.querySelectorAll('#welcome, #welcome2');
  welcomeElements.forEach(el => {
    if (el) el.style.display = 'none';
  });
  
  // Hide username input field if still visible
  const usernameField = document.getElementById('username');
  if (usernameField && usernameField.parentElement) {
    usernameField.parentElement.style.display = 'none';
  }
  
  // Hide join/create buttons
  const joinOptions = document.querySelectorAll('.join-option');
  joinOptions.forEach(option => {
    if (option) option.style.display = 'none';
  });
  
  // Hide room input sections
  const roomSections = document.querySelectorAll('#create-room-section, #join-room-section');
  roomSections.forEach(section => {
    if (section) section.style.display = 'none';
  });
  
  // Show success message
  showSuccessMessage('🎮 Spiel gestartet!');
  
  // Add XP for game start
  addXP(10, 'Spiel gestartet');
  
  triggerHapticFeedback('success');
});

socket.on('newRoundStarted', () => {
  console.log('New round started');
  
  // UI zurücksetzen
  document.getElementById('messages').textContent = '';
  document.getElementById('imposter-status').textContent = '';
  document.getElementById('imposter-status').className = '';
  
  // Game Over Controls verstecken
  const gameOverControls = document.getElementById('game-over-controls');
  if (gameOverControls) {
    gameOverControls.style.display = 'none';
  }
  
  // Lobby anzeigen
  showLobby();
  
  // Success-Nachricht anzeigen
  showSuccessMessage('Neue Runde gestartet! 🎮');
  
  // Partikel-Effekt
  createParticles('success');
  
  // XP für Teilnahme an neuer Runde
  addXP(5, 'Neue Runde gestartet');
});

socket.on('roomLeft', () => {
  console.log('Left room successfully');
  
  // Raum-spezifische Daten zurücksetzen
  roomCode = null;
  isHost = false;
  
  // UI zurücksetzen
  document.getElementById('messages').textContent = '';
  document.getElementById('imposter-status').textContent = '';
  document.getElementById('imposter-status').className = '';
  document.getElementById('players-list').innerHTML = '';
  
  // Lobby-Ansicht wiederherstellen
  restoreLobbyView();
  
  // Zum Startmenü zurückkehren
  showStartMenu();
  
  // Alle Overlays schließen
  document.getElementById('gamification-overlay').style.display = 'none';
  document.getElementById('chat-overlay').style.display = 'none';
  
  // Success-Nachricht
  showSuccessMessage('Raum erfolgreich verlassen');
});

socket.on('error', (error) => {
  console.error('Server error:', error);
  showErrorMessage(error.message || 'Ein unbekannter Fehler ist aufgetreten');
});

socket.on('gameEnded', (data) => {
  console.log('Game ended:', data);
  
  // Game Over anzeigen
  showGameOver();
  
  // Gewinner-Nachricht anzeigen falls vorhanden
  if (data && data.winner) {
    showSuccessMessage(`🎉 ${data.winner} hat gewonnen!`);
  } else if (data && data.message) {
    showMessage(data.message);
  }
  
  // Achievement für Spielteilnahme
  if (data && data.reason) {
    addXP(15, `Spiel beendet: ${data.reason}`);
  }
});

// Game Over Logic
function showGameOver() {
  const gameOverControls = document.getElementById('game-over-controls');
  const hostControls = document.getElementById('host-controls');
  
  if (gameOverControls) {
    gameOverControls.style.display = 'flex';
    
    // Nur Host kann neue Runde starten
    if (isHost && hostControls) {
      hostControls.style.display = 'block';
    }
  }
  
  // XP für Spielende vergeben
  addXP(20, 'Spiel beendet');
  
  // Partikel-Effekt
  createParticles('celebration');
}

// Utility functions for game state
function resetGameState() {
  document.getElementById('messages').textContent = '';
  document.getElementById('imposter-status').textContent = '';
  document.getElementById('imposter-status').className = '';
  
  const gameOverControls = document.getElementById('game-over-controls');
  if (gameOverControls) {
    gameOverControls.style.display = 'none';
  }
  
  const hostControls = document.getElementById('host-controls');
  if (hostControls) {
    hostControls.style.display = 'none';
  }
}

// Legacy compatibility functions
function addXP(amount, reason) {
  gamificationSystem.xp += amount;
  localStorage.setItem('playerXP', gamificationSystem.xp);
  
  // Show XP notification
  showXPNotification(amount);
  
  console.log(`+${amount} XP: ${reason}`);
}

// XP and Gamification Functions
function showXPNotification(amount) {
  const xpNotification = document.getElementById('xp-notification');
  const xpText = document.querySelector('.xp-text');
  
  if (xpNotification && xpText) {
    xpText.textContent = `+${amount} XP`;
    xpNotification.classList.add('show');
    
    setTimeout(() => {
      xpNotification.classList.remove('show');
    }, 2000);
  }
}

// Setup Share Buttons Function
function setupShareButtons(code) {
  const shareWhatsApp = document.getElementById('share-whatsapp');
  const shareCopyLink = document.getElementById('share-copy-link');
  const baseUrl = window.location.origin;
  const gameUrl = `${baseUrl}?room=${code}`;
  
  if (shareWhatsApp) {
    shareWhatsApp.addEventListener('click', () => {
      const message = `Komm zu unserem Guessing Game! 🎮\nRaumcode: ${code}\nLink: ${gameUrl}`;
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    });
  }
  
  if (shareCopyLink) {
    shareCopyLink.addEventListener('click', () => {
      navigator.clipboard.writeText(gameUrl).then(() => {
        const originalText = shareCopyLink.textContent;
        shareCopyLink.textContent = '✅ Link kopiert!';
        setTimeout(() => {
          shareCopyLink.textContent = originalText;
        }, 2000);
      }).catch(() => {
        // Fallback für ältere Browser
        const textArea = document.createElement('textarea');
        textArea.value = gameUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        const originalText = shareCopyLink.textContent;
        shareCopyLink.textContent = '✅ Link kopiert!';
        setTimeout(() => {
          shareCopyLink.textContent = originalText;
        }, 2000);
      });
    });
  }
}

// Chat Functionality
function initializeChat() {
  const chatToggle = document.getElementById('toggle-chat');
  const liveChat = document.getElementById('live-chat');
  const chatInput = document.getElementById('chat-input');
  const sendChatBtn = document.getElementById('send-chat');
  const chatMessages = document.getElementById('chat-messages');
  
  if (chatToggle) {
    chatToggle.addEventListener('click', toggleChat);
  }
  
  if (sendChatBtn && chatInput) {
    sendChatBtn.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendChatMessage();
      }
    });
  }
  
  // Chat-Nachrichten empfangen
  socket.on('chatMessage', (data) => {
    displayChatMessage(data.username, data.message, data.timestamp);
  });
}

function toggleChat() {
  const liveChat = document.getElementById('live-chat');
  const chatToggle = document.getElementById('toggle-chat');
  
  if (liveChat) {
    chatVisible = !chatVisible;
    if (chatVisible) {
      liveChat.style.display = 'flex';
      chatToggle.textContent = '✖️';
      chatToggle.title = 'Chat schließen';
    } else {
      liveChat.style.display = 'none';
      chatToggle.textContent = '💬';
      chatToggle.title = 'Chat öffnen';
    }
  }
}

function sendChatMessage() {
  const chatInput = document.getElementById('chat-input');
  const message = chatInput.value.trim();
  
  if (message && roomCode) {
    socket.emit('chatMessage', {
      room: roomCode,
      message: message,
      username: socket.username || 'Unbekannter Spieler'
    });
    chatInput.value = '';
  }
}

function displayChatMessage(username, message, timestamp) {
  const chatMessages = document.getElementById('chat-messages');
  if (!chatMessages) return;
  
  const messageElement = document.createElement('div');
  messageElement.classList.add('chat-message');
  
  const time = new Date(timestamp).toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  messageElement.innerHTML = `
    <div class="message-header">
      <span class="message-username">${username}</span>
      <span class="message-time">${time}</span>
    </div>
    <div class="message-content">${message}</div>
  `;
  
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  // Begrenze die Anzahl der Nachrichten
  if (chatMessages.children.length > 50) {
    chatMessages.removeChild(chatMessages.firstChild);
  }
}

// Automatisches Beitreten per URL-Parameter
function checkUrlParameters() {
  // Check for injected room code from server
  if (window.autoJoinRoomCode) {
    const roomCode = window.autoJoinRoomCode;
    const roomCodeInput = document.getElementById('room-code-input');
    if (roomCodeInput) {
      roomCodeInput.value = roomCode;
      // Automatisch zum "Raum beitreten" Modus wechseln
      const joinOption = document.querySelector('[data-option="join"]');
      if (joinOption) {
        joinOption.click();
      }
    }
    return;
  }
  
  // Check URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const roomParam = urlParams.get('room');
  
  if (roomParam) {
    const roomCodeInput = document.getElementById('room-code-input');
    if (roomCodeInput) {
      roomCodeInput.value = roomParam.toUpperCase();
      // Automatisch zum "Raum beitreten" Modus wechseln
      const joinOption = document.querySelector('[data-option="join"]');
      if (joinOption) {
        joinOption.click();
      }
    }
  }
}

// Achievement System Functions
function showAchievement(title, description) {
  const achievementOverlay = document.getElementById('achievement-overlay');
  const achievementTitle = document.querySelector('.achievement-title');
  const achievementDescription = document.querySelector('.achievement-description');
  
  if (achievementOverlay && achievementTitle && achievementDescription) {
    achievementTitle.textContent = title;
    achievementDescription.textContent = description;
    
    achievementOverlay.style.display = 'flex';
    achievementOverlay.classList.add('show');
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      achievementOverlay.classList.remove('show');
      setTimeout(() => {
        achievementOverlay.style.display = 'none';
      }, 300);
    }, 3000);
  }
  
  console.log(`🏆 Achievement: ${title} - ${description}`);
}