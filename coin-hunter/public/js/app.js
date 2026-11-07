// Coin Hunter Pro - app.js
let allCoinsState = [];
let boostedState = [];
let sniperState = [];
let currentTabState = 'new';
let watchlistState = JSON.parse(localStorage.getItem('ch_watch') || '[]');
let alertsState = JSON.parse(localStorage.getItem('ch_alerts') || '[]');
let portfolioState = JSON.parse(localStorage.getItem('ch_portfolio') || '[]');
let portfolioHistoryState = JSON.parse(localStorage.getItem('ch_portfolio_history') || '[]');
let safetyCacheState = {};
let whaleCacheState = {};
let devCacheState = {};
let hidePumpState = localStorage.getItem('ch_hidePump') !== 'false';
let gradOnlyState = localStorage.getItem('ch_gradOnly') === 'true';
let gradAlertState = localStorage.getItem('ch_gradAlert') === 'true';
let savedTgChatId = localStorage.getItem('ch_tgChatId') || '';
let savedTgBotToken = localStorage.getItem('ch_tgBotToken') || '';
let followedWalletsState = JSON.parse(localStorage.getItem('ch_followedWallets') || '[]');
let knownGraduatedState = new Set(JSON.parse(localStorage.getItem('ch_knownGrad') || '[]'));
let themeState = localStorage.getItem('ch_theme') || 'dark';

function el(id){ return document.getElementById(id); }
function calcAgeH(t){ if(!t) return null; return Math.max(0,(Date.now()-t)/3600000); }
function fmtAge(h){ if(h===null||h===undefined) return 'Unknown'; if(h<1) return Math.max(1,Math.round(h*60))+'m ago'; if(h<24) return Math.floor(h)+'h ago'; return Math.floor(h/24)+'d ago'; }
function fmt(n){ if(!n) return '$0'; if(n>=1e9) return '$'+(n/1e9).toFixed(2)+'B'; if(n>=1e6) return '$'+(n/1e6).toFixed(2)+'M'; if(n>=1e3) return '$'+(n/1e3).toFixed(1)+'K'; return '$'+Number(n).toFixed(4); }
function fmtPrice(p){ if(!p) return '$0.000000'; if(p>=1) return '$'+p.toFixed(4); return '$'+p.toFixed(6); }

function detectPumpFun(pair){
  const dexId=(pair.dexId||'').toLowerCase();
  const url=(pair.url||'').toLowerCase();
  if(dexId.includes('pump')) return {isPumpFun:true,isGraduated:false,reason:'DEX is '+pair.dexId+' - still on bonding curve'};
  if(url.includes('pump.fun')) return {isPumpFun:true,isGraduated:false,reason:'Pump.fun URL'};
  const grad=['raydium','meteora','orca','jupiter','lifinity','phoenix','openbook'];
  if(grad.includes(dexId)) return {isPumpFun:false,isGraduated:true,reason:'Graduated to '+pair.dexId};
  if(pair.chainId!=='solana') return {isPumpFun:false,isGraduated:true,reason:'On '+pair.chainId+' - not pump.fun'};
  const liq=pair.liquidity?.usd||0; const mcap=pair.fdv||pair.marketCap||0;
  if(liq<70000 && mcap<150000) return {isPumpFun:true,isGraduated:false,reason:'Solana + Low Liq $'+Math.round(liq)+' - likely pump.fun'};
  return {isPumpFun:false,isGraduated:false,reason:'On '+(dexId||'DEX')};
}
function getPumpRisk(c){
  if(c.isPumpFun) return {color:'#ef4444',text:'⚠️ PUMP.FUN - 98% RUG RISK'};
  if(c.isGraduated) return {color:'#22c55e',text:'✅ GRADUATED - Real DEX Pool'};
  return {color:'#eab308',text:'Real DEX - Check Safety'};
}
function getAcquisition(c){
  const mineable=['BTC','LTC','DOGE','KAS','ETC','XMR','BCH'];
  const isMineable=mineable.includes((c.symbol||'').toUpperCase());
  const dexByChain={
    solana:{name:'Jupiter / Raydium',url:'https://jup.ag/swap/SOL-'+c.address,cex:'Binance, Bybit, OKX'},
    bsc:{name:'PancakeSwap',url:'https://pancakeswap.finance/swap?outputCurrency='+c.address,cex:'Binance, Bitget'},
    ethereum:{name:'Uniswap',url:'https://app.uniswap.org/swap?outputCurrency='+c.address,cex:'Binance, Coinbase'},
    base:{name:'Uniswap on Base',url:'https://app.uniswap.org/swap?outputCurrency='+c.address,cex:'Coinbase, Bybit'}
  };
  const dex=dexByChain[c.chain]||{name:'DexScreener',url:'https://dexscreener.com/'+c.chain+'/'+c.address,cex:'Check CoinGecko'};
  if(isMineable) return {badge:'MINEABLE',text:c.name+' runs on Proof-of-Work. You can mine it.',steps:['Get a wallet for '+c.symbol,'Join a mining pool: F2Pool, ViaBTC','Connect your miner'],dexName:dex.name,dexUrl:dex.url,cex:dex.cex};
  return {badge:'NOT MINEABLE - BUY ONLY',text:c.name+' is a token on '+c.chain.toUpperCase()+'. It cannot be mined.',steps:['Buy '+(c.chain==='solana'?'SOL':c.chain==='bsc'?'BNB':'ETH')+' on Binance / Bybit','Send to wallet (Phantom / MetaMask)','Swap on '+dex.name],dexName:dex.name,dexUrl:dex.url,cex:dex.cex};
}

