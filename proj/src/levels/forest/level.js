/* ---------- level 1: forest ---------- */
// Built by the classic generator (levels/common/generator.js); texts live in ui/i18n.js.
// miniboss: the generator builds a clearing for it in the second half of the level, right after a checkpoint.
registerLevel(1,{biome:'forest',boss:'croc',song:'forest',miniboss:'bigSlime',
  i18n:{ru:{fBigSlime:'огромный слайм проснулся!'},en:{fBigSlime:'the giant slime wakes up!'}}});

registerEnemy('bigSlime',{size:{w:BS_W,h:BS_H,hp:16},update:bsUpdate,draw:bsDraw,init:bsInit,heart:1,deathColor:'#b77ee0',
  // the top of the dome is soft: a stomp hurts it but does not squash it flat
  contact:e=>({hurt:[shrink(e,12)],stomp:{x:e.x+20,y:e.y,w:e.w-40,h:30},dmg:2}),
  onHit:e=>bsWake(e),
  onStomp:e=>{e.squash=.25;bsWake(e)},
  onDeath:e=>{const cx=e.x+e.w/2;shake(.5,8);sfx('boom');
    burst(cx,e.y+e.h/2,40,'#b77ee0',380,900,[4,9]);
    bsSpawnKid(e,-1);bsSpawnKid(e,1);
    for(let i=0;i<8;i++) items.push({k:'spore',x:cx+rand(-30,30),y:e.y+e.h/2,ph:0,vy:-rand(380,560),vx:rand(-160,160),drop:true,loot:true})}});
for(const k of ['goo','gooWave']) registerShot(k,{update:updateGoo,draw:drawGoo,deflect:k==='goo'});   // a punch knocks the blobs away
