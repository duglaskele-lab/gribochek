/* ---------- enemies ---------- */
const PROPS=new Set(['barrel','crate','pot','lizHut']);
const EDEF={
  slime:{w:51,h:39,hp:2}, monkey:{w:78,h:106,hp:6}, caterpillar:{w:40,h:36,hp:6}, orc:{w:44,h:64,hp:5},
  scorpion:{w:56,h:34,hp:3}, parrot:{w:50,h:36,hp:2}, goblin:{w:34,h:46,hp:2}, sandworm:{w:80,h:192,hp:5.2}, cactus:{w:38,h:62,hp:4},
  mummy:{w:36,h:60,hp:4}, scarab:{w:44,h:30,hp:3},
  lizSword:{w:36,h:62,hp:4}, lizMage:{w:34,h:62,hp:3}, lizChief:{w:54,h:93,hp:9}, piranha:{w:34,h:24,hp:1},
  maskGob:{w:34,h:46,hp:2}, mosquito:{w:34,h:26,hp:1}, spider:{w:34,h:30,hp:2}, frog:{w:40,h:30,hp:2}, lizHut:{w:96,h:84,hp:6}, barrel:{w:34,h:40,hp:1.5}, crate:{w:38,h:38,hp:1}, pot:{w:32,h:36,hp:1},
};
function groundTop(c){for(let r=0;r<ROWS;r++){const t=tile(c,r);if(isSolidT(t))return r*TS;if(t===T_WATER||t===T_SAND)return -1}return WH+400}
function makeEnemy(type,c,extra){
  const d=EDEF[type]; const ty=extra&&extra.y!=null?extra.y:groundTop(c); if(ty<0||ty>WH) return null;
  const e={type,x:c*TS+TS/2-d.w/2,y:ty-d.h,w:d.w,h:d.h,vx:0,vy:0,hp:d.hp,face:RNG()<.5?-1:1,dir:RNG()<.5?-1:1,
    t:RNG()+.3,flash:0,onGround:true,state:'idle',cd:RNG(),anim:RNG()*6,squash:0,wind:0,thrown:0,beat:0,hopT:2+RNG()*2,turnT:0,hue:RNG()<.3?1:0};
  if(type==='caterpillar'){
    e.gy=ty;e.N=7;e.sp=30;e.segs=[];e.pl=[];
    for(let i=0;i<e.N;i++){e.segs.push({x:c*TS+TS/2-e.dir*i*e.sp})}
    for(let i=0;i<e.N;i++) e.pl.push({x:0,y:ty-33,w:34,h:10,owner:e,seg:i});
    e.x=e.segs[0].x-20;e.y=ty-36;
  }
  if(type==='parrot'){e.y=(2+Math.floor(RNG()*3))*TS;e.hx=e.homeX=e.x;e.hy=e.homeY=e.y;e.state='patrol';e.ph=RNG()*6}
  if(type==='sandworm'){
    e.gy=ty;const h0=ty;let a=c,b=c;while(a>0&&groundTop(a-1)===h0&&b-a<40)a--;while(b<COLS-1&&groundTop(b+1)===h0&&b-a<40)b++;
    e.x0=a*TS+10;e.x1=(b+1)*TS-10-e.w;e.rise=0;e.state='hidden';e.h=4;e.y=ty-4;e.t=2;
  }
  if(type==='cactus') e.t=1+RNG()*1.5;
  if(type==='piranha'){if(!fishRange(e))return null;e.state='swim';e.ph=RNG()*6;e.cd=1+RNG()*2}
  if(type==='maskGob'){e.bx=e.x+e.w/2;e.by=ty;e.state='hide';e.cd=RNG()*1.5;e.blink=RNG()*3;e.puff=0}
  if(type==='mosquito'){e.hx=e.x;e.hy=e.y;e.ph=RNG()*6;e.cd=1+RNG()}
  if(type==='spider'){e.ay=ty+14;e.y=e.ay+4;e.ph=RNG()*6;e.cd=0;const sc=Math.floor((e.x+e.w/2)/TS),r0=Math.floor(ty/TS)+1;let r=r0;
    while(r<ROWS&&r-r0<14&&!isFloorT(tile(sc,r))&&tile(sc,r)!==T_WATER)r++;e.maxY=r*TS-e.h-4;if(e.maxY<e.ay+70)return null}
  if(type==='frog'){e.tl=0;e.cd=.5+RNG();e.ph=RNG()*6}
  if(type==='lizHut'){e.kids=[];e.made=0;e.cd=0;e.door=0;e.prop=true;e.face=1}
  if(type==='barrel'||type==='crate'||type==='pot') e.prop=true;
  if(type==='lizChief'){e.helmet=true;e.jcd=3+RNG()*3;e.tcd=1+RNG();e.axeOut=false}
  const H=ENEMY_HOOKS[type]; if(H&&H.init) H.init(e);
  return e;
}
function dropLoot(e){
  const cx=e.x+e.w/2,cy=e.y+e.h/2;
  const heartP=(ENEMY_HOOKS[e.type]&&ENEMY_HOOKS[e.type].heart)||{monkey:.5,orc:.45,mummy:.3,scarab:.2,caterpillar:.4,lizChief:.8,lizSword:.2,frog:.15,maskGob:.2}[e.type]||.12;
  if(Math.random()<heartP) items.push({k:'heart',x:cx,y:cy,ph:0,vy:-300,drop:true});
  if(Math.random()<.27) items.push({k:'spore',x:cx+rand(-10,10),y:cy,ph:0,vy:-360,vx:rand(-60,60),drop:true,loot:true});
}
function damageEnemy(e,dmg,srcX){
  if(e.prop){e.hp-=dmg;e.flash=.1;if(e.hp<=EPS){e.dead=true;breakProp(e)}else{sfx('hit');burst(e.x+e.w/2,e.y+e.h/2,6,'#9a6a3c',160)}return}
  e.hp-=dmg;e.flash=.1;
  if(e.type==='slime'){e.vx=(e.x+e.w/2<srcX?-1:1)*90}
  if(e.hp<=EPS){
    if(e.type==='mummy'&&!e.pile&&!e.revived){e.pile=true;e.pileT=3;e.hp=1.5;e.vx=0;burst(e.x+e.w/2,e.y+e.h/2,14,'#e8dcc0',200);sfx('hit');return}
    e.dead=true;hitstop=.045;sfx('kill');
    const cx=e.x+e.w/2,cy=e.y+e.h/2;
    const col={slime:e.hue===2?'#b77ee0':e.hue?'#8fd0e8':'#8ed45e',caterpillar:'#8cc84b',orc:'#6f8a4a',goblin:'#8fbf4a',scorpion:'#c9772e',parrot:'#3fbf5a',sandworm:'#c9709a',cactus:'#5f9d45',mummy:'#e8dcc0',scarab:'#2f6f78',lizSword:'#5f9a4a',lizMage:'#6a4a9a',lizChief:'#4d7f3e',piranha:'#d8503a',maskGob:'#6f9f4a',mosquito:'#8a6a4a',spider:'#4a2f4f',frog:'#6f9a3a'}[e.type]||(ENEMY_HOOKS[e.type]&&ENEMY_HOOKS[e.type].deathColor)||'#7a4b2b';
    burst(cx,cy,20,col,280);stars(cx,cy,6);
    if(e.type==='caterpillar'){for(const s of e.segs) burst(s.x,e.gy-17,6,col,160);for(const r of e.riders||[]) r.rider=null}
    dropLoot(e);
    const H=ENEMY_HOOKS[e.type]; if(H&&H.onDeath) H.onDeath(e);
  }else sfx('hit');
}
function shrink(e,a=4){return{x:e.x+a,y:e.y+a,w:e.w-a*2,h:e.h-a}}
function catHead(e){const s=e.segs[0];return{x:s.x-20,y:e.gy-38,w:40,h:38}}
function enemyHurtBoxes(e){
  if(e.dead) return [];
  switch(e.type){
    case 'caterpillar': return [catHead(e),...e.segs.slice(1).map(s=>({x:s.x-17,y:e.gy-34,w:34,h:34}))];
    case 'sandworm': return e.rise>.3?[{x:e.x,y:e.y,w:e.w,h:e.h}]:[];
    case 'mummy': return e.pile?[{x:e.x-6,y:e.y+e.h-20,w:e.w+12,h:20}]:[e];
    case 'maskGob': return e.state==='hide'?[{x:e.bx-26,y:e.by-40,w:52,h:40}]:[e];
    case 'lizHut': return [{x:e.x+8,y:e.y+10,w:e.w-16,h:e.h-10}];
    default: return [e];
  }
}
function chiefHead(e){const cx=e.x+e.w/2;return{x:e.face>0?cx-16:cx-45,y:e.y-8,w:61,h:36}}
const CHIEF_GUARD=4;
// the arm the commander holds over his head while guarding: a one-way ledge that rides along with him
function chiefArm(e){const cx=e.x+e.w/2,nx=e.face>0?cx-27:cx-48,ny=e.y-18;
  if(!e.arm){e.arm={x:nx,y:ny,w:75,h:10,owner:e};return}
  if(P.ride===e.arm&&P.onGround&&!P.dead){P.x+=nx-e.arm.x;P.y+=ny-e.arm.y}
  e.arm.x=nx;e.arm.y=ny}