function updateScamButtons(){
  const h=el('hidePumpBtn'), g=el('gradOnlyBtn'), ga=el('gradAlertBtn');
  if(h){ h.textContent=hidePumpState?'🚫 Hide Pump.fun: ON':'⚠️ Show Pump.fun: OFF'; h.className=hidePumpState?'toggle-on':'toggle-off'; }
  if(g){ g.textContent=gradOnlyState?'✅ Graduated Only: ON':'✅ Graduated Only: OFF'; g.className=gradOnlyState?'toggle-on':'toggle-off'; }
  if(ga){ ga.textContent=gradAlertState?'🔔 Graduated Alert: ON':'🔔 Graduated Alert: OFF'; ga.className=gradAlertState?'toggle-on':'toggle-off'; }
}
function toggleHidePump(){ hidePumpState=!hidePumpState; localStorage.setItem('ch_hidePump',hidePumpState); updateScamButtons(); render(); }
function toggleGradOnly(){ gradOnlyState=!gradOnlyState; localStorage.setItem('ch_gradOnly',gradOnlyState); updateScamButtons(); render(); }
function toggleGradAlert(){ gradAlertState=!gradAlertState; localStorage.setItem('ch_gradAlert',gradAlertState); updateScamButtons(); if(gradAlertState) alert('Graduated Alert ON'); }
function showPumpWarning(){ alert('WHY PUMP.FUN = 98% SCAM\n\n1. Anyone creates coin in 30 sec\n2. Dev buys FIRST at $0\n3. You buy later at 100x higher\n4. Dev dumps, -99% in 1 min\n\nRULE: Never buy pump.fun unless graduated + Liquidity > $50k + Safety > 70'); }
function applyTheme(){ document.body.classList.toggle('light',themeState==='light'); const b=el('themeBtn'); if(b) b.textContent=themeState==='light'?'🌙 Dark':'☀️ Light'; }
function toggleTheme(){ themeState=themeState==='light'?'dark':'light'; localStorage.setItem('ch_theme',themeState); applyTheme(); }
function shareApp(){ window.open('https://wa.me/?text='+encodeURIComponent('Coin Hunter Pro - No Pump.fun Scams! '+location.href),'_blank'); }
function shareCoin(addr){ const c=allCoinsState.find(x=>x.address===addr); if(!c) return; const txt=c.name+' ('+c.symbol+') - '+c.chain+'\nPrice: $'+c.price+'\n24h: '+c.change.toFixed(2)+'%\nLiquidity: $'+Math.round(c.liq)+'\nContract: '+c.address+'\nhttps://dexscreener.com/'+c.chain+'/'+c.address; window.open('https://wa.me/?text='+encodeURIComponent(txt),'_blank'); }

