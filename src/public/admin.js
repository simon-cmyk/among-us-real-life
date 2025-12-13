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

startGame$.addEventListener('click', () => {
	socket.emit('start-game');
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
