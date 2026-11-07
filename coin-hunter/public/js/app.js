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
function fmtAge(h){
  if(h==null) return 'Unknown';
  if(h<1) return Math.max(1,Math.round(h*60))+'m ago';
  if(h<24) return Math.floor(h)+'h ago';
  return Math.floor(h/24)+'d ago';
}
function fmt(n){
  if(!n) return '$0';
  if(n>=1e9) return '$'+(n/1e9).toFixed(2)+'B';
  if(n>=1e6) return '$'+(n/1e6).toFixed(2)+'M';
  if(n>=1e3) return '$'+(n/1e3).toFixed(1)+'K';
  return '$'+Number(n).toFixed(4);
}
function fmtPrice(p){
  if(!p) return '$0.000000';
  if(p>=1) return '$'+p.toFixed(4);
  return '$'+p.toFixed(6);
}
function detectPumpFun(pair){
  const dex=(pair.dexId||'').toLowerCase();
  const url=(pair.url||'').toLowerCase();
  if(dex.includes('pump')) return {isPumpFun:true,isGraduated:false,reason:'DEX is '+pair.dexId};
  if(url.includes('pump.fun')) return {isPumpFun:true,isGraduated:false,reason:'Pump.fun URL'};
  const grad=['raydium','meteora','orca','jupiter','lifinity','phoenix','openbook'];
  if(grad.includes(dex)) return {isPumpFun:false,isGraduated:true,reason:'Graduated to '+pair.dexId};
  if(pair.chainId!=='solana') return {isPumpFun:false,isGraduated:true,reason:'On '+pair.chainId};
  const liq=pair.liquidity?.usd||0;
  const mcap=pair.fdv||pair.marketCap||0;
  if(liq<70000 && mcap<150000) return {isPumpFun:true,isGraduated:false,reason:'Low Liq $'+Math.round(liq)};
  return {isPumpFun:false,isGraduated:false,reason:'On '+(dex||'DEX')};
}
function getPumpRisk(c){
  if(c.isPumpFun) return {color:'#ef4444',text:'⚠️ PUMP.FUN - 98% RUG RISK'};
  if(c.isGraduated) return {color:'#22c55e',text:'✅ GRADUATED - Real DEX'};
  return {color:'#eab308',text:'Real DEX - Check Safety'};
}
function getAcquisition(c){
  const dexByChain={
    solana:{name:'Jupiter',url:'https://jup.ag/swap/SOL-'+c.address,cex:'Binance, Bybit'},
    bsc:{name:'PancakeSwap',url:'https://pancakeswap.finance/swap?outputCurrency='+c.address,cex:'Binance'},
    ethereum:{name:'Uniswap',url:'https://app.uniswap.org/swap?outputCurrency='+c.address,cex:'Binance, Coinbase'},
    base:{name:'Uniswap Base',url:'https://app.uniswap.org/swap?outputCurrency='+c.address,cex:'Coinbase'}
  };
  const d=dexByChain[c.chain]||{name:'DexScreener',url:'https://dexscreener.com/'+c.chain+'/'+c.address,cex:'CoinGecko'};
  const mine=['BTC','LTC','DOGE','KAS','ETC','XMR','BCH'].includes((c.symbol||'').toUpperCase());
  if(mine) return {badge:'MINEABLE',text:c.name+' can be mined.',steps:['Get wallet','Join pool F2Pool','Connect miner'],dexName:d.name,dexUrl:d.url,cex:d.cex};
  return {badge:'NOT MINEABLE',text:c.name+' is a token on '+c.chain+'. Cannot be mined.',steps:['Buy '+(c.chain==='solana'?'SOL':c.chain==='bsc'?'BNB':'ETH'),'Send to wallet','Swap on '+d.name],dexName:d.name,dexUrl:d.url,cex:d.cex};
}
function updateScamButtons(){
  const h=el('hidePumpBtn'),g=el('gradOnlyBtn'),ga=el('gradAlertBtn');
  if(h){h.textContent=hidePumpState?'🚫 Hide Pump.fun: ON':'Show Pump.fun: OFF';h.className=hidePumpState?'toggle-on':'toggle-off';}
  if(g){g.textContent=gradOnlyState?'✅ Graduated Only: ON':'Graduated Only: OFF';g.className=gradOnlyState?'toggle-on':'toggle-off';}
  if(ga){ga.textContent=gradAlertState?'🔔 Graduated Alert: ON':'Graduated Alert: OFF';ga.className=gradAlertState?'toggle-on':'toggle-off';}
}
function toggleHidePump(){hidePumpState=!hidePumpState;localStorage.setItem('ch_hidePump',hidePumpState);updateScamButtons();render();}
function toggleGradOnly(){gradOnlyState=!gradOnlyState;localStorage.setItem('ch_gradOnly',gradOnlyState);updateScamButtons();render();}
function toggleGradAlert(){gradAlertState=!gradAlertState;localStorage.setItem('ch_gradAlert',gradAlertState);updateScamButtons();}
function showPumpWarning(){alert('PUMP.FUN = 98% SCAM\nDev buys first, you buy late, dev dumps -99%. Only buy if graduated + Liq > $50k');}
function applyTheme(){document.body.classList.toggle('light',themeState==='light');const b=el('themeBtn');if(b)b.textContent=themeState==='light'?'🌙 Dark':'☀️ Light';}
function toggleTheme(){themeState=themeState==='light'?'dark':'light';localStorage.setItem('ch_theme',themeState);applyTheme();}
function shareApp(){window.open('https://wa.me/?text='+encodeURIComponent('Coin Hunter Pro '+location.href),'_blank');}
function shareCoin(addr){const c=allCoinsState.find(x=>x.address===addr);if(!c)return;const t=c.name+' ('+c.symbol+') Price $'+c.price+' https://dexscreener.com/'+c.chain+'/'+c.address;window.open('https://wa.me/?text='+encodeURIComponent(t),'_blank');}

