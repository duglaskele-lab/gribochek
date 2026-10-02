/* ---------- bosses: shared ---------- */
// the boss counts as seen once most of its body is inside the camera view
function bossOnScreen(){if(!B)return false;const wide=B.kind==='hydra'?330:0; // the hydra's side heads reach far beyond its body
  return B.x+B.w*.35-wide<camX+VW&&B.x+B.w*.65+wide>camX&&B.y<camY+VH&&B.y+B.h>camY}
function bossHittable(){return B&&['sleep','dead','dying','revive','meteorUp','meteor','meteorDown'].indexOf(B.state)<0}
function hitBoss(dmg,x,y){
  if(!bossHittable()) return;
  if(B.kind==='hydra'){hydraHit(dmg,x,y);return}
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
  eshots=[];skyHeat=0;
  floater(door.x+door.w/2,door.y-30,T('fDoor'));
}
function updateBoss(dt){
  if(!B||B.state==='sleep'||B.state==='dead') return;
  if(B.flash>0) B.flash-=dt;
  BOSSES[B.kind].update(dt);
}
function drawBoss(){if(!B||B.state==='dead')return; BOSSES[B.kind].draw()}

