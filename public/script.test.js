// Add a checkbox to the host-controls section in the client UI
document.getElementById('start-game-button').addEventListener('click', () => {
    const room = document.getElementById('room-input').value;
    const topic = document.getElementById('topic-input').value.trim();
    const hostExcludeCheckbox = document.getElementById('host-exclude-checkbox');
    const excludeHost = hostExcludeCheckbox ? hostExcludeCheckbox.checked : false;
    
    if (topic) socket.emit('setTopic', room, topic);
    socket.emit('startGame', room, excludeHost);
});

// Add a host option to exclude themselves from being an imposter
socket.on('host', isHost => {
    if (isHost) {
        document.getElementById('host-controls').style.display = 'block';
        
        // Add checkbox for host exclusion if it doesn't exist yet
        if (!document.getElementById('host-exclude-checkbox')) {
            const hostControls = document.getElementById('host-controls');
            const exclusionOption = document.createElement('div');
            exclusionOption.className = 'host-option';
            exclusionOption.style.marginTop = '10px';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = 'host-exclude-checkbox';
            checkbox.checked = true; // Default: host excluded
            
            const label = document.createElement('label');
            label.htmlFor = 'host-exclude-checkbox';
            label.textContent = 'Als Game Master nicht mitspielen';
            
            exclusionOption.appendChild(checkbox);
            exclusionOption.appendChild(label);
            hostControls.appendChild(exclusionOption);
        }
    }
});