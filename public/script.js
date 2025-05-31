const socket = io();

// Typing-Effekt
document.addEventListener("DOMContentLoaded", () => {
  const txt1 = 'Willkommen', txt2 = 'Bitte gib deinen Namen ein und wähle einen Raum aus.', speed = 100;
  let i = 0, j = 0;
  function type1() {
    if (i < txt1.length) {
      document.getElementById("welcome").innerHTML += txt1.charAt(i++);
      setTimeout(type1, speed);
    } else type2();
  }
  function type2() {
    if (j < txt2.length) {
      document.getElementById("welcome2").innerHTML += txt2.charAt(j++);
      setTimeout(type2, speed);
    }
  }
  window.onload = type1;
});

// Join-Button
document.getElementById('join-button').addEventListener('click', () => {
  const username = document.getElementById('username').value.trim();
  const room = document.getElementById('room-input').value.trim();
  if (!username) { alert('Bitte gib einen Benutzernamen ein!'); return; }
  if (!room)     { alert('Bitte gib einen Raumnamen ein!'); return; }
  socket.emit('setUsername', username);
  socket.emit('joinRoom', room);
  ['h2','h4','#username','#room-input','#join-button'].forEach(sel => {
    document.querySelector(sel).style.display = 'none';
  });
  document.body.style.backgroundImage = 'url("data:image/svg+xml,%3Csvg id=\'visual\' viewBox=\'0 0 900 600\' width=\'900\' height=\'600\' xmlns=\'http://www.w3.org/2000/svg\' xmlns:xlink=\'http://www.w3.org/1999/xlink\' version=\'1.1\'%3E%3Crect x=\'0\' y=\'0\' width=\'900\' height=\'600\' fill=\'%23001220\'%3E%3C/rect%3E%3Cdefs%3E%3ClinearGradient id=\'grad1_0\' x1=\'33.3%25\' y1=\'0%25\' x2=\'100%25\' y2=\'100%25\'%3E%3Cstop offset=\'20%25\' stop-color=\'%23001220\' stop-opacity=\'1\'%3E%3C/stop%3E%3Cstop offset=\'80%25\' stop-color=\'%23001220\' stop-opacity=\'1\'%3E%3C/stop%3E%3C/linearGradient%3E%3ClinearGradient id=\'grad2_0\' x1=\'0%25\' y1=\'0%25\' x2=\'66.7%25\' y2=\'100%25\'%3E%3Cstop offset=\'20%25\' stop-color=\'%23001220\' stop-opacity=\'1\'%3E%3C/stop%3E%3Cstop offset=\'80%25\' stop-color=\'%23001220\' stop-opacity=\'1\'%3E%3C/stop%3E%3C/linearGradient%3E%3C/defs%3E%3Cg transform=\'translate(900, 0)\'%3E%3Cpath d=\'M0 270.4C-38.9 270.4 -77.7 270.4 -103.5 249.8C-129.3 229.3 -142 188.2 -159.8 159.8C-177.6 131.4 -200.6 115.6 -219.9 91.1C-239.2 66.6 -254.8 33.3 -270.4 0L0 0Z\' fill=\'%2364add7\'%3E%3C/path%3E%3C/g%3E%3Cg transform=\'translate(0, 600)\'%3E%3Cpath d=\'M0 -270.4C37.2 -268.2 74.4 -265.9 103.5 -249.8C132.6 -233.8 153.7 -203.8 178.2 -178.2C202.7 -152.5 230.7 -131.2 246.7 -102.2C262.6 -73.2 266.5 -36.6 270.4 0L0 0Z\' fill=\'%2364add7\'%3E%3C/path%3E%3C/g%3E%3C/svg%3E")';
});

// Host-Controls anzeigen
socket.on('host', isHost => {
  if (isHost) document.getElementById('host-controls').style.display = 'block';
});

// Start-Button: Thema oder Fallback
document.getElementById('start-game-button').addEventListener('click', () => {
  const room = document.getElementById('room-input').value;
  const topic = document.getElementById('topic-input').value.trim();
  if (topic) socket.emit('setTopic', room, topic);
  socket.emit('startGame', room);
});

