/* ---------- level 4: ice cave ---------- */
// A screen and a half tall and carved out of solid rock. The passage winds up and down, opens into high halls,
// pinches into crawlways and turns into little dead-end nooks. Frozen floors are glassy (flow ICE_F: very slippery),
// clear ice blocks float as stepping stones (flow ICE_B: a little slippery), crystal walls have to be smashed.
// In a few places the roof is open to the sky far above: daylight and snow fall in, but it is much too high to climb out.
const ICE_F=11, ICE_B=12;
let skylights=[], startY=null, iceCeil=0, iceGate=[];   // iceGate: the ice wall that closes the hall until the snowman is beaten
function genIce(seed){
  let v=null;
  for(let attempt=0;attempt<40;attempt++){buildIce(seed,attempt);v=validateIce();if(v.ok){GEN_INFO={attempt,repairs:0};return}}
  GEN_INFO={attempt:40,repairs:0,fail:v};
}
function buildIce(seed,attempt){
  LEVEL=4;BIOME='ice';SEED=seed;ROWS=22;WH=ROWS*TS;FLOOR=(ROWS-2)*TS;ARENA_TRIG_Y=FLOOR-5*TS;CAM_BOT=0;
  RNG=makeRng(seed*7919+4*104729+17+attempt*15485863);
  grid=Array.from({length:ROWS},()=>new Uint8Array(MAXC).fill(T_SOLID));
  flow=Array.from({length:ROWS},()=>new Int8Array(MAXC));
  COLS=MAXC;
  plats=[];enemies=[];items=[];checks=[];shops=[];powerSpots=[];secretZones=[];PLAN=[];trees=[];decor=[];springs=[];hiddenPlanks=false;covers=[];switches=[];ruins=[];ruinSpan=null;skylights=[];
  const spawns=[];
  let x=0,fl=15,H=5,progress=0,golems=0,witches=0;
  const FMIN=8,FMAX=17;   // floor rows the passage keeps to
  const carve=(c,top,bot)=>{for(let r=Math.max(0,top);r<=Math.min(ROWS-1,bot);r++){grid[r][c]=T_EMPTY;flow[r][c]=0}};
  const colAt=(c,h)=>carve(c,fl-h,fl-1);
  // rough ceilings only ever get higher, so they never block a jump
  const run=(n,h=H,rough=true)=>{for(let i=0;i<n;i++)colAt(x+i,h+(rough&&h>=4&&chance(.3)?1:0));x+=n};
  const stepFl=(t,h=H)=>{t=clamp(t,FMIN,FMAX);while(fl!==t){fl+=clamp(t-fl,-2,2);run(2,h)}};
  const iceFloor=(c0,n)=>{for(let c=c0;c<c0+n;c++)if(grid[fl][c]===T_SOLID&&grid[fl-1][c]===T_EMPTY)flow[fl][c]=ICE_F};
  const iceBlock=(c,r,w)=>{for(let i=0;i<w;i++){grid[r][c+i]=T_SOLID;flow[r][c+i]=ICE_B}};
  const plank=(c,r,w)=>{for(let i=0;i<w;i++)if(grid[r][c+i]===T_EMPTY)grid[r][c+i]=T_PLANK};
  const pit=(c,top)=>carve(c,top,ROWS-1);   // a bottomless chasm column
  const spore=(c,y)=>items.push({k:'spore',x:c*TS+TS/2,y,ph:RNG()*6});
  const sporeRow=(c0,c1,r,up=30)=>{for(let c=c0;c<=c1;c++)spore(c,r*TS-up)};
  const arc=(c0,c1,y0,hgt)=>{const n=c1-c0;for(let i=1;i<n;i++){const t=i/n;spore(c0+i,y0-Math.sin(t*Math.PI)*hgt)}};
  const spawnAt=(type,c,r)=>spawns.push({type,c,extra:{y:r*TS}});
  const deco=(k,c,y,dx=0)=>decor.push({k,x:c*TS+TS/2+dx,y,s:RNG()});
  const heart=(c,y)=>items.push({k:'heart',x:c*TS+TS/2,y,ph:0});
  const power=(c,y)=>{const px=c*TS+TS/2;items.push({k:'power',x:px,y,ph:0});powerSpots.push([px,y])};
  const crumbIce=(c,r,w)=>plats.push({crumble:true,style:'ice',x:c*TS,y:r*TS,w:w*TS,h:16,x0:c*TS,x1:c*TS,vx:0,hy:r*TS,st:'idle',t:0,vy:0,rot:0});
  const maxGap=(dyT,dash,m)=>{const r=REACH.reach(dyT*TS,dash);return r<0?0:Math.floor(r*m/TS)};
  // crumbling slabs over a bottomless chasm along a path: each step is [gap in tiles, change of row, slab width].
  // The gaps are kept within an easy jump (no dash needed). Returns the row of the last slab.
  const slabs=(top,r0,steps)=>{let r=r0;for(const [g0,dr,w] of steps){const nr=r+dr;
      const g=clamp(g0,1,Math.max(1,maxGap(nr-r,false,.75)));for(let i=0;i<g;i++)pit(x+i,top);x+=g;
      for(let i=0;i<w;i++)pit(x+i,top);crumbIce(x,nr,w);spore(x+(w>>1),nr*TS-30);x+=w;r=nr}
    return r};
  // over a bottomless chasm open to the sky (it snows into it): a path of stops - ice blocks, crumbling slabs and
  // lifts - to a ledge on the far side. stop: {k:'block'|'crumb'|'lift', g: gap before it, w, r (row; lift: from -> to)}
  const liftIce=(c,w,ra,rb,sp)=>{const y0=Math.min(ra,rb)*TS,y1=Math.max(ra,rb)*TS;
    plats.push({style:'ice',x:c*TS,y:rb*TS,w:w*TS,h:16,x0:c*TS,x1:c*TS,vx:0,y0,y1,vy:(rb<ra?-1:1)*sp,wt:.7})};
  const skyRun=(stops,nf,L)=>{run(2,H);const c0=x,todo=[];let r=fl,cx=x;
    for(const st of stops){const land=st.k==='lift'?st.from:st.r;
      const g=clamp(st.g,1,Math.max(1,maxGap(land-r,false,.72)));cx+=g;const at=cx;
      todo.push(()=>{if(st.k==='block')iceBlock(at,st.r,st.w);else if(st.k==='crumb')crumbIce(at,st.r,st.w);else liftIce(at,st.w,st.from,st.to,st.sp||85+L*15);
        spore(at+(st.w>>1),(st.k==='lift'?Math.min(st.from,st.to):st.r)*TS-30)});
      cx+=st.w;r=st.k==='lift'?st.to:st.r}
    cx+=clamp(2,1,Math.max(1,maxGap(nf-r,false,.72)));
    for(let c=c0;c<cx;c++)carve(c,0,ROWS-1);skylights.push({x0:c0*TS,x1:cx*TS,fy:WH,acc:0});
    for(const f of todo)f();
    x=cx;fl=nf;run(4,H);return c0};
  const landOn=(top,r,nf)=>{const g=clamp(2,1,Math.max(1,maxGap(nf-r,false,.75)));for(let i=0;i<g;i++)pit(x+i,top);x+=g;fl=nf};
  // strong but few: at most three golems and three witches in the whole cave
  const golemOK=()=>golems<3&&progress>.12, witchOK=()=>witches<3&&progress>.1;
  const startFl=fl;

  const SEG={
    // a winding tunnel; sometimes it pinches down to a crawlway in the middle
    tunnel(L){const n=ri(8,11)+L,c0=x,pinch=chance(.45);
      for(let i=0;i<n;i++){colAt(x,pinch&&i>=3&&i<n-3?3:H+(chance(.3)?1:0));x++}
      if(chance(.6))sporeRow(c0+2,c0+n-3,fl,pinch?24:30);
      if(!pinch&&chance(.3))iceFloor(c0+2,n-4);
      if(!pinch&&L>0&&golemOK()&&chance(.28)){spawnAt('iceGolem',c0+(n>>1),fl);golems++}
      else if(chance(.5+L*.15))spawnAt('iceSlime',c0+ri(3,n-3),fl)},
    // a high hall: low ice blocks at the sides, higher ones above them; the middle is free for a big foe
    hall(L){const hh=ri(9,10);stepFl(Math.max(fl,hh+2));const n=ri(15,18),c0=x;run(n,hh);
      iceBlock(c0+1,fl-3,2);iceBlock(c0+n-3,fl-3,2);
      const ua=c0+4,ub=c0+n-6;iceBlock(ua,fl-6,2);iceBlock(ub,fl-6,2);sporeRow(ua,ua+1,fl-6);sporeRow(ub,ub+1,fl-6);
      const mid=c0+(n>>1);
      if(L>0&&golemOK()&&chance(.6)){spawnAt('iceGolem',mid,fl);golems++}
      else if(witchOK()&&chance(.7)){spawnAt('iceWitch',mid,fl-5);witches++}
      if(chance(.45))spawnAt('iceSlime',c0+ri(2,4),fl);
      if(chance(.35))heart(ua,(fl-6)*TS-30);else if(chance(.25))power(ub,(fl-6)*TS-60);
      arc(c0+6,c0+n-7,fl*TS-40,60)},
    // a frozen run: the floor is glassy ice and a pit of ice spikes waits at the far end
    slide(L){const hh=Math.max(H,5),n=ri(8,11)+L*2,c0=x;run(n,hh);iceFloor(c0,n);
      const w=[2,3,3][L]+(L>1&&chance(.5)?1:0);
      for(let i=0;i<w;i++){colAt(x+i,hh);grid[fl][x+i]=T_THORN;flow[fl][x+i]=0}
      arc(c0+n-2,x+w+1,fl*TS-40,70);x+=w;const c1=x;run(5,hh);if(L>1)iceFloor(c1,2);
      if(L>0&&chance(.6))spawnAt('iceSlime',c0+ri(2,n-3),fl)},
    // a bottomless chasm crossed on floating blocks of ice
    chasm(L){const hh=Math.max(H,7);stepFl(Math.max(fl,hh+2));run(2,hh);const top=fl-hh;
      const k=ri(3,4)+(L>1?1:0);let r=fl;
      for(let j=0;j<k;j++){
        const nr=clamp(r+pick([-2,-1,0,1,1]),fl-3,fl+1),w=L>1?1:ri(1,2);
        const g=clamp(ri(2,3)+(L>1?1:0),1,Math.max(1,maxGap(nr-r,L>1,.78)));
        for(let i=0;i<g;i++)pit(x+i,top);x+=g;
        for(let i=0;i<w;i++){pit(x+i,top);iceBlock(x+i,nr,1)}
        spore(x,nr*TS-30);x+=w;r=nr}
      const g=clamp(2+(L>1?1:0),1,Math.max(1,maxGap(fl-r,L>1,.78)));for(let i=0;i<g;i++)pit(x+i,top);x+=g;
      run(4,hh);if(L>0&&witchOK()&&chance(.35)){spawnAt('iceWitch',x-6,fl-5);witches++}},
    // crumbling slabs of ice over a chasm: they crack under your feet and drop away
    iceBridge(L){const hh=Math.max(H,6);stepFl(Math.max(fl,hh+2));run(2,hh);const top=fl-hh,n=ri(8,10)+L*2;
      for(let i=0;i<n;i++)pit(x+i,top);
      for(let i=1;i<n-1;i+=3)crumbIce(x+i,fl,Math.min(2,n-1-i));
      arc(x,x+n-1,fl*TS-40,50);x+=n;run(4,hh)},
    // chasms under an open roof, with snow falling in: lifts, ice blocks and crumbling slabs at different heights
    skyLiftUp(L){stepFl(clamp(fl,FMIN+5,FMAX));const f0=fl;
      skyRun([{k:'crumb',g:2,w:2,r:f0},{k:'lift',g:1,w:2,from:f0,to:f0-4}],f0-4,L);
      if(L>0&&witchOK()&&chance(.35)){spawnAt('iceWitch',x-8,fl-4);witches++}},
    skyLiftDown(L){stepFl(clamp(fl,FMIN,FMAX-5));const f0=fl;
      skyRun([{k:'block',g:2,w:2,r:f0-1},{k:'lift',g:1,w:2,from:f0-1,to:f0+3},{k:'crumb',g:2,w:L>1?1:2,r:f0+3}],f0+4,L)},
    skyStones(L){stepFl(clamp(fl,FMIN+3,FMAX));const f0=fl,n=L>1?1:2;
      skyRun([{k:'block',g:2,w:3,r:f0-1},{k:'crumb',g:2,w:n,r:f0-2},{k:'block',g:2,w:2,r:f0-3},{k:'crumb',g:2,w:n,r:f0-1},{k:'crumb',g:1,w:n,r:f0}],f0,L);
      if(L>0&&chance(.45))spawnAt('iceSlime',x-2,fl)},
    skyTwinLifts(L){stepFl(clamp(fl,FMIN+4,FMAX-1));const f0=fl;
      skyRun([{k:'lift',g:2,w:2,from:f0,to:f0-3},{k:'crumb',g:2,w:2,r:f0-3},{k:'lift',g:2,w:2,from:f0-3,to:f0+1,sp:110+L*15}],f0+1,L);
      if(L>0&&witchOK()&&chance(.3)){spawnAt('iceWitch',x-7,fl-4);witches++}},
    skyCrumbClimb(L){stepFl(clamp(fl,FMIN+4,FMAX));const f0=fl,w=L>1?1:2;
      skyRun([{k:'crumb',g:2,w,r:f0-1},{k:'crumb',g:2,w,r:f0-2},{k:'crumb',g:2,w,r:f0-3},{k:'block',g:2,w:3,r:f0-4},{k:'crumb',g:2,w,r:f0-3},{k:'crumb',g:2,w,r:f0-2}],f0-1,L);
      if(L>0&&witchOK()&&chance(.35)){spawnAt('iceWitch',x-9,fl-5);witches++}},
    skyGauntlet(L){stepFl(clamp(fl,FMIN+4,FMAX));const f0=fl;
      skyRun([{k:'crumb',g:2,w:2,r:f0},{k:'lift',g:1,w:2,from:f0,to:f0-3},{k:'block',g:2,w:2,r:f0-3},{k:'crumb',g:2,w:1,r:f0-2},{k:'crumb',g:2,w:1,r:f0-1},{k:'crumb',g:2,w:1,r:f0}],f0,L);
      if(L>0&&chance(.4))spawnAt('iceSlime',x-2,fl)},
    // crumbling-slab trials: stairs up, stairs down, a zigzag and a long bridge with a safe ice island halfway
    crumbStairs(L){const hh=6,k=3+(L>1?1:0);stepFl(clamp(fl,FMIN+k+1,FMAX),hh);run(2,hh);const top=fl-k-1-hh;
      const r=slabs(top,fl,Array.from({length:k},()=>[ri(1,2),-1,L>1?1:2]));landOn(top,r,r-1);run(4,hh)},
    crumbDrop(L){const hh=6,k=3+(L>1?1:0);stepFl(clamp(fl,FMIN,FMAX-k-1),hh);run(2,hh);const top=fl-hh;
      const r=slabs(top,fl,Array.from({length:k},()=>[ri(1,2),1,L>1?1:2]));landOn(top,r,r+1);run(4,hh);
      if(chance(.4))spawnAt('iceSlime',x-2,fl)},
    crumbZig(L){const hh=6,up=L>0?2:1;stepFl(clamp(fl,FMIN+up,FMAX),hh);run(2,hh);const top=fl-up-hh,f0=fl,k=4+L;
      const r=slabs(top,fl,Array.from({length:k},(_,i)=>[ri(1,2),i%2?up:-up,L>1?1:2]));landOn(top,r,f0);run(4,hh)},
    crumbIsle(L){const hh=6;stepFl(Math.max(fl,hh+2),hh);run(2,hh);const top=fl-hh,f0=fl,k=2+L;
      slabs(top,fl,Array.from({length:k},()=>[ri(1,2),0,2]));
      for(let i=0;i<2;i++)pit(x+i,top);x+=2;iceBlock(x,f0,3);for(let i=0;i<3;i++)carve(x+i,top,f0-1);   // a solid island to catch your breath
      for(let i=0;i<3;i++)for(let rr=f0+1;rr<ROWS;rr++){grid[rr][x+i]=T_EMPTY;flow[rr][x+i]=0}
      sporeRow(x,x+2,f0);x+=3;
      slabs(top,f0,Array.from({length:k},()=>[ri(1,2),0,L>1?1:2]));landOn(top,f0,f0);run(4,hh);
      if(L>0&&witchOK()&&chance(.4)){spawnAt('iceWitch',x-8,f0-5);witches++}},
    // going up: a shaft with ice ledges on alternate sides
    climb(L){const rise=ri(4,6)+(L>1?1:0),nf=Math.max(FMIN,fl-rise);if(fl-nf<3){run(4);return}
      const w=ri(6,7),c0=x,d=fl-nf,k=Math.ceil(d/3)-1;
      for(let i=0;i<w;i++)carve(x+i,nf-H,fl-1);
      for(let i=1;i<=k;i++){const r=fl-Math.round(d*i/(k+1)),right=(k-i)%2===0,c=right?c0+w-3:c0+1;iceBlock(c,r,2);sporeRow(c,c+1,r)}
      x+=w;fl=nf;run(4);
      if(L>0&&witchOK()&&chance(.3)){spawnAt('iceWitch',c0+(w>>1),nf-1);witches++}},
    // going down: the floor drops away into a lower passage
    descent(L){const nf=Math.min(FMAX,fl+ri(3,6));if(nf-fl<2){run(4);return}
      run(2);const w=ri(2,3),c0=x;for(let i=0;i<w;i++)carve(x+i,fl-H,nf-1);
      for(let r=fl+1;r<nf;r+=2)spore(c0+(w>>1),r*TS);x+=w;fl=nf;run(ri(5,7));
      if(chance(.5))spawnAt('iceSlime',x-3,fl)},
    // the passage snakes down and back up in tight bends
    snake(L){const hh=chance(.5)?3:4,amp=ri(2,3),c0=x;
      const seq=[];for(let i=0;i<amp;i++)seq.push(1);seq.push(0);for(let i=0;i<amp;i++)seq.push(-1);seq.push(0);
      if(fl+amp>FMAX)for(let i=0;i<seq.length;i++)seq[i]=-seq[i];
      for(const d of seq){fl=clamp(fl+d,FMIN,FMAX);run(2,hh,false);if(chance(.6))spore(x-1,fl*TS-24)}
      if(L>0&&hh>3&&chance(.5))spawnAt('iceSlime',c0+2*amp+1,fl)},
    // a crystal wall seals the passage: punch it, dash into it or throw a mushroom to smash it
    crystal(L){const n=ri(9,12),c0=x;run(n);const wc=c0+ri(3,n-5),th=chance(.4)?2:1;
      for(let t=0;t<th;t++)for(let r=0;r<fl;r++)if(grid[r][wc+t]===T_EMPTY)grid[r][wc+t]=T_CRACKW;
      sporeRow(wc+th+1,Math.min(c0+n-2,wc+th+3),fl);
      if(chance(.4))heart(wc+th+1,fl*TS-30);
      if(L>0&&chance(.5))spawnAt('iceSlime',c0+n-2,fl)},
    // a little dead-end nook under the floor: drop in through a hole, grab the loot, hop back out
    nook(L){const n=ri(10,12),c0=x;run(n);if(fl+3>ROWS-2)return;
      const c=c0+ri(2,n-7),sealed=chance(.4);
      for(const cc of [c,c+1])carve(cc,fl,fl+2);
      for(let cc=c+2;cc<=c+5;cc++)carve(cc,fl+1,fl+2);
      if(sealed)for(const r of [fl+1,fl+2])grid[r][c+2]=T_CRACKW;
      items.push({k:chance(.5)?'gold':'heart',x:(c+5)*TS+TS/2,y:(fl+2)*TS+12,ph:0});spore(c+3,(fl+2)*TS+16);spore(c+4,(fl+2)*TS+16);
      if(chance(.4))spawnAt('iceSlime',c0+n-2,fl)},
    // a gap in the roof: high above, daylight and falling snow; far too high to climb out
    skylight(L){if(fl<12)stepFl(12);const hh=Math.max(H,5);run(2,hh);const n=ri(7,10),s0=x;
      for(let i=0;i<n;i++)carve(x+i,0,fl-1);x+=n;run(2,hh);
      skylights.push({x0:s0*TS,x1:(s0+n)*TS,fy:fl*TS,acc:0});
      for(let c=s0;c<s0+n;c+=ri(2,3))deco('snow',c,fl*TS,ri(-8,8));
      if(chance(.6)){const bc=s0+ri(1,n-3);iceBlock(bc,fl-3,2);sporeRow(bc,bc+1,fl-3)}
      arc(s0,s0+n-1,fl*TS-30,40);
      if(L>0&&witchOK()&&chance(.55)){spawnAt('iceWitch',s0+(n>>1),fl-4);witches++}},
    // a breather; the shop needs a taller room
    rest(cp,shop){const hh=shop?7:Math.max(H,5);if(shop)stepFl(Math.max(fl,hh+2));const n=shop?12:ri(6,8),c0=x;run(n,hh,!shop);
      if(shop){shops.push({x:(c0+6)*TS+TS/2,y:fl*TS});deco('torch',c0+3,fl*TS);deco('torch',c0+9,fl*TS)}
      if(cp){const cc=shop?c0+1:c0+n-2;checks.push({x:cc*TS+TS/2,y:fl*TS,on:false});deco('torch',cc+1,fl*TS,10)}
      if(!shop){if(chance(.5))arc(c0+1,c0+n-2,fl*TS-30,50);if(chance(.3))heart(c0+2,fl*TS-30)}},
  };

  /* secrets: each one records a zone; entering it counts the secret as found */
  const zone=(c0,r0,w,hh)=>{const z={x:c0*TS,y:r0*TS,w:w*TS,h:hh*TS,found:false};secretZones.push(z);return z};
  const hideIn=(z,n0)=>{for(let i=n0;i<items.length;i++)items[i].hid=z};
  const prize=(cx,cy)=>{const k=wpick([['gold',4],['heart',2.5],['power',1.5]]);items.push({k,x:cx,y:cy,ph:0});if(k==='power')powerSpots.push([cx,cy])};
  const SEC={
    // a patch of the floor is only frozen mist: step on it and you drop into an ice grotto
    falseFloor(){if(fl>16)stepFl(16);const n0=items.length,c0=x;run(11);
      for(let i=1;i<=8;i++)for(const r of [fl+1,fl+2]){grid[r][c0+i]=T_FAKE;flow[r][c0+i]=0}
      for(let i=3;i<=5;i++){grid[fl][c0+i]=T_FAKE;flow[fl][c0+i]=0}
      prize((c0+7)*TS+TS/2,(fl+2)*TS+12);spore(c0+1,(fl+2)*TS+16);spore(c0+2,(fl+2)*TS+16);
      hideIn(zone(c0+1,fl+1,8,2),n0)},
    // cracked ice under a high ledge: a heavy landing breaks through into a hidden chamber
    crackHall(){const hh=10;stepFl(clamp(fl,hh+2,16));const n0=items.length,c0=x;run(13,hh,false);
      iceBlock(c0+7,fl-3,2);iceBlock(c0+3,fl-6,2);sporeRow(c0+3,c0+4,fl-6);
      for(let i=9;i<=11;i++){grid[fl][c0+i]=T_CRACK;flow[fl][c0+i]=0}
      for(let i=8;i<=12;i++)for(const r of [fl+1,fl+2]){grid[r][c0+i]=T_FAKE;flow[r][c0+i]=0}
      prize((c0+10)*TS+TS/2,(fl+2)*TS+12);spore(c0+8,(fl+2)*TS+16);spore(c0+12,(fl+2)*TS+16);
      hideIn(zone(c0+8,fl+1,5,2),n0)},
    // invisible ice shelves high up in a hall; they show up only when you come close
    shelf(){const hh=11;stepFl(clamp(fl,hh+2,17));const n0=items.length,c0=x;run(12,hh,false);
      iceBlock(c0+2,fl-3,2);
      for(const [c,r,w] of [[c0+5,fl-6,2],[c0+8,fl-9,3]]){plank(c,r,w);for(let i=0;i<w;i++)flow[r][c+i]=6}
      hiddenPlanks=true;prize((c0+9)*TS+TS/2,(fl-9)*TS-30);spore(c0+10,(fl-9)*TS-30);
      hideIn(zone(c0+8,fl-11,3,2),n0)},
  };

  /* ---- the plan ---- */
  run(12,6,false);deco('torch',10,fl*TS);sporeRow(5,8,fl);
  const total=ri(17,19);
  const W={tunnel:1.6,hall:1.5,slide:1.5,chasm:1.6,climb:1.9,descent:1.8,snake:1.9,crystal:1.4,nook:1,skylight:.35,iceBridge:1.1,
    crumbStairs:.8,crumbDrop:.7,crumbZig:.8,crumbIsle:.7,
    skyLiftUp:.45,skyLiftDown:.45,skyStones:.5,skyTwinLifts:.6,skyCrumbClimb:.5,skyGauntlet:.6};
  const CRUMB=['iceBridge','crumbStairs','crumbDrop','crumbZig','crumbIsle','skyLiftUp','skyLiftDown','skyStones','skyTwinLifts','skyCrumbClimb','skyGauntlet'];
  const SKY_T=CRUMB.slice(5);   // the open-roof chasms are medium or hard: rare early on
  // the roof opens to the sky at least twice: once in each half of the cave
  const skyAt=new Set([ri(2,Math.floor(total*.42)),ri(Math.floor(total*.58),total-2)]);
  const secKinds=[],secPool=[['falseFloor',1],['crackHall',1],['shelf',1]],nSec=chance(.75)?2:1;
  while(secKinds.length<nSec){const k=wpick(secPool);secKinds.push(k);secPool.splice(secPool.findIndex(o=>o[0]===k),1)}
  const secretAt=new Map();
  secKinds.forEach((k,j)=>{let idx=clamp(Math.floor(total*(j+.5)/nSec)+ri(-1,1),2,total-2);while(secretAt.has(idx))idx++;secretAt.set(idx,k)});
  let sinceCP=0,last='';const recent=[];
  for(let i=0;i<total;i++){
    progress=i/total;
    if(i===Math.floor(total/2)){PLAN.push({t:'shop',c:x});SEG.rest(true,true);sinceCP=0}
    else if(sinceCP>=4){PLAN.push({t:'rest',c:x});SEG.rest(true,false);sinceCP=0}
    if(secretAt.has(i)){const k=secretAt.get(i);PLAN.push({t:'secret:'+k,c:x});SEC[k]()}
    const L=progress<.25?0:progress<.6?(chance(.75)?1:0):(chance(.7)?2:1);
    const cands=[];
    for(const ty in W){if(ty===last)continue;let w=W[ty];
      if(recent.slice(-3).indexOf(ty)>=0)w*=.35;
      if(ty==='climb')w*=fl-4<FMIN?0:fl>=14?1.8:fl<=10?.4:1;
      if(ty==='descent')w*=fl+3>FMAX?0:fl<=10?1.8:fl>=14?.4:1;
      if(i<2&&(ty==='chasm'||CRUMB.indexOf(ty)>=0))w*=.3;
      if(SKY_T.indexOf(ty)>=0&&progress<.25)w*=.2;
      if(CRUMB.indexOf(ty)>=0&&recent.slice(-2).some(t=>CRUMB.indexOf(t)>=0))w*=.25;   // not two slab trials in a row
      if(w>0)cands.push([ty,w])}
    const ty=skyAt.has(i)&&last!=='skylight'?'skylight':wpick(cands);PLAN.push({t:ty,L,c:x,fl});SEG[ty](L);last=ty;recent.push(ty);sinceCP++;
  }
  // a checkpoint and the last shop right before the boss
  stepFl(14);PLAN.push({t:'final',c:x});SEG.rest(true,true);run(5,5,false);
  // the snowman's hall: you drop into it from the passage
  const a0=x,AW=30,fr=ROWS-2,atop=6;ARENA_L=a0*TS;iceCeil=(atop+1)*TS;
  for(let c=a0;c<a0+AW;c++)carve(c,atop+1,fr-1);   // an open hall: no ledges
  heart(a0+5,fr*TS-30);
  ARENA_R=(a0+AW)*TS;
  // past the hall a passage leads on to the door, one screen further; a wall of clear ice closes it until the snowman is beaten
  const e0=a0+AW,EW=26;iceGate=[];
  for(let c=e0;c<e0+EW;c++)carve(c,fr-6,fr-1);
  for(let r=fr-6;r<fr;r++){grid[r][e0]=T_SOLID;flow[r][e0]=ICE_B;iceGate.push([r,e0])}
  sporeRow(e0+4,e0+9,fr);
  COLS=e0+EW+2;
  door={x:(e0+EW-6)*TS,y:FLOOR-104,w:76,h:104};
  /* ---- dressing: icicles under the roof, crystals and snow drifts on the floor ---- */
  const skyCol=c=>skylights.some(s=>c*TS>=s.x0&&c*TS<s.x1);
  const safe=[...checks.map(q=>q.x/TS),...shops.map(q=>q.x/TS)];
  for(let c=1;c<COLS-1;c++)for(let r=2;r<ROWS-2;r++){
    const t=grid[r][c];if(t!==T_SOLID)continue;
    if(flow[r][c]!==ICE_B&&grid[r+1][c]===T_EMPTY&&!skyCol(c)&&chance(.2))deco('icicle',c,(r+1)*TS,ri(-10,10));
    else if(flow[r][c]===0&&c<a0&&grid[r-1][c]===T_EMPTY&&grid[r-2][c]===T_EMPTY&&!safe.some(q=>Math.abs(q-c)<2)){
      if(chance(.06))deco('crystal',c,r*TS,ri(-8,8));else if(chance(.07))deco('snow',c,r*TS,ri(-8,8))}
  }
  for(const sp of spawns){if(sp.c<16||safe.some(q=>Math.abs(q-sp.c)<5))continue;const e=makeEnemy(sp.type,sp.c,sp.extra);if(e)enemies.push(e)}
  startY=startFl*TS;
  sporeTotal=items.filter(i=>i.k==='spore').length;
  B=makeBoss();
}
// Passability check for the cave. Crystal walls count as open (punch, dash or a thrown mushroom smash them),
// jumps need headroom under the roof, and from every spot the player can reach, the arena must still be reachable.
function validateIce(){
  const saved=[];
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(grid[r][c]===T_CRACKW){saved.push([r,c]);grid[r][c]=T_EMPTY}
  try{return validateIceGraph()}finally{for(const [r,c] of saved)grid[r][c]=T_CRACKW}
}
function validateIceGraph(){
  const goalC=Math.floor(ARENA_L/TS), nodes=[], byCol=Array.from({length:COLS},()=>[]);
  const add=(c,y,k)=>{if(c<0||c>=COLS)return null;const n={c,y,k,out:[],inn:[]};nodes.push(n);byCol[c].push(n);return n};
  const rides=[];   // [top node, bottom node] of every column of a lift
  const free=t=>!isSolidT(t);
  for(let c=0;c<COLS;c++)for(let r=2;r<ROWS;r++){const t=grid[r][c],up=grid[r-1][c];
    if(isFloorT(t)&&free(up)&&up!==T_THORN&&free(grid[r-2][c]))add(c,r*TS,t===T_PLANK?'plank':'floor')}
  for(const pl of plats){const a=Math.floor(pl.x0/TS),b=Math.floor((pl.x1+pl.w)/TS);
    if(pl.vy&&pl.y0!==pl.y1){for(let c=a;c<b;c++){const t=add(c,pl.y0,'plat'),d=add(c,pl.y1,'plat');if(t&&d)rides.push([t,d])}continue}
    for(let c=a;c<b;c++)add(c,pl.hy!=null?pl.hy:pl.y,'plat')}
  const clearCol=(c,r0,r1)=>{if(c<0||c>=COLS)return false;for(let r=r0;r<=r1;r++){if(r<0)return false;if(isSolidT(grid[r][c]))return false}return true};
  const oneway=k=>k==='plank'||k==='plat';
  const canMove=(a,b)=>{
    const dx=b.c-a.c,dy=b.y-a.y,gap=Math.abs(dx)-1,ra=Math.floor(a.y/TS),rb=Math.floor(b.y/TS);
    if(dx===0)return dy>0?(oneway(a.k)&&clearCol(a.c,ra,rb-1)):(oneway(b.k)&&-dy<=REACH.rise-12&&clearCol(a.c,rb-2,ra-1));
    if(-dy>REACH.rise-12)return false;
    if(gap>0){const r=REACH.reach(dy,true);if(r<0||r*.9<gap*TS)return false}
    const hi=Math.min(a.y,b.y),hr=Math.floor(hi/TS),extra=gap>=2?90:gap>0?40:(dy<0?10:0);
    const r0=Math.floor((hi-58-extra)/TS),c0=Math.min(a.c,b.c),c1=Math.max(a.c,b.c);
    for(let c=c0;c<=c1;c++)if(!clearCol(c,r0,hr-1))return false;
    if(a.y>hi&&!clearCol(a.c,hr,ra-1))return false;   // jumping up out of a low spot
    if(b.y>hi&&!clearCol(b.c,hr,rb-1))return false;   // dropping down into one
    return true;
  };
  for(const a of nodes)for(let c=Math.max(0,a.c-4);c<=Math.min(COLS-1,a.c+8);c++)for(const b of byCol[c])if(b!==a&&canMove(a,b)){a.out.push(b);b.inn.push(a)}
  for(const [t,d] of rides){t.out.push(d);d.inn.push(t);d.out.push(t);t.inn.push(d)}
  const start=byCol[3].find(n=>n.y===startY)||byCol[3][0];if(!start)return{ok:false,why:'start'};
  const fw=new Set([start]),q=[start];
  while(q.length){const a=q.shift();for(const b of a.out)if(!fw.has(b)){fw.add(b);q.push(b)}}
  const goals=nodes.filter(n=>n.c>=goalC);
  if(!goals.some(n=>fw.has(n))){let far=0;for(const n of fw)far=Math.max(far,n.c);return{ok:false,why:'unreachable',far}}
  const bw=new Set(goals),q2=[...goals];
  while(q2.length){const a=q2.shift();for(const b of a.inn)if(!bw.has(b)){bw.add(b);q2.push(b)}}
  for(const n of fw)if(!bw.has(n))return{ok:false,why:'trap',c:n.c,y:n.y};
  return{ok:true,nodes:nodes.length};
}
// which kind of ice is under the feet: 2 = glassy frozen floor, 1 = ice block, 0 = none
function iceUnder(b){
  const r=Math.floor((b.y+b.h+1)/TS);if(r<0||r>=ROWS)return 0;let s=0;
  for(const c of [Math.floor((b.x+3)/TS),Math.floor((b.x+b.w-3)/TS)]){if(c<0||c>=COLS)continue;const t=grid[r][c];if(!isSolidT(t))continue;
    const f=flow[r][c];if(f===ICE_F)return 2;if(f===ICE_B)s=1}
  return s;
}
// the ice wall at the end of the snowman's hall shatters once he is beaten
function openIceGate(){
  if(!iceGate.length||!bossDead) return;
  for(const [r,c] of iceGate){grid[r][c]=T_EMPTY;flow[r][c]=0;iceShards(c*TS+TS/2,r*TS+TS/2,6,240)}
  iceGate=[];sfx('shatter');shake(.3,6);
}
function snowPuff(x,y,n){for(let i=0;i<n;i++)parts.push({x:x+rand(-14,14),y:y+rand(-8,8),vx:rand(-120,120),vy:rand(-220,-40),g:600,c:Math.random()<.5?'rgba(255,255,255,.95)':'rgba(215,236,252,.95)',s:rand(4,9),life:rand(.3,.6),max:0,t:'puff'})}
// snow falls in a skylight while it is in view. When it comes into view, the air below the roof is filled with flakes
// at once, as if it had been snowing all along (not a first wave that has just started to fall).
function snowFlake(s,y,vy){parts.push({x:rand(s.x0+4,s.x1-4),y,vx:rand(-14,14),vy,g:0,c:'#fff',s:rand(1.8,4),life:(s.fy-y)/vy,max:0,t:'snow',ph:rand(0,6)})}
function updateSnow(dt){
  for(const s of skylights){if(s.x1<camX-60||s.x0>camX+VW/camZ+60){s.on=false;continue}
    const rate=(s.x1-s.x0)/TS*3;
    if(!s.on){s.on=true;const y0=Math.max(-10,camY-OFFY-10),n=Math.min(260,Math.round(rate*(s.fy-y0)/67));
      for(let i=0;i<n;i++)snowFlake(s,rand(y0,s.fy-4),rand(45,90))}
    s.acc+=dt*rate;
    while(s.acc>=1){s.acc--;const y=Math.max(-10,camY-OFFY-10);if(y>=s.fy)break;snowFlake(s,y,rand(45,90))}}
}
