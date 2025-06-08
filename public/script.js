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

// ===== GAME MODE SELECTION =====
function selectGameMode(mode) {
  console.log('Selecting game mode:', mode);
  gameSettings.mode = mode;
  
  if (mode === 'football') {
    showFootballSettings();
  } else if (mode === 'gamemaster') {
    startLobby();
  }
}

function showFootballSettings() {
  console.log('Showing football settings');
  hideAllScreens();
  document.getElementById('football-settings').style.display = 'block';
  document.getElementById('football-settings').classList.remove('hidden');
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

// Hauptmenü Event Listeners - ALLE INITIALISIERUNGEN IN EINER FUNKTION
document.addEventListener("DOMContentLoaded", () => {
  console.log('Initializing app...');
  
  // Initialize Theme
  initializeTheme();
  
  // Create glassmorphism particles
  createGlassmorphismParticles();
  
  // Enhance card effects
  enhanceCardEffects();
  
  // Initialize Chat - WICHTIG FÜR CHAT-SICHTBARKEIT
  initializeChat();
  
  // Note: setupShareButtons() wird aufgerufen, wenn ein Raumcode verfügbar ist
  
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
  const backToMenuBtn = document.getElementById('back-to-menu');
  if (backToMenuBtn) {
    backToMenuBtn.addEventListener('click', () => {
      showStartMenu();
    });
  }

  const continueFootballBtn = document.getElementById('continue-football');
  if (continueFootballBtn) {
    continueFootballBtn.addEventListener('click', () => {
      const difficulty = document.getElementById('difficulty').value;
      gameSettings.difficulty = difficulty;
      startLobby();
    });
  }

  // Setup lobby event listeners
  setupLobbyEventListeners();
  
  // Setup alle Join/Create Event Listeners
  setupJoinCreateEventListeners();
  
  // Setup Start Game Button
  setupStartGameButton();

  // Starte mit Startmenü
  showStartMenu();
  
  console.log('App initialization complete');
});

// Hilfsfunktion um Chat sichtbar zu machen, falls er versteckt ist
function showChatIfHidden() {
  const liveChat = document.getElementById('live-chat');
  const chatToggle = document.getElementById('toggle-chat');
  
  if (liveChat && chatToggle) {
    // Stelle sicher, dass der Chat sichtbar ist
    liveChat.style.display = 'block';
    
    // Chat-Toggle Button sichtbar machen
    chatToggle.style.display = 'block';
    
    console.log('Chat visibility ensured');
  }
}

// Setup lobby event listeners
function setupLobbyEventListeners() {
  // Room option selection (Create vs Join)
  document.querySelectorAll('.join-option').forEach(option => {
    option.addEventListener('click', () => {
      // Remove active class from all options
      document.querySelectorAll('.join-option').forEach(opt => opt.classList.remove('active'));
      
      // Add active class to clicked option
      option.classList.add('active');
      
      // Show/hide appropriate sections
      const selectedOption = option.dataset.option;
      const createSection = document.getElementById('create-room-section');
      const joinSection = document.getElementById('join-room-section');
      
      if (selectedOption === 'create') {
        createSection.style.display = 'block';
        joinSection.style.display = 'none';
      } else if (selectedOption === 'join') {
        createSection.style.display = 'none';
        joinSection.style.display = 'block';
        
        // Focus the room code input
        const roomCodeInput = document.getElementById('room-code-input');
        if (roomCodeInput) {
          setTimeout(() => roomCodeInput.focus(), 100);
        }
      }
    });
  });
  
  // Create room button
  const createRoomBtn = document.getElementById('create-room-button');
  if (createRoomBtn) {
    createRoomBtn.addEventListener('click', () => {
      const usernameInput = document.getElementById('username');
      const username = usernameInput ? usernameInput.value.trim() : '';
      
      if (!username) {
        showNotification('Bitte gib einen Benutzernamen ein!', 'error');
        if (usernameInput) usernameInput.focus();
        return;
      }
      
      // Disable button to prevent double clicks
      createRoomBtn.disabled = true;
      createRoomBtn.textContent = 'Erstelle Raum...';
      
      // Emit create room event
      socket.emit('createRoom', { 
        username: username,
        gameMode: gameSettings.mode || 'gamemaster',
        difficulty: gameSettings.difficulty || 'medium'
      });
      
      // Re-enable button after timeout
      setTimeout(() => {
        createRoomBtn.disabled = false;
        createRoomBtn.innerHTML = '<span class="btn-icon">🎮</span> Raum erstellen';
      }, 3000);
    });
  }
  
  // Join room button
  const joinRoomBtn = document.getElementById('join-room-button');
  if (joinRoomBtn) {
    joinRoomBtn.addEventListener('click', () => {
      const usernameInput = document.getElementById('username');
      const roomCodeInput = document.getElementById('room-code-input');
      
      const username = usernameInput ? usernameInput.value.trim() : '';
      const roomCode = roomCodeInput ? roomCodeInput.value.trim().toUpperCase() : '';
      
      if (!username) {
        showNotification('Bitte gib einen Benutzernamen ein!', 'error');
        if (usernameInput) usernameInput.focus();
        return;
      }
      
      if (!roomCode || roomCode.length !== 6) {
        showNotification('Bitte gib einen gültigen 6-stelligen Raumcode ein!', 'error');
        if (roomCodeInput) roomCodeInput.focus();
        return;
      }
      
      // Disable button to prevent double clicks
      joinRoomBtn.disabled = true;
      joinRoomBtn.textContent = 'Trete bei...';
      
      // Emit join room event
      socket.emit('joinRoom', { 
        username: username,
        roomCode: roomCode
      });
      
      // Re-enable button after timeout
      setTimeout(() => {
        joinRoomBtn.disabled = false;
        joinRoomBtn.innerHTML = '<span class="btn-icon">🚪</span> Beitreten';
      }, 3000);
    });
  }
  
  // Room code input formatting
  const roomCodeInput = document.getElementById('room-code-input');
  if (roomCodeInput) {
    roomCodeInput.addEventListener('input', (e) => {
      // Convert to uppercase and limit to 6 characters
      e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6);
    });
    
    // Handle Enter key
    roomCodeInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        joinRoomBtn.click();
      }
    });
  }
  
  // Username input handling
  const usernameInput = document.getElementById('username');
  if (usernameInput) {
    usernameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        // Check which section is active
        const createSection = document.getElementById('create-room-section');
        const joinSection = document.getElementById('join-room-section');
        
        if (createSection && createSection.style.display !== 'none') {
          createRoomBtn.click();
        } else if (joinSection && joinSection.style.display !== 'none') {
          const roomCodeInput = document.getElementById('room-code-input');
          if (roomCodeInput && roomCodeInput.value.trim()) {
            joinRoomBtn.click();
          } else if (roomCodeInput) {
            roomCodeInput.focus();
          }
        }
      }
    });
  }
  
  // Copy room code button
  const copyCodeBtn = document.getElementById('copy-code-btn');
  if (copyCodeBtn) {
    copyCodeBtn.addEventListener('click', () => {
      const roomCodeText = document.getElementById('room-code-text');
      if (roomCodeText && roomCodeText.textContent) {
        navigator.clipboard.writeText(roomCodeText.textContent).then(() => {
          copyCodeBtn.textContent = '✅';
          setTimeout(() => {
            copyCodeBtn.textContent = '📋';
          }, 2000);
          showNotification('Raumcode kopiert!', 'success');
        }).catch(() => {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = roomCodeText.textContent;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          
          copyCodeBtn.textContent = '✅';
          setTimeout(() => {
            copyCodeBtn.textContent = '📋';
          }, 2000);
          showNotification('Raumcode kopiert!', 'success');
        });
      }
    });
  }

  // Join/Create Option Buttons korrekt initialisieren
  const joinOption = document.querySelector('[data-option="join"]');
  const createOption = document.querySelector('[data-option="create"]');
  const joinSection = document.getElementById('join-room-section');
  const createSection = document.getElementById('create-room-section');

  if (joinOption && createOption && joinSection && createSection) {
    joinOption.addEventListener('click', () => {
      joinOption.classList.add('active');
      createOption.classList.remove('active');
      joinSection.style.display = 'block';
      createSection.style.display = 'none';
    });
    createOption.addEventListener('click', () => {
      createOption.classList.add('active');
      joinOption.classList.remove('active');
      createSection.style.display = 'block';
      joinSection.style.display = 'none';
    });
  }
}

