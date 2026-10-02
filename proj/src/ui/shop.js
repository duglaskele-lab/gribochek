/* ---------- shop ---------- */
const LOGO_SVG='<svg width="84" height="84" viewBox="0 0 40 40"><rect x="15" y="20" width="10" height="14" rx="3" fill="#f5ecd8" stroke="#2b1a12" stroke-width="2"/><path d="M4 22 A16 16 0 0 1 36 22 Z" fill="#e0782a" stroke="#2b1a12" stroke-width="2.5"/><circle cx="12" cy="15" r="2.8" fill="#fff"/><circle cx="22" cy="10" r="2.4" fill="#fff"/><circle cx="29" cy="17" r="2" fill="#fff"/></svg>';
const SPORE_SVG='<svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"><circle cx="11" cy="11" r="8" fill="#ffd36b" stroke="#2b1a12" stroke-width="2"/><circle cx="14" cy="13" r="1.6" fill="#e0922e"/><circle cx="8" cy="14" r="1.6" fill="#e0922e"/><circle cx="8" cy="8" r="2" fill="#fff"/></svg>';
const HEART_PATH='M20 33 C4 22 6 8 20 15 C34 8 36 22 20 33Z';
const SHOP=[
 {id:'heal',price:5,icon:`<svg width="40" height="40" viewBox="0 0 40 40"><path d="${HEART_PATH}" fill="#ff5b6e" stroke="#2b1a12" stroke-width="2.5"/></svg>`},
 {id:'maxhp',price:20,icon:`<svg width="40" height="40" viewBox="0 0 40 40"><path d="${HEART_PATH}" fill="#ff5b6e" stroke="#2b1a12" stroke-width="2.5"/><circle cx="31" cy="10" r="8" fill="#fff" stroke="#2b1a12" stroke-width="2"/><path d="M31 6v8M27 10h8" stroke="#2b1a12" stroke-width="2.5"/></svg>`},
 {id:'power',price:10,icon:`<svg width="40" height="40" viewBox="0 0 40 40"><rect x="15" y="20" width="10" height="14" rx="3" fill="#f5ecd8" stroke="#2b1a12" stroke-width="2"/><path d="M5 22 A15 15 0 0 1 35 22 Z" fill="#e33b2e" stroke="#2b1a12" stroke-width="2.5"/><circle cx="13" cy="15" r="2.6" fill="#fff"/><circle cx="23" cy="11" r="2.2" fill="#fff"/><circle cx="28" cy="18" r="1.8" fill="#fff"/></svg>`},
 {id:'bag',price:40,icon:`<svg width="40" height="40" viewBox="0 0 40 40"><path d="M8 16 Q20 8 32 16 L30 34 Q20 38 10 34Z" fill="#b8834f" stroke="#2b1a12" stroke-width="2.5"/><path d="M14 16 Q20 4 26 16" fill="none" stroke="#2b1a12" stroke-width="2.5"/><path d="M13 26 A7 7 0 0 1 27 26 Z" fill="#f2b830" stroke="#2b1a12" stroke-width="2"/></svg>`},
 {id:'cloak',price:50,icon:`<svg width="40" height="40" viewBox="0 0 40 40"><path d="M14 6 H26 L35 34 Q28 30 20 35 Q12 30 5 34Z" fill="#7a4ab8" stroke="#2b1a12" stroke-width="2.5" stroke-linejoin="round"/><path d="M14 6 Q20 13 26 6" fill="#5a3290" stroke="#2b1a12" stroke-width="2"/><circle cx="20" cy="11" r="2.6" fill="#f2b830" stroke="#2b1a12" stroke-width="1.5"/><path d="M15 20 L12 31 M25 20 L28 31" stroke="#5a3290" stroke-width="2"/></svg>`},
 {id:'umbrella',price:60,icon:`<svg width="40" height="40" viewBox="0 0 40 40"><path d="M3 20 A17 12 0 0 1 37 20 Q32 17 28.5 20 Q24 17 20 20 Q16 17 11.5 20 Q8 17 3 20Z" fill="#e33b2e" stroke="#2b1a12" stroke-width="2.5" stroke-linejoin="round"/><path d="M20 8 Q14 12 11.5 20 M20 8 Q26 12 28.5 20" fill="none" stroke="#fff3e0" stroke-width="2.5"/><path d="M20 20 V29 Q20 33 16 32" fill="none" stroke="#2b1a12" stroke-width="2.5" stroke-linecap="round"/></svg>`}];
const heartsSold=()=>Math.max(0,P.maxhp-HP_BASE), heartsMax=MAXHP_CAP-HP_BASE;
// acorn hearts get dearer with every one sold: 20, 25, 30, 35
const itemPrice=it=>it.id==='maxhp'?20+5*heartsSold():it.price;
function soldOut(it){return (it.id==='maxhp'&&P.maxhp>=MAXHP_CAP)||(it.id==='bag'&&hasBag)||(it.id==='cloak'&&hasCloak)||(it.id==='umbrella'&&hasUmbrella)}
function shopBlock(it){
  if(it.id==='heal'&&P.hp>=P.maxhp) return 'fullHp';
  if(it.id==='maxhp'&&P.maxhp>=MAXHP_CAP) return 'maxHp';
  if(it.id==='power'&&P.power>=powerCap()) return 'maxPower';
  if(soldOut(it)) return 'owned';
  if(spores<itemPrice(it)) return 'noMoney';
  return '';
}
let shopSel=0;
function buy(id){
  const it=SHOP.find(i=>i.id===id); if(!it) return;
  if(shopBlock(it)){sfx('deny');return}
  spores-=itemPrice(it);
  if(id==='heal') P.hp=Math.min(P.maxhp,P.hp+1);
  if(id==='maxhp'){P.maxhp=Math.min(MAXHP_CAP,P.maxhp+1);P.hp++}
  if(id==='power') P.power=Math.min(powerCap(),P.power+1);
  if(id==='bag') hasBag=true;
  if(id==='cloak') hasCloak=true;
  if(id==='umbrella') hasUmbrella=true;
  sfx(id==='power'||id==='bag'||id==='cloak'||id==='umbrella'?'power':'coin'); shopMsg=T('thanks');
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
  if(/^Digit[1-6]$/.test(e.code)&&!e.repeat){e.preventDefault();const i=+e.code.slice(5)-1;shopSel=i;buy(SHOP[i].id);return}
  if((e.code==='Enter'||e.code==='Space'||e.code==='KeyK'||e.code==='KeyE')&&!e.repeat){e.preventDefault();
    if(shopSel>=SHOP.length) screenAction(); else buy(SHOP[shopSel].id)}
}
function openShop(){state='shop';shopMsg='';shopSel=0;P.vx=0;for(const k in inp) inp[k]=0;showScreen('shop')}