function chiefSwing(e){const cx=e.x+e.w/2;return{x:e.face>0?cx-10:cx-165,y:e.y-50,w:175,h:e.h+50}}
// the pool a piranha lives in: contiguous water around it, plus surface and bottom
function fishRange(e){
  const r=Math.floor((e.y+e.h/2)/TS), c=Math.floor((e.x+e.w/2)/TS);
  if(tile(c,r)!==T_WATER) return false;
  let a=c,b=c;while(tile(a-1,r)===T_WATER)a--;while(tile(b+1,r)===T_WATER)b++;
  let t=r;while(tile(c,t-1)===T_WATER)t--;let d=r;while(tile(c,d+1)===T_WATER)d++;
  e.x0=a*TS;e.x1=(b+1)*TS;e.surf=t*TS;e.bot=(d+1)*TS;e.dir=e.dir||1;
  return b>a;
}
const FROG_WIND=.4;   // the frog's warning before its tongue lashes out
function swingBox(e,len,h,oy=4){return{x:e.face>0?e.x+e.w-6:e.x-len+6,y:e.y+oy,w:len,h}}
// which boxes hurt the player on touch, and where the player can stomp
function contactInfo(e){
  const H=ENEMY_HOOKS[e.type]; if(H&&H.contact) return H.contact(e);
  switch(e.type){
    case 'slime': return{hurt:[shrink(e)],stomp:e,dmg:9};
    case 'monkey': return{hurt:[shrink(e,8)],stomp:e,dmg:2};
    case 'caterpillar': {const h=catHead(e);return{hurt:[h],stomp:h,dmg:2}}
    case 'orc': {const hb=[shrink(e)];if(e.state==='swing')hb.push(swingBox(e,96,60,-8));return{hurt:hb,stomp:e,dmg:3}}
    case 'goblin': return{hurt:[shrink(e)],stomp:e,dmg:9};
    case 'scorpion': {const hb=[shrink(e)];if(e.state==='strike')hb.push(swingBox(e,60,34,-8));return{hurt:hb,stomp:e,dmg:2}}
    case 'parrot': return{hurt:[shrink(e,6)],stomp:e,dmg:3};
    case 'sandworm': return e.rise>.2?{hurt:[shrink(e,6)],stomp:e,dmg:2}:{hurt:[],stomp:null};
    case 'cactus': return{hurt:[shrink(e,3)],stomp:null};
    case 'mummy': return e.pile?{hurt:[],stomp:null}:{hurt:[shrink(e)],stomp:e,dmg:2};
    case 'lizSword': {const hb=[shrink(e)];if(e.state==='charge')hb.push(swingBox(e,50,30,14));return{hurt:hb,stomp:e,dmg:2}}
    case 'lizMage': return{hurt:[shrink(e)],stomp:e,dmg:3};
    case 'piranha': return{hurt:[shrink(e,3)],stomp:e,dmg:1};
    case 'lizChief': {const hb=[shrink(e,6)];if(e.state==='swing')hb.push(chiefSwing(e));return{hurt:hb,stomp:e.guard>0?null:chiefHead(e),dmg:2,chief:1}}
    case 'maskGob': return e.state==='hide'?{hurt:[],stomp:null}:{hurt:[shrink(e)],stomp:e,dmg:9};
    case 'mosquito': return e.state==='stuck'?{hurt:[],stomp:e,dmg:9}:{hurt:[shrink(e,5)],stomp:e,dmg:9};
    case 'spider': return{hurt:[shrink(e,5)],stomp:e,dmg:9};
    case 'frog': {const hb=[shrink(e,4)];if(e.tl>10)hb.push(frogTongue(e));return{hurt:hb,stomp:e,dmg:9}}
    case 'lizHut': return{hurt:[],stomp:null};
    case 'barrel': case 'crate': case 'pot': return{hurt:[],stomp:e,dmg:9};
    case 'scarab': return e.flipped?{hurt:[],stomp:e,dmg:2,scarab:1}:{hurt:[shrink(e)],stomp:e,dmg:1,scarab:1};
  }
  return{hurt:[e],stomp:null};
}
function doStomp(e,ct){
  if(ct.scarab&&!e.flipped){e.flipped=true;e.state='flipped';e.t=2.3;e.vx=0;damageEnemy(e,1,P.x);sfx('clang')}
  else if(ct.chief&&e.helmet){ // the first stomp only knocks the helmet off and stuns him
    e.helmet=false;e.state='stun';e.t=.55;e.vx=0;e.flash=.1;clang(P.x+P.w/2,P.y+P.h);shake(.12,4);
    parts.push({x:e.x+e.w/2,y:e.y-6,vx:-e.face*170+rand(-40,40),vy:-460,g:1300,c:'',s:1,life:1.3,max:0,t:'helm',rot:0});
    floater(e.x+e.w/2,e.y-40,T('fHelm'))}
  else{damageEnemy(e,e.prop?ct.dmg:DMG_STOMP,P.x+P.w/2);   // a stomp does 1 damage to any foe (boxes still break)
    if(!e.dead&&ENEMY_HOOKS[e.type]&&ENEMY_HOOKS[e.type].onStomp) ENEMY_HOOKS[e.type].onStomp(e);
    // two stomps on the bare head: the commander raises an arm over it (a ledge to stand on, but no more head stomps)
    if(ct.chief&&!e.dead){e.hs=(e.hs||0)+1;if(e.hs>=2){e.hs=0;e.guard=CHIEF_GUARD;chiefArm(e);floater(e.x+e.w/2,e.y-40,T('fGuard'))}}}
  // holding (or pressing right after) jump springs off the monster's head much higher
  if(!e.prop) gainMana(MANA_HIT);
  const high=inp.j||P.buffer>0;
  P.vy=high?-HIGH_BOUNCE:-STOMP_BOUNCE;P.bounceT=high?0:.14;P.bounced=true;P.buffer=0;P.jumpT=0;
  P.onGround=false;P.airDash=airDashMax();dust(P.x+P.w/2,P.y+P.h,4);
  if(high){sfx('jump');stars(P.x+P.w/2,P.y+P.h,5)}
}
function enemyGravity(e,dt){const gm=waterPhys(e);e.vy=Math.min(e.vy+G*gm*dt,e.inWater?150:1000);
  const sy=sandSurf(e);if(sy!==null){if(e.vy>40)e.vy=40;e.vx*=.5;if(e.y>sy){e.dead=true;dust(e.x+e.w/2,sy,10);return}}
  moveBody(e,dt);if(e.y>WH+60)e.dead=true}