// Socket Event Handlers für Raum-Management
socket.on('roomCreated', (data) => {
  console.log('Room created:', data);
  roomCode = data.code;
  isHost = data.isHost;
  
  // Zeige Raumcode an
  const roomCodeText = document.getElementById('room-code-text');
  if (roomCodeText) {
    roomCodeText.textContent = roomCode;
  }
  
  // Zeige Room-Info Container
  const roomInfo = document.getElementById('room-info');
  if (roomInfo) {
    roomInfo.style.display = 'block';
  }
  
  // Setup share buttons mit dem neuen Raumcode
  setupShareButtons(roomCode);
  
  // Minimiere Lobby-Ansicht (verstecke Join/Create-Interface)
  minimizeLobbyView();
  
  // Zeige Host Controls an und konfiguriere Topic-Input entsprechend Spielmodus
  if (isHost) {
    const hostControls = document.getElementById('host-controls');
    if (hostControls) {
      hostControls.style.display = 'block';
    }
    
    // Topic-Input entsprechend Spielmodus konfigurieren
    const topicInput = document.getElementById('topic-input');
    if (topicInput) {
      if (gameSettings.mode === 'gamemaster') {
        topicInput.style.display = 'block';
        topicInput.placeholder = 'Gib hier das Thema ein (z.B. Tiere, Länder, etc.)';
        console.log('Topic input visible for gamemaster mode');
      } else if (gameSettings.mode === 'football') {
        topicInput.style.display = 'none';
        console.log('Topic input hidden for football mode');
      }
    }
  }
  
  // Chat sichtbar machen (falls minimiert)
  showChatIfHidden();
  
  showNotification('Raum erfolgreich erstellt!', 'success');
});

