const express  = require('express');
const http     = require('http');
const socketIo = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const fs       = require('fs');
const path     = require('path');

const app    = express();
const server = http.createServer(app);
const io     = socketIo(server);
const PORT   = process.env.PORT || 3000;

app.use(express.static('public'));

// Route für direktes Beitreten per Link
app.get('/join/:roomCode', (req, res) => {
  const roomCode = req.params.roomCode.toUpperCase();
  
  // Validate room code format
  if (!roomCode || roomCode.length !== 6 || !/^[A-Z0-9]+$/.test(roomCode)) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ungültiger Raumcode</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Roboto Mono', monospace; background: linear-gradient(135deg, #001220 0%, #000810 100%); color: white; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0;">
        <div style="text-align: center; padding: 2rem; background: rgba(255, 255, 255, 0.1); border-radius: 15px; backdrop-filter: blur(20px);">
          <h1>❌ Ungültiger Raumcode</h1>
          <p>Der Raumcode "${req.params.roomCode}" ist ungültig.</p>
          <a href="/" style="color: #64add7; text-decoration: none;">← Zurück zum Spiel</a>
        </div>
      </body>
      </html>
    `);
  }
  
  // Check if room exists
  if (!rooms[roomCode]) {
    return res.status(404).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Raum nicht gefunden</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Roboto Mono', monospace; background: linear-gradient(135deg, #001220 0%, #000810 100%); color: white; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0;">
        <div style="text-align: center; padding: 2rem; background: rgba(255, 255, 255, 0.1); border-radius: 15px; backdrop-filter: blur(20px);">
          <h1>🔍 Raum nicht gefunden</h1>
          <p>Der Raum mit Code "${roomCode}" existiert nicht oder ist bereits geschlossen.</p>
          <a href="/" style="color: #64add7; text-decoration: none;">← Neuen Raum erstellen</a>
        </div>
      </body>
      </html>
    `);
  }
  
  // Serve the main page with room code parameter
  const indexPath = path.join(__dirname, 'public', 'index.html');
  fs.readFile(indexPath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send('Error loading page');
    }
    
    // Inject room code script before closing head tag
    const modifiedData = data.replace(
      '</head>',
      `  <script>window.autoJoinRoomCode = "${roomCode}";</script>\n</head>`
    );
    
    res.send(modifiedData);
  });
});

let rooms = {}, playersList = [];

// Schwierigkeitsgrade für Fußball-Modus
const difficultyRanges = {
  easy: { min: 10, max: 50 },
  medium: { min: 50, max: 200 }, 
  hard: { min: 200, max: 500 }
};

fs.readFile(path.join(__dirname, 'true1.txt'), 'utf8', (e,d) => {
  if (!e) playersList = d.split('\n').slice(0, 1000).map(l=>l.trim()).filter(Boolean);
});

