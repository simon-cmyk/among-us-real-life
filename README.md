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

### Deploy to GitHub Pages (frontend) + hosted backend

This project uses Socket.IO and requires a backend to coordinate state. GitHub Pages can host the static frontend, but you must run the Node.js backend elsewhere (Render, Fly.io, Railway, Heroku, your own server, etc.).

Steps:

1. **Deploy the backend to Render (free tier):**
   - Push your code to GitHub (includes `render.yaml`)
   - Go to [https://render.com](https://render.com) and sign in with GitHub
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Render will auto-detect `render.yaml` and configure everything
   - Click "Create Web Service"
   - Wait for deployment to finish (~2 minutes)
   - Copy your service URL: `https://among-us-backend-XXXX.onrender.com`

2. **Configure the frontend to point to the backend:**
   - Edit `src/public/config.js` and replace `YOUR-BACKEND-URL.onrender.com` with your actual Render URL:
     ```js
     window.BACKEND_URL = "https://among-us-backend-XXXX.onrender.com";
     ```
   - Commit and push this change

3. **Enable GitHub Pages:**
   - In your repository settings on GitHub → Pages:
     - Source: `Deploy from a branch`
     - Branch: `master` (or `main`), folder: `/ (root)`
   - After a minute, your site will be available at `https://simon-cmyk.github.io/among-us-real-life/`

4. **Visit the game:**
   - Player UI: `https://simon-cmyk.github.io/among-us-real-life/src/views/index.html`
   - Admin UI: `https://simon-cmyk.github.io/among-us-real-life/src/views/admin.html`

Notes:
- Static assets are served from `/src/public/...` 
- The root `index.html` redirects to `src/views/index.html`
- Render's free tier may sleep after 15 minutes of inactivity (first request takes ~30s to wake up)
- When running locally, the config auto-detects and uses `http://localhost:4046`## Known issues

-   Sometimes, duplicate tasks are assigned (temporary workaround is to start another game)
-   On some Android phones, hiding the browser will reset its state, therefore losing your tasks