socket.on('roomJoined', (data) => {
  console.log('Room joined:', data);
  roomCode = data.code;
  isHost = data.isHost || false;
  
  // Zeige Raumcode an
  const roomCodeText = document.getElementById('room-code-text');
  if (roomCodeText) {
    roomCodeText.textContent = roomCode;
  }
  
  // Zeige Room-Info Container
  const roomInfo = document.getElementById('room-info');
  if (roomInfo) {
    roomInfo.style.display = 'block';
  }
  
  // Setup share buttons mit dem Raumcode
  setupShareButtons(roomCode);
  
  // Minimiere Lobby-Ansicht
  minimizeLobbyView();
  
  // Chat sichtbar machen
  showChatIfHidden();
  
  showNotification('Raum erfolgreich beigetreten!', 'success');
});

socket.on('roomError', (data) => {
  console.error('Room error:', data);
  showNotification(data.message || 'Fehler beim Beitreten zum Raum', 'error');
  
  // Re-enable buttons
  const joinRoomBtn = document.getElementById('join-room-button');
  const createRoomBtn = document.getElementById('create-room-button');
  
  if (joinRoomBtn) {
    joinRoomBtn.disabled = false;
    joinRoomBtn.innerHTML = '<span class="btn-icon">🚪</span> Beitreten';
  }
  
  if (createRoomBtn) {
    createRoomBtn.disabled = false;
    createRoomBtn.innerHTML = '<span class="btn-icon">🎮</span> Raum erstellen';
  }
});

// Socket Event Handlers für Raum-Management
socket.on('message', (message) => {
  console.log('Server message:', message);
  showNotification(message, 'info');
});