io.on('connection', socket => {
  console.log('A user connected');
  const userId = uuidv4();
  socket.userId = userId;
  let userGameSettings = { mode: 'gamemaster', difficulty: 'medium' };

  socket.on('setUsername', name => {
    socket.username = name;
    console.log(`User ${socket.id} set username to ${name}`);
  });

  socket.on('setGameSettings', settings => {
    userGameSettings = { ...userGameSettings, ...settings };
    console.log(`User ${socket.id} set game settings:`, userGameSettings);
  });

  socket.on('setTopic', (room, topic) => {
    if (rooms[room]) {
      rooms[room].topic = topic;
      rooms[room].mode = userGameSettings.mode;
      rooms[room].difficulty = userGameSettings.difficulty;
    }
  });

  // ===== PHASE 3: NEW ROOM SYSTEM =====
  socket.on('createRoom', (data) => {
    console.log('Create room request:', data);
    
    // Extract settings from the request
    let gameSettings = userGameSettings;
    
    if (data && typeof data === 'object') {
      // Set username if provided
      if (data.username) {
        socket.username = data.username;
      }
      
      // Update game settings with provided data
      gameSettings = {
        mode: data.gameMode || userGameSettings.mode || 'gamemaster',
        difficulty: data.difficulty || userGameSettings.difficulty || 'medium'
      };
      
      console.log('Updated game settings:', gameSettings);
    }
    
    createRoomWithCode(socket, gameSettings);
  });

  socket.on('joinRoom', (data) => {
    console.log('Join room request:', data);
    
    let roomCode, username;
    
    // Handle new format with username and roomCode
    if (typeof data === 'object' && data.roomCode) {
      roomCode = data.roomCode;
      username = data.username;
      
      // Set username on socket
      if (username) {
        socket.username = username;
      }
      
      // Join room with new system
      if (roomCode && roomCode.length === 6 && /^[A-Z0-9]+$/.test(roomCode)) {
        joinRoomWithCode(socket, roomCode, userGameSettings);
        return;
      }
    }
    
    // Legacy handling - if data is a string (old room code)
    if (typeof data === 'string') {
      roomCode = data;
    }
    
    // Check if it's the new 6-character code system or legacy
    if (roomCode && roomCode.length === 6 && /^[A-Z0-9]+$/.test(roomCode)) {
      joinRoomWithCode(socket, roomCode, userGameSettings);
    } else {
      // Legacy room joining (for backward compatibility)
      socket.join(roomCode);
      if (!rooms[roomCode]) {
        rooms[roomCode] = { 
          players: [], 
          host: socket.id,
          mode: userGameSettings.mode,
          difficulty: userGameSettings.difficulty,
          topic: null,
          chatHistory: [],
          createdAt: Date.now(),
          gameStarted: false
        };
      }
      const idx = rooms[roomCode].players.findIndex(p=>p.id===socket.id);
      if (idx===-1) {
        rooms[room].players.push({
          id: socket.id,
          userId,
          username: socket.username || `Spieler ${rooms[room].players.length+1}`,
          gameSettings: userGameSettings,
          joinedAt: Date.now()
        });
      }
      io.to(room).emit('updatePlayersList', rooms[room].players);
      if (rooms[room].host === socket.id) {
        socket.emit('host', true);
        socket.emit('message', 'Du bist der Host.');
      } else {
        socket.emit('message', 'Warte auf den Host.');
      }
    }
  });

  // ===== LIVE CHAT SYSTEM =====
  socket.on('chatMessage', (data) => {
    const { room, message, username } = data;
    
    // Validate input
    if (!room || !message || !username) {
      return;
    }
    
    // Check if user is in the room
    if (!rooms[room] || !rooms[room].players.find(p => p.id === socket.id)) {
      return;
    }
    
    // Sanitize message
    const sanitizedMessage = message.trim().substring(0, 200);
    if (!sanitizedMessage) return;
    
    // Broadcast message to all players in the room
    const chatData = {
      username: username,
      message: sanitizedMessage,
      timestamp: new Date().toISOString(),
      userId: socket.id
    };
    
    io.to(room).emit('chatMessage', chatData);
    console.log(`Chat message in room ${room} from ${username}: ${sanitizedMessage}`);
  });

  socket.on('startGame', room => {
    enhancedStartGame(socket, room);
  });

  // ===== GAMIFICATION EVENTS =====
  socket.on('playerAction', (data) => {
    // Handle various player actions for XP/achievements
    const { action, room } = data;
    
    switch(action) {
      case 'correctGuess':
        socket.emit('correctGuess');
        break;
      case 'gameWon':
        socket.emit('gameWon');
        break;
    }
  });

  // ===== NEUE RUNDE & RAUM VERLASSEN =====
  socket.on('startNewRound', (roomCode) => {
    if (!roomCode || !rooms[roomCode]) {
      socket.emit('error', { message: 'Raum nicht gefunden.' });
      return;
    }

    const room = rooms[roomCode];
    
    // Nur Host kann neue Runde starten
    if (room.host !== socket.id) {
      socket.emit('error', { message: 'Nur der Host kann eine neue Runde starten.' });
      return;
    }

    // Spiel zurücksetzen
    room.gameStarted = false;
    room.topic = null;
    
    // Alle Spieler benachrichtigen
    io.to(roomCode).emit('newRoundStarted');
    io.to(roomCode).emit('message', 'Eine neue Runde wurde gestartet!');
    
    // System-Nachricht an Chat
    const systemMessage = {
      type: 'system',
      message: '🎮 Eine neue Runde wurde gestartet!',
      timestamp: Date.now(),
      room: roomCode
    };
    room.chatHistory.push(systemMessage);
    io.to(roomCode).emit('chatMessage', systemMessage);
    
    // XP für Host vergeben
    socket.emit('xpGained', { 
      amount: 10, 
      reason: 'Neue Runde gestartet',
      source: 'host'
    });

    console.log(`New round started in room ${roomCode} by ${socket.username || socket.id}`);
  });

  socket.on('leaveRoom', (roomCode) => {
    if (!roomCode || !rooms[roomCode]) {
      socket.emit('error', { message: 'Raum nicht gefunden.' });
      return;
    }

    const room = rooms[roomCode];
    const playerIndex = room.players.findIndex(p => p.id === socket.id);
    
    if (playerIndex === -1) {
      socket.emit('error', { message: 'Du bist nicht in diesem Raum.' });
      return;
    }

    const leavingPlayer = room.players[playerIndex];
    const wasHost = room.host === socket.id;
    
    // Spieler aus Raum entfernen
    room.players.splice(playerIndex, 1);
    socket.leave(roomCode);
    
    // System-Nachricht an Chat
    const systemMessage = {
      type: 'system',
      message: `${leavingPlayer.username || 'Ein Spieler'} hat den Raum verlassen`,
      timestamp: Date.now(),
      room: roomCode
    };
    room.chatHistory.push(systemMessage);
    io.to(roomCode).emit('chatMessage', systemMessage);
    
    // Spielerliste aktualisieren
    io.to(roomCode).emit('updatePlayersList', room.players);
    
    // Neuen Host wählen wenn nötig
    if (wasHost && room.players.length > 0) {
      room.host = room.players[0].id;
      io.to(room.host).emit('host', true);
      io.to(room.host).emit('message', 'Du bist jetzt der neue Host.');
      
      const newHostMessage = {
        type: 'system',
        message: `${room.players[0].username || 'Ein Spieler'} ist jetzt der neue Host`,
        timestamp: Date.now(),
        room: roomCode
      };
      room.chatHistory.push(newHostMessage);
      io.to(roomCode).emit('chatMessage', newHostMessage);
    }
    
    // Raum löschen wenn leer
    if (room.players.length === 0) {
      delete rooms[roomCode];
      console.log(`Room ${roomCode} deleted (empty)`);
    }
    
    // Spieler zur Startseite weiterleiten
    socket.emit('roomLeft');
    socket.emit('message', `Du hast den Raum ${roomCode} verlassen.`);
    
    console.log(`${leavingPlayer.username || socket.id} left room ${roomCode}`);
  });

  socket.on('disconnect', () => {
    console.log(`User ${socket.id} disconnected`);
    for (const room in rooms) {
      const pl = rooms[room].players;
      const i = pl.findIndex(p => p.id === socket.id);
      if (i !== -1) {
        const disconnectedPlayer = pl[i];
        pl.splice(i,1);
        
        // Add system message about player leaving
        if (rooms[room].chatHistory) {
          const systemMessage = {
            type: 'system',
            message: `${disconnectedPlayer.username || 'Ein Spieler'} hat den Raum verlassen`,
            timestamp: Date.now(),
            room: room
          };
          
          rooms[room].chatHistory.push(systemMessage);
          io.to(room).emit('chatMessage', systemMessage);
        }
        
        io.to(room).emit('updatePlayersList', pl);
        
        if (rooms[room].host === socket.id && pl.length>0) {
          rooms[room].host = pl[0].id;
          io.to(rooms[room].host).emit('host', true);
          io.to(rooms[room].host).emit('message', 'Du bist neuer Host.');
        }
      }
      if (pl.length === 0) delete rooms[room];
    }
  });
});

