/* ---------- boss 5: the Mutank, a tank that something purple has grown into ---------- */
// It drives, jumps on its tentacles and climbs the walls of the street and the steel girder over it.
// Every attack is announced and is followed by a moment to hit back:
//   cannon   - the turret turns, a red sight flickers on the target, then a shell flies straight (1 shot; 2, then 3 later)
//   ram      - the engine roars and the tracks spin, then it charges to the end of the street and crashes into the wall,
//              dazed with its hatch open (a stomp on the hatch or any hit then does 50% more). Jump over it or onto it.
//   tentacles- purple cracks glow in the asphalt, then tentacles burst out of them (2; 3 and 4 later)
// Phase 2 (from 60% health, after it mutates): it also
//   leaps    - crouches on its tentacles (a shadow marks the spot), lands on the player, ripples run both ways
//   climbs   - drives to a wall, climbs it, lobs mortar shells from up there (their landing spots are marked), lets go
//              and crashes down, dazed.
// Phase 3 (the last 30%): everything a bit quicker, and it crawls along the girder under the sky, hangs over the
// player with its tentacles dangling (its shadow grows on the ground) and drops, dazed again after the crash.
// It can be stomped on while it stands on the ground; its hull hurts to touch, its turret top does not.
const MT_W=200, MT_H=110, MT_HP=84, MT_GIRDER_Y=5*TS+20;
function makeMutank(){return{kind:'mutank',x:ARENA_R-320,y:FLOOR-MT_H,w:MT_W,h:MT_H,hp:MT_HP,max:MT_HP,face:-1,state:'sleep',t:0,vx:0,vy:0,phase:1,flash:0,
  rot:0,mode:'ground',aim:Math.PI,last:'',open:0,tread:0,stompCD:0,shots:0,cd:{ram:0,climb:3,leap:0,ceil:0},rev:0,recoil:0,wiggle:0,dcx:null,dcy:null}}
const mtCX=()=>B.x+B.w/2, mtSpeed=()=>B.phase===3?.8:1;
// the turret: pivot and barrel tip in the world (ground pose only)
function mtPivot(){return{x:mtCX()-B.face*14,y:B.y+22}}
function mtMuzzle(){const p=mtPivot();return{x:p.x+Math.cos(B.aim)*92,y:p.y+Math.sin(B.aim)*92}}
function mtAimAt(tx,ty,k){const p=mtPivot();let a=Math.atan2(ty-p.y,tx-p.x);
  // the barrel cannot point down into its own hull
  if(B.face>0)a=clamp(a,-1.45,.35);else{if(a>0&&a<Math.PI-.35)a=Math.PI-.35;if(a<0&&a>-Math.PI+1.45)a=-Math.PI+1.45}
  let d=a-B.aim;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;B.aim+=d*k}
function mtSetGround(){B.mode='ground';B.w=MT_W;B.h=MT_H;B.rot=0;B.y=FLOOR-MT_H;B.x=clamp(B.x,ARENA_L+4,ARENA_R-4-MT_W)}
function mtHull(){ // the part that hurts to touch
  if(B.mode==='ground')return{x:B.x+8,y:B.y+40,w:B.w-16,h:B.h-40};
  return{x:B.x+6,y:B.y+6,w:B.w-12,h:B.h-12}}
