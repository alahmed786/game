
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the 'dist' directory created by npm run build
app.use(express.static(path.join(__dirname, 'dist')));

// Handle Single Page Application (SPA) routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`
  🚀 Alien Overlord is live!
  --------------------------
  Local:   http://localhost:${PORT}
  
  To expose this to the internet on Termux, run:
  cloudflared tunnel --url http://localhost:${PORT}
  `);
});
