const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.static(__dirname));
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'hunter.html'));
});

// Phase 1: Single source of truth for POW coins
// CoinGecko does not reliably return hashing_algorithm, so we do not depend on it.
const POW_COINS = {
  bitcoin: { algorithm: "SHA-256", difficulty: "HARD" },
  litecoin: { algorithm: "Scrypt", difficulty: "MEDIUM" },
  dogecoin: { algorithm: "Scrypt", difficulty: "EASY" },
  "bitcoin-cash": { algorithm: "SHA-256", difficulty: "MEDIUM" },
  monero: { algorithm: "RandomX", difficulty: "MEDIUM" },
  "ethereum-classic": { algorithm: "Etchash", difficulty: "MEDIUM" },
  kaspa: { algorithm: "kHeavyHash", difficulty: "EASY" },
  ravencoin: { algorithm: "KAWPOW", difficulty: "EASY" },
  zcash: { algorithm: "Equihash", difficulty: "MEDIUM" },
  dash: { algorithm: "X11", difficulty: "MEDIUM" }
};

let cache = { coins: [], updatedAt: "Not updated yet" };

async function updateHunter(){
  try{
    const res = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1");
    const coins = await res.json();
    if (!Array.isArray(coins)) throw new Error("CoinGecko did not return a list");

    let mineable = [];
    for (let c of coins) {
      if (!POW_COINS[c.id]) continue;
      const info = POW_COINS[c.id];
      mineable.push({
        name: c.name,
        symbol: c.symbol.toUpperCase(),
        price: c.current_price,
        algorithm: info.algorithm,
        difficulty: info.difficulty,
        type: "pow", // <-- Same spelling the frontend must check for
        poolLink: `https://miningpoolstats.stream/${c.symbol.toLowerCase()}`,
        poolStratum: `Check Pool on MiningPoolStats for ${c.symbol}`
      });
    }

    // Fallback: if API fails or returns 0, still show known POW coins
    if (mineable.length === 0) {
      mineable = Object.entries(POW_COINS).map(([id, info]) => ({
        name: id,
        symbol: id.toUpperCase(),
        price: 0,
        algorithm: info.algorithm,
        difficulty: info.difficulty,
        type: "pow",
        poolLink: `https://miningpoolstats.stream/${id}`,
        poolStratum: `Check Pool on MiningPoolStats for ${id}`
      }));
    }

    cache = { coins: mineable, updatedAt: new Date().toISOString() };
    console.log("Hunter updated:", mineable.length);
  } catch(e){
    console.log("Hunter error:", e.message);
    // Keep old cache, do not empty it
  }
}

setInterval(updateHunter, 60 * 60 * 1000);
updateHunter();

app.get("/api/hunter", (req, res) => res.json(cache));

app.listen(PORT, () => console.log("Hunter running on " + PORT));