// Handle imposter status
socket.on('imposterStatus', (isImposter) => {
  console.log('Imposter status received:', isImposter);
  
  const imposterStatusElement = document.getElementById('imposter-status');
  if (imposterStatusElement) {
    if (isImposter) {
      imposterStatusElement.textContent = '🎭 Du bist der Imposter!';
      imposterStatusElement.className = 'imposter-status imposter-true';
    } else {
      imposterStatusElement.textContent = '👥 Du bist ein normaler Spieler';
      imposterStatusElement.className = 'imposter-status imposter-false';
    }
  }
});

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
  console.log('Minimizing lobby view...');
  
  // Hide welcome messages
  const lobbyHeader = document.querySelector('.lobby-header');
  if (lobbyHeader) {
    lobbyHeader.style.display = 'none';
    console.log('Hidden lobby header');
  }
  
  // Hide join section (username input and room creation/join options)
  const joinSection = document.querySelector('.join-section');
  if (joinSection) {
    joinSection.style.display = 'none';
    console.log('Hidden join section');
  }
  
  // Hide specific welcome elements
  const welcomeElements = document.querySelectorAll('#welcome, #welcome2');
  welcomeElements.forEach(el => {
    if (el) {
      el.style.display = 'none';
      console.log('Hidden welcome element');
    }
  });
  
  // Hide username input field
  const usernameField = document.getElementById('username');
  if (usernameField && usernameField.parentElement) {
    usernameField.parentElement.style.display = 'none';
    console.log('Hidden username field');
  }
  
  // Hide join/create buttons
  const joinOptions = document.querySelectorAll('.join-option');
  joinOptions.forEach(option => {
    if (option) {
      option.style.display = 'none';  
      console.log('Hidden join option');
    }
  });
  
  // Hide room input sections
  const roomSections = document.querySelectorAll('#create-room-section, #join-room-section');
  roomSections.forEach(section => {
    if (section) {
      section.style.display = 'none';
      console.log('Hidden room section');
    }
  });
  
  // WICHTIG: Room-Info und Chat-Elemente NICHT verstecken
  const roomInfo = document.getElementById('room-info');
  const liveChat = document.getElementById('live-chat');
  const chatToggle = document.getElementById('toggle-chat');
  
  if (roomInfo) {
    roomInfo.style.display = 'block';
    console.log('Ensured room-info is visible');
  }
  
  if (liveChat) {
    liveChat.style.display = 'block';
    console.log('Ensured live-chat is visible');
  }
  
  if (chatToggle) {
    chatToggle.style.display = 'block';
    console.log('Ensured chat-toggle is visible');
  }
  
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
    
    // Verschiedene Nachrichten je nach Modus
    if (gameSettings.mode === 'gamemaster') {
      addXP(25, 'Host geworden');
      showAchievement('Gastgeber', 'Du bist jetzt der Spielleiter!');
    } else if (gameSettings.mode === 'football') {
      addXP(25, 'Raum erstellt');
      showAchievement('Raum-Ersteller', 'Du hast einen Fußball-Raum erstellt!');
    }
  }
});

// Separate Funktion für Join/Create Event Listeners
function setupJoinCreateEventListeners() {
  console.log('Setting up Join/Create event listeners...');
  
  // Event Listener für Join/Create-Optionen (mobile und desktop)
  const joinOption = document.querySelector('[data-option="join"]');
  const createOption = document.querySelector('[data-option="create"]');
  const joinSection = document.getElementById('join-room-section');
  const createSection = document.getElementById('create-room-section');

  if (joinOption && createOption && joinSection && createSection) {
    console.log('Join/Create options found, attaching listeners...');
    
    joinOption.addEventListener('click', () => {
      console.log('Join option clicked');
      joinOption.classList.add('active');
      createOption.classList.remove('active');
      joinSection.style.display = 'block';
      createSection.style.display = 'none';
    });
    
    createOption.addEventListener('click', () => {
      console.log('Create option clicked');
      createOption.classList.add('active');
      joinOption.classList.remove('active');
      createSection.style.display = 'block';
      joinSection.style.display = 'none';
    });
  } else {
    console.warn('Join/Create options not found!');
  }
}