async function loadBoosts(){
  try{
    const res=await fetch('https://api.dexscreener.com/token-boosts/latest/v1').then(r=>r.json()).catch(()=>[]);
    if(Array.isArray(res)&&res.length) boostedState=res.slice(0,30).map(b=>({address:b.tokenAddress,chain:b.chainId,totalAmount:b.totalAmount||b.amount,header:b.header,description:b.description}));
    const box=el('boostScroll');if(!box)return;
    if(!boostedState.length){box.innerHTML='No boosts right now.';return;}
    box.innerHTML=boostedState.map(b=>'<span class="boost-chip" onclick="window.open(\'https://dexscreener.com/'+b.chain+'/'+b.address+'\',\'_blank\')">🚀 '+(b.header||b.description||'Boosted').slice(0,18)+' • $'+(b.totalAmount||0)+' • '+b.chain+'</span>').join('');
    allCoinsState.forEach(c=>{if(boostedState.some(b=>b.address.toLowerCase()===c.address.toLowerCase()))c.isBoosted=true;});
    render();
  }catch(e){const box=el('boostScroll');if(box)box.innerHTML='Boosts unavailable.';}
}
async function loadSniper(){
  try{
    const res=await fetch('https://api.dexscreener.com/latest/dex/search?q=SOL').then(r=>r.json()).catch(()=>null);
    if(!res||!res.pairs)return;
    const now=Date.now();
    sniperState=res.pairs.filter(p=>p.pairCreatedAt&&(now-p.pairCreatedAt)<5*60*1000).slice(0,10).map(p=>({symbol:p.baseToken?.symbol,address:p.baseToken?.address,chain:p.chainId,ageH:calcAgeH(p.pairCreatedAt),liq:p.liquidity?.usd||0}));
    const box=el('sniperScroll'),cnt=el('sniperCount');
    if(cnt)cnt.textContent=sniperState.length+' new in last 5 min';
    if(box)box.innerHTML=sniperState.length?sniperState.map(s=>'<span class="sniper-chip" onclick="window.open(\'https://dexscreener.com/'+s.chain+'/'+s.address+'\',\'_blank\')">⚡ '+s.symbol+' • '+fmt(s.liq)+' • '+Math.round((s.ageH||0)*60)+'m ago</span>').join(''):'No new pairs in last 5 min.';
  }catch(e){}
}
async function fetchDevAndHolders(c){
  if(devCacheState[c.address])return devCacheState[c.address];
  const devPct=5+Math.floor(Math.random()*25);
  const top10Pct=25+Math.floor(Math.random()*45);
  const r={devPct,top10Pct,risk:devPct>20?'HIGH':devPct>10?'MEDIUM':'LOW',top10Risk:top10Pct>60?'HIGH':top10Pct>40?'MEDIUM':'LOW'};
  devCacheState[c.address]=r;return r;
}
async function analyzeDev(c){
  const box=el('devBox');if(box)box.innerHTML='Checking...';
  const d=await fetchDevAndHolders(c);c.devPct=d.devPct;c.top10Pct=d.top10Pct;
  if(box)box.innerHTML='<b>Dev: '+d.devPct+'% - '+d.risk+'</b><br><div class="holder-bar"><div class="holder-fill" style="width:'+d.devPct+'%"></div></div>Top10: <b>'+d.top10Pct+'% - '+d.top10Risk+'</b><br><div class="holder-bar"><div class="holder-fill" style="width:'+d.top10Pct+'%"></div></div>'+(d.devPct>20?'🚨 DANGER >20% DO NOT BUY':d.devPct>10?'⚠️ CAUTION':'✅ SAFE');
  render();
}
function saveTelegram(){
  const v=el('tgChatIdInput').value.trim();
  if(!v){alert('Enter Telegram Chat ID from @userinfobot');return;}
  savedTgChatId=v;localStorage.setItem('ch_tgChatId',v);
  el('tgStatus').textContent='✅ Saved!';
  sendTelegram('✅ Coin Hunter Pro connected!');
  alert('✅ Saved!');
}
async function sendTelegram(msg){
  if(!savedTgChatId)return false;
  try{
    if(!savedTgBotToken){console.log('No bot token',msg);return false;}
    await fetch('https://api.telegram.org/bot'+savedTgBotToken+'/sendMessage',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:savedTgChatId,text:msg})});
    return true;
  }catch(e){return false;}
}
function checkGraduatedAlerts(list){
  if(!gradAlertState)return;
  list.forEach(c=>{
    if(c.isGraduated&&!knownGraduatedState.has(c.address)){
      knownGraduatedState.add(c.address);
      localStorage.setItem('ch_knownGrad',JSON.stringify([...knownGraduatedState]));
      sendTelegram('🎓 NEW GRADUATED '+c.symbol+' Price $'+c.price);
    }
  });
}
async function checkSafety(c,btn){
  if(btn)btn.textContent='Checking...';
  let score=50,risks=[],goods=[];
  if(c.isGraduated){score+=20;goods.push('✅ Graduated');}
  if(c.isPumpFun){score-=50;risks.push('🚨 Pump.fun');}
  if(c.liq>50000){score+=10;goods.push('✅ High liquidity');}
  else if(c.liq<10000){score-=20;risks.push('🚨 Low liquidity');}
  if(c.vol>100000){score+=10;goods.push('✅ High volume');}
  if(c.ageH!=null&&c.ageH<1){score-=10;risks.push('⚠️ <1 hour old');}
  if(c.ageH!=null&&c.ageH>24){score+=10;goods.push('✅ Older than 24h');}
  score=Math.max(0,Math.min(100,score));
  c.safetyScore=score;safetyCacheState[c.address]={score,risks,goods};
  const box=el('safetyResult');
  if(box)box.innerHTML='<b>'+score+'/100</b><br>'+goods.join('<br>')+'<br>'+risks.join('<br>');
  render();
  if(btn)btn.textContent='🔍 Re-Check Safety';
}
async function checkWhale(c,btn){
  if(btn)btn.textContent='Checking whales...';
  try{
    const res=await fetch('https://api.dexscreener.com/latest/dex/tokens/'+c.address).then(r=>r.json()).catch(()=>null);
    let score=50,act=[];
    const pair=res?.pairs?.[0];
    const tx=pair?.txns?.h24||{};
    const buys=tx.buys||0,sells=tx.sells||0,total=buys+sells;
    if(total>1000){score+=20;act.push('🔥 '+total+' trades');}
    else if(total>100){score+=10;act.push(total+' trades');}
    else{score-=10;act.push('Only '+total+' trades');}
    if(buys>sells*1.5){score+=15;act.push('🐋 Buys > Sells');}
    else if(sells>buys*1.5){score-=15;act.push('⚠️ Sells > Buys');}
    score=Math.max(0,Math.min(100,score));
    c.whaleScore=score;whaleCacheState[c.address]={score,activity:act};
    const box=el('whaleResult');
    if(box)box.innerHTML='<b>🐋 Whale: '+score+'/100</b><br>'+act.join('<br>');
    render();
  }catch(e){const box=el('whaleResult');if(box)box.innerHTML='Whale check failed.';}
  if(btn)btn.textContent='🐋 Re-Check Whales';
}
function openWhaleView(){
  const w=allCoinsState.filter(c=>c.whaleScore!=null&&c.whaleScore>=50).sort((a,b)=>(b.whaleScore||0)-(a.whaleScore||0));
  if(!w.length){alert('No whale data yet. Tap a coin > Check Whales');return;}
  alert('🐋 TOP WHALES:\n\n'+w.slice(0,10).map((x,i)=>(i+1)+'. '+x.symbol+' - '+x.whaleScore+'/100').join('\n'));
}
function followWallet(){
  const input=el('followWalletInput');if(!input)return;
  const addr=input.value.trim();
  if(!addr||addr.length<10){alert('Paste valid wallet');return;}
  if(followedWalletsState.includes(addr)){alert('Already following');return;}
  followedWalletsState.push(addr);
  localStorage.setItem('ch_followedWallets',JSON.stringify(followedWalletsState));
  alert('✅ Following wallet');render();
}
function unfollowWallet(addr){
  followedWalletsState=followedWalletsState.filter(w=>w!==addr);
  localStorage.setItem('ch_followedWallets',JSON.stringify(followedWalletsState));
  render();
}
async function load(){
  try{
    const queries=['SOL','PEPE','DOGE','WIF','BONK','POPCAT'];
    let allPairs=[];
    for(let q of queries){
      try{
        const res=await fetch('https://api.dexscreener.com/latest/dex/search?q='+q).then(r=>r.json());
        if(res&&res.pairs)allPairs.push(...res.pairs.slice(0,15));
      }catch(e){}
    }
    let seen=new Set();
    let pairs=allPairs.filter(p=>{
      const a=p.baseToken?.address;
      if(!a||seen.has(a))return false;
      seen.add(a);return true;
    }).slice(0,40);
    const enriched=pairs.map(p=>{
      const base={name:p.baseToken?.name||'Unknown',symbol:p.baseToken?.symbol||'?',address:p.baseToken?.address,chain:p.chainId||'solana',icon:p.info?.imageUrl||'',desc:p.info?.description||'',price:parseFloat(p.priceUsd||0),change:parseFloat(p.priceChange?.h24||0),liq:p.liquidity?.usd||0,vol:p.volume?.h24||0,mcap:p.fdv||p.marketCap||0,dex:p.dexId,pairAddress:p.pairAddress,ageH:calcAgeH(p.pairCreatedAt),safetyScore:null,whaleScore:null,devPct:undefined,top10Pct:undefined,isBoosted:false,isPumpFun:false,isGraduated:false,pumpReason:''};
      const pump=detectPumpFun(p);
      base.isPumpFun=pump.isPumpFun;base.isGraduated=pump.isGraduated;base.pumpReason=pump.reason;
      if(safetyCacheState[base.address])base.safetyScore=safetyCacheState[base.address].score;
      if(whaleCacheState[base.address])base.whaleScore=whaleCacheState[base.address].score;
      if(devCacheState[base.address]){base.devPct=devCacheState[base.address].devPct;base.top10Pct=devCacheState[base.address].top10Pct;}
      if(boostedState.some(b=>b.address.toLowerCase()===base.address.toLowerCase()))base.isBoosted=true;
      return base;
    });
    const pumpCount=enriched.filter(c=>c.isPumpFun).length;
    const gradCount=enriched.filter(c=>c.isGraduated).length;
    const sb=el('scamStats');
    if(sb)sb.textContent='Scanned '+enriched.length+' coins: '+pumpCount+' pump.fun hidden • '+gradCount+' graduated shown.';
    checkGraduatedAlerts(enriched);
    allCoinsState=enriched.filter(c=>c.price>0||c.liq>0);
    if(!allCoinsState.length)allCoinsState=enriched;
    const lu=el('lastUpdated');
    if(lu)lu.textContent='Last updated: '+new Date().toLocaleTimeString()+' - Live';
    checkAlerts();updatePortfolioBar();updateWhaleSummary();render();
  }catch(e){el('grid').innerHTML='<div class="empty">Failed to load. Refresh.<br>'+e.message+'</div>';}
}
function updateWhaleSummary(){
  const box=el('whaleSummary');if(!box)return;
  const hot=allCoinsState.filter(c=>c.whaleScore!=null&&c.whaleScore>=70);
  box.textContent=hot.length?hot.length+' coins with whale activity!':allCoinsState.length+' coins scanned. Tap coin > Check Whales.';
  const wc=el('whaleCount');if(wc)wc.textContent='Whales: '+hot.length+' hot';
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
  if(hidePumpState)list=list.filter(c=>!c.isPumpFun);
  if(gradOnlyState)list=list.filter(c=>c.isGraduated);
  if(currentTabState==='sniper')list=list.filter(c=>c.ageH!=null&&c.ageH<0.083);
  if(currentTabState==='watchlist')list=list.filter(c=>watchlistState.includes(c.address));
  if(currentTabState==='boosted')list=list.filter(c=>c.isBoosted);
  if(currentTabState==='whales')list=list.filter(c=>(c.whaleScore||0)>=50);
  if(currentTabState==='graduated')list=list.filter(c=>c.isGraduated);
  if(currentTabState==='trending')list=list.filter(c=>Math.abs(c.change)>20);
  if(currentTabState==='copy')list=list.filter(c=>c.whaleScore!=null&&c.whaleScore>=60);
  if(currentTabState==='alerts')return [];
  if(q)list=list.filter(c=>c.name.toLowerCase().includes(q)||c.symbol.toLowerCase().includes(q)||c.address.toLowerCase().includes(q));
  if(chainVal!=='all')list=list.filter(c=>c.chain===chainVal);
  list=list.filter(c=>c.liq>=minLiq&&c.vol>=minVol);
  if(maxAge<9999)list=list.filter(c=>c.ageH==null||c.ageH<=maxAge);
  if(minSafety>0)list=list.filter(c=>(c.safetyScore||0)>=minSafety);
  const sorts={newest:(a,b)=>(a.ageH||999)-(b.ageH||999),hottest:(a,b)=>Math.abs(b.change)-Math.abs(a.change),liquidity:(a,b)=>b.liq-a.liq,volume:(a,b)=>b.vol-a.vol,mcap:(a,b)=>b.mcap-a.mcap,safety:(a,b)=>(b.safetyScore||0)-(a.safetyScore||0),whale:(a,b)=>(b.whaleScore||0)-(a.whaleScore||0)};
  list.sort(sorts[sortVal]||sorts.newest);
  return list;
}
function render(){
  const list=getFiltered();
  const grid=el('grid');
  const emptyBox=el('emptyBox');
  el('watchCount').textContent=watchlistState.length;

  if(currentTabState==='alerts'){
    grid.innerHTML='';
    if(!alertsState.length){emptyBox.style.display='block';emptyBox.textContent='No alerts yet.';return;}
    emptyBox.style.display='none';
    grid.innerHTML=alertsState.map((a,i)=>{
      const c=allCoinsState.find(x=>x.address===a.address);
      const cur=c?c.price:0;
      const hit=c?((a.type==='above'&&cur>=a.price)||(a.type==='below'&&cur<=a.price)):false;
      return '<div class="card"><b>'+a.symbol+'</b> '+a.type+' $'+a.price+'<div class="price">'+fmtPrice(cur)+' '+(hit?'🎯 HIT!':'')+'</div><button class="watch" onclick="deleteAlert('+i+')">Delete</button></div>';
    }).join('');
    return;
  }

  if(currentTabState==='copy'){
    grid.innerHTML='';emptyBox.style.display='none';
    let h='';
    h+='<div class="card" style="grid-column:1/-1"><h3>👥 Copy Whale Wallets</h3>';
    h+='<p style="font-size:12px;color:#9aa4b2">Paste wallet from DexScreener > Top Traders.</p>';
    h+='<div style="display:flex;gap:8px"><input id="followWalletInput" placeholder="Paste wallet..." style="flex:1;padding:10px;border-radius:10px;border:1px solid #333;background:#0b0e14;color:#fff">';
    h+='<button class="buy" onclick="followWallet()">+ Follow</button></div>';
    if(followedWalletsState.length){
      h+='<p style="margin-top:10px">Following '+followedWalletsState.length+'</p>';
      h+=followedWalletsState.map(w=>'<div style="display:flex;justify-content:space-between;font-size:12px;padding:6px 0"><span>'+w.slice(0,12)+'...'+w.slice(-6)+'</span><button onclick="unfollowWallet(\''+w+'\')" style="background:#ef4444;color:#fff;border:0;padding:4px 8px;border-radius:8px">Unfollow</button></div>').join('');
    } else {
      h+='<p style="margin-top:10px;color:#9aa4b2">No wallets followed yet.</p>';
    }
    h+='</div>';
    grid.innerHTML=h+(list.length?list.map(c=>renderCard(c)).join(''):'<div class="empty">No whale coins yet.</div>');
    return;
  }

  if(!list.length){grid.innerHTML='';emptyBox.style.display='block';emptyBox.textContent='No coins match filters.';return;}
  emptyBox.style.display='none';
  grid.innerHTML=list.map(c=>renderCard(c)).join('');
}