function mtBox(){return{x:B.x+4,y:B.y,w:B.w-8,h:B.h}}
function mtChoose(){
  const cx=mtCX(),pcx=P.x+P.w/2,d=Math.abs(pcx-cx),p2=B.phase>=2,p3=B.phase===3,m=mtSpeed();
  B.face=pcx>cx?1:-1;
  const room=B.face>0?ARENA_R-(B.x+B.w):B.x-ARENA_L;
  const o=[['cannon',d>200?2.4:1.4],['tentacles',1.8]];
  if(room>240&&B.cd.ram<=0)o.push(['ram',d>160?2.4:1.4]);
  if(d<200)o.push(['drive',1.2]);
  if(p2&&B.cd.leap<=0)o.push(['leap',d>240?2.2:1.2]);
  if(p2&&B.cd.climb<=0)o.push(['climb',2]);
  if(p3&&B.cd.ceil<=0)o.push(['ceil',2.4]);
  const f=o.filter(q=>q[0]!==B.last),L=f.length?f:o;
  let s=0;for(const q of L)s+=q[1];let r=Math.random()*s,k=L[L.length-1][0];for(const q of L){r-=q[1];if(r<=0){k=q[0];break}}
  B.last=k;
  switch(k){
    case 'cannon': B.state='aim';B.t=.8*m;B.shots=p3?3:p2?2:1;sfx('creak');break;
    case 'ram': B.state='rev';B.t=.75*m;B.cd.ram=4;sfx('engine');break;
    case 'tentacles': B.state='tentCall';B.t=.35;mtTentacles(p3?4:p2?3:2);break;
    case 'drive': B.state='drive';B.t=rand(.7,1.1);B.dir=pcx>cx?-1:1;if((B.dir<0&&B.x-ARENA_L<120)||(B.dir>0&&ARENA_R-B.x-B.w<120))B.dir=-B.dir;break;
    case 'leap': B.state='crouch';B.t=.6*m;B.cd.leap=5;mtLeapAim();sfx('slosh');break;
    case 'climb': B.state='toWall';B.side=cx<(ARENA_L+ARENA_R)/2?-1:1;B.cd.climb=11;B.ceil=false;break;
    case 'ceil': B.state='toWall';B.side=cx<(ARENA_L+ARENA_R)/2?-1:1;B.cd.ceil=12;B.cd.climb=Math.max(B.cd.climb,6);B.ceil=true;break;
  }
}
// tentacles out of the asphalt: under the player and spread around, each one announced by glowing cracks
function mtTentacles(n){
  const pcx=clamp(P.x+P.w/2,ARENA_L+40,ARENA_R-40),xs=[pcx];
  for(let i=1;i<n;i++){let x,k=0;do{x=rand(ARENA_L+50,ARENA_R-50);k++}while(k<20&&xs.some(q=>Math.abs(q-x)<110));xs.push(x)}
  xs.forEach((x,i)=>eshots.push({k:'ftent',x,y:FLOOR,st:'warn',t:.8+i*.12,len:0,ph:rand(0,6)}));
}
function mtLeapAim(){B.tx=clamp(P.x+P.w/2,ARENA_L+MT_W/2+6,ARENA_R-MT_W/2-6)}
function mtFire(){
  const mz=mtMuzzle(),sp=720;eshots.push({k:'shell',x:mz.x,y:mz.y,vx:Math.cos(B.aim)*sp,vy:Math.sin(B.aim)*sp,r:9,life:3});
  sfx('boom');shake(.18,5);B.recoil=1;B.x=clamp(B.x-Math.cos(B.aim)*10,ARENA_L+4,ARENA_R-4-B.w);
  for(let i=0;i<6;i++)parts.push({x:mz.x,y:mz.y,vx:Math.cos(B.aim)*rand(60,200)+rand(-40,40),vy:Math.sin(B.aim)*rand(60,200)+rand(-60,20),g:0,c:'rgba(90,90,100,.7)',s:rand(6,11),life:rand(.3,.6),max:0,t:'puff'});
}
function mtMortar(){ // lobbed from up on the wall onto where the player is going
  const cx=mtCX(),cy=B.y+B.h/2,tx=clamp(P.x+P.w/2+P.vx*.4+rand(-40,40),ARENA_L+30,ARENA_R-30),ty=FLOOR-8,g=1500,T=1.05;
  eshots.push({k:'mortar',x:cx,y:cy,vx:(tx-cx)/T,vy:(ty-cy-.5*g*T*T)/T,g,r:12,tx});sfx('throwb');sfx('boom');
}
function mtBoom(x,y,r){
  shake(.3,7);sfx('boom');
  for(let i=0;i<14;i++)parts.push({x:x+rand(-10,10),y:y+rand(-10,10),vx:rand(-260,260),vy:rand(-320,-40),g:900,c:Math.random()<.5?'#ffb03a':'#ff6a2a',s:rand(3,7),life:rand(.25,.5),max:0,t:'dot'});
  for(let i=0;i<6;i++)parts.push({x:x+rand(-14,14),y:y+rand(-14,6),vx:rand(-60,60),vy:rand(-90,-20),g:0,c:'rgba(80,80,90,.7)',s:rand(8,14),life:rand(.4,.8),max:0,t:'puff'});
  if(!P.dead&&circleBox(x,y,r,{x:P.x+3,y:P.y+6,w:P.w-6,h:P.h-6}))hurt(x);
}
// crashing to the ground (after a ram into the wall, a fall from the wall or the girder): dazed, the hatch open
function mtCrash(stun){B.state='crash';B.t=stun;B.open=1;B.vx=0;shake(.5,10);sfx('boom');sfx('clang');
  const cx=mtCX();dust(cx-80,FLOOR,8,-1);dust(cx+80,FLOOR,8,1)}
