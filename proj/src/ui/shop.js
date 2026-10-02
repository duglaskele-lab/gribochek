/* ---------- shop ---------- */
const LOGO_SVG='<svg width="84" height="84" viewBox="0 0 40 40"><rect x="15" y="20" width="10" height="14" rx="3" fill="#f5ecd8" stroke="#2b1a12" stroke-width="2"/><path d="M4 22 A16 16 0 0 1 36 22 Z" fill="#e0782a" stroke="#2b1a12" stroke-width="2.5"/><circle cx="12" cy="15" r="2.8" fill="#fff"/><circle cx="22" cy="10" r="2.4" fill="#fff"/><circle cx="29" cy="17" r="2" fill="#fff"/></svg>';
const SPORE_SVG='<svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"><circle cx="11" cy="11" r="8" fill="#ffd36b" stroke="#2b1a12" stroke-width="2"/><circle cx="14" cy="13" r="1.6" fill="#e0922e"/><circle cx="8" cy="14" r="1.6" fill="#e0922e"/><circle cx="8" cy="8" r="2" fill="#fff"/></svg>';
const HEART_PATH='M20 33 C4 22 6 8 20 15 C34 8 36 22 20 33Z';
// shop icons: a five-pointed star (mana) and a small mushroom; filled with colour, or black outlines for 'not yet'
function starPath(cx,cy,r,fill,stroke='#2b1a12'){let d='';for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.45:r;d+=(i?'L':'M')+(cx+Math.cos(a)*rr).toFixed(1)+' '+(cy+Math.sin(a)*rr).toFixed(1)}
  return `<path d="${d}Z" fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>`}
// the mushroom-bunch upgrade: two mushrooms on a diagonal (bottom left, top right), then three in a triangle
// (two below, one on top). The same picture is the shop icon, the bought-marks and the HUD badge.
const SHOT_LAYOUT={2:[[1,17],[17,3]],3:[[1,17],[18,17],[9.5,2]]};
function shotsIcon(n,filled,size=40){return `<svg width="${size}" height="${size}" viewBox="0 0 40 40">${SHOT_LAYOUT[n].map(([x,y])=>mushSil(x,y,.55,filled?'#e33b2e':null)).join('')}</svg>`}
function mushSil(x,y,s,fill){const st=fill?'#f5ecd8':'none';return `<g transform="translate(${x} ${y}) scale(${s})"><rect x="15" y="20" width="10" height="14" rx="3" fill="${st}" stroke="#2b1a12" stroke-width="2.5"/><path d="M5 22 A15 15 0 0 1 35 22 Z" fill="${fill||'none'}" stroke="#2b1a12" stroke-width="3"/></g>`}
const SHOP=[
 {id:'heal',price:5,icon:`<svg width="40" height="40" viewBox="0 0 40 40"><path d="${HEART_PATH}" fill="#ff5b6e" stroke="#2b1a12" stroke-width="2.5"/></svg>`},
 {id:'maxhp',price:20,icon:`<svg width="40" height="40" viewBox="0 0 40 40"><path d="${HEART_PATH}" fill="#ff5b6e" stroke="#2b1a12" stroke-width="2.5"/><circle cx="31" cy="10" r="8" fill="#fff" stroke="#2b1a12" stroke-width="2"/><path d="M31 6v8M27 10h8" stroke="#2b1a12" stroke-width="2.5"/></svg>`},
 {id:'mush',price:15,icon:`<svg width="40" height="40" viewBox="0 0 40 40"><rect x="15" y="20" width="10" height="14" rx="3" fill="#f5ecd8" stroke="#2b1a12" stroke-width="2"/><path d="M5 22 A15 15 0 0 1 35 22 Z" fill="#e33b2e" stroke="#2b1a12" stroke-width="2.5"/><circle cx="13" cy="15" r="2.6" fill="#fff"/><circle cx="23" cy="11" r="2.2" fill="#fff"/><circle cx="28" cy="18" r="1.8" fill="#fff"/></svg>`},
 {id:'manaUp',price:25,icon:`<svg width="40" height="40" viewBox="0 0 40 40">${starPath(20,21,15,'#3b7fe0')}<circle cx="31" cy="10" r="8" fill="#fff" stroke="#2b1a12" stroke-width="2"/><path d="M31 6v8M27 10h8" stroke="#2b1a12" stroke-width="2.5"/></svg>`},
 {id:'shots',price:30,icon:shotsIcon(3,true)},
 {id:'cloak',price:50,icon:`<svg width="40" height="40" viewBox="0 0 40 40"><path d="M14 6 H26 L35 34 Q28 30 20 35 Q12 30 5 34Z" fill="#7a4ab8" stroke="#2b1a12" stroke-width="2.5" stroke-linejoin="round"/><path d="M14 6 Q20 13 26 6" fill="#5a3290" stroke="#2b1a12" stroke-width="2"/><circle cx="20" cy="11" r="2.6" fill="#f2b830" stroke="#2b1a12" stroke-width="1.5"/><path d="M15 20 L12 31 M25 20 L28 31" stroke="#5a3290" stroke-width="2"/></svg>`},
 {id:'umbrella',price:60,icon:`<svg width="40" height="40" viewBox="0 0 40 40"><path d="M3 20 A17 12 0 0 1 37 20 Q32 17 28.5 20 Q24 17 20 20 Q16 17 11.5 20 Q8 17 3 20Z" fill="#e33b2e" stroke="#2b1a12" stroke-width="2.5" stroke-linejoin="round"/><path d="M20 8 Q14 12 11.5 20 M20 8 Q26 12 28.5 20" fill="none" stroke="#fff3e0" stroke-width="2.5"/><path d="M20 20 V29 Q20 33 16 32" fill="none" stroke="#2b1a12" stroke-width="2.5" stroke-linecap="round"/></svg>`}];
