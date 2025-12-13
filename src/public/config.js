// Set this to your backend URL (including protocol), e.g.:
// window.BACKEND_URL = "https://among-us-backend.onrender.com";
// For local development, use localhost. For GitHub Pages, set your deployed backend URL.

// Automatically detect environment
if (window.location.hostname === 'simon-cmyk.github.io') {
  // Production: GitHub Pages - SET YOUR DEPLOYED BACKEND URL HERE
  window.BACKEND_URL = "https://YOUR-BACKEND-URL.onrender.com";
} else {
  // Local development
  window.BACKEND_URL = "http://localhost:4046";
}

console.log("Config loaded - Backend URL:", window.BACKEND_URL);
// Force reload marker
window.CONFIG_VERSION = "v3";