// Separate Funktion für Start Game Button
function setupStartGameButton() {
  console.log('Setting up Start Game button...');
  
  const startGameButton = document.getElementById('start-game-button');
  if (startGameButton) {
    console.log('Start game button found, attaching listener...');
    
    startGameButton.addEventListener('click', () => {
      console.log('Start game button clicked');
      console.log('Current roomCode:', roomCode);
      console.log('Current gameSettings:', gameSettings);
      
      if (!roomCode) {
        showNotification('Fehler: Kein Raumcode verfügbar!', 'error');
        console.error('No room code available');
        return;
      }
      
      const topic = document.getElementById('topic-input')?.value?.trim();
      
      // Prüfe aktuellen Spielmodus
      console.log('Game mode check:', gameSettings.mode);
      
      // Im Gamemaster-Modus wird das Thema immer vom Host gesetzt
      if (gameSettings.mode === 'gamemaster') {
        if (!topic) {
          showNotification('Bitte gib ein Thema ein!', 'error');
          triggerHapticFeedback('error');
          // Focus das Topic-Input-Feld
          const topicInput = document.getElementById('topic-input');
          if (topicInput) topicInput.focus();
          return;
        }
        console.log('Setting topic for gamemaster mode:', topic);
        socket.emit('setTopic', roomCode, topic);
      } else if (gameSettings.mode === 'football') {
        // Im Fußball-Modus wird der Schwierigkeitsgrad bereits beim Erstellen des Raums gesetzt
        // Kein setTopic nötig, da der Server automatisch einen Fußballspieler generiert
        console.log('Football mode - using difficulty:', gameSettings.difficulty);
      } else {
        // Fallback für andere Modi
        console.log('Unknown mode, defaulting to no topic');
        socket.emit('setTopic', roomCode, null);
      }
      
      console.log('Starting game for room:', roomCode);
      socket.emit('startGame', roomCode);
      triggerHapticFeedback('success');
      
      // Disable button to prevent double-clicks
      startGameButton.disabled = true;
      startGameButton.textContent = 'Spiel wird gestartet...';
      
      // Re-enable after timeout (fallback)
      setTimeout(() => {
        startGameButton.disabled = false;
        startGameButton.textContent = 'Spiel starten';
      }, 5000);
    });
  } else {
    console.warn('Start game button not found!');
  }
}

// Check URL parameters for direct room joining
function checkUrlParameters() {
  const urlParams = new URLSearchParams(window.location.search);
  const roomCodeFromUrl = urlParams.get('room');
  
  if (roomCodeFromUrl && roomCodeFromUrl.length === 6) {
    // Set the auto-join flag
    window.autoJoinRoomCode = roomCodeFromUrl.toUpperCase();
    
    // Navigate to lobby and pre-fill room code
    setTimeout(() => {
      startLobby();
      
      // Switch to join room option
      const joinOption = document.querySelector('[data-option="join"]');
      const createOption = document.querySelector('[data-option="create"]');
      const joinSection = document.getElementById('join-room-section');
      const createSection = document.getElementById('create-room-section');
      const roomCodeInput = document.getElementById('room-code-input');
      
      if (joinOption && createOption && joinSection && createSection && roomCodeInput) {
        // Update active option
        createOption.classList.remove('active');
        joinOption.classList.add('active');
        
        // Show join section, hide create section
        createSection.style.display = 'none';
        joinSection.style.display = 'block';
        
        // Pre-fill room code
        roomCodeInput.value = window.autoJoinRoomCode;
        
        // Add visual indication
        roomCodeInput.style.borderColor = '#00ffff';
        roomCodeInput.style.background = 'rgba(0, 255, 255, 0.1)';
        
        // Auto-focus username input first
        const usernameInput = document.getElementById('username');
        if (usernameInput) {
          usernameInput.focus();
          usernameInput.placeholder = 'Benutzername eingeben und Raum beitreten';
        }
        
        // Show notification
        showNotification('🔗 Link erkannt! Raumcode wurde automatisch eingefügt.', 'success');
      }
    }, 500);
    
    // Clear URL to avoid confusion
    if (window.history && window.history.replaceState) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }
}

