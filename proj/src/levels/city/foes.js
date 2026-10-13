/* ---------- ruined city: mutants ---------- */
// Every attack is announced: the rat crouches with glowing eyes before it dashes, the acid spitter swells up, the crow
// caws with its wings spread, the brute roars and stamps, the lid of a manhole rattles and glows purple before the
// tentacle bursts out. After an attack each of them is open for a moment (the rat skids, the brute that ran into a
// wall is dazed, the tentacle lies on the ground).
const RAT_SEE=280, BRUTE_SEE=440;
function pSameFloor(e,tol=46){return Math.abs(P.y+P.h-(e.y+e.h))<tol}
function ratSpark(x,y,n,c='#c8ff6a'){for(let i=0;i<n;i++)parts.push({x:x+rand(-8,8),y:y+rand(-6,6),vx:rand(-120,120),vy:rand(-200,-40),g:900,c,s:rand(2,4),life:rand(.2,.45),max:0,t:'dot'})}
function goo(x,y,n,c='rgba(150,230,60,.9)'){for(let i=0;i<n;i++)parts.push({x:x+rand(-10,10),y:y+rand(-6,6),vx:rand(-140,140),vy:rand(-260,-60),g:1100,c,s:rand(3,6),life:rand(.3,.6),max:0,t:'dot'})}
function purpleMist(x,y,n){for(let i=0;i<n;i++)parts.push({x:x+rand(-14,14),y:y+rand(-8,8),vx:rand(-40,40),vy:rand(-90,-20),g:0,c:Math.random()<.5?'rgba(170,90,230,.75)':'rgba(120,60,190,.7)',s:rand(4,9),life:rand(.35,.7),max:0,t:'puff'})}
// is there a floor just ahead (so a dash or a charge stops at a drop) and no wall
function brakeAhead(e,dir,d=10){const fx=dir>0?e.x+e.w+d:e.x-d,r=Math.floor((e.y+e.h+4)/TS);return isFloorT(tile(Math.floor(fx/TS),r))}
function wallAhead(e,dir,d=6){const fx=dir>0?e.x+e.w+d:e.x-d;for(let y=e.y+6;y<e.y+e.h-4;y+=TS*.5)if(solid(Math.floor(fx/TS),Math.floor(y/TS)))return true;return false}
// the brute's arm, the rat king's head: boxes other code uses
function bruteHead(e){const cx=e.x+e.w/2;return{x:cx-26,y:e.y-6,w:52,h:30}}
function bruteBlocks(e,srcX){return e.type==='brute'&&!e.dead&&(e.state==='charge'||e.state==='roar')&&Math.sign(srcX-(e.x+e.w/2))===e.face}
function tentBox(e){ // the part of the tentacle that is out of the manhole
  const mx=e.mx,my=e.my,h=e.len||0;
  if(e.state==='slam'||e.state==='lie'){const k=e.state==='lie'?1:e.k||0,L=TENT_LEN,ang=k*Math.PI/2,ex=mx+e.face*Math.sin(ang)*L,ey=my-Math.cos(ang)*L;
    return{x:Math.min(mx,ex)-16,y:Math.min(my,ey)-16,w:Math.abs(ex-mx)+32,h:Math.max(26,my-Math.min(my,ey))+6}}
  return{x:mx-17,y:my-h,w:34,h:Math.max(4,h)}}
