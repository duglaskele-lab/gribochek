function drawFrame(name,i,cx,by,face,alpha=1,sy=1){
  const f=FRAMES[name][i]; if(!f||!sheet.complete) return;
  const [fx,fy,fw,fh,ax]=f, s=SC*(ANIM_SCALE[name]||1);
  ctx.save(); ctx.globalAlpha=alpha; ctx.translate(cx,by); ctx.scale(face,sy);
  ctx.drawImage(sheet,fx,fy,fw,fh,-ax*s,-fh*s,fw*s,fh*s); ctx.restore();
}
function drawPlayer(){
  const p=P, cx=p.x+p.w/2, by=p.y+p.h+2;
  let alpha=p.alpha;
  if(p.inv>0&&!p.dead&&Math.floor(p.inv*16)%2) alpha*=.35;
  let n='idle',i=0,sy=1;
  p._fr=null;
  if(p.dead){ if(p.fell) return; n=p.deadT<.25?'hurt':'death'; i=0 }
  else if(p.entering){n='door';i=p.enterT<.35?0:1}
  else if(p.pickT>=0){const t=p.pickT; if(t<.15){n='pickup';i=0}else if(t<.35){n='pickup';i=1}else if(t<.55){n='pickup';i=2}else if(t<.8){n='special';i=1}else{n='special';i=2}}
  else if(p.heavyT>0){const e=HEAVY_T-p.heavyT; if(e<HEAVY_T*.68){n='fall';i=e<HEAVY_T*.34?0:1}else{n='land';i=0}}
  else if(p.dashT>0){n='run';i=1}
  else if(p.punchT>0){n='attack';i=p.punchT>PUNCH_ACTIVE[0]?0:1}
  else if(p.hurtT>0){n='hurt';i=Math.floor(time*8)%2}
  else if(!p.onGround){
    if(p.inWater){n='run';i=Math.floor(time*6)%4}
    else if(p.jumpT<.07){n='jump';i=0}
    else if(p.vy<-260){n='jump';i=1}
    else if(p.vy<260){n='jump';i=2}
    else {n='jump';i=3}
  }
  else if(p.landT>0){n='land';i=p.landT>.07?0:1}
  else if(p.atkT>0){n='attack';i=p.atkT>.1?0:1}
  else if(p.turnT>0){n='turn';i=0}
  else if(Math.abs(p.vx)>25){n='run';i=Math.floor(p.runPh)%4}
  else {n=p.power>1?'special':'idle';i=0;sy=1+Math.sin(time*4)*.018}
  if(p.power>1&&!p.dead&&Math.random()<.15) parts.push({x:cx+rand(-20,20),y:p.y+rand(0,20),vx:0,vy:-30,g:0,c:p.power>=3?'#ffd84a':'#ff5a4a',s:rand(4,6),life:.5,max:0,t:'star',rot:0});
  for(const g of ghosts){ctx.save();ctx.filter=g.cape?'sepia(1) saturate(4) hue-rotate(220deg) brightness(1.1)':'sepia(1) saturate(4) hue-rotate(-20deg) brightness(1.2)';drawFrame('run',1,g.x,g.y,g.face,g.life/.22*.45);ctx.restore()}
  if(p.glide&&!p.dead){n='jump';i=2}
  p._fr=[n,i,cx,by,p.face,alpha,sy];
  if(p.glide&&!p.dead) drawUmbrella(cx+p.face*4,p.y-16,alpha);   // behind her, so the shaft doesn't cross her face
  drawFrame(n,i,cx,by,p.face,alpha,sy);
}
function drawUmbrella(x,y,alpha){
  // a flat dome (70% of the old height) on a short shaft; the handle stays in the girl's hand
  const R=36,H=25;
  ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y+Math.sin(time*6)*1.5);ctx.rotate(Math.sin(time*3)*.06-P.vx/2500);
  ctx.strokeStyle=INK;ctx.lineCap='round';ctx.lineJoin='round';
  ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-H);ctx.lineTo(0,30);ctx.quadraticCurveTo(0,37,-6,35);ctx.stroke();
  const dome=()=>{ctx.beginPath();ctx.moveTo(-R,0);ctx.ellipse(0,0,R,H,0,Math.PI,0);
    for(let k=3;k>=0;k--){const xa=-R+k*R/2;ctx.quadraticCurveTo(xa+R/4,-6,xa,0)}ctx.closePath()};
  dome();ctx.fillStyle='#e33b2e';ctx.fill();
  ctx.save();dome();ctx.clip();ctx.fillStyle='#fff3e0';
  for(const k of [1,3]){const xa=-R+k*R/2;ctx.beginPath();ctx.moveTo(0,-H-4);ctx.lineTo(xa*1.15,4);ctx.lineTo((xa+R/2)*1.15,4);ctx.closePath();ctx.fill()}
  ctx.restore();
  ctx.lineWidth=2.6;dome();ctx.stroke();
  ctx.lineWidth=2;ctx.beginPath();for(const xa of [-R/2,0,R/2]){ctx.moveTo(0,-H);ctx.quadraticCurveTo(xa*.55,-H*.55,xa,-2)}ctx.stroke();
  ctx.fillStyle=INK;ctx.beginPath();ctx.arc(0,-H-3,3.2,0,7);ctx.fill();ctx.restore();
}
function banana(x,y,rot,s=1){
  ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.scale(s,s);
  ctx.fillStyle='#ffd84a';ctx.strokeStyle=INK;ctx.lineWidth=2.5;
  ctx.beginPath();ctx.moveTo(-12,-4);ctx.quadraticCurveTo(0,14,13,-5);ctx.quadraticCurveTo(0,5,-12,-4);ctx.fill();ctx.stroke();
  ctx.fillStyle=INK;ctx.fillRect(11,-8,4,4);ctx.restore();
}
function drawStar(x,y,r,rot){ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.fillStyle='#ffd84a';ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.beginPath();
  for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,rr=i%2?r*.45:r;ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)}ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()}
