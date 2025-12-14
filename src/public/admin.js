const socket = io(window.BACKEND_URL || undefined, {
	query: {
		role: 'ADMIN'
	}
});

// Connection diagnostics
console.log('Connecting to backend (admin):', window.BACKEND_URL || window.location.origin);
socket.on('connect', () => {
	console.log('Admin socket connected', socket.id);
});
socket.on('connect_error', (err) => {
	console.error('Admin connect_error', err);
});
socket.on('error', (err) => {
	console.error('Admin socket error', err);
});

const startGame$ = document.querySelector('#start-game-button');
const impostorCount$ = document.querySelector('#impostor-count');
const taskCount$ = document.querySelector('#task-count');
const activePlayers$ = document.querySelector('#active-players');
const tasksStatus$ = document.querySelector('#tasks-status');

startGame$.addEventListener('click', () => {
	const numImpostors = parseInt(impostorCount$.value) || 1;
	const tasksPerCrewmate = parseInt(taskCount$.value) || 5;
	console.log('Start game clicked - impostorCount$.value:', impostorCount$.value, 'numImpostors:', numImpostors, 'tasksPerCrewmate:', tasksPerCrewmate);
	socket.emit('start-game', { numImpostors, tasksPerCrewmate });
});

// Listen for player count updates
socket.on('player-count', (count) => {
	console.log('Active players:', count);
	activePlayers$.textContent = count;
});

// Listen for task data from backend
socket.on('game-tasks', (allPlayerTasks) => {
	const taskList = [];
	Object.values(allPlayerTasks).forEach(playerTasks => {
		Object.entries(playerTasks).forEach(([taskId, taskName]) => {
			taskList.push({ id: taskId, name: taskName });
		});
	});

	if (taskList.length === 0) {
		tasksStatus$.innerHTML = '<p class="text-muted text-center">No game running</p>';
		return;
	}

	const taskHtml = taskList.map(task => 
		`<div class="list-group-item" data-task-id="${task.id}">${task.name}</div>`
	).join('');
	tasksStatus$.innerHTML = `<div class="list-group">${taskHtml}</div>`;
});

// Listen for task completion updates
socket.on('task-completed', (taskId) => {
	const taskItem = document.querySelector(`[data-task-id="${taskId}"]`);
	if (taskItem) {
		taskItem.style.textDecoration = 'line-through';
		taskItem.style.opacity = '0.5';
		taskItem.style.backgroundColor = '#d4edda';
	}
});

socket.on('task-incomplete', (taskId) => {
	const taskItem = document.querySelector(`[data-task-id="${taskId}"]`);
	if (taskItem) {
		taskItem.style.textDecoration = 'none';
		taskItem.style.opacity = '1';
		taskItem.style.backgroundColor = 'transparent';
	}
});

// Request initial player count on connect
socket.on('connect', () => {
	socket.emit('get-player-count');
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
	voteResult: new Audio(BASE_PATH + 'sounds/vote-result.mp3'),
	youLose: new Audio(BASE_PATH + 'sounds/you-lose.mp3'),
	youWin: new Audio(BASE_PATH + 'sounds/you-win.mp3')
};

socket.on('play-meeting', async () => {
	await SOUNDS.meeting.play();
	await wait(2000);
	await SOUNDS.sussyBoy.play();
});

socket.on('play-win', async () => {
	await SOUNDS.youWin.play();
});

socket.on('progress', progress => {
	const progressText = document.querySelector('#progress-text');
	progressText.textContent = `Progress is ${Math.round(progress * 100)}% complete`;
});
