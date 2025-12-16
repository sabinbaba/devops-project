const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// ============ SERVE STATIC FILES ============

// Serve HTML files from public-section
app.use(express.static('public-section'));

// Serve CSS files from css directory
app.use('/css', express.static('css'));

// Serve other assets (if they exist)
app.use('/assets', express.static('assets'));
app.use('/js', express.static('js'));
app.use('/images', express.static('images'));

// ============ ROUTES FOR PAGES ============

// Home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public-section', 'index.html'));
});

// About page
app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'public-section', 'about.html'));
});

// Contact page
app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'public-section', 'contact.html'));
});

// Guide page
app.get('/guide', (req, res) => {
    res.sendFile(path.join(__dirname, 'public-section', 'guide.html'));
});

// Login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public-section', 'login.html'));
});

// Media page
app.get('/media', (req, res) => {
    res.sendFile(path.join(__dirname, 'public-section', 'media.html'));
});

// Social page
app.get('/social', (req, res) => {
    res.sendFile(path.join(__dirname, 'public-section', 'social.html'));
});

// System page
app.get('/system', (req, res) => {
    res.sendFile(path.join(__dirname, 'system', 'index.html'));
});

// ============ 404 HANDLER ============
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public-section', '404.html'));
});

// ============ START SERVER ============
app.listen(PORT, () => {
    console.log(`
    ╔══════════════════════════════════════╗
    ║     🚀 Express Server Running!      ║
    ║     http://localhost:${PORT}            ║
    ╚══════════════════════════════════════╝
    
    📁 Serving your directory structure:
    
    project/
    ├── server.js
    ├── package.json
    ├── public-section/
    │   ├── index.html      → http://localhost:${PORT}/
    │   ├── about.html      → http://localhost:${PORT}/about
    │   ├── contact.html    → http://localhost:${PORT}/contact
    │   ├── guide.html      → http://localhost:${PORT}/guide
    │   ├── login.html      → http://localhost:${PORT}/login
    │   ├── media.html      → http://localhost:${PORT}/media
    │   └── social.html     → http://localhost:${PORT}/social
    ├── css/
    │   ├── style.css       → http://localhost:${PORT}/css/style.css
    │   ├── siderbar.css    → http://localhost:${PORT}/css/siderbar.css
    │   └── responsive.css  → http://localhost:${PORT}/css/responsive.css
    └── system/
        └── index.html      → http://localhost:${PORT}/system
    
    ⚠️  IMPORTANT: In your HTML files, use:
    <link rel="stylesheet" href="/css/style.css">
    (with leading slash /)
    `);
});