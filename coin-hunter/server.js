// ============================================================
//  COIN HUNTER PRO - SERVER
//  Job: Serve the website from /public folder
//  Run: node server.js
// ============================================================
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
//  SERVE STATIC FILES
//  Everything inside /public is public to browser
// ============================================================
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================
//  FALLBACK ROUTE
//  Any URL -> show index.html
// ============================================================
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================================
//  START SERVER
// ============================================================
app.listen(PORT, () => {
  console.log('Coin Hunter Pro running on http://localhost:' + PORT);
});