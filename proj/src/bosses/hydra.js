/* ---------- hydra ---------- */
// The arena is two screens tall. The hydra's body sits in the background of a poisoned pool (touching it is harmless);
// three big heads on long necks do the fighting. Heads are bouncy: stomping one pushes it down for a moment.
// Three stomps on the same head in quick succession make that head angry: it hunts underneath the player and
// bites or spits straight up. Only one head ever attacks at a time; with all three heads alive they attack less often.
// Three stages: kill all three heads and they all grow back. Stage 1: dry floor. Stage 2: poison on the floor,
// the heads can fire a laser. Stage 3: the poison stays high and floods the lower ledges.
// Stomping a head damages it. A head also goes berserk on its own if no head has raged for RAGE_EVERY seconds.
const STAGE_HP=[0,8.5,9,10];   // per head, per stage: 82.5 in total
const HYDRA_TOTAL=3*(STAGE_HP[1]+STAGE_HP[2]+STAGE_HP[3]);
const POISON_SAFE=4, POISON_RISE=.1;   // stage 2 poison: harmless for 4 s, fills up over ~10 s
const NECK=470, POISON_H=26, HS=1.5, TIDE_H=274, TIDE_RISE=25, RAGE_HOPS=3, RAGE_WINDOW=3.5, RAGE_EVERY=10, DMG_HEAD_STOMP=1, LASER_LEN=1700, LASER_W=40;
const HYDRA_ATK=['lungeWind','lunge','hold','spitWind','spit','aim','snap','spitUp','laserWind','laser'];
function makeBoss(){return BOSSES[LV().boss].make()}
function makeHydra(){
  const cx=(ARENA_L+ARENA_R)/2;
  const b={kind:'hydra',x:cx-150,y:FLOOR-150,w:300,h:150,hp:HYDRA_TOTAL,max:HYDRA_TOTAL,state:'sleep',t:0,flash:0,face:-1,heads:[],lastHead:null,
    atkCD:1.5,stage:1,tide:0,lastRage:0};
  [[-1,-72,-128],[0,0,-150],[1,72,-128]].forEach(([sd,ox,oy],i)=>{
    const rx=cx+ox, ry=FLOOR+oy;
    b.heads.push({i,sd,rx,ry,homeX:cx+sd*235,homeY:FLOOR-(sd?285:345),x:rx+(sd||-.5)*80,y:ry+18,hp:STAGE_HP[1],st:'rest',t:1,angry:0,mouth:0,
      face:sd||-1,flash:0,dead:false,sink:0,sinkT:0,ph:i*2.1,ax:0,ay:0,shot:false,next:'',trail:[],hops:[]});
  });
  return b;
}
const hydraBody=()=>({x:B.x+45,y:B.y+45,w:B.w-90,h:B.h-45});
const hydraHeadBox=h=>({x:h.x-50,y:h.y-38,w:100,h:72});
const hydraTopBox=h=>({x:h.x-54,y:h.y-50,w:108,h:32});
const hydraSnapBox=h=>({x:h.x-58,y:h.y-130,w:116,h:160});
const hydraDanger=h=>!h.dead&&(h.st==='lunge'||h.st==='hold'||h.st==='snap');   // the laser is dangerous along its beam, not by touch
const hydraTide=()=>B&&B.kind==='hydra'?B.tide:0;
// HP bar: what is left of this stage plus all later stages
function hydraHP(){let v=B.heads.reduce((a,q)=>a+Math.max(0,q.hp),0);for(let k=B.stage+1;k<=3;k++)v+=3*STAGE_HP[k];return v}
function hydraLaserSeg(h){const o=hydraMouth(h,h.aa);return [o.x,o.y,o.x+Math.cos(h.aa)*LASER_LEN,o.y+Math.sin(h.aa)*LASER_LEN]}
function hydraMouth(h,a){return{x:h.x+Math.cos(a)*78,y:h.y+Math.sin(a)*78}}
function segDist(px,py,x1,y1,x2,y2){const dx=x2-x1,dy=y2-y1,l=dx*dx+dy*dy||1,t=clamp(((px-x1)*dx+(py-y1)*dy)/l,0,1);return Math.hypot(px-x1-dx*t,py-y1-dy*t)}
function hydraGap(){const n=B.heads.filter(h=>!h.dead).length;return (n>=3?rand(2.4,3.2):n===2?rand(1.6,2.2):rand(1.1,1.5))*HYDRA_GAP_K[B.stage]}
// pause between head attacks per stage: stage 1 -20%, stage 2 -40%, stage 3 -60% (against the original 1, .85, .7)
const HYDRA_GAP_K=[1,.8,.85*.6,.7*.4];
function hydraHit(dmg,x,y){const h=B.lastHead;if(h)hydraDamage(h,dmg,x,y)}
function hydraDamage(h,dmg,x,y){
  if(!h||h.dead||B.state!=='fight') return;
  h.hp-=dmg;h.flash=.1;burst(x,y,6,'#fff',150);sfx('hit');h.x+=(Math.sign(h.x-(P.x+P.w/2))||1)*14;h.y-=4;
  if(h.hp<=EPS){h.hp=0;h.dead=true;h.st='dead';h.angry=0;h.trail.length=0;sfx('roar');shake(.4,8);burst(h.x,h.y,24,'#6fae6a',260);stars(h.x,h.y,8);
    B.atkCD=Math.max(B.atkCD,1.2)}
  B.hp=hydraHP();
  if(B.heads.every(q=>q.dead)){
    eshots=eshots.filter(q=>q.k!=='acid');
    if(B.stage<3){ // next stage: every head grows back
      B.stage++;B.state='revive';B.t=2.6;B.atkCD=2;B.lastRage=time;shake(.6,8);sfx('roar');
      floater((ARENA_L+ARENA_R)/2,FLOOR-430,T('fStage')(B.stage));
      for(const q of B.heads){q.dead=false;q.hp=STAGE_HP[B.stage];q.st='rest';q.angry=0;q.hops=[];q.trail=[];q.sink=0;q.sinkT=0;q.flash=.3}
      B.hp=hydraHP();
    }else{B.hp=0;B.state='dying';B.t=2.4;hitstop=.12;shake(.4,9);hydraCleanse()}
  }
}
// three acid blobs in a fan aimed at the player; they fly straight and pass through platforms
function hydraVolley(x0,y0){const a=Math.atan2(P.y+P.h/2-y0,P.x+P.w/2-x0);
  for(const off of [-.22,0,.22]) eshots.push({k:'acid',x:x0,y:y0,vx:Math.cos(a+off)*ACID_V,vy:Math.sin(a+off)*ACID_V,g:0,r:12,life:4,ghost:true})}
