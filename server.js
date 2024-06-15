const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

let rooms = {};
let playersList = [];

// Lese die Datei und speichere die Namen in playersList
fs.readFile(path.join(__dirname, 'true1.txt'), 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading file:', err);
        return;
    }
    // Teile die Daten in Zeilen auf und füge sie der playersList hinzu
    playersList = data.split('\n').slice(0, 200).map(line => line.trim()).filter(Boolean);
});

io.on('connection', (socket) => {
    console.log('A user connected');
    const userId = uuidv4();

    // Neues Ereignis zum Setzen des Benutzernamens
    socket.on('setUsername', (username) => {
        socket.username = username;
    });

    socket.on('joinRoom', (room) => {
        socket.join(room);
        if (!rooms[room]) {
            rooms[room] = { players: [], host: socket.id };
        }
        // Speichern Sie den Benutzernamen zusammen mit der ID
        rooms[room].players.push({ id: socket.id, userId, username: socket.username });

        if (rooms[room].players.length === 1) {
            socket.emit('message', 'You are the host. Wait for more players and start the game when ready.');
            socket.emit('host', true); // Notify the first player that they are the host
        } else {
            socket.emit('message', 'Waiting for the host to start the game...');
        }
    });

    socket.on('startGame', (room) => {
        if (rooms[room] && rooms[room].host === socket.id) {
            startGame(room);
            io.to(room).emit('gameStarted');
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
        for (const room in rooms) {
            rooms[room].players = rooms[room].players.filter(player => player.id !== socket.id);
            if (rooms[room].players.length === 0) {
                delete rooms[room];
            }
        }
    });
});

function getRandomName() {
    // Wähle einen zufälligen Index aus der playersList
    const randomIndex = Math.floor(Math.random() * playersList.length);
    return playersList[randomIndex];
}

function startGame(room) {
    const players = rooms[room].players;
    const imposterIndex = Math.floor(Math.random() * players.length);
    const randomName = getRandomName();

    players.forEach((player, index) => {
        let isImposter = index === imposterIndex;
        io.to(player.id).emit('message', isImposter ? 'Imposter' : `Kein Imposter (${randomName})`);
        io.to(player.id).emit('imposterStatus', isImposter);
    });
}



server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

