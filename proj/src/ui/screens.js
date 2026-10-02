/* ---------- screens ---------- */
let settingsFrom='title', levelSnap=null, subScreen='';
const screen=document.getElementById('screen'), card=document.getElementById('card');
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function controlsHTML(){return `<div class="keys">${(isTouch?T('touchKeys'):T('keys')).map(([k,d])=>`<b>${esc(k)}</b><span>${esc(d)}</span>`).join('')}</div>`}
function musicLabel(){return `${T('musicL')}: ${MUSIC.on?T('on'):T('off')}${isTouch?'':' (M)'}`}
function fmt(t){const m=Math.floor(t/60),s=Math.floor(t%60);return `${m}:${String(s).padStart(2,'0')}`}
function setLang(l){lang=l;try{localStorage.setItem('grib-lang',l)}catch(e){}applyLang();showScreen('settings');const b=document.getElementById('langb');b&&setTimeout(()=>b.focus(),40)}
function showScreen(kind){
  screen.classList.remove('hidden');
  screenShownAt=performance.now(); subScreen=['sound','levels','bye','controls'].indexOf(kind)>=0?kind:'';
  if(kind==='sound'){
    const row=(id,label,v)=>`<label class="vol-row" for="${id}"><span>${label}</span><output id="${id}-o">${Math.round(v*100)}%</output><input type="range" id="${id}" min="0" max="100" step="5" value="${Math.round(v*100)}"></label>`;
    card.innerHTML=`<h1>${T('sound')}</h1>${row('mv',T('musicVol'),VOL.music)}${row('sv',T('sfxVol'),VOL.sfx)}
      <div class="seg"><button id="music" aria-pressed="${MUSIC.on}">${musicLabel()}</button></div>
      <div class="actions"><button class="cap-btn" id="go">${T('back')}</button></div>`;
    const mv=document.getElementById('mv'), sv=document.getElementById('sv');
    mv.addEventListener('input',()=>{VOL.music=mv.value/100;document.getElementById('mv-o').textContent=mv.value+'%';saveVol()});
    sv.addEventListener('input',()=>{VOL.sfx=sv.value/100;document.getElementById('sv-o').textContent=sv.value+'%';applySfxVol();saveVol()});
    sv.addEventListener('change',()=>{initAudio();applySfxVol();sfx('coin')});
    document.getElementById('music').addEventListener('click',toggleMusic);
    document.getElementById('go').addEventListener('click',screenAction);
    setTimeout(()=>mv.focus(),30);
    return;
  }
  let focusSel='#go';
  if(kind==='title') card.innerHTML=`<div class="title-logo" aria-hidden="true">${LOGO_SVG}</div><h1 class="big">${T('title')}</h1><p>${T('intro')}</p>
    <div class="menu"><button class="cap-btn" id="go">${T('play')}</button><button class="ghost-btn" id="levels">${T('chooseLevel')}</button>
    <button class="ghost-btn" id="opt">${T('settings')}</button><button class="ghost-btn" id="quit">${T('quit')}</button></div>${isTouch?'':`<p class="shop-hint">${T('menuHint')}</p>`}<div id="rotate">${T('rotate')}</div>`;
  if(kind==='settings'){
    const inGame=settingsFrom==='play', langs=Object.keys(I18N), nextLang=langs[(langs.indexOf(lang)+1)%langs.length];
    card.innerHTML=`<h1>${T('settings')}</h1>${inGame?`<p>${T('levelName')(LEVEL)} · ${T('seedL')(SEED)}<br>${T('sporesGotL')(sporesGot)}<br>${T('secretsL')(secretsFound,secretZones.length)}</p>`:''}
    <div class="menu"><button class="cap-btn" id="go">${inGame?T('resume'):T('back')}</button>
    <button class="ghost-btn" id="ctrl">${T('controls')}</button><button class="ghost-btn" id="sound">${T('sound')}</button>
    <button class="ghost-btn" id="langb">${T('language')}: ${I18N[lang].name}</button>
    ${inGame?`<button class="ghost-btn" id="restart">${T('restart')}</button><button class="ghost-btn" id="newmap">${T('newMap')}</button><button class="ghost-btn" id="tomenu">${T('mainMenu')}</button>`:''}</div>`;
    document.getElementById('langb').addEventListener('click',()=>setLang(nextLang));
    document.getElementById('ctrl').addEventListener('click',()=>showScreen('controls'));
  }
  if(kind==='controls') card.innerHTML=`<h1>${T('controls')}</h1>${controlsHTML()}<div class="actions"><button class="cap-btn" id="go">${T('back')}</button></div>`;
  card.classList.toggle('wide',kind==='shop');card.classList.toggle('lv',kind==='levels');
  if(kind==='shop'){
    card.innerHTML=`<h1 class="sm">${T('shopTitle')}</h1><p class="seller">${T('sellerLine')}</p>
    <div class="wallet">${SPORE_SVG}<span>${T('wallet')(spores)}</span></div>
    <div class="shop-list">${SHOP.map((it,i)=>{const sold=soldOut(it),why=sold?'':shopBlock(it),nm=T(it.id+'Name'),pr=itemPrice(it);
      const pr2=shopProgress(it),pips=`<span class="pips"${pr2?` aria-label="${esc(T('boughtL'))}"`:''}>${pr2}</span>`;
      // the bought-marks and the price button share the bottom line of the card
      return `<div class="shop-row${sold?' sold':''}"><span class="shop-ico" aria-hidden="true">${it.icon}</span><span><b class="nm">${i+1}. ${nm}</b><br><small>${T(it.id+'Desc')}</small>${why?`<br><small class="why">${T(why)}</small>`:''}</span>
      ${sold?`<span class="stamp" aria-hidden="true">Sold Out</span>`:''}<div class="foot">${pips}<button class="buy" data-id="${it.id}" data-i="${i}" aria-disabled="${!!(why||sold)}" aria-label="${esc(sold?nm+': Sold Out':T('buyLabel')(nm,pr))}">${sold?'—':SPORE_SVG+pr}</button></div></div>`}).join('')}</div>
    <p class="shop-msg" aria-live="polite">${shopMsg}</p>
    <div class="actions"><button class="cap-btn" id="go">${T('leave')}</button></div>${isTouch?'':`<p class="shop-hint">${T('shopHint')}</p>`}`;
    card.querySelectorAll('.buy').forEach(b=>{b.addEventListener('click',()=>{shopSel=+b.dataset.i;buy(b.dataset.id)});b.addEventListener('focus',()=>{shopSel=+b.dataset.i;card.querySelectorAll('.shop-row').forEach((r,i)=>r.classList.toggle('sel',i===shopSel))})});
    document.getElementById('go').addEventListener('focus',()=>{shopSel=SHOP.length;card.querySelectorAll('.shop-row').forEach(r=>r.classList.remove('sel'))});
  }
  if(kind==='levels'){
    card.innerHTML=`<h1>${T('chooseLevel')}</h1><div class="lvl-grid">${levelNums().map(l=>`<button class="lvl-btn" data-l="${l}"><b>${T('levelName')(l)}</b><small>${T('lvl'+l+'Desc')}</small></button>`).join('')}</div>
      <div class="boss-row"><h2>${T('bossRow')}</h2><p>${T('bossRowDesc')}</p><div class="boss-btns">${levelNums().map(l=>`<button class="boss-btn" data-b="${l}">${T('bossShort')(l)}</button>`).join('')}</div></div>
      <div class="actions"><button class="ghost-btn" id="go">${T('back')}</button></div>`;
    card.querySelectorAll('.lvl-btn').forEach(b=>b.addEventListener('click',()=>startAtLevel(+b.dataset.l)));
    card.querySelectorAll('.boss-btn').forEach(b=>b.addEventListener('click',()=>startBoss(+b.dataset.b)));
    focusSel='.lvl-btn';
  }
  if(kind==='bye') card.innerHTML=`<h1>${T('byeTitle')}</h1><p>${T('byeText')}</p><div class="menu"><button class="cap-btn" id="go">${T('toMenu')}</button></div>`;
  if(kind==='next') card.innerHTML=`<h1>${T(nextKey()+'Title')}</h1><p>${T(nextKey()+'Text')}</p><p>${T(nextKey()+'Tip')}</p><div class="stats">${T('time')(fmt(runTime))}<br>${T('sporesGotL')(sporesGot)}<br>${T('secretsL')(secretsFound,secretZones.length)}</div><button class="cap-btn" id="go">${T('next')}</button>${isTouch?'':`<p class="shop-hint">${T('pressKey')}</p>`}`;
  if(kind==='win') card.innerHTML=`<h1>${T('winTitle')}</h1><p>${T('winText')}</p><div class="stats">${T('time')(fmt(runTime))}<br>${T('sporesGotL')(sporesGot)}<br>${T('secretsL')(secretsFound,secretZones.length)}</div><button class="cap-btn" id="go">${T('again')}</button>${isTouch?'':`<p class="shop-hint">${T('pressKey')}</p>`}`;
  document.getElementById('go').addEventListener('click',screenAction);
  const o=document.getElementById('opt'); if(o) o.addEventListener('click',()=>openSettings());
  const so=document.getElementById('sound'); if(so) so.addEventListener('click',()=>showScreen('sound'));
  const lv=document.getElementById('levels'); if(lv) lv.addEventListener('click',()=>showScreen('levels'));
  const qu=document.getElementById('quit'); if(qu) qu.addEventListener('click',()=>{try{window.close()}catch(e){}setTimeout(()=>{if(!window.closed)showScreen('bye')},150)});
  const tm=document.getElementById('tomenu'); if(tm) tm.addEventListener('click',toTitle);
  const r=document.getElementById('restart'); if(r) r.addEventListener('click',()=>restartLevel(SEED));
  const nm=document.getElementById('newmap'); if(nm) nm.addEventListener('click',()=>restartLevel((Math.random()*1e9)|0));
  if(kind==='shop') setTimeout(shopFocus,20);
  else setTimeout(()=>{const b=card.querySelector(focusSel);if(b&&!card.contains(document.activeElement))b.focus()},30);
}
function closeScreen(){for(const k in inp) inp[k]=0; jumpEdge=shootEdge=throwEdge=dashEdge=shopEdge=false; screen.classList.add('hidden'); last=performance.now()}
function openSettings(){settingsFrom=state==='play'?'play':'title';state='pause';showScreen('settings')}
function snapshotLevel(){levelSnap={hp:P.hp,maxhp:P.maxhp,mana:P.mana,spores,sporesGot,manaUps,shotLvl,hasCloak,hasUmbrella}}
function beginLevel(level,seed){startLevel(level,seed);snapshotLevel()}
function restartLevel(seed){
  const s=levelSnap; spores=s.spores;sporesGot=s.sporesGot;manaUps=s.manaUps;shotLvl=s.shotLvl;hasCloak=s.hasCloak;hasUmbrella=s.hasUmbrella;carry={hp:s.hp,maxhp:s.maxhp,mana:s.mana};
  startLevel(LEVEL,seed);if(s.boss)bossPrep();snapshotLevel();if(s.boss)levelSnap.boss=true;state='play';closeScreen();
}
const nextKey=()=>LEVEL===1?'next':'next'+(LEVEL+1);
// boss rush: start the level at the checkpoint and shop right before the boss, with 6 hearts and 200 spores
function bossPrep(){
  spores=200;P.maxhp=6;P.hp=6;
  const last=shops.reduce((a,q)=>!a||q.x>a.x?q:a,null);
  let c=null;for(const q of checks)if((!last||q.x<=last.x+2*TS)&&(!c||q.x>c.x))c=q;
  if(!c) return;
  for(const q of checks) if(q.x<=c.x) q.on=true;
  cp={x:c.x-P.w/2,y:c.y-P.h};P.x=cp.x;P.y=cp.y;P.vx=0;P.vy=0;P.inv=1;
  camX=clamp(P.x+P.w/2-VW/2,0,Math.max(0,COLS*TS-VW));camY=camTargetY();
}
function startBoss(l){
  initAudio(); if(AC&&AC.state==='suspended') AC.resume(); musicInit();
  newGame(); if(l>1) startLevel(l,(Math.random()*1e9)|0);
  bossPrep(); snapshotLevel(); levelSnap.boss=true; state='play'; closeScreen();
}
function toTitle(){state='title';newGame();showScreen('title')}
function startAtLevel(l){
  initAudio(); if(AC&&AC.state==='suspended') AC.resume(); musicInit();
  newGame(); if(l>1) startLevel(l,(Math.random()*1e9)|0);
  snapshotLevel(); state='play'; closeScreen();
}
// menus: arrows / WASD move the focus to the nearest control in that direction, Enter / Space / K / E press it
const NAV_DIRS={ArrowUp:[0,-1],KeyW:[0,-1],ArrowDown:[0,1],KeyS:[0,1],ArrowLeft:[-1,0],KeyA:[-1,0],ArrowRight:[1,0],KeyD:[1,0]};
function cardFocusables(){return [...card.querySelectorAll('button,input[type=range]')].filter(el=>el.offsetParent!==null&&!el.disabled)}
function menuNav(dx,dy){
  const els=cardFocusables(); if(!els.length) return;
  const cur=document.activeElement;
  if(!els.includes(cur)){const f=card.querySelector('.menu button,.lvl-btn,#go')||els[0];f.focus();sfx('select');return}
  const r=cur.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
  let best=null,bs=1e9;
  for(const el of els){ if(el===cur) continue;
    const q=el.getBoundingClientRect(),qx=q.left+q.width/2,qy=q.top+q.height/2;
    if(dy){ if(dy>0?q.top<r.bottom-4:q.bottom>r.top+4) continue;   // a row further up / down
      const s=Math.abs(qy-cy)+Math.abs(qx-cx)*1.5; if(s<bs){bs=s;best=el} }
    else{ if(q.bottom<=r.top+4||q.top>=r.bottom-4||(qx-cx)*dx<=4) continue;   // same row, that side
      const s=(qx-cx)*dx; if(s<bs){bs=s;best=el} } }
  if(!best&&dy){ // wrap around top <-> bottom
    const k=el=>{const q=el.getBoundingClientRect();return q.top*4+q.left*.01};
    const sorted=els.slice().sort((a,b)=>k(a)-k(b)); best=dy>0?sorted[0]:sorted[sorted.length-1]; if(best===cur) best=null }
  if(best){best.focus();sfx('select')}
  else if(dy) card.scrollBy({top:dy*80,behavior:'smooth'});
}
function menuKey(e){
  const d=NAV_DIRS[e.code], ae=document.activeElement, inCard=card.contains(ae)&&ae!==card;
  if(d){ e.preventDefault();
    if(inCard&&ae.type==='range'&&d[0]){ // left / right turn a volume slider
      const st=+ae.step||1;ae.value=clamp(+ae.value+d[0]*st,+ae.min,+ae.max);
      ae.dispatchEvent(new Event('input',{bubbles:true}));ae.dispatchEvent(new Event('change',{bubbles:true}));return}
    menuNav(d[0],d[1]); return }
  if(['Enter','Space','KeyK','KeyE','KeyZ','KeyX'].indexOf(e.code)>=0){ e.preventDefault(); if(e.repeat) return;
    if(inCard&&ae.tagName==='BUTTON'){ae.click();return}
    if(inCard&&ae.type==='range'){menuNav(0,1);return}
    const g=document.getElementById('go'); g&&g.click() }
}
function screenAction(){
  initAudio(); if(AC&&AC.state==='suspended') AC.resume(); musicInit();
  if(state==='title'&&subScreen){showScreen('title');return}
  if(state==='title'||state==='win'){newGame();snapshotLevel();state='play';closeScreen()}
  else if(state==='next'){beginLevel(LEVEL+1,(Math.random()*1e9)|0);state='play';closeScreen()}
  else if(state==='shop'){state='play';closeScreen()}
  else if(state==='pause'&&(subScreen==='sound'||subScreen==='controls')){const id=subScreen==='sound'?'sound':'ctrl';showScreen('settings');const b=document.getElementById(id);b&&setTimeout(()=>b.focus(),40)}
  else if(state==='pause'){
    if(settingsFrom==='play'){state='play';closeScreen()}
    else {state='title';showScreen('title')}
  }
}
function togglePause(){
  if(state==='title'&&subScreen){showScreen('title');return}
  if(state==='play'||state==='title') openSettings();
  else if(state==='pause'||state==='shop') screenAction();
}