// Imposter-Status mit verbesserten Hintergründen
socket.on('imposterStatus', (isImposter) => {
  if (isImposter) {
    console.log('Imposter reached');
    document.body.classList.add('imposter');
    document.body.style.backgroundImage = 'url("data:image/svg+xml,%3Csvg id=\'visual\' viewBox=\'0 0 900 600\' width=\'900\' height=\'600\' xmlns=\'http://www.w3.org/2000/svg\' xmlns:xlink=\'http://www.w3.org/1999/xlink\' version=\'1.1\'%3E%3Crect x=\'0\' y=\'0\' width=\'900\' height=\'600\' fill=\'%23001220\'%3E%3C/rect%3E%3Cdefs%3E%3ClinearGradient id=\'grad1_0\' x1=\'33.3%25\' y1=\'0%25\' x2=\'100%25\' y2=\'100%25\'%3E%3Cstop offset=\'20%25\' stop-color=\'%23001220\' stop-opacity=\'1\'%3E%3C/stop%3E%3Cstop offset=\'80%25\' stop-color=\'%23001220\' stop-opacity=\'1\'%3E%3C/stop%3E%3C/linearGradient%3E%3C/defs%3E%3Cdefs%3E%3ClinearGradient id=\'grad2_0\' x1=\'0%25\' y1=\'0%25\' x2=\'66.7%25\' y2=\'100%25\'%3E%3Cstop offset=\'20%25\' stop-color=\'%23001220\' stop-opacity=\'1\'%3E%3C/stop%3E%3Cstop offset=\'80%25\' stop-color=\'%23001220\' stop-opacity=\'1\'%3E%3C/stop%3E%3C/linearGradient%3E%3C/defs%3E%3Cg transform=\'translate(900, 0)\'%3E%3Cpath d=\'M0 270.4C-38.9 270.4 -77.7 270.4 -103.5 249.8C-129.3 229.3 -142 188.2 -159.8 159.8C-177.6 131.4 -200.6 115.6 -219.9 91.1C-239.2 66.6 -254.8 33.3 -270.4 0L0 0Z\' fill=\'%23d01829\'%3E%3C/path%3E%3C/g%3E%3Cg transform=\'translate(0, 600)\'%3E%3Cpath d=\'M0 -270.4C37.2 -268.2 74.4 -265.9 103.5 -249.8C132.6 -233.8 153.7 -203.8 178.2 -178.2C202.7 -152.5 230.7 -131.2 246.7 -102.2C262.6 -73.2 266.5 -36.6 270.4 0L0 0Z\' fill=\'%23d01829\'%3E%3C/path%3E%3C/g%3E%3C/svg%3E")';
  } else {
    console.log('Not Imposter');
    document.body.classList.remove('imposter');
    document.body.style.backgroundImage = 'url("data:image/svg+xml,%3Csvg id=\'visual\' viewBox=\'0 0 900 600\' width=\'900\' height=\'600\' xmlns=\'http://www.w3.org/2000/svg\' xmlns:xlink=\'http://www.w3.org/1999/xlink\' version=\'1.1\'%3E%3Crect x=\'0\' y=\'0\' width=\'900\' height=\'600\' fill=\'%23001220\'%3E%3C/rect%3E%3Cdefs%3E%3ClinearGradient id=\'grad1_0\' x1=\'33.3%25\' y1=\'0%25\' x2=\'100%25\' y2=\'100%25\'%3E%3Cstop offset=\'20%25\' stop-color=\'%23001220\' stop-opacity=\'1\'%3E%3C/stop%3E%3Cstop offset=\'80%25\' stop-color=\'%23001220\' stop-opacity=\'1\'%3E%3C/stop%3E%3C/linearGradient%3E%3C/defs%3E%3Cdefs%3E%3ClinearGradient id=\'grad2_0\' x1=\'0%25\' y1=\'0%25\' x2=\'66.7%25\' y2=\'100%25\'%3E%3Cstop offset=\'20%25\' stop-color=\'%23001220\' stop-opacity=\'1\'%3E%3C/stop%3E%3Cstop offset=\'80%25\' stop-color=\'%23001220\' stop-opacity=\'1\'%3E%3C/stop%3E%3C/linearGradient%3E%3C/defs%3E%3Cg transform=\'translate(900, 0)\'%3E%3Cpath d=\'M0 270.4C-38.9 270.4 -77.7 270.4 -103.5 249.8C-129.3 229.3 -142 188.2 -159.8 159.8C-177.6 131.4 -200.6 115.6 -219.9 91.1C-239.2 66.6 -254.8 33.3 -270.4 0L0 0Z\' fill=\'%236bd764\'%3E%3C/path%3E%3C/g%3E%3Cg transform=\'translate(0, 600)\'%3E%3Cpath d=\'M0 -270.4C37.2 -268.2 74.4 -265.9 103.5 -249.8C132.6 -233.8 153.7 -203.8 178.2 -178.2C202.7 -152.5 230.7 -131.2 246.7 -102.2C262.6 -73.2 266.5 -36.6 270.4 0L0 0Z\' fill=\'%236bd764\'%3E%3C/path%3E%3C/g%3E%3C/svg%3E")';
  }
  document.body.style.opacity = 0;
  setTimeout(() => document.body.style.opacity = 1, 50);
});

// Nachrichten
socket.on('message', msg => {
  document.getElementById('result').innerHTML = `<p>${msg}</p>`;
});

// Spielstart UI-Update
socket.on('gameStarted', () => {
  ['#room-input','#join-button','#username'].forEach(sel => {
    document.querySelector(sel).style.display = 'none';
  });
  document.getElementById('result').style.fontSize = '2em';
  document.getElementById('start-game-button').innerText = 'Spiel neu starten';
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