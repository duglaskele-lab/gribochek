/* ---------- boss 4: the snowman ---------- */
// three balls of snow on springs (they squash on landings), a bucket, a carrot and two branch arms.
// Attacks: overhead slam, long diagonal punch, a volley of snowballs spat from the head, a big hop that brings icicles
// down, the split (the balls roll at you one by one and stack up again at the far end), the head throw (the head
// bounces like a ball to the wall of the arena and back onto the body), the clap high over its head and,
// in phase 2 (from 60% of its health), a beam of frost breath. Phase 3 (the last third of its health) hops more and attacks more often.
// A hit pushes it back a few pixels.
const SM_R=[62,46,36];
function makeSnowman(){return{kind:'snowman',x:ARENA_L+18*TS,y:FLOOR-262,w:124,h:262,hp:76,max:76,face:-1,state:'sleep',t:0,vx:0,vy:0,phase:1,flash:0,
  sq:[0,0,0],sqv:[0,0,0],last:'',splitCD:6,pieces:null,shots:0,mouth:0,lean:0,aboveT:0,aim:null,hf:null,hb:null,hitDone:false,melt:0,wob:0,stompCD:0,throwCD:4}}
const smCX=()=>B.x+B.w/2;
function smBalls(){
  const cx=smCX(),bot=B.y+B.h,s=B.sq,R=SM_R,h0=R[0]*(1-s[0]),h1=R[1]*(1-s[1]),h2=R[2]*(1-s[2]);
  const c0=bot-h0,c1=c0-h0-h1+14,c2=c1-h1-h2+10,L=B.lean||0;
  return[{x:cx,y:c0,r:R[0],s:s[0]},{x:cx+L*.5,y:c1,r:R[1],s:s[1]},{x:cx+L,y:c2,r:R[2],s:s[2]}];
}
const smBox=b=>({x:b.x-b.r*.85,y:b.y-b.r*.85,w:b.r*1.7,h:b.r*1.7});
function smKick(k){for(let i=0;i<3;i++)B.sqv[i]+=k*(1-i*.15)}
function smShoulders(){const b=smBalls()[1],f=B.face;return{fx:b.x+f*b.r*.82,fy:b.y-6,bx:b.x-f*b.r*.82,by:b.y-6}}
function smMult(){return B.phase>=2?.72:1}
function smChoose(){
  const cx=smCX(),pcx=P.x+P.w/2,d=Math.abs(pcx-cx),p2=B.phase>=2;
  B.face=pcx>cx?1:-1;
  const room=B.face>0?ARENA_R-90-cx:cx-(ARENA_L+90);
  const o=[];
  if(d<270)o.push(['slam',3]);
  if(d>190&&d<640)o.push(['punch',2.4]);
  if(B.throwCD<=0&&d>200)o.push(['throw',p2?2.4:1.8]);
  // the clap and the frost breath only when she is within half a screen
  if(d<=VW/2)o.push(['clap',d<480?2.4:1]);
  if(p2&&d>140&&d<=VW/2)o.push(['frost',2.2]);
  if(d>230)o.push(['volley',2]);
  o.push(['hop',d>380?2.6:1.1]);
  if(B.splitCD<=0&&d>150&&room>420)o.push(['split',p2?2.6:1.6]);
  const f=o.filter(q=>q[0]!==B.last),L=f.length?f:o;
  // phase 3: the hop is 30% of all its attacks
  if(B.phase===3){const hp=L.find(q=>q[0]==='hop');if(hp){const rest=L.reduce((a,q)=>a+(q===hp?0:q[1]),0);hp[1]=rest*.3/.7}}
  let s=0;for(const q of L)s+=q[1];let r=Math.random()*s,k=L[L.length-1][0];for(const q of L){r-=q[1];if(r<=0){k=q[0];break}}
  B.last=k;const m=smMult();B.hitDone=false;
  switch(k){
    case 'slam': B.state='slamWind';B.t=.7*m;sfx('creak');break;
    case 'throw': B.state='throwWind';B.t=.65*m;B.tMax=B.t;sfx('creak');break;
    case 'clap': B.state='clapWind';B.t=SM_CLAP_WIND;sfx('creak');break;
    case 'frost': B.state='frostWind';B.t=.7;smFrostAim(0);sfx('breath');break;
    case 'punch': B.state='punchWind';B.t=.75*m;B.tMax=B.t;smAimPunch();break;
    case 'volley': B.state='volleyWind';B.t=.6*m;break;
    case 'hop': B.state='hopWind';B.t=.5*m;break;
    case 'split': B.state='splitWind';B.t=.8*m;sfx('creak');break;
  }
}
// the long punch comes down diagonally to the floor near the player; right under the arm is safe
function smAimPunch(){
  const s=smShoulders(),f=B.face,cx=smCX();let tx=P.x+P.w/2+P.vx*.15;
  if(f*(tx-cx)<210) tx=cx+f*210;
  tx=cx+f*Math.min(f*(tx-cx),600);tx=clamp(tx,ARENA_L+20,ARENA_R-20);
  B.aim={x:tx,y:FLOOR-22,sx:s.fx,sy:s.fy};
}
function smSnowball(i,n){
  const h=smBalls()[2],f=B.face,hx=h.x+f*h.r*.5,hy=h.y+6,g=1500;
  const tx=clamp(P.x+P.w/2+P.vx*.3+(i-(n-1)/2)*80,ARENA_L+30,ARENA_R-30),ty=FLOOR-16;
  const Tt=clamp(Math.abs(tx-hx)/360,.85,1.5);
  eshots.push({k:'snowball',x:hx,y:hy,vx:(tx-hx)/Tt,vy:(ty-hy-.5*g*Tt*Tt)/Tt,g,r:14,rot:0});sfx('throwb');
}
function smLand(){
  B.vx=0;shake(.45,10);sfx('boom');smKick(6);const cx=smCX();snowPuff(cx-50,FLOOR-6,8);snowPuff(cx+50,FLOOR-6,8);
  const p2=B.phase>=2,n=p2?5:3;
  for(let i=0;i<n;i++)eshots.push({k:'icicle',x:rand(ARENA_L+60,ARENA_R-60),y:iceCeil+6,st:'warn',t:.6+i*.15,vy:0,r:11});
  eshots.push({k:'icicle',x:clamp(P.x+P.w/2,ARENA_L+40,ARENA_R-40),y:iceCeil+6,st:'warn',t:.75,vy:0,r:11});
  if(p2)for(const s of [-1,1])eshots.push({k:'iwave',x:cx+s*80,y:FLOOR,vx:s*360,life:3,h:0});
}
function smSplitStart(){
  const bs=smBalls(),dir=B.face,p2=B.phase>=2;
  B.tx=dir>0?ARENA_R-90:ARENA_L+90;B.splitDir=dir;
  B.pieces=bs.map((b,i)=>({i,x:b.x,y:b.y,r:b.r,vx:0,vy:0,delay:i*(p2?.45:.55),st:'wait',rot:0,k:0}));
  B.state='split';B.t=0;B.lean=0;B.sq=[0,0,0];B.sqv=[0,0,0];sfx('roar');shake(.3,6);
}
function smSplitUpdate(dt){
  const dir=B.splitDir,tx=B.tx,stackY=[FLOOR-62,FLOOR-156,FLOOR-228],p2=B.phase>=2;
  let support=FLOOR;B.t+=dt;
  for(const p of B.pieces){
    if(p.st==='wait'){ // the rest of the stack drops when the ball under it rolls away
      p.delay-=dt;const ty=support-p.r+(support<FLOOR?12:0);
      if(p.y<ty){p.vy+=G*dt;p.y+=p.vy*dt;if(p.y>=ty){p.y=ty;if(p.vy>300){snowPuff(p.x,p.y+p.r,4)}p.vy=0}}
      support=p.y-p.r;
      if(p.delay<=0){p.st='go';p.vy=p.i===2?-500:0;sfx('jump')}
    }else if(p.st==='go'){
      const sp=[440,400,380][p.i]*(p2?1.1:1);
      p.x+=dir*sp*dt;p.rot+=dir*sp*dt/p.r;p.vy+=G*dt;p.y+=p.vy*dt;
      if(p.y>=FLOOR-p.r){p.y=FLOOR-p.r;p.vy=p.i===0?0:p.i===1?-380:-640;if(p.i)snowPuff(p.x,FLOOR-4,3)}
      if(p.i===0&&Math.random()<.5)snowPuff(p.x-dir*p.r*.6,FLOOR-4,1);
      if(dir*(p.x-tx)>=0){p.x=tx;p.st='stack';p.k=0;p.y0=p.y}
    }else if(p.st==='stack'){
      p.k=Math.min(1,p.k+dt/.32);p.y=p.y0+(stackY[p.i]-p.y0)*p.k-Math.sin(p.k*Math.PI)*(p.i?70:0);
      if(p.k>=1){p.st='done';p.y=stackY[p.i];if(p.i)snowPuff(p.x,p.y+p.r,4)}
    }
  }
  if(B.pieces.every(p=>p.st==='done')||B.t>7){
    B.x=tx-B.w/2;B.y=FLOOR-B.h;B.vx=0;B.vy=0;B.pieces=null;B.state='reform';B.t=.55*smMult();B.hf=B.hb=null;B.face=-dir;smKick(5);shake(.25,5);sfx('land');B.splitCD=p2?7:9;
  }
}
/* the clap: it whirls its arms (0.3 s), flings them out wide and claps them together high over its head.
   The arms sweep everything above the height of a standing player, far to both sides: stay on the ground. */