const ACID_V=360;
// the moment the hydra falls, its poison becomes plain bog water (real, swimmable water tiles)
function hydraCleanse(){
  const r0=clamp(Math.ceil((poisonTop()-20)/TS),0,ROWS-1), c0=Math.floor(ARENA_L/TS), c1=Math.floor(ARENA_R/TS)-1;
  for(let c=c0;c<=c1;c++)for(let r=r0;r*TS<FLOOR;r++){if(grid[r][c]===T_EMPTY){grid[r][c]=T_WATER;flow[r][c]=0}else if(grid[r][c]===T_PLANK)flow[r][c]=WET_PLANK}
  poisonLvl=0;B.tide=0;
  for(let i=0;i<14;i++)splash(rand(ARENA_L+40,ARENA_R-40),r0*TS);sfx('splash');
}
function hydraEnrage(h){h.hops=[];h.angry=6;B.lastRage=time;sfx('roar');
  if(h.st==='idle'||h.st==='recover'){h.st='angryIdle';B.atkCD=Math.max(B.atkCD,.8)}}
function headTo(h,tx,ty,k,dt){const a=Math.min(1,k*dt);h.x+=(tx-h.x)*a;h.y+=(ty-h.y)*a}
function hydraClamp(h){
  const dx=h.x-h.rx,dy=h.y-h.ry,d=Math.hypot(dx,dy);
  if(d>NECK){h.x=h.rx+dx/d*NECK;h.y=h.ry+dy/d*NECK}
  h.x=clamp(h.x,ARENA_L+60,ARENA_R-60);h.y=clamp(h.y,FLOOR-540,Math.min(FLOOR-40,poisonTop()-24));
}
function hydraAim(h){h.st='aim';h.t=1.15;h.next=Math.random()<.5?'snap':'spitUp'}
function hydraBite(x){if(!P.dead&&P.inv<=0&&P.dashT<=0&&!P.entering){burst(P.x+P.w/2,P.y+P.h/2,16,'#ff3a2a',280);shake(.2,6)}hurt(x)}
function hydraEndAttack(h,next,t){h.st=next;h.t=t;B.atkCD=hydraGap()}
function updateHydraPoison(dt){
  if(bossDead) return;
  if(B.stage>=2&&B.state==='fight'&&!B.poisonOn){B.poisonOn=true;B.poisonSafe=POISON_SAFE;floater((ARENA_L+ARENA_R)/2,FLOOR-380,T('fTide'))}
  if(B.poisonSafe>0) B.poisonSafe-=dt;
  if(B.stage>=3&&B.state==='fight') B.tideOn=true;
  const lvl=B.poisonOn?1:0, tide=B.tideOn?TIDE_H:0;
  poisonLvl=approach(poisonLvl,lvl,dt*(B.stage===2?POISON_RISE:.6));B.tide=approach(B.tide,tide,dt*TIDE_RISE);
}
const hHY=h=>h.homeY-B.tide*.6;
function hydraBounce(pb){
  // bouncing off the heads: the head gets knocked down; three quick stomps on the same head make it angry
  if(!P.dead&&P.vy>0) for(const h of B.heads){ if(h.dead) continue;
    const top=hydraTopBox(h);
    if(P.prevBottom<=top.y+18&&overlap(top,pb)){
      if(hydraDanger(h)){hydraBite(h.x);break}
      const high=inp.j||P.buffer>0;
      P.vy=high?-HIGH_BOUNCE:-Math.round(720*Math.sqrt(1.5));P.y=top.y-P.h;P.bounced=true;P.buffer=0;P.jumpT=0;P.onGround=false;P.airDash=airDashMax();P.bounceT=high?0:.14;P.peakY=P.y;
      h.sink=120;h.sinkT=.45;h.y+=45;h.flash=.06;shake(.12,4);sfx('jump');sfx('land');stars(P.x+P.w/2,P.y+P.h,5);dust(h.x,h.y-40,6);
      if(B.state==='fight'&&h.angry<=0){h.hops=h.hops.filter(t=>time-t<RAGE_WINDOW);h.hops.push(time);if(h.hops.length>=RAGE_HOPS)hydraEnrage(h)}
      if(B.state==='fight') hydraDamage(h,DMG_HEAD_STOMP,h.x,h.y-40);
      break}
  }
}
function updateHydra(dt){
  const pcx=P.x+P.w/2,pcy=P.y+P.h/2,pb={x:P.x+4,y:P.y+8,w:P.w-8,h:P.h-8};
  for(const h of B.heads){if(h.flash>0)h.flash-=dt;
    if(h.sinkT>0)h.sinkT-=dt;else h.sink=approach(h.sink,0,dt*80);
    for(const q of h.trail)q.a-=dt*3.5;h.trail=h.trail.filter(q=>q.a>0)}
  updateHydraPoison(dt);
  if(B.state==='intro'||B.state==='revive'){B.t-=dt;
    for(const h of B.heads){headTo(h,h.homeX,hHY(h)+h.sink,h.sinkT>0?6:2.2,dt);h.mouth=.5+.5*Math.sin(time*14+h.i*1.7);h.face=Math.sign(pcx-h.x)||h.face}
    if(B.state==='revive') hydraBounce(pb);   // between stages the heads are bouncy but take no damage
    if(B.t<=0){B.state='fight';B.atkCD=1.5;B.lastRage=time;for(const h of B.heads){h.st='idle';h.mouth=0}}
    return}
  if(B.state==='dying'){B.t-=dt;B.y+=14*dt;
    if(Math.random()<.3){burst(B.x+rand(0,B.w),B.y+rand(0,B.h*.6),8,Math.random()<.5?'#4f8a5a':'#9be04a',220);sfx('hit')}
    for(const h of B.heads) headTo(h,h.x,FLOOR-20,1.5,dt);
    if(B.t<=0) bossDefeated();
    return}
  if(B.state!=='fight') return;
  // attack scheduler: a single attacker at a time, the angry head goes first
  if(B.atkCD>0) B.atkCD-=dt;
  if(!P.dead&&B.atkCD<=0&&!B.heads.some(h=>!h.dead&&HYDRA_ATK.indexOf(h.st)>=0)){
    const angry=B.heads.find(h=>!h.dead&&h.st==='angryIdle');
    const calm=B.heads.filter(h=>!h.dead&&h.st==='idle');
    if(angry) hydraAim(angry);
    else if(calm.length){const h=calm[Math.floor(Math.random()*calm.length)],d=Math.hypot(pcx-h.x,pcy-h.y);
      if(time-B.lastRage>RAGE_EVERY&&!B.heads.some(q=>q.angry>0)){hydraEnrage(h);h.st='angryIdle'}   // berserk as an attack of its own
      else{const r=Math.random(), laser=B.stage>=2;
        if(d<430&&r<(laser?.4:.55)){h.st='lungeWind';h.t=1.05;sfx('screech')}
        else if(laser&&r>.62){h.st='laserWind';h.t=1.25;h.aa=Math.atan2(pcy-h.y,pcx-h.x);sfx('screech')}
        else{h.st='spitWind';h.t=.9}}}
  }
  const alive=B.heads.filter(h=>!h.dead).length;
  for(const h of B.heads){
    if(h.dead){headTo(h,h.x,FLOOR-24,2.5,dt);h.mouth=approach(h.mouth,.8,dt);continue}
    if(h.angry>0) h.angry-=dt;
    h.ph+=dt;
    const face=Math.sign(pcx-h.x)||h.face;
    switch(h.st){
      case 'idle':{h.face=face;h.mouth=approach(h.mouth,0,dt*3);
        const pull=alive>=3?0:alive===2?.35:.6;   // with fewer heads left, the others stay closer to the player
        const nx=clamp(pcx+(h.x<pcx?-170:170),ARENA_L+70,ARENA_R-70), ny=clamp(P.y+P.h-60,FLOOR-470,FLOOR-140);
        const hx=h.homeX+(nx-h.homeX)*pull, hy=hHY(h)+(ny-hHY(h))*pull*.7;
        headTo(h,hx+Math.sin(h.ph*.9)*40,hy+Math.sin(h.ph*1.4+1)*28+h.sink,h.sinkT>0?6:3*(1-pull*.5),dt)}break;
      // angry and waiting for its turn: hovers under the player, glowing red
      case 'angryIdle':{h.face=face;h.mouth=approach(h.mouth,.3,dt*3);
        headTo(h,clamp(pcx,ARENA_L+70,ARENA_R-70),clamp(P.y+P.h+170,FLOOR-480,FLOOR-80)+h.sink,1.6,dt);
        if(h.angry<=0){h.st='recover';h.t=.8}}break;
      case 'lungeWind':{h.face=face;h.mouth=approach(h.mouth,1,dt*2);
        const d=Math.hypot(pcx-h.x,pcy-h.y)||1;headTo(h,h.x-(pcx-h.x)/d*60,h.y-(pcy-h.y)/d*40,3,dt);
        if(h.t<.45) h.x+=rand(-2,2);
        h.t-=dt;if(h.t<=0){h.st='lunge';h.t=.5;h.ax=pcx;h.ay=pcy;sfx('dash')}}break;
      case 'lunge': headTo(h,h.ax,h.ay,5.5,dt);h.t-=dt;if(h.t<=0){h.st='hold';h.t=.22;h.mouth=0;sfx('punch')}break;
      case 'hold': h.t-=dt;if(h.t<=0)hydraEndAttack(h,'recover',.8);break;
      case 'recover': headTo(h,h.homeX,hHY(h)+h.sink,2.2,dt);h.mouth=approach(h.mouth,0,dt*4);h.t-=dt;
        if(h.t<=0) h.st=h.angry>0?'angryIdle':'idle';break;
      case 'spitWind':{h.face=face;h.mouth=approach(h.mouth,.9,dt*1.4);headTo(h,h.homeX,hHY(h)-(h.sd?30:10),3,dt);h.t-=dt;
        if(Math.random()<.3) parts.push({x:h.x+h.face*60,y:h.y+8,vx:0,vy:60,g:500,c:'#9be04a',s:4,life:.3,max:0,t:'dot'});
        if(h.t<=0){h.st='spit';h.t=.4;sfx('fire');
          const x0=h.x+h.face*62,y0=h.y-6,ty=P.y+P.h-10,g=1150;
          hydraVolley(x0,y0);
          burst(x0,y0,8,'#9be04a',160)}}break;
      case 'spit': h.t-=dt;h.mouth=approach(h.mouth,0,dt*2);if(h.t<=0)hydraEndAttack(h,'recover',.7);break;
      case 'aim':{h.face=face;
        if(h.t>.4) headTo(h,clamp(pcx,ARENA_L+70,ARENA_R-70),clamp(P.y+P.h+160,FLOOR-480,FLOOR-80),3.2,dt); else h.x+=rand(-1.5,1.5);
        h.mouth=approach(h.mouth,.35,dt*3);h.t-=dt;
        if(h.t<=0){if(h.next==='snap'){h.st='snap';h.t=.6;h.ay=h.y-200;sfx('roar')}else{h.st='spitUp';h.t=.55;h.shot=false}}}break;
      case 'snap': headTo(h,h.x,h.ay,9,dt);h.mouth=.5+.5*Math.sin(time*40);h.t-=dt;
        if(!P.dead&&overlap(hydraSnapBox(h),pb)) hydraBite(h.x);
        if(h.t<=0){h.mouth=0;hydraEndAttack(h,'recoverA',.9)}break;
      case 'spitUp': h.mouth=approach(h.mouth,1,dt*6);h.t-=dt;
        if(!h.shot&&h.t<.3){h.shot=true;sfx('fire');
          hydraVolley(h.x,h.y-56);
          burst(h.x,h.y-60,8,'#9be04a',160)}
        if(h.t<=0)hydraEndAttack(h,'recoverA',.9);break;
      // laser: aim with a warning outline, lock on, then a wide green beam across the arena
      case 'laserWind':{h.face=face;h.mouth=approach(h.mouth,.8,dt*2);headTo(h,h.homeX,hHY(h)-20,2,dt);
        if(h.t>.45){const o=hydraMouth(h,h.aa),want=Math.atan2(pcy-o.y,pcx-o.x);let d=want-h.aa;d=Math.atan2(Math.sin(d),Math.cos(d));h.aa+=d*Math.min(1,dt*5)}
        else h.x+=rand(-1.2,1.2);
        if(Math.random()<.5) parts.push({x:hydraMouth(h,h.aa).x+rand(-8,8),y:hydraMouth(h,h.aa).y+rand(-8,8),vx:rand(-30,30),vy:rand(-30,30),g:0,c:'#c8ff8a',s:rand(3,5),life:.3,max:0,t:'dot'});
        h.t-=dt;if(h.t<=0){h.st='laser';h.t=.6;sfx('fire');sfx('screech');shake(.3,5)}}break;
      case 'laser':{h.t-=dt;h.mouth=1;
        const [x1,y1,x2,y2]=hydraLaserSeg(h);
        if(!P.dead&&segDist(pcx,pcy,x1,y1,x2,y2)<LASER_W/2+18) hydraBite(h.x);
        if(Math.random()<.6){const k=Math.random();parts.push({x:x1+(x2-x1)*k,y:y1+(y2-y1)*k,vx:rand(-40,40),vy:rand(-60,-10),g:0,c:'#c8ff8a',s:rand(3,6),life:.3,max:0,t:'dot'})}
        if(h.t<=0){h.mouth=0;hydraEndAttack(h,'recover',.8)}}break;
      case 'recoverA': headTo(h,h.x,h.y+40,1.5,dt);h.mouth=approach(h.mouth,0,dt*3);h.t-=dt;
        if(h.t<=0){if(h.angry>0)h.st='angryIdle';else{h.st='recover';h.t=.8}}break;
    }
    hydraClamp(h);
    if(hydraDanger(h)){h.trail.push({x:h.x,y:h.y,a:1});if(h.trail.length>16)h.trail.shift()}
    if(!P.dead&&(h.st==='lunge'||h.st==='hold')&&overlap(hydraHeadBox(h),pb)) hydraBite(h.x);
  }
  hydraBounce(pb);
}
// poisoned pool: hurts on touch, surges in phase 2, drains once the hydra is beaten
function poisonTop(){return FLOOR-POISON_H*poisonLvl-hydraTide()}
function updatePoison(dt){
  if(B&&B.kind==='hydra'&&(B.state==='dying'||B.state==='dead')){poisonLvl=0;B.tide=0;return}
  if(bossDead){poisonLvl=approach(poisonLvl,0,dt*.45);if(B&&B.kind==='hydra')B.tide=approach(B.tide,0,dt*90)}
  else if(B&&B.kind==='hydra'&&(!arenaLocked||B.state==='sleep')){poisonLvl=approach(poisonLvl,0,dt*.6);B.tide=approach(B.tide,0,dt*90)}
  if(poisonLvl<.3||P.dead) return;
  const top=poisonTop();
  const harmless=B&&B.kind==='hydra'&&B.poisonSafe>0;
  if(Math.random()<.25) parts.push({x:rand(Math.max(ARENA_L,camX),Math.min(ARENA_R,camX+VW)),y:top+6,vx:0,vy:rand(-40,-15),g:-10,c:'rgba(190,240,110,.7)',s:rand(3,6),life:rand(.5,1),max:0,t:'puff'});
  const line=hydraTide()>0?top+10:FLOOR-4;
  if(!harmless&&P.x+P.w>ARENA_L&&P.x<ARENA_R&&P.y+P.h>=line){const pc=P.x+P.w/2,mid=(ARENA_L+ARENA_R)/2;
    hurt(pc+(pc<mid?40:-40));burst(pc,top+4,8,'#9be04a',160)}
}
function drawPoison(){
  if(poisonLvl<=.01||!ARENA_R) return;
  const L=Math.max(ARENA_L,camX-20),R=Math.min(ARENA_R,camX+VW+20); if(R<=L) return;
  const top=poisonTop(), warn=B&&B.kind==='hydra'&&(B.state==='revive'||(B.stage>=2&&poisonLvl<.98)||(B.stage>=3&&B.tide<TIDE_H-1));
  const wave=x=>top+Math.sin(time*(warn?6:2.6)+x*.045)*(warn?6:3)+Math.sin(time*4.1+x*.11)*1.5;
  const x0=Math.floor(L/16)*16;
  // opaque band at the surface, see-through below it so submerged ledges stay visible
  const gg=ctx.createLinearGradient(0,top,0,Math.max(top+30,FLOOR));
  gg.addColorStop(0,warn&&Math.sin(time*16)>0?'rgba(150,225,70,.92)':'rgba(118,196,64,.9)');gg.addColorStop(Math.min(1,26/Math.max(26,FLOOR-top)),'rgba(118,196,64,.75)');gg.addColorStop(1,'rgba(100,180,60,.5)');
  ctx.fillStyle=gg;ctx.beginPath();ctx.moveTo(L,FLOOR+4);
  for(let x=x0;x<=R+16;x+=16) ctx.lineTo(x,wave(x));
  ctx.lineTo(R+16,FLOOR+4);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#d6f58a';ctx.lineWidth=3;ctx.beginPath();
  for(let x=x0;x<=R+16;x+=16){x===x0?ctx.moveTo(x,wave(x)):ctx.lineTo(x,wave(x))}ctx.stroke();
  const depth=FLOOR-top;
  ctx.fillStyle='rgba(225,255,160,.8)';ctx.strokeStyle='rgba(60,110,30,.7)';ctx.lineWidth=1.5;
  for(let k=0;k<(warn?30:14);k++){const bx=ARENA_L+hash(k,41)*(ARENA_R-ARENA_L),ph=(time*(warn?1.6:.7)+hash(k,42))%1;if(bx<L||bx>R)continue;
    const r=2+ph*(warn?8:5);ctx.globalAlpha=1-ph;ctx.beginPath();ctx.arc(bx,FLOOR-depth*.4-ph*depth*.5,r,0,7);ctx.fill();ctx.stroke()}
  ctx.globalAlpha=1;
  const g=ctx.createLinearGradient(0,top-60,0,top);g.addColorStop(0,'rgba(170,230,90,0)');g.addColorStop(1,`rgba(170,230,90,${.22*poisonLvl})`);
  ctx.fillStyle=g;ctx.fillRect(L,top-60,R-L,60);
}
// the body is scenery in the background: drawn before the tiles, darker, and harmless
function drawHydraBody(){
  if(!B||B.kind!=='hydra'||B.state==='dead') return;
  const cx=B.x+B.w/2, by=B.y+B.h;
  const skin='#3f6f4c', dark='#2c5238', belly='#a3a674';
  ctx.save();if(B.state==='dying')ctx.translate(rand(-3,3),0);
  ctx.lineJoin='round';ctx.strokeStyle=INK;ctx.lineWidth=3;
  ctx.fillStyle=dark;for(let k=-3;k<=3;k++){const x=cx+k*40,y=by-152+k*k*6;ctx.beginPath();ctx.moveTo(x-14,y+8);ctx.lineTo(x,y-22);ctx.lineTo(x+14,y+8);ctx.closePath();ctx.fill();ctx.stroke()}
  ctx.fillStyle=skin;ctx.beginPath();ctx.moveTo(cx-172,by+10);ctx.bezierCurveTo(cx-172,by-118,cx-84,by-164,cx,by-160);ctx.bezierCurveTo(cx+84,by-164,cx+172,by-118,cx+172,by+10);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle=belly;ctx.beginPath();ctx.ellipse(cx,by-10,112,62,0,Math.PI,0);ctx.fill();
  ctx.strokeStyle='rgba(43,26,18,.35)';ctx.lineWidth=2;for(let k=1;k<5;k++){ctx.beginPath();ctx.ellipse(cx,by-10,112-k*4,62-k*14,0,Math.PI+.25,-.25);ctx.stroke()}
  ctx.fillStyle='rgba(30,50,36,.5)';for(let k=0;k<12;k++){const a=Math.PI+.25+k*.23,rx=cx+Math.cos(a)*140,ry=by-10+Math.sin(a)*120;ctx.beginPath();ctx.ellipse(rx,ry,9,6,a,0,7);ctx.fill()}
  ctx.fillStyle='rgba(60,90,80,.25)';ctx.beginPath();ctx.moveTo(cx-172,by+10);ctx.bezierCurveTo(cx-172,by-118,cx-84,by-164,cx,by-160);ctx.bezierCurveTo(cx+84,by-164,cx+172,by-118,cx+172,by+10);ctx.closePath();ctx.fill();
  ctx.restore();
}
function drawHydra(){
  const sleep=B.state==='sleep';
  ctx.lineJoin='round';
  for(const h of [...B.heads].sort((a,b)=>(a.sd===0)-(b.sd===0))) drawHydraNeck(h,'#4f8a5a');
  for(const h of B.heads) drawHydraFx(h);
  for(const h of [...B.heads].sort((a,b)=>(a.sd===0)-(b.sd===0))) drawHydraHead(h,sleep);
  for(const h of B.heads) drawHydraWarn(h);
  for(const h of B.heads) drawHydraLaser(h);
}
function drawHydraLaser(h){
  if(h.dead||(h.st!=='laserWind'&&h.st!=='laser')) return;
  const [x1,y1,x2,y2]=hydraLaserSeg(h), a=h.aa, nx=-Math.sin(a)*LASER_W/2, ny=Math.cos(a)*LASER_W/2;
  if(h.st==='laserWind'){const locked=h.t<=.45, k=locked?.55+.45*(Math.sin(time*30)>0?1:0):.35+.2*Math.sin(time*10);
    ctx.fillStyle=`rgba(150,255,90,${locked?.16:.07})`;ctx.beginPath();ctx.moveTo(x1+nx,y1+ny);ctx.lineTo(x2+nx,y2+ny);ctx.lineTo(x2-nx,y2-ny);ctx.lineTo(x1-nx,y1-ny);ctx.closePath();ctx.fill();
    ctx.strokeStyle=`rgba(120,255,70,${k})`;ctx.lineWidth=3;ctx.setLineDash([14,10]);ctx.lineDashOffset=-time*80;
    ctx.beginPath();ctx.moveTo(x1+nx,y1+ny);ctx.lineTo(x2+nx,y2+ny);ctx.moveTo(x1-nx,y1-ny);ctx.lineTo(x2-nx,y2-ny);ctx.stroke();ctx.setLineDash([]);ctx.lineDashOffset=0;
    return}
  const fl=.8+.2*Math.sin(time*50), w=LASER_W*(h.t<.12?h.t/.12:1);
  ctx.lineCap='round';
  ctx.strokeStyle=`rgba(120,255,70,${.35*fl})`;ctx.lineWidth=w*1.8;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
  ctx.strokeStyle=`rgba(150,255,90,${.85*fl})`;ctx.lineWidth=w;ctx.stroke();
  ctx.strokeStyle='rgba(240,255,220,.95)';ctx.lineWidth=w*.35;ctx.stroke();
  ctx.lineCap='butt';
  ctx.fillStyle='rgba(220,255,180,.9)';ctx.beginPath();ctx.arc(x1,y1,w*.8,0,7);ctx.fill();
}
function drawHydraFx(h){
  if(h.st==='aim'&&h.next==='snap'&&h.t<.8){const a=.12+.14*(Math.sin(time*18)*.5+.5),zh=330;
    const g=ctx.createLinearGradient(0,h.y-zh,0,h.y);g.addColorStop(0,'rgba(255,40,30,0)');g.addColorStop(1,`rgba(255,40,30,${a*2})`);
    ctx.fillStyle=g;ctx.fillRect(h.x-58,h.y-zh,116,zh);
    ctx.strokeStyle=`rgba(255,60,40,${.3+a})`;ctx.lineWidth=3;ctx.setLineDash([10,8]);ctx.strokeRect(h.x-58,h.y-zh,116,zh);ctx.setLineDash([])}
  for(let i=0;i<h.trail.length;i++){const q=h.trail[i],k=(i+1)/h.trail.length*q.a;
    ctx.fillStyle=`rgba(255,45,30,${.45*k})`;ctx.beginPath();ctx.arc(q.x,q.y,18+42*k,0,7);ctx.fill()}
  if(hydraDanger(h)){ctx.fillStyle=`rgba(255,40,30,${.3+.15*Math.sin(time*30)})`;ctx.beginPath();ctx.arc(h.x,h.y,85,0,7);ctx.fill()}
}
function drawHydraWarn(h){
  if(h.dead) return;
  const bite=h.st==='lungeWind'||(h.st==='aim'&&h.next==='snap'), spit=h.st==='spitWind'||h.st==='laserWind'||(h.st==='aim'&&h.next==='spitUp');
  if(!bite&&!spit) return;
  const urgent=h.t<.45; if(urgent&&Math.sin(time*30)<-.3) return;
  const y=h.y-(h.st==='aim'?90:100);
  ctx.font=(urgent?'38px ':'32px ')+FONT;ctx.textAlign='center';ctx.lineWidth=5;ctx.strokeStyle=INK;
  ctx.fillStyle=bite?'#ff4a2a':'#9be04a';ctx.strokeText('!',h.x,y);ctx.fillText('!',h.x,y);
}
function drawHydraNeck(h,skin){
  const cpx=h.rx+(h.x-h.rx)*.25, cpy=Math.min(h.ry,h.y)-50;
  const path=()=>{ctx.beginPath();ctx.moveTo(h.rx,h.ry);ctx.quadraticCurveTo(cpx,cpy,h.x,h.y)};
  ctx.lineCap='round';
  path();ctx.strokeStyle=INK;ctx.lineWidth=42;ctx.stroke();
  path();ctx.strokeStyle=h.flash>0?'#fff':skin;ctx.lineWidth=34;ctx.stroke();
  path();ctx.strokeStyle='rgba(208,208,140,.85)';ctx.lineWidth=10;ctx.setLineDash([12,10]);ctx.stroke();ctx.setLineDash([]);
  ctx.lineCap='butt';
}
function drawHydraHead(h,sleep){
  const f=h.face||1, fl=h.flash>0, ang=h.angry>0&&!h.dead;
  const skin=fl?'#fff':'#5f9e66', dark=fl?'#fff':'#3c6e4a';
  const up=h.st==='aim'||h.st==='snap'||h.st==='spitUp', danger=hydraDanger(h), warn=h.st==='lungeWind'&&h.t<.45;
  const ink=danger||warn?'#c81e14':h.st==='laserWind'||h.st==='laser'?'#3a9a1a':INK, lw=danger?2.8:2.1;
  ctx.save();ctx.translate(h.x,h.y);ctx.scale(f*HS,HS*(h.sinkT>0?.9:1));
  const las=h.st==='laserWind'||h.st==='laser';
  if(las) ctx.scale(Math.sign(Math.cos(h.aa))*f||1,1);
  ctx.rotate(las?Math.atan2(Math.sin(h.aa),Math.abs(Math.cos(h.aa))):up?-1.15:h.dead?.35:h.st==='lungeWind'?-.25:h.st==='spitWind'?-.3:0);
  ctx.strokeStyle=ink;ctx.lineWidth=lw;ctx.lineJoin='round';
  const m=h.mouth;
  ctx.fillStyle=dark;for(const [a,b,c] of [[-26,-10,-50],[-20,-18,-40],[-12,-22,-28]]){ctx.beginPath();ctx.moveTo(a,b+8);ctx.lineTo(c,b-10);ctx.lineTo(a+12,b);ctx.closePath();ctx.fill();ctx.stroke()}
  ctx.save();ctx.translate(-8,6);ctx.rotate(m*.6);
  ctx.fillStyle=dark;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(50,4);ctx.quadraticCurveTo(55,12,44,15);ctx.lineTo(0,13);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='#fff';for(let k=0;k<4;k++){const tx=14+k*9;ctx.beginPath();ctx.moveTo(tx,3);ctx.lineTo(tx+3,-4);ctx.lineTo(tx+6,3);ctx.fill()}
  ctx.restore();
  if(m>.1){ctx.fillStyle='#7a2436';ctx.beginPath();ctx.moveTo(-6,6);ctx.lineTo(44,4-m*6);ctx.lineTo(42,8+m*28);ctx.closePath();ctx.fill()}
  ctx.save();ctx.rotate(-m*.25);ctx.strokeStyle=ink;ctx.lineWidth=lw;
  ctx.fillStyle=skin;ctx.beginPath();ctx.moveTo(-30,6);ctx.quadraticCurveTo(-31,-26,0,-25);ctx.quadraticCurveTo(34,-21,53,-4);ctx.quadraticCurveTo(57,6,46,9);ctx.lineTo(-22,13);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='#fff';for(let k=0;k<4;k++){const tx=12+k*9;ctx.beginPath();ctx.moveTo(tx,8);ctx.lineTo(tx+3,15);ctx.lineTo(tx+6,8);ctx.fill()}
  ctx.fillStyle=INK;ctx.beginPath();ctx.arc(47,-7,1.6,0,7);ctx.fill();
  ctx.strokeStyle=INK;
  if(sleep){ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(-2,-12);ctx.quadraticCurveTo(5,-8,12,-12);ctx.stroke()}
  else if(h.dead){ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(0,-16);ctx.lineTo(10,-6);ctx.moveTo(10,-16);ctx.lineTo(0,-6);ctx.stroke()}
  else{if(ang){ctx.fillStyle=`rgba(255,70,30,${.35+.25*Math.sin(time*14)})`;ctx.beginPath();ctx.arc(5,-11,13,0,7);ctx.fill()}   // rage: burning eyes only
    ctx.fillStyle=ang?'#ff3a1a':'#ffe45c';ctx.beginPath();ctx.ellipse(5,-11,7,6,0,0,7);ctx.fill();ctx.lineWidth=1.5;ctx.stroke();
    ctx.fillStyle=INK;ctx.beginPath();ctx.ellipse(6,-11,1.8,5,0,0,7);ctx.fill();
    ctx.lineWidth=2.6;ctx.beginPath();ctx.moveTo(-8,ang?-23:-20);ctx.lineTo(16,-17);ctx.stroke()}
  ctx.restore();
  ctx.restore();
  if(h.dead&&Math.random()<.05) parts.push({x:h.x,y:h.y-20,vx:0,vy:-30,g:0,c:'rgba(255,255,255,.6)',s:4,life:.6,max:0,t:'puff'});
}
registerBoss('hydra',{spriteBox:()=>({x:B.x-330,y:B.y-320,w:B.w+660,h:B.h+320}),make:makeHydra,update:updateHydra,draw:drawHydra,burst:'#4f8a5a',nameKey:'boss3',introT:2});
