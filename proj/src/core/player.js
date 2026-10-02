/* ---------- player ---------- */
function newPlayer(x,y){return{x,y,w:30,h:58,vx:0,vy:0,face:1,onGround:true,coyote:0,buffer:0,hp:3,maxhp:3,inv:0,hurtT:0,lockT:0,
  shootCD:0,atkT:0,turnT:0,landT:0,airT:0,drop:0,ride:null,runPh:0,power:0,pickT:-1,dead:false,deadT:0,fell:false,entering:false,enterT:0,alpha:1,prevBottom:0,jumpT:1,
  dashT:0,dashCD:0,airDash:true,dashDir:1,ghostT:0,peakY:0,heavyT:0,punchT:0,punchHit:null,inWater:false,flowV:0,windV:0,inSand:false,sandCD:0}}
const powerCap=()=>hasBag?3:2;
const airDashMax=()=>hasCloak?2:1;
function shoot(){
  const p=P;
  if(!p.power){p.shootCD=.34;p.punchT=PUNCH_T;p.punchHit=new Set();sfx('punch');
    pwaves.push({delay:PUNCH_T-PUNCH_ACTIVE[0],face:p.face,x:0,y:0,vx:0,life:WAVE_LIFE,hit:p.punchHit});return}
  p.shootCD=.44; if(p.onGround)p.atkT=.2;
  const x=p.x+p.w/2+p.face*16, y=p.y+20;
  const dmg=DMG_SHROOM*(p.power>=3?TRIPLE_PENALTY:1);
  const mk=vy=>shots.push({x,y,vx:p.face*580+p.vx*.35,vy,r:p.power>1?10:9,life:1.6,b:0,dmg,red:p.power>1,gold:p.power>=3,rot:0});
  if(p.power>=3){mk(-60);mk(-320);mk(-580)} else if(p.power===2){mk(-140);mk(-460)} else mk(-80);
  sfx('shoot');
}
function hurt(srcX){
  const p=P; if(p.inv>0||p.dead||p.entering||p.dashT>0) return;
  if(p.power){p.power--;stars(p.x+p.w/2,p.y,10);floater(p.x+p.w/2,p.y-20,T('fPowerLost'))}
  else p.hp--;
  p.inv=1.4;p.hurtT=.35;p.vx=(p.x+p.w/2<srcX?-1:1)*280;p.vy=-400;p.onGround=false;p.ride=null;p.heavyT=0;
  shake(.25,7);sfx('hurt');hitstop=.06;
  if(p.hp<=0) kill(false);
}
function kill(fell){
  const p=P; if(p.dead) return;
  p.dead=true;p.deadT=0;p.fell=fell;p.hp=0;p.vx=0;p.power=0;
  if(!fell) p.vy=-300;
  shake(.3,8);sfx('hurt');
}
function respawn(){
  const keepMax=P.maxhp;
  P=newPlayer(cp.x,cp.y); P.maxhp=keepMax; P.hp=keepMax; P.inv=1.2;
  eshots=[];pwaves=[];
  // every foe comes back as it was at the start of the level: the killed ones return, the wounded ones heal.
  // Breakable boxes and huts stay as they are; whatever a foe spawned (slime kids, hut lizards) goes away.
  for(const e of enemies) if(!e.prop) e.dead=true;
  enemies=enemies.filter(e=>e.prop&&!e.dead).concat(structuredClone(enemySnap));
  for(const [x,y] of powerSpots) if(!items.some(i=>i.k==='power'&&i.x===x)) items.push({k:'power',x,y,ph:0});
  if(arenaLocked&&!bossDead){arenaLocked=false;playSong('level');B=makeBoss();skyHeat=0}
  camZ=1;camX=clamp(P.x-VW/2,0,COLS*TS-VW);camY=camTargetY();
}
function standingOnOneway(){
  const p=P; if(p.ride) return true;
  const r=Math.floor((p.y+p.h+1)/TS), c0=Math.floor(p.x/TS), c1=Math.floor((p.x+p.w-.01)/TS);
  let one=false; for(let c=c0;c<=c1;c++){const t=tile(c,r); if(isSolidT(t)) return false; if(t===T_PLANK) one=true}
  return one;
}
// shield check: orcs block hits that come from the side they are facing
function shieldBlocks(e,srcX){return e.type==='orc'&&!e.dead&&Math.sign(srcX-(e.x+e.w/2))===e.face}
function attackEnemy(e,dmg,srcX,fx,fy,test){
  if(e.type==='maskGob'&&e.state==='hide'){maskPop(e);return true}   // a hit on the bush flushes the goblin out
  if(shieldBlocks(e,srcX)){clang(fx,fy);e.flash=0;return false}
  const H=ENEMY_HOOKS[e.type];
  if(H&&H.blocks&&H.blocks(e,srcX)){clang(fx,fy);e.flash=0;return false}   // e.g. the ice golem's raised arm
  // the lizard commander's armour stops everything; once the helmet is knocked off, only hits to the head count
  if(e.type==='lizChief'&&(e.helmet||!(test&&test(chiefHead(e))))){clang(fx,fy);e.flash=0;return false}
  const boxes=enemyHurtBoxes(e); if(!boxes.length) return false;
  if(H&&H.onHit) H.onHit(e,srcX);
  damageEnemy(e,dmg*(e.flipped?2:1),srcX); return true;
}
function clang(x,y){sfx('clang');for(let i=0;i<8;i++)parts.push({x,y,vx:rand(-200,200),vy:rand(-260,-40),g:900,c:'#fff3b0',s:rand(2,4),life:rand(.15,.35),max:0,t:'dot'})}
function punchHits(){
  const p=P, box={x:p.face>0?p.x+p.w/2:p.x+p.w/2-52,y:p.y+8,w:52,h:p.h-12};
  const fx=p.x+p.w/2+p.face*40, fy=p.y+p.h/2;
  for(const e of enemies){ if(e.dead||p.punchHit.has(e)) continue;
    if(enemyHurtBoxes(e).some(b=>overlap(box,b))){p.punchHit.add(e);
      if(attackEnemy(e,DMG_PUNCH,p.x+p.w/2,fx,fy,b=>overlap(box,b))){if(!e.dead&&e.type==='slime')e.vx=p.face*220;burst(fx,fy,8,'#fff',180);shake(.06,3);hitstop=Math.max(hitstop,.03)}
      else {p.vx=-p.face*180}}}
  if(!p.punchHit.has(B)&&bossHittable()){const m=bossHitMult(b=>overlap(box,b));if(m){p.punchHit.add(B);hitBoss(DMG_PUNCH*m,fx,fy);shake(.06,3)}}
  for(const b of eshots) if(b.k==='banana'||b.k==='needle'||b.k==='fireball'||b.k==='arrow'||b.k==='orb'||b.k==='acid'||b.k==='dart'||(SHOTS[b.k]&&SHOTS[b.k].deflect)) if(!b.dead&&circleBox(b.x,b.y,b.r,box)){b.dead=true;burst(b.x,b.y,8,'#ffd84a',160);sfx('hit')}
}
function updateWaves(dt){
  for(const w of pwaves){
    if(w.delay>0){ w.delay-=dt;
      if(w.delay<=0){ if(P.dead||P.punchT<=0){w.life=0;continue}
        w.face=P.face; w.x=P.x+P.w/2+w.face*34; w.y=P.y+P.h/2; w.vx=w.face*WAVE_SPEED+P.vx*.4 }
      continue }
    w.life-=dt; w.x+=w.vx*dt;
    {const wc=Math.floor((w.x+w.face*10)/TS),wr=Math.floor(w.y/TS);if(solid(wc,wr)){breakWall(wc,wr);w.life=0;burst(w.x,w.y,6,'#fff',140);continue}}
    const box={x:w.x-16,y:w.y-24,w:32,h:48};
    for(const e of enemies){ if(e.dead||w.hit.has(e)) continue;
      if(enemyHurtBoxes(e).some(b=>overlap(box,b))){w.hit.add(e);
        if(attackEnemy(e,DMG_PUNCH,w.x-w.face*20,w.x,w.y,b=>overlap(box,b))){if(!e.dead&&e.type==='slime')e.vx=w.face*200;burst(w.x,w.y,8,'#fff',180);hitstop=Math.max(hitstop,.025)} else w.life=0}}
    if(w.life>0&&!w.hit.has(B)&&bossHittable()){const m=bossHitMult(b=>overlap(box,b));if(m){w.hit.add(B);hitBoss(DMG_PUNCH*m,w.x,w.y)}}
    for(const b of eshots) if((b.k==='banana'||b.k==='needle'||b.k==='fireball'||b.k==='arrow'||b.k==='orb'||b.k==='acid'||b.k==='dart'||(SHOTS[b.k]&&SHOTS[b.k].deflect))&&!b.dead&&circleBox(b.x,b.y,b.r,box)){b.dead=true;burst(b.x,b.y,8,'#ffd84a',160);sfx('hit')}
  }
  pwaves=pwaves.filter(w=>w.life>0);
}
// heavy landing on cracked floor breaks it and drops the player into the hidden chamber
function breakFloor(c,r){
  const stack=[c];let n=0;
  for(let d=-4;d<=4;d++) if(tile(c+d,r)===T_CRACK){grid[r][c+d]=T_EMPTY;n++;
    const x=(c+d)*TS+TS/2,y=r*TS+TS/2;burst(x,y,10,LV().debris||(BIOME==='desert'?'#c99a55':'#7a4b2b'),260,1200,[4,8]);dust(x,y,3)}
  if(n){sfx('crack');shake(.35,10)}
  return n>0;
}
// cracked walls break from a dash, a punch wave or a thrown mushroom
function breakWall(c,r){
  if(tile(c,r)!==T_CRACKW){hitSwitch(c,r);return false}
  const st=[[c,r]];let n=0;
  while(st.length){const [cc,rr]=st.pop();if(tile(cc,rr)!==T_CRACKW)continue;grid[rr][cc]=T_EMPTY;flow[rr][cc]=9;n++;
    const x=cc*TS+TS/2,y=rr*TS+TS/2;burst(x,y,10,LV().debris||(BIOME==='desert'?'#c99a55':'#7a4b2b'),260,1200,[4,8]);dust(x,y,3);
    st.push([cc+1,rr],[cc-1,rr],[cc,rr+1],[cc,rr-1])}
  sfx('crack');if(LV().breakSfx)sfx(LV().breakSfx);shake(.3,8);return true;
}
// a loose brick (punch, shockwave, mushroom or dash) opens a sealed door somewhere close by
function hitSwitch(c,r){
  const s=switches.find(q=>!q.done&&q.c===c&&q.r===r); if(!s) return false;
  s.done=true;
  for(const [dc,dr] of s.door){grid[dr][dc]=T_EMPTY;flow[dr][dc]=9;const x=dc*TS+TS/2,y=dr*TS+TS/2;burst(x,y,12,'#d8b07a',260,1200,[4,8]);dust(x,y,4)}
  stars(c*TS+TS/2,r*TS+TS/2,6);sfx('crack');sfx('secret');shake(.4,7);return true;
}
// stepping into a fake wall reveals the whole hidden room
function revealFake(c,r){
  const st=[[c,r]];
  while(st.length){const [cc,rr]=st.pop();if(tile(cc,rr)!==T_FAKE||flow[rr][cc]===8)continue;flow[rr][cc]=8;
    st.push([cc+1,rr],[cc-1,rr],[cc,rr+1],[cc,rr-1])}
  sfx('select');
}
function updatePlayer(dt){
  const p=P;
  if(p.dead){
    p.deadT+=dt;
    if(!p.fell){p.vy+=G*dt;moveBody(p,dt)}
    if(p.deadT>1.7) respawn();
    return;
  }
  if(p.entering){
    p.enterT+=dt; p.vx=0; p.x=approach(p.x,door.x+door.w/2-p.w/2,120*dt);
    if(p.enterT>.6) p.alpha=Math.max(0,1-(p.enterT-.6)/.6);
    if(p.enterT>1.5&&state==='play') finishLevel();
    return;
  }
  for(const k of ['inv','hurtT','lockT','shootCD','atkT','turnT','landT','drop','dashCD','heavyT','punchT','bounceT','sandCD','springT']) if(p[k]>0) p[k]-=dt;
  if(p.pickT>=0){p.pickT+=dt; if(p.lockT<=0) p.pickT=-1}
  if(jumpEdge){p.buffer=.13;jumpEdge=false}else p.buffer-=dt;
  const gmul=waterPhys(p);
  {const sy=sandSurf(p),was=p.inSand;p.inSand=sy!==null&&!p.inWater;
   if(p.inSand&&!was&&time>.5){sfx('sand');dust(p.x+p.w/2,sy,8)}}
  const ctl=p.lockT<=0&&p.hurtT<=0;
  const dir=ctl?(inp.r-inp.l):0;
  let maxv=p.inWater?MAXV*.8:p.inSand?MAXV*SAND_SLOW:MAXV;
  let acc=p.onGround?3400:2300, dec=p.onGround?3200:(p.inWater?1600:p.inSand?2600:1000);
  // the level may change grip underfoot (level def: floorControl(p) -> {acc, dec, maxv} or null), e.g. slippery ice
  const fc=p.onGround&&!p.inWater&&LV().floorControl?LV().floorControl(p):null;
  if(fc){acc=fc.acc;dec=fc.dec;maxv*=fc.maxv||1}
  if(p.onGround) p.airDash=airDashMax();
  if(dashEdge&&ctl&&p.dashCD<=0&&p.dashT<=0&&(p.onGround||p.airDash)){
    p.dashDir=dir||p.face; p.face=p.dashDir; p.dashT=DASH_T; p.dashCD=.45; p.ghostT=0; p.vy=0; p.turnT=0;
    if(!p.onGround){p.airDash--;if(hasCloak&&!p.airDash)burst(p.x+p.w/2,p.y+p.h/2,10,'#8a5ac8',200,300,[3,5])}
    dust(p.x+p.w/2,p.y+p.h-4,6,-p.dashDir); sfx('dash'); shake(.05,2);
  }
  dashEdge=false;
  if(p.dashT>0){
    p.dashT-=dt; p.vx=p.dashDir*DASH_V*(p.inWater?.6:p.inSand?.5:1);
    p.ghostT-=dt; if(p.ghostT<=0){p.ghostT=.028;ghosts.push({x:p.x+p.w/2,y:p.y+p.h+2,face:p.face,life:.22,cape:hasCloak})}
    if(p.dashT<=0) p.vx=p.dashDir*MAXV;
  }else if(dir){
    if(p.vx*dir<0) p.vx+=dir*dec*dt;
    p.vx=clamp(p.vx+dir*acc*dt,-maxv,maxv);
    if(dir!==p.face){ if(p.onGround&&Math.abs(p.vx)<200) p.turnT=.08; p.face=dir; if(p.onGround)dust(p.x+p.w/2,p.y+p.h,3,-dir) }
  }else if(p.hurtT<=0||p.onGround) p.vx=approach(p.vx,0,dec*dt);
  if(p.onGround) p.coyote=.1; else p.coyote-=dt;
  if(ctl&&p.buffer>0){
    if(inp.d&&p.onGround&&standingOnOneway()){p.drop=.22;p.buffer=0;p.onGround=false;p.ride=null;p.y+=2}
    else if(p.bounceT>0&&!p.onGround){p.vy=-HIGH_BOUNCE;p.bounceT=0;p.buffer=0;p.jumpT=0;sfx('jump');stars(p.x+p.w/2,p.y+p.h,5)}
    else if(p.coyote>0||p.inWater||(p.inSand&&p.sandCD<=0)){
      if(p.dashT>0){p.dashT=0;p.vx=p.dashDir*MAXV}
      const sandHop=p.inSand&&p.coyote<=0;
      p.vy=p.inWater?-560:sandHop?-SAND_JV:-JV;p.coyote=0;p.buffer=0;p.onGround=false;p.ride=null;p.jumpT=0;
      if(sandHop){p.sandCD=.28;dust(p.x+p.w/2,p.y+p.h-10,7)}
      else if(p.inWater) splash(p.x+p.w/2,p.y+p.h*.5); else dust(p.x+p.w/2,p.y+p.h,5);
      sfx('jump');
    }
  }
  p.jumpT+=dt;
  let g=G*gmul;
  if(!p.inWater){
    if(p.vy<0&&!inp.j&&!(p.springT>0)) g*=2.7;
    else if(Math.abs(p.vy)<150&&inp.j) g*=.55;
    else if(p.vy>0) g*=1.2;
  }
  if(p.dashT>0) p.vy=0; else p.vy=Math.min(p.vy+g*dt,p.inWater?170:1000);
  // umbrella: holding jump while falling turns the fall into a slow glide
  p.glide=hasUmbrella&&ctl&&inp.j&&!p.onGround&&!p.inWater&&!p.inSand&&p.dashT<=0&&p.vy>0&&!(p.springT>0);
  if(p.glide&&p.vy>GLIDE_V) p.vy=approach(p.vy,GLIDE_V,3000*dt);
  if(p.inSand&&p.vy>SAND_SINK) p.vy=SAND_SINK;
  if(ctl&&(shootEdge||inp.s)&&p.shootCD<=0) shoot();
  shootEdge=false;
  if(p.onGround||p.dashT>0||p.inWater||p.inSand||p.glide) p.peakY=p.y; else p.peakY=Math.min(p.peakY,p.y);
  const was=p.onGround, preVy=p.vy;
  p.prevBottom=p.y+p.h;
  moveBody(p,dt);
  p.windV=0;
  if(p.dashT>0&&p.hitWall){
    const wc=p.hitWall>0?Math.floor((p.x+p.w)/TS):Math.floor(p.x/TS)-1;let broke=false;
    for(let r=Math.floor(p.y/TS);r<=Math.floor((p.y+p.h-1)/TS)&&!broke;r++) broke=breakWall(wc,r);
    if(!broke){p.dashT=0;shake(.06,2)}
  }
  if(p.inSand){const sy=sandSurf(p);
    if(Math.abs(p.vx)>40&&Math.random()<.25) dust(p.x+p.w/2,p.y+p.h-6,1,-p.face);
    if(sy!==null&&p.y>sy+2){for(let i=0;i<3;i++)dust(p.x+p.w/2+rand(-14,14),sy,4);sfx('sand');kill(true);return}}
  {const fc=Math.floor((p.x+p.w/2)/TS),fr=Math.floor((p.y+p.h/2)/TS);if(tile(fc,fr)===T_FAKE&&flow[fr][fc]!==8)revealFake(fc,fr)}
  {const cx=p.x+p.w/2,cy=p.y+p.h/2;for(const z of secretZones) if(!z.found&&cx>z.x&&cx<z.x+z.w&&cy>z.y&&cy<z.y+z.h){
    z.found=true;secretsFound++;sfx('secret');stars(cx,cy-20,12);floater(cx,cy-50,T('fSecret'))}}
  if(hiddenPlanks) revealPlanks();
  if(p.punchT<PUNCH_ACTIVE[0]&&p.punchT>PUNCH_ACTIVE[1]) punchHits();
  if(!was&&p.onGround){
    const fallH=p.y-p.peakY;
    if(fallH>HEAVY_H&&p.landTile===T_CRACK&&breakFloor(p.landC,p.landR)){p.onGround=false;p.vy=120}
    else if(fallH>HEAVY_H&&!p.bounced){
      p.heavyT=HEAVY_T;p.lockT=Math.max(p.lockT,HEAVY_T);p.vx*=.25;p.buffer=0;
      dust(p.x+p.w/2,p.y+p.h,14);stars(p.x+p.w/2,p.y+10,4);sfx('land');sfx('hit');shake(.18,6);
    }
    else if(preVy>560){p.landT=.14;dust(p.x+p.w/2,p.y+p.h,9);sfx('land');shake(.08,2)}
    else {p.landT=.07;dust(p.x+p.w/2,p.y+p.h,3)}
  }
  if(p.onGround) p.bounced=false;
  p.airT=p.onGround?0:p.airT+dt;
  if(p.onGround&&Math.abs(p.vx)>20){const before=Math.floor(p.runPh);p.runPh+=Math.abs(p.vx)*dt/34;
    if(Math.floor(p.runPh)!==before&&Math.floor(p.runPh)%2===0) dust(p.x+p.w/2-p.face*8,p.y+p.h,1,-p.face)}
  if(LV().onPlayerMove) LV().onPlayerMove(p,dir);
  if(p.x<0){p.x=0;p.vx=0}
  // invisible wall: once the boss fight starts there is no way back to the ledge
  if(arenaLocked&&!bossDead&&p.x<ARENA_L){p.x=ARENA_L;if(p.vx<0)p.vx=0;if(p.dashT>0)p.dashT=0}
  // thorns
  {const r=Math.floor((p.y+p.h-4)/TS), c0=Math.floor((p.x+4)/TS), c1=Math.floor((p.x+p.w-4)/TS);
   for(let c=c0;c<=c1;c++) if(tile(c,r)===T_THORN&&p.y+p.h>r*TS+16){hurt(p.x+p.w/2-p.face);if(!P.dead){p.vy=-620;p.onGround=false}break}}
  if(p.y>WH+80) kill(true);
  for(const c of checks) if(!c.on&&p.x>c.x-20&&p.onGround&&Math.abs(p.y+p.h-c.y)<8){c.on=true;cp={x:c.x-p.w/2,y:c.y-p.h};sfx('check');stars(c.x,c.y-60,12);floater(c.x,c.y-80,T('fSaved'))}
  if(bossDead&&p.onGround&&p.x+p.w>door.x+18&&p.x<door.x+door.w-18){p.entering=true;p.enterT=0;p.vx=0}
}
