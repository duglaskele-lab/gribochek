/* ---------- input ---------- */
const inp={l:0,r:0,j:0,s:0,m:0,d:0,dash:0,shop:0};
let jumpEdge=false, shootEdge=false, throwEdge=false, dashEdge=false, shopEdge=false;
const KEYMAP={ArrowLeft:'l',KeyA:'l',ArrowRight:'r',KeyD:'r',ArrowDown:'d',KeyS:'d',
  Space:'j',KeyZ:'j',ArrowUp:'j',KeyW:'j',KeyK:'s',KeyX:'s',KeyL:'m',KeyC:'m',ShiftLeft:'dash',KeyE:'shop'};   // m: throw a mushroom
let state='title', screenShownAt=0;
addEventListener('keydown',e=>{
  document.body.classList.add('kbd');
  if(e.code==='Escape'||e.code==='KeyP'){e.preventDefault();togglePause();return}
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
  if(a==='dash'&&!inp.dash) dashEdge=true;
  if(a==='shop'||a==='d') shopEdge=true;
  inp[a]=1;
});
addEventListener('pointerdown',()=>document.body.classList.remove('kbd'),true);
addEventListener('keyup',e=>{const a=KEYMAP[e.code]; if(a){inp[a]=0;e.preventDefault()}});
addEventListener('blur',()=>{for(const k in inp)inp[k]=0; if(state==='play')togglePause()});

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
    if(key==='j'&&!inp.j) jumpEdge=true; if(key==='s'&&!inp.s) shootEdge=true; if(key==='m'&&!inp.m) throwEdge=true; if(key==='dash'&&!inp.dash) dashEdge=true; inp[key]=1; el.classList.add('on')});
  ['pointerup','pointercancel','lostpointercapture'].forEach(t=>el.addEventListener(t,()=>{inp[key]=0;el.classList.remove('on')}));
}
holdBtn(document.getElementById('bj'),'j'); holdBtn(document.getElementById('bs'),'s'); holdBtn(document.getElementById('bm'),'m'); holdBtn(document.getElementById('bd'),'dash');
document.getElementById('bshop').addEventListener('pointerdown',e=>{e.preventDefault();if(state==='play'&&nearShop)openShop()});
document.getElementById('bp').addEventListener('pointerdown',e=>{e.preventDefault();togglePause()});