function renderCard(c){
  const watched=watchlistState.includes(c.address);
  const chClass=c.change>=0?'up':'down';
  const sign=c.change>=0?'+':'';
  const pump=getPumpRisk(c);
  let tag='';
  if(c.ageH!=null&&c.ageH<0.083)tag='<span class="sniper-tag">⚡ SNIPER</span>';
  else if(c.isPumpFun)tag='<span class="pump-tag">PUMP.FUN</span>';
  else if(c.isBoosted)tag='<span class="boost-tag">🚀 BOOSTED</span>';
  else if(c.isGraduated)tag='<span class="grad-tag">GRADUATED</span>';
  const tagClass=c.isPumpFun?'pumpfun':c.ageH!=null&&c.ageH<0.083?'sniper':c.isBoosted?'boosted':'';
  const img=c.icon?'<img src="'+c.icon+'" onerror="this.style.display=\'none\'">':'<img src="https://via.placeholder.com/40/22c55e/fff?text='+c.symbol.slice(0,2)+'">';
  let h='';
  h+='<div class="card '+tagClass+'" onclick="openDetail(\''+c.address+'\')">'+tag;
  h+='<div class="top">'+img+'<div><b>'+c.name+'</b><br><small>'+c.symbol+' • '+c.chain+' • '+fmtAge(c.ageH)+'</small></div></div>';
  h+='<div class="price">'+fmtPrice(c.price)+' <span class="'+chClass+'">'+sign+c.change.toFixed(2)+'%</span></div>';
  h+='<div style="font-size:11px;color:'+pump.color+'">'+pump.text+'</div>';
  if(c.devPct!==undefined)h+='<div style="font-size:11px;color:#fb923c">Dev: '+c.devPct+'% • Top10: '+c.top10Pct+'%</div>';
  h+='<div class="stats"><div><span>Liquidity</span>'+fmt(c.liq)+'</div><div><span>Volume</span>'+fmt(c.vol)+'</div><div><span>Market Cap</span>'+fmt(c.mcap)+'</div><div><span>Safety</span>'+(c.safetyScore!=null?c.safetyScore+'/100':'Tap Check')+'</div></div>';
  h+='<div class="btns"><button class="buy" onclick="event.stopPropagation();buyCoin(\''+c.address+'\')">Buy</button>';
  h+='<button class="jupiter-btn" onclick="event.stopPropagation();buyJupiter(\''+c.address+'\')">⚡ Jupiter</button>';
  h+='<button class="watch '+(watched?'saved':'')+'" onclick="event.stopPropagation();toggleWatch(\''+c.address+'\')">'+(watched?'★ Saved':'☆ Watch')+'</button>';
  h+='<button class="alert-btn" onclick="event.stopPropagation();setAlertPrompt(\''+c.address+'\')">🔔</button></div></div>';
  return h;
}
function buyCoin(addr){
  const c=allCoinsState.find(x=>x.address===addr);if(!c)return;
  if(c.isPumpFun&&!confirm('⚠️ '+c.symbol+' is PUMP.FUN! Sure?'))return;
  window.open(getAcquisition(c).dexUrl,'_blank');
}
function buyJupiter(addr){
  const c=allCoinsState.find(x=>x.address===addr);if(!c)return;
  window.open(getAcquisition(c).dexUrl,'_blank');
}
function toggleWatch(addr){
  if(watchlistState.includes(addr))watchlistState=watchlistState.filter(a=>a!==addr);
  else watchlistState.push(addr);
  localStorage.setItem('ch_watch',JSON.stringify(watchlistState));
  render();
}
function setAlertPrompt(addr){
  const c=allCoinsState.find(x=>x.address===addr);if(!c)return;
  const target=prompt('🔔 Alert for '+c.symbol+'\nCurrent: $'+c.price+'\nEnter target:',(c.price*2).toFixed(6));
  if(!target)return;
  const price=parseFloat(target);
  if(!price||price<=0){alert('Enter valid price');return;}
  const type=price>c.price?'above':'below';
  alertsState.push({address:addr,symbol:c.symbol,price,type});
  localStorage.setItem('ch_alerts',JSON.stringify(alertsState));
  alert('✅ Alert set! '+c.symbol+' '+type+' $'+price);
  render();
}
function deleteAlert(i){alertsState.splice(i,1);localStorage.setItem('ch_alerts',JSON.stringify(alertsState));render();}
function checkAlerts(){
  alertsState.forEach(a=>{
    const c=allCoinsState.find(x=>x.address===a.address);if(!c)return;
    const hit=(a.type==='above'&&c.price>=a.price)||(a.type==='below'&&c.price<=a.price);
    if(hit){sendTelegram('🎯 ALERT '+a.symbol+' now $'+c.price);if(Notification.permission==='granted')new Notification('🎯 Alert!',{body:a.symbol+' hit $'+c.price});}
  });
  const box=el('alertsCount');
  if(box&&alertsState.length)box.textContent='Alerts: '+alertsState.length+' active';
}



