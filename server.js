/**
  * Coin Hunter Pro - Server
  * Project: newcoinhunter
  * Entry File: hunter.html (in main root)
  * Overview: Serves hunter.html and proxies market data APIs
  * to avoid CORS issues and improve reliability.
 */

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Config: Main HTML file in the root of newcoinhunter repo.
const HTML_FILE = 'hunter.html';

// Middleware: Log requests for easy debugging.
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health Check: Confirm server is running.
app.get('/health', (req, res) => {
  res.json({ status: 'ok', app: 'Coin Hunter Pro', repo: 'newcoinhunter', file: HTML_FILE });
});

// API Proxy: DexScreener token profiles - latest tokens.
app.get('/api/tokens', async (req, res) => {
  try {
    const r = await fetch('https://api.dexscreener.com/token-profiles/latest/v1');
    res.json(await r.json());
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch DexScreener profiles' });
  }
});

// API Proxy: DexScreener token pairs - real price, liquidity, volume and creation time.
app.get('/api/pairs/:address', async (req, res) => {
  try {
    const r = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${req.params.address}`);
    res.json(await r.json());
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch token pairs' });
  }
});

// API Proxy: GeckoTerminal OHLCV - real 24h chart data.
app.get('/api/chart/:network/:pool', async (req, res) => {
  try {
    const { network, pool } = req.params;
    const r = await fetch(`https://api.geckoterminal.com/api/v2/networks/${network}/pools/${pool}/ohlcv/hour?aggregate=1&limit=24`, {
      headers: { 'Accept': 'application/json' }
    });
    res.json(await r.json());
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch chart data' });
  }
});

// Main Route: Serve hunter.html from repo root.
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, HTML_FILE));
});

// Fallback: Serve hunter.html for any other route.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, HTML_FILE));
});

// Startup: Start server on configured port.
app.listen(PORT, () => {
  console.log(`Coin Hunter Pro running on http://localhost:${PORT}`);
  console.log(`Serving file: ${HTML_FILE}`);
});