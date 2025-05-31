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

let rooms = {}, playersList = [];
fs.readFile(path.join(__dirname, 'true1.txt'), 'utf8', (e,d) => {
  if (!e) playersList = d.split('\n').slice(0,200).map(l=>l.trim()).filter(Boolean);
});

io.on('connection', socket => {
  console.log('A user connected');
  const userId = uuidv4();

  socket.on('setUsername', name => {
    socket.username = name;
    console.log(`User ${socket.id} set username to ${name}`);
  });

  socket.on('setTopic', (room, topic) => {
    if (rooms[room]) rooms[room].topic = topic;
  });

  socket.on('joinRoom', room => {
    socket.join(room);
    if (!rooms[room]) rooms[room] = { players: [], host: socket.id };
    const idx = rooms[room].players.findIndex(p=>p.id===socket.id);
    if (idx===-1) {
      rooms[room].players.push({
        id: socket.id,
        userId,
        username: socket.username || `Spieler ${rooms[room].players.length+1}`
      });
    }
    io.to(room).emit('updatePlayersList', rooms[room].players);
    if (rooms[room].host === socket.id) {
      socket.emit('host', true);
      socket.emit('message', 'Du bist der Host.');
    } else {
      socket.emit('message', 'Warte auf den Host.');
    }
  });

  socket.on('startGame', room => {
    const r = rooms[room];
    if (!r || r.host !== socket.id) return;
    if (r.players.length < 2) {
      socket.emit('message', 'Mindestens 2 Spieler benötigt.');
      return;
    }
    startGame(room);
    io.to(room).emit('gameStarted');
  });

  socket.on('disconnect', () => {
    console.log(`User ${socket.id} disconnected`);
    for (const room in rooms) {
      const pl = rooms[room].players;
      const i = pl.findIndex(p => p.id === socket.id);
      if (i !== -1) {
        pl.splice(i,1);
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

function getRandomName() {
  return playersList[Math.floor(Math.random()*playersList.length)];
}

function startGame(room) {
  const { players, topic, host } = rooms[room];
  const chosenTopic = topic && topic.trim() ? topic : 'Fußballer';
  
  // Erstelle eine Liste von Spielern, die Imposter werden können
  // Schließe den Host aus, wenn ein Thema gesetzt wurde
  const eligiblePlayers = topic && topic.trim() 
    ? players.filter(p => p.id !== host)
    : players;
  
  // Wenn alle Spieler außer dem Host ausgeschlossen sind, kann niemand Imposter sein
  if (eligiblePlayers.length === 0) {
    io.to(room).emit('message', 'Nicht genügend Spieler für einen Imposter.');
    return;
  }
  
  // Wähle zufälligen Imposter aus den berechtigten Spielern
  const randomIndex = Math.floor(Math.random() * eligiblePlayers.length);
  const imposterPlayerId = eligiblePlayers[randomIndex].id;
  
  // Informiere jeden Spieler über seinen Status
  players.forEach(player => {
    const isImposter = player.id === imposterPlayerId;
    const msg = isImposter
      ? 'Du bist der Imposter! Täusche die anderen Spieler :)'
      : `Das Thema ist: ${chosenTopic}`;
    io.to(player.id).emit('message', msg);
    io.to(player.id).emit('imposterStatus', isImposter);
  });
}

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});