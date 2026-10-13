/* ---------- level 5: the ruined city ---------- */
// Open sky, a screen and a quarter tall. Streets of cracked asphalt with wrecked cars and craters full of rusty
// rebar; blocks of flats to climb floor by floor and leave over the roof; rooftops over sinkholes into the dark;
// a collapsed overpass of crumbling slabs; crane pallets and lift cages; downed power lines that spark now and then;
// manholes with purple tentacles in them; brick walls to smash. Mutants everywhere, the Rat King in a ruined plaza
// and, at the end, the Mutank between two burnt-out buildings.
// Every new kind of foe or trap first shows up on its own, somewhere calm, before it is mixed with the rest.
const CITY_B=21, CITY_RUB=22, CITY_CAR=23, CITY_JUNK=24;   // flow marks of solid tiles: building masonry, rubble, a wrecked car, the barricade
let cityStartY=null, cityWires=[], cityGate=[], cityBg=null;   // cityBg[r][c]: 1 = inside a building, 2 = basement / sewer
function genCity(seed){
  let v=null;
  for(let attempt=0;attempt<40;attempt++){buildCity(seed,attempt);v=validateCity();if(v.ok){GEN_INFO={attempt,repairs:0};return}}
  GEN_INFO={attempt:40,repairs:0,fail:v};
}
function buildCity(seed,attempt){
  LEVEL=5;BIOME='city';SEED=seed;ROWS=18;WH=ROWS*TS;FLOOR=(ROWS-2)*TS;ARENA_TRIG_Y=FLOOR-5*TS;CAM_BOT=0;
  RNG=makeRng(seed*7919+5*104729+17+attempt*15485863);
  grid=Array.from({length:ROWS},()=>new Uint8Array(MAXC));
  flow=Array.from({length:ROWS},()=>new Int8Array(MAXC));
  cityBg=Array.from({length:ROWS},()=>new Uint8Array(MAXC));
  COLS=MAXC;
  plats=[];enemies=[];items=[];checks=[];shops=[];powerSpots=[];secretZones=[];PLAN=[];trees=[];decor=[];springs=[];hiddenPlanks=false;covers=[];switches=[];ruins=[];ruinSpan=null;
  cityWires=[];cityGate=[];
  const spawns=[];
  let x=0,fl=14,progress=0,brutes=0;
  const FMIN=7,FMAX=15;   // the rows the ground keeps to
  // a column: open air above row top, solid below it (k: the flow mark of the solid part)
  const fillCol=(c,top,k=0)=>{for(let r=0;r<ROWS;r++){const s=r>=top;grid[r][c]=s?T_SOLID:T_EMPTY;flow[r][c]=s?k:0;cityBg[r][c]=0}};
  // high ground is rooftops (masonry all the way down), low ground is the street
  const run=(n,k)=>{const kk=k!==undefined?k:fl<=11?CITY_B:0;for(let i=0;i<n;i++)fillCol(x+i,fl,kk);x+=n};
  const street=()=>{if(fl<12)stepFl(12)};   // street-level segments first come down off the roofs
  const pit=c=>fillCol(c,ROWS);   // a sinkhole: no bottom
  // the ground changes height in rubble steps (2 rows at most every 2 columns)
  const stepFl=t=>{t=clamp(t,FMIN,FMAX);while(fl!==t){fl+=clamp(t-fl,-2,2);run(2,CITY_RUB)}};
  const solidAt=(c,r,k)=>{grid[r][c]=T_SOLID;flow[r][c]=k};
  const plank=(c,r,w)=>{for(let i=0;i<w;i++)if(grid[r][c+i]===T_EMPTY)grid[r][c+i]=T_PLANK};
  const spore=(c,y)=>items.push({k:'spore',x:c*TS+TS/2,y,ph:RNG()*6});
  const sporeRow=(c0,c1,r,up=30)=>{for(let c=c0;c<=c1;c++)spore(c,r*TS-up)};
  const arc=(c0,c1,y0,hgt)=>{const n=c1-c0;for(let i=1;i<n;i++){const t=i/n;spore(c0+i,y0-Math.sin(t*Math.PI)*hgt)}};
  const spawnAt=(type,c,r,props)=>spawns.push({type,c,extra:{y:r*TS},props});
  const deco=(k,c,y,dx=0)=>decor.push({k,x:c*TS+TS/2+dx,y,s:RNG()});
  const heart=(c,y)=>items.push({k:'heart',x:c*TS+TS/2,y,ph:0});
  const power=(c,y)=>{const px=c*TS+TS/2;items.push({k:'power',x:px,y,ph:0});powerSpots.push([px,y])};
  const slab=(c,r,w)=>plats.push({crumble:true,style:'slab',x:c*TS,y:r*TS,w:w*TS,h:16,x0:c*TS,x1:c*TS,vx:0,hy:r*TS,st:'idle',t:0,vy:0,rot:0});
  const maxGap=(dyT,dash,m)=>{const r=REACH.reach(dyT*TS,dash);return r<0?0:Math.floor(r*m/TS)};
  const car=c=>{for(const cc of [c,c+1])solidAt(cc,fl-1,CITY_CAR);decor.push({k:'car',x:(c+1)*TS,y:fl*TS,s:RNG(),f:RNG()<.5?-1:1})};
  // a downed power line: 'cable' lies across the street (jump over it or wait), 'arc' hangs from a broken pole and
  // sparks down to the ground (wait for it). off -> crackling warning -> sparking, each line on its own clock.
  const wire=(k,c0,w,L)=>{const off=[2.2,1.8,1.4][L];
    const o={k,x:c0*TS+(k==='arc'?TS/2:0),w:w*TS,y:fl*TS,top:k==='arc'?(fl-4)*TS+10:fl*TS-50,off,warn:.6,on:.8,t:RNG()*off,st:'off'};
    cityWires.push(o);decor.push({k:'wire',x:o.x+(k==='arc'?0:o.w/2),y:o.y,s:0,w:o});
    if(k==='arc')deco('pole',c0,fl*TS,-34);else deco('stump',c0-1,fl*TS,10)};
  // what lives where: each kind of mutant comes in at its own point of the level; until then it is not placed
  const UNLOCK={mutRat:0,mutCrow:.12,acidSpitter:.22,brute:.45};
  const seen=new Set();
  const can=t=>progress>=UNLOCK[t]&&(t!=='brute'||brutes<3);
  // a foe nobody has met yet first comes alone, in a calm street
  let calm=false;
  const foe=(t,c,r,props)=>{if(!can(t))return false;if(!seen.has(t)&&!calm)return false;seen.add(t);if(t==='brute')brutes++;spawnAt(t,c,r,props);return true};
  const lamp=(c,crow)=>{deco('lamp',c,fl*TS);if(crow)foe('mutCrow',c,fl-4,{perchX:c*TS+TS/2,perchY:fl*TS-152})};
  const startFl=fl;

  const SEG={
    // an ordinary street: a wrecked car or two, lamp posts, a mutant now and then
    street(L){street();const n=ri(10,13)+L,c0=x;run(n,0);
      if(chance(.75))car(c0+ri(3,n-5));
      if(chance(.5))lamp(c0+ri(1,3),L>0&&chance(.5));
      if(chance(.55))sporeRow(c0+1,c0+4,fl);
      if(chance(.6+L*.15))foe('mutRat',c0+ri(4,n-2),fl);if(L>0&&chance(.4))foe('acidSpitter',c0+n-2,fl)},
    // a bomb crater: down a heap of rubble, rusty rebar sticking up at the bottom, and up again
    crater(L){street();const d=L>0?3:2;if(fl+d>FMAX)stepFl(FMAX-d);run(2,0);stepFl(fl+d);const w=[2,3,3][L],c0=x;run(2,CITY_RUB);
      for(let i=0;i<w;i++){fillCol(x+i,fl,CITY_RUB);grid[fl][x+i]=T_THORN;flow[fl][x+i]=0}
      arc(c0+1,x+w+1,fl*TS-40,70);x+=w;run(2,CITY_RUB);stepFl(fl-d);run(2,0);
      if(L>0&&chance(.4))foe('mutRat',x-2,fl)},
    // downed power lines that spark now and then
    wires(L){street();const n=ri(11,13),c0=x;run(n,0);
      if(L===0)wire('cable',c0+5,2,0);
      else if(L===1){wire(chance(.5)?'cable':'arc',c0+4,2,1);if(chance(.5))foe('mutRat',c0+n-2,fl)}
      else{wire('arc',c0+3,1,2);wire('cable',c0+7,2,2);if(chance(.5))lamp(c0+n-2,true)}
      sporeRow(c0+1,c0+2,fl)},
    // a ruined block of flats: in at the door, up the broken floors (a crate on each one is a step up), out through
    // the hole in the roof and down the far side. The cracked back door is a shortcut, but the loot is upstairs.
    flats(L){const floors=L>0?3:2,FH=4;stepFl(Math.max(fl,floors*FH+4));run(2,0);
      const w=ri(10,12),c0=x,c1=x+w-1,R=fl-floors*FH;
      for(let c=c0;c<=c1;c++){fillCol(c,fl,0);for(let r=R;r<fl;r++){const wall=c===c0||c===c1||r===R;if(wall){grid[r][c]=T_SOLID;flow[r][c]=CITY_B}else cityBg[r][c]=1}}
      for(let r=fl-3;r<fl;r++){grid[r][c0]=T_EMPTY;flow[r][c0]=0;cityBg[r][c0]=1;grid[r][c1]=T_CRACKW;flow[r][c1]=0}   // the front door; the cracked back door
      const hx=c1-3;grid[R][hx]=T_EMPTY;grid[R][hx+1]=T_EMPTY;flow[R][hx]=flow[R][hx+1]=0;   // the hole in the roof
      for(let k=1;k<floors;k++){const r=fl-k*FH,gap=c0+ri(2,w-5);plank(c0+1,r,w-2);grid[r][gap]=grid[r][gap+1]=T_EMPTY;
        sporeRow(c0+2,c0+4,r)}
      for(let k=0;k<floors;k++){const r=fl-k*FH-1,cc=k===floors-1?hx:c0+ri(2,w-3);solidAt(cc,r,CITY_RUB)}   // crates to step up on
      sporeRow(c0+3,c0+w-3,R);
      if(chance(.45))heart(c0+2,(R+FH)*TS-30);else if(chance(.3))power(c0+w-3,(R+FH)*TS-60);
      if(L>0)foe('mutRat',c0+w-3,fl);
      if(L>1&&floors>2)foe('acidSpitter',c0+3,fl-FH);
      x=c1+1;run(3,0)},
    // over the rooftops: up a fire escape, roof to roof over sinkholes, down a heap of rubble
    roofs(L){const top=clamp(fl-ri(5,6),FMIN,FMAX),k=2+(L>1?1:0);stepFl(Math.max(fl,top+4));
      // the fire escape: grates on alternate sides up the side of the first building
      run(1,0);const c0=x,w=6,d=fl-top,n=Math.ceil(d/3)-1;for(let i=0;i<w;i++)fillCol(x+i,fl,0);
      for(let i=1;i<=n;i++){const r=fl-Math.round(d*i/(n+1)),right=(n-i)%2===0,c=right?c0+w-3:c0+1;plank(c,r,2);sporeRow(c,c+1,r)}
      x+=w;fl=top;run(ri(4,5),CITY_B);deco('tank',x-2,fl*TS);
      for(let j=0;j<k;j++){
        const nf=clamp(fl+pick([-1,0,0,1,2]),FMIN,FMAX),g=clamp([2,3,3][L]+(chance(.3)?1:0),2,Math.max(2,maxGap(nf-fl,false,.8)));
        for(let i=0;i<g;i++)pit(x+i);x+=g;fl=nf;const rw=ri(4,6),r0=x;run(rw,CITY_B);
        if(chance(.5))deco(pick(['antenna','chimney','vent']),r0+ri(1,rw-2),fl*TS);
        if(chance(.5))spore(r0+(rw>>1),fl*TS-30);
        if(L>0&&j===k-1&&chance(.5))foe('mutCrow',r0+1,fl-4,{perchX:(r0+1)*TS+TS/2,perchY:fl*TS-70})}
      arc(c0+w,x-1,fl*TS-40,40)},
    // the collapsed overpass: crumbling slabs over a sinkhole, with a concrete pillar halfway to catch your breath
    overpass(L){run(3,0);const f0=fl,k=2+(L>1?1:0);
      const slabs=n=>{for(let j=0;j<n;j++){const g=clamp(ri(1,2),1,Math.max(1,maxGap(0,false,.75)));for(let i=0;i<g;i++)pit(x+i);x+=g;
        const sw=L>1?1:2;for(let i=0;i<sw;i++)pit(x+i);slab(x,f0,sw);spore(x+(sw>>1),f0*TS-30);x+=sw}};
      slabs(k);for(let i=0;i<2;i++)pit(x+i);x+=2;
      for(let i=0;i<3;i++)fillCol(x+i,f0,CITY_RUB);deco('pillar',x+1,f0*TS);sporeRow(x,x+2,f0);x+=3;   // the pillar
      slabs(k);for(let i=0;i<2;i++)pit(x+i);x+=2;fl=f0;run(3,0);
      if(L>0&&chance(.4))foe('mutCrow',x-2,fl-4,{perchX:(x-2)*TS+TS/2,perchY:fl*TS-70})},
    // a crane carries pallets back and forth over a sinkhole
    crane(L){run(3,0);const f0=fl,n=L>1?2:1;
      for(let j=0;j<n;j++){const w=2,span=ri(4,5)+L,c0=x+1;for(let i=0;i<span+w+2;i++)pit(x+i);
        const r=f0-(j?1:0);plats.push({style:'pallet',x:c0*TS,y:r*TS,w:w*TS,h:16,x0:c0*TS,x1:(c0+span)*TS,vx:(RNG()<.5?-1:1)*(80+L*20)});
        spore(c0+(span>>1),r*TS-60);x+=span+w+2;
        if(j<n-1){run(3,CITY_RUB)}}
      fl=f0;run(3,0);if(L>1&&chance(.5))wire('arc',x-2,1,2)},
    // a lift cage in a ruined shaft takes you up onto a roof (or down off one)
    lift(L){const d=5,canUp=fl-d>=FMIN,canDown=fl+d<=FMAX;if(!canUp&&!canDown){run(5);return}
      const up=canUp&&(!canDown||chance(.65)),f0=fl,f1=up?f0-d:f0+d;
      run(2);const g=1,c0=x+g;for(let i=0;i<g+2+2;i++)pit(x+i);
      plats.push({style:'cage',x:c0*TS,y:f1*TS,w:2*TS,h:16,x0:c0*TS,x1:c0*TS,vx:0,y0:Math.min(f0,f1)*TS,y1:Math.max(f0,f1)*TS,vy:(f1<f0?-1:1)*(90+L*15),wt:.7});
      deco('liftTop',c0+1,Math.min(f0,f1)*TS-120,-20);spore(c0,Math.min(f0,f1)*TS-60);
      x+=g+2+2;fl=f1;run(4);
      if(L>0&&up&&chance(.4))foe('mutCrow',x-2,fl-4,{perchX:(x-2)*TS+TS/2,perchY:fl*TS-70})},
    // manholes: something purple lives down there
    sewer(L){street();const n=ri(12,14),c0=x;run(n,0);
      const m=L>1?2:1;for(let j=0;j<m;j++){spawnAt('tentacle',c0+3+j*6,fl);deco('manhole',c0+3+j*6,fl*TS)}
      sporeRow(c0+n-3,c0+n-2,fl);if(L>0&&chance(.5))foe('mutRat',c0+n-2,fl)},
    // a brick wall across the street: punch it, dash into it or throw something at it
    brickwall(L){street();const n=ri(9,11),c0=x;run(n,0);const wc=c0+ri(4,n-4),th=chance(.4)?2:1;
      for(let t=0;t<th;t++){for(let r=fl-5;r<fl;r++){grid[r][wc+t]=T_CRACKW;flow[r][wc+t]=0}for(let r=fl-9;r<fl-5;r++)solidAt(wc+t,r,CITY_B)}
      sporeRow(wc+th+1,Math.min(c0+n-2,wc+th+3),fl);if(chance(.4))heart(wc+th+1,fl*TS-30);
      if(L>0)foe(chance(.5)?'acidSpitter':'mutRat',c0+n-2,fl)},
    // a wide street where a brute roams: wrecked cars stop its charge cold
    plaza(L){street();const n=ri(16,18),c0=x;run(n,0);car(c0+3);car(c0+n-5);lamp(c0+ri(6,9),false);
      calm=true;const b=foe('brute',c0+(n>>1),fl);calm=false;if(!b)foe('mutRat',c0+(n>>1),fl);
      arc(c0+5,c0+n-6,fl*TS-40,50)},
    // a step down into a lower street
    drop(L){const nf=Math.min(FMAX,fl+ri(3,5));if(nf-fl<2){run(4);return}run(2);fl=nf;run(ri(5,7));
      if(chance(.5))foe('mutRat',x-3,fl)},
    // a breather; the shop wants a bit of room
    rest(cp,shop){street();const n=shop?12:ri(6,8),c0=x;run(n,0);
      if(shop){shops.push({x:(c0+6)*TS+TS/2,y:fl*TS});deco('barrel',c0+3,fl*TS);deco('barrel',c0+9,fl*TS)}
      if(cp){const cc=shop?c0+1:c0+n-2;checks.push({x:cc*TS+TS/2,y:fl*TS,on:false});deco('barrel',cc+1,fl*TS,10)}
      if(!shop){if(chance(.5))arc(c0+1,c0+n-2,fl*TS-30,50);if(chance(.3))heart(c0+2,fl*TS-30)}},
  };

  /* secrets: each one records a zone; entering it counts the secret as found */
  const zone=(c0,r0,w,hh)=>{const z={x:c0*TS,y:r0*TS,w:w*TS,h:hh*TS,found:false};secretZones.push(z);return z};
  const hideIn=(z,n0)=>{for(let i=n0;i<items.length;i++)items[i].hid=z};
  const prize=(cx,cy)=>{const k=wpick([['gold',4],['heart',2.5],['power',1.5]]);items.push({k,x:cx,y:cy,ph:0});if(k==='power')powerSpots.push([cx,cy])};
  const SEC={
    // a patch of the pavement is rotten: step on it and you drop into a basement
    basement(){street();if(fl>13)stepFl(13);const n0=items.length,c0=x;run(11,0);
      for(let i=1;i<=8;i++)for(const r of [fl+1,fl+2]){grid[r][c0+i]=T_FAKE;flow[r][c0+i]=0;cityBg[r][c0+i]=2}
      for(let i=3;i<=5;i++){grid[fl][c0+i]=T_FAKE;flow[fl][c0+i]=0}
      prize((c0+7)*TS+TS/2,(fl+2)*TS+12);spore(c0+1,(fl+2)*TS+16);spore(c0+2,(fl+2)*TS+16);
      hideIn(zone(c0+1,fl+1,8,2),n0)},
    // a cracked roof under a high billboard: a heavy landing breaks through into a forgotten attic
    attic(){const n0=items.length,c0=x;stepFl(Math.max(fl,13));run(2,0);
      const R=fl-3,c1=x;for(let c=c1;c<c1+9;c++){fillCol(c,R,CITY_B)}
      for(let c=c1+4;c<=c1+6;c++){grid[R][c]=T_CRACK;flow[R][c]=CITY_B}
      for(let c=c1+3;c<=c1+7;c++)for(const r of [R+1,R+2]){grid[r][c]=T_FAKE;flow[r][c]=CITY_B;cityBg[r][c]=1}
      plank(c1+1,R-3,2);plank(c1+4,R-6,2);sporeRow(c1+4,c1+5,R-6);deco('billboard',c1+5,(R-6)*TS);
      prize((c1+5)*TS+TS/2,(R+2)*TS+12);spore(c1+3,(R+2)*TS+16);spore(c1+7,(R+2)*TS+16);
      hideIn(zone(c1+3,R+1,5,2),n0);x=c1+9;fl=R;run(2,CITY_B);stepFl(fl+3)},
    // scaffolding with invisible boards: they show up only when you come close
    scaffold(){street();const n0=items.length,c0=x;run(12,0);
      deco('scaffold',c0+6,fl*TS);
      for(const [c,r,w] of [[c0+3,fl-3,2],[c0+6,fl-6,2],[c0+8,fl-9,3]]){plank(c,r,w);for(let i=0;i<w;i++)flow[r][c+i]=6}
      hiddenPlanks=true;prize((c0+9)*TS+TS/2,(fl-9)*TS-30);spore(c0+10,(fl-9)*TS-30);
      hideIn(zone(c0+8,fl-11,3,2),n0)},
  };

  /* ---- the plan ---- */
  run(12,0);deco('barrel',10,fl*TS);sporeRow(5,8,fl);
  const total=ri(18,20);
  const W={street:2.4,crater:1.6,wires:1.5,flats:1.3,roofs:1.3,overpass:1.1,crane:1,lift:1,sewer:1.3,brickwall:1.2,plaza:1,drop:1.2};
  // later arrivals: the manholes from a third of the way, the brutes' plazas from the middle
  const FROM={sewer:.3,plaza:.45,overpass:.15,crane:.2,lift:.2,roofs:.12,wires:.06};
  const secKinds=[],secPool=[['basement',1],['attic',1],['scaffold',1]],nSec=chance(.75)?2:1;
  while(secKinds.length<nSec){const k=wpick(secPool);secKinds.push(k);secPool.splice(secPool.findIndex(o=>o[0]===k),1)}
  const secretAt=new Map();
  secKinds.forEach((k,j)=>{let idx=clamp(Math.floor(total*(j+.5)/nSec)+ri(-1,1),2,total-2);while(secretAt.has(idx))idx++;secretAt.set(idx,k)});
  const kingAt=Math.floor(total*.66);
  let sinceCP=0,last='';const recent=[];
  for(let i=0;i<total;i++){
    progress=i/total;
    if(i===Math.floor(total/2)){PLAN.push({t:'shop',c:x});SEG.rest(true,true);sinceCP=0}
    else if(sinceCP>=4||i===kingAt){PLAN.push({t:'rest',c:x});SEG.rest(true,false);sinceCP=0}
    if(i===kingAt){PLAN.push({t:'miniboss',k:'ratKing',c:x});ratPlaza();sinceCP=1;continue}
    if(secretAt.has(i)){const k=secretAt.get(i);PLAN.push({t:'secret:'+k,c:x});SEC[k]()}
    const L=progress<.25?0:progress<.6?(chance(.75)?1:0):(chance(.7)?2:1);
    const cands=[];
    for(const ty in W){if(ty===last)continue;let w=W[ty];
      if(FROM[ty]&&progress<FROM[ty])continue;
      if(recent.slice(-3).indexOf(ty)>=0)w*=.35;
      if(ty==='drop')w*=fl<=10?2:.4;
      if(ty==='drop'&&fl+3>FMAX)w=0;
      if(ty==='plaza'&&brutes>=3)w*=.2;
      if(w>0)cands.push([ty,w])}
    // the first manhole and the first plaza come as soon as they are allowed
    let ty=wpick(cands);
    let LL=L;
    if(progress>=FROM.sewer&&!PLAN.some(q=>q.t==='sewer')&&last!=='sewer'){ty='sewer';LL=0}   // the first manhole: on its own
    else if(progress>=FROM.plaza&&!PLAN.some(q=>q.t==='plaza')&&last!=='plaza')ty='plaza';
    const n0=spawns.length;PLAN.push({t:ty,L:LL,c:x,fl});SEG[ty](LL);
    // the first meeting with a new mutant: alone, at the end of a stretch with nobody else in it
    // (the brute makes its entrance in a plaza of its own)
    const fresh=Object.keys(UNLOCK).find(t=>t!=='brute'&&can(t)&&!seen.has(t));
    if(fresh&&spawns.length===n0&&grid[fl][x-2]===T_SOLID){calm=true;if(fresh==='mutCrow')lamp(x-2,true);else foe(fresh,x-2,fl);calm=false}last=ty;recent.push(ty);sinceCP++;
  }
  // the Rat King's plaza: heaps of rubble at both ends, drain pipes the rats come out of
  function ratPlaza(){if(fl<11)stepFl(11);run(2,0);stepFl(fl-2);run(2,CITY_RUB);stepFl(fl+2);
    const n=18,c0=x;run(n,0);deco('pipe',c0,fl*TS);deco('pipe',c0+n-1,fl*TS);
    car(c0+n-6);
    spawnAt('ratKing',c0+(n>>1),fl,{kx0:c0*TS,kx1:(c0+n)*TS});
    heart(c0+2,fl*TS-30);x=c0+n;stepFl(fl-2);run(2,CITY_RUB);stepFl(fl+2);run(2,0)}

  // a checkpoint and the last shop right before the boss
  stepFl(12);PLAN.push({t:'final',c:x});SEG.rest(true,true);run(3,0);
  /* ---- the Mutank's street: between two burnt-out buildings ----
     In through the archway of the left building (its facade is the left wall of the arena), the right building closes
     the far end; a pile of wrecked cars blocks the street out until the tank is beaten. A steel girder spans the top. */
  const fr=ROWS-2;stepFl(FMAX);fl=fr;run(2,0);
  const lb=x;for(let c=lb;c<lb+3;c++){fillCol(c,fr,0);for(let r=2;r<fr-3;r++)solidAt(c,r,CITY_B);for(let r=fr-3;r<fr;r++)cityBg[r][c]=1}
  x=lb+3;const a0=x,AW=24;ARENA_L=a0*TS;
  for(let c=a0;c<a0+AW;c++)fillCol(c,fr,0);
  heart(a0+4,fr*TS-30);
  ARENA_R=(a0+AW)*TS;
  const rb=a0+AW;for(let c=rb;c<rb+3;c++){fillCol(c,fr,0);for(let r=2;r<fr;r++)solidAt(c,r,CITY_B)}
  for(let r=fr-3;r<fr;r++)for(let c=rb;c<rb+3;c++){flow[r][c]=CITY_JUNK;cityGate.push([r,c])}   // the barricade
  const e0=rb+3,EW=20;x=e0;fl=fr;run(EW,0);sporeRow(e0+3,e0+8,fr);
  COLS=e0+EW+2;for(let c=e0+EW;c<COLS;c++)fillCol(c,fr-8,CITY_B);
  door={x:(e0+EW-6)*TS,y:FLOOR-104,w:76,h:104};
  /* ---- dressing: lamp posts, rubble, burnt barrels along the streets ---- */
  const safe=[...checks.map(q=>q.x/TS),...shops.map(q=>q.x/TS)];
  for(let c=14;c<a0-4;c++){const r=topRow(c);if(r<0||flow[r][c]===CITY_CAR||grid[r][c]!==T_SOLID||grid[r-1][c]!==T_EMPTY||grid[r-2][c]!==T_EMPTY||safe.some(q=>Math.abs(q-c)<2))continue;
    if(decor.some(d=>Math.abs(d.x-(c*TS+TS/2))<TS*1.5))continue;
    if(chance(.07))deco('rubble',c,r*TS,ri(-8,8));else if(chance(.04))deco(flow[r][c]===CITY_B?'vent':'sign',c,r*TS,ri(-8,8))}
  for(const sp of spawns){if(sp.c<16||safe.some(q=>Math.abs(q-sp.c)<4))continue;const e=makeEnemy(sp.type,sp.c,sp.extra);if(e){if(sp.props)Object.assign(e,sp.props);enemies.push(e)}}
  cityStartY=startFl*TS;
  sporeTotal=items.filter(i=>i.k==='spore').length;
  B=makeBoss();
  function topRow(c){for(let r=0;r<ROWS;r++)if(grid[r][c]!==T_EMPTY)return r;return -1}
}
// Passability: brick walls with cracks count as open (punch, dash or a thrown mushroom smash them); open sky above.
function validateCity(){
  const saved=[];
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(grid[r][c]===T_CRACKW){saved.push([r,c]);grid[r][c]=T_EMPTY}
  try{return graphCheck(cityStartY,Math.floor(ARENA_L/TS),true)}finally{for(const [r,c] of saved)grid[r][c]=T_CRACKW}
}
// the barricade of wrecked cars at the end of the Mutank's street is blown away once the tank is beaten
function openCityGate(){
  if(!cityGate.length||!bossDead) return;
  for(const [r,c] of cityGate){grid[r][c]=T_EMPTY;flow[r][c]=0;burst(c*TS+TS/2,r*TS+TS/2,8,'#8a8f99',260,1200,[4,8]);dust(c*TS+TS/2,r*TS+TS/2,3)}
  cityGate=[];sfx('boom');shake(.4,8);
}
