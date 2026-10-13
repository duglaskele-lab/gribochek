/* ---------- level 5 mini-boss: the Rat King ---------- */
// A huge mutant rat with a crown of bottle caps, asleep in a ruined plaza (the generator builds the plaza and tells it
// where its ends are: e.kx0 / e.kx1). It wakes when the player comes into the plaza. Moves, each announced:
// - scratch the ground (0.7 s), then charge across the plaza; running into the rubble at the end (or a wrecked car)
//   leaves it dazed for a while: that is the time to hit it;
// - crouch (a shadow marks the spot), leap onto the player and send ripples of broken asphalt both ways (jump them);
// - rear up and squeak: rats come out of the drain pipes at both ends of the plaza (never more than three about).
// From half its health it is quicker and leaps twice in a row. A stomp on its head hurts it.
const RK_W=150, RK_H=92;
function rkHead(e){const cx=e.x+e.w/2;return{x:cx+e.face*28-34,y:e.y-14,w:68,h:36}}
function rkChoose(e){
  const cx=e.x+e.w/2,dx=P.x+P.w/2-cx,adx=Math.abs(dx),rage=e.hp<=e.max/2,o=[];
  e.face=Math.sign(dx)||e.face;
  const room=e.face>0?e.kx1-(e.x+e.w):e.x-e.kx0;
  if(room>200)o.push(['charge',adx>140?3:1.5]);
  o.push(['leap',adx>260?2.6:1.4]);
  if(enemies.filter(k=>k.type==='mutRat'&&k.kid&&!k.dead).length<3)o.push(['squeak',1.1]);
  const L=o.filter(q=>q[0]!==e.last).length?o.filter(q=>q[0]!==e.last):o;
  let s=0;for(const q of L)s+=q[1];let r=Math.random()*s,k=L[0][0];for(const q of L){r-=q[1];if(r<=0){k=q[0];break}}
  e.last=k;const m=rage?.8:1;
  if(k==='charge'){e.state='scratch';e.t=.7*m;sfx('rustle')}
  else if(k==='leap'){e.state='crouch';e.t=.55*m;e.leaps=rage?2:1;rkAim(e)}
  else{e.state='squeak';e.t=.7;sfx('squeak')}
}
function rkAim(e){e.tx=clamp(P.x+P.w/2,e.kx0+RK_W/2+10,e.kx1-RK_W/2-10)}
function rkCall(e){ // rats pour out of the drain pipes at the ends of the plaza
  let room=3-enemies.filter(k=>k.kid&&!k.dead).length;
  for(const side of [0,1]){if(room--<=0)break;const px=side?e.kx1-TS/2:e.kx0+TS/2,r=makeEnemy('mutRat',Math.floor(px/TS),{y:e.y+e.h});
    if(r){r.kid=true;r.x=px-r.w/2;r.dir=r.face=side?-1:1;r.vx=r.dir*160;r.vy=-260;r.onGround=false;r.cd=.8;enemies.push(r);purpleMist(px,e.y+e.h-20,4)}}
}
function updateRatKing(e,dt){
  enemyGravity(e,dt);
  const cx=e.x+e.w/2,inPlaza=!P.dead&&P.x+P.w>e.kx0+20&&P.x<e.kx1-20,rage=e.hp<=e.max/2,m=rage?.8:1;
  e.anim+=dt;
  // never leaves its plaza
  if(e.x<e.kx0){e.x=e.kx0;if(e.vx<0)e.vx=0}if(e.x+e.w>e.kx1){e.x=e.kx1-e.w;if(e.vx>0)e.vx=0}
  switch(e.state){
    case 'sleep': e.vx=0;if(inPlaza){e.state='wake';e.t=1.1;sfx('roar');shake(.4,6);floater(cx,e.y-50,T('fRatKing'))}break;
    case 'wake': e.t-=dt;if(e.t<=0){e.state='idle';e.t=.5}break;
    case 'idle': e.vx=approach(e.vx,0,900*dt);e.t-=dt*(rage?1.25:1);
      if(Math.abs(P.x+P.w/2-cx)>20)e.face=Math.sign(P.x+P.w/2-cx);
      if(e.t<=0&&inPlaza)rkChoose(e);break;
    case 'scratch': e.vx=0;e.t-=dt;if(Math.random()<.5)dust(cx-e.face*40,e.y+e.h,1,-e.face);
      if(e.t<=0){e.state='charge';e.run=0;sfx('dash')}break;
    case 'charge':{const sp=rage?620:540;e.vx=e.face*sp;if(Math.random()<.5)dust(cx-e.face*60,e.y+e.h,2,-e.face);
      const hit=e.face>0?e.x+e.w>=e.kx1-2:e.x<=e.kx0+2;
      if(hit||wallAhead(e,e.face,6)){e.state='stun';e.t=1.6;e.vx=-e.face*160;e.vy=-260;e.onGround=false;shake(.45,9);sfx('boom');ratSpark(e.face>0?e.x+e.w:e.x,e.y+40,10,'#fff3b0')}
      break}
    case 'stun': e.vx=approach(e.vx,0,500*dt);e.t-=dt;if(e.t<=0){e.state='idle';e.t=.4}break;
    case 'crouch': e.vx=0;e.t-=dt;if(e.t>.15)rkAim(e);
      if(e.t<=0){const T2=.75,vy=-G*T2/2;e.vy=vy;e.vx=(e.tx-cx)/T2;e.onGround=false;e.state='leap';sfx('jump');dust(cx,e.y+e.h,6)}break;
    case 'leap': if(e.onGround&&e.vy>=0){e.vx=0;shake(.4,8);sfx('boom');dust(cx,e.y+e.h,10);
        for(const s of [-1,1])eshots.push({k:'rubbleWave',x:cx+s*70,y:e.y+e.h,vx:s*340,life:1.6,h:0,tall:30});
        if(--e.leaps>0){e.state='crouch';e.t=.35;rkAim(e)}else{e.state='idle';e.t=.7*m}}break;
    case 'squeak': e.vx=0;e.t-=dt;if(e.t<=0){rkCall(e);e.state='idle';e.t=.6*m}break;
  }
}
function drawRatKing(e){
  const f=e.face,cx=e.x+e.w/2,by=e.y+e.h,st=e.state,air=st==='leap',cr=st==='crouch'||st==='scratch',sq=st==='squeak';
  // where it is about to land
  if(st==='crouch'&&e.tx!=null){ctx.fillStyle=`rgba(80,30,90,${.18+.15*Math.sin(time*20)})`;ctx.beginPath();ctx.ellipse(e.tx,by-2,70,9,0,0,7);ctx.fill()}
  shadow(cx,by,air?50:74);
  ctx.save();ctx.translate(cx,by);if(st==='scratch')ctx.translate(rand(-2,2),0);ctx.scale(f,1);ctx.lineJoin='round';ctx.strokeStyle=INK;ctx.lineWidth=3.5;
  if(sq)ctx.rotate(-.22);if(cr)ctx.scale(1.06,.9);
  const fur=col(e,'#7b6d78'),furD=col(e,'#5a4e5a'),pink=col(e,'#e39aa3'),run=st==='charge'?Math.sin(time*30):0;
  // tail
  ctx.lineCap='round';ctx.strokeStyle=INK;ctx.lineWidth=11;ctx.beginPath();ctx.moveTo(-64,-30);ctx.bezierCurveTo(-110,-20,-120,-70,-150+Math.sin(time*3)*8,-60);ctx.stroke();ctx.strokeStyle=pink;ctx.lineWidth=6;ctx.stroke();
  ctx.strokeStyle=INK;ctx.lineWidth=3.5;
  // legs
  ctx.fillStyle=furD;for(const [lx,o] of [[-46,run],[-20,-run],[28,run],[50,-run]]){ctx.beginPath();ctx.roundRect(lx-9+o*6,-26,18,26,6);ctx.fill();ctx.stroke()}
  // the body: a heavy hunched back with bald patches and glowing boils
  ctx.fillStyle=fur;ctx.beginPath();ctx.moveTo(-70,-22);ctx.bezierCurveTo(-80,-92,10,-110,52,-70);ctx.quadraticCurveTo(64,-40,48,-20);ctx.quadraticCurveTo(-10,-10,-70,-22);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle=pink;ctx.beginPath();ctx.ellipse(-20,-80,14,7,-.2,0,7);ctx.fill();ctx.beginPath();ctx.ellipse(-48,-50,9,5,.4,0,7);ctx.fill();
  ctx.fillStyle='#b8ff5a';for(const [px,py,r] of [[-30,-62,4],[4,-84,3],[-56,-36,3],[20,-50,2.6]]){ctx.beginPath();ctx.arc(px,py,r+Math.sin(time*4+px)*.6,0,7);ctx.fill()}
  ctx.strokeStyle='rgba(43,26,18,.45)';ctx.lineWidth=2;for(let k=0;k<6;k++){const a=-1.2+k*.4;ctx.beginPath();ctx.moveTo(-10+Math.cos(a)*50,-56+Math.sin(a)*34);ctx.lineTo(-10+Math.cos(a)*58,-58+Math.sin(a)*40);ctx.stroke()}
  ctx.strokeStyle=INK;ctx.lineWidth=3.5;
  // head: long snout, three red eyes, yellow teeth
  ctx.fillStyle=fur;ctx.beginPath();ctx.moveTo(30,-74);ctx.quadraticCurveTo(70,-86,96,-46);ctx.quadraticCurveTo(80,-30,40,-34);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle=pink;ctx.beginPath();ctx.arc(96,-48,6,0,7);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.ellipse(36,-86,12,16,-.5,0,7);ctx.fill();ctx.stroke();
  const eye=st==='scratch'||st==='charge'||st==='crouch'?'#ff3b2e':'#ffd23a',shut=st==='sleep'||st==='stun';
  for(const [ex,ey] of [[58,-66],[68,-62],[50,-62]]){if(shut){ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(ex-4,ey);ctx.lineTo(ex+4,ey);ctx.stroke()}else{ctx.fillStyle=eye;ctx.beginPath();ctx.arc(ex,ey,3.6,0,7);ctx.fill()}}
  ctx.lineWidth=3.5;ctx.fillStyle='#f3e08a';for(const tx of [78,86]){ctx.beginPath();ctx.moveTo(tx,-38);ctx.lineTo(tx+3,-28-(sq?6:0));ctx.lineTo(tx+6,-38);ctx.closePath();ctx.fill();ctx.lineWidth=2;ctx.stroke()}
  // the crown of bottle caps
  ctx.lineWidth=2.5;ctx.fillStyle='#d9b23a';ctx.beginPath();ctx.moveTo(26,-92);ctx.lineTo(30,-112);ctx.lineTo(38,-100);ctx.lineTo(44,-118);ctx.lineTo(50,-100);ctx.lineTo(58,-110);ctx.lineTo(58,-88);ctx.closePath();ctx.fill();ctx.stroke();
  for(const [bx,c] of [[34,'#e33b2e'],[44,'#3a8ee8'],[53,'#4fbf4a']]){ctx.fillStyle=c;ctx.beginPath();ctx.arc(bx,-96,3.2,0,7);ctx.fill();ctx.stroke()}
  if(st==='stun'){ctx.fillStyle='#fff3b0';for(let k=0;k<4;k++){const a=time*6+k*1.6;drawStar(50+Math.cos(a)*30,-128+Math.sin(a)*7,5,time)}}
  if(st==='sleep'&&Math.sin(time*2)>0){ctx.scale(f,1);ctx.fillStyle='rgba(255,255,255,.85)';ctx.font='20px '+FONT;ctx.textAlign='center';ctx.fillText('z',f*70,-130-Math.sin(time*2)*8)}
  ctx.restore();
  // its health, while it is awake
  if(st!=='sleep'){const w=120,x0=cx-w/2,y0=e.y-48;ctx.fillStyle='rgba(43,26,18,.7)';ctx.fillRect(x0-2,y0-2,w+4,10);ctx.fillStyle='#e33b2e';ctx.fillRect(x0,y0,w*Math.max(0,e.hp/e.max),6)}
}
