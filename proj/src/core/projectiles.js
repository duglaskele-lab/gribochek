/* ---------- projectiles & items ---------- */
function arrowBlocked(x,y){
  const c=Math.floor(x/TS),r=Math.floor(y/TS),t=tile(c,r);
  if(isSolidT(t)) return true;
  if(t===T_PLANK&&y-r*TS<16) return true;
  for(const pl of dynPlats) if(x>pl.x&&x<pl.x+pl.w&&y>pl.y&&y<pl.y+(pl.h||14)) return true;
  return false;
}
function updateShots(dt){
  for(const s of shots){
    s.life-=dt; s.rot+=dt*s.vx/40; s.vy+=1500*dt;
    s.x+=s.vx*dt;
    {const sc=Math.floor((s.x+Math.sign(s.vx)*s.r)/TS),sr=Math.floor(s.y/TS);if(solid(sc,sr)){breakWall(sc,sr);s.life=0;burst(s.x,s.y,6,s.red?'#e33b2e':'#e0782a',120);continue}}
    s.y+=s.vy*dt;
    if(waterAt(s.x,s.y)){s.life=0;splash(s.x,s.y);continue}
    if(tile(Math.floor(s.x/TS),Math.floor(s.y/TS))===T_SAND){s.life=0;dust(s.x,s.y,4);continue}
    if(s.vy>0){
      const r=Math.floor((s.y+s.r)/TS), c=Math.floor(s.x/TS), t=tile(c,r);
      let floorY=null; if(isFloorT(t)) floorY=r*TS;
      for(const pl of dynPlats) if(s.x>pl.x&&s.x<pl.x+pl.w&&s.y+s.r>=pl.y&&s.y+s.r-s.vy*dt<=pl.y+2) floorY=pl.y;
      if(floorY!==null&&s.y+s.r-s.vy*dt<=floorY+2){s.y=floorY-s.r;s.vy=-380;s.b++;if(s.b>3)s.life=0}
    }else if(solid(Math.floor(s.x/TS),Math.floor((s.y-s.r)/TS))) s.vy=0;
    if(s.y>WH+40) s.life=0;
    if(s.life<=0) continue;
    for(const e of enemies){ if(e.dead) continue;
      if(enemyHurtBoxes(e).some(b=>circleBox(s.x,s.y,s.r,b))){
        if(attackEnemy(e,s.dmg,s.x-Math.sign(s.vx)*40,s.x,s.y,b=>circleBox(s.x,s.y,s.r,b))) burst(s.x,s.y,6,'#fff',150);
        s.life=0;break}}
    if(s.life>0&&bossHittable()){const m=bossHitMult(b=>circleBox(s.x,s.y,s.r,b));if(m){s.life=0;hitBoss(s.dmg*m,s.x,s.y)}}
    // thrown mushrooms pass enemy projectiles by: only punches and shockwaves knock those down
  }
  shots=shots.filter(s=>s.life>0);
  const pb={x:P.x+4,y:P.y+8,w:P.w-8,h:P.h-8};
  const aL=ARENA_L,aR=ARENA_R;
  for(const b of eshots){
    switch(b.k){
      case 'banana':
        b.vy+=b.g*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.rot+=dt*14;
        if(solid(Math.floor(b.x/TS),Math.floor(b.y/TS))||b.y>WH+40){b.dead=true;burst(b.x,b.y,6,'#ffd84a',120)}
        else if(!P.dead&&circleBox(b.x,b.y,b.r,pb)){hurt(b.x);b.dead=true}
        break;
      case 'arrow':
        b.vy+=b.g*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;
        if(b.life<=0||b.y>WH+40||arrowBlocked(b.x,b.y)){b.dead=true;burst(b.x,b.y,4,'#8a5a36',90)}
        else if(!P.dead&&circleBox(b.x,b.y,b.r,pb)){hurt(b.x);b.dead=true}
        break;
      case 'dart':
        b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;
        if(b.life<=0||solid(Math.floor(b.x/TS),Math.floor(b.y/TS))){b.dead=true;burst(b.x,b.y,3,'#c9a26b',80)}
        else if(!P.dead&&circleBox(b.x,b.y,b.r,pb)){hurt(b.x);b.dead=true}
        break;
      case 'needle':
        b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;
        if(b.life<=0||solid(Math.floor(b.x/TS),Math.floor(b.y/TS))){b.dead=true;burst(b.x,b.y,3,'#5f9d45',80)}
        else if(!P.dead&&circleBox(b.x,b.y,b.r,pb)){hurt(b.x);b.dead=true}
        break;
      case 'wave':
        b.x+=b.vx*dt; if(Math.random()<.5)dust(b.x+b.w/2,FLOOR,1);
        if(b.x<aL-20||b.x>aR) b.dead=true;
        else if(!P.dead&&overlap(b,pb)) hurt(b.x+b.w/2);
        break;
      case 'rock': case 'meteor':
        b.vy+=b.g*dt;b.y+=b.vy*dt;if(b.vx)b.x+=b.vx*dt;
        if(b.vx&&(b.x<aL-40||b.x>aR+40)){b.dead=true;break}
        if(b.k==='meteor') embers(b.x,b.y,1);
        if(b.y+b.r>=FLOOR){b.dead=true;burst(b.x,FLOOR-8,10,b.k==='meteor'?'#ff7a2a':'#8a7a6a',200);sfx('land');
          if(b.k==='meteor'&&B&&B.phase===2) eshots.push({k:'burn',x:b.x,life:2.2})}
        else if(!P.dead&&circleBox(b.x,b.y,b.r,pb)){hurt(b.x);b.dead=true;burst(b.x,b.y,10,'#8a7a6a',200)}
        break;
      case 'flame':
        b.age+=dt;b.life-=dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.r=10+b.age*22;
        if(b.y>=FLOOR-4){b.dead=true;embers(b.x,FLOOR-4,2);
          if(B&&B.phase===2){B.burnT=(B.burnT||0)-1;if(B.burnT<=0){B.burnT=5;eshots.push({k:'burn',x:b.x,life:3})}}}
        else if(b.life<=0) b.dead=true;
        else if(!P.dead&&circleBox(b.x,b.y,b.r*.7,pb)) hurt(b.x);
        break;
      case 'fireball':
        if(b.aim){const dx=b.aim.x-b.x,dy=b.aim.y-b.y,l=Math.hypot(dx,dy)||1;b.vx=dx/l*b.sp;b.vy=dy/l*b.sp;if(l<20){b.vx=b.dir*b.sp;b.vy=0;b.aim=null}}
        else b.vy+=b.g*dt;
        b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;embers(b.x,b.y,1);
        if(b.y+b.r>=FLOOR||b.life<=0||b.x<aL-40||b.x>aR+40||(!b.ghost&&b.vy>0&&isFloorT(tile(Math.floor(b.x/TS),Math.floor((b.y+b.r)/TS))))){
          b.dead=true;burst(b.x,b.y,10,'#ff9a2a',180);if(B&&B.phase===2&&b.y+b.r>=FLOOR-4)eshots.push({k:'burn',x:b.x,life:2})}
        else if(!P.dead&&circleBox(b.x,b.y,b.r,pb)){hurt(b.x);b.dead=true;burst(b.x,b.y,10,'#ff9a2a',180)}
        break;
      case 'orb':
        b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;
        if(Math.random()<.6) parts.push({x:b.x,y:b.y,vx:0,vy:0,g:0,c:'rgba(160,130,255,.6)',s:rand(4,7),life:.25,max:0,t:'puff'});
        if(b.life<=0||solid(Math.floor(b.x/TS),Math.floor(b.y/TS))){b.dead=true;burst(b.x,b.y,8,'#b89aff',140)}
        else if(!P.dead&&circleBox(b.x,b.y,b.r,pb)){hurt(b.x);b.dead=true;burst(b.x,b.y,8,'#b89aff',140)}
        break;
      case 'acid':
        b.vy+=b.g*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;
        if(Math.random()<.25) parts.push({x:b.x,y:b.y+6,vx:0,vy:40,g:600,c:'#9be04a',s:3,life:.3,max:0,t:'dot'});
        if(b.life<=0||(b.ghost?(b.x<ARENA_L-60||b.x>ARENA_R+60||b.y<-60||b.y>WH):(b.y+b.r>=FLOOR||solid(Math.floor(b.x/TS),Math.floor(b.y/TS))||(b.vy>0&&isFloorT(tile(Math.floor(b.x/TS),Math.floor((b.y+b.r)/TS))))))){b.dead=true;burst(b.x,b.y,10,'#9be04a',180);sfx('splash')}
        else if(!P.dead&&circleBox(b.x,b.y,b.r,pb)){hurt(b.x);b.dead=true;burst(b.x,b.y,10,'#9be04a',180)}
        break;
      case 'axe':{
        const o=b.owner;b.t+=dt;b.life-=dt;b.rot+=dt*16*b.spin;
        if(b.phase==='out'){const k=Math.min(1,b.t/.8),p=1-(1-k)*(1-k);b.x=b.sx+b.ux*b.D*p;b.y=b.sy+b.uy*b.D*p;if(k>=1){b.phase='back';b.t=0}}
        else if(!o||o.dead){b.vy=(b.vy||0)+1500*dt;b.y+=b.vy*dt;if(b.y>WH)b.dead=true}
        else{const tx=o.x+o.w/2,ty=o.y+30,ddx=tx-b.x,ddy=ty-b.y,d=Math.hypot(ddx,ddy)||1,sp=Math.min(760,250+b.t*600);
          b.x+=ddx/d*Math.min(d,sp*dt);b.y+=ddy/d*Math.min(d,sp*dt);if(d<34){b.dead=true;o.axeOut=false;sfx('clang')}}
        if(Math.random()<.4) parts.push({x:b.x,y:b.y,vx:0,vy:0,g:0,c:'rgba(255,255,255,.55)',s:rand(4,7),life:.18,max:0,t:'puff'});
        if(b.life<=0){b.dead=true;if(o)o.axeOut=false}
        if(!b.dead&&!P.dead&&circleBox(b.x,b.y,b.r,pb)) hurt(b.x);
        break}
      case 'burn':
        b.life-=dt;if(b.life<=0)b.dead=true;if(Math.random()<.2)embers(b.x+rand(-18,18),FLOOR-6,1);
        if(!P.dead&&overlap({x:b.x-22,y:FLOOR-14,w:44,h:14},pb)) hurt(b.x);
        break;
      default: if(SHOTS[b.k]) SHOTS[b.k].update(b,dt,pb); break;   // projectiles registered by levels
      case 'vent':
        b.t-=dt;
        if(b.st==='idle'&&b.t<=0){b.st='warn';b.t=.9}
        else if(b.st==='warn'){if(Math.random()<.4)embers(b.x+rand(-14,14),FLOOR-4,1);if(b.t<=0){b.st='erupt';b.t=.8;sfx('fire');shake(.15,3)}}
        else if(b.st==='erupt'){if(Math.random()<.8)embers(b.x+rand(-16,16),FLOOR-rand(10,160),2);
          if(!P.dead&&overlap({x:b.x-22,y:FLOOR-170,w:44,h:170},pb)) hurt(b.x);
          if(b.t<=0){b.st='idle';b.t=rand(2,3.5)}}
        break;
    }
  }
  eshots=eshots.filter(b=>!b.dead);
}
// Raithwyn's spells (cast in core/player.js): the hadoken flies straight and breaks cracked walls, the sphere sways along
// a wide sine wave (through floors and ceilings). Each bursts on the first foe or boss it hurts, on a wall or in water; both knock down foes' shots.
function updateSpells(dt){
  for(const s of spells){
    s.life-=dt; s.t+=dt; s.x+=s.vx*dt;
    if(s.amp) s.y=s.y0-Math.sin(s.t/s.per*Math.PI*2)*s.amp;
    // the sphere's wave is tall (it dips to the floor and rises above her head), so floors and ceilings don't stop it:
    // only a wall at the height it was cast from does
    const c=Math.floor((s.x+s.face*s.r*.6)/TS),r=Math.floor((s.amp?s.y0:s.y)/TS);
    if(solid(c,r)){if(s.k==='hadoken')breakWall(c,r);s.life=0;burst(s.x,s.y,10,'#c79bff',180);continue}
    if(waterAt(s.x,s.y)){s.life=0;splash(s.x,s.y);continue}
    if(s.x<camX-80||s.x>camX+VW+80) s.life=0;
    const hit=b=>circleBox(s.x,s.y,s.r,b);
    for(const e of enemies){ if(e.dead||s.life<=0||s.hit.has(e)) continue;
      if(enemyHurtBoxes(e).some(hit)){s.hit.add(e);attackEnemy(e,s.dmg,s.x-s.face*40,s.x,s.y,hit);s.life=0}}
    if(s.life>0&&bossHittable()){const m=bossHitMult(hit);if(m){s.life=0;hitBoss(s.dmg*m,s.x,s.y)}}
    for(const b of eshots) if(canDeflect(b)&&!b.dead&&Math.hypot(b.x-s.x,b.y-s.y)<(b.r||8)+s.r){b.dead=true;burst(b.x,b.y,8,'#e6d4ff',160);sfx('hit')}
    if(s.life<=0) burst(s.x,s.y,12,'#c79bff',200);
    else if(Math.random()<(s.k==='hadoken'?.7:.3)) parts.push({x:s.x-s.face*s.r*.8,y:s.y+rand(-s.r,s.r)*.5,vx:-s.face*rand(40,120),vy:rand(-40,40),g:0,c:'rgba(200,150,255,.85)',s:rand(2,4),life:.3,max:0,t:'dot'});
  }
  spells=spells.filter(s=>s.life>0);
}
function updateItems(dt){
  const cx=P.x+P.w/2, cy=P.y+P.h/2;
  for(const it of items){
    it.ph+=dt*3;
    if(it.magnet){ // flies to the player faster and faster
      const dx=cx-it.x,dy=cy-it.y,d=Math.hypot(dx,dy)||1;it.mv+=2800*dt;const s=Math.min(d,it.mv*dt);it.x+=dx/d*s;it.y+=dy/d*s}
    else if(it.drop){it.vy+=1400*dt;it.y+=it.vy*dt;if(it.vx){it.x+=it.vx*dt;if(it.bonus)it.x=clamp(it.x,ARENA_L+20,ARENA_R-20)}
      const r=Math.floor((it.y+12)/TS),c=Math.floor(it.x/TS),t=tile(c,r);
      if(it.vy>0&&isFloorT(t)){it.y=r*TS-14;it.vy=0;it.vx=0;it.drop=false}
      else if(t===T_SAND&&it.vy>0){it.taken=true;dust(it.x,it.y,4)}
      if(it.y>WH+40) it.taken=true}
    if(P.dead||it.taken) continue;
    if((it.x-cx)**2+(it.y-cy)**2<34*34){
      it.taken=true;
      if(it.k==='spore'){spores++;sporesGot++;sfx('coin');burst(it.x,it.y,6,'#ffcf6b',120,300,[2,4])}
      else if(it.k==='gold'){spores+=5;sporesGot+=5;sfx('power');stars(it.x,it.y,10);floater(it.x,it.y-30,'+5')}
      else if(it.k==='heart'){if(P.hp<P.maxhp)P.hp++;else{spores+=2;floater(it.x,it.y-30,T('fHeartFull'))}sfx('coin');burst(it.x,it.y,10,'#ff6b7a',160)}
      else if(it.k==='power'){const was=P.mana;gainMana(MANA_PICK);P.lockT=.55;P.pickT=0;P.vx=0;P.punchT=0;P.castT=0;sfx('power');stars(it.x,it.y,14);   // the big mushroom: +100 mana
        floater(it.x,it.y-40,'+'+Math.round(P.mana-was)+' '+T('manaL'))}
    }
  }
  items=items.filter(i=>!i.taken);
}
// quick spore pick-up: the spores fly to the player by themselves. collectSporesOnScreen() takes every spore in view;
// also(it) adds others, e.g. the boss's spores after the fight wherever they fell (see bossDefeated)
function collectSporesOnScreen(also){
  const vw=VW/camZ,vh=VH/camZ,inView=it=>it.x>camX-20&&it.x<camX+vw+20&&it.y>camY-60&&it.y<camY+vh+20;
  for(const it of items) if(it.k==='spore'&&!it.taken&&!it.magnet&&!(it.hid&&!it.hid.found)&&(inView(it)||(also&&also(it)))){it.magnet=true;it.drop=false;it.mv=200}
}
// rotten branches: shake when stepped on, drop into the bog, grow back a few seconds later
function updateCrumble(pl,dt){
  switch(pl.st){
    case 'idle': if(P.ride===pl&&P.onGround&&!P.dead){pl.st='shake';pl.t=.5;sfx('creak')}break;
    case 'shake': pl.t-=dt;if(Math.random()<.35)dust(pl.x+rand(0,pl.w),pl.y+14,1);
      if(pl.t<=0){pl.st='fall';pl.vy=0;pl.rot=0;pl.spin=rand(-1.4,1.4);sfx('crack')}break;
    case 'fall': {pl.vy+=1500*dt;pl.y+=pl.vy*dt;pl.rot+=pl.spin*dt;
      const sink=BIOME==='swamp'?24*TS-6:WH+60;
      if(pl.y>=sink){if(BIOME==='swamp'){splash(pl.x+pl.w/2,pl.y);splash(pl.x+pl.w*.25,pl.y);sfx('splash')}pl.st='gone';pl.t=4.5}}break;
    case 'gone': pl.t-=dt;if(pl.t<=0){pl.st='respawn';pl.t=.5;pl.y=pl.hy;pl.rot=0}break;
    case 'respawn': pl.t-=dt;if(pl.t<=0)pl.st='idle';break;
  }
}
function updatePlats(dt){
  for(const pl of plats){
    if(pl.crumble){updateCrumble(pl,dt);continue}
    const ox=pl.x,oy=pl.y; pl.x+=pl.vx*dt;
    if(pl.x<pl.x0){pl.x=pl.x0;pl.vx=Math.abs(pl.vx)} if(pl.x>pl.x1){pl.x=pl.x1;pl.vx=-Math.abs(pl.vx)}
    if(pl.vy){ // vertical lifts pause for a moment at each end
      if(pl.wt>0) pl.wt-=dt;
      else{pl.y+=pl.vy*dt;if(pl.y<pl.y0){pl.y=pl.y0;pl.vy=Math.abs(pl.vy);pl.wt=.8}if(pl.y>pl.y1){pl.y=pl.y1;pl.vy=-Math.abs(pl.vy);pl.wt=.8}}}
    const dx=pl.x-ox,dy=pl.y-oy;
    if(P.ride===pl&&P.onGround){P.x+=dx;P.y+=dy}
    for(const e of enemies) if(e.ride===pl&&e.onGround){e.x+=dx;e.y+=dy}
  }
  dynPlats=plats.filter(pl=>!pl.crumble||pl.st==='idle'||pl.st==='shake');
  for(const e of enemies) if(e.type==='lizChief'&&!e.dead&&e.guard>0&&e.arm) dynPlats.push(e.arm);
  for(const e of enemies) if(e.type==='caterpillar'&&!e.dead) for(let i=1;i<e.pl.length;i++) dynPlats.push(e.pl[i]);
}
function updateParts(dt){
  for(const p of parts){p.max=p.max||p.life;p.life-=dt;p.vy+=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.rot!==undefined)p.rot+=dt*6}
  parts=parts.filter(p=>p.life>0);
  if(parts.length>900) parts.splice(0,parts.length-900);
  for(const g of ghosts) g.life-=dt; ghosts=ghosts.filter(g=>g.life>0);
  for(const f of floaters){f.t+=dt;f.y-=30*dt}
  floaters=floaters.filter(f=>f.t<1.3);
}