const TENT_LEN=136;
const CITY_EUPD={
  mutRat(e,dt){
    const was=e.onGround;enemyGravity(e,dt);
    const cx=e.x+e.w/2,dx=P.x+P.w/2-cx,adx=Math.abs(dx);
    e.cd-=dt;e.anim+=Math.abs(e.vx)*dt/9;
    switch(e.state){
      case 'crouch': e.vx=approach(e.vx,0,1400*dt);e.t-=dt;if(e.t<=0){e.state='dash';e.t=.5;e.vx=e.face*520;sfx('dash')}break;
      case 'dash':{e.t-=dt;e.vx=e.face*520;if(Math.random()<.5)dust(cx-e.face*16,e.y+e.h,1,-e.face);
        if(e.t<=0||e.hitWall||(e.onGround&&!brakeAhead(e,e.face,4))){e.state='skid';e.t=.55;sfx('land')}break}
      case 'skid': e.vx=approach(e.vx,0,1500*dt);e.t-=dt;if(e.t<=0){e.state='idle';e.cd=rand(1,1.6)}break;
      default:
        if(e.hitWall||(e.onGround&&!groundAhead(e,e.dir)))e.dir*=-1;
        e.vx=e.onGround?e.dir*70:e.vx;e.face=e.dir;
        if(!P.dead&&e.cd<=0&&adx<RAT_SEE&&adx>30&&pSameFloor(e)&&e.onGround){e.face=e.dir=Math.sign(dx)||e.dir;e.state='crouch';e.t=.42;e.vx=0;sfx('squeak')}
    }
    if(!was&&e.onGround&&e.state==='dash')e.state='skid';
  },
  acidSpitter(e,dt){
    enemyGravity(e,dt);
    const cx=e.x+e.w/2,dx=P.x+P.w/2-cx,adx=Math.abs(dx),near=!P.dead&&adx<520&&Math.abs(P.y-e.y)<260;
    e.cd-=dt;e.anim+=dt;
    if(e.state==='swell'){e.vx=0;e.t-=dt;e.sw=clamp(1-e.t/.6,0,1);if(Math.random()<.2)goo(cx+e.face*14,e.y+18,1);
      if(e.t<=0){acidSpit(e);e.state='idle';e.cd=rand(2,2.8);e.sw=0}return}
    if(near){if(adx>12)e.face=Math.sign(dx);
      const want=adx>220?e.face:adx<150?-e.face:0;let mv=want;if(mv&&(!groundAhead(e,mv)||e.hitWall))mv=0;e.vx=approach(e.vx,mv*32,300*dt);
      if(e.cd<=0&&adx<460){e.state='swell';e.t=.6;e.vx=0;sfx('gurgle')}}
    else{if(e.hitWall||(e.onGround&&!groundAhead(e,e.dir)))e.dir*=-1;e.vx=approach(e.vx,e.dir*22,300*dt);e.face=e.dir}
  },
  mutCrow(e,dt){
    if(e.px==null){e.px=e.perchX!=null?e.perchX:e.x+e.w/2;e.py=e.perchY!=null?e.perchY:e.y+e.h}
    const pcx=P.x+P.w/2,pcy=P.y+P.h/2;e.cd-=dt;e.anim+=dt;
    switch(e.state){
      case 'caw': e.t-=dt;if(e.t<=0){e.state='dive';const dx=e.tx-(e.x+e.w/2),dy=e.ty-(e.y+e.h/2),l=Math.hypot(dx,dy)||1;e.vx=dx/l*500;e.vy=dy/l*500;e.t=l/500+.22;sfx('dash')}break;
      case 'dive':{e.t-=dt;e.x+=e.vx*dt;e.y+=e.vy*dt;e.face=Math.sign(e.vx)||e.face;
        if(e.t<=0||solid(Math.floor((e.x+e.w/2)/TS),Math.floor((e.y+e.h)/TS))){e.state='rise';if(solid(Math.floor((e.x+e.w/2)/TS),Math.floor((e.y+e.h)/TS)))dust(e.x+e.w/2,e.y+e.h,4)}break}
      case 'rise':{const tx=e.px-e.w/2,ty=e.py-e.h,dx=tx-e.x,dy=ty-e.y,l=Math.hypot(dx,dy);
        if(l<8){e.x=tx;e.y=ty;e.state='perch';e.cd=rand(1.3,2);break}
        const sp=Math.min(260,l*4);e.x+=dx/l*sp*dt;e.y+=dy/l*sp*dt;if(Math.abs(dx)>4)e.face=Math.sign(dx);break}
      default:{e.x=e.px-e.w/2;e.y=e.py-e.h;
        const dx=pcx-e.px;if(Math.abs(dx)>10)e.face=Math.sign(dx);
        if(!P.dead&&e.cd<=0&&Math.abs(dx)<300&&pcy>e.py+30&&pcy-e.py<380){e.state='caw';e.t=.45;e.tx=pcx;e.ty=pcy;sfx('squawk')}}
    }
  },
  brute(e,dt){
    enemyGravity(e,dt);
    const cx=e.x+e.w/2,dx=P.x+P.w/2-cx,adx=Math.abs(dx);
    e.cd-=dt;
    switch(e.state){
      case 'roar': e.vx=0;e.t-=dt;if(Math.random()<.3)dust(cx+rand(-20,20),e.y+e.h,1);if(e.t<=0){e.state='charge';e.t=0;e.run=0;sfx('dash');shake(.1,3)}break;
      case 'charge':{e.vx=e.face*430;e.run+=430*dt;e.anim+=dt*14;if(Math.random()<.4)dust(cx-e.face*30,e.y+e.h,1,-e.face);
        if(Math.floor(e.anim)%2&&Math.random()<.2&&Math.abs(e.x-P.x)<VW*.7)shake(.05,2);
        if(wallAhead(e,e.face,8)){ // smack into a wall (or a wrecked car): it smashes a cracked one, is dazed by a solid one
          const wc=Math.floor((e.face>0?e.x+e.w+8:e.x-8)/TS);let broke=false;for(let r=Math.floor(e.y/TS);r<=Math.floor((e.y+e.h-1)/TS);r++)if(tile(wc,r)===T_CRACKW)broke=breakWall(wc,r)||broke;
          if(!broke){e.state='stun';e.t=1.5;e.vx=-e.face*120;e.vy=-200;e.onGround=false;shake(.3,7);sfx('clang');ratSpark(cx+e.face*36,e.y+30,8,'#fff3b0')}}
        else if(e.run>620||(e.onGround&&!brakeAhead(e,e.face,14))){e.state='skid';e.t=.6}
        break}
      case 'skid': e.vx=approach(e.vx,0,1100*dt);e.t-=dt;if(Math.random()<.4)dust(cx+e.face*20,e.y+e.h,1,e.face);if(e.t<=0){e.state='walk';e.cd=rand(1.4,2.2)}break;
      case 'stun': e.vx=approach(e.vx,0,600*dt);e.t-=dt;if(e.t<=0){e.state='walk';e.cd=rand(1.6,2.4)}break;
      default:{
        if(adx>16)e.face=Math.sign(dx);
        let mv=0;if(!P.dead&&adx<BRUTE_SEE+80&&adx>90&&pSameFloor(e,120))mv=e.face;
        if(mv&&(!groundAhead(e,mv)||e.hitWall))mv=0;
        e.vx=approach(e.vx,mv*48,300*dt);const b=Math.floor(e.anim);e.anim+=Math.abs(e.vx)*dt/22;
        if(Math.floor(e.anim)!==b&&Math.abs(e.x-P.x)<VW*.7)dust(cx,e.y+e.h,2);
        if(!P.dead&&e.cd<=0&&adx<BRUTE_SEE&&pSameFloor(e,60)&&e.onGround){e.state='roar';e.t=.75;e.vx=0;sfx('roar')}
      }
    }
  },
  tentacle(e,dt){
    if(e.mx==null){e.mx=e.x+e.w/2;e.my=e.y+e.h;e.len=0;e.state='hide';e.cd=.4}
    const dx=P.x+P.w/2-e.mx,near=!P.dead&&Math.abs(dx)<120&&P.y+P.h>e.my-170&&P.y<e.my+10;
    e.cd-=dt;e.ph=(e.ph||0)+dt;
    switch(e.state){
      case 'hide': e.len=0;if(e.cd<=0&&near){e.state='warn';e.t=.55;sfx('creak')}break;
      case 'warn': e.t-=dt;if(Math.random()<.4)purpleMist(e.mx,e.my-4,1);if(e.t<=0){e.state='up';e.t=0;sfx('slosh')}break;
      case 'up': e.t+=dt;e.len=Math.min(TENT_LEN,TENT_LEN*e.t/.16);if(e.t>.16){e.state='sway';e.t=.35;e.face=Math.sign(dx)||e.face}break;
      case 'sway': e.t-=dt;e.face=Math.sign(dx)||e.face;if(e.t<=0){e.state='slam';e.k=0}break;
      case 'slam': e.k=Math.min(1,e.k+dt/.22);if(e.k>=1){e.state='lie';e.t=.6;shake(.15,4);sfx('land');purpleMist(e.mx+e.face*TENT_LEN*.7,e.my-6,6)}break;
      case 'lie': e.t-=dt;if(e.t<=0){e.state='down';e.t=.3}break;
      case 'down': e.t-=dt;e.len=TENT_LEN*Math.max(0,e.t/.3);if(e.t<=0){e.state='hide';e.cd=1.5}break;
    }
    const b=e.state==='hide'||e.state==='warn'?{x:e.mx-20,y:e.my-6,w:40,h:6}:tentBox(e);e.x=b.x;e.y=b.y;e.w=b.w;e.h=b.h;
  },
};
// a glob of acid lobbed in an arc to where the player stands
function acidSpit(e){
  const cx=e.x+e.w/2,f=e.face,x0=cx+f*16,y0=e.y+16,g=1400,tx=P.x+P.w/2+P.vx*.25,ty=P.y+P.h-8,T=clamp(Math.abs(tx-x0)/330,.55,1.2);
  eshots.push({k:'glob',x:x0,y:y0,vx:(tx-x0)/T,vy:(ty-y0-.5*g*T*T)/T,g,r:11});sfx('spit');goo(x0,y0,4);
}
/* ---------- ruined city: enemy projectiles ---------- */
function updateCityShot(b,dt,pb){
  switch(b.k){
    case 'glob':{b.vy+=b.g*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;
      if(Math.random()<.4)parts.push({x:b.x,y:b.y,vx:0,vy:0,g:400,c:'rgba(160,235,70,.8)',s:rand(2,4),life:.25,max:0,t:'dot'});
      const c=Math.floor(b.x/TS),r=Math.floor((b.y+b.r)/TS);
      if(b.y>WH+40){b.dead=true;return}
      if(solid(c,Math.floor(b.y/TS))||(b.vy>0&&isFloorT(tile(c,r)))){b.dead=true;goo(b.x,b.y,8);sfx('splash');
        if(b.vy>0&&isFloorT(tile(c,r)))eshots.push({k:'acidPool',x:b.x,y:r*TS,w:0,life:2.6,max:2.6});return}
      if(!P.dead&&circleBox(b.x,b.y,b.r,pb)){hurt(b.x);b.dead=true;goo(b.x,b.y,8)}
      return}
    case 'acidPool':{b.life-=dt;b.w=Math.min(64,b.w+dt*400);if(b.life<=0){b.dead=true;return}
      if(Math.random()<.15)parts.push({x:b.x+rand(-b.w/2,b.w/2),y:b.y-3,vx:0,vy:rand(-50,-20),g:0,c:'rgba(180,240,90,.7)',s:rand(2,4),life:.5,max:0,t:'puff'});
      if(!P.dead&&b.life<b.max-.15&&overlap({x:b.x-b.w/2+6,y:b.y-10,w:b.w-12,h:12},pb))hurt(b.x);
      return}
    case 'rubbleWave':{ // a ripple of broken asphalt along the floor; stops at edges and walls
      b.x+=b.vx*dt;b.life-=dt;b.h=Math.min(1,b.h+dt*6);
      const c=Math.floor(b.x/TS),r=Math.floor((b.y+2)/TS);
      if(b.life<=0||!isFloorT(tile(c,r))||solid(c,r-1)){b.dead=true;dust(b.x,b.y-6,4);return}
      if(Math.random()<.4)parts.push({x:b.x+rand(-10,10),y:b.y-4,vx:rand(-40,40),vy:rand(-160,-60),g:900,c:'#7d7f86',s:rand(2,5),life:.35,max:0,t:'dot'});
      if(!P.dead&&overlap({x:b.x-16,y:b.y-(b.tall||34),w:32,h:b.tall||34},pb))hurt(b.x);
      return}
  }
}
function drawCityShot(b){
  switch(b.k){
    case 'glob':{ctx.fillStyle='rgba(150,230,60,.35)';ctx.beginPath();ctx.arc(b.x,b.y,b.r*1.7,0,7);ctx.fill();
      ctx.fillStyle='#a6e83a';ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.beginPath();const a=Math.atan2(b.vy,b.vx);
      ctx.ellipse(b.x,b.y,b.r*1.25,b.r*.85,a,0,7);ctx.fill();ctx.stroke();ctx.fillStyle='rgba(255,255,255,.75)';ctx.beginPath();ctx.arc(b.x-3,b.y-3,3,0,7);ctx.fill();return}
    case 'acidPool':{const a=Math.min(1,b.life/.5),w=b.w;ctx.globalAlpha=a;
      ctx.fillStyle='#8fd43a';ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(b.x,b.y-2,w/2,5,0,0,7);ctx.fill();ctx.stroke();
      ctx.fillStyle='#d6ff8a';for(let k=0;k<3;k++){const bx=b.x+Math.sin(time*3+k*2)*w*.3,by=b.y-4-((time*1.5+k*.33)%1)*8;ctx.beginPath();ctx.arc(bx,by,2.4,0,7);ctx.fill()}
      ctx.globalAlpha=1;return}
    case 'rubbleWave':{const s=Math.sign(b.vx);ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.lineJoin='round';const T=(b.tall||34)/34;
      for(const [o,hh,w] of [[-12,20,11],[0,32,13],[12,24,10]]){const h=hh*b.h*T*(1+.1*Math.sin(time*30+o));
        ctx.fillStyle=o===0?'#9a9ca6':'#6f7280';ctx.beginPath();ctx.moveTo(b.x+o*s-w,b.y);ctx.lineTo(b.x+o*s-w*.4,b.y-h);ctx.lineTo(b.x+o*s+w*.5,b.y-h*.8);ctx.lineTo(b.x+o*s+w,b.y);ctx.closePath();ctx.fill();ctx.stroke()}
      return}
  }
}
/* ---------- downed power lines ---------- */
function wireBox(w){return w.k==='arc'?{x:w.x-16,y:w.top,w:32,h:w.y-w.top}:{x:w.x+4,y:w.top,w:w.w-8,h:w.y-w.top}}
function updateCityWires(dt){
  const pb={x:P.x+3,y:P.y+6,w:P.w-6,h:P.h-6};
  for(const w of cityWires){
    const vis=w.x+w.w>camX-200&&w.x<camX+VW+200;
    w.t-=dt;
    if(w.t<=0){if(w.st==='off'){w.st='warn';w.t=w.warn;if(vis)sfx('buzz')}else if(w.st==='warn'){w.st='on';w.t=w.on;if(vis)sfx('zap')}else{w.st='off';w.t=w.off}}
    if(!vis)continue;
    const b=wireBox(w);
    if(w.st==='warn'&&Math.random()<.35)ratSpark(b.x+rand(0,b.w),w.k==='arc'?w.top+rand(0,20):w.y-4,1,'#fff36a');
    if(w.st==='on'){if(Math.random()<.6)ratSpark(b.x+rand(0,b.w),rand(b.y,b.y+b.h),1,Math.random()<.5?'#fff9c0':'#9fe8ff');
      if(!P.dead&&overlap(b,pb))hurt(b.x+b.w/2)}
  }
}
function drawWire(w){
  const b=wireBox(w),on=w.st==='on',warn=w.st==='warn';
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
  if(w.k==='arc'){ // a cable dangling from the broken pole down to just above the ground
    const x=w.x,y0=w.top;
    ctx.strokeStyle=INK;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x-34,y0-110);ctx.quadraticCurveTo(x-10,y0-40,x,y0);ctx.stroke();
    ctx.strokeStyle='#3b3f4a';ctx.lineWidth=2.5;ctx.stroke();
    ctx.fillStyle='#c8a050';ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(x-5,y0-4,10,10,2);ctx.fill();ctx.stroke();
    if(on||warn){const k=on?1:.35;ctx.strokeStyle=on?'rgba(160,230,255,.9)':'rgba(255,240,140,.6)';ctx.lineWidth=on?4:2;
      for(let j=0;j<(on?3:1);j++){ctx.beginPath();let px=x,py=y0+6;ctx.moveTo(px,py);const n=8,stepY=(w.y-py)/n;
        for(let i=1;i<=n;i++){const ny=py+stepY;ctx.lineTo(x+rand(-12,12)*k,on||i<3?ny:py);py=ny}ctx.stroke()}
      if(on){ctx.fillStyle='rgba(180,235,255,.35)';ctx.beginPath();ctx.ellipse(x,w.y-2,26,7,0,0,7);ctx.fill();
        ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x,y0+6);for(let i=1;i<=8;i++)ctx.lineTo(x+rand(-8,8),y0+6+(w.y-y0-6)*i/8);ctx.stroke()}}
  }else{ // a cable lying across the street, frayed and sparking along its length
    const y=w.y-5,x0=w.x,x1=w.x+w.w;
    ctx.strokeStyle=INK;ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(x0-30,y-14);ctx.quadraticCurveTo(x0,y+2,x0+(x1-x0)/2,y);ctx.quadraticCurveTo(x1-10,y-2,x1+16,y+1);ctx.stroke();
    ctx.strokeStyle='#3b3f4a';ctx.lineWidth=3;ctx.stroke();
    if(on||warn){const top=on?b.y:w.y-18;ctx.strokeStyle=on?'rgba(170,235,255,.85)':'rgba(255,240,140,.55)';ctx.lineWidth=on?3:1.6;
      for(let j=0;j<(on?4:2);j++){const sx=x0+rand(4,x1-x0-4);ctx.beginPath();ctx.moveTo(sx,y);let py=y;while(py>top){py-=rand(6,12);ctx.lineTo(sx+rand(-9,9),py)}ctx.stroke()}
      if(on){const g=ctx.createLinearGradient(0,b.y,0,w.y);g.addColorStop(0,'rgba(150,220,255,0)');g.addColorStop(1,'rgba(150,220,255,.35)');ctx.fillStyle=g;ctx.fillRect(b.x,b.y,b.w,b.h)}}
  }
  ctx.restore();
}
/* ---------- ruined city: drawing the mutants ---------- */
const CITY_EDRAW={
  mutRat(e){
    const f=e.face,cx=e.x+e.w/2,by=e.y+e.h,cr=e.state==='crouch',sk=e.state==='skid',run=Math.sin(e.anim*1.6);
    shadow(cx,by,26);
    ctx.save();ctx.translate(cx,by);ctx.scale(f,1);ctx.lineJoin='round';ctx.strokeStyle=INK;ctx.lineWidth=2.5;
    if(cr)ctx.translate(rand(-1,1),3);
    // tail: long, bald, pink
    ctx.strokeStyle=INK;ctx.lineWidth=6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-20,-10);ctx.quadraticCurveTo(-40,-4+run*4,-52,-18+run*6);ctx.stroke();
    ctx.strokeStyle=col(e,'#e8a3a8');ctx.lineWidth=3;ctx.stroke();
    // legs
    ctx.fillStyle=col(e,'#6f5f66');for(const [lx,o] of [[-14,run],[10,-run]]){ctx.beginPath();ctx.ellipse(lx+o*4,-4,6,5,0,0,7);ctx.fill();ctx.lineWidth=2;ctx.stroke()}
    // body: hunched, with bald patches and glowing pustules
    const hb=cr?20:sk?22:24;ctx.lineWidth=2.5;
    ctx.fillStyle=col(e,'#8a7c84');ctx.beginPath();ctx.moveTo(-24,-6);ctx.quadraticCurveTo(-26,-hb-2,-2,-hb);ctx.quadraticCurveTo(18,-hb+2,22,-12);ctx.quadraticCurveTo(10,-2,-24,-6);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle=col(e,'#c99aa2');ctx.beginPath();ctx.ellipse(-8,-hb+8,7,4,-.3,0,7);ctx.fill();
    ctx.fillStyle='#b8ff5a';for(const [px,py,r] of [[-14,-14,2.6],[2,-hb+4,2],[-2,-10,1.8]]){ctx.beginPath();ctx.arc(px,py,r,0,7);ctx.fill()}
    // head with a third eye and long teeth
    ctx.fillStyle=col(e,'#8a7c84');ctx.beginPath();ctx.moveTo(14,-20);ctx.quadraticCurveTo(30,-24,38,-10);ctx.lineTo(18,-6);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle=col(e,'#e8a3a8');ctx.beginPath();ctx.arc(38,-11,3,0,7);ctx.fill();
    ctx.beginPath();ctx.ellipse(14,-24,5,7,-.4,0,7);ctx.fill();ctx.stroke();
    const glow=cr||e.state==='dash'?'#ff3b2e':'#ffe14a';
    for(const [ex,ey] of [[24,-17],[29,-15],[19,-15]]){ctx.fillStyle=glow;ctx.beginPath();ctx.arc(ex,ey,2.2,0,7);ctx.fill()}
    ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(32,-7);ctx.lineTo(34,-2);ctx.lineTo(35,-7);ctx.closePath();ctx.fill();
    if(e.state==='skid'){ctx.fillStyle='#fff3b0';for(let k=0;k<3;k++){const a=time*8+k*2.1;drawStar(18+Math.cos(a)*12,-32+Math.sin(a)*4,3,time)}}
    ctx.restore();
  },
  acidSpitter(e){
    const f=e.face,cx=e.x+e.w/2,by=e.y+e.h,sw=e.sw||0,wob=Math.sin(e.anim*5)*.04;
    shadow(cx,by,28);
    ctx.save();ctx.translate(cx,by);ctx.scale(f,1);ctx.lineJoin='round';ctx.strokeStyle=INK;ctx.lineWidth=2.6;
    // stubby legs
    ctx.fillStyle=col(e,'#6e8a3a');for(const lx of [-12,10]){ctx.beginPath();ctx.roundRect(lx-5,-12,10,12,4);ctx.fill();ctx.stroke()}
    // the bloated body
    const hw=24*(1+wob+sw*.12),hh=40*(1-wob+sw*.08);
    blob(0,-6,hw,hh);ctx.fillStyle=col(e,'#9fc94a');ctx.fill();ctx.stroke();
    ctx.save();blob(0,-6,hw,hh);ctx.clip();ctx.fillStyle='rgba(60,90,20,.25)';ctx.beginPath();ctx.ellipse(8,-10,hw*.9,hh*.5,0,0,7);ctx.fill();
    ctx.fillStyle=col(e,'#d9ef8a');for(const [px,py,r] of [[-10,-30,4],[6,-20,3],[-4,-14,2.4],[12,-36,2.6]]){ctx.beginPath();ctx.arc(px,py,r,0,7);ctx.fill()}ctx.restore();
    // the throat sac swells before it spits
    ctx.fillStyle=col(e,sw>.1?'#e9ff6a':'#c8e86a');ctx.beginPath();ctx.ellipse(14,-22,7+sw*9,6+sw*8,0,0,7);ctx.fill();ctx.stroke();
    // a lopsided face
    ctx.fillStyle=INK;ctx.beginPath();ctx.arc(4,-40,3.5,0,7);ctx.arc(14,-37,2.6,0,7);ctx.fill();
    ctx.fillStyle='#ff5a3a';ctx.beginPath();ctx.arc(5,-41,1.2,0,7);ctx.fill();
    ctx.fillStyle='#4a2a1a';ctx.beginPath();ctx.ellipse(18,-30,5,2+sw*4,0,0,7);ctx.fill();
    ctx.fillStyle='rgba(170,240,70,.9)';const drip=(time*1.3+e.x*.01)%1;ctx.beginPath();ctx.arc(19,-28+drip*16,2,0,7);ctx.fill();
    ctx.restore();
  },
  mutCrow(e){
    const f=e.face,cx=e.x+e.w/2,cy=e.y+e.h/2,st=e.state,flap=st==='perch'?0:Math.sin(time*(st==='dive'?8:16));
    ctx.save();ctx.translate(cx,cy);ctx.scale(f,1);ctx.lineJoin='round';ctx.strokeStyle=INK;ctx.lineWidth=2.4;
    if(st==='dive')ctx.rotate(Math.atan2(Math.abs(e.vy),Math.abs(e.vx))*.6);
    const spread=st==='caw'?1:st==='perch'?.15:.6+flap*.4;
    // wings (ragged)
    ctx.fillStyle=col(e,'#2e2a38');for(const s of [-1,1]){ctx.save();ctx.scale(1,1);ctx.beginPath();ctx.moveTo(-4,-2);
      ctx.lineTo(-18,-6-spread*20*s*(s>0?1:.6));ctx.lineTo(-26,-2-spread*12);ctx.lineTo(-22,4);ctx.lineTo(-14,6);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()}
    // body
    ctx.fillStyle=col(e,'#3a3448');ctx.beginPath();ctx.ellipse(0,4,15,11,0,0,7);ctx.fill();ctx.stroke();
    // two heads on one neck
    for(const [hx,hy,a] of [[11,-8,-.3],[16,0,.2]]){ctx.fillStyle=col(e,'#3a3448');ctx.beginPath();ctx.arc(hx,hy,7,0,7);ctx.fill();ctx.stroke();
      ctx.fillStyle='#e0b23a';ctx.beginPath();ctx.moveTo(hx+5,hy-2+a*4);ctx.lineTo(hx+16,hy+a*8+(st==='caw'?-3:0));ctx.lineTo(hx+5,hy+3);ctx.closePath();ctx.fill();ctx.stroke();
      if(st==='caw'){ctx.beginPath();ctx.moveTo(hx+5,hy+3);ctx.lineTo(hx+14,hy+8);ctx.lineTo(hx+5,hy+5);ctx.closePath();ctx.fill();ctx.stroke()}
      ctx.fillStyle=st==='caw'||st==='dive'?'#ff3be0':'#c77dff';ctx.beginPath();ctx.arc(hx+2,hy-2,2.2,0,7);ctx.fill()}
    // feet
    ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-2,14);ctx.lineTo(-4,19);ctx.moveTo(4,14);ctx.lineTo(4,19);ctx.stroke();
    ctx.restore();
  },
  brute(e){
    const f=e.face,cx=e.x+e.w/2,by=e.y+e.h,st=e.state,stp=Math.sin(e.anim*Math.PI)*4;
    shadow(cx,by,40);
    ctx.save();ctx.translate(cx,by);if(st==='roar')ctx.translate(rand(-1.5,1.5),0);ctx.scale(f,1);ctx.lineJoin='round';ctx.strokeStyle=INK;ctx.lineWidth=3;
    const lean=st==='charge'?.18:st==='stun'?-.08:0;ctx.rotate(lean);
    const skin=col(e,'#8f9a7a'),dark=col(e,'#5f6a52'),vein='#c77dff';   // sickly olive grey: it stands out against the violet sky
    // legs and torn trousers
    ctx.fillStyle=col(e,'#4a5468');for(const [lx,o] of [[-22,stp],[6,-stp]]){ctx.beginPath();ctx.roundRect(lx,-34+Math.min(0,o),18,34-Math.min(0,o),4);ctx.fill();ctx.stroke()}
    // the small arm at the back
    limb(-18,-74,-30,-46,10,dark);
    // hunched body
    ctx.fillStyle=skin;ctx.beginPath();ctx.moveTo(-26,-30);ctx.quadraticCurveTo(-36,-80,-6,-92);ctx.quadraticCurveTo(26,-96,32,-64);ctx.quadraticCurveTo(30,-34,18,-30);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.strokeStyle=vein;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-14,-80);ctx.quadraticCurveTo(-6,-66,-12,-50);ctx.moveTo(6,-86);ctx.quadraticCurveTo(14,-70,8,-60);ctx.stroke();
    ctx.strokeStyle=INK;ctx.lineWidth=3;
    // the small head sunk between the shoulders
    ctx.fillStyle=skin;ctx.beginPath();ctx.arc(10,-90,13,0,7);ctx.fill();ctx.stroke();
    const angry=st==='roar'||st==='charge';ctx.fillStyle=angry?'#ff3b2e':'#ffe14a';ctx.beginPath();ctx.arc(15,-93,2.6,0,7);ctx.fill();
    ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(8,-99);ctx.lineTo(19,-96);ctx.stroke();
    if(st==='roar'){ctx.fillStyle='#4a1a2a';ctx.beginPath();ctx.ellipse(17,-84,6,5,0,0,7);ctx.fill()}else{ctx.beginPath();ctx.moveTo(12,-83);ctx.lineTo(21,-84);ctx.stroke()}
    // the huge arm: forward and low while charging, raised while roaring
    ctx.lineWidth=3;
    const [hx,hy]=st==='charge'?[46,-40]:st==='roar'?[30,-118]:st==='stun'?[34,-24]:[34,-30+stp];
    limb(18,-74,(18+hx)/2+6,(-74+hy)/2,22,skin);limb((18+hx)/2+6,(-74+hy)/2,hx,hy,20,skin);
    ctx.fillStyle=dark;ctx.beginPath();ctx.arc(hx,hy,15,0,7);ctx.fill();ctx.stroke();
    ctx.strokeStyle=vein;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(26,-66);ctx.lineTo(32,-52);ctx.stroke();
    if(st==='stun'){ctx.fillStyle='#fff3b0';for(let k=0;k<3;k++){const a=time*7+k*2.1;drawStar(10+Math.cos(a)*18,-116+Math.sin(a)*5,4,time)}}
    ctx.restore();
  },
  tentacle(e){
    const st=e.state;if(st==='hide')return;
    const mx=e.mx,my=e.my,f=e.face;
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
    if(st==='warn'){ctx.fillStyle=`rgba(170,90,230,${.25+.25*Math.sin(time*20)})`;ctx.beginPath();ctx.ellipse(mx,my-3,30,8,0,0,7);ctx.fill();ctx.restore();return}
    // the tentacle as a chain of shrinking circles along a curve
    const L=st==='up'||st==='sway'||st==='down'?e.len:TENT_LEN,k=st==='slam'?e.k:st==='lie'?1:0,n=14;
    const pts=[];for(let i=0;i<=n;i++){const u=i/n,ang=k*Math.PI/2*u*(1.2-u*.2)+(st==='sway'?Math.sin(time*9+u*3)*.18*u:0)+(st==='up'?Math.sin(time*14+u*4)*.08:0);
      const prev=pts[i-1]||{x:mx,y:my};pts.push(i?{x:prev.x+f*Math.sin(ang)*L/n,y:prev.y-Math.cos(ang)*L/n}:{x:mx,y:my})}
    for(const pass of [0,1])for(let i=0;i<pts.length;i++){const u=i/n,r=15*(1-u*.72)+2,p=pts[i];
      ctx.beginPath();ctx.arc(p.x,p.y,r+(pass?0:2.6),0,7);ctx.fillStyle=pass?(e.flash>0?'#fff':i%3?'#9b5bd6':'#b57ae8'):INK;ctx.fill()}
    // suckers along the inside
    ctx.fillStyle='#f0c8ff';for(let i=2;i<pts.length-2;i+=2){const p=pts[i];ctx.beginPath();ctx.arc(p.x-f*4,p.y+2,2.2,0,7);ctx.fill()}
    ctx.restore();
  },
};
