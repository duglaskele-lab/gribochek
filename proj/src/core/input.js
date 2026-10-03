/* ---------- input ---------- */
const inp={l:0,r:0,j:0,s:0,m:0,i:0,d:0,dash:0,shop:0};
let jumpEdge=false, shootEdge=false, throwEdge=false, magicEdge=false, dashEdge=false, shopEdge=false;
const KEYMAP={ArrowLeft:'l',KeyA:'l',ArrowRight:'r',KeyD:'r',ArrowDown:'d',KeyS:'d',
  Space:'j',KeyZ:'j',ArrowUp:'j',KeyW:'j',KeyK:'s',KeyX:'s',KeyL:'m',KeyC:'m',ShiftLeft:'dash',KeyE:'shop',KeyJ:'i'};   // m: throw a mushroom (Raithwyn: hadoken); i: Raithwyn's sphere (J)
let state='title', screenShownAt=0;
// F1: freeze the game where it is (no menu, the picture stays still - e.g. for a screenshot); F1 again goes on.
// Esc while frozen opens the usual pause menu.
let frozen=false;
addEventListener('keydown',e=>{
  document.body.classList.add('kbd');
  if(e.code==='F1'){e.preventDefault();if(state==='play'&&!e.repeat){frozen=!frozen;for(const k in inp)inp[k]=0}return}
  if(e.code==='Escape'||e.code==='KeyP'){e.preventDefault();frozen=false;togglePause();return}
  if(frozen&&state==='play'){e.preventDefault();return}
  if(state==='shop'){shopKey(e);return}
  if(state==='next'||state==='win'){ // dialog after a boss: any confirm key continues
    if(['Enter','Space','KeyK','KeyE','KeyZ','KeyX'].indexOf(e.code)>=0&&!e.repeat){e.preventDefault();if(performance.now()-screenShownAt>350){const g=document.getElementById('go');g&&g.click()}}
    return }
  if(state!=='play'){menuKey(e);return}
  const a=KEYMAP[e.code]; if(!a) return; e.preventDefault();
  if(e.repeat) return;
  if(a==='j'&&!inp.j) jumpEdge=true;
  if(a==='s'&&!inp.s) shootEdge=true;
  if(a==='m'&&!inp.m) throwEdge=true;
  if(a==='i'&&!inp.i) magicEdge=true;
  if(a==='dash'&&!inp.dash) dashEdge=true;
  if(a==='shop'||a==='d') shopEdge=true;
  inp[a]=1;
});
addEventListener('pointerdown',()=>document.body.classList.remove('kbd'),true);
addEventListener('keyup',e=>{const a=KEYMAP[e.code]; if(a){inp[a]=0;e.preventDefault()}});
addEventListener('blur',()=>{for(const k in inp)inp[k]=0; if(state==='play'&&!frozen)togglePause()});   // frozen: stay as is (taking a screenshot)

const isTouch=matchMedia('(pointer:coarse)').matches||'ontouchstart' in window;
if(isTouch) document.body.classList.add('touch');
const pad=document.getElementById('pad'), padPtrs=new Map();
function padUpdate(){
  let l=0,r=0; const rc=pad.getBoundingClientRect();
  for(const x of padPtrs.values()){ if(x<rc.left+rc.width/2) l=1; else r=1; }
  inp.l=l; inp.r=r; pad.classList.toggle('on',!!(l||r));
}
pad.addEventListener('pointerdown',e=>{e.preventDefault();pad.setPointerCapture(e.pointerId);padPtrs.set(e.pointerId,e.clientX);padUpdate()});
pad.addEventListener('pointermove',e=>{if(padPtrs.has(e.pointerId)){padPtrs.set(e.pointerId,e.clientX);padUpdate()}});
['pointerup','pointercancel','lostpointercapture'].forEach(t=>pad.addEventListener(t,e=>{padPtrs.delete(e.pointerId);padUpdate()}));
function holdBtn(el,key){
  el.addEventListener('pointerdown',e=>{e.preventDefault();el.setPointerCapture(e.pointerId);
    if(key==='j'&&!inp.j) jumpEdge=true; if(key==='s'&&!inp.s) shootEdge=true; if(key==='m'&&!inp.m) throwEdge=true; if(key==='i'&&!inp.i) magicEdge=true; if(key==='dash'&&!inp.dash) dashEdge=true; inp[key]=1; el.classList.add('on')});
  ['pointerup','pointercancel','lostpointercapture'].forEach(t=>el.addEventListener(t,()=>{inp[key]=0;el.classList.remove('on')}));
}
holdBtn(document.getElementById('bj'),'j'); holdBtn(document.getElementById('bs'),'s'); holdBtn(document.getElementById('bm'),'m'); holdBtn(document.getElementById('bd'),'dash'); holdBtn(document.getElementById('bi'),'i');
document.getElementById('bshop').addEventListener('pointerdown',e=>{e.preventDefault();if(state==='play'&&nearShop)openShop()});
document.getElementById('bp').addEventListener('pointerdown',e=>{e.preventDefault();togglePause()});

