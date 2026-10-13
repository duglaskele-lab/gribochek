/* ---------- level 5: the ruined city — registration ---------- */
// Everything about level 5 lives in this folder: gen.js (generator, passability check, the barricade), draw.js
// (sky, tiles, decorations, platform styles), foes.js (the mutants, their shots, the downed power lines),
// ratking.js (the mini-boss), tank.js (the Mutank, the boss), music.js, and this file, which plugs it all in.

Object.assign(SFX,{
  squeak:()=>{tone(1800,2600,.07,'square',.03);tone(2400,1500,.09,'square',.025,.07)},
  gurgle:()=>{tone(140,220,.25,'sawtooth',.03);tone(90,160,.3,'sine',.05,.05)},
  spit:()=>{tone(600,180,.12,'sawtooth',.035);noise(2000,600,.14,.05)},
  slosh:()=>{tone(180,80,.3,'sine',.07);noise(500,150,.35,.06,0,2)},
  zap:()=>{tone(1200,300,.18,'square',.03);noise(5000,2500,.2,.06,0,1)},
  engine:()=>{tone(60,120,.7,'sawtooth',.05);tone(90,140,.7,'square',.025);noise(300,500,.7,.05,0,3)},
});

registerLevel(5,{
  biome:'city', boss:'mutank', song:'city', gen:genCity, validate:validateCity, miniboss:'ratKing',
  startY:()=>cityStartY,
  pal:{sky1:'#2a1f3f',sky2:'#5a3a5e',hill:'#46364f',hill2:'#3a2c44',dirt:'#5a4c48',dirt2:'#4a3e3a',stone:'#8f8a92',top:'#3e3e46',top2:'#55555e',sun:'rgba(0,0,0,0)'},
  dust:'rgba(190,180,185,.9)', debris:'#a8553e',
  plank:['#8a8f99','#5b6170'],   // fire escapes and broken floors: steel grating
  openRubble:true,               // a smashed brick wall shows what is behind it
  update:dt=>{updateCityWires(dt);openCityGate()}, drawBG:drawCityBG,
  drawSolid:drawCitySolid, drawBack:drawCityBack, drawThorn:drawCityThorn, drawDoor:drawCityDoor,
  exitRight:true,                // the street goes on past the Mutank's barricade to the bunker
  i18n:{
    ru:{lvlName5:'Уровень 5: разрушенный город',lvl5Desc:'Руины города · босс: Мутанк',bossShort5:'Мутанк',boss5:'Мутанк',
      fRatKing:'Крысиный король!',fMutate:'Мутанк мутирует!',fMutate2:'Мутанк в ярости!',
      next5Title:'Уровень 5: разрушенный город',next5Text:'Подземный ход выводит наверх, в мёртвый город. Над руинами клубится дым, асфальт вздыблен воронками, по улицам носятся мутанты, а из люков тянется что-то фиолетовое. Где-то впереди, говорят, есть бункер с горящим зелёным фонарём — но дорогу к нему стережёт танк, в котором поселились щупальца.',
      next5Tip:'Провода искрят по очереди: проходи, пока они молчат. Крыса приседает перед рывком, кислотник раздувается, ворона каркает. Громилу останавливают стены и машины, после удара он оглушён. Мутанк после тарана в стену или падения со стены открывает люк: тогда и бей.'},
    en:{lvlName5:'Level 5: Ruined City',lvl5Desc:'Ruined city · boss: the Mutank',bossShort5:'Mutank',boss5:'The Mutank',
      fRatKing:'the Rat King!',fMutate:'the Mutank mutates!',fMutate2:'the Mutank is furious!',
      next5Title:'Level 5: Ruined City',next5Text:'The tunnel leads up into a dead city. Smoke hangs over the ruins, the streets are torn by craters, mutants roam about and something purple reaches out of the manholes. Somewhere ahead, they say, there is a bunker with a green lamp burning, but a tank that tentacles have grown into guards the way.',
      next5Tip:'Downed power lines spark by turns: pass while they are quiet. A rat crouches before it dashes, an acid spitter swells, a crow caws. Walls and wrecked cars stop a brute cold and daze it. When the Mutank rams a wall or falls off one, its hatch opens: hit it then.'},
  },
});