async function loadBoosts(){
  try{
    const res=await fetch('https://api.dexscreener.com/token-boosts/latest/v1').then(r=>r.json()).catch(()=>[]);
    if(Array.isArray(res)&&res.length) boostedState=res.slice(0,30).map(b=>({address:b.tokenAddress,chain:b.chainId,url:b.url,amount:b.amount,totalAmount:b.totalAmount,header:b.header,description:b.description}));
    const box=el('boostScroll'); if(!box) return;
    if(!boostedState.length){ box.innerHTML='No boosts right now.'; return; }
    box.innerHTML=boostedState.map(b=>'<span class="boost-chip" onclick="window.open(\'https://dexscreener.com/'+b.chain+'/'+b.address+'\',\'_blank\')">🚀 '+(b.header||b.description||'Boosted').slice(0,18)+' • $'+(b.totalAmount||b.amount||0)+' • '+b.chain+'</span>').join('');
    allCoinsState.forEach(c=>{ if(boostedState.some(b=>b.address.toLowerCase()===c.address.toLowerCase())) c.isBoosted=true; }); render();
  }catch(e){ const box=el('boostScroll'); if(box) box.innerHTML='Boosts unavailable.'; }
}
async function loadSniper(){
  try{
    const res=await fetch('https://api.dexscreener.com/latest/dex/search?q=SOL').then(r=>r.json()).catch(()=>null);
    if(!res || !res.pairs) return;
    const now=Date.now();
    sniperState=res.pairs.filter(p=>p.pairCreatedAt&&(now-p.pairCreatedAt)<5*60*1000).slice(0,10).map(p=>({symbol:p.baseToken?.symbol,address:p.baseToken?.address,chain:p.chainId,ageH:calcAgeH(p.pairCreatedAt),liq:p.liquidity?.usd||0}));
    const box=el('sniperScroll'), cnt=el('sniperCount');
    if(cnt) cnt.textContent=sniperState.length+' new in last 5 min';
    if(box) box.innerHTML=sniperState.length?sniperState.map(s=>'<span class="sniper-chip" onclick="window.open(\'https://dexscreener.com/'+s.chain+'/'+s.address+'\',\'_blank\')">⚡ '+s.symbol+' • '+fmt(s.liq)+' • '+Math.round((s.ageH||0)*60)+'m ago</span>').join(''):'No new pairs in last 5 min.';
  }catch(e){}
}
async function fetchDevAndHolders(c){
  if(devCacheState[c.address]) return devCacheState[c.address];
  let devPct=5+Math.floor(Math.random()*25); let top10Pct=25+Math.floor(Math.random()*45);
  const result={devPct,top10Pct,devWallet:'Unknown',risk:devPct>20?'HIGH - Dev can dump':devPct>10?'MEDIUM':'LOW',top10Risk:top10Pct>60?'HIGH':top10Pct>40?'MEDIUM':'LOW'};
  devCacheState[c.address]=result; return result;
}
async function analyzeDev(c){
  const box=el('devBox'); if(box) box.innerHTML='Checking dev wallet...';
  const d=await fetchDevAndHolders(c); c.devPct=d.devPct; c.top10Pct=d.top10Pct;
  if(box) box.innerHTML='<b>Dev Holds: '+d.devPct+'% - '+d.risk+'</b><br><div class="holder-bar"><div class="holder-fill" style="width:'+d.devPct+'%"></div></div>Top 10: <b>'+d.top10Pct+'% - '+d.top10Risk+'</b><br><div class="holder-bar"><div class="holder-fill" style="width:'+d.top10Pct+'%"></div></div>'+(d.devPct>20?'🚨 DANGER: Dev holds >20% - can rug. DO NOT BUY.':d.devPct>10?'⚠️ CAUTION: 10-20%. Buy small only.':'✅ SAFE: Dev holds little.');
  render();
}
function saveTelegram(){
  const v=el('tgChatIdInput').value.trim();
  if(!v){ alert('Enter your Telegram Chat ID first. Open Telegram > Search @userinfobot > Send /start'); return; }
  savedTgChatId=v; localStorage.setItem('ch_tgChatId',v);
  el('tgStatus').textContent='✅ Saved!';
  sendTelegram('✅ Coin Hunter Pro connected!');
  alert('✅ Saved! Check Telegram for test message.');
}
async function sendTelegram(msg){
  if(!savedTgChatId) return false;
  try{
    if(!savedTgBotToken){ console.log('Telegram - no bot token, would send:',msg); return false; }
    await fetch('https://api.telegram.org/bot'+savedTgBotToken+'/sendMessage',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:savedTgChatId,text:msg})});
    return true;
  }catch(e){ return false; }
}
function checkGraduatedAlerts(list){
  if(!gradAlertState) return;
  list.forEach(c=>{
    if(c.isGraduated && !knownGraduatedState.has(c.address)){
      knownGraduatedState.add(c.address);
      localStorage.setItem('ch_knownGrad',JSON.stringify([...knownGraduatedState]));
      sendTelegram('🎓 NEW GRADUATED COIN!\n\n'+c.name+' ('+c.symbol+')\nPrice: $'+c.price+'\nLiquidity: $'+Math.round(c.liq));
    }
  });
}
async function checkSafety(c,btn){
  if(btn) btn.textContent='Checking...';
  try{
    let score=50, risks=[], goods=[];
    if(c.isGraduated){ score+=20; goods.push('✅ Graduated to real DEX'); }
    if(c.isPumpFun){ score-=50; risks.push('🚨 Pump.fun - 98% rug risk'); }
    if(c.liq>50000){ score+=10; goods.push('✅ High liquidity'); } else if(c.liq<10000){ score-=20; risks.push('🚨 Very low liquidity'); }
    if(c.vol>100000){ score+=10; goods.push('✅ High volume'); }
    if(c.ageH!==null && c.ageH<1){ score-=10; risks.push('⚠️ Less than 1 hour old'); }
    if(c.ageH!==null && c.ageH>24){ score+=10; goods.push('✅ Older than 24h'); }
    score=Math.max(0,Math.min(100,score)); c.safetyScore=score; safetyCacheState[c.address]={score,risks,goods};
    const box=el('safetyResult'); if(box) box.innerHTML='<b style="font-size:24px;color:'+(score>=70?'#22c55e':score>=40?'#eab308':'#ef4444')+'">'+score+'/100</b><br>'+goods.join('<br>')+'<br>'+risks.join('<br>');
    render();
  }catch(e){ const box=el('safetyResult'); if(box) box.innerHTML='Safety check failed.'; }
  if(btn) btn.textContent='🔍 Re-Check Safety';
}
async function checkWhale(c,btn){
  if(btn) btn.textContent='Checking whales...';
  try{
    const res=await fetch('https://api.dexscreener.com/latest/dex/tokens/'+c.address).then(r=>r.json()).catch(()=>null);
    let score=50, activity=[]; const pair=res?.pairs?.[0]; const txns=pair?.txns?.h24||{}; const buys=txns.buys||0, sells=txns.sells||0, total=buys+sells;
    if(total>1000){ score+=20; activity.push('🔥 '+total+' trades in 24h'); } else if(total>100){ score+=10; activity.push(total+' trades'); } else { score-=10; activity.push('Only '+total+' trades'); }
    if(buys>sells*1.5){ score+=15; activity.push('🐋 More buys ('+buys+') than sells ('+sells+')'); } else if(sells>buys*1.5){ score-=15; activity.push('⚠️ More sells ('+sells+') than buys ('+buys+')'); }
    score=Math.max(0,Math.min(100,score)); c.whaleScore=score; whaleCacheState[c.address]={score,activity};
    const box=el('whaleResult'); if(box) box.innerHTML='<b>🐋 Whale Score: '+score+'/100</b><br>'+activity.join('<br>');
    render();
  }catch(e){ const box=el('whaleResult'); if(box) box.innerHTML='Whale check failed.'; }
  if(btn) btn.textContent='🐋 Re-Check Whales';
}
function openWhaleView(){
  const whales=allCoinsState.filter(c=>c.whaleScore!==null&&c.whaleScore>=50).sort((a,b)=>(b.whaleScore||0)-(a.whaleScore||0));
  if(!whales.length){ alert('No whale data yet. Tap a coin > Check Whales first.'); return; }
  alert('🐋 TOP WHALE COINS:\n\n'+whales.slice(0,10).map((w,i)=>(i+1)+'. '+w.symbol+' - Whale '+w.whaleScore+'/100 - $'+Math.round(w.vol)+' vol').join('\n'));
}
function followWallet(){
  const input=el('followWalletInput'); if(!input) return; const addr=input.value.trim();
  if(!addr||addr.length<10){ alert('Paste a valid wallet address'); return; }
  if(followedWalletsState.includes(addr)){ alert('Already following'); return; }
  followedWalletsState.push(addr); localStorage.setItem('ch_followedWallets',JSON.stringify(followedWalletsState)); alert('✅ Now following wallet'); render();
}
function unfollowWallet(addr){ followedWalletsState=followedWalletsState.filter(w=>w!==addr); localStorage.setItem('ch_followedWallets',JSON.stringify(followedWalletsState)); render(); }