const SM_CLAP_WIND=.5, SM_CLAP_T=.3, SM_CLAP_REACH=330, SM_CLAP_LOW=72;   // reach to each side; the sweep stays this high above the floor
function smClapZone(){const cx=smCX();return{x:cx-SM_CLAP_REACH,y:iceCeil,w:SM_CLAP_REACH*2,h:FLOOR-SM_CLAP_LOW-iceCeil}}
/* phase 2: frost breath, a beam from the mouth to the floor; the spot it hits walks away from the snowman */
const SM_FROST_T=1.2;   // short enough to dodge however far it reaches
function smFrostAim(k){const f=B.face,h=smBalls()[2],mx=h.x+f*h.r*.6,my=h.y+10,near=mx+f*90,far=f>0?ARENA_R-30:ARENA_L+30,
  gx=near+(far-near)*k;B.frost={mx,my,gx:f>0?Math.min(gx,far):Math.max(gx,far),gy:FLOOR-4}}
/* the head throw: it pulls its head off and throws it; the head bounces along the floor like a ball, off the wall of
   the arena and back, and drops onto the body again. The body waits headless. */
const smStackY=i=>FLOOR-[62,156,228][i];   // centres of the balls when stacked
function smThrowStart(){
  const bs=smBalls(),f=B.face,p2=B.phase>=2;
  B.pieces=bs.map((b,i)=>({i,x:bs[0].x,y:smStackY(i),r:b.r,vx:0,vy:0,st:'done',rot:0,k:0}));   // the body stays put
  const hd=B.pieces[2];hd.x=bs[2].x;hd.y=bs[2].y;hd.st='ball';hd.vx=f*(p2?470:420);hd.vy=-560;
  B.sx=bs[0].x;B.splitDir=f;B.state='headThrow';B.t=0;B.lean=0;B.sq=[0,0,0];B.sqv=[0,0,0];B.throwCD=p2?7:9;
  sfx('throwb');
}
function smStackAnim(p,dt,dur,arc){
  p.k=Math.min(1,p.k+dt/dur);p.x=p.x0+(p.tx-p.x0)*p.k;p.y=p.y0+(smStackY(p.i)-p.y0)*p.k-Math.sin(p.k*Math.PI)*arc;p.rot+=dt*6*(p.tx>p.x0?1:-1);
  if(p.k>=1){p.st='done';p.x=p.tx;p.y=smStackY(p.i);snowPuff(p.x,p.y+p.r,4);sfx('land')}
}
const smToStack=(p,tx)=>{p.st='stack';p.k=0;p.x0=p.x;p.y0=p.y;p.tx=tx};
function smThrowUpdate(dt){
  const hd=B.pieces[2],g=G*.8;B.t+=dt;
  if(hd.st==='ball'){ // bounces along the floor; turns back at a wall of the arena and drops back onto the body
    hd.vy+=g*dt;hd.x+=hd.vx*dt;hd.y+=hd.vy*dt;hd.rot+=hd.vx*dt/hd.r;B.splitDir=Math.sign(hd.vx)||B.splitDir;
    if(hd.y>=FLOOR-hd.r&&hd.vy>0){hd.y=FLOOR-hd.r;hd.vy=-Math.max(560,Math.abs(hd.vy)*.85);snowPuff(hd.x,FLOOR-4,3);sfx('land');shake(.1,3)}
    const wall=hd.x<ARENA_L+hd.r?1:hd.x>ARENA_R-hd.r?-1:0;
    if(wall){hd.x=wall>0?ARENA_L+hd.r:ARENA_R-hd.r;hd.vx=wall*Math.abs(hd.vx);hd.back=true;shake(.25,6);sfx('clang');snowPuff(hd.x-wall*hd.r,hd.y,5)}
    if(hd.back&&Math.abs(hd.x-B.sx)<220) smToStack(hd,B.sx);
  }else if(hd.st==='stack') smStackAnim(hd,dt,.4,40);
  if(B.pieces.every(p=>p.st==='done')||B.t>9){
    B.x=B.sx-B.w/2;B.y=FLOOR-B.h;B.vx=0;B.vy=0;B.pieces=null;B.state='reform';B.t=.5*smMult();B.hf=B.hb=null;
    B.face=(P.x+P.w/2>B.sx)?1:-1;smKick(5);shake(.25,5);sfx('land');
  }
}
function updateSnowman(dt){
  const p2=B.phase>=2,m=smMult(),pcx=P.x+P.w/2;
  // springy balls
  for(let i=0;i<3;i++){const a=-220*B.sq[i]-14*B.sqv[i];B.sqv[i]+=a*dt;B.sq[i]=clamp(B.sq[i]+B.sqv[i]*dt,-.25,.35)}
  if(B.splitCD>0)B.splitCD-=dt;if(B.stompCD>0)B.stompCD-=dt;if(B.throwCD>0)B.throwCD-=dt;
  if(B.state==='split'){smSplitUpdate(dt);return}
  if(B.state==='headThrow'){smThrowUpdate(dt);return}
  if(B.state==='dying'){
    if(!B.meltInit){B.meltInit=true;B.t=2.4;B.melt=0;if(B.pieces){B.pieces.forEach(p=>{p.st='done'})}}
    B.t-=dt;B.melt=clamp(1-B.t/2.4,0,1);B.vx=0;
    if(Math.random()<.3){snowPuff(smCX()+rand(-60,60),FLOOR-rand(10,120),2);if(Math.random()<.3)sfx('hit')}
    if(B.t<=0) bossDefeated();
    return}
  B.vy+=G*dt;B.y+=B.vy*dt;
  const landed=B.y+B.h>=FLOOR;if(landed){B.y=FLOOR-B.h;if(B.state!=='hop')B.vy=0}
  B.x+=B.vx*dt;if(B.x<ARENA_L+10){B.x=ARENA_L+10;B.vx=0}if(B.x+B.w>ARENA_R-10){B.x=ARENA_R-10-B.w;B.vx=0}
  const cx=smCX(),bs=smBalls(),head=bs[2],headTop=head.y-head.r-24;
  // stomping on the bucket hurts it
  if(!P.dead&&P.vy>0&&B.stompCD<=0&&Math.abs(pcx-head.x)<head.r+14&&P.prevBottom<=headTop+14&&P.y+P.h>=headTop&&bossHittable()&&B.state!=='intro'){
    hitBoss(HERO().stomp,head.x,headTop);gainMana(MANA_HIT);B.sqv[2]+=6;B.stompCD=.25;clang(head.x,headTop);
    const high=inp.j||P.buffer>0;P.vy=high?-HIGH_BOUNCE:-Math.round(560*BOUNCE_K);P.bounceT=high?0:.14;P.bounced=true;P.buffer=0;P.jumpT=0;P.onGround=false;P.airDash=airDashMax();
    P.vx+=(pcx<head.x?-1:1)*120;
    if(B.state==='dying')return}
  const above=!P.dead&&Math.abs(pcx-cx)<100&&P.y+P.h<headTop+10;
  B.aboveT=above?B.aboveT+dt:Math.max(0,B.aboveT-dt*2);
  // hands: front (towards the player) and back
  const sh=smShoulders(),f=B.face;
  let tf=[sh.fx+f*62,sh.fy+34+Math.sin(time*3)*6],tb=[sh.bx-f*62,sh.by+28+Math.sin(time*3+1)*6],rate=10;
  B.lean=approach(B.lean,0,dt*60);B.mouth=approach(B.mouth,0,dt*3);
  switch(B.state){
    case 'sleep': return;
    case 'intro': B.t-=dt;B.mouth=.6;tf=[sh.fx+f*40,sh.fy-80+Math.sin(time*14)*20];tb=[sh.bx-f*40,sh.by-80+Math.sin(time*14+2)*20];
      if(Math.random()<.08)smKick(2);if(B.t<=0){B.state='idle';B.t=.6}break;
    case 'idle':{
      // phase 3 is 15% more aggressive: the pause between attacks runs out sooner
      B.t-=dt*(B.phase===3?1.15:1);const d=Math.abs(pcx-cx);if(d>12)B.face=pcx>cx?1:-1;
      B.vx=approach(B.vx,d>420?B.face*85:0,400*dt);
      if(Math.abs(B.vx)>20){B.wob-=dt;if(B.wob<=0){B.wob=.32;smKick(2.2);snowPuff(cx,FLOOR-4,2)}}
      if(B.phase===1&&B.hp<=B.max*.6){B.state='enrage';B.t=1.3;B.vx=0;sfx('roar');shake(1,7);break}
      if(B.phase===2&&B.hp<=B.max/3) B.phase=3;   // the last third: phase 3, without a show
      if(B.aboveT>.5){B.state='hopWind';B.t=.4*m;B.vx=0;B.aboveT=0;B.last='hop';break}   // she hangs above it: it jumps
      if(B.t<=0){B.vx=0;smChoose()}
      break}
    case 'enrage': B.t-=dt;B.mouth=.8+.2*Math.sin(time*24);B.lean=Math.sin(time*30)*4;tf=[sh.fx+f*30,sh.fy-90];tb=[sh.bx-f*30,sh.by-90];
      if(Math.random()<.4)snowPuff(head.x+rand(-30,30),head.y-head.r,1);
      if(B.t<=0){B.phase=2;B.state='idle';B.t=.3;B.splitCD=Math.min(B.splitCD,1.5);floater(cx,B.y-40,T('fPhase2s'))}break;
    case 'reform': B.t-=dt;rate=3.5;   // the arms grow back out of the shoulders, slowly
      tf=[sh.fx+f*40,sh.fy+24];tb=[sh.bx-f*40,sh.by+20];if(B.t<=0){B.state='idle';B.t=.35*m}break;
    case 'slamWind':{const k=clamp(1-B.t/(.7*m),0,1);B.t-=dt;B.lean=-f*10*k;
      tf=[sh.fx+f*(30-k*40),sh.fy-60-k*80];tb=[sh.bx+f*(40*k),sh.by-60-k*80];rate=14;
      if(B.t<=0){B.state='slam';B.t=.55}break}
    case 'slam':{B.t-=dt;B.lean=f*16;const hx=cx+f*150;tf=[hx+f*12,FLOOR-14];tb=[hx-f*16,FLOOR-14];rate=40;
      if(!B.hitDone&&B.t<=.5){B.hitDone=true;shake(.4,10);sfx('boom');smKick(4);iceShards(hx,FLOOR-8,14);snowPuff(hx,FLOOR-6,6);
        if(!P.dead&&overlap({x:f>0?cx+40:cx-260,y:FLOOR-96,w:220,h:96},{x:P.x+3,y:P.y+6,w:P.w-6,h:P.h-6}))hurt(hx);
        eshots.push({k:'iwave',x:hx+f*30,y:FLOOR,vx:f*400,life:3,h:0});
        if(p2)eshots.push({k:'iwave',x:cx-f*80,y:FLOOR,vx:-f*360,life:3,h:0})}
      if(B.t<=0){B.state='idle';B.t=(p2?.45:.75)}break}
    case 'punchWind':{B.t-=dt;const k=clamp(1-B.t/B.tMax,0,1);if(k<.65)smAimPunch();B.lean=-f*12*k;
      tf=[sh.fx-f*40,sh.fy+6];rate=12;
      if(B.t<=0){B.state='punch';B.t=.5;B.hitDone=false;sfx('punch')}break}
    case 'punch':{B.t-=dt;const el=.5-B.t,ext=el<.12?el/.12:el<.32?1:Math.max(0,1-(el-.32)/.18);B.lean=f*16*ext;
      const a=B.aim,hx=sh.fx+(a.x-sh.fx)*ext,hy=sh.fy+(a.y-sh.fy)*ext;B.hf={x:hx,y:hy};tf=[hx,hy];rate=1e3;
      if(ext>=1&&!B.hitDone){B.hitDone=true;shake(.18,5);snowPuff(a.x,FLOOR-6,6);sfx('land')}
      if(ext>.4&&!P.dead&&segDist(pcx,P.y+P.h/2,sh.fx,sh.fy,hx,hy)<34)hurt(hx);
      if(B.t<=0){B.state='idle';B.t=p2?.4:.65}break}
    case 'throwWind':{ // both hands grab the head and lift it a little, then it is thrown
      B.t-=dt;const k=clamp(1-B.t/B.tMax,0,1);rate=16;B.lean=-f*8*k;
      tf=[head.x+f*head.r*.9,head.y-k*20];tb=[head.x-f*head.r*.9,head.y-k*20];B.sqv[2]-=k*dt*30;
      if(B.t<=0)smThrowStart();break}
    case 'clapWind':{ // the arms whirl round the shoulders
      B.t-=dt;rate=40;const a=time*22;tf=[sh.fx+Math.cos(a)*50,sh.fy+Math.sin(a)*50];tb=[sh.bx+Math.cos(a+Math.PI)*50,sh.by+Math.sin(a+Math.PI)*50];
      B.mouth=.4;if(B.t<=0){B.state='clapOut';B.t=.22;sfx('creak')}break}
    case 'clapOut': // arms flung out wide
      B.t-=dt;rate=30;tf=[cx+f*SM_CLAP_REACH,sh.fy-20];tb=[cx-f*SM_CLAP_REACH,sh.by-20];B.mouth=.6;
      if(B.t<=0){B.state='clap';B.t=SM_CLAP_T;B.hitDone=false}break;
    case 'clap':{ // they sweep up, slowly, and meet over the head
      B.t-=dt;rate=9;tf=[cx+f*8,headTop-60];tb=[cx-f*8,headTop-60];B.mouth=1;
      if(B.t<.08&&!B.hitDone){B.hitDone=true;sfx('boom');shake(.35,8);snowPuff(cx,headTop-60,10);iceShards(cx,headTop-60,12,260)}
      if(!P.dead&&B.t>.04&&overlap(smClapZone(),{x:P.x+3,y:P.y+6,w:P.w-6,h:P.h-6})) hurt(cx);
      if(B.t<=0){B.state='idle';B.t=p2?.45:.7}break}
    case 'frostWind': // aims at the floor right in front, frost gathering at the mouth
      B.t-=dt;B.mouth=approach(B.mouth,1,dt*3);B.lean=-f*6;smFrostAim(0);
      if(Math.random()<.6)parts.push({x:B.frost.mx+rand(-8,8),y:B.frost.my+rand(-8,8),vx:f*rand(20,60),vy:rand(-20,20),g:0,c:'rgba(220,245,255,.9)',s:rand(3,6),life:.3,max:0,t:'puff'});
      if(B.t<=0){B.state='frost';B.t=SM_FROST_T;sfx('breath')}break;
    case 'frost':{ // the beam: the spot it hits on the floor moves further and further away
      B.t-=dt;B.mouth=1;const k=1-B.t/SM_FROST_T;smFrostAim(k);B.lean=f*4*k;const fr=B.frost;
      if(Math.random()<.8)iceShards(fr.gx,fr.gy,1,120);
      if(Math.random()<.5)parts.push({x:fr.gx+rand(-14,14),y:fr.gy-rand(0,20),vx:rand(-40,40),vy:rand(-90,-30),g:0,c:'rgba(225,245,255,.9)',s:rand(5,10),life:.4,max:0,t:'puff'});
      if(Math.random()<.12)sfx('breath');
      if(!P.dead&&segDist(pcx,P.y+P.h/2,fr.mx,fr.my,fr.gx,fr.gy)<30) hurt(fr.gx);
      if(B.t<=0){B.state='idle';B.t=.6;B.frost=null}break}
    case 'volleyWind': B.t-=dt;B.mouth=approach(B.mouth,1,dt*3);B.lean=-f*10;   // no arm movement: only the mouth opens
      if(B.t<=0){B.state='volley';B.shots=0;B.t=0}break;
    case 'volley':{B.t-=dt;B.mouth=1;B.lean=-f*6;const n=p2?6:4;
      if(B.t<=0&&B.shots<n){smSnowball(B.shots,n);B.shots++;B.t=.15;B.sqv[2]-=3}
      else if(B.shots>=n&&B.t<=-.3){B.state='idle';B.t=p2?.4:.7}break}
    case 'hopWind': B.t-=dt;for(let i=0;i<3;i++){B.sq[i]=approach(B.sq[i],.22,dt*1.2);B.sqv[i]=0}tf=[sh.fx+f*50,sh.fy-40];tb=[sh.bx-f*50,sh.by-40];
      if(B.t<=0){const T2=2*(p2?1000:940)/G,tx=clamp(pcx,ARENA_L+80,ARENA_R-80);B.vy=p2?-1000:-940;B.vx=clamp((tx-cx)/T2,-560,560);B.state='hop';smKick(-4);sfx('jump');snowPuff(cx,FLOOR-4,6)}break;
    case 'hop': tf=[sh.fx+f*40,sh.fy-70];tb=[sh.bx-f*40,sh.by-70];
      if(landed&&B.vy>=0){B.vy=0;smLand();B.state='idle';B.t=p2?.5:.8}break;
    case 'splitWind':{B.t-=dt;B.lean=Math.sin(time*26)*6;for(let i=0;i<3;i++)B.sqv[i]+=Math.sin(time*30+i)*dt*20;
      if(B.t<=0)smSplitStart();break}
  }
  if(B.state==='split'||B.state==='headThrow') return;
  if(!B.hf)B.hf={x:sh.fx+f*8,y:sh.fy+4};if(!B.hb)B.hb={x:sh.bx-f*8,y:sh.by+4};   // (re)born arms start as stubs at the shoulders
  const k=Math.min(1,dt*rate);B.hf.x+=(tf[0]-B.hf.x)*k;B.hf.y+=(tf[1]-B.hf.y)*k;
  const kb=Math.min(1,dt*Math.min(rate,30));B.hb.x+=(tb[0]-B.hb.x)*kb;B.hb.y+=(tb[1]-B.hb.y)*kb;
}
// a hit pushes it back a few pixels (not while it is apart or dying)
function smOnHit(x){if(B.pieces||B.state==='dying'||B.state==='sleep')return;const d=Math.sign(smCX()-x)||-B.face;
  B.x=clamp(B.x+d*4,ARENA_L+10,ARENA_R-10-B.w);B.lean+=d*5;smKick(1.2)}
