/**
 * Coin Hunter Pro - Server (Render Ready)
 * Project: newcoinhunter
 * Entry File: hunter.html
 */

const express = require('express');
const path = require('path');

const app = express();
// Render gives you a PORT, you MUST use it. Do not hardcode 3000.
const PORT = process.env.PORT || 3000;
const HTML_FILE = 'hunter.html';

app.use(express.json());

// Health Check - Test this first on Render
app.get('/health', (req, res) => {
  res.json({ status: 'ok', app: 'Coin Hunter Pro', file: HTML_FILE });
});

// API Proxy: DexScreener profiles
app.get('/api/tokens', async (req, res) => {
  try {
    const r = await fetch('https://api.dexscreener.com/token-profiles/latest/v1', {
      headers: { 'User-Agent': 'CoinHunterPro/1.0' }
    });
    if (!r.ok) throw new Error('DexScreener status ' + r.status);
    res.json(await r.json());
  } catch (e) {
    console.error('API /tokens error:', e.message);
    res.status(500).json({ error: 'Failed to fetch DexScreener profiles', detail: e.message });
  }
});

// API Proxy: DexScreener pairs
app.get('/api/pairs/:address', async (req, res) => {
  try {
    const r = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${req.params.address}`, {
      headers: { 'User-Agent': 'CoinHunterPro/1.0' }
    });
    if (!r.ok) throw new Error('DexScreener status ' + r.status);
    res.json(await r.json());
  } catch (e) {
    console.error('API /pairs error:', e.message);
    res.status(500).json({ error: 'Failed to fetch pairs' });
  }
});

// API Proxy: GeckoTerminal chart
app.get('/api/chart/:network/:pool', async (req, res) => {
  try {
    const { network, pool } = req.params;
    const r = await fetch(`https://api.geckoterminal.com/api/v2/networks/${network}/pools/${pool}/ohlcv/hour?aggregate=1&limit=24`, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'CoinHunterPro/1.0' }
    });
    if (!r.ok) throw new Error('Gecko status ' + r.status);
    res.json(await r.json());
  } catch (e) {
    console.error('API /chart error:', e.message);
    res.status(500).json({ error: 'Failed to fetch chart' });
  }
});

// Main Route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, HTML_FILE));
});

// Fallback - Render / Express 5 safe version (do NOT use app.get('*'))
app.use((req, res) => {
  res.sendFile(path.join(__dirname, HTML_FILE));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Coin Hunter Pro running on port ${PORT}`);
});