function mushroom(x,y,r,rot,red,gold){
  ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.strokeStyle=INK;ctx.lineWidth=2;
  ctx.fillStyle='#f5ecd8';ctx.beginPath();ctx.roundRect(-r*.35,-r*.1,r*.7,r*.9,3);ctx.fill();ctx.stroke();
  ctx.fillStyle=gold?'#f2b830':red?'#e33b2e':'#e0782a';ctx.beginPath();ctx.arc(0,0,r,Math.PI,0);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-r*.45,-r*.35,r*.16,0,7);ctx.arc(r*.3,-r*.55,r*.14,0,7);ctx.arc(r*.55,-r*.2,r*.1,0,7);ctx.fill();
  ctx.restore();
}
function sporeIcon(x,y,s,gold){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle=gold?'rgba(255,200,60,.45)':'rgba(255,220,110,.35)';ctx.beginPath();ctx.arc(0,0,gold?20:15,0,7);ctx.fill();
  ctx.fillStyle=gold?'#ffc12e':'#ffd36b';ctx.strokeStyle=INK;ctx.lineWidth=2.2;ctx.beginPath();ctx.arc(0,0,gold?11:8,0,7);ctx.fill();ctx.stroke();
  ctx.fillStyle='#e0922e';[[3,2],[-3,3],[1,-3]].forEach(([a,b])=>{ctx.beginPath();ctx.arc(a,b,1.5,0,7);ctx.fill()});
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-3,-3,2,0,7);ctx.fill();ctx.restore()}
function heart(x,y,s,colr='#ff5b6e',empty=false){
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.beginPath();ctx.moveTo(0,6);
  ctx.bezierCurveTo(-14,-4,-8,-14,0,-7);ctx.bezierCurveTo(8,-14,14,-4,0,6);
  ctx.fillStyle=empty?'rgba(255,255,255,.35)':colr;ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=2.2/s*1.3;ctx.stroke();
  if(!empty){ctx.fillStyle='rgba(255,255,255,.6)';ctx.beginPath();ctx.arc(-4,-5,2,0,7);ctx.fill()}ctx.restore();
}
