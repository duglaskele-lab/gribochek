/* ---------- ice cave foes: helpers ---------- */
// ice slime: frost breath reaches about three slime widths ahead and stops at walls
function slimeReach(e){const f=e.face,my=e.y+e.h*.55,mx=e.x+e.w/2+f*e.w*.38,r=Math.floor(my/TS);let d=0;
  while(d<e.w*3){if(solid(Math.floor((mx+f*(d+8))/TS),r))break;d+=8}return{mx,my,d}}
function slimeBreathBox(e){const s=slimeReach(e),d=s.d*(e.breathK||0);return{x:e.face>0?s.mx:s.mx-d,y:s.my-18,w:d,h:36}}
// ice golem
function golemHead(e){const cx=e.x+e.w/2;return{x:cx-38,y:e.y-2,w:76,h:28}}
function golemUpperBox(e){const cx=e.x+e.w/2;return{x:cx-52,y:e.y-175,w:104,h:185}}
function golemSlamBox(e){const cx=e.x+e.w/2;return{x:cx-118,y:e.y+e.h-56,w:236,h:56}}
// while guarding, the raised arm stops everything that comes from its side
function golemBlocks(e,srcX){return e.type==='iceGolem'&&!e.dead&&e.guard>0&&Math.sign(srcX-(e.x+e.w/2))===e.gside}
function golemHit(e,srcX){
  if(e.guard>0) return;
  if(++e.hits>=e.guardN){e.hits=0;e.guardN=3+Math.floor(Math.random()*3);e.guard=4;e.gside=Math.sign(srcX-(e.x+e.w/2))||e.face;
    floater(e.x+e.w/2,e.y-30,T('fArm'));sfx('clang')}
}
function iceShards(x,y,n,sp=220){for(let i=0;i<n;i++)parts.push({x:x+rand(-10,10),y:y+rand(-6,6),vx:rand(-sp,sp),vy:rand(-sp*1.4,-sp*.3),g:1300,c:Math.random()<.5?'#e8f8ff':'#9fd6f2',s:rand(3,6),life:rand(.3,.6),max:0,t:'dot'})}
function golemSlam(e){
  const cx=e.x+e.w/2,by=e.y+e.h;shake(.35,9);sfx('boom');iceShards(cx+e.face*60,by-6,12);
  for(const s of [-1,1]){dust(cx+s*70,by,6,s);eshots.push({k:'iwave',x:cx+s*86,y:by,vx:s*330,life:2.4,h:0})}
}
// ice witch: flies around rock without passing through it
function flyBlocked(e){for(const [ox,oy] of [[4,4],[e.w-4,4],[4,e.h-4],[e.w-4,e.h-4]])if(solid(Math.floor((e.x+ox)/TS),Math.floor((e.y+oy)/TS)))return true;return false}
function flyMove(e,dt){
  e.hitWall=0;const ox=e.x;e.x+=e.vx*dt;if(flyBlocked(e)){e.x=ox;e.vx*=-.3;e.hitWall=1}
  const oy=e.y;e.y+=e.vy*dt;if(flyBlocked(e)){e.y=oy;e.vy*=-.3;e.hitV=1}else e.hitV=0;
}
function witchTip(e){return{x:e.x+e.w/2+e.face*20,y:e.y+4}}
// a big glowing snowflake that homes in for a moment, then flies straight, faster and faster; it passes through
// rock and ice; punches cannot knock it away
function witchFlake(e){
  const t=witchTip(e),dx=P.x+P.w/2-t.x,dy=P.y+P.h/2-t.y,l=Math.hypot(dx,dy)||1,sp=230;
  eshots.push({k:'flake',x:t.x,y:t.y,vx:dx/l*sp,vy:dy/l*sp,sp,home:.7,r:17,life:4,rot:0});sfx('flake');
}
const ICE_EUPD={
  iceSlime(e,dt){
    const was=e.onGround;enemyGravity(e,dt);
    if(e.hitWall) e.dir=-e.hitWall;
    const pcx=P.x+P.w/2,dx=pcx-(e.x+e.w/2),adx=Math.abs(dx),dy=(P.y+P.h)-(e.y+e.h);
    if(e.squash>0) e.squash-=dt;
    e.bcd-=dt;
    if(e.state==='bwind'){ // puffs up before breathing frost
      e.vx=approach(e.vx,0,900*dt);e.t-=dt;
      if(Math.random()<.4)parts.push({x:e.x+e.w/2+e.face*20,y:e.y+e.h*.5,vx:e.face*rand(20,60),vy:rand(-30,10),g:0,c:'rgba(220,245,255,.8)',s:rand(3,5),life:.3,max:0,t:'puff'});
      if(e.t<=0){e.state='breath';e.t=.75;e.breathK=0;sfx('breath')}
    }else if(e.state==='breath'){
      e.vx=approach(e.vx,0,900*dt);e.t-=dt;e.breathK=Math.min(1,e.breathK+dt*5);
      const s=slimeReach(e),d=s.d*e.breathK;
      for(let i=0;i<2;i++)parts.push({x:s.mx+e.face*rand(0,d),y:s.my+rand(-12,12),vx:e.face*rand(60,150),vy:rand(-25,25),g:0,c:Math.random()<.5?'rgba(230,248,255,.85)':'rgba(170,220,250,.8)',s:rand(4,9),life:rand(.15,.32),max:0,t:'puff'});
      if(e.t<=0){e.state='idle';e.t=rand(.4,.8);e.bcd=rand(5,8);e.breathK=0}
    }else if(e.onGround){
      if(!was){e.squash=.18;e.vx=0;if(Math.abs(e.x-P.x)<VW)dust(e.x+e.w/2,e.y+e.h,3)}
      e.t-=dt;
      if(e.bcd<=0&&adx<e.w*3.3&&Math.abs(dy)<44&&!P.dead){e.face=e.dir=Math.sign(dx)||e.dir;e.state='bwind';e.t=.55;e.vx=0}
      else if(e.t<=0){
        const chase=adx<420&&!P.dead;
        if(chase) e.dir=Math.sign(dx)||e.dir;
        let mv=e.dir;
        if(!groundAhead(e,e.dir,TS*1.1)){if(chase)mv=0;else{e.dir*=-1;mv=e.dir}}
        const big=Math.random()<.4;e.vy=big?-760:-520;e.vx=mv*(big?150:115);e.onGround=false;e.face=e.dir;e.t=rand(.55,1.15);e.squash=0;
      }
    }
  },
  iceGolem(e,dt){
    enemyGravity(e,dt);
    const cx=e.x+e.w/2,dx=P.x+P.w/2-cx,adx=Math.abs(dx),pb=P.y+P.h;
    const over=!P.dead&&adx<e.w*.65&&pb<=e.y+8&&pb>e.y-150;
    e.aboveT=over?e.aboveT+dt:Math.max(0,e.aboveT-dt*2);
    if(e.guard>0){e.guard-=dt;if(e.guard<=0)e.hits=0}
    e.cd-=dt;
    switch(e.state){
      case 'slamWind': e.vx=0;e.t-=dt;if(Math.random()<.3)iceShards(cx,e.y+10,1,80);if(e.t<=0){golemSlam(e);e.state='slam';e.t=.6}break;
      case 'slam': e.t-=dt;if(e.t<=0){e.state='walk';e.cd=rand(1.6,2.6)}break;
      case 'upWind': e.vx=0;e.t-=dt;if(e.t<=0){e.state='upper';e.t=.36;sfx('punch');sfx('roar');iceShards(cx,e.y-20,8,180)}break;
      case 'upper': e.t-=dt;if(e.t<=0){e.state='walk';e.cd=Math.max(e.cd,.8)}break;
      default:{
        if(adx>16) e.face=Math.sign(dx);
        let mv=0;if(adx<560&&adx>110&&!P.dead&&Math.abs(pb-(e.y+e.h))<240) mv=e.face;
        if(mv&&(!groundAhead(e,mv)||e.hitWall)) mv=0;
        e.vx=approach(e.vx,mv*60,400*dt);
        const before=Math.floor(e.anim);e.anim+=Math.abs(e.vx)*dt/26;
        if(Math.floor(e.anim)!==before&&Math.abs(e.x-P.x)<VW*.7){dust(cx-e.face*20,e.y+e.h,3);shake(.05,1.5)}
        if(e.aboveT>.45||e.hh>=e.hhN){e.state='upWind';e.t=rand(.32,.42);e.vx=0;e.hh=0;e.hhN=2+Math.floor(Math.random()*2);e.aboveT=0}
        else if(e.cd<=0&&adx<300&&Math.abs(pb-(e.y+e.h))<160&&!P.dead){e.state='slamWind';e.t=.78;e.vx=0;sfx('creak')}
      }
    }
  },
  iceWitch(e,dt){
    const pcx=P.x+P.w/2,pcy=P.y+P.h/2,dx=pcx-(e.x+e.w/2);
    e.ph+=dt;e.cd-=dt;
    const near=!P.dead&&Math.abs(dx)<540&&Math.abs(pcy-(e.y+e.h/2))<420;
    const steer=(tx,ty,maxV,k)=>{const ddx=tx-(e.x+e.w/2),ddy=ty-(e.y+e.h/2),kk=Math.min(1,k*dt);
      e.vx+=(clamp(ddx*2.6,-maxV,maxV)-e.vx)*kk;e.vy+=(clamp(ddy*2.6,-maxV*.8,maxV*.8)-e.vy)*kk};
    if(e.state==='hover'){
      // smooth flight: it drifts over to the other side of the player gradually instead of turning on the spot,
      // and keeps low, just above her head
      if(near){if(Math.random()<dt*.3||e.hitWall)e.side=-e.side;
        e.sx=approach(e.sx||e.side,e.side,dt*.9);
        steer(pcx+e.sx*170+Math.sin(e.ph*1.1)*40,P.y-78+Math.sin(e.ph*1.7)*16,240,1.5);
        if(Math.abs(dx)>20)e.face=Math.sign(dx)}
      else{steer(e.hx+e.w/2+Math.sin(e.ph*.7)*120,e.hy+e.h/2+40+Math.sin(e.ph*1.3)*16,170,1.3);if(Math.abs(e.vx)>20)e.face=Math.sign(e.vx)}
      flyMove(e,dt);
      if(near&&e.cd<=0){e.face=Math.sign(dx)||e.face;
        if(Math.random()<.55||P.y+P.h<e.y+e.h){e.state='cast';e.t=.62}else{e.state='warn';e.t=.38}sfx('witch')}
    }else if(e.state==='cast'){
      e.t-=dt;e.vx*=Math.pow(.05,dt);e.vy*=Math.pow(.05,dt);flyMove(e,dt);e.face=Math.sign(dx)||e.face;
      const tp=witchTip(e);if(Math.random()<.7)parts.push({x:tp.x+rand(-12,12),y:tp.y+rand(-12,12),vx:rand(-30,30),vy:rand(-30,30),g:0,c:'rgba(190,235,255,.9)',s:rand(2,4),life:.3,max:0,t:'dot'});
      if(e.t<=0){witchFlake(e);e.state='hover';e.cd=rand(1.1,2.1)}
    }else if(e.state==='warn'){
      e.t-=dt;e.vx*=Math.pow(.03,dt);e.vy=approach(e.vy,-70,700*dt);flyMove(e,dt);
      if(e.t<=0){ // a U-shaped dive like the jungle parrot's, but deeper: it scrapes along at the player's feet
        e.state='swoop';e.sx=e.x;e.sy=e.y;e.sd=e.face;e.sD=Math.max(240,Math.abs(dx)*2);
        e.sDepth=Math.max(50,P.y+P.h-14-(e.y+e.h));e.sT=clamp(e.sD/400,.8,1.8);e.t=0}
    }else if(e.state==='swoop'){
      e.t+=dt;const p=Math.min(1,e.t/e.sT),px=e.x,py=e.y;
      e.x=e.sx+e.sd*e.sD*p;e.y=e.sy+e.sDepth*Math.sin(p*Math.PI);
      if(flyBlocked(e)){e.x=px;e.y=py;e.vx=-e.sd*80;e.vy=-120;e.state='hover';e.cd=rand(.9,1.6);e.hx=e.x;e.hy=Math.min(e.hy,e.y)}
      else{e.vx=(e.x-px)/dt;e.vy=(e.y-py)/dt;
        if(p>=1){e.state='hover';e.cd=rand(1.1,2.1);e.hx=e.x;e.ph=0}}
    }
    if(e.state!=='cast'&&e.state!=='warn'&&Math.abs(e.vx)>30)e.face=Math.sign(e.vx);
    e.tilt=approach(e.tilt||0,clamp(e.vx/700,-.35,.35),dt*3);
    if(e.y>WH+60)e.dead=true;
  },
};
/* ---------- ice cave foes: drawing ---------- */
const ICE_EDRAW={
  iceSlime(e){
    ctx.save();ctx.translate(e.x+e.w/2,e.y+e.h);ctx.scale(1.62,1.62);
    let sx=!e.onGround?.8:e.squash>0?1.3:1+Math.sin(time*5+e.x)*.05;
    if(e.state==='bwind')sx=1.12+Math.sin(time*40)*.03;else if(e.state==='breath')sx=.92;
    const hw=19*sx,hh=27/sx,f=e.face;
    shadow(0,0,hw);blob(0,0,hw,hh);
    ctx.fillStyle=col(e,'#9fdcf5');ctx.fill();ctx.lineWidth=2.1;ctx.strokeStyle=INK;ctx.stroke();
    // frosty cap and a few crystals growing on top
    ctx.save();blob(0,0,hw,hh);ctx.clip();ctx.fillStyle=col(e,'#e6f7ff');ctx.beginPath();ctx.ellipse(0,-hh*1.02,hw*1.1,hh*.36,0,0,7);ctx.fill();
    ctx.fillStyle='rgba(70,140,190,.25)';ctx.beginPath();ctx.ellipse(0,0,hw*1.2,hh*.3,0,0,7);ctx.fill();ctx.restore();
    ctx.fillStyle=col(e,'#c9f0ff');ctx.lineWidth=1.6;
    for(const [x,hgt,a] of [[-6,9,-.3],[2,12,.05],[9,8,.4]]){ctx.save();ctx.translate(x*sx,-hh*.93);ctx.rotate(a);ctx.beginPath();ctx.moveTo(-3,2);ctx.lineTo(0,-hgt);ctx.lineTo(3,2);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()}
    ctx.fillStyle='rgba(255,255,255,.75)';ctx.beginPath();ctx.ellipse(-hw*.45,-hh*.62,3.5,6,-.5,0,7);ctx.fill();
    eyes(f*3,-hh*.5,f,6.5,3,true);
    if(e.state==='bwind'||e.state==='breath'){ctx.fillStyle=INK;ctx.beginPath();ctx.ellipse(f*(hw*.55),-hh*.28,e.state==='breath'?4.5:2.5,e.state==='breath'?5:3,0,0,7);ctx.fill()}
    ctx.restore();
    if(e.state==='breath'){const b=slimeBreathBox(e);if(b.w>4){const g=ctx.createLinearGradient(e.face>0?b.x:b.x+b.w,0,e.face>0?b.x+b.w:b.x,0);
      g.addColorStop(0,'rgba(225,247,255,.75)');g.addColorStop(1,'rgba(180,225,250,0)');ctx.fillStyle=g;
      const x0=e.face>0?b.x:b.x+b.w,x1=e.face>0?b.x+b.w:b.x,my=b.y+b.h/2;ctx.beginPath();ctx.moveTo(x0,my-8);ctx.lineTo(x1,my-20);ctx.lineTo(x1,my+20);ctx.lineTo(x0,my+8);ctx.closePath();ctx.fill()}}
  },
  iceGolem(e){
    const f=e.face,cx=e.x+e.w/2,by=e.y+e.h,ice=col(e,'#b4def3'),iceD=col(e,'#7fb6d8'),rock=col(e,'#6d84a6');
    shadow(cx,by,50);
    ctx.save();ctx.translate(cx,by);if(e.state==='slamWind'||e.state==='upWind')ctx.translate(rand(-1.5,1.5),0);
    ctx.lineJoin='round';ctx.strokeStyle=INK;ctx.lineWidth=3;
    const crouch=e.state==='upWind'?10:e.state==='slam'?8:0,stp=Math.sin(e.anim*Math.PI)*4;
    // legs
    ctx.fillStyle=iceD;for(const [lx,o] of [[-30,stp],[8,-stp]]){ctx.beginPath();ctx.roundRect(lx,-36+crouch*.4+Math.min(0,o),24,36-crouch*.4-Math.min(0,o),5);ctx.fill();ctx.stroke()}
    const sh=-92+crouch; // shoulder line
    // where each fist goes
    const fist=s=>{ // s: -1/+1 side of the body in world terms
      const front=s===f;
      if(e.guard>0&&s===e.gside) return[s*54,-118+crouch];
      switch(e.state){
        case 'slamWind':{const k=clamp(1-e.t/.78,0,1);return[s*(50-k*20),-40-k*120]}
        case 'slam': return[f*58+s*24,-14];
        case 'upWind': return front?[f*40,-22]:[s*52,-40];
        case 'upper': return front?[f*16,-200]:[s*52,-50];
      }
      return[s*54,-34+Math.sin(e.anim*Math.PI+(s>0?0:1.6))*5];
    };
    const arm=s=>{const [hx,hy]=fist(s),sx=s*42,mx=(sx+hx)/2+s*10,my=(sh+hy)/2;
      limb(sx,sh+6,mx,my,19,ice);limb(mx,my,hx,hy,19,ice);
      ctx.fillStyle=e.guard>0&&s===e.gside?col(e,'#e8f8ff'):iceD;ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(hx-17,hy-15,34,30,8);ctx.fill();ctx.stroke();
      if(e.guard>0&&s===e.gside){ctx.fillStyle='rgba(225,247,255,.85)';ctx.beginPath();ctx.moveTo(hx+s*8,hy-34);ctx.lineTo(hx+s*20,hy-20);ctx.lineTo(hx+s*22,-14);ctx.lineTo(hx+s*8,-2);ctx.closePath();ctx.fill();ctx.stroke();   // the ice shield reaches down to the floor
        ctx.strokeStyle='rgba(255,255,255,.8)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(hx+s*13,hy-18);ctx.lineTo(hx+s*13,-16);ctx.stroke();ctx.strokeStyle=INK;ctx.lineWidth=3}};
    arm(-f);
    // body: a heap of ice blocks
    ctx.fillStyle=ice;ctx.beginPath();ctx.moveTo(-34,-30);ctx.lineTo(-46,sh-6);ctx.lineTo(-24,sh-18);ctx.lineTo(24,sh-18);ctx.lineTo(46,sh-6);ctx.lineTo(34,-30);ctx.quadraticCurveTo(0,-22,-34,-30);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle=iceD;ctx.beginPath();ctx.moveTo(10,sh-14);ctx.lineTo(40,sh-4);ctx.lineTo(30,-32);ctx.lineTo(14,-30);ctx.closePath();ctx.fill();
    ctx.fillStyle=rock;ctx.beginPath();ctx.moveTo(-26,-52+crouch*.5);ctx.lineTo(-12,-60+crouch*.5);ctx.lineTo(-4,-46+crouch*.5);ctx.lineTo(-18,-40+crouch*.5);ctx.closePath();ctx.fill();ctx.lineWidth=2;ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,.85)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-34,sh+4);ctx.lineTo(-24,sh+30);ctx.moveTo(-8,sh-10);ctx.lineTo(0,sh+8);ctx.stroke();
    ctx.strokeStyle=INK;ctx.lineWidth=3;
    // head
    const hy=sh-18,hx=f*6;
    ctx.fillStyle=ice;ctx.beginPath();ctx.moveTo(hx-22,hy);ctx.lineTo(hx-20,hy-26);ctx.lineTo(hx-6,hy-32);ctx.lineTo(hx+16,hy-28);ctx.lineTo(hx+22,hy-6);ctx.lineTo(hx+18,hy+2);ctx.closePath();ctx.fill();ctx.stroke();
    const glow=e.state==='slamWind'||e.state==='upWind'?'#fff6a0':'#7ff6ff';
    ctx.fillStyle=`rgba(127,246,255,${.3+.2*Math.sin(time*5)})`;ctx.beginPath();ctx.ellipse(hx+f*6,hy-14,18,8,0,0,7);ctx.fill();
    ctx.fillStyle=glow;for(const ex of [-4,12]){ctx.beginPath();ctx.ellipse(hx+f*ex,hy-14,3.5,4.5,0,0,7);ctx.fill()}
    ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(hx+f*-10,hy-22);ctx.lineTo(hx+f*2,hy-18);ctx.moveTo(hx+f*20,hy-22);ctx.lineTo(hx+f*9,hy-18);ctx.stroke();
    ctx.beginPath();ctx.moveTo(hx+f*-2,hy-5);ctx.lineTo(hx+f*14,hy-5);ctx.stroke();
    arm(f);
    if(e.guard>0){ctx.globalAlpha=.6+.4*Math.sin(time*10);ctx.fillStyle='#fff';ctx.font='bold 18px '+FONT;ctx.textAlign='center';ctx.fillText('!',e.gside*54,-160+crouch);ctx.globalAlpha=1}
    ctx.restore();
  },
  iceWitch(e){
    const f=e.face,cx=e.x+e.w/2,cy=e.y+e.h/2,casting=e.state==='cast',fl=Math.sin(time*9+e.x)*4;
    ctx.save();ctx.translate(cx,cy+Math.sin(time*3+e.x)*2);ctx.rotate((e.tilt||0));ctx.scale(f,1);ctx.lineJoin='round';ctx.strokeStyle=INK;ctx.lineWidth=2.4;
    ctx.fillStyle=`rgba(160,220,255,${casting?.35:.18})`;ctx.beginPath();ctx.arc(0,4,34,0,7);ctx.fill();
    // long white hair streaming back
    ctx.fillStyle=col(e,'#eef6ff');ctx.beginPath();ctx.moveTo(-2,-22);ctx.quadraticCurveTo(-26,-14+fl,-30,8+fl);ctx.quadraticCurveTo(-18,0,-8,-4);ctx.closePath();ctx.fill();ctx.stroke();
    // cloak, ragged at the hem
    ctx.fillStyle=col(e,'#3b3f8c');ctx.beginPath();ctx.moveTo(-10,-10);ctx.quadraticCurveTo(-24,10,-28,28+fl);ctx.lineTo(-18,24);ctx.lineTo(-12,31-fl);ctx.lineTo(-4,25);ctx.lineTo(4,30+fl*.5);ctx.lineTo(12,22);ctx.quadraticCurveTo(14,4,10,-10);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle=col(e,'#6a7fd0');ctx.beginPath();ctx.moveTo(-2,-8);ctx.lineTo(8,-8);ctx.lineTo(4,18);ctx.closePath();ctx.fill();
    // face
    ctx.fillStyle=col(e,'#dff3ff');ctx.beginPath();ctx.arc(3,-15,9,0,7);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(10,-15);ctx.lineTo(17,-11);ctx.lineTo(10,-10);ctx.fill();ctx.stroke();
    ctx.fillStyle=e.state==='warn'?'#fff':'#3fd4ff';ctx.beginPath();ctx.ellipse(6,-17,2,2.6,0,0,7);ctx.fill();
    ctx.strokeStyle=INK;ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(3,-21);ctx.lineTo(9,-19);ctx.stroke();ctx.beginPath();ctx.moveTo(4,-9);ctx.quadraticCurveTo(7,-7,9,-9);ctx.stroke();
    // tall crooked hat
    ctx.lineWidth=2.4;ctx.fillStyle=col(e,'#2e3470');ctx.beginPath();ctx.ellipse(3,-23,16,4,0,0,7);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(-8,-24);ctx.quadraticCurveTo(-4,-44,-14,-56);ctx.quadraticCurveTo(0,-46,12,-24);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#bfe8ff';ctx.beginPath();ctx.arc(-1,-33,2.6,0,7);ctx.fill();
    // staff with a crystal
    const tx=20,ty=-12;
    ctx.strokeStyle=INK;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(8,26);ctx.lineTo(tx,ty+8);ctx.stroke();ctx.strokeStyle=col(e,'#8a6a9a');ctx.lineWidth=2.6;ctx.stroke();
    ctx.fillStyle=col(e,'#dff3ff');ctx.beginPath();ctx.arc(10,4,5,0,7);ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.stroke();
    if(casting){const k=1-e.t/.62;ctx.fillStyle=`rgba(170,230,255,${.3+.4*k})`;ctx.beginPath();ctx.arc(tx,ty,10+k*14,0,7);ctx.fill()}
    ctx.fillStyle='#bff0ff';ctx.beginPath();ctx.moveTo(tx,ty-10);ctx.lineTo(tx+6,ty);ctx.lineTo(tx,ty+10);ctx.lineTo(tx-6,ty);ctx.closePath();ctx.fill();ctx.lineWidth=2;ctx.stroke();
    ctx.restore();
    if(Math.random()<.2)parts.push({x:cx+rand(-16,16),y:cy+rand(10,26),vx:rand(-20,20),vy:rand(20,60),g:0,c:'rgba(220,245,255,.9)',s:rand(2,3.5),life:.5,max:0,t:'dot'});
  },
};
/* ---------- ice projectiles ---------- */
function updateIceShot(b,dt,pb){
  switch(b.k){
    case 'iwave':{ // a row of ice spikes that runs along the floor, stops at edges and walls
      b.x+=b.vx*dt;b.life-=dt;b.h=Math.min(1,b.h+dt*6);
      const c=Math.floor(b.x/TS),r=Math.floor((b.y+2)/TS);
      if(b.life<=0||!isFloorT(tile(c,r))||solid(c,r-1)){b.dead=true;iceShards(b.x,b.y-10,6,150);return}
      if(Math.random()<.35)parts.push({x:b.x+rand(-10,10),y:b.y-4,vx:rand(-40,40),vy:rand(-120,-40),g:500,c:'#e8f8ff',s:rand(2,4),life:.3,max:0,t:'dot'});
      if(!P.dead&&overlap({x:b.x-16,y:b.y-36,w:32,h:36},pb)) hurt(b.x);
      return}
    case 'flake':{
      b.life-=dt;b.rot+=dt*3;
      if(b.home>0){b.home-=dt;const tx=P.x+P.w/2-b.x,ty=P.y+P.h/2-b.y,l=Math.hypot(tx,ty)||1,k=Math.min(1,dt*3.2);b.vx+=(tx/l*b.sp-b.vx)*k;b.vy+=(ty/l*b.sp-b.vy)*k}
      if(b.home<=0){const k=Math.min(1.9,1+dt*.9);if(Math.hypot(b.vx,b.vy)*k<720){b.vx*=k;b.vy*=k}}   // speeds up
      else b.sp+=dt*120;
      b.x+=b.vx*dt;b.y+=b.vy*dt;
      if(Math.random()<.5)parts.push({x:b.x+rand(-10,10),y:b.y+rand(-10,10),vx:0,vy:20,g:0,c:'rgba(200,240,255,.8)',s:rand(2,4),life:.35,max:0,t:'dot'});
      if(b.life<=0||b.y>WH+40||b.y<-200){b.dead=true;if(b.life<=0)iceShards(b.x,b.y,10,170)}   // flies through walls and floors
      else if(!P.dead&&circleBox(b.x,b.y,b.r*.8,pb)){hurt(b.x);b.dead=true;iceShards(b.x,b.y,10,170);sfx('shatter')}
      return}
    case 'snowball':
      b.vy+=b.g*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.rot=(b.rot||0)+dt*8;
      if(b.y+b.r>=FLOOR||b.x<ARENA_L-40||b.x>ARENA_R+40||(b.vy>0&&isFloorT(tile(Math.floor(b.x/TS),Math.floor((b.y+b.r)/TS))))){b.dead=true;snowPuff(b.x,Math.min(b.y,FLOOR-8),8)}
      else if(!P.dead&&circleBox(b.x,b.y,b.r,pb)){hurt(b.x);b.dead=true;snowPuff(b.x,b.y,8)}
      return;
    case 'icicle':
      if(b.st==='warn'){b.t-=dt;if(b.t<=0){b.st='fall';b.vy=0}}
      else{b.vy+=1900*dt;b.y+=b.vy*dt;
        if(b.y+26>=FLOOR||(b.y>iceCeil+60&&isFloorT(tile(Math.floor(b.x/TS),Math.floor((b.y+26)/TS))))){b.dead=true;iceShards(b.x,Math.min(b.y+20,FLOOR-6),12,200);sfx('shatter')}
        else if(!P.dead&&circleBox(b.x,b.y+12,b.r,pb)){hurt(b.x);b.dead=true;iceShards(b.x,b.y+12,10,200);sfx('shatter')}}
      return;
  }
}
function drawIceShot(b){
  switch(b.k){
    case 'iwave':{const s=Math.sign(b.vx);ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.lineJoin='round';
      for(const [o,hh,w] of [[-12,22,10],[0,36,12],[12,26,10]]){const h=hh*b.h*(1+.08*Math.sin(time*30+o));
        ctx.fillStyle=o===0?'#e8f8ff':'#a9dcf5';ctx.beginPath();ctx.moveTo(b.x+o*s-w,b.y);ctx.lineTo(b.x+o*s+s*3,b.y-h);ctx.lineTo(b.x+o*s+w,b.y);ctx.closePath();ctx.fill();ctx.stroke()}
      return}
    case 'flake': drawFlake(b.x,b.y,b.r,b.rot,true);return;
    case 'snowball': ctx.fillStyle='rgba(0,0,0,.12)';ctx.beginPath();ctx.ellipse(b.x,FLOOR-2,b.r,4,0,0,7);ctx.fill();
      ctx.fillStyle='#f6faff';ctx.strokeStyle=INK;ctx.lineWidth=2.6;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,7);ctx.fill();ctx.stroke();
      ctx.fillStyle='#c9dcef';ctx.beginPath();ctx.arc(b.x+3,b.y+3,b.r*.62,0,Math.PI*.9);ctx.fill();
      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(b.x-4,b.y-4,b.r*.28,0,7);ctx.fill();return;
    case 'icicle':{
      if(b.st==='warn'){const a=.25+.25*Math.sin(time*20);ctx.fillStyle=`rgba(40,70,110,${a})`;ctx.beginPath();ctx.ellipse(b.x,FLOOR-3,22,5,0,0,7);ctx.fill()}
      const x=b.x+(b.st==='warn'?rand(-1.5,1.5):0),y=b.y;
      ctx.fillStyle='#d9f3ff';ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x-11,y-10);ctx.lineTo(x+11,y-10);ctx.lineTo(x+2,y+28);ctx.lineTo(x,y+32);ctx.lineTo(x-2,y+28);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-5,y-6);ctx.lineTo(x-1,y+18);ctx.stroke();return}
  }
}