registerBoss('mutank',{make:makeMutank,update:updateMutank,draw:drawMutank,hitMult:mtHitMult,contact:mtContact,spriteBox:mtSprite,
  burst:'#b57ae8',nameKey:'boss5',introT:2,camBottom:true,
  dmgMult:()=>B.state==='mutate'?.25:1});   // mutating: 75% less damage

registerEnemy('mutRat',{size:{w:46,h:30,hp:2},update:CITY_EUPD.mutRat,draw:CITY_EDRAW.mutRat,heart:.1,deathColor:'#8a7c84',
  init:e=>{e.state='idle';e.cd=RNG()},
  contact:e=>({hurt:[shrink(e,4)],stomp:e,dmg:2})});
registerEnemy('acidSpitter',{size:{w:48,h:56,hp:3},update:CITY_EUPD.acidSpitter,draw:CITY_EDRAW.acidSpitter,heart:.2,deathColor:'#9fc94a',
  init:e=>{e.state='idle';e.cd=1+RNG();e.sw=0},
  contact:e=>({hurt:[shrink(e,6)],stomp:e,dmg:2})});
registerEnemy('mutCrow',{size:{w:44,h:34,hp:2},update:CITY_EUPD.mutCrow,draw:CITY_EDRAW.mutCrow,heart:.12,deathColor:'#3a3448',
  init:e=>{e.state='perch';e.cd=RNG()},
  contact:e=>({hurt:[shrink(e,6)],stomp:e,dmg:2})});
registerEnemy('brute',{size:{w:70,h:96,hp:9},update:CITY_EUPD.brute,draw:CITY_EDRAW.brute,heart:.6,deathColor:'#8f9a7a',
  init:e=>{e.state='walk';e.cd=1+RNG()},
  blocks:bruteBlocks,   // while it roars or charges, hits from the front bounce off its arm
  contact:e=>({hurt:[shrink(e,8)],stomp:bruteHead(e),dmg:2})});
registerEnemy('tentacle',{size:{w:40,h:20,hp:3},update:CITY_EUPD.tentacle,draw:CITY_EDRAW.tentacle,heart:.25,deathColor:'#9b5bd6',
  blocks:e=>e.state==='hide'||e.state==='warn',   // the lid is down: nothing to hit
  contact:e=>e.state==='hide'||e.state==='warn'?{hurt:[],stomp:null}:{hurt:[tentBox(e)],stomp:null,dmg:2}});
registerEnemy('ratKing',{size:{w:RK_W,h:RK_H,hp:36},update:updateRatKing,draw:drawRatKing,heart:1,deathColor:'#7b6d78',
  init:e=>{e.state='sleep';e.max=e.hp;e.face=-1;e.kx0=e.x-360;e.kx1=e.x+e.w+360},
  contact:e=>({hurt:e.state==='sleep'?[]:[{x:e.x+12,y:e.y+20,w:e.w-24,h:e.h-20}],stomp:rkHead(e),dmg:2}),
  onDeath:e=>{const cx=e.x+e.w/2,cy=e.y+e.h/2;items.push({k:'power',x:cx,y:cy-20,ph:0,vy:-420,drop:true});
    for(let i=0;i<12;i++)items.push({k:'spore',x:cx+rand(-50,50),y:cy,ph:0,vy:rand(-600,-300),vx:rand(-160,160),drop:true,loot:true});
    sporeTotal+=12;shake(.5,9);sfx('boom')}});

for(const k of ['glob']) registerShot(k,{update:updateCityShot,draw:drawCityShot,deflect:true});   // a punch knocks a glob of acid away
for(const k of ['acidPool','rubbleWave']) registerShot(k,{update:updateCityShot,draw:drawCityShot});
for(const k of ['ftent','shell','mortar']) registerShot(k,{update:updateTankShot,draw:drawTankShot});

for(const k of ['pole','stump','tank','antenna','chimney','vent','pillar','liftTop','barrel','pipe','rubble','sign','billboard','scaffold','manhole','car','lamp','wire'])
  registerDecor(k,d=>drawCityDecor(k,d));
registerPlatStyle('slab',drawSlab);
registerPlatStyle('pallet',drawPallet);
registerPlatStyle('cage',drawCage);