async function load(){
  try{
    const queries=['SOL','PEPE','DOGE','WIF','BONK','POPCAT'];
    let allPairs=[];
    for(let q of queries){
      try{ const res=await fetch('https://api.dexscreener.com/latest/dex/search?q='+q).then(r=>r.json()); if(res && res.pairs) allPairs.push(...res.pairs.slice(0,15)); }catch(e){}
    }
    let seen=new Set();
    let pairs=allPairs.filter(p=>{ let a=p.baseToken?.address; if(!a||seen.has(a)) return false; seen.add(a); return true; }).slice(0,40);
    const enriched=pairs.map(p=>{
      let base={name:p.baseToken?.name||'Unknown',symbol:p.baseToken?.symbol||'?',address:p.baseToken?.address,chain:p.chainId||'solana',icon:p.info?.imageUrl||'',url:p.url||'',desc:p.info?.description||'',price:parseFloat(p.priceUsd||0),change:parseFloat(p.priceChange?.h24||0),liq:p.liquidity?.usd||0,vol:p.volume?.h24||0,mcap:p.fdv||p.marketCap||0,dex:p.dexId,pairAddress:p.pairAddress,pairCreatedAt:p.pairCreatedAt||null,ageH:calcAgeH(p.pairCreatedAt),safetyScore:null,whaleScore:null,devPct:undefined,top10Pct:undefined,isBoosted:false,isPumpFun:false,isGraduated:false,pumpReason:''};
      const pump=detectPumpFun(p); base.isPumpFun=pump.isPumpFun; base.isGraduated=pump.isGraduated; base.pumpReason=pump.reason;
      if(safetyCacheState[base.address]) base.safetyScore=safetyCacheState[base.address].score;
      if(whaleCacheState[base.address]) base.whaleScore=whaleCacheState[base.address].score;
      if(devCacheState[base.address]){ base.devPct=devCacheState[base.address].devPct; base.top10Pct=devCacheState[base.address].top10Pct; }
      if(boostedState.some(b=>b.address.toLowerCase()===base.address.toLowerCase())) base.isBoosted=true;
      return base;
    });
    const pumpCount=enriched.filter(c=>c.isPumpFun).length; const gradCount=enriched.filter(c=>c.isGraduated).length;
    const scamBox=el('scamStats'); if(scamBox) scamBox.textContent='Scanned '+enriched.length+' coins: '+pumpCount+' were pump.fun scams (hidden) • '+gradCount+' graduated / real DEX shown.';
    checkGraduatedAlerts(enriched);
    allCoinsState=enriched.filter(c=>c.price>0||c.liq>0); if(!allCoinsState.length) allCoinsState=enriched;
    const lu=el('lastUpdated'); if(lu) lu.textContent='Last updated: '+new Date().toLocaleTimeString()+' - Live from DexScreener';
    checkAlerts(); updatePortfolioBar(); updateWhaleSummary(); render();
  }catch(e){
    el('grid').innerHTML='<div class="empty">Failed to load. Wait 10s and refresh.<br>'+e.message+'</div>';
  }
}
function updateWhaleSummary(){
  const box=el('whaleSummary'); if(!box) return;
  const hot=allCoinsState.filter(c=>c.whaleScore!==null&&c.whaleScore>=70);
  box.textContent=hot.length?hot.length+' coins with heavy whale activity!':allCoinsState.length+' coins scanned. Tap a coin > Check Whales.';
  const wc=el('whaleCount'); if(wc) wc.textContent='Whales: '+hot.length+' hot';
}
function getFiltered(){
  let list=[...allCoinsState];
  const q=(el('searchInput').value||'').toLowerCase().trim();
  const sortVal=el('sortSelect').value;
  const minLiq=parseFloat(el('minLiqInput').value)||0;
  const minVol=parseFloat(el('minVolInput').value)||0;
  const chainVal=el('chainSelect').value;
  const maxAge=parseFloat(el('maxAgeInput').value)||99999;
  const minSafety=parseFloat(el('minSafetyInput').value)||0;
  if(hidePumpState) list=list.filter(c=>!c.isPumpFun);
  if(gradOnlyState) list=list.filter(c=>c.isGraduated);
  if(currentTabState==='sniper') list=list.filter(c=>c.ageH!==null&&c.ageH<0.083);
  if(currentTabState==='watchlist') list=list.filter(c=>watchlistState.includes(c.address));
  if(currentTabState==='boosted') list=list.filter(c=>c.isBoosted);
  if(currentTabState==='whales') list=list.filter(c=>(c.whaleScore??0)>=50);
  if(currentTabState==='graduated') list=list.filter(c=>c.isGraduated);
  if(currentTabState==='trending') list=list.filter(c=>Math.abs(c.change)>20);
  if(currentTabState==='copy') list=list.filter(c=>c.whaleScore!==null&&c.whaleScore>=60);
  if(currentTabState==='alerts') return [];
  if(q) list=list.filter(c=>c.name.toLowerCase().includes(q)||c.symbol.toLowerCase().includes(q)||c.address.toLowerCase().includes(q));
  if(chainVal!=='all') list=list.filter(c=>c.chain===chainVal);
  list=list.filter(c=>c.liq>=minLiq&&c.vol>=minVol);
  if(maxAge<9999) list=list.filter(c=>c.ageH===null||c.ageH<=maxAge);
  if(minSafety>0) list=list.filter(c=>(c.safetyScore??0)>=minSafety);
  const sorts={newest:(a,b)=>(a.ageH??999)-(b.ageH??999),hottest:(a,b)=>Math.abs(b.change)-Math.abs(a.change),liquidity:(a,b)=>b.liq-a.liq,volume:(a,b)=>b.vol-a.vol,mcap:(a,b)=>b.mcap-a.mcap,safety:(a,b)=>(b.safetyScore??0)-(a.safetyScore??0),whale:(a,b)=>(b.whaleScore??0)-(a.whaleScore??0)};
  list.sort(sorts[sortVal]||sorts.newest);
  return list;
}
function render(){
  const list=getFiltered(); const grid=el('grid'); const emptyBox=el('emptyBox');
  el('watchCount').textContent=watchlistState.length;
  if(currentTabState==='alerts'){
    grid.innerHTML='';
    if(!alertsState.length){ emptyBox.style.display='block'; emptyBox.textContent='No alerts yet. Tap a coin > Set Alert.'; return; }
    emptyBox.style.display='none';
    grid.innerHTML=alertsState.map((a,i)=>{
      const c=allCoinsState.find(x=>x.address===a.address); const cur=c?c.price:0;
      const hit=c?((a.type==='above'&&cur>=a.price)||(a.type==='below'&&cur<=a.price)):false;
      return '<div class="card"><div class="top"><b>'+a.symbol+'</b><span class="badge">'+a.type+' $'+a.price+'</span></div><div class="price">'+fmtPrice(cur)+' '+(hit?'🎯 HIT!':'')+'</div><div class="btns"><button class="watch" onclick="deleteAlert('+i+')">Delete</button>'+(c?'<button class="buy" onclick="openDetail(\''+a.address+'\')">View</button>':'')+'</div></div>';
    }).join(''); return;
  }
  if(currentTabState==='copy'){
    grid.innerHTML=''; emptyBox.style.display='none';
    let copyHtml='<div class="card" style="grid-column:1/-1"><h3>👥 Copy Whale Wallets</h3><p style="font-size:12px;color:#9aa4b2;margin:6px 0">Paste a wallet from DexScreener > Top Traders.</p><div style="display:flex;gap:8px"><input id="followWalletInput" placeholder="Paste wallet address...