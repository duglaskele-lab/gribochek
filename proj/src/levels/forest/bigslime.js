/* ---------- level 1 mini-boss: the giant purple slime ---------- */
// It sleeps in a clearing in the second half of the forest (the generator builds the clearing, see level.miniboss).
// Woken up, it hops after the player, crouches and leaps high to land on her (the landing sends a wave of goo
// along the floor both ways), rams her, sliding fast along the floor (it stops before any drop), and spits blobs
// of goo that a punch can knock away. Every third of its health it sheds
// a small purple slime, and when it dies it bursts into two more. It falls through one-way planks, so they are
// no safe refuge, and it never leaves its clearing.
const BS_W=150, BS_H=112;
function bsRange(e){ // the flat floor of the clearing: stops at a step up, a drop or a wall
  const r=Math.floor((e.y+e.h+4)/TS), c=Math.floor((e.x+e.w/2)/TS);
  const ok=cc=>isFloorT(tile(cc,r))&&!solid(cc,r-1)&&!solid(cc,r-2)&&!solid(cc,r-3);
  let a=c,b=c;while(a-1>c-24&&ok(a-1))a--;while(b+1<c+24&&ok(b+1))b++;
  e.x0=a*TS;e.x1=(b+1)*TS;
}
function bsInit(e){
  e.max=e.hp;e.state='sleep';e.t=0;e.hops=0;e.cd=0;e.squash=0;e.mouth=0;e.split=2;e.face=-1;e.zz=0;
  e.bub=[0,1,2,3].map(i=>({x:rand(-.5,.5),y:rand(0,1),s:rand(.04,.08)}));
  bsRange(e);
}
// a small purple slime flies out of the big one
function bsSpawnKid(e,dir){
  if(enemies.filter(k=>k.mini&&!k.dead).length>=4) return;
  const k=makeEnemy('slime',Math.floor((e.x+e.w/2)/TS),{y:e.y+e.h});if(!k) return;
  k.hue=2;k.mini=true;k.x=e.x+e.w/2-k.w/2;k.y=e.y+e.h*.3;k.vx=dir*rand(140,220);k.vy=-rand(450,600);k.onGround=false;k.t=.8;k.dir=dir;
  enemies.push(k);burst(e.x+e.w/2,e.y+e.h*.4,10,'#b77ee0',220);
}
function bsWake(e){
  if(e.state!=='sleep') return;
  e.state='wake';e.t=1.1;e.face=Math.sign(P.x+P.w/2-(e.x+e.w/2))||-1;e.squash=.3;
  sfx('roar');shake(.45,6);floater(e.x+e.w/2,e.y-40,T('fBigSlime'));
}
function bsSlam(e){ // a heavy landing: the ground shakes and goo runs along the floor both ways
  const cx=e.x+e.w/2,by=e.y+e.h,rage=e.hp<=e.max*.5;
  e.squash=.3;shake(.4,9);sfx('boom');dust(cx-50,by,6,-1);dust(cx+50,by,6,1);
  burst(cx,by-10,14,'#a86ad6',260,900,[4,8]);
  for(const s of [-1,1]) eshots.push({k:'gooWave',x:cx+s*(e.w/2-10),y:by,vx:s*(rage?360:300),life:rage?1.7:1.3,h:0});
}
function bsSpit(e){
  const mx=e.x+e.w/2+e.face*e.w*.32,my=e.y+e.h*.45,rage=e.hp<=e.max*.5,n=rage?5:3,g=1100;
  const tx=P.x+P.w/2,ty=P.y+P.h/2,Tt=clamp(Math.abs(tx-mx)/430,.5,1.15);
  for(let i=0;i<n;i++){const k=i-(n-1)/2,T2=Tt*(1+k*.14);
    eshots.push({k:'goo',x:mx,y:my,vx:(tx-mx)/T2+k*40,vy:(ty-my-.5*g*T2*T2)/T2,g,r:12,rot:0})}
  sfx('lick');burst(mx,my,8,'#c99af0',160);
}
function bsUpdate(e,dt){
  const was=e.onGround;
  e.vy=Math.min(e.vy+G*dt,1100);moveBody(e,dt,false);   // heavy: falls straight through one-way planks
  if(e.y>WH+60){e.dead=true;return}
  if(e.x<e.x0){e.x=e.x0;if(e.vx<0)e.vx=0}
  if(e.x+e.w>e.x1){e.x=e.x1-e.w;if(e.vx>0)e.vx=0}
  if(e.squash>0) e.squash-=dt;
  e.mouth=approach(e.mouth,e.state==='spitWind'?1:0,dt*5);
  for(const b of e.bub){b.y-=b.s*dt*3;if(b.y<0){b.y=1;b.x=rand(-.5,.5)}}
  const cx=e.x+e.w/2,dx=P.x+P.w/2-cx,adx=Math.abs(dx),dy=P.y+P.h-(e.y+e.h),rage=e.hp<=e.max*.5;
  // it sheds a small slime at 2/3 and 1/3 of its health
  while(e.split>0&&e.hp<=e.max*e.split/3){e.split--;bsSpawnKid(e,-(Math.sign(dx)||1))}
  e.t-=dt;
  switch(e.state){
    case 'sleep':
      e.vx=0;e.zz-=dt;
      if(e.zz<=0&&Math.abs(e.x-P.x)<VW){e.zz=.9;parts.push({x:cx+e.face*30,y:e.y+10,vx:rand(10,30),vy:-50,g:-20,c:'rgba(255,255,255,.9)',s:5,life:1,max:0,t:'puff'})}
      if(!P.dead&&adx<380&&Math.abs(dy)<200) bsWake(e);
      break;
    case 'wake': e.vx=0;if(e.t<=0){e.state='idle';e.t=.3;e.hops=0}break;
    case 'idle':
      e.vx=approach(e.vx,0,1400*dt);
      if(adx>20) e.face=Math.sign(dx);
      if(e.t<=0&&e.onGround&&!P.dead){
        if(e.hops>=(rage?1:2)){e.hops=0;
          const opts=[['spit',2]];
          if(adx>140) opts.push(['leap',e.last==='leap'?1:3]);
          if(adx>180&&Math.abs(dy)<70) opts.push(['ram',e.last==='ram'?1:rage?4:3]);   // only when she is on its floor
          let r=Math.random()*opts.reduce((a,o)=>a+o[1],0),pk=opts[0][0];for(const o of opts){r-=o[1];if(r<=0){pk=o[0];break}}
          e.last=pk;
          if(pk==='leap'){e.state='crouch';e.t=rage?.4:.55;sfx('creak')}
          else if(pk==='ram'){e.state='ramWind';e.t=rage?.45:.6;e.face=Math.sign(dx)||e.face;sfx('creak')}
          else{e.state='spitWind';e.t=rage?.4:.55}}
        else{e.hops++;const vy=rage?560:500,vx=rage?210:165,reach=vx*2*vy/G;   // a hop never ends over a drop: then it hops in place
          e.vy=-vy;e.vx=groundAhead(e,e.face,reach*2)?e.face*vx:0;e.onGround=false;e.state='air';e.big=false}
      }
      break;
    case 'crouch': // squeezes down, trembling, then jumps at the player
      e.vx=0;
      if(e.t<=0){const air=1.0,tx=clamp(P.x+P.w/2+P.vx*.25,e.x0+e.w/2,e.x1-e.w/2);
        e.vy=-G*air/2;e.vx=clamp((tx-cx)/air,-520,520);e.onGround=false;e.state='air';e.big=true;sfx('jump');dust(cx,e.y+e.h,8)}
      break;
    case 'air':
      if(e.onGround){
        if(e.big){bsSlam(e);e.state='idle';e.t=rage?.55:.8}
        else{e.squash=.18;shake(.12,3);dust(cx,e.y+e.h,4);sfx('land');e.state='idle';e.t=rage?.25:.35}
        e.vx=0}
      break;
    case 'ramWind': // backs up a little, trembling and scraping the ground
      e.vx=groundAhead(e,-e.face,TS*.4)?-e.face*45:0;
      if(Math.random()<.4) dust(cx-e.face*e.w*.4,e.y+e.h,1,-e.face);
      if(e.t<=0){e.state='ram';e.t=1.6;e.rx=cx;e.vx=e.face*(rage?660:560);sfx('roar');shake(.15,4)}
      break;
    case 'ram':{ // slides at her; stops before a drop, at the edge of the clearing or at a wall
      e.vx=e.face*(rage?660:560);
      if(Math.random()<.6) dust(cx-e.face*e.w*.45,e.y+e.h,1,-e.face);
      const edge=e.face>0?e.x+e.w>=e.x1-2:e.x<=e.x0+2, passed=e.face*(cx-(P.x+P.w/2))>240;
      if(e.hitWall||edge||!groundAhead(e,e.face,TS*.6)||passed||e.t<=0){
        const hard=e.hitWall||edge;e.vx=0;e.state='ramStop';e.t=hard?.7:.45;e.squash=.25;
        shake(hard?.3:.12,hard?7:3);sfx(hard?'boom':'land');dust(cx+e.face*e.w*.45,e.y+e.h,6,e.face)}
      break}
    case 'ramStop': e.vx=0;if(e.t<=0){e.state='idle';e.t=rage?.25:.4}break;
    case 'spitWind':
      e.vx=0;if(adx>20) e.face=Math.sign(dx);
      if(e.t<=0){bsSpit(e);e.state='idle';e.t=rage?.6:.85}
      break;
  }
}
function bsDraw(e){
  const cx=e.x+e.w/2,by=e.y+e.h,f=e.face,sleep=e.state==='sleep';
  let sx=1+Math.sin(time*(sleep?2:5)+e.x)*.03;
  if(e.state==='crouch') sx=1.22+Math.sin(time*50)*.02;
  else if(e.state==='air') sx=e.vy<0?.82:.9;
  else if(e.squash>0) sx=1+e.squash;
  else if(e.state==='spitWind') sx=.94;
  else if(e.state==='ramWind') sx=.9+Math.sin(time*45)*.02;
  else if(e.state==='ram') sx=1.14;
  const hw=e.w/2*sx,hh=e.h*.96/sx;
  ctx.save();ctx.translate(cx,by);if(e.state==='crouch'||e.state==='ramWind')ctx.translate(rand(-1.5,1.5),0);
  if(e.state==='ram') ctx.transform(1,0,f*.22,1,0,0);          // leans forward into the charge
  else if(e.state==='ramWind') ctx.transform(1,0,-f*.1,1,0,0);  // leans back before it
  shadow(0,0,hw);
  // body, with a darker core and bubbles floating up inside it
  blob(0,0,hw,hh);
  const g=ctx.createLinearGradient(0,-hh,0,0);g.addColorStop(0,col(e,'#c58ff0'));g.addColorStop(1,col(e,'#8a4fc4'));
  ctx.fillStyle=g;ctx.fill();ctx.lineWidth=3.2;ctx.strokeStyle=INK;ctx.stroke();
  ctx.save();blob(0,0,hw,hh);ctx.clip();
  ctx.fillStyle='rgba(70,20,110,.25)';ctx.beginPath();ctx.ellipse(0,-hh*.25,hw*.55,hh*.32,0,0,7);ctx.fill();
  // something it swallowed: an old bone and a mushroom cap
  ctx.save();ctx.translate(-hw*.25,-hh*.22);ctx.rotate(.5);ctx.fillStyle='rgba(240,230,210,.55)';ctx.fillRect(-12,-3,24,6);
  for(const s of [-1,1]){ctx.beginPath();ctx.arc(s*12,-3,4,0,7);ctx.arc(s*12,3,4,0,7);ctx.fill()}ctx.restore();
  ctx.fillStyle='rgba(230,90,80,.5)';ctx.beginPath();ctx.arc(hw*.3,-hh*.15,9,Math.PI,0);ctx.fill();ctx.fillStyle='rgba(245,235,215,.5)';ctx.fillRect(hw*.3-3,-hh*.15,6,8);
  ctx.fillStyle='rgba(235,210,255,.55)';ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=1.5;
  for(const b of e.bub){ctx.beginPath();ctx.arc(b.x*hw*1.4,-b.y*hh*.95,4+b.s*40,0,7);ctx.fill();ctx.stroke()}
  ctx.fillStyle='rgba(60,15,95,.3)';ctx.beginPath();ctx.ellipse(0,0,hw*1.2,hh*.22,0,0,7);ctx.fill();
  ctx.restore();
  // shine
  ctx.fillStyle='rgba(255,255,255,.7)';ctx.beginPath();ctx.ellipse(-hw*.5,-hh*.7,8,15,-.5,0,7);ctx.fill();
  ctx.beginPath();ctx.ellipse(-hw*.32,-hh*.86,4,5,0,0,7);ctx.fill();
  // drips at the bottom
  ctx.fillStyle=col(e,'#8a4fc4');ctx.strokeStyle=INK;ctx.lineWidth=2;
  for(const k of [-.62,.15,.55]){const d=6+Math.sin(time*3+k*9)*3;ctx.beginPath();ctx.ellipse(hw*k,-3,7,d,0,0,Math.PI);ctx.fill()}
  // face
  const ey=-hh*.55,ex=f*hw*.18;
  if(sleep){ctx.strokeStyle=INK;ctx.lineWidth=3.5;for(const o of [-18,18]){ctx.beginPath();ctx.arc(ex+o,ey,8,.2,Math.PI-.2);ctx.stroke()}}
  else{
    ctx.fillStyle='#fff';for(const o of [-18,18]){ctx.beginPath();ctx.ellipse(ex+o,ey,10,13,0,0,7);ctx.fill();ctx.lineWidth=2.5;ctx.strokeStyle=INK;ctx.stroke()}
    const look=e.state==='crouch'?-4:0;
    ctx.fillStyle=e.hp<=e.max*.5?'#c0182a':INK;for(const o of [-18,18]){ctx.beginPath();ctx.ellipse(ex+o+f*4,ey+2+look,5,7,0,0,7);ctx.fill()}
    ctx.fillStyle='#fff';for(const o of [-18,18]){ctx.beginPath();ctx.arc(ex+o+f*4+1.5,ey-1+look,1.8,0,7);ctx.fill()}
    ctx.strokeStyle=INK;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(ex-32,ey-18);ctx.lineTo(ex-9,ey-10);ctx.moveTo(ex+32,ey-18);ctx.lineTo(ex+9,ey-10);ctx.stroke();
  }
  // mouth: a wide grin, or a big round hole before spitting
  const my=-hh*.28,mx=ex+f*4;ctx.fillStyle='#3a1050';ctx.strokeStyle=INK;ctx.lineWidth=2.5;
  if(e.mouth>.05){ctx.beginPath();ctx.ellipse(mx+f*6,my,10+e.mouth*8,6+e.mouth*12,0,0,7);ctx.fill();ctx.stroke()}
  else if(sleep){ctx.beginPath();ctx.ellipse(mx,my,7,4,0,0,7);ctx.fill()}
  else{ctx.beginPath();ctx.moveTo(mx-22,my-4);ctx.quadraticCurveTo(mx,my+14,mx+22,my-4);ctx.quadraticCurveTo(mx,my+4,mx-22,my-4);ctx.fill();ctx.stroke();
    ctx.fillStyle='#fff';for(const t of [-12,8]){ctx.beginPath();ctx.moveTo(mx+t,my);ctx.lineTo(mx+t+4,my+6);ctx.lineTo(mx+t+8,my+1);ctx.fill()}}
  // a little crooked golden crown: it is the king of the forest slimes
  ctx.save();ctx.translate(f*hw*.08,-hh*.95);ctx.rotate(-.12*f+Math.sin(time*3)*.04);
  ctx.fillStyle=col(e,'#ffd84a');ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(-20,0);ctx.lineTo(-22,-20);ctx.lineTo(-10,-9);ctx.lineTo(0,-24);ctx.lineTo(10,-9);ctx.lineTo(22,-20);ctx.lineTo(20,0);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='#e0405a';ctx.beginPath();ctx.arc(0,-6,3.5,0,7);ctx.fill();ctx.fillStyle='#5ad0ff';for(const s of [-12,12]){ctx.beginPath();ctx.arc(s,-5,2.5,0,7);ctx.fill()}
  ctx.restore();
  ctx.restore();
  // health bar once it is awake
  if(!sleep){const w=120,x=cx-w/2,y=e.y-hh*.08-42;
    ctx.fillStyle='rgba(0,0,0,.45)';ctx.beginPath();ctx.roundRect(x-2,y-2,w+4,12,5);ctx.fill();
    ctx.fillStyle=e.hp<=e.max*.5?'#e0405a':'#b77ee0';ctx.beginPath();ctx.roundRect(x,y,w*Math.max(0,e.hp/e.max),8,4);ctx.fill()}
}
/* ---------- its goo ---------- */
function updateGoo(b,dt,pb){
  if(b.k==='gooWave'){ // a low ridge of goo that runs along the floor: jump over it
    b.x+=b.vx*dt;b.life-=dt;b.h=Math.min(1,b.h+dt*6);
    const c=Math.floor(b.x/TS),r=Math.floor((b.y+2)/TS);
    if(b.life<=0||!isFloorT(tile(c,r))||solid(c,r-1)){b.dead=true;burst(b.x,b.y-8,6,'#a86ad6',140);return}
    if(Math.random()<.3)parts.push({x:b.x+rand(-10,10),y:b.y-6,vx:rand(-30,30),vy:rand(-110,-40),g:600,c:'#b77ee0',s:rand(3,5),life:.3,max:0,t:'dot'});
    if(!P.dead&&overlap({x:b.x-18,y:b.y-30*b.h,w:36,h:30*b.h},pb)) hurt(b.x);
    return;
  }
  b.vy+=b.g*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.rot+=dt*6;
  if(b.y>WH+40||solid(Math.floor(b.x/TS),Math.floor(b.y/TS))||(b.vy>0&&isFloorT(tile(Math.floor(b.x/TS),Math.floor((b.y+b.r*.6)/TS))))){b.dead=true;burst(b.x,b.y,8,'#b77ee0',150);sfx('splash')}
  else if(!P.dead&&circleBox(b.x,b.y,b.r*.85,pb)){hurt(b.x);b.dead=true;burst(b.x,b.y,8,'#b77ee0',150)}
}
function drawGoo(b){
  ctx.strokeStyle=INK;ctx.lineJoin='round';
  if(b.k==='gooWave'){const s=Math.sign(b.vx),hh=30*b.h;
    ctx.fillStyle='#a86ad6';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(b.x-20*s,b.y);
    ctx.quadraticCurveTo(b.x-14*s,b.y-hh*.9,b.x+2*s,b.y-hh*(1+.08*Math.sin(time*25)));ctx.quadraticCurveTo(b.x+16*s,b.y-hh*.7,b.x+20*s,b.y);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.55)';ctx.beginPath();ctx.ellipse(b.x-4*s,b.y-hh*.65,3,5,0,0,7);ctx.fill();return}
  ctx.save();ctx.translate(b.x,b.y);ctx.rotate(Math.atan2(b.vy,b.vx));
  ctx.fillStyle='#b77ee0';ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(-b.r*1.6,0);ctx.quadraticCurveTo(-b.r*.4,-b.r,b.r*.3,-b.r);ctx.arc(b.r*.3,0,b.r,-Math.PI/2,Math.PI/2);ctx.quadraticCurveTo(-b.r*.4,b.r,-b.r*1.6,0);ctx.fill();ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.7)';ctx.beginPath();ctx.ellipse(b.r*.4,-b.r*.4,3,4,0,0,7);ctx.fill();ctx.restore();
}
