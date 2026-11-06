const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000;

// Serve hunter.html as homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'hunter.html'));
});

// HUNTER PRO V2 CACHE
let cache = { coins: [], updatedAt: "Not updated yet" };

async function updateHunter(){
  try{
    const res = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=id_asc&per_page=50&page=1");
    const coins = await res.json();
    let mineable = [];
    for(let c of coins.slice(0,30)){
      let d = await fetch(`https://api.coingecko.com/api/v3/coins/${c.id}`).then(r=>r.json()).catch(()=>null);
      let algo = d?.hashing_algorithm;
      if(!algo || algo === "") continue;
      mineable.push({
        name: c.name,
        symbol: c.symbol.toUpperCase(),
        price: c.current_price,
        algorithm: algo,
        difficulty: "EASY",
        poolLink: `https://miningpoolstats.stream/${c.symbol.toLowerCase()}`,
        poolStratum: `Check Pool on MiningPoolStats for ${c.symbol}`
      });
    }
    cache = { coins: mineable, updatedAt: new Date().toISOString() };
    console.log("Hunter updated:", mineable.length);
  }catch(e){ console.log("Hunter error:", e.message); }
}
setInterval(updateHunter, 60*60*1000);
updateHunter();

app.get("/api/hunter", (req,res)=> res.json(cache));

app.listen(PORT, ()=> console.log("Hunter running on " + PORT));
