console.log('game.js loaded, BACKEND_URL is:', window.BACKEND_URL);

// DOM elements
const emergencyButton$ = document.querySelector('#emergency-button');
const enableSound$ = document.querySelector('#enable-sound');
const progressText$ = document.querySelector('#progress-text');
const reportButton$ = document.querySelector('#report-button');
const tasksList$ = document.querySelector('#tasks-list');

let soundEnabled = false;
let currentTasks = {}; // Store tasks in memory
let completedTaskIds = new Set(); // Store completed task IDs
let currentRole = null; // Track current role

// Load tasks from localStorage if they exist
function loadSavedTasks() {
    const saved = localStorage.getItem('gameTasks');
    const savedRole = localStorage.getItem('gameRole');
    
    if (saved && savedRole === 'Crewmate') {
        // Only load if we were a crewmate in the last game
        try {
            currentTasks = JSON.parse(saved);
            console.log('Loaded crewmate tasks from localStorage:', currentTasks);
        } catch (e) {
            console.error('Error loading tasks from localStorage:', e);
        }
    } else if (saved) {
        console.log('Ignoring old tasks - previous role was:', savedRole);
        localStorage.removeItem('gameTasks');
        localStorage.removeItem('completedTasks');
    }
    
    const savedCompleted = localStorage.getItem('completedTasks');
    if (savedCompleted && savedRole === 'Crewmate') {
        try {
            completedTaskIds = new Set(JSON.parse(savedCompleted));
            console.log('Loaded completed tasks from localStorage:', Array.from(completedTaskIds));
        } catch (e) {
            console.error('Error loading completed tasks from localStorage:', e);
        }
    }
}

// Save tasks to localStorage
function saveTasks() {
    localStorage.setItem('gameTasks', JSON.stringify(currentTasks));
}

// Save completed tasks to localStorage
function saveCompletedTasks() {
    localStorage.setItem('completedTasks', JSON.stringify(Array.from(completedTaskIds)));
}

// Render tasks on the page
function renderTasks() {
    if (!tasksList$) return;
    
    // Remove existing tasks
    while (tasksList$.firstChild) {
        tasksList$.removeChild(tasksList$.firstChild);
    }

    for (const [taskId, task] of Object.entries(currentTasks)) {
        const taskItem$ = document.createElement('li');
        taskItem$.className = 'list-group-item';
        if (completedTaskIds.has(taskId)) {
            taskItem$.classList.add('active');
        }
        
        const label$ = document.createElement('label');
        label$.style.cursor = 'pointer';
        label$.style.display = 'flex';
        label$.style.alignItems = 'center';

        const checkbox$ = document.createElement('input');
        checkbox$.type = 'checkbox';
        checkbox$.style.marginRight = '10px';
        checkbox$.checked = completedTaskIds.has(taskId);
        checkbox$.dataset.taskId = taskId;
        checkbox$.onchange = event => {
            console.log('Task checkbox changed:', taskId, event.target.checked);
            if (event.target.checked) {
                completedTaskIds.add(taskId);
                taskItem$.classList.add('active');
                saveCompletedTasks();
                socket.emit('task-complete', taskId);
            } else {
                completedTaskIds.delete(taskId);
                taskItem$.classList.remove('active');
                saveCompletedTasks();
                socket.emit('task-incomplete', taskId);
            }
        };

        label$.appendChild(checkbox$);
        label$.appendChild(document.createTextNode(task));

        taskItem$.appendChild(label$);
        tasksList$.appendChild(taskItem$);
    }
}

const socket = io(window.BACKEND_URL || window.location.origin, {
    query: {
        role: 'PLAYER'
    }
});
console.log('Socket.IO connecting to:', window.BACKEND_URL || window.location.origin);

// Load saved tasks after socket is created
loadSavedTasks();

// Connection diagnostics
socket.on('connect', () => {
    console.log('Socket connected', socket.id);
    const errorDiv = document.getElementById('connection-error');
    if (errorDiv) errorDiv.style.display = 'none';
    // Render saved tasks on connect if they exist
    // They will be cleared if we receive a role change (new game)
    if (Object.keys(currentTasks).length > 0) {
        renderTasks();
    }
    // Request current progress from backend
    socket.emit('get-progress');
});
socket.on('connect_error', (err) => {
    console.error('Connect error:', err);
    const errorDiv = document.getElementById('connection-error');
    if (errorDiv) errorDiv.style.display = 'block';
});
socket.on('error', (err) => {
    console.error('Socket error:', err);
});

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
    currentTasks = tasks;
    completedTaskIds.clear(); // Clear completed tasks when new game starts
    saveTasks(); // Save new tasks to localStorage
    // Clear any saved completed tasks from previous game
    localStorage.removeItem('completedTasks');
    console.log('Current tasks after update:', Object.keys(currentTasks).length, 'tasks');
    renderTasks();
});

socket.on('role', role => {
    console.log('Received role:', role);
    currentRole = role;
    localStorage.setItem('gameRole', role);
    
    // If we're an impostor, clear any old task data
    if (role === 'Impostor') {
        currentTasks = {};
        completedTaskIds.clear();
        localStorage.removeItem('gameTasks');
        localStorage.removeItem('completedTasks');
        renderTasks(); // This will show empty task list for impostor
    }
    // If we're a crewmate, keep the loaded tasks - they'll be updated when we receive the tasks event
    
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

// Listen for task completion from other players
socket.on('task-completed', (taskId) => {
    if (!completedTaskIds.has(taskId)) {
        completedTaskIds.add(taskId);
        saveCompletedTasks();
        const checkbox = document.querySelector(`input[data-task-id="${taskId}"]`);
        if (checkbox) {
            checkbox.checked = true;
            checkbox.closest('.list-group-item').classList.add('active');
        }
    }
});

socket.on('task-incomplete', (taskId) => {
    if (completedTaskIds.has(taskId)) {
        completedTaskIds.delete(taskId);
        saveCompletedTasks();
        const checkbox = document.querySelector(`input[data-task-id="${taskId}"]`);
        if (checkbox) {
            checkbox.checked = false;
            checkbox.closest('.list-group-item').classList.remove('active');
        }
    }
});

socket.on('progress', progress => {
    if (progressText$) {
        progressText$.textContent = `🎅 Progress: ${Math.round(progress * 100)}% complete`;
    }
    // Update progress bar
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        progressBar.style.width = `${Math.round(progress * 100)}%`;
        progressBar.textContent = `${Math.round(progress * 100)}%`;
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
