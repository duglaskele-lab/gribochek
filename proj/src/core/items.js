/* ---------- spores: never inside floors or planks, and a quarter fewer of them ---------- */
function sporeBlocked(x,y){
  for(const [dx,dy] of [[0,0],[-9,-9],[9,-9],[-9,9],[9,9]]){const px=x+dx,py=y+dy,c=Math.floor(px/TS),r=Math.floor(py/TS),t=tile(c,r);
    if(isSolidT(t)||t===T_THORN||t===T_SAND) return true;
    if(t===T_PLANK&&py-r*TS<18) return true}
  for(const pl of plats) if(!(pl.vx||pl.vy)&&x+9>pl.x&&x-9<pl.x+pl.w&&y+9>pl.y&&y-9<pl.y+(pl.h||16)) return true;
  return false;
}
function tidyItems(){
  // push anything stuck in a platform upwards; drop spores that cannot be freed
  for(const it of items){ if(!sporeBlocked(it.x,it.y)) continue;
    let ok=false;for(let up=6;up<=(it.k==='spore'?90:200);up+=6) if(!sporeBlocked(it.x,it.y-up)){it.y-=up;ok=true;break}
    if(!ok&&it.k==='spore') it.taken=true }
  items=items.filter(i=>!i.taken);
  // thin out by 25%: spores come in rows and arcs, so trim each group from its ends
  const sp=items.filter(i=>i.k==='spore'),drop=new Set();let carry=0,g=[];
  const flush=()=>{if(!g.length)return;const want=g.length*.25+carry,m=Math.floor(want);carry=want-m;
    let a=0,b=g.length-1;for(let k=0;k<m&&a<=b;k++){if(k%2===0)drop.add(g[b--]);else drop.add(g[a++])}g=[]};
  for(const s of sp){const l=g[g.length-1];if(l&&Math.hypot(s.x-l.x,s.y-l.y)>72)flush();g.push(s)}flush();
  items=items.filter(i=>!drop.has(i));
}
function springCheck(dt){
  const p=P;if(p.dead||p.entering||p.vy<0)return;
  for(const s of springs){ if(p.x+p.w>s.x+8&&p.x<s.x+s.w-8&&p.y+p.h>=s.y&&p.y+p.h<=s.gy+1&&p.prevBottom<=s.gy+1){
    p.vy=-1180;p.springT=.55;p.onGround=false;p.ride=null;p.bounced=true;p.airDash=airDashMax();p.buffer=0;p.jumpT=0;p.heavyT=0;p.lockT=0;
    s.sq=.3;sfx('jump');tone(300,900,.18,'triangle',.05);stars(s.x+s.w/2,s.y,6);break}}
  for(const s of springs) if(s.sq>0) s.sq-=dt;
}
function revealPlanks(){
  const p=P,c0=Math.floor(p.x/TS)-2,c1=Math.floor((p.x+p.w)/TS)+2,r0=Math.max(0,Math.floor(p.y/TS)-2),r1=Math.min(ROWS-1,Math.floor((p.y+p.h)/TS)+2);
  for(let r=r0;r<=r1;r++)for(let c=c0;c<=c1;c++) if(tile(c,r)===T_PLANK&&flow[r][c]===6){
    let a=c;while(tile(a-1,r)===T_PLANK&&flow[r][a-1]===6)a--;
    for(let k=a;tile(k,r)===T_PLANK&&flow[r][k]===6;k++){flow[r][k]=0;stars(k*TS+TS/2,r*TS+6,3)}
    sfx('select')}
}
function drawFlower(x,y,s){
  const sw=Math.sin(time*2+x*.07)*2,hh=14+s*10,cx=x+sw,cy=y-hh;
  ctx.strokeStyle=INK;ctx.lineWidth=3.5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x,y-hh*.5,cx,cy);ctx.stroke();
  ctx.strokeStyle='#5d8a38';ctx.lineWidth=1.8;ctx.stroke();
  ctx.fillStyle='#5d8a38';ctx.beginPath();ctx.ellipse(x+4,y-hh*.35,4,2,-.6,0,7);ctx.fill();
  const pc=['#ff7aa8','#ffd84a','#b89aff','#fff4e0'][s*4|0];ctx.fillStyle=pc;ctx.lineWidth=1.5;
  for(let k=0;k<5;k++){const a=k/5*Math.PI*2+s*3;ctx.beginPath();ctx.ellipse(cx+Math.cos(a)*4.5,cy+Math.sin(a)*4.5,3.6,2.6,a,0,7);ctx.fill();ctx.stroke()}
  ctx.fillStyle='#f2a93b';ctx.beginPath();ctx.arc(cx,cy,2.6,0,7);ctx.fill();ctx.stroke();
}
function drawShrooms(x,y,s){
  ctx.strokeStyle=INK;ctx.lineWidth=2;
  for(const [dx,h,r,c] of [[-5,11,6,s>.5?'#c0392b':'#9c6b3f'],[5,7,4.5,'#b8834f']]){
    ctx.fillStyle='#f5ecd8';ctx.fillRect(x+dx-1.8,y-h,3.6,h);ctx.strokeRect(x+dx-1.8,y-h,3.6,h);
    ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(x+dx,y-h,r,r*.7,0,Math.PI,0);ctx.closePath();ctx.fill();ctx.stroke();
    if(c==='#c0392b'){ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x+dx-2,y-h-2.5,1.2,0,7);ctx.arc(x+dx+2,y-h-1.5,1,0,7);ctx.fill()}}
}
function drawRock(x,y,s){
  const w=9+s*8,h=6+s*6,d=BIOME==='desert';ctx.strokeStyle=INK;ctx.lineWidth=2.5;
  ctx.fillStyle=d?'#c49a5c':'#a09a8e';ctx.beginPath();ctx.moveTo(x-w,y+1);ctx.quadraticCurveTo(x-w,y-h,x-w*.2,y-h*1.2);ctx.quadraticCurveTo(x+w,y-h,x+w,y+1);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle=d?'#dcb57a':'#c2bcb0';ctx.beginPath();ctx.ellipse(x-w*.35,y-h*.6,w*.3,h*.25,-.3,0,7);ctx.fill();
  if(!d&&s>.6){ctx.fillStyle='#79ab4c';ctx.beginPath();ctx.ellipse(x+w*.2,y-h*.95,w*.45,h*.28,0,Math.PI,0);ctx.fill()}
}
function drawBones(x,y,s){
  ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.fillStyle='#f0e6cc';
  ctx.save();ctx.translate(x+8,y-2);ctx.rotate(s-.5);ctx.beginPath();ctx.roundRect(-9,-2,18,4,2);ctx.fill();ctx.stroke();
  for(const e of [-9,9]){ctx.beginPath();ctx.arc(e,-2,2.6,0,7);ctx.arc(e,2,2.6,0,7);ctx.fill();ctx.stroke()}ctx.restore();
  ctx.beginPath();ctx.moveTo(x-14,y);ctx.quadraticCurveTo(x-15,y-15,x-6,y-15);ctx.quadraticCurveTo(x+2,y-14,x+1,y);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle=INK;ctx.beginPath();ctx.arc(x-9,y-8,2.4,0,7);ctx.arc(x-3,y-8,2.2,0,7);ctx.fill();ctx.fillRect(x-7,y-3,1.5,3);ctx.fillRect(x-4,y-3,1.5,3);
}
function drawDCactus(x,y,s){
  const h=20+s*14;ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.fillStyle='#7fae55';
  ctx.beginPath();ctx.roundRect(x-5,y-h,10,h+1,5);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.roundRect(x-13,y-h*.7,7,h*.35,3.5);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(x-9,y-h*.4);ctx.lineTo(x-5,y-h*.4);ctx.stroke();
  if(s>.4){ctx.beginPath();ctx.roundRect(x+6,y-h*.8,7,h*.3,3.5);ctx.fill();ctx.stroke()}
  ctx.strokeStyle='rgba(43,26,18,.45)';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x,y-h+4);ctx.lineTo(x,y-2);ctx.stroke();
  if(s>.7){ctx.fillStyle='#ff7aa8';ctx.beginPath();ctx.arc(x,y-h-2,3.5,0,7);ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=1.5;ctx.stroke()}
}
function drawDGrass(x,y,s){
  const n=3+(s*3|0),sw=Math.sin(time*1.3+x*.05)*2;ctx.lineCap='round';ctx.beginPath();
  for(let i=0;i<n;i++){const bx=x-8+i*16/(n-1),h=7+hash(i,x|0)*9;ctx.moveTo(bx,y+1);ctx.quadraticCurveTo(bx+sw*.4,y-h*.5,bx+sw+(i-n/2)*3,y-h)}
  ctx.strokeStyle='#8a5a2a';ctx.lineWidth=3;ctx.stroke();ctx.strokeStyle='#e0c070';ctx.lineWidth=1.3;ctx.stroke();
}
function drawTent(x,y,s){
  const w=58,h=52,d=BIOME==='desert';ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.lineJoin='round';
  ctx.fillStyle=d?'#e8d2a0':'#b8a06a';ctx.beginPath();ctx.moveTo(x-w,y);ctx.lineTo(x,y-h);ctx.lineTo(x+w,y);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle=d?'#c0392b':'#6f4a2a';ctx.beginPath();ctx.moveTo(x-w*.62,y-h*.38);ctx.lineTo(x-w*.4,y-h*.6);ctx.lineTo(x+w*.4,y-h*.6);ctx.lineTo(x+w*.62,y-h*.38);ctx.closePath();ctx.fill();
  ctx.fillStyle='#2b1a12';ctx.beginPath();ctx.moveTo(x-14,y);ctx.lineTo(x,y-h*.72);ctx.lineTo(x+14,y);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y-h);ctx.lineTo(x,y-h-12);ctx.stroke();
  ctx.fillStyle=d?'#f2c94c':'#d8452f';ctx.beginPath();ctx.moveTo(x,y-h-12);ctx.lineTo(x+14,y-h-8+Math.sin(time*4)*2);ctx.lineTo(x,y-h-4);ctx.closePath();ctx.fill();ctx.lineWidth=2;ctx.stroke();
}
function drawPalm(x,y,s){
  const H=130+s*50,lean=(s-.5)*60,tx=x+lean,ty=y-H;ctx.lineJoin='round';ctx.lineCap='round';
  ctx.strokeStyle=INK;ctx.lineWidth=16;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+lean*.1,y-H*.5,tx,ty);ctx.stroke();
  ctx.strokeStyle='#a07a4a';ctx.lineWidth=10;ctx.stroke();
  ctx.strokeStyle='rgba(43,26,18,.45)';ctx.lineWidth=2;for(let k=1;k<9;k++){const t=k/9,px=x+(lean*.1)*2*t*(1-t)+lean*t*t,py=y-H*t;ctx.beginPath();ctx.moveTo(px-5,py);ctx.lineTo(px+5,py-3);ctx.stroke()}
  for(let k=0;k<6;k++){const a=-Math.PI/2+(k-2.5)*.55+Math.sin(time*1.2+k)*.05,len=60+hash(k,x|0)*20,ex=tx+Math.cos(a)*len*1.3,ey=ty+Math.sin(a)*len*.4+26;
    ctx.fillStyle=k%2?'#4f8a3a':'#6aa84a';ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(tx,ty);
    ctx.quadraticCurveTo((tx+ex)/2,ty+Math.sin(a)*len*.7-10,ex,ey);ctx.quadraticCurveTo((tx+ex)/2,ty+Math.sin(a)*len*.4+6,tx,ty);ctx.fill();ctx.stroke()}
  ctx.fillStyle='#6b4a2a';for(const d of [-6,5]){ctx.beginPath();ctx.arc(tx+d,ty+8,5,0,7);ctx.fill();ctx.stroke()}
}
// bouncy mushroom
function drawSpring(sp){
  const k=sp.sq>0?Math.sin(sp.sq/.3*Math.PI):0,cx=sp.x+sp.w/2,gy=sp.gy,cy=sp.y+6+k*9,d=BIOME==='desert';
  ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.lineJoin='round';
  ctx.fillStyle='#f5ecd8';ctx.beginPath();ctx.roundRect(cx-8,cy,16,gy-cy+1,5);ctx.fill();ctx.stroke();
  ctx.fillStyle=d?'#9a5ad0':'#e0473a';ctx.beginPath();ctx.moveTo(cx-sp.w/2-2-k*6,cy+4);ctx.quadraticCurveTo(cx,cy-30+k*14,cx+sp.w/2+2+k*6,cy+4);ctx.quadraticCurveTo(cx,cy+10,cx-sp.w/2-2-k*6,cy+4);ctx.fill();ctx.stroke();
  ctx.fillStyle='#fff';for(const [dx,dy,r] of [[-12,-4,4],[2,-10,5],[13,-2,3.5]]){ctx.beginPath();ctx.arc(cx+dx*(1+k*.2),cy+dy*(1-k*.4),r,0,7);ctx.fill()}
  if(!(sp.sq>0)&&Math.random()<.008) stars(cx,cy-16,1);
}
function maskPop(e){const dx=P.x+P.w/2-e.bx;e.state='leap';e.shot=false;e.vy=-560;e.vx=clamp(dx*.12,-50,50);e.onGround=false;e.face=Math.sign(dx)||e.face;leafBurst(e.bx,e.by-20,12);sfx('rustle')}
function leafBurst(x,y,n){for(let i=0;i<n;i++)parts.push({x:x+rand(-18,18),y:y+rand(-12,8),vx:rand(-160,160),vy:rand(-300,-80),g:700,c:Math.random()<.5?'#4f8240':'#6fa04a',s:rand(3,6),life:rand(.4,.8),max:0,t:'dot'})}
function frogTongue(e){const cx=e.x+e.w/2,by=e.y+e.h;return e.face>0?{x:cx+16,y:by-18,w:e.tl+10,h:16}:{x:cx-26-e.tl,y:by-18,w:e.tl+10,h:16}}
// barrels, crates and lizard huts: wooden bits fly, loot drops
function breakProp(e){
  const cx=e.x+e.w/2,cy=e.y+e.h/2,hut=e.type==='lizHut',cols=e.type==='pot'?['#c8743a','#a85a2a','#f0d493','#8a4a2a']:['#9a6a3c','#b8834f','#6b4a2a',hut?'#a8904a':'#8a949b'];
  sfx('crack');shake(hut?.35:.1,hut?8:3);hitstop=Math.max(hitstop,.03);
  for(let i=0;i<(hut?28:12);i++)parts.push({x:cx+rand(-e.w/2,e.w/2),y:cy+rand(-e.h/2,e.h/2),vx:rand(-260,260),vy:rand(-440,-120),g:1300,c:cols[Math.random()*4|0],s:rand(4,8),life:rand(.5,.9),max:0,t:'dot'});
  dust(cx,e.y+e.h,6);
  const drop=(k,vx)=>items.push({k,x:cx+rand(-8,8),y:cy,ph:0,vy:-rand(280,420),vx,drop:true,loot:k==='spore'});
  // spore drops are 40% rarer than they used to be: each spore only rolls a 60% chance
  if(hut){if(Math.random()<.6)drop('gold',0);if(Math.random()<.5)drop('heart',50);for(let i=0;i<4;i++)if(Math.random()<.6)drop('spore',rand(-130,130));stars(cx,cy,10)}
  else{const n=2+(Math.random()*3|0);for(let i=0;i<n;i++)if(Math.random()<.6)drop('spore',rand(-90,90));const r=Math.random();if(r<.12)drop('heart',0);else if(r<.15)drop('gold',0)}
}
