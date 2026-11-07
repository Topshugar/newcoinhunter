const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve everything inside /public
app.use(express.static(path.join(__dirname, 'public')));

// If user goes to any page, show index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log('Coin Hunter Pro running on http://localhost:' + PORT);
});