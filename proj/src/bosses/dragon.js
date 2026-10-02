/* ---------- dragon ---------- */
// big animated wind swooshes blowing away from the dragon during the gust attack
function drawGust(){
  const dir=Math.sign(P.x+P.w/2-dcx())||1, fade=Math.min(1,(2.4-B.t)/.3,B.t/.3);
  const L=ARENA_L, W=ARENA_R-ARENA_L;
  ctx.save();ctx.lineCap='round';
  for(let k=0;k<22;k++){
    const y=FLOOR-14-hash(k,3)*280, len=110+hash(k,5)*140, sp=650+hash(k,7)*450;
    let x=((time*sp+hash(k,9)*W)%W); x=dir>0?L+x:ARENA_R-x;
    const wob=Math.sin(time*6+k)*9, a=fade*(.55+.4*hash(k,11)), lw=3+hash(k,13)*3;
    const path=()=>{ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x-dir*len*.33,y-12+wob,x-dir*len*.66,y+12-wob,x-dir*len,y);
      if(k%3===0){ctx.moveTo(x,y);ctx.arc(x,y-11,11,Math.PI/2,Math.PI/2+dir*Math.PI*1.4,dir<0)}};
    path();ctx.strokeStyle=`rgba(90,60,40,${.35*a})`;ctx.lineWidth=lw+3;ctx.stroke();
    path();ctx.strokeStyle=`rgba(255,255,255,${a})`;ctx.lineWidth=lw;ctx.stroke();
  }
  ctx.restore();
}

const DRAGON_HEAD_MULT=1.4, BREATH_T=1.05, INF_WIND=1.275, INFERNO_T=2.3, INFERNO_H=34;
// phase-2 signature attack: the whole arena floor burns, only the platforms are safe
function drawInferno(){
  if(B.state!=='infernoWind'&&B.state!=='inferno') return;
  const L=Math.max(ARENA_L,camX-20), Rr=Math.min(ARENA_R,camX+VW+20);
  if(B.state==='infernoWind'){
    const k=1-B.t/INF_WIND, a=.25+.35*k+.15*Math.sin(time*18);
    const g=ctx.createLinearGradient(0,FLOOR-40,0,FLOOR);g.addColorStop(0,'rgba(255,90,20,0)');g.addColorStop(1,`rgba(255,110,30,${a})`);
    ctx.fillStyle=g;ctx.fillRect(L,FLOOR-40,Rr-L,40);
    ctx.strokeStyle=`rgba(255,${Math.round(150+80*k)},60,${.5+.4*k})`;ctx.lineWidth=3;ctx.beginPath();
    for(let x=Math.floor(L/24)*24;x<Rr;x+=24){const y=FLOOR-3-hash(x,1)*4;ctx.moveTo(x,y);ctx.lineTo(x+12,FLOOR-1-hash(x,2)*5)}ctx.stroke();
    return;
  }
  const fade=Math.min(1,B.t/.3,(INFERNO_T-B.t)/.2);
  const g=ctx.createLinearGradient(0,FLOOR-90,0,FLOOR);g.addColorStop(0,'rgba(255,60,20,0)');g.addColorStop(.55,`rgba(255,120,30,${.55*fade})`);g.addColorStop(1,`rgba(255,230,120,${.95*fade})`);
  ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(L,FLOOR);
  for(let x=Math.floor(L/16)*16;x<=Rr+16;x+=16){const h=(46+28*Math.sin(time*13+x*.21)+18*Math.sin(time*7.3+x*.05))*fade;ctx.lineTo(x,FLOOR-h)}
  ctx.lineTo(Rr+16,FLOOR);ctx.closePath();ctx.fill();
  ctx.fillStyle=`rgba(255,245,180,${.8*fade})`;ctx.beginPath();ctx.moveTo(L,FLOOR);
  for(let x=Math.floor(L/12)*12;x<=Rr+12;x+=12){const h=(16+10*Math.sin(time*17+x*.4))*fade;ctx.lineTo(x,FLOOR-h)}
  ctx.lineTo(Rr+12,FLOOR);ctx.closePath();ctx.fill();
}
function makeDragon(){return{kind:'dragon',x:ARENA_L+27*TS,y:FLOOR-84,w:180,h:84,hp:89,max:89,face:-1,state:'sleep',t:0,vx:0,vy:0,phase:1,flap:0,mouth:0,glow:0,
  last:'',repeat:0,tx:0,ty:0,side:1,infCD:0,emitT:0,burnT:0,shots:0,landed:true,sweep0:0,sweep1:0,targetX:0,flash:0}}