function updateMutank(dt){
  const p2=B.phase>=2,m=mtSpeed(),pcx=P.x+P.w/2;
  for(const k in B.cd)if(B.cd[k]>0)B.cd[k]-=dt;
  if(B.stompCD>0)B.stompCD-=dt;
  B.recoil=approach(B.recoil,0,dt*4);B.wiggle+=dt;
  if(B.state!=='crash')B.open=approach(B.open,0,dt*2);
  if(B.state==='dying'){
    B.t-=dt;B.vx=0;if(Math.random()<.12)mtBoom(B.x+rand(20,B.w-20),B.y+rand(10,B.h-10),0);
    if(B.mode!=='ground'){ // beaten up on the wall or the girder: it falls down, turning upright
      if(B.mode==='wall'){const cxw=B.x+B.w/2,cyw=B.y+B.h/2;B.w=MT_W;B.h=MT_H;B.x=clamp(cxw-MT_W/2,ARENA_L+4,ARENA_R-4-MT_W);B.y=cyw-MT_H/2}
      B.mode='air';B.vy=(B.vy||0)+G*dt;B.y+=B.vy*dt;B.rot=approach(B.rot,0,dt*6);if(B.y+B.h>=FLOOR){mtSetGround();shake(.4,8)}}
    if(B.t<=0)bossDefeated();return}
  // stomping on it (on the ground only): the turret top and the hatch
  if(B.mode==='ground'&&!P.dead&&P.vy>0&&B.stompCD<=0&&bossHittable()&&B.state!=='intro'){
    const top={x:B.x+18,y:B.y-6,w:B.w-36,h:30};
    if(P.prevBottom<=B.y+16&&overlap(top,{x:P.x+3,y:P.y+P.h-10,w:P.w-6,h:12})){
      hitBoss(HERO().stomp*(B.open>.5?1.5:1),pcx,B.y);gainMana(MANA_HIT);B.stompCD=.25;clang(pcx,B.y);
      const high=inp.j||P.buffer>0;P.vy=high?-HIGH_BOUNCE:-Math.round(560*BOUNCE_K);P.bounceT=high?0:.14;P.bounced=true;P.buffer=0;P.jumpT=0;P.onGround=false;P.airDash=airDashMax();
      P.vx+=(pcx<mtCX()?-1:1)*140;
      if(B.state==='dying')return}}
  const cx=mtCX();
  switch(B.state){
    case 'sleep': return;
    case 'intro': B.t-=dt;B.wiggle+=dt*3;if(Math.random()<.15)purpleMist(cx+rand(-30,30),B.y,1);mtAimAt(pcx,P.y,dt*2);
      if(B.t<=0){B.state='idle';B.t=.5}break;
    case 'idle':{B.t-=dt/m;B.vx=approach(B.vx,0,600*dt);mtAimAt(pcx,P.y+P.h/2,dt*3);
      if(Math.abs(pcx-cx)>30)B.face=pcx>cx?1:-1;
      if(B.phase===1&&B.hp<=B.max*.6){B.state='mutate';B.t=1.6;sfx('roar');shake(1,8);break}
      if(B.phase===2&&B.hp<=B.max*.3){B.state='mutate';B.t=1.3;sfx('roar');shake(1,8);break}
      if(B.t<=0)mtChoose();break}
    case 'mutate': B.t-=dt;B.wiggle+=dt*4;B.x+=rand(-1.5,1.5);if(Math.random()<.5)purpleMist(cx+rand(-60,60),B.y+rand(0,40),2);
      if(B.t<=0){B.phase++;B.state='idle';B.t=.4;B.cd.climb=Math.min(B.cd.climb,2);floater(cx,B.y-40,T(B.phase===2?'fMutate':'fMutate2'))}break;
    case 'drive': B.t-=dt;B.vx=approach(B.vx,B.dir*220,800*dt);B.face=pcx>cx?1:-1;mtAimAt(pcx,P.y,dt*3);
      if(B.t<=0||(B.dir<0&&B.x<=ARENA_L+10)||(B.dir>0&&B.x+B.w>=ARENA_R-10)){B.state='idle';B.t=.3}break;
    case 'aim':{B.t-=dt;const k=B.t>.22?dt*6:0;mtAimAt(pcx,P.y+P.h/2,k);   // it stops turning just before it fires
      if(B.t<=0){mtFire();B.shots--;if(B.shots>0){B.state='aim';B.t=.42*m}else{B.state='idle';B.t=(p2?.7:.95)}}break}
    case 'rev': B.t-=dt;B.rev=1;B.vx=0;B.face=pcx>cx?1:-1;if(Math.random()<.6)parts.push({x:cx-B.face*(B.w/2+6),y:B.y+44,vx:-B.face*rand(40,120),vy:rand(-60,-10),g:0,c:'rgba(70,70,80,.7)',s:rand(5,10),life:.5,max:0,t:'puff'});
      if(B.t<=0){B.state='ram';B.rev=0;sfx('dash')}break;
    case 'ram':{B.vx=B.face*(p2?580:520);if(Math.random()<.5)dust(cx-B.face*90,FLOOR,2,-B.face);if(Math.random()<.1)shake(.08,3);
      if((B.face<0&&B.x<=ARENA_L+6)||(B.face>0&&B.x+B.w>=ARENA_R-6)){B.x=B.face<0?ARENA_L+6:ARENA_R-6-B.w;mtCrash(p2?1.2:1.4);B.x-=B.face*20;
        for(let i=0;i<10;i++)parts.push({x:B.face<0?ARENA_L:ARENA_R,y:FLOOR-rand(20,220),vx:-B.face*rand(40,200),vy:rand(-100,100),g:1300,c:'#8a8f99',s:rand(3,7),life:rand(.4,.8),max:0,t:'dot'})}
      break}
    case 'crash': B.t-=dt;B.vx=approach(B.vx,0,800*dt);B.open=1;if(Math.random()<.2)purpleMist(cx,B.y+10,1);
      if(B.t<=0){B.state='idle';B.t=.35}break;
    case 'tentCall': B.t-=dt;B.wiggle+=dt*2;if(B.t<=0){B.state='idle';B.t=p2?.8:1.1}break;
    case 'crouch': B.t-=dt;if(B.t>.18)mtLeapAim();
      if(B.t<=0){const T2=.9;B.vy=-G*T2/2;B.vx=(B.tx-cx)/T2;B.state='leap';sfx('jump');dust(cx,FLOOR,8)}break;
    case 'leap': B.vy+=G*dt;B.y+=B.vy*dt;
      if(B.y+B.h>=FLOOR&&B.vy>0){B.y=FLOOR-B.h;B.vy=0;B.vx=0;shake(.5,9);sfx('boom');dust(cx,FLOOR,12);
        for(const s of [-1,1])eshots.push({k:'rubbleWave',x:cx+s*(MT_W/2+10),y:FLOOR,vx:s*380,life:2.2,h:0,tall:40});
        B.state='land';B.t=.55}break;
    case 'land': B.t-=dt;if(B.t<=0){B.state='idle';B.t=.4}break;
    // climbing: drive to the wall, grab it, climb up; from the wall it lobs mortar shells, then lets go (or goes on up
    // to the girder in phase 3)
    case 'toWall':{const s=B.side;B.face=s;B.vx=s*300;
      if((s<0&&B.x<=ARENA_L+4)||(s>0&&B.x+B.w>=ARENA_R-4)){B.x=s<0?ARENA_L+4:ARENA_R-4-B.w;B.vx=0;B.state='grab';B.t=0;sfx('slosh')}break}
    case 'grab':{B.t+=dt;const k=Math.min(1,B.t/.45),s=B.side;
      B.rot=-s*Math.PI/2*k;   // the tracks turn onto the wall
      if(k>=1){B.mode='wall';B.w=MT_H;B.h=MT_W;B.x=s<0?ARENA_L:ARENA_R-MT_H;B.y=FLOOR-MT_W;B.state='climb';B.goal=B.ceil?MT_GIRDER_Y+MT_H:FLOOR-MT_W-230}break}
    case 'climb': B.y=approach(B.y,B.goal,dt*250);B.tread+=dt*6;
      if(B.y<=B.goal+.5){if(B.ceil){B.state='turn';B.t=0;sfx('slosh')}else{B.state='wallFire';B.shots=3;B.t=.5}}break;
    case 'wallFire': B.t-=dt;B.wiggle+=dt;if(B.t<=0){if(B.shots>0){mtMortar();B.shots--;B.t=.6*m}else{B.state='release';B.vy=0;B.t=0;sfx('creak')}}break;
    case 'release':{ // lets go and falls; turns upright on the way down
      B.t+=dt;B.vy+=G*dt;B.y+=B.vy*dt;const s=B.side;B.rot=-s*Math.PI/2*Math.max(0,1-B.t/.35);
      if(B.t>.12&&B.mode==='wall'){const cxw=B.x+B.w/2,cyw=B.y+B.h/2;B.mode='air';B.w=MT_W;B.h=MT_H;B.x=clamp(cxw-MT_W/2,ARENA_L+4,ARENA_R-4-MT_W);B.y=cyw-MT_H/2}
      if(B.y+B.h>=FLOOR&&B.mode!=='wall'){mtSetGround();mtCrash(1.5);B.face=pcx>mtCX()?1:-1}break}
    case 'turn':{B.t+=dt;const k=Math.min(1,B.t/.45),s=B.side;B.rot=-s*Math.PI/2-s*Math.PI/2*k;   // round the corner onto the girder
      if(k>=1){B.mode='ceil';B.w=MT_W;B.h=MT_H;B.x=s<0?ARENA_L+6:ARENA_R-6-MT_W;B.y=MT_GIRDER_Y;B.rot=Math.PI;B.state='crawl'}break}
    case 'crawl':{const tx=clamp(pcx-B.w/2,ARENA_L+6,ARENA_R-6-B.w);B.x=approach(B.x,tx,dt*(p2?260:220));B.tread+=dt*6;
      if(Math.abs(B.x-tx)<6||Math.abs(pcx-mtCX())<30){B.state='dangle';B.t=.75*m;sfx('slosh')}break}
    case 'dangle': B.t-=dt;B.wiggle+=dt*3;if(B.t<=0){B.state='drop';B.vy=200;B.t=0;sfx('creak')}break;
    case 'drop': B.t+=dt;B.vy+=G*1.2*dt;B.y+=B.vy*dt;B.rot=Math.PI*Math.max(0,1-B.t/.32);B.mode='air';
      if(B.y+B.h>=FLOOR){mtSetGround();mtCrash(1.3);dust(mtCX(),FLOOR,14);
        for(const s of [-1,1])eshots.push({k:'rubbleWave',x:mtCX()+s*(MT_W/2+10),y:FLOOR,vx:s*360,life:2.2,h:0,tall:40})}break;
  }
  if(B.mode==='ground'&&B.state!=='leap'){B.x+=B.vx*dt;if(B.x<ARENA_L+4){B.x=ARENA_L+4;B.vx=0}if(B.x+B.w>ARENA_R-4){B.x=ARENA_R-4-B.w;B.vx=0}B.tread+=B.vx*dt/14}
  if(B.state==='leap'){B.x+=B.vx*dt;B.x=clamp(B.x,ARENA_L+4,ARENA_R-4-B.w)}
}
function mtHitMult(test){return test(mtBox())?(B.open>.5?1.5:1):0}
function mtContact(pb){
  if(B.state==='dying'||B.state==='sleep')return false;
  return overlap(mtHull(),pb);
}
function mtSprite(){ // the box the camera should see to start the fight
  return{x:B.x-20,y:B.y-60,w:B.w+40,h:B.h+60}}
