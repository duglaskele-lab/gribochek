/* ---------- level 4: ice cave — registration ---------- */
// Everything about level 4 lives in this folder: gen.js (generator + passability check + snow), draw.js (tiles,
// background, decorations), foes.js (ice slime, ice golem, snow witch and their projectiles), snowman.js (the boss),
// music.js, and this file, which plugs it all into the engine.

Object.assign(SFX,{
  breath:()=>{tone(1800,600,.5,'sawtooth',.012);tone(420,200,.5,'triangle',.03)},
  shatter:()=>{tone(2200,900,.12,'square',.03);tone(1600,500,.2,'triangle',.04,.03)},
  flake:()=>{tone(1200,2400,.18,'sine',.04);tone(1800,900,.25,'triangle',.025,.06)},
  witch:()=>{tone(700,1300,.18,'triangle',.035);tone(1300,600,.25,'square',.02,.12)},
});

registerLevel(4,{
  biome:'ice', boss:'snowman', song:'ice', gen:genIce, validate:validateIce,
  roof:true,                   // rock above row 0: the skylights can't be used to leave the cave
  startY:()=>startY,           // the start floor is generated, not at a fixed row
  pal:{sky1:'#1d2a44',sky2:'#2f4566',hill:'#3b4a66',hill2:'#2b3a55',dirt:'#4b5d7c',dirt2:'#3b4a66',stone:'#6d84a6',top:'#eef6ff',top2:'#c8dcf0',sun:'rgba(0,0,0,0)'},
  dust:'rgba(225,240,255,.9)', debris:'#bfe6fa', breakSfx:'shatter',
  plank:['#cdeefc','#8cc3e3'], thorn:'#d4f1ff',
  openRubble:true,             // smashed crystal walls show the cave behind, not dark earth
  update:dt=>{updateSnow(dt);openIceGate()}, drawBG:drawIceBG,
  exitRight:true,              // the level goes on past the boss hall: the camera may follow once the boss is beaten drawSolid:drawIceSolid, drawBack:drawSkylights,
  // glassy frozen floor: very slippery; clear ice blocks: a little
  floorControl:p=>{const iu=iceUnder(p);return iu===2?{acc:760,dec:250,maxv:1.15}:iu===1?{acc:1700,dec:950}:null},
  // sparkles fly from under her feet while she slides on the glassy floor
  onPlayerMove:(p,dir)=>{
    if(p.onGround&&Math.abs(p.vx)>90&&(!dir||dir*p.vx<0)&&iceUnder(p)===2&&Math.random()<.45)
      parts.push({x:p.x+p.w/2+rand(-10,10),y:p.y+p.h-2,vx:-p.vx*.2+rand(-30,30),vy:rand(-90,-20),g:500,c:Math.random()<.5?'#ffffff':'#bfe8ff',s:rand(2,4),life:rand(.2,.4),max:0,t:'dot'});
  },
  i18n:{
    ru:{lvlName4:'Уровень 4: ледяная пещера',lvl4Desc:'Ледяная пещера · босс: злой снеговик',bossShort4:'Снеговик',boss4:'Злой снеговик',fArm:'закрылся рукой!',fPhase2s:'снеговик в ярости!',
      next4Title:'Уровень 4: ледяная пещера',next4Text:'За дверью — холод. Ход уводит под землю, в ледяную пещеру: гладкий лёд под ногами, хрустальные стены, ледяные глыбы над пропастями, а кое-где высоко-высоко в своде видно небо и падает снег. Здесь прыгают ледяные слизни, бродят огромные ледяные големы и летают снежные ведьмы, а в конце ждёт злой снеговик.',next4Tip:'На гладком льду трудно остановиться — тормози заранее. Хрустальные стены разбиваются ударом, рывком или грибом. Голем после нескольких ударов закрывается рукой с той стороны — бей с другой или прыгай ему на голову, но не задерживайся там. Снежинку ведьмы кулаком не отбить — уворачивайся.'},
    en:{lvlName4:'Level 4: Ice Cave',lvl4Desc:'Ice cave · boss: grumpy snowman',bossShort4:'Snowman',boss4:'Grumpy Snowman',fArm:'arm up!',fPhase2s:'the snowman is furious!',
      next4Title:'Level 4: Ice Cave',next4Text:'Beyond the door it turns cold. The path leads underground into an ice cave: glassy ice underfoot, crystal walls, blocks of ice over deep chasms, and here and there the sky shows far up through the roof and snow drifts down. Ice slimes hop about, huge ice golems stomp around and snow witches fly, and a grumpy snowman waits at the end.',next4Tip:'It is hard to stop on glassy ice, so brake early. Crystal walls break with a punch, a dash or a mushroom. After a few hits a golem raises an arm on that side: hit the other side or jump on its head, but don’t stay up there. A witch’s snowflake can’t be punched away, so dodge it.'},
  },
});

