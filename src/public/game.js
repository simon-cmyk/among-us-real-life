console.log('game.js loaded, BACKEND_URL is:', window.BACKEND_URL);
const socket = io(window.BACKEND_URL || window.location.origin, {
    query: {
        role: 'PLAYER'
    }
});
console.log('Socket.IO connecting to:', window.BACKEND_URL || window.location.origin);

// Connection diagnostics
socket.on('connect', () => {
    console.log('Socket connected', socket.id);
    const errorDiv = document.getElementById('connection-error');
    if (errorDiv) errorDiv.style.display = 'none';
});
socket.on('connect_error', (err) => {
    console.error('Connect error:', err);
    const errorDiv = document.getElementById('connection-error');
    if (errorDiv) errorDiv.style.display = 'block';
});
socket.on('error', (err) => {
    console.error('Socket error:', err);
});

const emergencyButton$ = document.querySelector('#emergency-button');
const enableSound$ = document.querySelector('#enable-sound');
const progressText$ = document.querySelector('#progress-text');
const reportButton$ = document.querySelector('#report-button');
const tasksList$ = document.querySelector('#tasks-list');

let soundEnabled = false;

if (reportButton$) {
    reportButton$.addEventListener('click', () => {
        socket.emit('report');
    });
}

if (emergencyButton$) {
    emergencyButton$.addEventListener('click', () => {
        socket.emit('emergency-meeting');
    });
}

if (enableSound$) {
    enableSound$.addEventListener('click', () => {
        console.log('Sound enabled');
        soundEnabled = true;
        enableSound$.textContent = 'Sound Enabled';
        enableSound$.disabled = true;
    });
}

socket.on('tasks', tasks => {
    console.log('Received tasks:', tasks);
    if (!tasksList$) return;
    
    // Remove existing tasks
    while (tasksList$.firstChild) {
        tasksList$.removeChild(tasksList$.firstChild);
    }

    for (const [taskId, task] of Object.entries(tasks)) {
        const taskItem$ = document.createElement('li');
        taskItem$.className = 'list-group-item';
        
        const label$ = document.createElement('label');
        label$.style.cursor = 'pointer';
        label$.style.display = 'flex';
        label$.style.alignItems = 'center';

        const checkbox$ = document.createElement('input');
        checkbox$.type = 'checkbox';
        checkbox$.style.marginRight = '10px';
        checkbox$.onchange = event => {
            console.log('Task checkbox changed:', taskId, event.target.checked);
            if (event.target.checked) {
                socket.emit('task-complete', taskId);
            } else {
                socket.emit('task-incomplete', taskId);
            }
        };

        label$.appendChild(checkbox$);
        label$.appendChild(document.createTextNode(task));

        taskItem$.appendChild(label$);
        tasksList$.appendChild(taskItem$);
    }
});

socket.on('role', role => {
    console.log('Received role:', role);
    hideRole();
    const role$ = document.createElement('div');
    role$.classList.add('role');
    role$.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border: 2px solid black; z-index: 10000; cursor: pointer;';
    role$.appendChild(
        document.createTextNode(`You are a(n) ${role}. Click to dismiss.`)
    );
    role$.onclick = () => hideRole();

    document.body.appendChild(role$);
});

function hideRole() {
    document
        .querySelectorAll('.role')
        .forEach(element => element.remove());
}

socket.on('progress', progress => {
    if (progressText$) {
        progressText$.textContent = `Progress is ${Math.round(progress * 100)}% complete`;
    }
});

/**
 * Sounds
 */

async function wait(milliseconds) {
    await new Promise(resolve => {
        setTimeout(() => resolve(), milliseconds);
    });
}

// Determine base path for assets
const BASE_PATH = window.location.hostname === 'simon-cmyk.github.io' 
	? '/among-us-real-life/src/public/' 
	: '/src/public/';

const SOUNDS = {
	meeting: new Audio(BASE_PATH + 'sounds/meeting.mp3'),
	sabotage: new Audio(BASE_PATH + 'sounds/sabotage.mp3'),
	start: new Audio(BASE_PATH + 'sounds/start.mp3'),
	sussyBoy: new Audio(BASE_PATH + 'sounds/sussy-boy.mp3'),
	taskComplete: new Audio(BASE_PATH + 'sounds/task-complete.mp3'),
	voteResult: new Audio(BASE_PATH + 'sounds/vote-result.mp3'),
	youLose: new Audio(BASE_PATH + 'sounds/you-lose.mp3'),
	youWin: new Audio(BASE_PATH + 'sounds/you-win.mp3')
};socket.on('play-meeting', async () => {
    console.log('Playing meeting sound, soundEnabled:', soundEnabled);
    if (!soundEnabled) {
        console.log('Sound is disabled - click "Enable Sound" button first');
        return;
    }
    try {
        await SOUNDS.meeting.play();
        await wait(2000);
        await SOUNDS.sussyBoy.play();
    } catch (err) {
        console.error('Error playing meeting sound:', err);
    }
});

socket.on('play-task-complete', async () => {
    console.log('Playing task complete sound, soundEnabled:', soundEnabled);
    if (!soundEnabled) {
        console.log('Sound is disabled - click "Enable Sound" button first');
        return;
    }
    try {
        await SOUNDS.taskComplete.play();
    } catch (err) {
        console.error('Error playing task complete sound:', err);
    }
});

socket.on('play-win', async () => {
    console.log('Playing win sound, soundEnabled:', soundEnabled);
    if (!soundEnabled) {
        console.log('Sound is disabled - click "Enable Sound" button first');
        return;
    }
    try {
        await SOUNDS.youWin.play();
    } catch (err) {
        console.error('Error playing win sound:', err);
    }
});

socket.on('play-start', async () => {
    console.log('Playing start sound, soundEnabled:', soundEnabled);
    if (!soundEnabled) {
        console.log('Sound is disabled - click "Enable Sound" button first');
        return;
    }
    try {
        await SOUNDS.start.play();
    } catch (err) {
        console.error('Error playing start sound:', err);
    }
});