// Show notification function
function showNotification(message, type = 'info') {
  // Create notification element if it doesn't exist
  let notification = document.getElementById('notification');
  if (!notification) {
    notification = document.createElement('div');
    notification.id = 'notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(15, 20, 35, 0.95);
      backdrop-filter: blur(20px);
      color: white;
      padding: 15px 25px;
      border-radius: 12px;
      border: 1px solid rgba(0, 255, 255, 0.3);
      z-index: 10000;
      font-weight: 500;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      opacity: 0;
      transform: translateX(-50%) translateY(-30px);
      max-width: 90%;
      text-align: center;
    `;
    document.body.appendChild(notification);
  }
  
  // Set message and color based on type
  notification.textContent = message;
  
  if (type === 'success') {
    notification.style.borderColor = 'rgba(0, 255, 0, 0.5)';
    notification.style.background = 'rgba(15, 35, 15, 0.95)';
  } else if (type === 'error') {
    notification.style.borderColor = 'rgba(255, 0, 0, 0.5)';
    notification.style.background = 'rgba(35, 15, 15, 0.95)';
  } else {
    notification.style.borderColor = 'rgba(0, 255, 255, 0.3)';
    notification.style.background = 'rgba(15, 20, 35, 0.95)';
  }
  
  // Show notification
  setTimeout(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(-50%) translateY(0)';
  }, 100);
  
  // Hide notification after 4 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(-50%) translateY(-30px)';
  }, 4000);
}

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
    chatToggle.addEventListener('click', () => {
      toggleChatVisibility();
      // Remove notification badge when opening chat
      if (chatVisible) {
        removeChatNotificationBadge();
      }
    });
  }
  
  if (sendChatBtn && chatInput) {
    // Button click handler
    sendChatBtn.addEventListener('click', (e) => {
      e.preventDefault();
      sendChatMessage();
    });
    
    // Touch event handlers for mobile
    sendChatBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      sendChatBtn.style.transform = 'scale(0.95)';
    });
    
    sendChatBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      sendChatBtn.style.transform = '';
      sendChatMessage();
    });
    
    // Enhanced keyboard handler
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        // Prevent default behavior
        e.preventDefault();
        
        // On mobile, check if it's a soft keyboard enter
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
          sendChatMessage();
        }
      }
    });
    
    // Input event for auto-resize, validation and counter
    chatInput.addEventListener('input', (e) => {
      // Auto-resize
      e.target.style.height = 'auto';
      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
      
      // Update character counter
      updateMessageCounter();
      
      // Visual feedback for message length
      const length = e.target.value.length;
      const maxLength = 200;
      if (length > maxLength * 0.8) {
        e.target.style.borderColor = length >= maxLength ? '#ff4444' : '#ffaa00';
      } else {
        e.target.style.borderColor = '';
      }
    });
    
    // Focus management for mobile
    chatInput.addEventListener('focus', () => {
      // Scroll to input on mobile
      if (window.innerWidth <= 768) {
        setTimeout(() => {
          chatInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    });
  }
  
  // Setup enhanced features
  handleMobileKeyboard();
  setupChatSwipeGestures();
  
  // Setup chat input auto-resize
  setupChatInputResize();
  
  // Chat-Nachrichten empfangen
  socket.on('chatMessage', (data) => {
    const messageType = data.type || (data.username === 'System' ? 'system' : 'other');
    displayChatMessage(data.username, data.message, data.timestamp, messageType);
  });
}

// Enhanced send chat message function
function sendChatMessage() {
  const chatInput = document.getElementById('chat-input');
  const usernameInput = document.getElementById('username');
  const sendBtn = document.getElementById('send-chat');
  
  if (!chatInput || !usernameInput) return;
  
  const message = chatInput.value.trim();
  const username = usernameInput.value.trim() || 'Anonym';
  
  if (!message) {
    // Visual feedback for empty message
    chatInput.style.borderColor = '#ff4444';
    chatInput.focus();
    setTimeout(() => {
      chatInput.style.borderColor = '';
    }, 1000);
    return;
  }
  
  // Check if we're in a room
  if (!roomCode) {
    showErrorMessage('Du musst zuerst einem Raum beitreten!');
    chatInput.focus();
    return;
  }
  
  // Prevent double sending
  if (sendBtn) {
    sendBtn.disabled = true;
    sendBtn.style.opacity = '0.6';
  }
  
  // Send message to server
  socket.emit('chatMessage', {
    room: roomCode,
    username: username,
    message: message,
    timestamp: Date.now()
  });
  
  // Clear input and reset
  chatInput.value = '';
  chatInput.style.height = 'auto';
  chatInput.style.borderColor = '';
  
  // Re-enable send button after short delay
  setTimeout(() => {
    if (sendBtn) {
      sendBtn.disabled = false;
      sendBtn.style.opacity = '';
    }
  }, 500);
  
  // Keep focus on input for quick messaging
  setTimeout(() => {
    chatInput.focus();
  }, 100);
  
  // Add haptic feedback
  triggerHapticFeedback('light');
}

// Chat message sound effect
function playMessageSound() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  } catch (error) {
    // Ignore audio errors
  }
}

// Enhanced chat toggle functionality with better mobile support and minimize feature
function toggleChatVisibility() {
  const liveChat = document.getElementById('live-chat');
  const toggleBtn = document.getElementById('toggle-chat');
  
  if (!liveChat || !toggleBtn) return;
  
  // Check current state
  const isMinimized = liveChat.classList.contains('minimized');
  const isVisible = liveChat.classList.contains('visible');
  
  if (!isVisible && !isMinimized) {
    // Show chat
    liveChat.style.display = 'block';
    setTimeout(() => {
      liveChat.classList.add('visible');
    }, 10);
    
    toggleBtn.textContent = '−';
    toggleBtn.setAttribute('aria-label', 'Chat minimieren');
    chatVisible = true;
    
    // Focus input when opening chat
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
      setTimeout(() => {
        chatInput.focus();
        if (window.innerWidth <= 768) {
          chatInput.style.fontSize = '16px';
        }
      }, 350);
    }
    
    // Add body class for mobile layout adjustments
    if (window.innerWidth <= 768) {
      document.body.classList.add('chat-open');
    }
    
  } else if (isVisible && !isMinimized) {
    // Minimize chat
    liveChat.classList.remove('visible');
    liveChat.classList.add('minimized');
    
    toggleBtn.textContent = '💬';
    toggleBtn.setAttribute('aria-label', 'Chat öffnen');
    chatVisible = false;
    
    // Remove body class
    document.body.classList.remove('chat-open');
    
  } else if (isMinimized) {
    // Restore from minimized
    liveChat.classList.remove('minimized');
    liveChat.classList.add('visible');
    
    toggleBtn.textContent = '−';
    toggleBtn.setAttribute('aria-label', 'Chat minimieren');
    chatVisible = true;
    
    // Focus input when restoring chat
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
      setTimeout(() => {
        chatInput.focus();
        if (window.innerWidth <= 768) {
          chatInput.style.fontSize = '16px';
        }
      }, 350);
    }
    
    // Add body class for mobile layout adjustments
    if (window.innerWidth <= 768) {
      document.body.classList.add('chat-open');
    }
  }
  
  // Add haptic feedback
  triggerHapticFeedback('medium');
}

// Enhanced auto-resize chat input with mobile optimization
function setupChatInputResize() {
  const chatInput = document.getElementById('chat-input');
  if (!chatInput) return;
  
  // Set initial font size for mobile to prevent zoom
  if (window.innerWidth <= 768) {
    chatInput.style.fontSize = '16px';
  }
  
  // Auto-resize functionality
  chatInput.addEventListener('input', function() {
    this.style.height = 'auto';
    const newHeight = Math.min(this.scrollHeight, 120);
    this.style.height = newHeight + 'px';
    
    // Adjust chat messages container height on mobile
    if (window.innerWidth <= 768) {
      const chatMessages = document.getElementById('chat-messages');
      if (chatMessages) {
        const extraHeight = newHeight - 50; // 50px is default input height
        chatMessages.style.paddingBottom = Math.max(0, extraHeight) + 'px';
      }
    }
  });
  
  // Handle viewport changes (mobile keyboard)
  window.addEventListener('resize', () => {
    if (chatVisible && window.innerWidth <= 768) {
      const chatInput = document.getElementById('chat-input');
      if (chatInput && document.activeElement === chatInput) {
        setTimeout(() => {
          chatInput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      }
    }
  });
}

// Enhanced chat message display with mobile optimizations
function displayChatMessage(username, message, timestamp, type = 'other') {
  const chatMessages = document.getElementById('chat-messages');
  if (!chatMessages) return;
  
  // Get current user's username for comparison
  const currentUsername = document.getElementById('username')?.value || '';
  const isCurrentUser = username === currentUsername;
  const isSystemMessage = type === 'system' || username === 'System';
  
  const messageElement = document.createElement('div');
  messageElement.classList.add('chat-message');
  
  if (isCurrentUser) {
    messageElement.classList.add('user');
  } else if (isSystemMessage) {
    messageElement.classList.add('system');
  } else {
    messageElement.classList.add('other');
  }
  
  const time = new Date(timestamp).toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  if (isSystemMessage) {
    messageElement.innerHTML = `
      <div class="message-content">${message}</div>
      <div class="message-time">${time}</div>
    `;
  } else {
    messageElement.innerHTML = `
      <div class="message-sender">${username}</div>
      <div class="message-content">${message}</div>
      <div class="message-time">${time}</div>
    `;
  }
  
  // Add entrance animation
  messageElement.style.opacity = '0';
  messageElement.style.transform = 'translateY(20px)';
  
  chatMessages.appendChild(messageElement);
  
  // Animate in
  requestAnimationFrame(() => {
    messageElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    messageElement.style.opacity = '1';
    messageElement.style.transform = 'translateY(0)';
  });
  
  // Smooth scroll to bottom
  chatMessages.scrollTo({
    top: chatMessages.scrollHeight,
    behavior: 'smooth'
  });
  
  // Add notification badge if chat is closed and message is from another user
  if (!chatVisible && !isCurrentUser && !isSystemMessage) {
    addChatNotificationBadge();
  }
  
  // Play sound effect
  if (!isCurrentUser && 'AudioContext' in window) {
    playMessageSound();
  }
  
  // Limit message history for performance
  if (chatMessages.children.length > 50) {
    chatMessages.removeChild(chatMessages.firstChild);
  }
  
  // Add haptic feedback for received messages
  if (!isCurrentUser) {
    triggerHapticFeedback('light');
  }
}

// Add notification badge to chat toggle
function addChatNotificationBadge() {
  const chatToggle = document.getElementById('toggle-chat');
  if (chatToggle) {
    chatToggle.classList.add('has-new-messages');
  }
}

// Remove notification badge
function removeChatNotificationBadge() {
  const chatToggle = document.getElementById('toggle-chat');
  if (chatToggle) {
    chatToggle.classList.remove('has-new-messages');
  }
}

// Enhanced message character counter
function updateMessageCounter() {
  const chatInput = document.getElementById('chat-input');
  const chatInputContainer = document.querySelector('.chat-input');
  
  if (!chatInput || !chatInputContainer) return;
  
  const currentLength = chatInput.value.length;
  const maxLength = 200;
  const remaining = maxLength - currentLength;
  
  chatInputContainer.setAttribute('data-count', `${remaining}`);
  
  if (currentLength > maxLength * 0.8) {
    chatInputContainer.classList.add('show-counter');
    if (remaining <= 0) {
      chatInput.style.borderColor = '#ff4444';
    } else if (remaining <= 40) {
      chatInput.style.borderColor = '#ffaa00';
    }
  } else {
    chatInputContainer.classList.remove('show-counter');
    chatInput.style.borderColor = '';
  }
}

// Mobile keyboard handling
function handleMobileKeyboard() {
  if (window.innerWidth > 768) return;
  
  const chatInput = document.getElementById('chat-input');
  const liveChat = document.getElementById('live-chat');
  
  if (!chatInput || !liveChat) return;
  
  let initialViewportHeight = window.innerHeight;
  
  window.addEventListener('resize', () => {
    const currentHeight = window.innerHeight;
    const heightDifference = initialViewportHeight - currentHeight;
    
    // Keyboard likely opened if height decreased significantly
    if (heightDifference > 150) {
      liveChat.style.height = `calc(60vh - ${heightDifference * 0.3}px)`;
      
      // Scroll input into view
      setTimeout(() => {
        chatInput.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 100);
    } else {
      // Keyboard closed
      liveChat.style.height = '60vh';
    }
  });
}

// Swipe to close chat on mobile
function setupChatSwipeGestures() {
  const liveChat = document.getElementById('live-chat');
  if (!liveChat || window.innerWidth > 768) return;
  
  let startY = 0;
  let currentY = 0;
  let isDragging = false;
  
  liveChat.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
    isDragging = true;
    liveChat.style.transition = 'none';
  });
  
  liveChat.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    
    currentY = e.touches[0].clientY;
    const deltaY = currentY - startY;
    
    // Only allow downward swipe
    if (deltaY > 0) {
      liveChat.style.transform = `translateY(${deltaY}px)`;
    }
  });
  
  liveChat.addEventListener('touchend', () => {
    if (!isDragging) return;
    
    isDragging = false;
    liveChat.style.transition = '';
    
    const deltaY = currentY - startY;
    
    // Close chat if swiped down more than 100px
    if (deltaY > 100) {
      toggleChatVisibility();
    } else {
      // Snap back
      liveChat.style.transform = 'translateY(0)';
    }
  });
}