// ===== PHASE 3: ADVANCED BACKEND FEATURES =====

// Room code generation utility
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Check if room code already exists
function isRoomCodeUnique(code) {
  return !rooms[code];
}

// Generate unique room code
function generateUniqueRoomCode() {
  let code;
  let attempts = 0;
  do {
    code = generateRoomCode();
    attempts++;
  } while (!isRoomCodeUnique(code) && attempts < 100);
  
  if (attempts >= 100) {
    throw new Error('Unable to generate unique room code');
  }
  
  return code;
}

// Enhanced room creation with codes
function createRoomWithCode(socket, gameSettings) {
  try {
    const roomCode = generateUniqueRoomCode();
    
    rooms[roomCode] = {
      players: [],
      host: socket.id,
      mode: gameSettings.mode || 'gamemaster',
      difficulty: gameSettings.difficulty || 'medium',
      topic: null,
      chatHistory: [],
      createdAt: Date.now(),
      gameStarted: false
    };
    
    // Add creator to room
    socket.join(roomCode);
    rooms[roomCode].players.push({
      id: socket.id,
      userId: socket.userId,
      username: socket.username || `Host`,
      gameSettings: gameSettings,
      joinedAt: Date.now()
    });
    
    console.log(`Room ${roomCode} created by ${socket.username || socket.id}`);
    
    socket.emit('roomCreated', { 
      code: roomCode, 
      isHost: true 
    });
    
    socket.emit('host', true);
    socket.emit('message', 'Raum erfolgreich erstellt! Teile den Code mit deinen Freunden.');
    
    io.to(roomCode).emit('updatePlayersList', rooms[roomCode].players);
    
    return roomCode;
  } catch (error) {
    socket.emit('roomError', { 
      message: 'Fehler beim Erstellen des Raums. Bitte versuche es erneut.' 
    });
    return null;
  }
}

