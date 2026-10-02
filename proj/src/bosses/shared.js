/* ---------- bosses: shared ---------- */
// the fight starts as soon as the player can see the boss: a strip of its sprite (boss def spriteBox(), else its body)
// at least m px wide is inside the camera view. One rule for every boss.
function bossSpriteBox(){const d=BOSSES[B.kind];return d.spriteBox?d.spriteBox():{x:B.x,y:B.y,w:B.w,h:B.h}}
function bossSeen(m=40){
  if(!B) return false;const b=bossSpriteBox(),vw=VW/camZ,vh=VH/camZ;
  return b.x+b.w>camX+m&&b.x<camX+vw-m&&b.y+b.h>camY+m&&b.y<camY+vh-m;
}
function startBossFight(){
  arenaLocked=true;arenaIn=P.x>=ARENA_L;playSong(B.kind);B.state='intro';B.t=BOSSES[B.kind].introT||1.8;   // no crash, no roar
}
function bossHittable(){return B&&['sleep','dead','dying','revive','meteorUp','meteor','meteorDown'].indexOf(B.state)<0}
function hitBoss(dmg,x,y){
  if(!bossHittable()) return;
  if(B.kind==='hydra'){hydraHit(dmg,x,y);return}
  const dm=BOSSES[B.kind].dmgMult; if(dm) dmg*=dm();
  if(BOSSES[B.kind].onHit) BOSSES[B.kind].onHit(x,y);   // boss def onHit(x,y): e.g. the snowman is pushed back a little   // boss def dmgMult(): e.g. tougher while changing phase
  B.hp-=dmg;B.flash=.08;burst(x,y,6,'#fff',150);sfx('hit');
  if(B.kind==='dragon'&&B.phase===1&&B.hp<=B.max/2&&B.hp>EPS&&B.state!=='enrage') dragonEnrage();
  if(B.hp<=EPS){B.hp=0;B.state='dying';B.t=2;B.vx=0;eshots=eshots.filter(s=>s.k==='banana'||s.k==='needle');hitstop=.12;shake(.4,9)}
}
// returns damage multiplier of the part hit (0 = miss)
function bossHitMult(test){
  if(BOSSES[B.kind].hitMult) return BOSSES[B.kind].hitMult(test);
  if(B.kind==='hydra'){for(const h of B.heads)if(!h.dead&&test(hydraHeadBox(h))){B.lastHead=h;return 1}return 0}
  if(B.kind==='croc'){if(test(crocBody()))return 1;if(test(crocTail()))return TAIL_MULT;return 0}
  const h=dragonHeadBox(); if(test(h)) return DRAGON_HEAD_MULT;
  if(test(dragonBody())) return 1; return 0;
}
function bossContact(pb){
  if(!B||['sleep','dead','dying','intro'].indexOf(B.state)>=0) return false;
  if(BOSSES[B.kind].contact) return BOSSES[B.kind].contact(pb);
  if(B.kind==='croc') return overlap(crocBody(),pb)||(B.state==='chomp'&&overlap(crocBite(),pb));
  if(B.kind==='hydra') return false;   // the hydra's body is background scenery
  if(['tired','meteorUp','meteor','meteorDown','enrage'].indexOf(B.state)>=0) return false;
  return overlap(dragonBody(),pb); // the head never hurts on touch
}
function bossDefeated(){
  B.state='dead';bossDead=true;shake(.5,10);sfx('boom');playSong('victory');
  const cx=B.x+B.w/2,cy=B.y+B.h/2;
  burst(cx,cy,50,BOSSES[B.kind].burst,420);stars(cx,cy,20);
  sporeTotal+=10;for(let i=0;i<10;i++) items.push({k:'spore',x:cx+rand(-60,60),y:Math.min(cy,FLOOR-60),ph:0,vy:rand(-600,-300),vx:rand(-160,160),drop:true,bonus:true});
  eshots=[];skyHeat=0;magnetT=.5;   // half a second later the spores fly to the player by themselves
  floater(door.x+door.w/2,door.y-30,T('fDoor'));
}
function updateBoss(dt){
  if(!B||B.state==='sleep'||B.state==='dead') return;
  if(B.flash>0) B.flash-=dt;
  BOSSES[B.kind].update(dt);
}
function drawBoss(){if(!B||B.state==='dead')return; BOSSES[B.kind].draw()}