function patrol(e,speed){if(e.hitWall||(e.onGround&&!groundAhead(e,e.dir)))e.dir*=-1;e.vx=e.onGround?e.dir*speed:e.vx;e.face=e.dir}
const EUPD={
  slime(e,dt){
    const was=e.onGround;enemyGravity(e,dt);
    if(e.hitWall) e.dir=-e.hitWall;
    if(e.onGround){
      if(!was){e.squash=.16;e.vx=0}
      e.t-=dt;
      if(e.t<=0){if(!groundAhead(e,e.dir,TS*1.1))e.dir*=-1;e.vx=e.dir*115;e.vy=-370;e.onGround=false;e.t=rand(.45,1)}
    }
    if(e.squash>0) e.squash-=dt;
  },
  monkey(e,dt){
    const riding=e.rider&&!e.rider.dead; if(!riding) enemyGravity(e,dt);
    const dx=P.x+P.w/2-(e.x+e.w/2), adx=Math.abs(dx);
    if(adx>10) e.face=Math.sign(dx);
    if(e.thrown>0) e.thrown-=dt;
    e.beat+=dt;
    if(e.wind>0){
      e.vx=approach(e.vx,0,900*dt); e.wind-=dt;
      if(e.wind<=0){
        const hx=e.x+e.w/2+e.face*10, hy=e.y-20;
        const tx=P.x+P.w/2+P.vx*.25, ty=P.y+P.h/2;
        const ddx=tx-hx, ddy=ty-hy, Tt=clamp(Math.abs(ddx)/400,.55,1.3), bg=900;
        eshots.push({k:'banana',x:hx,y:hy,vx:ddx/Tt,vy:(ddy-.5*bg*Tt*Tt)/Tt,g:bg,r:11,rot:0});
        e.thrown=.25;sfx('throwb');
      }
    }else{
      let want=0;
      if(adx<650&&!P.dead){if(adx>360)want=e.face;else if(adx<190)want=-e.face}
      if(want&&(riding||(e.onGround&&!groundAhead(e,want))))want=0;
      e.vx=riding?0:approach(e.vx,want*95,700*dt);
      e.hopT-=dt;
      if(!riding&&e.onGround&&want&&e.hopT<=0){e.vy=-560;e.onGround=false;e.hopT=rand(2.5,4.5)}
      e.t-=dt;
      if(e.t<=0&&adx<600&&adx>40&&!P.dead&&e.onGround){e.wind=.42;e.t=rand(1.4,2.2)}
    }
    e.anim+=Math.abs(e.vx)*dt/18;
  },
  caterpillar(e,dt){
    const head=e.segs[0];
    const ac=Math.floor((head.x+e.dir*26)/TS), fr=Math.floor((e.gy+4)/TS);
    if(!isFloorT(tile(ac,fr))||solid(ac,fr-1)){e.segs.reverse();e.dir*=-1}
    const dx=e.dir*48*dt;
    for(const s of e.segs) s.x+=dx;
    e.segs.forEach((s,i)=>{const pl=e.pl[i];pl.x=s.x-17;pl.y=e.gy-33;if(P.ride===pl&&P.onGround)P.x+=dx});
    // riders walk along the back to their seat, counted from the end facing the player:
    // a shield orc always steps in front of the archer it protects
    const nS=e.segs.length, headSide=Math.sign(e.segs[0].x-e.segs[nS-1].x)||1, mid=(e.segs[0].x+e.segs[nS-1].x)/2, pSide=Math.sign(P.x+P.w/2-mid)||1;
    for(const r of e.riders||[]){ if(r.dead||r.rider!==e) continue;
      const si=Math.min(r.seat,nS-1), s=e.segs[pSide===headSide?si:nS-1-si], tx=s.x-r.w/2, d=tx-(r.x+dx);
      const stepX=Math.sign(d)*Math.min(Math.abs(d),110*dt);
      r.x+=dx+stepX; r.y=e.gy-33-r.h; r.vy=0; r.onGround=true; r.walkT=Math.abs(stepX)>.5?.1:0; if(Math.abs(stepX)>.5) r.anim+=dt*10;
    }
    e.x=e.segs[0].x-20;e.y=e.gy-38;e.face=e.dir;e.anim+=dt*8;
  },
  orc(e,dt){
    const riding=e.rider&&!e.rider.dead; if(!riding) enemyGravity(e,dt);
    const dx=P.x+P.w/2-(e.x+e.w/2), adx=Math.abs(dx), dy=P.y+P.h-(e.y+e.h), want=Math.sign(dx)||e.face;
    if(e.state==='wind'){e.vx=0;e.t-=dt;if(e.t<=0){e.state='swing';e.t=.22;sfx('dash')}}
    else if(e.state==='swing'){e.t-=dt;if(e.t<=0){e.state='idle';e.cd=.8}}
    else{
      e.cd-=dt;
      if(want!==e.face&&adx>8){e.turnT+=dt;if(e.turnT>.65){e.face=want;e.turnT=0}}else e.turnT=0;
      let mv=0; if(adx<440&&!P.dead&&want===e.face&&adx>58) mv=e.face;
      if(mv&&(riding||!groundAhead(e,mv))) mv=0;
      e.vx=riding?0:approach(e.vx,mv*70,500*dt);
      if(adx<118&&want===e.face&&Math.abs(dy)<60&&e.cd<=0&&!P.dead){e.state='wind';e.t=.5}
    }
    e.anim+=Math.abs(e.vx)*dt/16;
  },
  scorpion(e,dt){
    enemyGravity(e,dt);
    const dx=P.x+P.w/2-(e.x+e.w/2), adx=Math.abs(dx), dy=P.y+P.h-(e.y+e.h);
    if(e.state==='wind'){e.vx=0;e.t-=dt;if(e.t<=0){e.state='strike';e.t=.2;sfx('punch')}}
    else if(e.state==='strike'){e.t-=dt;if(e.t<=0){e.state='walk';e.cd=1}}
    else{
      e.cd-=dt;
      if(adx<320&&Math.abs(dy)<80&&!P.dead){e.face=Math.sign(dx)||e.face;let mv=adx>70?e.face:0;if(mv&&!groundAhead(e,mv))mv=0;e.vx=mv*90}
      else patrol(e,55);
      if(adx<95&&Math.abs(dy)<50&&e.cd<=0&&!P.dead){e.face=Math.sign(dx)||e.face;e.state='wind';e.t=.4}
    }
    e.anim+=Math.abs(e.vx)*dt/10;
  },
  parrot(e,dt){
    const pcx=P.x+P.w/2, pcy=P.y+P.h/2, dx=pcx-(e.x+e.w/2);
    const steer=(tx,ty,maxV,k)=>{const ddx=tx-(e.x+e.w/2),ddy=ty-(e.y+e.h/2),kk=Math.min(1,k*dt);
      e.vx+=(clamp(ddx*2.2,-maxV,maxV)-e.vx)*kk;e.vy+=(clamp(ddy*2.2,-maxV*.7,maxV*.7)-e.vy)*kk};
    if(e.state==='patrol'){
      e.ph+=dt;e.cd-=dt;
      steer(e.hx+e.w/2+Math.sin(e.ph*.8)*230,e.hy+e.h/2+Math.sin(e.ph*1.7+1)*30,280,2.2);
      if(e.cd<=0&&Math.abs(dx)<260&&Math.abs(dx)>40&&P.y>e.y+40&&!P.dead){e.state='squawk';e.t=.35;sfx('squawk');e.face=Math.sign(dx)||e.face}
      e.x+=e.vx*dt;e.y+=e.vy*dt;
    }else if(e.state==='squawk'){
      e.t-=dt;e.vx*=Math.pow(.02,dt);e.vy=approach(e.vy,-60,600*dt);e.x+=e.vx*dt;e.y+=e.vy*dt;
      if(e.t<=0){ // plan a U-shaped swoop: lowest point at the player, then carry on and climb out the other side
        e.state='swoop';e.sx=e.x;e.sy=e.y;e.sd=e.face;e.sD=Math.max(260,Math.abs(dx)*2);
        e.sDepth=Math.max(60,pcy-(e.y+e.h/2));e.sT=clamp(e.sD/336,1,2.1);e.t=0}
    }else if(e.state==='swoop'){
      e.t+=dt;const p=Math.min(1,e.t/e.sT),px=e.x,py=e.y;
      e.x=e.sx+e.sd*e.sD*p; e.y=e.sy+e.sDepth*Math.sin(p*Math.PI);
      e.vx=(e.x-px)/dt;e.vy=(e.y-py)/dt;
      if(p>=1){e.state='patrol';e.cd=rand(1.8,2.8);e.hx=clamp(e.x,e.homeX-300,e.homeX+300);e.hy=e.homeY;e.ph=0}
    }
    if(e.state!=='swoop'&&solid(Math.floor((e.x+e.w/2)/TS),Math.floor((e.y+e.h+4)/TS))){e.y-=80*dt;if(e.vy>0)e.vy=0}
    if(e.y<24){e.y=24;if(e.vy<0)e.vy=0}
    if(e.state!=='squawk'&&Math.abs(e.vx)>20) e.face=Math.sign(e.vx);
    const flapRate=e.state==='squawk'?22:(e.vy<-40?14:e.vy>60?2:8);
    e.anim+=dt*flapRate;
    e.tilt=approach(e.tilt||0,clamp(e.vy/600,-.45,.6)*.7,dt*4);
    if(e.y>WH+60) e.dead=true;
  },
  goblin(e,dt){
    const riding=e.rider&&!e.rider.dead; if(!riding) enemyGravity(e,dt);
    const dx=P.x+P.w/2-(e.x+e.w/2), adx=Math.abs(dx);
    if(adx>8) e.face=Math.sign(dx);
    if(e.state==='draw'){e.vx=0;e.t-=dt;
      if(e.t<=0){ // lob an arrow so it lands on the player
        const hx=e.x+e.w/2+e.face*12, hy=e.y+16, tx=P.x+P.w/2+P.vx*.3, ty=P.y+P.h/2;
        const Tt=clamp(Math.abs(tx-hx)/330,.7,1.5), g=900;
        eshots.push({k:'arrow',x:hx,y:hy,vx:(tx-hx)/Tt,vy:(ty-hy-.5*g*Tt*Tt)/Tt,g,r:7,life:3});
        sfx('throwb');e.state='idle';e.cd=rand(1.6,2.4);e.loose=.2}}
    else{
      e.cd-=dt;
      if(!riding){let mv=0;if(adx<180)mv=-e.face;else if(adx>460&&adx<700)mv=e.face;
        if(mv&&!groundAhead(e,mv))mv=0;e.vx=approach(e.vx,mv*80,600*dt)}
      const onScreen=e.x>camX+10&&e.x+e.w<camX+VW-10;   // range capped to one screen
      if(e.cd<=0&&onScreen&&adx<Math.min(620,VW-40)&&adx>60&&!P.dead){e.state='draw';e.t=.55}
    }
    if(e.loose>0) e.loose-=dt;
    e.anim+=Math.abs(e.vx)*dt/9;
  },
  sandworm(e,dt){
    const dx=P.x+P.w/2-(e.x+e.w/2), near=Math.abs(dx)<520&&!P.dead;
    if(e.state==='hidden'){
      if(near){e.x=clamp(e.x+Math.sign(dx)*Math.min(Math.abs(dx),120*dt),e.x0,e.x1);e.t-=dt;
        if(Math.random()<.35) dust(e.x+e.w/2,e.gy,1);
        if(Math.abs(dx)<16||e.t<=0){e.state='rumble';e.t=.55}}
    }else if(e.state==='rumble'){e.t-=dt;if(Math.random()<.6)dust(e.x+e.w/2+rand(-16,16),e.gy,1);if(e.t<=0){e.state='up';e.t=1.3;sfx('crack');dust(e.x+e.w/2,e.gy,10)}}
    else if(e.state==='up'){e.rise=approach(e.rise,1,dt*6);e.t-=dt;if(e.t<=0)e.state='down'}
    else if(e.state==='down'){e.rise=approach(e.rise,0,dt*3.5);if(e.rise<=0){e.state='hidden';e.t=rand(1.6,2.6)}}
    e.h=Math.max(4,EDEF.sandworm.h*e.rise);e.y=e.gy-e.h;e.anim+=dt*6;
  },
  cactus(e,dt){
    const dx=P.x+P.w/2-(e.x+e.w/2), dy=P.y+P.h/2-(e.y+14);
    if(e.puff>0){e.puff-=dt;if(e.puff<=0){
      const a0=Math.atan2(dy,dx);
      for(const off of [-.28,0,.28]){const a=a0+off;eshots.push({k:'needle',x:e.x+e.w/2,y:e.y+14,vx:Math.cos(a)*320,vy:Math.sin(a)*320,r:6,rot:a,life:2.5})}
      sfx('throwb')}}
    else if(Math.hypot(dx,dy)<460&&!P.dead){e.t-=dt;if(e.t<=0){e.puff=.45;e.t=rand(2,2.6)}}
    e.face=Math.sign(dx)||1;
  },
  mummy(e,dt){
    enemyGravity(e,dt);
    if(e.pile){e.vx=0;e.state='walk';e.pileT-=dt;if(e.pileT<=0){e.pile=false;e.revived=true;e.hp=2;e.flash=.3;burst(e.x+e.w/2,e.y+e.h/2,12,'#e8dcc0',180);sfx('roar')}return}
    const dx=P.x+P.w/2-(e.x+e.w/2), adx=Math.abs(dx), dy=P.y+P.h-(e.y+e.h);
    e.cd-=dt; if(e.squash>0) e.squash-=dt;
    if(e.state==='crouch'){e.vx=0;e.t-=dt;if(e.t<=0){e.state='leap';e.vy=-640;e.vx=clamp(dx/.62,-340,340);e.onGround=false;sfx('jump')}}
    else if(e.state==='leap'){if(e.onGround){e.state='walk';e.cd=rand(1,1.6);e.squash=.12;dust(e.x+e.w/2,e.y+e.h,6)}}
    else{
      const sp=e.revived?150:120;
      if(adx<560&&!P.dead){
        e.face=Math.sign(dx)||e.face; let mv=adx>16?e.face:0;
        if(mv&&e.onGround&&(e.hitWall||!groundAhead(e,mv))){
          // hop over walls and small gaps towards the player
          if(e.hitWall||groundAhead(e,mv,TS*3.5)){e.vy=-620;e.vx=mv*210;e.onGround=false;e.state='leap'}else mv=0;
        }
        if(e.state!=='leap') e.vx=mv*sp;
        if(e.state!=='leap'&&e.onGround&&e.cd<=0&&adx>90&&adx<330&&Math.abs(dy)<130){e.state='crouch';e.t=.28;e.vx=0}
      }else patrol(e,40);
    }
    e.anim+=Math.abs(e.vx)*dt/10;
  },
  scarab(e,dt){
    enemyGravity(e,dt);
    const dx=P.x+P.w/2-(e.x+e.w/2), adx=Math.abs(dx), dy=P.y+P.h-(e.y+e.h);
    if(e.state==='flipped'){e.vx=0;e.t-=dt;if(e.t<=0){e.state='walk';e.flipped=false;e.vy=-250;e.cd=.8}}
    else if(e.state==='wind'){e.vx=0;e.t-=dt;if(e.t<=0){e.state='roll';e.t=2;sfx('dash')}}
    else if(e.state==='roll'){
      e.vx=e.face*330;e.t-=dt;if(Math.random()<.3)dust(e.x+e.w/2,e.y+e.h,1,-e.face);
      if(e.hitWall||!groundAhead(e,e.face)||e.t<=0){e.state='walk';e.cd=1.2;e.vx=-e.face*120;e.vy=-200;shake(.05,2)}
    }else{
      e.cd-=dt;patrol(e,40);
      if(adx<520&&Math.abs(dy)<50&&e.cd<=0&&!P.dead){e.face=Math.sign(dx)||e.face;e.dir=e.face;e.state='wind';e.t=.5}
    }
    e.anim+=Math.abs(e.vx)*dt/(e.state==='roll'?14:8);
  },
  // piranha: patrols its pool under the surface, leaps out at the player, dies if it ends up on dry land
  piranha(e,dt){
    e.anim+=dt*10;e.cd-=dt;
    const pcx=P.x+P.w/2, dx=pcx-(e.x+e.w/2), adx=Math.abs(dx);
    const inWater=()=>tile(Math.floor((e.x+e.w/2)/TS),Math.floor((e.y+e.h/2)/TS))===T_WATER;
    if(e.state==='swim'||e.state==='dive'){
      const top=e.surf+12, bot=e.bot-e.h-4;
      if(e.state==='swim'){
        if(e.x<=e.x0+1)e.dir=1;if(e.x+e.w>=e.x1-1)e.dir=-1;
        e.vx=approach(e.vx,e.dir*70,220*dt);e.face=e.dir;
        e.y+=((top+bot)/2+Math.sin(time*2+e.ph)*(bot-top)/2-e.y)*Math.min(1,dt*3);
        if(!P.dead&&e.cd<=0&&adx<280&&P.y+P.h<e.surf+20&&P.y+P.h>e.surf-340){e.state='dive';e.t=.4;e.face=Math.sign(dx)||e.face}
      }else{
        e.vx=approach(e.vx,0,400*dt);e.y=approach(e.y,bot,220*dt);e.t-=dt;
        if(e.t<=0){const h=clamp(e.surf-(P.y+P.h/2)+60,140,340),vy=Math.min(1000,Math.sqrt(2*G*(h+e.y-e.surf))),T=2*vy/G;
          e.vy=-vy;e.vx=clamp(dx/T*1.15,-280,280);e.face=Math.sign(e.vx)||e.face;e.state='leap';e.cd=rand(1.8,3);sfx('splash');splash(e.x+e.w/2,e.surf)}
      }
      e.x=clamp(e.x+e.vx*dt,e.x0,e.x1-e.w);
    }else{
      e.vy=Math.min(e.vy+G*dt,1000);moveBody(e,dt);
      if(e.vy>0&&inWater()){e.state='swim';e.vy=0;e.vx*=.3;splash(e.x+e.w/2,e.y);sfx('splash');fishRange(e);e.cd=Math.max(e.cd,1)}
      else if(e.state==='leap'){e.face=Math.sign(e.vx)||e.face;if(e.onGround){e.state='flop';e.t=1.4;e.vx=0}}
      else{ // stranded: flops about and quickly dies
        e.t-=dt;
        if(e.onGround){e.vx=0;if(Math.random()<dt*5){e.vy=-rand(160,280);e.vx=rand(-70,70);e.onGround=false}}
        if(e.t<=0){e.dead=true;burst(e.x+e.w/2,e.y+e.h/2,12,'#d8503a',180);sfx('hit')}
      }
    }
  },
  // lizardman swordsman: patrols, charges with a sword thrust, jumps up to platforms and over gaps
  lizSword(e,dt){
    enemyGravity(e,dt);
    const dx=P.x+P.w/2-(e.x+e.w/2), adx=Math.abs(dx), dy=P.y+P.h-(e.y+e.h);
    e.cd-=dt;
    switch(e.state){
      case 'wind': e.vx=0;e.t-=dt;if(e.t<=0){e.state='charge';e.t=.6;sfx('dash')}break;
      case 'charge': e.t-=dt;e.vx=e.face*470;if(Math.random()<.4)dust(e.x+e.w/2-e.face*10,e.y+e.h,1,-e.face);
        if(e.hitWall||!e.onGround||!groundAhead(e,e.face,TS*.35)||e.t<=0){e.state='recover';e.t=.55;e.vx=0}break;
      case 'recover': e.vx=approach(e.vx,0,1400*dt);e.t-=dt;if(e.t<=0){e.state='idle';e.cd=rand(.5,1)}break;
      case 'jwind': e.vx=0;e.t-=dt;if(e.t<=0){e.vy=-e.jv;e.vx=e.jvx;e.onGround=false;e.state='jump';sfx('jump');dust(e.x+e.w/2,e.y+e.h,4)}break;
      case 'jump': if(e.onGround){e.state='recover';e.t=.3;e.vx=0;dust(e.x+e.w/2,e.y+e.h,5)}break;
      default:{
        const engaged=!P.dead&&adx<400&&Math.abs(dy)<280&&onScreenE(e);
        if(!engaged){patrol(e,50);break}
        e.face=Math.sign(dx)||e.face;
        if(Math.abs(dy)<40){ // same level: close in, then charge
          if(adx<330&&e.cd<=0&&groundAhead(e,e.face,TS*.35)){e.state='wind';e.t=.45;e.vx=0;break}
          let mv=adx>60?e.face:0;
          if(mv&&e.onGround&&!groundAhead(e,mv)){
            if(e.cd<=0&&groundAhead(e,mv,TS*3.2)){e.jv=620;e.jvx=mv*190;e.state='jwind';e.t=.18;e.cd=1;break}
            mv=0}
          e.vx=mv*90;
        }else if(dy<-50&&adx<260&&e.cd<=0&&e.onGround){ // player above: leap up after her
          const vy=Math.min(930,Math.sqrt(2*G*(-dy+45))), tf=vy/G*1.3;
          e.jv=vy;e.jvx=clamp(dx/tf,-260,260);e.state='jwind';e.t=.22;e.cd=1.5;e.vx=0;
        }else if(dy>50) e.vx=adx>24?e.face*110:0; // player below: step off the edge
        else e.vx=approach(e.vx,0,900*dt);
      }
    }
    e.anim+=Math.abs(e.vx)*dt/10;
  },
  // lizardman mage: keeps its distance and fires a fast orb in a straight line
  lizMage(e,dt){
    enemyGravity(e,dt);
    const pcx=P.x+P.w/2, pcy=P.y+P.h/2, dx=pcx-(e.x+e.w/2), adx=Math.abs(dx);
    e.cd-=dt; if(e.recoil>0) e.recoil-=dt;
    if(e.state==='cast'){e.vx=0;e.t-=dt;
      if(e.t<=0){const ox=e.x+e.w/2+e.face*40, oy=e.y+e.h-66, l=Math.hypot(pcx-ox,pcy-oy)||1;
        eshots.push({k:'orb',x:ox,y:oy,vx:(pcx-ox)/l*540,vy:(pcy-oy)/l*540,r:10,life:2.6});
        sfx('shoot');e.state='idle';e.cd=rand(1.8,2.6);e.recoil=.2}}
    else{
      const sees=!P.dead&&onScreenE(e)&&Math.hypot(dx,pcy-e.y)<660;
      if(sees){e.face=Math.sign(dx)||e.face;
        let mv=adx<150?-e.face:0;if(mv&&!groundAhead(e,mv))mv=0;
        e.vx=approach(e.vx,mv*80,600*dt);
        if(e.cd<=0){e.state='cast';e.t=.65;e.vx=0}
      }else patrol(e,35);
    }
    e.anim+=Math.abs(e.vx)*dt/10;
  },
  // lizardman commander: slow, armoured, huge axe swing; knock the helmet off with a stomp, then hit the head
  lizChief(e,dt){
    enemyGravity(e,dt);
    const ridden=e.guard>0&&P.ride===e.arm&&P.onGround&&!P.dead;
    if(e.guard>0){if(ridden)e.guard=CHIEF_GUARD;else{e.guard-=dt;if(e.guard<=0)e.guard=0}}   // standing on the arm keeps it up
    const cx=e.x+e.w/2, dx=P.x+P.w/2-cx, adx=Math.abs(dx), dy=P.y+P.h-(e.y+e.h), want=Math.sign(dx)||e.face;
    e.cd-=dt;e.jcd-=dt;e.tcd-=dt;
    if(e.axeOut&&eshots.indexOf(e.axe)<0) e.axeOut=false;   // the axe got cleared (e.g. on respawn): back in hand
    switch(e.state){
      case 'stun': e.vx=approach(e.vx,0,900*dt);e.t-=dt;if(e.t<=0){e.state='idle';e.cd=.3}break;
      case 'wind': e.vx=0;e.t-=dt;if(e.t<=0){e.state='swing';e.t=.28;sfx('dash')}break;
      case 'swing': e.t-=dt;if(e.t<=0){e.state='recover';e.t=.75;shake(.18,6);sfx('boom');dust(cx+e.face*110,e.y+e.h,10)}break;
      case 'recover': e.vx=approach(e.vx,0,900*dt);e.t-=dt;if(e.t<=0){e.state='idle';e.cd=rand(.7,1.2)}break;
      // axe throw: the axe spins out towards the player and comes back like a boomerang
      case 'throwWind': e.vx=0;e.t-=dt;
        if(e.t<=0){const sx=cx+e.face*20,sy=e.y+20,tx=P.x+P.w/2,ty=P.y+P.h/2,d=Math.hypot(tx-sx,ty-sy)||1;
          e.axe={k:'axe',owner:e,x:sx,y:sy,sx,sy,ux:(tx-sx)/d,uy:(ty-sy)/d,D:Math.min(d+60,460),t:0,phase:'out',r:26,rot:0,spin:e.face,life:4};
          eshots.push(e.axe);e.axeOut=true;e.state='idle';e.cd=.4;sfx('dash');sfx('throwb')}break;
      // rare leap to another platform, crushing the ground where he lands
      case 'jwind': e.vx=0;e.t-=dt;if(e.t<=0){e.vy=-e.jv;e.vx=e.jvx;e.onGround=false;e.state='jump';sfx('jump');dust(cx,e.y+e.h,8)}break;
      case 'jump': if(e.onGround&&e.vy>=0){e.state='recover';e.t=.6;e.vx=0;chiefSlam(e)}break;
      default:{
        const engaged=!P.dead&&adx<560&&Math.abs(dy)<300&&onScreenE(e);
        if(ridden){e.turnT=0;e.vx=approach(e.vx,0,300*dt);break}   // someone stands on his arm: he holds still and waits
        if(!engaged){e.turnT=0;patrol(e,28);break}
        if(want!==e.face&&adx>10){e.turnT+=dt;if(e.turnT>.45){e.face=want;e.turnT=0}}else e.turnT=0;
        if(!e.guard&&e.jcd<=0&&e.onGround&&P.onGround&&Math.abs(dy)>50&&dy>-280&&adx<420){
          const up=Math.max(0,-dy), H=up+90, vy=Math.min(1150,Math.sqrt(2*G*H)), Ha=vy*vy/(2*G);
          const T=vy/G+Math.sqrt(2*Math.max(10,Ha-(-dy))/G);
          e.jv=vy;e.jvx=clamp(dx/T,-420,420);e.face=want;e.state='jwind';e.t=.55;e.vx=0;e.jcd=rand(7,10);break}
        if(Math.abs(dy)>150){e.vx=approach(e.vx,0,300*dt);break}
        if(e.axeOut){let mv=adx>80?e.face:0;if(mv&&!groundAhead(e,mv))mv=0;e.vx=approach(e.vx,mv*30,300*dt);break}   // empty-handed: waits for the axe
        if(e.tcd<=0&&adx>210&&adx<520&&want===e.face&&e.onGround){e.state='throwWind';e.t=.7;e.vx=0;e.tcd=rand(3.5,5);break}
        let mv=adx>110&&want===e.face?e.face:0;if(mv&&!groundAhead(e,mv))mv=0;
        e.vx=approach(e.vx,mv*46,300*dt);
        if(adx<170&&Math.abs(dy)<110&&e.cd<=0&&want===e.face){e.state='wind';e.t=.8;e.vx=0}
      }
    }
    e.anim+=Math.abs(e.vx)*dt/14;
    if(e.guard>0) chiefArm(e);
  },
  // goblin in a totem mask: sits in a bush (only its glowing eyes give it away), leaps out to shoot a blowgun dart in a straight line
  maskGob(e,dt){
    const pcx=P.x+P.w/2, pcy=P.y+P.h/2, cx=e.x+e.w/2, dx=pcx-cx, adx=Math.abs(dx), dy=P.y+P.h-e.by;
    e.cd-=dt;e.blink-=dt;if(e.blink<-.14)e.blink=rand(1.5,4);
    const fire=()=>{const ox=cx+e.face*18,oy=e.y+15,l=Math.hypot(pcx-ox,pcy-oy)||1;
      eshots.push({k:'dart',x:ox,y:oy,vx:(pcx-ox)/l*560,vy:(pcy-oy)/l*560,r:6,life:1.8});sfx('shoot');e.puff=.2};
    if(e.puff>0)e.puff-=dt;
    switch(e.state){
      case 'hide': e.x=e.bx-e.w/2;e.y=e.by-e.h;e.vx=e.vy=0;
        if(!P.dead&&e.cd<=0&&adx<500&&adx>40&&dy<60&&dy>-260&&onScreenE(e)) maskPop(e);
        break;
      case 'leap': enemyGravity(e,dt);e.face=Math.sign(dx)||e.face;
        if(!e.shot&&e.vy>-90){e.shot=true;fire()}
        if(e.onGround&&e.vy>=0){e.state='out';e.t=rand(1.1,1.6);e.stay=rand(2.2,3);dust(cx,e.y+e.h,4)}
        break;
      case 'out': enemyGravity(e,dt);e.face=Math.sign(dx)||e.face;e.vx=approach(e.vx,0,600*dt);e.t-=dt;e.stay-=dt;
        if(e.t<=0&&!P.dead&&adx<560){e.state='aim';e.t=.4}
        else if(e.stay<=0&&e.onGround&&Math.abs(e.y+e.h-e.by)<8){e.state='back';e.vy=-380;e.vx=clamp((e.bx-cx)/.4,-240,240);e.onGround=false}
        break;
      case 'aim': enemyGravity(e,dt);e.vx=0;e.face=Math.sign(dx)||e.face;e.t-=dt;if(e.t<=0){fire();e.state='out';e.t=rand(1.3,1.9)}break;
      case 'back': enemyGravity(e,dt);
        if(e.onGround&&e.vy>=0){if(Math.abs(cx-e.bx)<22){e.state='hide';e.cd=rand(1.8,3);leafBurst(e.bx,e.by-20,8)}else{e.state='out';e.t=.6;e.stay=1.5}}
        break;
    }
    e.anim+=Math.abs(e.vx)*dt/9;
  },
  // swamp mosquito: hovers, locks on (dashed line), then dives straight; a miss sticks its nose in the wood for a while
  mosquito(e,dt){
    e.anim+=dt;e.cd-=dt;
    const cx=e.x+e.w/2,cy=e.y+e.h/2,pcx=P.x+P.w/2,pcy=P.y+P.h/2,dx=pcx-cx,dy=pcy-cy;
    switch(e.state){
      case 'aim': e.t-=dt;e.x+=rand(-1.5,1.5);if(e.t>.25){e.tx=pcx;e.ty=pcy}e.face=Math.sign(e.tx-cx)||e.face;
        if(e.t<=0){const l=Math.hypot(e.tx-cx,e.ty-cy)||1;e.vx=(e.tx-cx)/l*620;e.vy=(e.ty-cy)/l*620;e.state='dive';e.t=1.1;sfx('dash')}break;
      case 'dive':{e.t-=dt;e.x+=e.vx*dt;e.y+=e.vy*dt;
        const nx=cx+e.vx*dt+Math.sign(e.vx)*18,ny=cy+e.vy*dt+6,c=Math.floor(nx/TS),r=Math.floor(ny/TS),t=tile(c,r);
        if(isSolidT(t)||(t===T_PLANK&&e.vy>0&&ny-r*TS<14)){e.state='stuck';e.t=1.8;sfx('clang');dust(nx,ny,4);break}
        if(t===T_WATER){e.state='back';splash(cx,cy);sfx('splash');break}
        if(e.t<=0)e.state='back';break}
      case 'stuck': e.t-=dt;if(e.t<=0){e.state='back';e.cd=1}break;
      case 'back':{const hx=e.hx+e.w/2,hy=e.hy+e.h/2,ddx=hx-cx,ddy=hy-cy,d=Math.hypot(ddx,ddy)||1;
        e.x+=ddx/d*Math.min(d,200*dt);e.y+=ddy/d*Math.min(d,200*dt);e.face=Math.sign(ddx)||e.face;
        if(d<8){e.state='idle';e.cd=rand(1.2,2.2)}break}
      default:
        e.x+=(e.hx+Math.sin(time*1.3+e.ph)*46-e.x)*Math.min(1,dt*2);e.y+=(e.hy+Math.cos(time*1.9+e.ph)*22-e.y)*Math.min(1,dt*2);
        e.face=Math.sign(dx)||e.face;
        if(!P.dead&&e.cd<=0&&Math.hypot(dx,dy)<400&&onScreenE(e)){e.state='aim';e.t=.75;e.tx=pcx;e.ty=pcy;sfx('buzz')}
    }
  },
  // tree spider: waits under a branch and drops on its thread when you walk below, then climbs back up
  spider(e,dt){
    e.anim+=dt;e.cd-=dt;const cx=e.x+e.w/2,dx=P.x+P.w/2-cx,top=e.ay+4;
    switch(e.state){
      case 'drop': e.y=Math.min(e.ty,e.y+760*dt);if(e.y>=e.ty){e.state='hang';e.t=1.1;dust(cx,e.y+e.h,2)}break;
      case 'hang': e.t-=dt;e.y=e.ty+Math.sin(time*9)*3;if(e.t<=0)e.state='climb';break;
      case 'climb': e.y=Math.max(top,e.y-150*dt);if(e.y<=top){e.state='idle';e.cd=1.2}break;
      default: e.y=top+Math.sin(time*2+e.ph)*3;
        if(!P.dead&&e.cd<=0&&Math.abs(dx)<70&&P.y>e.ay&&P.y<e.maxY+e.h+60){e.ty=clamp(P.y+P.h*.35-e.h/2,top+30,e.maxY);e.state='drop';sfx('creak')}
    }
  },
  // tongue toad: hops towards you in big arcs and lashes out with a long sticky tongue at close range
  frog(e,dt){
    enemyGravity(e,dt);
    const cx=e.x+e.w/2,dx=P.x+P.w/2-cx,adx=Math.abs(dx),dy=P.y+P.h-(e.y+e.h);
    e.cd-=dt;e.anim+=dt;
    switch(e.state){
      case 'tongueWind': e.vx=0;e.t-=dt;   // warning: the throat swells, a mark shows how far the tongue will reach
        if(e.t<=0){e.state='tongue';e.t=.62;e.tl=0;sfx('lick')}break;
      case 'tongue': e.vx=0;e.t-=dt;{const k=.62-e.t;e.tl=k<.2?k/.2*175:k<.34?175:Math.max(0,175*(1-(k-.34)/.2))}
        if(e.t<=0){e.state='idle';e.cd=rand(.9,1.4);e.tl=0}break;
      case 'hop': if(e.onGround&&e.vy>=0){e.state='idle';e.vx=0;dust(cx,e.y+e.h,4)}break;
      default:{
        if(e.onGround)e.vx=approach(e.vx,0,900*dt);
        const engaged=!P.dead&&adx<480&&Math.abs(dy)<220&&onScreenE(e);
        if(engaged){e.face=Math.sign(dx)||e.face;
          if(adx<185&&Math.abs(dy)<46&&e.cd<=0&&e.onGround){e.state='tongueWind';e.t=FROG_WIND;e.tl=0;break}
          if(e.cd<=0&&e.onGround&&adx>120){const safe=groundAhead(e,e.face,TS*3)||dy>40;
            if(safe){e.vy=dy<-40?-760:-540;e.vx=e.face*170;e.onGround=false;e.state='hop';e.cd=rand(.9,1.5);sfx('jump')}else e.cd=.5}}
        else if(e.cd<=0&&e.onGround){if(!groundAhead(e,e.dir,TS*2.5))e.dir*=-1;e.face=e.dir;e.vy=-420;e.vx=e.dir*110;e.onGround=false;e.state='hop';e.cd=rand(2,3.5)}
      }
    }
  },
  // lizardman hut on a long bough: lizardmen come out while you are near; break it to stop them
  lizHut(e,dt){
    if(e.door>0)e.door-=dt;e.cd-=dt;
    e.kids=e.kids.filter(k=>!k.dead);
    const dx=P.x+P.w/2-(e.x+e.w/2);
    if(!P.dead&&e.made<3&&e.kids.length<2&&e.cd<=0&&Math.abs(dx)<600&&Math.abs(P.y-e.y)<320&&onScreenE(e)){
      const k=makeEnemy(Math.random()<.65?'lizSword':'lizMage',Math.floor((e.x+e.w/2)/TS),{y:e.y+e.h});
      if(k){k.x=e.x+e.w/2-k.w/2;k.face=k.dir=Math.sign(dx)||1;k.cd=.8;enemies.push(k);e.kids.push(k);e.made++;e.door=.9;sfx('creak');dust(e.x+e.w/2,e.y+e.h,5)}
      e.cd=rand(4,6)}
  },
  barrel(e,dt){enemyGravity(e,dt);e.vx=0},
  crate(e,dt){enemyGravity(e,dt);e.vx=0},
  pot(e,dt){enemyGravity(e,dt);e.vx=0},
};