// Enhanced room joining with validation
function joinRoomWithCode(socket, roomCode, gameSettings) {
  // Validate room code format
  if (!roomCode || roomCode.length !== 6) {
    socket.emit('roomError', { 
      message: 'Ungültiger Raumcode. Bitte gib einen 6-stelligen Code ein.' 
    });
    return;
  }
  
  roomCode = roomCode.toUpperCase();
  
  // Check if room exists
  if (!rooms[roomCode]) {
    socket.emit('roomError', { 
      message: 'Raum nicht gefunden. Überprüfe den Code und versuche es erneut.' 
    });
    return;
  }
  
  const room = rooms[roomCode];
  
  // Check if game already started
  if (room.gameStarted) {
    socket.emit('roomError', { 
      message: 'Das Spiel in diesem Raum hat bereits begonnen.' 
    });
    return;
  }
  
  // Check if user already in room
  const existingPlayer = room.players.find(p => p.id === socket.id);
  if (existingPlayer) {
    socket.emit('roomError', { 
      message: 'Du bist bereits in diesem Raum.' 
    });
    return;
  }
  
  // Check room capacity (max 20 players)
  if (room.players.length >= 20) {
    socket.emit('roomError', { 
      message: 'Dieser Raum ist voll (maximal 20 Spieler).' 
    });
    return;
  }
  
  // Join room
  socket.join(roomCode);
  room.players.push({
    id: socket.id,
    userId: socket.userId,
    username: socket.username || `Spieler ${room.players.length + 1}`,
    gameSettings: gameSettings,
    joinedAt: Date.now()
  });
  
  console.log(`${socket.username || socket.id} joined room ${roomCode}`);
  
  socket.emit('roomJoined', { 
    code: roomCode, 
    isHost: false 
  });
  
  socket.emit('message', `Erfolgreich Raum ${roomCode} beigetreten!`);
  
  // Send chat history to new player
  if (room.chatHistory.length > 0) {
    room.chatHistory.forEach(msg => {
      socket.emit('chatMessage', msg);
    });
  }
  
  // Add system message to chat
  const systemMessage = {
    type: 'system',
    message: `${socket.username || 'Ein Spieler'} ist dem Raum beigetreten`,
    timestamp: Date.now(),
    room: roomCode
  };
  
  room.chatHistory.push(systemMessage);
  io.to(roomCode).emit('chatMessage', systemMessage);
  io.to(roomCode).emit('updatePlayersList', room.players);
  
  // Check if host disconnected and promote new host
  const hostExists = room.players.find(p => p.id === room.host);
  if (!hostExists && room.players.length > 0) {
    room.host = room.players[0].id;
    io.to(room.host).emit('host', true);
    io.to(room.host).emit('message', 'Du bist jetzt der neue Host.');
  }
}

