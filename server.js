/**
 * Coin Hunter Pro - Server
 * Author: Topshugar
 * Description: Serves the dashboard and exposes health endpoint for Render.
 */
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));

/** Health check endpoint for hosting and monitoring. */
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

/** Serves the main dashboard. */
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'hunter.html')));

app.listen(PORT, () => console.log('Coin Hunter Pro running on port ' + PORT));