const heartsSold=()=>Math.max(0,P.maxhp-HP_BASE), heartsMax=MAXHP_CAP-HP_BASE;
// acorn hearts get dearer with every one sold: 20, 25, 30, 35; the second mushroom upgrade (three at once) costs 60
const itemPrice=it=>it.id==='maxhp'?20+5*heartsSold():it.id==='shots'?(shotLvl>=2?60:30):it.price;
function soldOut(it){return (it.id==='maxhp'&&P.maxhp>=MAXHP_CAP)||(it.id==='manaUp'&&manaUps>=MANA_UPS)||(it.id==='shots'&&shotLvl>=3)||(it.id==='cloak'&&hasCloak)||(it.id==='umbrella'&&hasUmbrella)}
function shopBlock(it){
  if(it.id==='heal'&&P.hp>=P.maxhp) return 'fullHp';
  if(it.id==='maxhp'&&P.maxhp>=MAXHP_CAP) return 'maxHp';
  if(it.id==='mush'&&P.mana>=maxMana()) return 'fullMana';
  if(soldOut(it)) return 'owned';
  if(spores<itemPrice(it)) return 'noMoney';
  return '';
}
// how many of an upgrade are bought, shown on its card: empty hearts / black stars / mushroom outlines fill in
function shopProgress(it){
  const sp=(on,svg)=>`<span class="pip${on?' on':''}">${svg}</span>`;
  if(it.id==='maxhp') return Array.from({length:heartsMax},(_,i)=>sp(i<heartsSold(),`<svg width="22" height="22" viewBox="0 0 40 40"><path d="${HEART_PATH}" fill="${i<heartsSold()?'#ff5b6e':'none'}" stroke="#2b1a12" stroke-width="3.5"/></svg>`)).join('');
  if(it.id==='manaUp') return Array.from({length:MANA_UPS},(_,i)=>sp(i<manaUps,`<svg width="22" height="22" viewBox="0 0 40 40">${starPath(20,21,16,i<manaUps?'#3b7fe0':'#2b1a12')}</svg>`)).join('');
  if(it.id==='shots') return [2,3].map(n=>sp(shotLvl>=n,shotsIcon(n,shotLvl>=n,30))).join('');
  return '';
}
let shopSel=0;
function buy(id){
  const it=SHOP.find(i=>i.id===id); if(!it) return;
  if(shopBlock(it)){sfx('deny');return}
  spores-=itemPrice(it);
  if(id==='heal') P.hp=Math.min(P.maxhp,P.hp+1);
  if(id==='maxhp'){P.maxhp=Math.min(MAXHP_CAP,P.maxhp+1);P.hp++}
  if(id==='mush') P.mana=Math.min(maxMana(),P.mana+MANA_PICK);
  if(id==='manaUp'){manaUps++;P.mana+=MANA_UP}
  if(id==='shots') shotLvl=Math.min(3,shotLvl+1);
  if(id==='cloak') hasCloak=true;
  if(id==='umbrella') hasUmbrella=true;
  sfx(id==='mush'||id==='manaUp'||id==='shots'||id==='cloak'||id==='umbrella'?'power':'coin'); shopMsg=T('thanks');
  showScreen('shop');
}
function shopFocus(){
  const rows=[...card.querySelectorAll('.shop-row')], btns=[...rows.map(r=>r.querySelector('.buy')),document.getElementById('go')];
  shopSel=(shopSel+btns.length)%btns.length;
  rows.forEach((r,i)=>r.classList.toggle('sel',i===shopSel));
  btns[shopSel]&&btns[shopSel].focus();
}
function shopKey(e){
  const n=SHOP.length+1;
  // the grid has 3, 2 or 1 columns depending on the window, so arrows move by the actual layout
  const d=NAV_DIRS[e.code]; if(d){e.preventDefault();menuNav(d[0],d[1]);return}
  if(/^Digit[1-7]$/.test(e.code)&&!e.repeat){e.preventDefault();const i=+e.code.slice(5)-1;shopSel=i;buy(SHOP[i].id);return}
  if((e.code==='Enter'||e.code==='Space'||e.code==='KeyK'||e.code==='KeyE')&&!e.repeat){e.preventDefault();
    if(shopSel>=SHOP.length) screenAction(); else buy(SHOP[shopSel].id)}
}
function openShop(){state='shop';shopMsg='';shopSel=0;P.vx=0;for(const k in inp) inp[k]=0;showScreen('shop')}