// Live chat system
function handleChatMessage(socket, data) {
  const { room, message } = data;
  
  if (!rooms[room]) {
    socket.emit('chatError', { message: 'Raum nicht gefunden.' });
    return;
  }
  
  const player = rooms[room].players.find(p => p.id === socket.id);
  if (!player) {
    socket.emit('chatError', { message: 'Du bist nicht in diesem Raum.' });
    return;
  }
  
  // Validate message
  if (!message || message.trim().length === 0) {
    return;
  }
  
  if (message.length > 200) {
    socket.emit('chatError', { message: 'Nachricht zu lang (max. 200 Zeichen).' });
    return;
  }
  
  // Create chat message
  const chatMessage = {
    type: 'user',
    username: player.username,
    message: message.trim(),
    timestamp: Date.now(),
    room: room,
    userId: player.userId
  };
  
  // Store in room history
  rooms[room].chatHistory.push(chatMessage);
  
  // Limit chat history to last 50 messages
  if (rooms[room].chatHistory.length > 50) {
    rooms[room].chatHistory = rooms[room].chatHistory.slice(-50);
  }
  
  // Send to all players in room
  rooms[room].players.forEach(p => {
    const messageForPlayer = {
      ...chatMessage,
      isOwn: p.id === socket.id
    };
    io.to(p.id).emit('chatMessage', messageForPlayer);
  });
  
  console.log(`Chat message in room ${room} from ${player.username}: ${message}`);
}

// Enhanced game start with better feedback
function enhancedStartGame(socket, room) {
  console.log(`Start game request for room ${room} by ${socket.id}`);
  
  const r = rooms[room];
  if (!r) {
    console.log(`Room ${room} not found`);
    socket.emit('message', 'Raum nicht gefunden.');
    return;
  }
  
  console.log(`Room ${room} details:`, {
    host: r.host,
    requester: socket.id,
    players: r.players.length,
    mode: r.mode,
    topic: r.topic,
    gameStarted: r.gameStarted
  });
  
  if (r.host !== socket.id) {
    console.log(`Permission denied - not host`);
    socket.emit('message', 'Nur der Host kann das Spiel starten.');
    return;
  }
  
  // Für Testing: Erlaube Spiel mit nur 1 Spieler (normalerweise 2)
  if (r.players.length < 1) {
    console.log(`Not enough players: ${r.players.length}`);
    socket.emit('message', 'Mindestens 1 Spieler benötigt.');
    return;
  }
  
  // Prüfe nur bei Gamemaster-Modus nach Thema
  if (r.mode === 'gamemaster' && (!r.topic || r.topic.trim().length === 0)) {
    console.log(`No topic provided for gamemaster mode. Mode: ${r.mode}, Topic: "${r.topic}"`);
    socket.emit('message', 'Bitte gib ein Thema ein.');
    return;
  }
  
  console.log(`Starting game in room ${room} with mode ${r.mode}`);
  r.gameStarted = true;
  
  // Add system message
  const systemMessage = {
    type: 'system',
    message: 'Das Spiel hat begonnen! 🎮',
    timestamp: Date.now(),
    room: room
  };
  
  r.chatHistory.push(systemMessage);
  io.to(room).emit('chatMessage', systemMessage);
  
  startGame(room);
  io.to(room).emit('gameStarted');
  
  console.log(`Game successfully started in room ${room} with ${r.players.length} players`);
}

// Game ending functions
function endGame(roomCode, winner = null, reason = 'Spiel beendet') {
  if (!rooms[roomCode]) return;
  
  const room = rooms[roomCode];
  
  // Game Over Event senden
  const gameEndData = {
    winner: winner,
    reason: reason,
    timestamp: Date.now()
  };
  
  io.to(roomCode).emit('gameEnded', gameEndData);
  
  // System-Nachricht an Chat
  const systemMessage = {
    type: 'system',
    message: winner ? `🎉 ${winner} hat gewonnen! (${reason})` : `🎮 Spiel beendet: ${reason}`,
    timestamp: Date.now(),
    room: roomCode
  };
  room.chatHistory.push(systemMessage);
  io.to(roomCode).emit('chatMessage', systemMessage);
  
  console.log(`Game ended in room ${roomCode}: ${reason}${winner ? ` (Winner: ${winner})` : ''}`);
}

// Example usage - you can call this when game conditions are met
function checkGameEnd(roomCode) {
  // This is just an example - you'd implement your actual game ending logic here
  // For example: if voting is complete, if time runs out, etc.
  
  const room = rooms[roomCode];
  if (!room) return;
  
  // Example: End game after some condition
  // endGame(roomCode, 'Spieler 1', 'Imposter gefunden');
}