/* ---------- floor tentacles, shells and mortar shells ---------- */
function updateTankShot(b,dt,pb){
  switch(b.k){
    case 'ftent':{b.ph+=dt;
      if(b.st==='warn'){b.t-=dt;if(Math.random()<.25)purpleMist(b.x,FLOOR-4,1);if(b.t<=0){b.st='up';b.t=.55;sfx('slosh');dust(b.x,FLOOR,5)}}
      else if(b.st==='up'){b.len=Math.min(150,b.len+dt*1100);b.t-=dt;if(b.t<=0)b.st='down';
        if(!P.dead&&overlap({x:b.x-16,y:FLOOR-b.len,w:32,h:b.len},pb))hurt(b.x)}
      else{b.len-=dt*700;if(b.len<=0)b.dead=true}
      return}
    case 'shell':{b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;
      if(Math.random()<.6)parts.push({x:b.x,y:b.y,vx:-b.vx*.05,vy:-b.vy*.05,g:0,c:'rgba(110,110,120,.6)',s:rand(3,6),life:.3,max:0,t:'puff'});
      if(b.life<=0||b.y>=FLOOR-4||b.x<ARENA_L-10||b.x>ARENA_R+10||solid(Math.floor(b.x/TS),Math.floor(b.y/TS))){b.dead=true;mtBoom(b.x,Math.min(b.y,FLOOR-6),46);return}
      if(!P.dead&&circleBox(b.x,b.y,b.r,pb)){b.dead=true;mtBoom(b.x,b.y,46)}
      return}
    case 'mortar':{b.vy+=b.g*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;
      if(Math.random()<.5)parts.push({x:b.x,y:b.y,vx:0,vy:0,g:0,c:'rgba(170,90,230,.5)',s:rand(3,6),life:.3,max:0,t:'puff'});
      if(b.y+b.r>=FLOOR){b.dead=true;mtBoom(b.x,FLOOR-8,62);for(let i=0;i<4;i++)purpleMist(b.x,FLOOR-10,1);return}
      if(!P.dead&&circleBox(b.x,b.y,b.r,pb)){b.dead=true;mtBoom(b.x,b.y,50)}
      return}
  }
}
function drawTankShot(b){
  switch(b.k){
    case 'ftent':{
      if(b.st==='warn'){const a=.4+.4*Math.sin(time*24);ctx.strokeStyle=`rgba(190,110,255,${a})`;ctx.lineWidth=3;ctx.lineCap='round';
        ctx.beginPath();for(const [dx1,dx2] of [[-22,-6],[-6,8],[8,24],[-4,-14],[4,16]]){ctx.moveTo(b.x+dx1,FLOOR-1);ctx.lineTo(b.x+dx2,FLOOR-1-Math.abs(dx2-dx1)*.2)}ctx.stroke();
        ctx.fillStyle=`rgba(170,90,230,${a*.4})`;ctx.beginPath();ctx.ellipse(b.x,FLOOR-2,30,6,0,0,7);ctx.fill();return}
      tentacleDraw(b.x,FLOOR,b.x+Math.sin(b.ph*8)*12,FLOOR-b.len,16,b.ph,false);return}
    case 'shell':{const a=Math.atan2(b.vy,b.vx);ctx.save();ctx.translate(b.x,b.y);ctx.rotate(a);ctx.fillStyle='#5b6170';ctx.strokeStyle=INK;ctx.lineWidth=2.5;
      ctx.beginPath();ctx.moveTo(-12,-6);ctx.lineTo(6,-6);ctx.quadraticCurveTo(14,0,6,6);ctx.lineTo(-12,6);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.fillStyle='#ffb03a';ctx.beginPath();ctx.ellipse(-15,0,5+Math.random()*3,3,0,0,7);ctx.fill();ctx.restore();return}
    case 'mortar':{const a=.25+.2*Math.sin(time*18);ctx.fillStyle=`rgba(255,80,60,${a})`;ctx.beginPath();ctx.ellipse(b.tx,FLOOR-3,40,8,0,0,7);ctx.fill();
      ctx.fillStyle='#4a3e5c';ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,7);ctx.fill();ctx.stroke();
      ctx.fillStyle='#c77dff';ctx.beginPath();ctx.arc(b.x-3,b.y-3,4,0,7);ctx.fill();return}
  }
}
/* ---------- drawing the Mutank ---------- */
// a purple tentacle from (x0,y0) to (x1,y1): a chain of shrinking circles along a wavy curve
function tentacleDraw(x0,y0,x1,y1,r0,ph,fl){
  const n=12,dx=x1-x0,dy=y1-y0,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L,pts=[];
  for(let i=0;i<=n;i++){const u=i/n,w=Math.sin(u*Math.PI*1.5+ph*5)*Math.min(18,L*.12)*u;pts.push([x0+dx*u+nx*w,y0+dy*u+ny*w,r0*(1-u*.7)+1.5])}
  for(const pass of [0,1])for(let i=0;i<pts.length;i++){const [x,y,r]=pts[i];ctx.beginPath();ctx.arc(x,y,r+(pass?0:2.6),0,7);ctx.fillStyle=pass?(fl?'#fff':i%3?'#9b5bd6':'#b57ae8'):INK;ctx.fill()}
  ctx.fillStyle='#f0c8ff';for(let i=2;i<pts.length-1;i+=2){const [x,y,r]=pts[i];ctx.beginPath();ctx.arc(x+nx*r*.5,y+ny*r*.5,1.8,0,7);ctx.fill()}
}
function drawMutank(){
  const fl=B.flash>0,st=B.state,f=B.face;
  // telegraphs in the world
  if(st==='aim'){const p=mtPivot(),k=clamp(1-B.t/.8,0,1),blink=Math.sin(time*40)>0||B.t>.25;
    if(blink){ctx.save();ctx.strokeStyle=`rgba(255,40,40,${.25+.5*k})`;ctx.lineWidth=2;ctx.setLineDash([12,8]);ctx.lineDashOffset=-time*80;
      ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+Math.cos(B.aim)*1400,p.y+Math.sin(B.aim)*1400);ctx.stroke();ctx.restore()}}
  if(st==='crouch'&&B.tx!=null){ctx.fillStyle=`rgba(80,30,90,${.2+.15*Math.sin(time*20)})`;ctx.beginPath();ctx.ellipse(B.tx,FLOOR-2,MT_W*.55,10,0,0,7);ctx.fill()}
  if(st==='dangle'||st==='crawl'){const k=st==='dangle'?1-B.t/(.75*mtSpeed()):0;ctx.fillStyle=`rgba(40,20,50,${.15+.25*k})`;ctx.beginPath();ctx.ellipse(mtCX(),FLOOR-2,MT_W*(.3+.3*k),8,0,0,7);ctx.fill()}
  if(B.mode==='ground'&&st!=='leap')shadow(mtCX(),FLOOR,MT_W*.48);
  // where to draw: the centre of its box, the rotation of its tracks
  const cx=B.x+B.w/2,cy=B.y+B.h/2;
  ctx.save();ctx.translate(cx,cy);ctx.rotate(B.rot);
  if(st==='rev'||st==='mutate')ctx.translate(rand(-2,2),rand(-1,1));
  const ground=B.mode==='ground'||B.mode==='air';
  // in its own frame: tracks at the bottom (y=+55), facing +x
  ctx.scale(ground?f:1,1);
  const W=MT_W,H=MT_H,yb=H/2,hullTop=yb-76,turY=-H/2+22,wig=B.wiggle;
  // tentacles behind the hull: legs when it leaps, grabbing arms on walls and on the girder, a few waving otherwise
  const legs=st==='crouch'||st==='leap'||st==='land';
  const clinging=B.mode==='wall'||B.mode==='ceil'||st==='grab'||st==='turn'||st==='climb';
  if(legs){const sq=st==='crouch'?1-Math.max(0,B.t)/.6:0;for(const s of [-1,-.35,.35,1])tentacleDraw(s*W*.38,yb-30,s*W*.5,yb+(st==='leap'?14:4)-sq*6,14,wig+s,fl)}
  else if(clinging){for(const s of [-1,-.4,.4,1])tentacleDraw(s*W*.36,yb-28,s*W*.46+Math.sin(wig*6+s*3)*8,yb+12,13,wig+s,fl)}
  // tracks
  ctx.lineJoin='round';ctx.strokeStyle=INK;ctx.lineWidth=3.5;
  ctx.fillStyle='#3a3d45';ctx.beginPath();ctx.roundRect(-W/2,yb-34,W,34,17);ctx.fill();ctx.stroke();
  ctx.fillStyle='#5b6170';for(let i=0;i<6;i++){const wx=-W/2+20+i*(W-40)/5;ctx.beginPath();ctx.arc(wx,yb-17,10,0,7);ctx.fill();ctx.stroke();
    ctx.save();ctx.translate(wx,yb-17);ctx.rotate(B.tread);ctx.strokeStyle='rgba(43,26,18,.6)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-6,0);ctx.lineTo(6,0);ctx.stroke();ctx.restore()}
  ctx.strokeStyle='rgba(43,26,18,.55)';ctx.lineWidth=2;const to=((B.tread*6)%12+12)%12;for(let x=-W/2+12-to;x<W/2-6;x+=12){ctx.beginPath();ctx.moveTo(x,yb-34);ctx.lineTo(x,yb-30);ctx.moveTo(x,yb-4);ctx.lineTo(x,yb);ctx.stroke()}
  ctx.strokeStyle=INK;ctx.lineWidth=3.5;
  // the hull: rusty olive armour, dented, with purple growths bursting through the seams
  const hull=fl?'#ffffff':'#6d7350',hullD=fl?'#f0f0f0':'#545a3c';
  ctx.fillStyle=hull;ctx.beginPath();ctx.moveTo(-W/2+6,yb-32);ctx.lineTo(-W/2+14,hullTop);ctx.lineTo(W/2-22,hullTop);ctx.lineTo(W/2+4,yb-48);ctx.lineTo(W/2-2,yb-32);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle=hullD;ctx.fillRect(-W/2+16,yb-44,W-44,8);
  ctx.fillStyle='rgba(140,70,30,.5)';for(const [rx,ry,rr] of [[-60,hullTop+18,7],[30,hullTop+14,5],[70,hullTop+26,4]]){ctx.beginPath();ctx.arc(rx,ry,rr,0,7);ctx.fill()}
  ctx.fillStyle='#b57ae8';for(const [gx,gy,gr] of [[-30,hullTop+4,7],[50,yb-38,6],[-78,yb-40,5]]){ctx.beginPath();ctx.arc(gx,gy,gr+Math.sin(wig*4+gx)*1.2,0,7);ctx.fill();ctx.lineWidth=2;ctx.stroke()}
  ctx.lineWidth=3.5;
  // the turret, its barrel and the hatch on top
  const tw=96,tx0=-14-tw/2;
  let aimL=ground?(f>0?B.aim:Math.PI-B.aim):-.15;   // the barrel angle in the tank's own frame
  ctx.save();ctx.translate(-14,turY);ctx.rotate(aimL);ctx.translate(-B.recoil*10,0);
  ctx.fillStyle=hullD;ctx.beginPath();ctx.roundRect(10,-7,82,14,4);ctx.fill();ctx.stroke();ctx.fillStyle=hull;ctx.beginPath();ctx.roundRect(84,-9,14,18,3);ctx.fill();ctx.stroke();
  ctx.restore();
  ctx.fillStyle=hull;ctx.beginPath();ctx.moveTo(tx0,hullTop);ctx.lineTo(tx0+10,turY-14);ctx.lineTo(tx0+tw-12,turY-14);ctx.lineTo(tx0+tw,hullTop);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle=hullD;ctx.beginPath();ctx.arc(tx0+tw-26,turY-2,6,0,7);ctx.fill();ctx.stroke();
  // the hatch: open when dazed (the purple core shows), a few tentacles always poking out
  const hx=-30,hy=turY-14,op=B.open;
  ctx.fillStyle='#2a1e38';ctx.beginPath();ctx.ellipse(hx,hy,20,6,0,0,7);ctx.fill();ctx.stroke();
  if(op>.05){ctx.fillStyle=`rgba(220,140,255,${.4+.3*Math.sin(time*10)})`;ctx.beginPath();ctx.ellipse(hx,hy-2,26,12,0,0,7);ctx.fill();
    ctx.fillStyle='#e6b8ff';ctx.beginPath();ctx.arc(hx,hy-3,8,0,7);ctx.fill()}
  const nT=B.phase===1?2:B.phase===2?3:5,big=st==='mutate'||st==='intro';
  for(let i=0;i<nT;i++){const s=(i/(Math.max(1,nT-1))-.5)*1.6,len=(big?70:op>.5?30:44)+Math.sin(wig*3+i*2)*10;
    tentacleDraw(hx+s*12,hy,hx+s*40+Math.sin(wig*2+i)*14,hy-len,9,wig+i*1.3,fl)}
  ctx.save();ctx.translate(hx+24,hy-1);ctx.rotate(-1.1*op-.05);ctx.fillStyle=hull;ctx.beginPath();ctx.ellipse(16,0,18,5,0,0,7);ctx.fill();ctx.stroke();ctx.restore();   // the lid
  // a purple eye peers out of the driver's slit
  ctx.fillStyle='#1a1424';ctx.beginPath();ctx.roundRect(W/2-46,hullTop+10,26,8,3);ctx.fill();
  const ey=st==='rev'||st==='ram'||st==='aim'?'#ff3be0':'#c77dff';ctx.fillStyle=ey;ctx.beginPath();ctx.arc(W/2-33+Math.sin(time*2)*5,hullTop+14,3,0,7);ctx.fill();
  if(st==='crash'){ctx.fillStyle='#fff3b0';for(let k=0;k<4;k++){const a=time*6+k*1.6;drawStar(-14+Math.cos(a)*44,turY-50+Math.sin(a)*8,5,time)}}
  ctx.restore();
}