function smHitMult(test){
  if(B.pieces){for(const p of B.pieces)if(test(smBox(p)))return p.i===2?1.3:1;return 0}
  const bs=smBalls();if(test(smBox(bs[2])))return 1.3;if(test(smBox(bs[1]))||test(smBox(bs[0])))return 1;return 0;
}
function smContact(pb){
  if(B.state==='dying') return false;
  if(B.pieces) return B.pieces.some(p=>circleBox(p.x,p.y,p.r*.86,pb));
  const bs=smBalls();return circleBox(bs[0].x,bs[0].y,bs[0].r*.88,pb)||circleBox(bs[1].x,bs[1].y,bs[1].r*.82,pb);
}
/* snowman drawing */
function smBall(x,y,r,s,rot,fl,shrink=1){
  const rx=r*(1+s*.6)*shrink,ry=r*(1-s)*shrink;
  ctx.fillStyle=fl?'#ffffff':'#f3f8ff';ctx.strokeStyle=INK;ctx.lineWidth=3.5;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,7);ctx.fill();
  ctx.save();ctx.clip();ctx.fillStyle=fl?'#fff4f4':'#c8dcef';ctx.beginPath();ctx.ellipse(x+rx*.28,y+ry*.32,rx*.95,ry*.8,0,0,7);ctx.fill();
  ctx.fillStyle=fl?'#fff':'#f3f8ff';ctx.beginPath();ctx.ellipse(x-rx*.12,y-ry*.12,rx*.82,ry*.78,0,0,7);ctx.fill();
  ctx.fillStyle='rgba(160,190,220,.55)';for(let i=0;i<6;i++){const a=rot+i*1.7,d=.35+hash(i,7)*.5;ctx.beginPath();ctx.arc(x+Math.cos(a)*rx*d,y+Math.sin(a)*ry*d,2+hash(i,9)*2.5,0,7);ctx.fill()}
  ctx.restore();ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,7);ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.9)';ctx.beginPath();ctx.ellipse(x-rx*.42,y-ry*.5,rx*.16,ry*.09,-.6,0,7);ctx.fill();
}
function smArm(sx,sy,hx,hy){
  limb(sx,sy,hx,hy,7,'#7a4b2b');
  const a=Math.atan2(hy-sy,hx-sx),L=Math.hypot(hx-sx,hy-sy);
  const mx=sx+(hx-sx)*.55,my=sy+(hy-sy)*.55;limb(mx,my,mx+Math.cos(a-.8)*L*.22,my+Math.sin(a-.8)*L*.22,4,'#7a4b2b');
  for(const da of [-.6,0,.6])limb(hx,hy,hx+Math.cos(a+da)*16,hy+Math.sin(a+da)*16,4,'#7a4b2b');
}
function smFace(x,y,r,f,mouth,shrink=1,sleep=false){
  ctx.save();ctx.translate(x,y);ctx.scale(shrink,shrink);
  ctx.fillStyle=INK;
  if(sleep){ctx.lineWidth=3;ctx.strokeStyle=INK;for(const ex of [-1,12]){ctx.beginPath();ctx.moveTo(f*ex-5,-9);ctx.lineTo(f*ex+5,-9);ctx.stroke()}}
  else{for(const ex of [-2,14]){ctx.beginPath();ctx.arc(f*ex,-9,4.6,0,7);ctx.fill()}
    ctx.fillStyle='#ff3b2e';for(const ex of [-2,14]){ctx.beginPath();ctx.arc(f*ex+f*1.2,-10,1.6,0,7);ctx.fill()}
    ctx.strokeStyle=INK;ctx.lineWidth=3.5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(f*-10,-21);ctx.lineTo(f*3,-14);ctx.moveTo(f*24,-20);ctx.lineTo(f*12,-14);ctx.stroke()}
  // an evil coal grin; wide open when spitting
  if(mouth>.15){ctx.fillStyle='#3a2230';ctx.beginPath();ctx.ellipse(f*6,13,13,4+mouth*9,0,0,7);ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.stroke();
    ctx.fillStyle='#fff';for(const tx of [-5,1,7,13]){ctx.beginPath();ctx.moveTo(f*tx-2.5,13-4-mouth*8);ctx.lineTo(f*tx+2.5,13-4-mouth*8);ctx.lineTo(f*tx,13-mouth*4);ctx.closePath();ctx.fill()}}
  else{ctx.fillStyle=INK;for(let i=0;i<7;i++){const u=i/6-.5;ctx.beginPath();ctx.arc(f*(6+u*30),12-Math.cos(u*Math.PI)*8+ (sleep?4:0),2.6,0,7);ctx.fill()}}
  // carrot
  ctx.fillStyle='#ff8a2a';ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(f*8,-4);ctx.lineTo(f*44,1);ctx.lineTo(f*8,4);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.strokeStyle='#c45a12';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(f*20,-2);ctx.lineTo(f*20,2);ctx.moveTo(f*30,-1);ctx.lineTo(f*30,2);ctx.stroke();
  ctx.restore();
}
function smBucket(x,y,f,tilt,shrink=1){
  ctx.save();ctx.translate(x,y);ctx.rotate(tilt);ctx.scale(shrink,shrink);ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.lineJoin='round';
  ctx.fillStyle='#7a8aa6';ctx.beginPath();ctx.moveTo(-24,0);ctx.lineTo(-18,-32);ctx.lineTo(18,-32);ctx.lineTo(24,0);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='#5f6d88';ctx.fillRect(-21,-14,42,6);ctx.strokeRect(-21,-14,42,6);
  ctx.fillStyle='#a9b6cc';ctx.beginPath();ctx.ellipse(0,-32,18,4,0,0,7);ctx.fill();ctx.stroke();
  ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-12,-28);ctx.lineTo(-15,-4);ctx.stroke();
  ctx.restore();
}
function drawSnowman(){
  const f=B.face,fl=B.flash>0,melt=B.state==='dying'?B.melt:0,shr=1-melt*.75,sleep=B.state==='sleep';
  if(B.state==='punchWind'&&B.aim){const k=clamp(1-B.t/B.tMax,0,1);if(k>.25){const s=smShoulders();ctx.save();ctx.setLineDash([10,8]);ctx.lineDashOffset=-time*60;
    ctx.strokeStyle=`rgba(255,90,70,${.25+.5*k})`;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(s.fx,s.fy);ctx.lineTo(B.aim.x,B.aim.y);ctx.stroke();ctx.restore();
    ctx.fillStyle=`rgba(255,90,70,${.2+.3*k})`;ctx.beginPath();ctx.ellipse(B.aim.x,FLOOR-3,26,6,0,0,7);ctx.fill()}}
  if(B.frost&&(B.state==='frostWind'||B.state==='frost')){const fr=B.frost;
    if(B.state==='frostWind'){ctx.save();ctx.setLineDash([8,8]);ctx.lineDashOffset=-time*50;ctx.strokeStyle='rgba(160,225,255,.75)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(fr.mx,fr.my);ctx.lineTo(fr.gx,fr.gy);ctx.stroke();ctx.restore()}
    else{const w=20+Math.sin(time*40)*3;ctx.lineCap='round';
      ctx.strokeStyle='rgba(150,215,255,.5)';ctx.lineWidth=w+14;ctx.beginPath();ctx.moveTo(fr.mx,fr.my);ctx.lineTo(fr.gx,fr.gy);ctx.stroke();
      ctx.strokeStyle='rgba(215,242,255,.9)';ctx.lineWidth=w;ctx.stroke();ctx.strokeStyle='#fff';ctx.lineWidth=w*.35;ctx.stroke();
      ctx.fillStyle='rgba(230,248,255,.85)';ctx.beginPath();ctx.ellipse(fr.gx,fr.gy,34,10,0,0,7);ctx.fill()}}
  if(melt>0){ctx.fillStyle='rgba(200,230,250,.8)';ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(smCX(),FLOOR-2,40+melt*90,5+melt*6,0,0,7);ctx.fill();ctx.stroke()}
  if(B.pieces){
    for(const p of B.pieces){const sh=p.i===0?1:1;shadow(p.x,FLOOR,p.r*.9*sh);
      if(p.i===1){limb(p.x-p.r*.8,p.y-6,p.x-p.r*.8-26,p.y-34,6,'#7a4b2b');limb(p.x+p.r*.8,p.y-6,p.x+p.r*.8+26,p.y-34,6,'#7a4b2b')}
      smBall(p.x,p.y,p.r,0,p.rot,fl,shr);
      if(p.i===1){ctx.fillStyle=INK;for(let k=0;k<3;k++){const a=p.rot+k*.7-.7;ctx.beginPath();ctx.arc(p.x+Math.sin(a)*p.r*.55*shr,p.y-Math.cos(a)*p.r*.55*shr*.3+(k-1)*14*shr,4,0,7);ctx.fill()}}
      if(p.i===2){const ff=B.splitDir||f;smFace(p.x,p.y,p.r,ff,.2,shr);smBucket(p.x-ff*4,p.y-p.r*shr+8,ff,-ff*.18+Math.sin(p.rot)*.1,shr)}}
    return;
  }
  const bs=smBalls(),sh=smShoulders();
  shadow(bs[0].x,FLOOR,58);
  const hb=B.hb||{x:sh.bx-f*60,y:sh.by+30},hf=B.hf||{x:sh.fx+f*60,y:sh.fy+30};
  const sink=melt*120;
  if(melt<.6)smArm(sh.bx,sh.by+sink,hb.x,hb.y+sink*1.4);
  smBall(bs[0].x,bs[0].y+melt*bs[0].r*.6,bs[0].r,bs[0].s,0,fl,1-melt*.6);
  smBall(bs[1].x,bs[1].y+sink*.8,bs[1].r,bs[1].s,1,fl,shr);
  ctx.fillStyle=INK;for(let k=0;k<3;k++){ctx.beginPath();ctx.arc(bs[1].x+f*8,bs[1].y+sink*.8-18+k*16*shr,4.5*shr,0,7);ctx.fill()}
  if(melt<.6)smArm(sh.fx,sh.fy+sink,hf.x,hf.y+sink*1.4);
  const hx=bs[2].x,hy=bs[2].y+sink;
  smBall(hx,hy,bs[2].r,bs[2].s,2,fl,shr);
  smFace(hx,hy,bs[2].r,f,B.mouth,shr,sleep);
  const tilt=-f*.15+(B.state==='volleyWind'||B.state==='volley'?-f*.2:0)+Math.sin(time*2)*.03;
  if(melt>0){const k=clamp(melt*1.6,0,1);smBucket(hx-f*40*k,hy-bs[2].r*shr+8+k*(FLOOR-hy-6),f,tilt-f*k*1.6,1)}
  else smBucket(hx-f*4,hy-bs[2].r*(1-bs[2].s)+8,f,tilt);
  if(sleep&&Math.sin(time*2)>0){ctx.fillStyle='rgba(255,255,255,.85)';ctx.font='18px '+FONT;ctx.textAlign='center';ctx.fillText('z',hx+30,hy-60-Math.sin(time*2)*8)}
}

