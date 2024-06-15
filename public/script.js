const socket = io();


const joinButton = document.getElementById('join-button');
const usernameInput = document.getElementById('username');

joinButton.addEventListener('click', () => {
    const username = usernameInput.value;
    socket.emit('setUsername', username);

});

document.getElementById('join-button').addEventListener('click', () => {
    const room = document.getElementById('room-input').value;
    socket.emit('joinRoom', room);
});

socket.on('host', (isHost) => {
    if (isHost) {
        document.getElementById('host-controls').style.display = 'block';
    }
});

document.getElementById('start-game-button').addEventListener('click', () => {
    const room = document.getElementById('room-input').value;
    socket.emit('startGame', room);
});


socket.on('imposterStatus', (isImposter) => {
  
    if (isImposter) {
        document.body.style.backgroundImage = 'url("data:image/svg+xml,%3Csvg id=\'visual\' viewBox=\'0 0 900 600\' width=\'900\' height=\'600\' xmlns=\'http://www.w3.org/2000/svg\' xmlns:xlink=\'http://www.w3.org/1999/xlink\' version=\'1.1\'%3E%3Crect x=\'0\' y=\'0\' width=\'900\' height=\'600\' fill=\'%23001220\'%3E%3C/rect%3E%3Cdefs%3E%3ClinearGradient id=\'grad1_0\' x1=\'33.3%25\' y1=\'0%25\' x2=\'100%25\' y2=\'100%25\'%3E%3Cstop offset=\'20%25\' stop-color=\'%23001220\' stop-opacity=\'1\'%3E%3C/stop%3E%3Cstop offset=\'80%25\' stop-color=\'%23001220\' stop-opacity=\'1\'%3E%3C/stop%3E%3C/linearGradient%3E%3C/defs%3E%3Cdefs%3E%3ClinearGradient id=\'grad2_0\' x1=\'0%25\' y1=\'0%25\' x2=\'66.7%25\' y2=\'100%25\'%3E%3Cstop offset=\'20%25\' stop-color=\'%23001220\' stop-opacity=\'1\'%3E%3C/stop%3E%3Cstop offset=\'80%25\' stop-color=\'%23001220\' stop-opacity=\'1\'%3E%3C/stop%3E%3C/linearGradient%3E%3C/defs%3E%3Cg transform=\'translate(900, 0)\'%3E%3Cpath d=\'M0 270.4C-38.9 270.4 -77.7 270.4 -103.5 249.8C-129.3 229.3 -142 188.2 -159.8 159.8C-177.6 131.4 -200.6 115.6 -219.9 91.1C-239.2 66.6 -254.8 33.3 -270.4 0L0 0Z\' fill=\'%23d01829\'%3E%3C/path%3E%3C/g%3E%3Cg transform=\'translate(0, 600)\'%3E%3Cpath d=\'M0 -270.4C37.2 -268.2 74.4 -265.9 103.5 -249.8C132.6 -233.8 153.7 -203.8 178.2 -178.2C202.7 -152.5 230.7 -131.2 246.7 -102.2C262.6 -73.2 266.5 -36.6 270.4 0L0 0Z\' fill=\'%23d01829\'%3E%3C/path%3E%3C/g%3E%3C/svg%3E")';
        document.body.style.opacity = 0;
        setTimeout(() => {
            document.body.style.opacity = 1;
        }, 500);
    } else {
        document.body.style.backgroundImage = 'url("data:image/svg+xml,%3Csvg id=\'visual\' viewBox=\'0 0 900 600\' width=\'900\' height=\'600\' xmlns=\'http://www.w3.org/2000/svg\' xmlns:xlink=\'http://www.w3.org/1999/xlink\' version=\'1.1\'%3E%3Crect x=\'0\' y=\'0\' width=\'900\' height=\'600\' fill=\'%23001220\'%3E%3C/rect%3E%3Cdefs%3E%3ClinearGradient id=\'grad1_0\' x1=\'33.3%25\' y1=\'0%25\' x2=\'100%25\' y2=\'100%25\'%3E%3Cstop offset=\'20%25\' stop-color=\'%23001220\' stop-opacity=\'1\'%3E%3C/stop%3E%3Cstop offset=\'80%25\' stop-color=\'%23001220\' stop-opacity=\'1\'%3E%3C/stop%3E%3C/linearGradient%3E%3ClinearGradient id=\'grad2_0\' x1=\'0%25\' y1=\'0%25\' x2=\'66.7%25\' y2=\'100%25\'%3E%3Cstop offset=\'20%25\' stop-color=\'%23001220\' stop-opacity=\'1\'%3E%3C/stop%3E%3Cstop offset=\'80%25\' stop-color=\'%23001220\' stop-opacity=\'1\'%3E%3C/stop%3E%3C/linearGradient%3E%3C/defs%3E%3Cg transform=\'translate(900, 0)\'%3E%3Cpath d=\'M0 270.4C-38.9 270.4 -77.7 270.4 -103.5 249.8C-129.3 229.3 -142 188.2 -159.8 159.8C-177.6 131.4 -200.6 115.6 -219.9 91.1C-239.2 66.6 -254.8 33.3 -270.4 0L0 0Z\' fill=\'%236bd764\'%3E%3C/path%3E%3C/g%3E%3Cg transform=\'translate(0, 600)\'%3E%3Cpath d=\'M0 -270.4C37.2 -268.2 74.4 -265.9 103.5 -249.8C132.6 -233.8 153.7 -203.8 178.2 -178.2C202.7 -152.5 230.7 -131.2 246.7 -102.2C262.6 -73.2 266.5 -36.6 270.4 0L0 0Z\' fill=\'%236bd764\'%3E%3C/path%3E%3C/g%3E%3C/svg%3E")';
        document.body.style.opacity = 0;
        setTimeout(() => {
            document.body.style.opacity = 1;
        }, 500);
    }
});

