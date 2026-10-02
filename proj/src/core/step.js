function camTargetY(){
  if(WH<=VH||!P) return 0;
  if(arenaLocked&&!bossDead&&B&&BOSSES[B.kind].camBottom) return Math.max(0,WH-VH/camZ);   // boss def camBottom: the whole hall stays in view
  const vh=VH/camZ, bot=CAM_BOT&&P.x+P.w<ARENA_L-2*TS&&!arenaLocked?CAM_BOT:WH;
  return clamp(P.y+P.h/2-vh*.55+(P.vy>450?70:0),0,Math.max(0,bot-vh));
}
const onScreenE=e=>e.x+e.w>camX&&e.x<camX+VW&&e.y+e.h>camY&&e.y<camY+VH;
function step(dt){
  if(hitstop>0){hitstop-=dt;return}
  time+=dt; if(!P.entering) runTime+=dt;
  if(shakeT>0) shakeT-=dt; else shakeM=0;
  updatePlats(dt);
  updatePlayer(dt);
  if(springs.length) springCheck(dt);
  const pb={x:P.x+3,y:P.y+6,w:P.w-6,h:P.h-6};
  for(const e of enemies){ if(e.dead) continue; if(e.flash>0)e.flash-=dt;
    if(Math.abs(e.x-P.x)>VW*1.3||Math.abs(e.y-P.y)>VH*1.3) continue;
    EUPD[e.type](e,dt);
    if(P.dead||e.dead) continue;
    if(e.prop&&e.type!=='lizHut'&&P.dashT>0&&overlap(e,pb)){damageEnemy(e,9,P.x+P.w/2);continue}   // a dash smashes boxes
    const ct=contactInfo(e);
    let stomped=false;
    if(ct.stomp&&P.vy>0&&P.prevBottom<=ct.stomp.y+12&&P.hurtT<=0&&overlap(ct.stomp,pb)){doStomp(e,ct);stomped=true}
    if(!stomped) for(const hb of ct.hurt) if(overlap(hb,pb)){hurt(hb.x+hb.w/2);break}
  }
  enemies=enemies.filter(e=>!e.dead);
  if(!arenaLocked&&!bossDead&&!P.dead&&P.onGround&&P.x>ARENA_L&&P.y>ARENA_TRIG_Y&&bossOnScreen()){
    arenaLocked=true;playSong(B.kind);B.state='intro';B.t=BOSSES[B.kind].introT||1.8;shake(.8,6);sfx('roar');
  }
  updateBoss(dt);
  if(!P.dead&&bossContact(pb)) hurt(B.x+B.w/2);
  if(LV().update) LV().update(dt);   // per-level effects: rising poison, falling snow...
  updateShots(dt);
  updateWaves(dt);
  updateItems(dt);
  updateParts(dt);
  {const n=P.dead||P.entering?null:shops.find(sh=>P.onGround&&Math.abs(P.x+P.w/2-sh.x)<60&&Math.abs(P.y+P.h-sh.y)<6)||null;
   if(n!==nearShop){nearShop=n;document.body.classList.toggle('near-shop',!!n)}
   if(shopEdge&&nearShop){shopEdge=false;openShop();return}
   shopEdge=false;}
  // camera: horizontal follow; vertical follow only in tall levels (locked to the bottom screen in the hydra arena)
  {const fight=arenaLocked&&!bossDead&&B&&B.kind==='hydra', wz=fight?Math.min(1,VW/(ARENA_R-ARENA_L+TS)):1;
   camZ=approach(camZ,wz,dt*.8);   // zoom out if the screen is too narrow to show the whole hydra arena
   const ty=camTargetY();camY+=(ty-camY)*Math.min(1,dt*6);camY=clamp(camY,0,Math.max(0,WH-VH/camZ))}
  const vw=VW/camZ;
  let minX=0,maxX=COLS*TS-vw;
  if(arenaLocked&&!bossDead){minX=ARENA_L-TS;maxX=ARENA_R-vw;if(maxX<minX){minX=maxX=(ARENA_L-TS+ARENA_R-vw)/2}}
  maxX=Math.min(maxX,ARENA_R+TS-vw);
  if(arenaLocked&&!bossDead&&B.kind==='hydra') minX=maxX=(ARENA_L+ARENA_R-vw)/2;   // the whole hydra arena on one screen
  const target=clamp(P.x+P.w/2-vw/2+P.face*70,minX,Math.max(minX,maxX));
  camX+=(target-camX)*Math.min(1,dt*7);
  camX=clamp(camX,minX,Math.max(minX,maxX));
}