function getRoomStats() {
  const stats = {
    totalRooms: Object.keys(rooms).length,
    totalPlayers: 0,
    activeGames: 0,
    roomsByMode: {
      gamemaster: 0,
      football: 0,
      ai: 0
    }
  };
  
  for (const roomCode in rooms) {
    const room = rooms[roomCode];
    stats.totalPlayers += room.players.length;
    
    if (room.gameStarted) {
      stats.activeGames++;
    }
    
    if (room.mode in stats.roomsByMode) {
      stats.roomsByMode[room.mode]++;
    }
  }
  
  return stats;
}

// Cleanup old empty rooms (runs every 30 minutes)
setInterval(() => {
  const now = Date.now();
  const maxAge = 30 * 60 * 1000; // 30 minutes
  
  for (const roomCode in rooms) {
    const room = rooms[roomCode];
    
    // Remove empty rooms older than 30 minutes
    if (room.players.length === 0 && (now - room.createdAt) > maxAge) {
      delete rooms[roomCode];
      console.log(`Cleaned up empty room: ${roomCode}`);
    }
    
    // Remove inactive rooms (no activity for 2 hours)
    const lastActivity = Math.max(
      room.createdAt,
      ...room.chatHistory.map(msg => msg.timestamp),
      ...room.players.map(p => p.joinedAt)
    );
    
    if ((now - lastActivity) > (2 * 60 * 60 * 1000)) { // 2 hours
      delete rooms[roomCode];
      console.log(`Cleaned up inactive room: ${roomCode}`);
    }
  }
}, 30 * 60 * 1000); // Run every 30 minutes

function getRandomName(difficulty = 'medium') {
  const range = difficultyRanges[difficulty] || difficultyRanges.medium;
  // Zufälliger Bereich innerhalb der Schwierigkeit
  const randomOffset = Math.floor(Math.random() * (range.max - range.min));
  const startIndex = range.min + randomOffset;
  const endIndex = Math.min(startIndex + 50, range.max, playersList.length);
  
  // Wähle zufälligen Spieler aus dem Bereich
  const availablePlayers = playersList.slice(startIndex, endIndex);
  return availablePlayers[Math.floor(Math.random() * availablePlayers.length)] || playersList[0];
}

function startGame(room) {
  const { players, topic, host, mode, difficulty } = rooms[room];
  
  if (mode === 'gamemaster') {
    // Gamemaster Modus: Host ist kein Imposter und bekommt kein Thema
    const eligiblePlayers = players.filter(p => p.id !== host);
    
    if (eligiblePlayers.length === 0) {
      io.to(room).emit('message', 'Nicht genügend Spieler für einen Imposter.');
      return;
    }
    
    const randomIndex = Math.floor(Math.random() * eligiblePlayers.length);
    const imposterPlayerId = eligiblePlayers[randomIndex].id;
    
    players.forEach(player => {
      if (player.id === host) {
        // Host bekommt keine Nachricht über das Thema
        io.to(player.id).emit('message', 'Du bist der Gamemaster. Beobachte die Diskussion!');
        io.to(player.id).emit('imposterStatus', false);
      } else {
        const isImposter = player.id === imposterPlayerId;
        const msg = isImposter
          ? 'Du bist der Imposter! Täusche die anderen Spieler :)'
          : `Das Thema ist: ${topic}`;
        io.to(player.id).emit('message', msg);
        io.to(player.id).emit('imposterStatus', isImposter);
      }
    });
    
  } else if (mode === 'football') {
    // Fußball Imposter Modus: Zufälliger Spieler aus der Datenbank
    const footballPlayer = getRandomName(difficulty);
    const randomIndex = Math.floor(Math.random() * players.length);
    const imposterPlayerId = players[randomIndex].id;
    
    players.forEach(player => {
      const isImposter = player.id === imposterPlayerId;
      const msg = isImposter
        ? 'Du bist der Imposter! Täusche die anderen Spieler :)'
        : `Der Fußballspieler ist: ${footballPlayer}`;
      io.to(player.id).emit('message', msg);
      io.to(player.id).emit('imposterStatus', isImposter);
    });
  }
}

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});