socket.on('message', (message) => {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `<p>${message}</p>`;
});


    document.getElementById('join-button').addEventListener('click', () => {
        document.querySelector('h2').style.display = 'none';
        document.querySelector('h4').style.display = 'none';
  document.getElementById('room-input').style.display = 'none';
    document.getElementById('join-button').style.display = 'none';
    document.getElementById('username').style.display = 'none';

    document.body.style.backgroundImage = 'url(data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" width="900" height="600"%3E%3Crect x="0" y="0" width="900" height="600" fill="%23001220"%3E%3C/rect%3E%3Cdefs%3E%3ClinearGradient id="grad1_0" x1="33.3%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="20%25" stop-color="%23001220" stop-opacity="1"%3E%3C/stop%3E%3Cstop offset="80%25" stop-color="%23001220" stop-opacity="1"%3E%3C/stop%3E%3C/linearGradient%3E%3C/defs%3E%3Cdefs%3E%3ClinearGradient id="grad2_0" x1="0%25" y1="0%25" x2="66.7%25" y2="100%25"%3E%3Cstop offset="20%25" stop-color="%23001220" stop-opacity="1"%3E%3C/stop%3E%3Cstop offset="80%25" stop-color="%23001220" stop-opacity="1"%3E%3C/stop%3E%3C/linearGradient%3E%3C/defs%3E%3Cg transform="translate(900, 0)"%3E%3Cpath d="M0 270.4C-38.9 270.4 -77.7 270.4 -103.5 249.8C-129.3 229.3 -142 188.2 -159.8 159.8C-177.6 131.4 -200.6 115.6 -219.9 91.1C-239.2 66.6 -254.8 33.3 -270.4 0L0 0Z" fill="%2364add7"%3E%3C/path%3E%3C/g%3E%3Cg transform="translate(0, 600)"%3E%3Cpath d="M0 -270.4C37.2 -268.2 74.4 -265.9 103.5 -249.8C132.6 -233.8 153.7 -203.8 178.2 -178.2C202.7 -152.5 230.7 -131.2 246.7 -102.2C262.6 -73.2 266.5 -36.6 270.4 0L0 0Z" fill="%2364add7"%3E%3C/path%3E%3C/g%3E%3C/svg%3E)';


    });



// Wenn 'gameStarted' empfangen wird, ändern Sie das Styling
socket.on('gameStarted', () => {
  // Verstecke den Willkommens-Text, das Eingabefeld und den "Raum beitreten"-Button
  document.querySelector('h1').style.display = 'none';
  document.getElementById('room-input').style.display = 'none';
  document.getElementById('join-button').style.display = 'none';
  document.getElementById('setUsername').style.display = 'none';
    document.getElementById('username').style.display = 'none';
  // Ändere die Schriftgröße des Resultats
  document.getElementById('result').style.fontSize = '2em'; // 2em ist nur ein Beispiel, passen Sie die Größe an Ihre Bedürfnisse an

  // Ändere den Text des "Spiel starten"-Buttons
  document.getElementById('start-game-button').innerText = 'Spiel neu starten';
   
});

// In Ihrer script.js-Datei auf dem Client



