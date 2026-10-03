/* ---------- Raithwyn: drawing ---------- */
// Frames come from assets/raith.webp (see tools/raith_atlas.py). She is drawn 1.4 times as tall as the mushroom girl
// (standing frame against standing frame).
// Death: she falls down (the death frames), a cloud of purple fog swallows her, then the fog shrinks to a point.
// Spells (L: hadoken, I: sphere) play their cast frames; the flying shots use the 'shots' frames (0: hadoken, 1: sphere).
const raithSheet=new Image(); raithSheet.src=RAITH_SRC;
// I turns a thin purple outline around her on and off (remembered). The outlined copy of the sheet is made once, when
// the sheet has loaded: her silhouette in purple, stamped in a ring around each pixel, softened, the sheet on top.
let raithOutline=false, raithOutlined=null;
try{raithOutline=localStorage.getItem('grib-raith-outline')==='1'}catch(e){}
const RAITH_OUTLINE_R=2.3, RAITH_OUTLINE_COL='#5a2d8a';   // radius in sheet pixels (about 1.4 px on screen)
function makeRaithOutlined(){
  const W=raithSheet.width,H=raithSheet.height, mk=()=>{const c=document.createElement('canvas');c.width=W;c.height=H;return c};
  const sil=mk(),sx=sil.getContext('2d'); sx.drawImage(raithSheet,0,0); sx.globalCompositeOperation='source-in'; sx.fillStyle=RAITH_OUTLINE_COL; sx.fillRect(0,0,W,H);
  const ring=mk(),rx=ring.getContext('2d');
  for(const [r,n] of [[RAITH_OUTLINE_R,16],[RAITH_OUTLINE_R*.5,8]]) for(let k=0;k<n;k++){const a=k/n*Math.PI*2;rx.drawImage(sil,Math.cos(a)*r,Math.sin(a)*r)}
  const out=mk(),ox=out.getContext('2d'); ox.filter='blur(.6px)'; ox.drawImage(ring,0,0); ox.drawImage(ring,0,0); ox.filter='none'; ox.drawImage(raithSheet,0,0);
  raithOutlined=out;
}
if(raithSheet.complete&&raithSheet.width) makeRaithOutlined(); else raithSheet.addEventListener('load',makeRaithOutlined);
function toggleRaithOutline(){
  raithOutline=!raithOutline; try{localStorage.setItem('grib-raith-outline',raithOutline?'1':'0')}catch(e){}
  if(hero==='raith'&&P) floater(P.x+P.w/2,P.y-30,T(raithOutline?'fOutlineOn':'fOutlineOff'));
}
const RAITH_TALL=1.4, RAITH_SC=RAITH_TALL*FRAMES.idle[0][3]*SC*(ANIM_SCALE.idle||1)/RAITH_FRAMES.idle[0][3], RAITH_DEATH=2.1;
function drawRaithFrame(n,i,cx,by,face,alpha=1){
  const f=RAITH_FRAMES[n]&&RAITH_FRAMES[n][i]; if(!f||!raithSheet.complete) return;
  const [fx,fy,fw,fh,ax]=f, s=RAITH_SC, d=RAITH_PAD;
  ctx.save(); ctx.globalAlpha=alpha; ctx.translate(cx,by); ctx.scale(face,1);
  if(raithOutline&&raithOutlined) ctx.drawImage(raithOutlined,fx-d,fy-d,fw+2*d,fh+2*d,(-ax-d)*s,(-fh-d)*s,(fw+2*d)*s,(fh+2*d)*s);
  else ctx.drawImage(raithSheet,fx,fy,fw,fh,-ax*s,-fh*s,fw*s,fh*s);
  ctx.restore();
}
// which frame she shows now
function raithAnim(p){
  if(p.dead) return['death',Math.min(5,Math.floor(p.deadT*7.5))];
  if(p.entering) return['door',Math.floor(p.enterT*7)%4];   // walking into the door, seen from the back
  if(p.dashT>0) return['run',2];   // the dash: one run frame (the third), with afterimages
  if(p.castT>0){const n=RAITH_FRAMES[p.cast].length;return[p.cast,Math.floor(clamp(1-p.castT/HERO()[p.cast].t,0,.999)*n)]}
  if(p.punchT>0) return[p.punchAnim||'punch',Math.floor(clamp(1-p.punchT/PUNCH_T,0,.999)*5)];
  if(p.hurtT>0) return['hurt',Math.floor(time*8)%2];
  if(p.inSand&&p.vy>=0) return Math.abs(p.vx)>25?['walk',Math.floor(time*9)%8]:['idle',0];
  if(!p.onGround){
    if(p.inWater) return['run',Math.floor(time*6)%6];
    if(p.jumpT<.07) return['jump',0];
    return['jump',p.vy<0?1:3];   // frame 2 (arms up at the top) is left out for now
  }
  if(p.landT>0) return['jump',4];
  if(Math.abs(p.vx)>25) return Math.abs(p.vx)<200?['walk',Math.floor(p.runPh*1.3)%8]:['run',Math.floor(p.runPh)%6];
  return['idle',0];
}
function drawRaith(p){
  const cx=p.x+p.w/2, by=p.y+p.h+2;
  let alpha=p.alpha;
  if(p.inv>0&&!p.dead&&Math.floor(p.inv*16)%2) alpha*=.35;
  for(const g of ghosts){if(g.hero!=='raith')continue;ctx.save();ctx.filter=g.cape?'sepia(1) saturate(4) hue-rotate(220deg) brightness(1.1)':'sepia(1) saturate(3) hue-rotate(230deg) brightness(1.3)';
    drawRaithFrame('run',2,g.x,g.y,g.face,g.life/.22*.45);ctx.restore()}
  if(p.dead&&p.fell) return;
  const [n,i]=raithAnim(p);
  p._fr=[n,i,cx,by,p.face,alpha,1,raithSheet,RAITH_FRAMES[n][i],RAITH_SC];
  if(p.dead){ // she falls down and purple fog swallows her; then the fog shrinks to a point
    const t=p.deadT, grow=clamp((t-.55)/.6,0,1), shrink=clamp((t-1.35)/(RAITH_DEATH-1.35),0,1), R=70*grow*(1-shrink), fx=cx+p.face*34*grow, fy=by-26-30*shrink;
    drawRaithFrame(n,i,cx,by,p.face,clamp(1-(t-1)/.35,0,1));
    if(R>1){for(let k=0;k<7;k++){const a=time*1.6+k*0.9,rr=R*(.55+.25*Math.sin(time*3+k)),ox=Math.cos(a)*R*.35,oy=Math.sin(a*1.3)*R*.3;
        const g=ctx.createRadialGradient(fx+ox,fy+oy,0,fx+ox,fy+oy,rr);g.addColorStop(0,'rgba(120,60,190,.85)');g.addColorStop(.6,'rgba(150,90,220,.55)');g.addColorStop(1,'rgba(150,90,220,0)');
        ctx.fillStyle=g;ctx.beginPath();ctx.arc(fx+ox,fy+oy,rr,0,7);ctx.fill()}
      if(Math.random()<.5)parts.push({x:fx+rand(-R,R)*.7,y:fy+rand(-R,R)*.6,vx:rand(-30,30),vy:rand(-40,10),g:0,c:'rgba(190,140,250,.8)',s:rand(4,9),life:.5,max:0,t:'puff'})}
    if(shrink>.9){ctx.fillStyle=`rgba(230,200,255,${(1-shrink)*10})`;ctx.beginPath();ctx.arc(fx,fy,3,0,7);ctx.fill()}
    return}
  drawRaithFrame(n,i,cx,by,p.face,alpha);
}
// her flying spells (core/projectiles.js updateSpells): the sprite centred on the shot, a purple glow around it
function drawSpells(){
  for(const s of spells){
    const f=RAITH_FRAMES.shots[s.k==='hadoken'?0:1], [fx,fy,fw,fh]=f, sc=RAITH_SC*(s.k==='sphere'?1+.08*Math.sin(time*18):1);
    const g=ctx.createRadialGradient(s.x,s.y,0,s.x,s.y,s.r*2.2);g.addColorStop(0,'rgba(190,130,255,.45)');g.addColorStop(1,'rgba(190,130,255,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(s.x,s.y,s.r*2.2,0,7);ctx.fill();
    if(!raithSheet.complete) continue;
    ctx.save();ctx.translate(s.x,s.y);ctx.scale(s.face,1);
    // the ball's bright core (in sheet pixels) sits on the shot's point; the hadoken's flame trails behind it
    const [kx,ky]=s.k==='hadoken'?[45,31]:[32,30];
    ctx.drawImage(raithSheet,fx,fy,fw,fh,-kx*sc,-ky*sc,fw*sc,fh*sc);ctx.restore();
  }
}
