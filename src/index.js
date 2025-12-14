const PORT = process.env.PORT || 4046;

const express = require('express');
const http = require('http');
const _ = require('lodash');
const path = require('path');
const { Server } = require('socket.io');
const { v4: uuid } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: [
			'http://localhost:8080', 
			'http://127.0.0.1:8080',
			'https://simon-cmyk.github.io'
		],
		methods: ['GET', 'POST'],
		credentials: true
	}
});io.engine.on("connection_error", (err) => {
    console.log("Connection error:", err.req);
    console.log("Error code:", err.code);
    console.log("Error message:", err.message);
    console.log("Error context:", err.context);
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve HTML files from views directory
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

const TASK_LIST = [
'Rebuild the brick tower with 21 bricks (Under the stairs)',
'Rebuild the brick tower with 21 bricks (3rd floor)',
'Bring a christmas tree bauble to Silas bed (storage room attic)',
'Wash your hands (bathroom downstairs)',
	'Wash your hands for 30 seconds (bathroom attic)',
	'Wash your hands for 30 seconds (kitchen)',
	'Wash your hands for 30 seconds (laundry room)',
	'Throw six darts arrow (outside, to the left around the corner)',
	'Bring the fake four lights from the stairs (3rd floor shelf) to the window sill (Silas room)',
	'Free throw "throw the basketball in the basket" (living room)',
	'Play ping pong - First to 3 (Silas room)',
	'Play ping pong - First to 3 (Silas room)',
	'Play Badmington - Get 10 passes (Hall downstairs)',
	'Play Badmington - Get 10 passes (Hall downstairs)',
	'hit the basket with the table basket ball (living room)',
	'Throw one dice until you get three sixes (kitchen)',
	'Throw one dice until you get three sixes (laundry room)',
	'Fill the wall of "four in a row" (Hallway 3rd floor)',
	'Make a two level castle with a deck of cards (hallway downstairs)',
	'Flush the toilet (downstairs)',
	'Flush the toilet (attic, 3rd floor)',
	'Perform a bottle flip (Living room)',
	'Ring the doorbell and sing for the one who answers (front door)',
	'Make three level tower with cups (Hallway, 1st floor)',
	'Throw a rock down the driveway (driveway)',
	'Vacuum at the entrance (door next to entrance hall)',
	'Open/close window (bathroom attic)',
	'Exhange toiletpaper betweeen the bathrooms (bathroom attic/downstairs)',
	'Move the fire extinguisher from one side of the room to the other (hallway attic)',
	'Complain about the burned smell to 5 people (kitchen)',
	'Turn on/off the lights in the staircase (staircase)',
	'Sit and stand up 20 times (wherever)',
	'Sit and stand up 20 times (wherever)',
	'Sit and stand up 20 times (wherever)',
	'Turn the TV on and off (living room)',
	'Do 5 sit-ups (wherever)',
	'Do 5 sit-ups (wherever)',
	'Do 5 sit-ups (wherever)',
	'Do 5 Push-ups (wherever)',
	'Do 5 Push-ups (wherever)',
	'Do 5 Push-ups (wherever)',
	'Do 5 jumping jacks (wherever)',
	'Do 5 jumping jacks (wherever)',
	'Vacuum something with the little vacuum (kitchen)',
	'Open and close the fridge (Laundry room)',
	'Open and close the fridge (kitchen)',
	'Open and close the dishwasher (kitchen)',
	'Open and close the oven (kitchen)',
	'Open and close the dryer (laundry room)',
	'Open and close the washing machine (laundry room)',
	'Fold a blanket (living room)',
	'Sing a Christmas song at the (balcony)',
	'Walk up and down the stairs inside (staircase)',
	'Open all bins outside and close them again (driveway)',
	'Draw a Snowman on the post-it note (Living room table)',
	'Draw a Christmas tree on a post-it note (Living room table)',
	'Draw a Reindeer on a post-it note (Living room table)',
	'Draw an angel on a post-it note (Living room table)',
    ];

const game = {
    playerTasks: {}, // Maps socket.id to their task objects
    completedTasks: new Set(),
    roles: {},
    totalTaskCount: 0
};

function resetGame() {
    game.playerTasks = {};
    game.completedTasks = new Set();
    game.roles = {};
    game.totalTaskCount = 0;
}

function getProgress() {
    if (game.totalTaskCount === 0) return 0;
    return game.completedTasks.size / game.totalTaskCount;
}

io.on('connection', socket => {
	console.log(
		`A user connected with role: ${socket.handshake.query.role}, total: ${
			io.of('/').sockets.size
		}`
	);

	// Broadcast player count to all admins
	const playerCount = Array.from(io.sockets.sockets.values()).filter(
		s => s.handshake.query.role === 'PLAYER'
	).length;
	io.emit('player-count', playerCount);

	socket.on('get-player-count', () => {
		const playerCount = Array.from(io.sockets.sockets.values()).filter(
			s => s.handshake.query.role === 'PLAYER'
		).length;
		socket.emit('player-count', playerCount);
	});

	socket.on('get-progress', () => {
		const progress = getProgress();
		socket.emit('progress', progress);
	});

	socket.on('start-game', (options) => {
		console.log('Starting game...', 'options:', options, 'options.numImpostors:', options?.numImpostors);
		resetGame();

		// Get all player sockets
		const sockets = Array.from(io.sockets.sockets.values()).filter(
			s => s.handshake.query.role === 'PLAYER'
		);

		console.log(`Total players connected: ${sockets.length}`);

		// Get number of impostors from options, default to 1
		// Cap at sockets.length - 1 to ensure at least 1 crewmate
		let numImpostors = parseInt(options?.numImpostors) || 1;
		const maxImpostors = Math.max(1, sockets.length - 1);
		numImpostors = Math.min(numImpostors, maxImpostors);
		
		console.log(`Requested impostors: ${options?.numImpostors}, Max allowed: ${maxImpostors}, Assigning: ${numImpostors}`);

		// Assign roles - random impostors, rest are crewmates
		const impostors = _.sampleSize(sockets, numImpostors);
		const impostorIds = new Set(impostors.map(s => s.id));
		
		sockets.forEach(playerSocket => {
			const role = impostorIds.has(playerSocket.id) ? 'Impostor' : 'Crewmate';
			game.roles[playerSocket.id] = role;
			playerSocket.emit('role', role);
		});
		
		// Get number of tasks per crewmate from options, default to 5
		let tasksPerCrewmate = parseInt(options?.tasksPerCrewmate) || 5;
		// Cap at available task count
		const maxTasks = TASK_LIST.length;
		tasksPerCrewmate = Math.min(tasksPerCrewmate, maxTasks);
		
		console.log(`Assigning ${tasksPerCrewmate} tasks per crewmate`);
		
        // Assign random tasks to each CREWMATE (not impostor)
        sockets.forEach(playerSocket => {
            if (game.roles[playerSocket.id] === 'Impostor') {
                // Impostor gets NO tasks - send empty object
                playerSocket.emit('tasks', {});
                console.log('Impostor gets no tasks');
            } else {
                // Crewmate gets configured number of tasks
                const playerTaskList = _.sampleSize(TASK_LIST, tasksPerCrewmate);
                const playerTasksObj = {};
                
                playerTaskList.forEach(taskName => {
                    const taskId = uuid();
                    playerTasksObj[taskId] = taskName;
                    game.totalTaskCount++;
                });
                
                game.playerTasks[playerSocket.id] = playerTasksObj;
                playerSocket.emit('tasks', playerTasksObj);
            }
        });

        io.emit('progress', getProgress());
        io.emit('play-start');
        
        // Send task data to all admins
        io.emit('game-tasks', game.playerTasks);
        
        console.log('Game started with', sockets.length, 'players and', game.totalTaskCount, 'total tasks');
    });

    socket.on('task-complete', taskId => {
        console.log('Task completed:', taskId, 'by', socket.id);
        game.completedTasks.add(taskId);
        const progress = getProgress();
        console.log('Progress:', Math.round(progress * 100) + '%');
        
        io.emit('progress', progress);
        io.emit('play-task-complete');
        io.emit('task-completed', taskId);
        
        if (progress >= 1) {
            console.log('All tasks completed! Crewmates win!');
            io.emit('play-win');
            io.emit('action-notification', '🎉 All tasks completed! Crewmates win!');
        }
    });

    socket.on('task-incomplete', taskId => {
        console.log('Task unchecked:', taskId);
        game.completedTasks.delete(taskId);
        const progress = getProgress();
        console.log('Progress:', Math.round(progress * 100) + '%');
        
        io.emit('progress', progress);
        io.emit('task-incomplete', taskId);
    });

    socket.on('emergency-meeting', () => {
        console.log('Emergency meeting called');
        io.emit('play-meeting');
        io.emit('action-notification', '⚠️ Emergency meeting called!');
    });

    socket.on('report', () => {
        console.log('Body reported');
        io.emit('play-meeting');
        io.emit('action-notification', '🚨 Body reported!');
    });

    socket.on('disconnect', () => {
        const role = game.roles[socket.id];
        const roleInfo = role ? ` (${role})` : '';
        console.log('User disconnected' + roleInfo);
        // Broadcast updated player count
        const playerCount = Array.from(io.sockets.sockets.values()).filter(
            s => s.handshake.query.role === 'PLAYER'
        ).length;
        io.emit('player-count', playerCount);
    });
});

server.listen(PORT, () => {
    console.log(`Server listening on *:${PORT}`);
});
