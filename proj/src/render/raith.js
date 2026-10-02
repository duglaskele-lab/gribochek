/* ---------- Raithwyn: drawing ---------- */
// Frames come from assets/raith.webp (see tools/raith_atlas.py). She is drawn 1.4 times as tall as the mushroom girl
// (standing frame against standing frame).
// No death frames: she laughs while a cloud of purple fog swallows her, then the fog shrinks to a point.
const raithSheet=new Image(); raithSheet.src=RAITH_SRC;
const RAITH_TALL=1.4, RAITH_SC=RAITH_TALL*FRAMES.idle[0][3]*SC*(ANIM_SCALE.idle||1)/RAITH_FRAMES.idle[0][3], RAITH_DEATH=1.6;
function drawRaithFrame(n,i,cx,by,face,alpha=1){
  const f=RAITH_FRAMES[n]&&RAITH_FRAMES[n][i]; if(!f||!raithSheet.complete) return;
  const [fx,fy,fw,fh,ax]=f, s=RAITH_SC;
  ctx.save(); ctx.globalAlpha=alpha; ctx.translate(cx,by); ctx.scale(face,1);
  ctx.drawImage(raithSheet,fx,fy,fw,fh,-ax*s,-fh*s,fw*s,fh*s); ctx.restore();
}
// which frame she shows now
function raithAnim(p){
  const st=HERO().strong;
  if(p.dead) return['laugh',Math.floor(p.deadT*8)%4];
  if(p.entering) return['walk',Math.floor(p.enterT*10)%8];
  if(p.pickT>=0) return['laugh',Math.floor(p.pickT*10)%4];
  if(p.dashT>0) return['run',Math.floor(time*26)%6];   // the dash: run frames played fast, with afterimages
  if(p.punchT>0){const dur=p.strong?st.t:PUNCH_T,k=clamp(1-p.punchT/dur,0,.999);return[p.strong?'punch2':'punch',Math.floor(k*5)]}
  if(p.hurtT>0) return['hurt',Math.floor(time*8)%2];
  if(p.inSand&&p.vy>=0) return Math.abs(p.vx)>25?['walk',Math.floor(time*9)%8]:['idle',0];
  if(!p.onGround){
    if(p.inWater) return['run',Math.floor(time*6)%6];
    if(p.jumpT<.07) return['jump',0];
    return['jump',p.vy<-260?1:p.vy<260?2:3];
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
  if(p.dead){ // laughing, she sinks into purple fog; then the fog shrinks to a point
    const t=p.deadT, grow=clamp(t/.7,0,1), shrink=clamp((t-.85)/(RAITH_DEATH-.85),0,1), R=70*grow*(1-shrink), fy=by-58*(1-shrink*.7);
    drawRaithFrame(n,i,cx,by,p.face,clamp(1-(t-.35)/.4,0,1));
    if(R>1){for(let k=0;k<7;k++){const a=time*1.6+k*0.9,rr=R*(.55+.25*Math.sin(time*3+k)),ox=Math.cos(a)*R*.35,oy=Math.sin(a*1.3)*R*.3;
        const g=ctx.createRadialGradient(cx+ox,fy+oy,0,cx+ox,fy+oy,rr);g.addColorStop(0,'rgba(120,60,190,.85)');g.addColorStop(.6,'rgba(150,90,220,.55)');g.addColorStop(1,'rgba(150,90,220,0)');
        ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx+ox,fy+oy,rr,0,7);ctx.fill()}
      if(Math.random()<.5)parts.push({x:cx+rand(-R,R)*.7,y:fy+rand(-R,R)*.6,vx:rand(-30,30),vy:rand(-40,10),g:0,c:'rgba(190,140,250,.8)',s:rand(4,9),life:.5,max:0,t:'puff'})}
    if(shrink>.9){ctx.fillStyle=`rgba(230,200,255,${(1-shrink)*10})`;ctx.beginPath();ctx.arc(cx,fy,3,0,7);ctx.fill()}
    return}
  drawRaithFrame(n,i,cx,by,p.face,alpha);
}