const dcx=()=>B.x+B.w/2, dcy=()=>B.y+B.h/2;
// the inferno that opens phase 2 is armoured: 75% less damage until its breath ends (later infernos are not)
const dragonArmored=()=>B.infArmor&&(B.state==='infernoWind'||B.state==='inferno');
function dragonBody(){return{x:B.x+12,y:B.y+14,w:B.w-24,h:B.h-20}}
function dragonHeadPos(){return B.state==='tired'?{x:dcx()+B.face*128,y:FLOOR-26}:{x:dcx()+B.face*118,y:dcy()-26}}
function dragonHeadBox(){const h=dragonHeadPos();return{x:h.x-30,y:h.y-22,w:60,h:44}}
function dragonMouth(){const h=dragonHeadPos();return{x:h.x+B.face*30,y:h.y+8}}
function dragonEnrage(){B.state='enrage';B.t=1.8;B.vx=0;B.mouth=1;sfx('roar');shake(1,7)}
function flyTo(tx,ty,dt,sp=320){
  B.x+=clamp((tx-dcx())*2.2,-sp,sp)*dt; B.y+=clamp((ty-dcy())*2.2,-sp,sp)*dt;
  B.x=clamp(B.x,ARENA_L+20,ARENA_R-B.w-20);
}
function dragonHoverTarget(){
  const pcx=P.x+P.w/2;
  if(Math.abs(dcx()-pcx)<120) B.side=-B.side; else B.side=Math.sign(dcx()-pcx)||1;
  B.tx=clamp(pcx+B.side*300,ARENA_L+140,ARENA_R-140); B.ty=150;
}
function dragonChoose(){
  const p2=B.phase===2;
  const opts=[['breath',3],['volley',3],['dive',2.5]];
  if(p2){opts.push(['meteor',2]);opts.push(['gust',2.2]);if(B.infCD<=0)opts.push(['inferno',1.8])}
  for(const o of opts) if(o[0]===B.last) o[1]*=B.repeat>=1?.1:.5;
  let r=Math.random()*opts.reduce((a,o)=>a+o[1],0), pk=opts[0][0];
  for(const o of opts){r-=o[1];if(r<=0){pk=o[0];break}}
  B.repeat=pk===B.last?B.repeat+1:0;B.last=pk;
  dragonHoverTarget();
  if(pk==='breath'){B.state='breathWind';B.t=.6;B.ty=165}
  else if(pk==='volley'){B.state='volleyWind';B.t=.45;B.shots=0}
  else if(pk==='dive'){B.state='diveWind';B.t=.75;B.ty=70}
  else if(pk==='meteor'){B.state='meteorUp';sfx('screech')}
  else if(pk==='inferno') startInferno();
  else {B.state='gust';B.t=2.4;B.tx=dcx()<(ARENA_L+ARENA_R)/2?ARENA_L+180:ARENA_R-180;B.ty=200;B.emitT=.3}
}
// when the dragon slams into the ground it lobs burning boulders to both sides:
// phase 1 - two boulders, phase 2 - four boulders with a wider spread (none of them aimed at the player)
function dragonBoulders(){
  const sx=dcx(), sy=B.y-6, g=1300, Tf=.95, p2=B.phase===2;
  const s0=Math.random()<.5?1:-1;
  const ds=p2?[s0*rand(150,280),-s0*rand(150,280),s0*rand(380,580),-s0*rand(380,580)]
             :[s0*rand(150,330),-s0*rand(150,330)];
  for(const d of ds){const tx=clamp(sx+d,ARENA_L+30,ARENA_R-30);
    eshots.push({k:'meteor',lob:true,x:sx,y:sy,vx:(tx-sx)/Tf,vy:((FLOOR-16)-sy-.5*g*Tf*Tf)/Tf,g,r:16})}
  sfx('fire');embers(sx,sy,10);
}
function startInferno(){B.state='infernoWind';B.t=INF_WIND;B.infDir=Math.random()<.5?-1:1;B.infCD=9;sfx('screech')}
function spawnVents(){
  const n=5, span=ARENA_R-ARENA_L-320;
  for(let i=0;i<n;i++){const x=ARENA_L+160+span*(i+.5)/n+rand(-40,40);
    if(Math.abs(x-(door.x+door.w/2))<70) continue;
    eshots.push({k:'vent',x,st:'idle',t:rand(1,3)})}
}
function updateDragon(dt){
  const p2=B.phase===2, pcx=P.x+P.w/2;
  const flying=['tired','sleep','dying','dead'].indexOf(B.state)<0;
  if(B.infCD>0) B.infCD-=dt;
  B.flap+=dt*(flying?(B.state==='gust'?18:9):0);
  B.glow=approach(B.glow,(B.state==='breathWind'||B.state==='diveWind'||B.state==='volleyWind')?1:0,dt*3);
  if(B.state==='gust') B.mouth=approach(B.mouth,B.emitT<.22?1:0,dt*(B.emitT<.22?9:4));
  else if(B.state!=='breath'&&B.state!=='enrage') B.mouth=approach(B.mouth,B.state==='breathWind'||B.state==='volleyWind'?.6:0,dt*3);
  if(flying&&['dive','meteorUp','meteorDown','infernoWind','inferno','breath'].indexOf(B.state)<0) B.face=Math.sign(pcx-dcx())||B.face;
  switch(B.state){
    case 'intro': B.t-=dt;B.mouth=.5+.5*Math.sin(time*16);flyTo(dcx(),200,dt,200);if(B.t<=0){B.state='hover';B.t=.8;dragonHoverTarget()}break;
    case 'hover': flyTo(B.tx,B.ty+Math.sin(time*2)*18,dt);B.t-=dt;if(B.t<=0)dragonChoose();break;
    case 'breathWind': flyTo(B.tx,B.ty,dt);B.t-=dt;if(B.t<=0){B.state='breath';B.t=BREATH_T;const m=dragonMouth();B.sweep0=m.x+B.face*40;B.sweep1=B.sweep0+B.face*460;sfx('fire')}break;
    case 'breath':{
      flyTo(B.tx,B.ty,dt,120);B.t-=dt;B.mouth=1;
      const k=1-B.t/BREATH_T, target=B.sweep0+(B.sweep1-B.sweep0)*k, m=dragonMouth();
      B.emitT-=dt;
      while(B.emitT<=0){B.emitT+=.035;const dx=target-m.x,dy=FLOOR-m.y,l=Math.hypot(dx,dy)||1;
        eshots.push({k:'flame',x:m.x,y:m.y,vx:dx/l*560+rand(-30,30),vy:dy/l*560+rand(-30,30),r:10,life:.9,age:0})}
      if(Math.random()<.15) sfx('fire');
      if(B.t<=0){B.state='hover';B.t=p2?.7:1.1;dragonHoverTarget()}
    }break;
    case 'volleyWind': flyTo(B.tx,B.ty,dt);B.t-=dt;if(B.t<=0){B.state='volley';B.t=0}break;
    case 'volley':{
      flyTo(B.tx,B.ty,dt);B.t-=dt;const total=p2?5:3;
      if(B.t<=0&&B.shots<total){
        const m=dragonMouth(),Tt=.9,g=900,tx=P.x+P.w/2+(B.shots-(total-1)/2)*70,ty=P.y+P.h-10;
        eshots.push({k:'fireball',x:m.x,y:m.y,vx:(tx-m.x)/Tt,vy:(ty-m.y-.5*g*Tt*Tt)/Tt,g,r:12,life:3});
        B.shots++;B.t=.2;B.mouth=1;sfx('fire');
      }
      if(B.shots>=total&&B.t<=0){B.state='hover';B.t=p2?.8:1.2;dragonHoverTarget()}
    }break;
    case 'diveWind': flyTo(dcx(),B.ty,dt,420);B.t-=dt;if(B.t<=0){B.state='dive';B.targetX=pcx;sfx('screech');
      const dx=B.targetX-dcx(),dy=(FLOOR-B.h/2)-dcy(),l=Math.hypot(dx,dy)||1;B.vx=dx/l*720;B.vy=dy/l*720;B.face=Math.sign(dx)||B.face}break;
    case 'dive':
      B.x+=B.vx*dt;B.y+=B.vy*dt;
      if(B.x<ARENA_L+10||B.x+B.w>ARENA_R-10){B.x=clamp(B.x,ARENA_L+10,ARENA_R-B.w-10);B.vx=0}
      if(B.y+B.h>=FLOOR){B.y=FLOOR-B.h;B.vx=B.vy=0;B.state='tired';B.t=p2?1.4:1.9;shake(.45,12);sfx('boom');dust(dcx(),FLOOR,16);dragonBoulders()}
      break;
    case 'tired': B.t-=dt;B.mouth=.3;if(B.t<=0){B.state='takeoff';B.t=.5;sfx('jump')}break;
    case 'takeoff': B.y-=260*dt;B.t-=dt;if(B.t<=0){B.state='hover';B.t=.6;dragonHoverTarget()}break;
    case 'enrage':
      flyTo((ARENA_L+ARENA_R)/2,140,dt,260);B.t-=dt;B.mouth=.8+.2*Math.sin(time*20);
      skyHeat=approach(skyHeat,1,dt);
      if(B.t<=0){B.phase=2;floater((ARENA_L+ARENA_R)/2,120,T('fPhase2'));startInferno();B.infArmor=true}break;   // only this first inferno is armoured
    case 'infernoWind':
      flyTo((ARENA_L+ARENA_R)/2,140,dt,360);B.t-=dt;B.mouth=approach(B.mouth,1,dt*1.5);B.glow=1;
      if(Math.random()<.9){const x=rand(ARENA_L,ARENA_R);parts.push({x,y:FLOOR-2,vx:rand(-20,20),vy:rand(-90,-40),g:-20,c:Math.random()<.5?'rgba(90,60,50,.55)':'rgba(255,140,40,.8)',s:rand(4,8),life:rand(.4,.8),max:0,t:'puff'})}
      if(B.t<=0){B.state='inferno';B.t=INFERNO_T;sfx('roar');sfx('boom');shake(INFERNO_T,6)}break;
    case 'inferno':{
      flyTo((ARENA_L+ARENA_R)/2,140,dt,200);B.t-=dt;B.mouth=1;B.glow=1;
      // the downward stream swings to one side, then the other
      const m=dragonMouth(), ang=B.infDir*Math.sin((INFERNO_T-B.t)*2.7)*.5, sx=Math.sin(ang), sy=Math.cos(ang);
      for(let i=0;i<3;i++){const v=rand(470,560);parts.push({x:m.x+rand(-6,6),y:m.y,vx:sx*v+rand(-35,35),vy:sy*v,g:0,c:Math.random()<.5?'#ffd84a':'#ff6a1a',s:rand(7,12),life:1.1,max:0,t:'puff'})}
      const L=(FLOOR-m.y)/sy, pb={x:P.x+4,y:P.y+8,w:P.w-8,h:P.h-8};
      if(!P.dead) for(let k=1;k<=10;k++){const px=m.x+sx*L*k/10,py=m.y+sy*L*k/10;if(circleBox(px,py,24,pb)){hurt(px);break}}
      if(Math.random()<.2) sfx('fire');
      if(Math.random()<.9) embers(rand(ARENA_L,ARENA_R),FLOOR-rand(4,50),2);
      const inArena=P.x+P.w>ARENA_L&&P.x<ARENA_R;
      if(!P.dead&&inArena&&P.y+P.h>FLOOR-INFERNO_H) hurt(P.x+P.w/2+rand(-1,1));
      if(B.t<=0){B.state='hover';B.t=.9;B.infCD=9;B.infArmor=false;dragonHoverTarget()}
    }break;
    case 'meteorUp': B.y-=520*dt;if(B.y<-320){B.state='meteor';B.t=2.2;B.emitT=0}break;
    case 'meteor':
      B.t-=dt;B.emitT-=dt;
      if(B.emitT<=0){B.emitT=.2;const x=Math.random()<.4?clamp(pcx+rand(-60,60),ARENA_L+30,ARENA_R-30):rand(ARENA_L+40,ARENA_R-40);
        eshots.push({k:'meteor',x,y:-40,vy:80,g:1100,r:18})}
      if(B.t<=0){B.state='meteorDown';B.x=clamp(pcx+(Math.random()<.5?-1:1)*320-B.w/2,ARENA_L+20,ARENA_R-B.w-20);B.y=-220;B.face=Math.sign(pcx-dcx())||1}
      break;
    case 'meteorDown': B.y+=620*dt;if(B.y+B.h>=FLOOR){B.y=FLOOR-B.h;B.state='tired';B.t=1.2;shake(.3,9);sfx('boom');dust(dcx(),FLOOR,12);if(p2)dragonBoulders()}break;
    case 'gust':{
      flyTo(B.tx,B.ty,dt);B.t-=dt;
      const dir=Math.sign(pcx-dcx())||1;
      if(!P.dead&&!P.inWater){P.windV=dir*230;if(P.onGround&&Math.random()<.5)dust(P.x+P.w/2-dir*10,P.y+P.h,1,dir)}
      if(Math.random()<.5){const x=rand(ARENA_L,ARENA_R);parts.push({x,y:FLOOR-rand(2,12),vx:dir*rand(260,420),vy:rand(-60,-10),g:120,c:'rgba(232,200,140,.9)',s:rand(3,6),life:rand(.4,.8),max:0,t:'puff'})}
      if(Math.random()<.6) parts.push({x:dcx()+dir*rand(60,300),y:rand(FLOOR-200,FLOOR-10),vx:dir*rand(380,520),vy:0,g:0,c:'rgba(255,245,220,.7)',s:rand(2,4),life:.35,max:0,t:'dot'});
      B.emitT-=dt;
      if(B.emitT<=0){B.emitT=.55;B.shots=(B.shots||0)+1;const m=dragonMouth(),low=B.shots%2===0;
        eshots.push({k:'fireball',x:m.x,y:m.y,vx:0,vy:0,g:0,r:12,life:3,aim:{x:m.x+dir*200,y:low?FLOOR-22:FLOOR-84},sp:400,dir,ghost:true});B.mouth=1;sfx('fire')}
      if(B.t<=0){B.state='hover';B.t=.8;dragonHoverTarget()}
    }break;
    case 'dying':
      B.t-=dt;B.vy+=G*.6*dt;B.y=Math.min(B.y+B.vy*dt,FLOOR-B.h);
      if(Math.random()<.3){burst(B.x+rand(0,B.w),B.y+rand(0,B.h),8,Math.random()<.5?'#c8432b':'#ffd84a',220);sfx('hit')}
      if(B.t<=0) bossDefeated();break;
  }
}
function drawDragon(){
  drawInferno();
  if(B.state==='gust') drawGust();
  const f=B.face,cx=dcx(),cy=dcy(),fl=B.flash>0;
  const red=fl?'#fff':'#c8432b',dark=fl?'#fff':'#8f2a1c',belly=fl?'#fff':'#f2b25c',wingBack=fl?'#fff':'#9c341f',wingFront=fl?'#fff':'#e0703f';
  const grounded=B.state==='tired'||B.state==='sleep'||(B.state==='dying'&&B.y+B.h>=FLOOR-2);
  // floor shadow
  const alt=clamp((FLOOR-(B.y+B.h))/400,0,1);
  ctx.fillStyle=`rgba(0,0,0,${.22-alt*.14})`;ctx.beginPath();ctx.ellipse(cx,FLOOR+2,130-alt*50,10,0,0,7);ctx.fill();
  if(dragonArmored()){ // a shimmering heat shield while it is armoured
    const pr=.7+.3*Math.sin(time*9);ctx.fillStyle=`rgba(255,190,80,${.18*pr})`;ctx.strokeStyle=`rgba(255,220,120,${.6*pr})`;ctx.lineWidth=3;
    ctx.beginPath();ctx.ellipse(cx+f*30,cy-10,170,95,0,0,7);ctx.fill();ctx.stroke()}
  ctx.save();ctx.translate(cx,cy);if(B.state==='enrage')ctx.translate(rand(-2,2),rand(-2,2));ctx.scale(f,1);
  ctx.lineWidth=3.5;ctx.strokeStyle=INK;ctx.lineJoin='round';
  const a=grounded?-.6:Math.sin(B.flap);
  const wing=(ox,colr,sc)=>{
    ctx.fillStyle=colr;ctx.beginPath();ctx.moveTo(ox-10,-22);
    ctx.lineTo(ox-50*sc,-40-80*(.45+.55*a)*sc);ctx.lineTo(ox-110*sc,-30-50*(.3+.7*a)*sc);ctx.lineTo(ox-150*sc,-10-20*a*sc);
    ctx.quadraticCurveTo(ox-100*sc,-6,ox-80*sc,4);ctx.quadraticCurveTo(ox-50*sc,-6,ox-30,4);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(ox-10,-22);ctx.lineTo(ox-110*sc,-30-50*(.3+.7*a)*sc);ctx.moveTo(ox-10,-22);ctx.lineTo(ox-80*sc,4);ctx.stroke();ctx.lineWidth=3.5;
  };
  wing(10,wingBack,grounded?.6:1);
  // tail
  const tw=Math.sin(time*3)*12;
  ctx.fillStyle=red;ctx.beginPath();ctx.moveTo(-70,-14);ctx.quadraticCurveTo(-150,-4+tw,-200,24+tw);ctx.quadraticCurveTo(-150,14,-72,14);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle=dark;ctx.beginPath();ctx.moveTo(-200,24+tw);ctx.lineTo(-222,8+tw);ctx.lineTo(-214,34+tw);ctx.closePath();ctx.fill();ctx.stroke();
  // legs
  const legY=grounded?FLOOR-cy:20;
  ctx.fillStyle=dark;[[-40],[40]].forEach(([lx])=>{ctx.beginPath();ctx.roundRect(lx-10,10,20,Math.max(16,legY-10),8);ctx.fill();ctx.stroke()});
  // body
  ctx.fillStyle=red;ctx.beginPath();ctx.ellipse(0,0,92,38,0,0,7);ctx.fill();ctx.stroke();
  ctx.fillStyle=belly;ctx.beginPath();ctx.ellipse(8,16,70,16,0,0,Math.PI);ctx.fill();
  ctx.strokeStyle='rgba(43,26,18,.4)';ctx.lineWidth=2;for(let k=-4;k<=4;k++){ctx.beginPath();ctx.moveTo(8+k*15,20);ctx.lineTo(8+k*15,30);ctx.stroke()}
  ctx.strokeStyle=INK;ctx.lineWidth=3;
  ctx.fillStyle=dark;for(let k=0;k<6;k++){const x=-70+k*22;ctx.beginPath();ctx.moveTo(x,-34+Math.abs(k-2.5)*1.5);ctx.lineTo(x+8,-50);ctx.lineTo(x+16,-34+Math.abs(k-2.5)*1.5);ctx.fill();ctx.stroke()}
  // neck + head
  const hp=dragonHeadPos(), hx=(hp.x-cx)*f, hy=hp.y-cy;
  ctx.lineCap='round';ctx.strokeStyle=INK;ctx.lineWidth=30;ctx.beginPath();ctx.moveTo(55,-6);ctx.quadraticCurveTo(95,-30,hx-12,hy);ctx.stroke();
  ctx.strokeStyle=red;ctx.lineWidth=23;ctx.stroke();ctx.lineCap='butt';
  ctx.save();ctx.translate(hx,hy);
  ctx.strokeStyle=INK;ctx.lineWidth=3;
  ctx.fillStyle=belly;ctx.beginPath();ctx.moveTo(-18,-12);ctx.quadraticCurveTo(-34,-34,-46,-38);ctx.quadraticCurveTo(-30,-22,-12,-4);ctx.fill();ctx.stroke();
  const jaw=B.mouth*.6;
  ctx.save();ctx.rotate(jaw*.6);ctx.fillStyle=dark;ctx.beginPath();ctx.moveTo(-14,4);ctx.lineTo(40,8);ctx.quadraticCurveTo(44,16,34,18);ctx.lineTo(-10,16);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
  if(B.mouth>.2){ctx.fillStyle=B.state==='breath'?'#ffd84a':'#ff7a2a';ctx.beginPath();ctx.moveTo(-6,4);ctx.lineTo(38,4+jaw*20);ctx.lineTo(38,4);ctx.closePath();ctx.fill()}
  ctx.save();ctx.rotate(-jaw*.25);ctx.fillStyle=red;ctx.beginPath();ctx.moveTo(-24,-4);ctx.quadraticCurveTo(-20,-24,6,-22);ctx.quadraticCurveTo(38,-18,46,-4);ctx.quadraticCurveTo(46,6,36,6);ctx.lineTo(-18,8);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='#fff';for(let k=0;k<4;k++){const x=6+k*9;ctx.beginPath();ctx.moveTo(x,5);ctx.lineTo(x+4,12);ctx.lineTo(x+8,5);ctx.fill()}
  ctx.fillStyle=dark;ctx.beginPath();ctx.arc(40,-8,2.5,0,7);ctx.fill();
  const g=B.glow;
  if(g>0){for(const r of [26,16]){ctx.fillStyle=`rgba(255,120,20,${.3*g})`;ctx.beginPath();ctx.arc(4,-12,r*(.6+g*.5),0,7);ctx.fill()}}
  ctx.fillStyle=g>0?`rgb(255,${Math.round(220-150*g)},40)`:'#ffe45c';ctx.beginPath();ctx.ellipse(4,-12,6,5,0,0,7);ctx.fill();ctx.stroke();
  ctx.fillStyle=INK;
  if(B.state==='tired'||B.state==='dying'){ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(0,-16);ctx.lineTo(8,-8);ctx.moveTo(8,-16);ctx.lineTo(0,-8);ctx.stroke()}
  else{ctx.beginPath();ctx.ellipse(5,-12,1.8,4.5,0,0,7);ctx.fill();ctx.lineWidth=3.5;ctx.beginPath();ctx.moveTo(-8,-22);ctx.lineTo(16,-18);ctx.stroke()}
  ctx.restore();ctx.restore();
  wing(-6,wingFront,grounded?.55:.9);
  ctx.restore();
  if(B.state==='tired') for(let k=0;k<3;k++){const an=time*5+k*2.1;drawStar(hp.x+Math.cos(an)*30,hp.y-40+Math.sin(an)*8,7,time*4)}
  if(B.state==='breath'&&Math.random()<.5) embers(dragonMouth().x,dragonMouth().y,2);
}

registerBoss('dragon',{make:makeDragon,update:updateDragon,draw:drawDragon,burst:'#c8432b',nameKey:'boss2',introT:1.8,
  dmgMult:()=>dragonArmored()?.25:1});
