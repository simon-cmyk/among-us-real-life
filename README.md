# Among Us in real life

I hacked together this small little web app for facilitating a game of Among Us in real life.

## Features

-   Assign impostors/crewmates
-   Assign tasks
-   Checking off tasks updates a global progress bar in real-time

Audio recordings from [https://www.voicy.network/pages/among-us](https://www.voicy.network/pages/among-us)

## Screenshot

<img src="media/IMG_0976.PNG" width="50%" />

## Usage

This was built for personal use, but anyone is welcome to use this for hosting their own game.

### 1. Configure the game

You may want to modify the following properties located in [`src/index.js`](https://github.com/michaelgira23/among-us-real-life/blob/master/src/index.js):

[`TASKS`](https://github.com/michaelgira23/among-us-real-life/blob/master/src/index.js#L14) - An array of strings that consist of all possible tasks. These will be randomly assigned to players.

[`N_TASKS`](https://github.com/michaelgira23/among-us-real-life/blob/master/src/index.js#L31) - Number of tasks to assign each player

[`N_IMPOSTORS`](https://github.com/michaelgira23/among-us-real-life/blob/master/src/index.js#L32) - Number of impostors to assign each round

### 2. Start the backend

Start the backend with

```
$ npm install
$ npm start
```

:information_source: Use a utility like [Nodemon](https://nodemon.io/) to automatically restart the backend upon any changes. This is useful when modifying the number of impostors or tasks.

### 3. Connect to the admin dashboard

Visit [http://localhost:4046/admin](http://localhost:4046/admin) to access the admin panel. There is a single button to start the game.

Pressing the start button will reset task progress, assign new tasks, and assign impostors. Press it once all players connect, otherwise you will have to press it again.

### 4. Invite friends to join

Players may access the the game at [http://localhost:4046](http://localhost:4046). On other computers (or phones), you will need to enter the computer's local IP or use a tunneling service like [ngrok](https://ngrok.com). Alternatively, you could deploy this yourself.

### Deploy to GitHub Pages (frontend) + Railway (backend)

This project uses Socket.IO and requires a backend to coordinate state. GitHub Pages hosts the static frontend, Railway hosts the Node.js backend (free tier).

**Quick Start:**

1. **Deploy Backend to Railway:**
   - Go to [https://railway.app](https://railway.app)
   - Click "Start a New Project" → "Deploy from GitHub repo"
   - Sign in with GitHub and authorize Railway
   - Select your `among-us-real-life` repository
   - Railway will auto-detect Node.js and deploy
   - Click on your deployment → Settings → Generate Domain
   - Copy your domain (e.g., `among-us-backend-production-xxxx.up.railway.app`)

2. **Update Frontend Config:**
   - Edit `src/public/config.js` line 8
   - Replace `YOUR-BACKEND-URL.onrender.com` with your Railway URL:
     ```js
     window.BACKEND_URL = "https://among-us-backend-production-xxxx.up.railway.app";
     ```
   - Commit and push:
     ```bash
     git add src/public/config.js
     git commit -m "Add Railway backend URL"
     git push
     ```

3. **Enable GitHub Pages:**
   - Go to your repo on GitHub → Settings → Pages
   - Source: "Deploy from a branch"
   - Branch: `master`, Folder: `/ (root)`
   - Save and wait ~1 minute

4. **Play the Game:**
   - Player UI: `https://simon-cmyk.github.io/among-us-real-life/src/views/index.html`
   - Admin UI: `https://simon-cmyk.github.io/among-us-real-life/src/views/admin.html`
   - Share the player link with friends!

**Local Development:**
```bash
# Terminal 1: Start backend
npm start

# Terminal 2: Serve frontend
python3 -m http.server 8080

# Visit: http://localhost:8080/src/views/index.html
```

The config auto-detects localhost vs production!## Known issues

-   Sometimes, duplicate tasks are assigned (temporary workaround is to start another game)
-   On some Android phones, hiding the browser will reset its state, therefore losing your tasks