registerBoss('snowman',{onHit:smOnHit,make:makeSnowman,update:updateSnowman,draw:drawSnowman,hitMult:smHitMult,contact:smContact,
  burst:'#eef6ff',nameKey:'boss4',introT:1.8,camBottom:true,
  dmgMult:()=>B.state==='split'||B.state==='headThrow'?.25:1});   // falling apart (split, head throw): 75% less damage

registerEnemy('iceSlime',{size:{w:62,h:46,hp:3},update:ICE_EUPD.iceSlime,draw:ICE_EDRAW.iceSlime,heart:.15,deathColor:'#9fdcf5',
  init:e=>{e.bcd=2+RNG()*4;e.t=.4+RNG();e.breathK=0},
  contact:e=>{const hb=[shrink(e,5)];if(e.state==='breath')hb.push(slimeBreathBox(e));return{hurt:hb,stomp:e,dmg:2}}});
registerEnemy('iceGolem',{size:{w:84,h:118,hp:11},update:ICE_EUPD.iceGolem,draw:ICE_EDRAW.iceGolem,heart:.7,deathColor:'#bfe6fa',
  init:e=>{e.state='walk';e.hits=0;e.guardN=3+Math.floor(RNG()*3);e.guard=0;e.gside=1;e.hh=0;e.hhN=2+Math.floor(RNG()*2);e.aboveT=0;e.cd=1+RNG()},
  contact:e=>{const hb=[shrink(e,10)];if(e.state==='upper'&&e.t>.12)hb.push(golemUpperBox(e));if(e.state==='slam'&&e.t>.45)hb.push(golemSlamBox(e));return{hurt:hb,stomp:golemHead(e),dmg:2}},
  blocks:golemBlocks, onHit:golemHit,
  onStomp:e=>{e.hh++}});   // too many stomps on its head and it punches straight up
registerEnemy('iceWitch',{size:{w:40,h:56,hp:4},update:ICE_EUPD.iceWitch,draw:ICE_EDRAW.iceWitch,heart:.4,deathColor:'#4b56b0',
  init:e=>{e.hx=e.x;e.hy=e.y;e.state='hover';e.ph=RNG()*6;e.side=RNG()<.5?-1:1;e.cd=1.2+RNG();e.tilt=0},
  contact:e=>({hurt:[shrink(e,6)],stomp:e,dmg:2})});

for(const k of ['iwave','flake','icicle']) registerShot(k,{update:updateIceShot,draw:drawIceShot});
registerShot('snowball',{update:updateIceShot,draw:drawIceShot,deflect:true});   // the snowman's snowballs can be punched away

registerDecor('icicle',d=>drawIcicle(d.x,d.y,d.s));
registerDecor('crystal',d=>drawCrystal(d.x,d.y,d.s));
registerDecor('snow',d=>drawSnowDrift(d.x,d.y,d.s));
registerPlatStyle('ice',(pl,w)=>{   // a slab of ice with a fringe of icicles under it
    ctx.fillStyle='#cdeefc';ctx.beginPath();ctx.roundRect(-w/2,-8,w,16,6);ctx.fill();ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.8)';ctx.fillRect(-w/2+6,-5,w-12,3);
    ctx.strokeStyle='rgba(43,60,90,.55)';ctx.lineWidth=1.6;ctx.beginPath();for(let k=0;k<w/34;k++){const cx=-w/2+16+k*34;ctx.moveTo(cx,-8);ctx.lineTo(cx+5,-1);ctx.lineTo(cx-1,8)}ctx.stroke();
    ctx.fillStyle='#cdeefc';ctx.strokeStyle=INK;ctx.lineWidth=1.5;for(let k=0;k<w/20;k++){const ix=-w/2+8+k*20;ctx.beginPath();ctx.moveTo(ix-3,8);ctx.lineTo(ix,15+hash(k,3)*6);ctx.lineTo(ix+3,8);ctx.fill();ctx.stroke()}
});
