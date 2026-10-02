/* ---------- procedural level generation ---------- */
function genLevel(level,seed){
  const L=LEVELS[level]; SKY_TILE=L.roof?T_SOLID:T_EMPTY;
  if(L.gen){L.gen(seed);return}
  // levels without a generator of their own (1 and 2) use the classic builder below
  let v;
  for(let attempt=0;attempt<12;attempt++){
    buildLevel(level,seed,attempt);
    v=validateLevel();
    if(v.ok){GEN_INFO={attempt,repairs:0};return}
  }
  // very unlikely: patch the map right after the furthest reachable spot until it is passable
  let repairs=0;
  while(!v.ok&&repairs<80){repairColumn(v.far);repairs++;v=validateLevel()}
  GEN_INFO={attempt:12,repairs};
}
function buildLevel(level,seed,attempt){
  LEVEL=level; BIOME=LEVELS[level].biome; SEED=seed;
  ROWS=14;WH=ROWS*TS;FLOOR=(ROWS-2)*TS;ARENA_TRIG_Y=9*TS;CAM_BOT=0;trees=[];decor=[];springs=[];hiddenPlanks=false;covers=[];switches=[];ruins=[];ruinSpan=null;
  RNG=makeRng(seed*7919+level*104729+17+attempt*15485863);
  grid=Array.from({length:ROWS},()=>new Uint8Array(MAXC));
  flow=Array.from({length:ROWS},()=>new Int8Array(MAXC));
  COLS=MAXC;
  plats=[];enemies=[];items=[];checks=[];shops=[];powerSpots=[];secretZones=[];PLAN=[];
  const spawns=[];
  let x=0,h=3,progress=0;
  const forest=BIOME==='forest';
  const col=(c,hh)=>{for(let r=ROWS-hh;r<ROWS;r++)grid[r][c]=T_SOLID};
  const run=(n,hh)=>{for(let i=0;i<n;i++)col(x+i,hh);x+=n};
  const top=hh=>(ROWS-hh)*TS;
  const spore=(c,y)=>items.push({k:'spore',x:c*TS+TS/2,y,ph:RNG()*6});
  const sporeLine=(c0,c1,hh,up=30)=>{for(let c=c0;c<=c1;c++)spore(c,top(hh)-up)};
  const arc=(c0,c1,y0,hgt)=>{const n=c1-c0;for(let i=0;i<=n;i++){const t=n?i/n:.5;spore(c0+i,y0-Math.sin(t*Math.PI)*hgt)}};
  const plank=(c,r,w)=>{for(let i=0;i<w;i++)if(grid[r][c+i]===T_EMPTY)grid[r][c+i]=T_PLANK};
  const spawn=(type,c,extra)=>spawns.push({type,c,extra});
  const stepTo=t=>{t=clamp(t,2,8);while(h!==t){h+=clamp(t-h,-2,2);run(2,h)}};
  const prize=(cx,cy,list)=>{const k=wpick(list);items.push({k,x:cx,y:cy,ph:0});if(k==='power')powerSpots.push([cx,cy])};
  const zone=(c0,r0,w,hh)=>{const z={x:c0*TS,y:r0*TS,w:w*TS,h:hh*TS,found:false};secretZones.push(z);return z};
  // widest gap (in tiles) that a jump can clear with a safety margin; dyT>0 means the landing is lower
  const maxGap=(dyT,dash,m)=>{const r=REACH.reach(dyT*TS,dash);return r<0?0:Math.floor(r*m/TS)};
  const foe=L=>wpick(forest?[['slime',4-L],['orc',.8+L*1.2+progress*1.5],['goblin',1+L*.8+progress]]
                           :[['scorpion',3],['mummy',1.2+L*.8],['scarab',2],['cactus',.8+L*.6]]);
  const nFoes=L=>[chance(.5)?1:0, 1+(chance(.35+progress*.3)?1:0), 2+(chance(.25+progress*.3)?1:0)][L];
  const vulture=(c,L)=>{if(!forest&&chance(.12+L*.18+progress*.2))spawn('parrot',c)};
  const deco=(k,c,r,dx=0)=>decor.push({k,x:c*TS+TS/2+dx,y:r*TS,s:RNG()});
  const crumb=(c,r,w)=>plats.push({crumble:true,x:c*TS,y:r*TS,w:w*TS,h:16,x0:c*TS,x1:c*TS,vx:0,hy:r*TS,st:'idle',t:0,vy:0,rot:0});
  const waterPit=(c,n,hb,T,dir=0)=>{for(let i=0;i<n;i++){col(c+i,hb);for(let r=T;r<ROWS-hb;r++){grid[r][c+i]=T_WATER;flow[r][c+i]=dir}}};
  // ruins: sandstone bricks (flow marker 4 picks the brick look), stone ledges that crumble, a backdrop of broken walls
  const brick=(c,r,t=T_SOLID)=>{grid[r][c]=t;flow[r][c]=4};
  const crumbStone=(c,r,w)=>plats.push({crumble:true,stone:true,x:c*TS,y:r*TS,w:w*TS,h:16,x0:c*TS,x1:c*TS,vx:0,hy:r*TS,st:'idle',t:0,vy:0,rot:0});
  const ruinBack=(c0,c1,hh)=>ruins.push({k:'back',x0:c0*TS,x1:(c1+1)*TS,base:top(hh),s:RNG()});
  const freeCols=(c0,c1,T)=>{const a=[];for(let c=c0;c<=c1;c++)if(grid[T-1][c]===T_EMPTY&&grid[T-2][c]===T_EMPTY)a.push(c);return a};

  const SEG={
    // breather before a checkpoint: no enemies, a small reward
    rest(cp){const n=ri(6,8),c0=x;run(n,h);
      if(chance(.5)) arc(c0+1,c0+n-2,top(h)-30,55);
      else{const m=c0+(n>>1);for(const [dx,dy] of [[0,0],[-1,1],[1,1],[0,2],[-1,-1],[1,-1]]) spore(m+dx,top(h)-80-dy*26)}
      if(chance(.3)) items.push({k:'heart',x:(c0+2)*TS+TS/2,y:top(h)-30,ph:0});
      if(cp) checks.push({x:(x-2)*TS+TS/2,y:top(h),on:false})},
    flat(L){const n=ri(8,12)+L*2,c0=x;
      if(n>=10&&chance(.35)){const b=ri(3,n-5);run(b,h);run(2,Math.min(h+1,8));run(n-b-2,h)} else run(n,h);
      if(chance(.3)){const pc=c0+ri(2,4);plank(pc,ROWS-h-3,3);sporeLine(pc,pc+2,h+3)} else sporeLine(c0+2,c0+2+ri(1,3),h);
      const k=nFoes(L);for(let j=0;j<k;j++)spawn(foe(L),c0+4+j*3);vulture(c0+6,L)},
    hills(L){const steps=ri(3,4)+(L>1?1:0);let last=x;
      for(let k=0;k<steps;k++){const nh=clamp(h+pick(forest||L>0?[-2,-1,1,2]:[-1,1]),2,7),n=ri(3,5);h=nh;last=x;run(n,h);if(chance(.5))sporeLine(last,last+n-1,h)}
      const k=Math.max(1,nFoes(L));for(let j=0;j<k;j++)spawn(foe(L),last+1-j*4);vulture(x-6,L)},
    gap(L){const v=wpick([['single',3],['island',L?2:.4],['drop',1.5],['steps',1.2]]);
      if(v==='single'){const nh=clamp(h+ri(-1,1),2,7);const w=clamp([2,3,4][L]+ri(0,1),2,maxGap(h-nh,false,.78));
        arc(x-1,x+w,top(Math.max(h,nh))-40,50);x+=w;h=nh;const c0=x;run(5,h);if(chance(.3+L*.3))spawn(foe(L),c0+3)}
      else if(v==='island'){const ih=clamp(h+ri(-1,1),2,7);const w1=clamp(ri(2,3)+(L>1?1:0),2,maxGap(h-ih,false,.75));
        arc(x-1,x+w1,top(Math.max(h,ih))-40,45);x+=w1;const ic=x;run(ri(2,3),ih);h=ih;
        if(L>1&&chance(.5))spawn(forest?'slime':'scarab',ic+1);
        const nh=clamp(h+ri(-1,1),2,7);const w2=clamp(ri(2,3)+(L>1?1:0),2,maxGap(h-nh,false,.75));
        arc(x-1,x+w2,top(Math.max(h,nh))-40,45);x+=w2;h=nh;const c0=x;run(5,h);if(chance(.3+L*.25))spawn(foe(L),c0+3)}
      else if(v==='drop'){const nh=clamp(h-ri(2,3),2,7);const w=clamp(ri(3,4)+L,2,maxGap(h-nh,false,.8));
        arc(x-1,x+w,top(h)-30,40);x+=w;h=nh;const c0=x;run(6,h);if(chance(.35+L*.3))spawn(foe(L),c0+3)}
      else{const k=ri(3,4)+(L>1?1:0);for(let i=0;i<k;i++){x+=ri(1,L?3:2);h=clamp(h+pick([1,1,0,-1]),2,8);run(L<1?2:1,h);spore(x-1,top(h)-30)}
        run(4,h)}},
    dashgap(L){const nd=maxGap(0,false,1),wd=maxGap(0,true,.86);
      const w=clamp([nd-1,nd+1,wd][L],3,wd);arc(x-1,x+w,top(h)-70,80);x+=w;const c0=x;run(3+L,h);
      if(L>1)spawn(foe(1),c0+3)},
    thorns(L){stepTo(Math.max(h,3));const n=ri(5,7)+L,T=ROWS-h;
      for(let i=0;i<n;i++){col(x+i,h-1);grid[T][x+i]=T_THORN}
      if(L===0) plank(x,T-3,n);
      else if(L===1){const a=ri(2,n-3);plank(x,T-3,a);plank(x+a+1,T-3,n-a-1)}
      else for(let i=0;i<n;i+=3) plank(x+i,T-3-((i/3)%2),2);   // short hops at alternating heights
      sporeLine(x,x+n-1,h+3);x+=n;const c0=x;run(5,h);if(chance(.3+L*.25))spawn(foe(L),c0+3)},
    // combo: a thorn pit too wide for a plain jump at higher tiers, so the air dash is needed
    dashThorns(L){stepTo(Math.max(h,3));const T=ROWS-h,nd=maxGap(0,false,1),wd=maxGap(0,true,.86);
      const n=clamp([nd-1,nd+1,wd][L],3,wd);
      for(let i=0;i<n;i++){col(x+i,h-1);grid[T][x+i]=T_THORN}
      arc(x-1,x+n,top(h)-75,85);if(!forest&&L>0)spawn('parrot',x+(n>>1));
      x+=n;const c0=x;run(4+L,h);if(L>0)spawn(forest?pick(['goblin','slime']):'scorpion',c0+3)},
    movers(L){const n=2+L,T=ROWS-h,sp=60+L*25,span=L>1?4:3;
      for(let i=0;i<n;i++){const base=x+i*(span+3),yy=(T-(L?(i%2):0))*TS,x0=base*TS,x1=(base+span)*TS;
        plats.push({x:i%2?x1:x0,y:yy,w:3*TS,h:18,x0,x1,vx:(i%2?-1:1)*sp});spore(base+2,yy-40)}
      x+=n*(span+3);const c0=x;run(5,h);if(chance(.3+L*.3))spawn(foe(L),c0+3)},
    // combo: moving platforms over a river whose current pushes you back if you fall in
    moverRiver(L){stepTo(clamp(h,4,7));const n=2+L,T=ROWS-h,sp=55+L*25,span=L>1?4:3,hb=Math.max(1,h-4),dir=L?-1:pick([-1,1]);
      const len=n*(span+3);waterPit(x,len,hb,T+1,dir);
      for(let i=0;i<n;i++){const base=x+i*(span+3),yy=(T-(L>1?(i%2):0))*TS,x0=base*TS,x1=(base+span)*TS;
        plats.push({x:i%2?x1:x0,y:yy,w:3*TS,h:18,x0,x1,vx:(i%2?-1:1)*sp});spore(base+2,yy-40)}
      x+=len;const c0=x;run(5,h);if(chance(.3+L*.3))spawn(foe(L),c0+3)},
    plateau(L){const ph=clamp(h+2,4,7);stepTo(ph-1);const n=ri(10,13),c0=x;run(n,ph);h=ph;
      if(forest) spawn(L>0?'monkey':pick(['goblin','slime']),c0+(n>>1)); else spawn(foe(L),c0+(n>>1));
      sporeLine(c0+1,c0+3,h);if(L>1)spawn(foe(L),c0+n-3);if(!forest&&L>0&&chance(.5))spawn('mummy',c0+n-3)},
    pond(L){stepTo(Math.max(h,4));const n=ri(7,10)+L,hb=h-3,T=ROWS-h;waterPit(x,n,hb,T);
      for(let i=1;i<n-1;i+=2)spore(x+i,(T+2)*TS);if(L===0||chance(.35))plank(x+Math.floor(n/2)-1,T-3,3);
      x+=n;const c0=x;run(6,h);if(chance(.3+L*.3))spawn(foe(L),c0+4)},
    river(L){stepTo(Math.max(h,3));const n=[ri(8,10),ri(10,13),ri(13,16)][L],hb=h-2,T=ROWS-h,dir=L>1?-1:pick([-1,1]);
      waterPit(x,n,hb,T,dir);if(L===0||chance(.4))plank(x+Math.floor(n/2)-1,T-3,3);arc(x,x+n-1,top(h)-50,40);
      x+=n;const c0=x;run(6,h);if(chance(.3+L*.3))spawn(foe(L),c0+4)},
    // combo: swim against the current while archers (cacti in the desert) shoot from the far bank
    riverArcher(L){stepTo(clamp(h,3,6));const n=[8,10,12][L]+ri(0,1),hb=h-2,T=ROWS-h;
      waterPit(x,n,hb,T,-1);if(L===0)plank(x+Math.floor(n/2)-1,T-3,3);
      for(let i=1;i<n-1;i+=3)spore(x+i,(T+1)*TS+10);
      x+=n;h+=L>0?1:0;const c0=x,bw=ri(7,9);run(bw,h);
      if(forest){spawn('goblin',c0+bw-3,{force:true});if(L===2)spawn(pick(['goblin','orc']),c0+2,{force:true});else if(L===1&&chance(.4))spawn('slime',c0+2)}
      else{spawn('cactus',c0+bw-3,{force:true});if(L===2)spawn('cactus',c0+2,{force:true})}
      sporeLine(c0+1,c0+2,h)},
    caterpillar(L){stepTo(clamp(h,3,6));const n=ri(15,18),c0=x;run(n,h);
      const riders=chance([.15,.4,.7][L])?wpick(L<2?[[['goblin'],3],[['monkey'],.5]]:[[['goblin','goblin'],2],[['orc','goblin'],2],[['goblin'],1]]):null;
      spawn('caterpillar',c0+5,riders?{riders}:null);if(!riders&&chance(.3+L*.3))spawn('slime',c0+n-3);
      plank(c0+4,ROWS-h-4,3);sporeLine(c0+4,c0+6,h+4)},
    orcs(L){const n=ri(11,14),c0=x;run(n,h);spawn('orc',c0+Math.floor(n/2));sporeLine(c0+n-3,c0+n-1,h);
      if(L>0&&chance(.5+progress*.4))spawn('slime',c0+2);if(L>1)spawn('goblin',c0+n-2)},
    climb(L){const n=ri(11,13),c0=x,T=ROWS-h;run(n,h);
      if(T-5<2) return;
      plank(c0+1,T-2,3);plank(c0+5,T-4,3);plank(c0+9,T-2,3);sporeLine(c0+5,c0+7,h+4);
      if(chance(.22)){items.push({k:'power',x:(c0+6)*TS+TS/2,y:(T-4)*TS-60,ph:0});powerSpots.push([(c0+6)*TS+TS/2,(T-4)*TS-60])}
      else if(chance(.4)) items.push({k:'heart',x:(c0+6)*TS+TS/2,y:(T-4)*TS-60,ph:0});
      const k=Math.max(1,nFoes(L));for(let j=0;j<k;j++)spawn(foe(L),c0+ri(2,9))},
    // columns to hop across; the floor below gets meaner with the tier: low ground, thorns, nothing
    pillars(L){stepTo(clamp(h,3,6));const base=h,k=ri(4,5)+L,floorH=L===0?Math.max(1,base-2):L===1?base-1:0;
      run(1,base);
      for(let i=0;i<k;i++){const g=ri(1,L>1?3:2);
        for(let j=0;j<g;j++){if(floorH>0){col(x,floorH-(L===1?1:0));if(L===1)grid[ROWS-floorH][x]=T_THORN}x++}
        const ph=clamp(base+ri(-1,1)+(L>1?ri(0,1):0),2,8);run(L>1?1:ri(1,2),ph);spore(x-1,top(ph)-30);h=ph}
      run(3,h)},
    cactusField(L){const n=ri(11,14)+L,c0=x;run(n,h);const k=1+L;for(let j=0;j<k;j++)spawn('cactus',c0+2+Math.round(j*(n-4)/Math.max(1,k-1)));
      sporeLine(c0+5,c0+7,h,70);vulture(c0+6,L)},
    worms(L){stepTo(clamp(h,3,5));const n=ri(14,17)+L*2,c0=x;run(n,h);spawn('sandworm',c0+Math.floor(n/2));
      if(L>1)spawn('scorpion',c0+n-2);sporeLine(c0+3,c0+5,h)},
    // desert: quicksand pit; standing in it sinks you, short hops get you out
    quicksand(L){stepTo(clamp(h,4,7));const T=ROWS-h,n=[ri(4,5),ri(6,7),ri(8,9)][L];
      for(let i=0;i<n;i++){col(x+i,h-3);for(let r=T;r<T+3;r++)grid[r][x+i]=T_SAND}
      if(L===0){for(let i=1;i<n-1;i+=3)plank(x+i,T-2,2)}
      else if(L===1){const m=x+(n>>1);for(let r=T;r<ROWS;r++)grid[r][m]=T_SOLID}
      else{plank(x+(n>>1)-1,T-3,2);if(chance(.6))spawn('parrot',x+(n>>1))}
      arc(x-1,x+n,top(h)-40,60);x+=n;const c0=x;run(5,h);if(chance(.3+L*.3))spawn(foe(L),c0+3)},
    // two-level stretch: a stone slab over the path; enemies walk below it, spores wait on top
    slab(L){stepTo(clamp(h,2,6));const n=ri(11,14)+L,c0=x,T=ROWS-h;run(n,h);
      const a=c0+ri(2,3),w=n-ri(5,6);for(let i=0;i<w;i++)grid[T-3][a+i]=T_SOLID;
      sporeLine(a+1,a+w-2,h+3);
      const k=Math.max(1,nFoes(L));for(let j=0;j<k;j++)spawn(forest?pick(['slime','goblin','orc']):pick(['scorpion','scarab','mummy']),a+1+j*3,{y:top(h)});
      if(L>0)spawn(forest?'goblin':'cactus',a+w-2);
      if(chance(.5))spawn(forest?pick(['barrel','crate']):pick(['pot','crate']),a+ri(0,w-1),{y:top(h)})},
    // rotten log bridge over a pond: the logs drop into the water after you step on them
    crumbleBridge(L){stepTo(Math.max(h,4));const st=L>1?4:3,n=ri(3,4)*st+1,hb=h-3,T=ROWS-h;waterPit(x,n,hb,T);
      for(let i=1;i<n-1;i+=st)crumb(x+i,T,Math.min(2,n-1-i));
      arc(x,x+n-1,top(h)-40,40);if(L>1&&chance(.6))spawn('piranha',x+(n>>1),{y:(T+1)*TS+30});
      x+=n;const c0=x;run(5,h);if(chance(.3+L*.3))spawn(foe(L),c0+3)},
    // a lift up a wall that is too tall to jump
    lift(L){stepTo(clamp(h,2,3));const lo=h,hi=Math.min(8,lo+5);run(2,lo);const lc=x;run(3,lo);
      const y0=top(hi),y1=top(lo)-TS,ar=Math.max(1,ROWS-hi-4);plank(lc-1,ar,5);plats.push({lift:1,x:lc*TS,y:y1,w:3*TS,h:18,x0:lc*TS,x1:lc*TS,vx:0,y0,y1,vy:-(70+L*20),wt:.5,anchor:ar*TS+12});
      for(let yy=y1-50;yy>y0;yy-=60)spore(lc+1,yy);
      const n=ri(6,8),c0=x;h=hi;run(n,hi);sporeLine(c0+1,c0+2,hi);
      if(L>0)spawn(forest?pick(['goblin','slime']):pick(['scorpion','cactus']),c0+n-2);if(L>1)spawn(foe(L),c0+3);
      if(chance(.4))spawn(forest?'crate':'pot',c0+1)},
    // an enemy camp: torches, tents, a stack of loot boxes
    camp(L){stepTo(clamp(h,2,6));const n=ri(12,15),c0=x,T=ROWS-h;run(n,h);
      deco('torch',c0+1,T);deco('torch',c0+n-2,T);deco('tent',c0+ri(3,5),T);
      for(let j=0,nb=ri(2,3);j<nb;j++)spawn(forest?pick(['barrel','crate']):pick(['pot','pot','crate']),c0+2+Math.round(j*(n-5)/nb)+1);
      const k=1+L;for(let j=0;j<k;j++)spawn(forest?wpick([['goblin',2],['orc',1+L],['slime',1]]):wpick([['mummy',2],['scorpion',2],['cactus',L]]),c0+4+j*3);
      sporeLine(c0+n-4,c0+n-2,h)},
    // desert oasis: a pond between palms
    oasis(L){stepTo(Math.max(h,4));const T=ROWS-h;run(3,h);deco('palm',x-2,T);const n=ri(6,8)+L,hb=h-3;waterPit(x,n,hb,T);
      for(let i=1;i<n-1;i+=2)spore(x+i,(T+2)*TS);if(L===0||chance(.4))plank(x+(n>>1)-1,T-3,3);
      x+=n;const c0=x;run(6,h);deco('palm',c0+1,T,8);deco('bush',c0+3,T);if(chance(.3+L*.3))spawn(foe(L),c0+4);if(L>0&&chance(.5))spawn('scarab',c0+2)},
    // a bouncy mushroom throws you high up to a floating trail of spores
    /* ---- desert: the ruins of an old eastern town ---- */
    // a house with a domed roof; its doors may be bricked up with cracked stone, the roof may have a hole
    ruinHouse(L){stepTo(clamp(h,2,4));const g=h,T=ROWS-g,c0=x,n=11;run(n,g);
      const a=c0+2,b=c0+8,R=T-4;
      brick(c0,T-1);if(chance(.6))brick(c0,T-2);   // rubble to climb onto the roof
      for(let r=R;r<T;r++){brick(a,r);brick(b,r)}
      for(let c=a+1;c<b;c++)brick(c,R);
      for(const w of [a,b]){const cr=L>0&&chance(.35+L*.15);for(const r of [T-2,T-1]){if(cr)brick(w,r,T_CRACKW);else{grid[r][w]=T_EMPTY;flow[r][w]=0}}}
      if(L>0&&chance(.5)){const gc=a+ri(2,3);grid[R][gc]=T_EMPTY;flow[R][gc]=0;if(chance(.5)){grid[R][gc+1]=T_EMPTY;flow[R][gc+1]=0}}
      ruins.push({k:'house',x0:a*TS,x1:(b+1)*TS,top:R*TS,base:T*TS,s:RNG(),dome:chance(.75)});
      ruinBack(c0,c0+n-1,g);
      sporeLine(a+1,b-1,g+4);if(chance(.5))sporeLine(a+2,b-2,g);
      spawn(pick(['mummy','scorpion','scarab']),a+3,{y:top(g)});if(L>0)spawn(foe(L),c0+n-1);
      if(chance(.5))spawn('pot',a+1,{y:top(g)});vulture(c0+5,L)},
    // broken town walls: free-standing walls, fallen lintels, L-shaped corners; some walls are cracked through
    ruinWalls(L){stepTo(clamp(h,2,4));const g=h,T=ROWS-g,c0=x,n=ri(14,17)+L;run(n,g);
      let c=c0+2;
      while(c<c0+n-3){const kind=wpick([['v',3],['h',2],['vh',1.6]]);
        if(kind==='v'){const wh=ri(2,3),cr=wh===3&&L>0&&chance(.5);for(let r=T-wh;r<T;r++)brick(c,r,cr&&r>=T-2?T_CRACKW:T_SOLID);spore(c,top(g+wh)-30);c+=ri(3,4)}
        else if(kind==='h'){const w=ri(3,4);if(c+w>c0+n-2)break;for(let i=0;i<w;i++)brick(c+i,T-3);sporeLine(c,c+w-1,g+3);c+=w+2}
        else{if(c+4>c0+n-2)break;for(let r=T-3;r<T;r++)brick(c,r);for(let i=1;i<=3;i++)brick(c+i,T-3);sporeLine(c+1,c+3,g+3);c+=6}}
      ruinBack(c0,c0+n-1,g);
      const fc=freeCols(c0+2,c0+n-2,T),k=Math.max(1,nFoes(L));for(let j=0;j<k&&fc.length;j++)spawn(pick(['mummy','scorpion','scarab']),fc[Math.floor((j+.5)*fc.length/k)],{y:top(g)});
      vulture(c0+6,L)},
    // the arcade of an old caravanserai: a long walkway on arches; stretches of it crumble, the street below stays open
    ruinArcade(L){stepTo(clamp(h,2,4));const g=h,T=ROWS-g;run(2,g);const c0=x,n=ri(13,16);run(n,g);
      const R=T-4,e=c0+n-2;
      brick(c0,T-1);brick(c0,T-2);
      for(let c=c0+1;c<=e;c++)brick(c,R);
      for(let c=c0+1;c<=e;c+=4)brick(c,T-3);   // arch keystones
      const nb=L+(chance(.5)?1:0);
      for(let j=0;j<nb;j++){const cc=c0+3+ri(0,Math.max(0,n-8));
        if(grid[T-3][cc]===T_EMPTY&&grid[T-3][cc+1]===T_EMPTY&&grid[R][cc]===T_SOLID&&grid[R][cc+1]===T_SOLID){grid[R][cc]=grid[R][cc+1]=T_EMPTY;flow[R][cc]=flow[R][cc+1]=0;crumbStone(cc,R,2)}}
      ruins.push({k:'arcade',x0:(c0+1)*TS,x1:(e+1)*TS,top:R*TS,base:T*TS,step:4*TS,s:RNG()});
      ruinBack(c0-1,c0+n,g);
      sporeLine(c0+2,e-1,g+4);
      spawn(pick(['mummy','scorpion']),c0+3,{y:top(g)});if(L>0)spawn(pick(['mummy','scarab','scorpion']),c0+n-4,{y:top(g)});
      if(L>0)spawn(pick(['scorpion','scarab']),c0+(n>>1),{y:R*TS});vulture(c0+6,L)},
    springs(L){stepTo(clamp(h,2,6));const n=ri(10,13),c0=x,T=ROWS-h;run(n,h);const sc=c0+ri(2,4);
      springs.push({x:sc*TS+TS/2-24,y:top(h)-24,w:48,gy:top(h),sq:0});
      for(let k=2;k<=7&&T-k>=1;k++)spore(sc,(T-k)*TS);
      const pr=Math.max(1,T-7);if(chance(.5)){plank(sc+2,pr,3);sporeLine(sc+2,sc+4,ROWS-pr);if(chance(.35))items.push({k:'heart',x:(sc+3)*TS+TS/2,y:pr*TS-60,ph:0})}
      const k=nFoes(L);for(let j=0;j<k;j++)spawn(foe(L),c0+n-2-j*3)},
  };

  /* secrets: each one records a zone; entering it counts the secret as found */
  const SEC={
    // heavy landing on cracked floor drops you into a hidden chamber (the cracks are faint, the chamber looks like solid ground)
    breakable(){stepTo(clamp(h,4,7));const base=h;run(2,base+2);run(2,base+4);
      const T=ROWS-base,c0=x;
      for(let i=0;i<9;i++)col(x+i,base);
      for(let i=1;i<=7;i++){grid[T+1][c0+i]=T_FAKE;grid[T+2][c0+i]=T_FAKE}
      for(let i=3;i<=5;i++)grid[T][c0+i]=T_CRACK;
      for(let i=1;i<=7;i++)if(i!==4)spore(c0+i,(T+2)*TS+14);
      prize((c0+4)*TS+TS/2,(T+2)*TS+12,[['power',3],['heart',3.5],['gold',3.5]]);
      zone(c0+1,T+1,7,2);
      x+=9;h=base;run(2,h)},
    // a hill with a room inside: the entrance is a fake wall on the far side (turn back and walk in) or a cracked wall (dash or punch)
    hideout(kind){stepTo(clamp(h,3,5));const g=h,bh=g+3;run(2,g);const c0=x;run(6,bh);
      const r1=ROWS-g-1,r0=r1-1,ent=kind==='fake'||chance(.5)?c0+5:c0,a=c0+1,b=c0+4;
      for(let c=a;c<=b;c++)for(const r of [r0,r1])grid[r][c]=T_FAKE;
      for(const r of [r0,r1]) grid[r][ent]=kind==='fake'?T_FAKE:T_CRACKW;
      const m=(a+b)>>1;prize(m*TS+TS/2,r1*TS+12,[['gold',4],['heart',2],['power',1.5]]);
      for(let c=a;c<=b;c++)if(c!==m)spore(c,r1*TS+16);
      zone(a,r0,b-a+1,2);sporeLine(c0+1,c0+4,bh);h=g;run(3,g)},
    // a ledge too high for a normal jump, invisible until you get close; a monster penned below is the springboard
    bounce(){stepTo(clamp(h,3,6));const g=h,T=ROWS-g;run(2,g);const c0=x;run(1,g+1);run(7,g);run(1,g+1);
      const pr=T-6;plank(c0+3,pr,3);for(let i=0;i<3;i++)flow[pr][c0+3+i]=6;hiddenPlanks=true;
      items.push({k:'gold',x:(c0+4)*TS+TS/2,y:pr*TS-26,ph:0});spore(c0+3,pr*TS-26);spore(c0+5,pr*TS-26);
      spawn(forest?'slime':'scarab',c0+4,{force:true});zone(c0+3,pr-2,3,2);run(3,g)},
    // a pond with an underwater tunnel into the far bank
    nook(){stepTo(clamp(h,5,7));const n=ri(6,8),hb=h-4,T=ROWS-h;waterPit(x,n,hb,T);
      for(let i=1;i<n-1;i+=2)spore(x+i,(T+1)*TS+10);
      x+=n;const c0=x;run(7,h);const rb=ROWS-hb-1;
      for(let i=0;i<4;i++)for(const r of [rb-1,rb])grid[r][c0+i]=T_WATER;
      items.push({k:'gold',x:(c0+3)*TS+TS/2,y:rb*TS+10,ph:0});spore(c0+1,rb*TS+10);spore(c0+2,rb*TS+10);
      zone(c0+1,rb-1,3,2)},
    // a patch of fake floor: step on it and you drop into a room below; jump back out through it
    falsefloor(){stepTo(clamp(h,5,7));const base=h,T=ROWS-base,c0=x;run(10,base);
      for(let i=1;i<=8;i++)for(let r=T+1;r<=T+2;r++)grid[r][c0+i]=T_FAKE;
      for(let i=3;i<=5;i++)grid[T][c0+i]=T_FAKE;
      prize((c0+7)*TS+TS/2,(T+2)*TS+12,[['gold',4],['heart',2.5],['power',1.5]]);
      for(let i=1;i<=6;i++)if(i<3||i>5)spore(c0+i,(T+2)*TS+14);
      zone(c0+1,T+1,8,2);h=base;run(2,h)},
    // invisible steps up into the sky: they only appear when you get close
    invisible(){stepTo(clamp(h,2,4));const g=h,T=ROWS-g,c0=x;run(12,g);plank(c0+1,T-3,2);
      const steps=[[c0+4,T-5,2],[c0+7,T-7,2],[c0+9,T-9,3]];
      for(const [c,r,w] of steps){if(r<1)continue;plank(c,r,w);for(let i=0;i<w;i++)flow[r][c+i]=6}
      hiddenPlanks=true;const [lc,lr]=steps[2];
      prize((lc+1)*TS+TS/2,lr*TS-30,[['gold',4],['heart',2],['power',1.5]]);spore(lc+2,lr*TS-30);
      zone(lc,lr-2,3,2);h=g;run(2,g)},
    // a bouncy mushroom under a hidden ledge high above
    spring(){stepTo(clamp(h,2,5));const g=h,T=ROWS-g;run(2,g);const c0=x;run(8,g);
      springs.push({x:(c0+2)*TS-24,y:top(g)-24,w:48,gy:top(g),sq:0});
      const lr=Math.max(1,T-7);plank(c0,lr,4);for(let i=0;i<4;i++)flow[lr][c0+i]=6;hiddenPlanks=true;
      prize((c0+2)*TS,lr*TS-30,[['gold',4],['heart',2.5],['power',1.5]]);spore(c0,lr*TS-30);spore(c0+3,lr*TS-30);
      zone(c0,lr-2,4,2);h=g;run(3,g)},
    /* ---- new hiding places ---- */
    // forest: a tall step whose far face is a fake wall; a tunnel runs back under the high ground
    underpass(){stepTo(clamp(h,2,4));const g=h,Lr=ROWS-g;run(3,g);const c0=x;run(9,g+3);
      for(let c=c0+3;c<=c0+8;c++)for(const r of [Lr-2,Lr-1])grid[r][c]=T_FAKE;
      prize((c0+3)*TS+TS/2,(Lr-1)*TS+12,[['gold',4],['heart',2],['power',1.5]]);
      for(let c=c0+4;c<=c0+6;c++)spore(c,(Lr-1)*TS+16);
      sporeLine(c0+2,c0+5,g+3);zone(c0+3,Lr-2,4,2);h=g;run(4,g)},
    // forest: a narrow pit that looks bottomless; an invisible ledge at the very bottom and a room under the far bank
    leap(){stepTo(4);const g=4;run(3,g);const p0=x;arc(p0-1,p0+2,top(g)-40,45);x+=2;
      for(let i=0;i<2;i++){grid[ROWS-1][p0+i]=T_PLANK;flow[ROWS-1][p0+i]=6}hiddenPlanks=true;
      const c0=x;run(7,g);
      for(let c=c0;c<=c0+3;c++)for(const r of [ROWS-3,ROWS-2])grid[r][c]=T_FAKE;
      prize((c0+3)*TS+TS/2,(ROWS-2)*TS+12,[['gold',4],['heart',2],['power',1.5]]);spore(c0+1,(ROWS-2)*TS+16);spore(c0+2,(ROWS-2)*TS+16);
      zone(c0,ROWS-3,4,2)},
    // forest: a waterfall pours over a cliff; behind it a cave goes into the rock
    waterfall(){stepTo(clamp(h,5,7));const hh=h,lo=hh-3,c0=x,Lr=ROWS-lo;run(6,hh);
      for(const r of [Lr-2,Lr-1]){grid[r][c0+5]=T_EMPTY;flow[r][c0+5]=9;for(let c=c0+2;c<=c0+4;c++)grid[r][c]=T_FAKE}
      covers.push({k:'fall',x:(c0+5)*TS+TS/2+4,y0:top(hh)-6,y1:top(lo),w:46});
      prize((c0+2)*TS+TS/2,(Lr-1)*TS+12,[['gold',4],['heart',2],['power',1.5]]);spore(c0+3,(Lr-1)*TS+16);spore(c0+4,(Lr-1)*TS+16);
      zone(c0+2,Lr-2,4,2);h=lo;run(6,lo)},
    // desert: a patch of "quicksand" that is a mirage: fall through it into a buried tomb
    mirage(){stepTo(clamp(h,4,6));const g=h,T=ROWS-g;run(3,g);const c0=x;run(9,g);
      for(let c=c0+1;c<=c0+7;c++)for(const r of [T+1,T+2])grid[r][c]=T_FAKE;
      for(let c=c0+3;c<c0+6;c++)for(let r=T;r<T+3;r++){grid[r][c]=T_FAKE;flow[r][c]=3}
      arc(c0+2,c0+6,top(g)-40,60);
      prize((c0+1)*TS+TS/2,(T+2)*TS+12,[['gold',4],['heart',2],['power',1.5]]);spore(c0+6,(T+2)*TS+16);spore(c0+7,(T+2)*TS+16);
      zone(c0+1,T+1,7,2);h=g;run(2,g)},
    // desert: an old well; the shaft is just wide enough to drop into a cistern below
    well(){stepTo(4);const g=4,T=ROWS-g;run(3,g);const c0=x;run(9,g);const wc=c0+3;
      grid[T][wc]=T_EMPTY;flow[T][wc]=9;
      for(let c=c0;c<=c0+7;c++)for(const r of [T+1,T+2]){if(c===wc){grid[r][c]=T_EMPTY;flow[r][c]=9}else grid[r][c]=T_FAKE}
      deco('well',wc,T);
      prize((c0+7)*TS+TS/2,(T+2)*TS+12,[['gold',4],['heart',2],['power',1.5]]);spore(c0+1,(T+2)*TS+16);spore(c0+5,(T+2)*TS+16);
      zone(c0,T+1,8,2);h=g;run(2,g)},
    // desert: a sealed ruin; one loose brick in a broken pillar nearby opens its back door
    switch(){stepTo(clamp(h,2,4));const g=h,T=ROWS-g;run(2,g);const c0=x;run(1,g+2);run(7,g+4);
      for(let c=c0;c<=c0+7;c++)for(let r=ROWS-(c===c0?g+2:g+4);r<T;r++)flow[r][c]=4;
      for(let c=c0+2;c<=c0+6;c++)for(let r=T-3;r<T;r++){grid[r][c]=T_FAKE;flow[r][c]=5}
      ruins.push({k:'house',x0:(c0+1)*TS,x1:(c0+8)*TS,top:(T-4)*TS,base:T*TS,s:RNG(),dome:true,sealed:true});
      run(3,g);const pc=x;run(1,g+2);for(const r of [T-2,T-1])flow[r][pc]=4;run(3,g);
      switches.push({c:pc,r:T-1,door:[[c0+7,T-2],[c0+7,T-1]],done:false});
      prize((c0+3)*TS+TS/2,(T-1)*TS+12,[['gold',4],['heart',2],['power',1.5]]);spore(c0+5,(T-1)*TS+16);spore(c0+6,(T-1)*TS+16);
      sporeLine(c0+2,c0+6,g+4);zone(c0+2,T-3,5,3)},
  };
  // items inside a hiding place stay invisible until you are close or have found it
  const runSecret=k=>{const n0=items.length;(k==='fake'||k==='crack'?SEC.hideout(k):SEC[k]());const z=secretZones[secretZones.length-1];
    if(z)for(let i=n0;i<items.length;i++){const it=items[i];if(it.x>z.x-TS&&it.x<z.x+z.w+TS&&it.y>z.y-2*TS&&it.y<z.y+z.h+TS)it.hid=z}};

  /* ---- level plan: tension curve + rests + secrets ---- */
  run(12,3);
  const total=forest?ri(15,18):Math.round(ri(15,18)*1.2);   // the desert is 20% longer
  const cv={base:.3+(forest?0:.07),slope:.5,amp:.15+RNG()*.08,waves:2.5+RNG(),phase:RNG()*.6-.3};
  const target=p=>clamp(cv.base+cv.slope*p+cv.amp*Math.sin(p*Math.PI*cv.waves+cv.phase),.08,.95);
  const nSec=chance(.75)?2:1, pool=SECRET_KINDS[BIOME].slice(), kinds=[];
  while(kinds.length<nSec&&pool.length){const k=wpick(pool);kinds.push(k);pool.splice(pool.findIndex(o=>o[0]===k),1)}
  const secretAt=new Map();
  kinds.forEach((k,j)=>{let idx=clamp(Math.floor(total*(j+.5)/nSec)+ri(-1,1),1,total-1);while(secretAt.has(idx))idx=idx%(total-1)+1;secretAt.set(idx,k)});
  const W=SEG_WEIGHT[BIOME];
  // desert: the ruined town fills the middle of the level; single ruins can still turn up near the start and the end
  const midA=Math.floor(total*.36), midB=Math.floor(total*.62);
  let heavy=0,sinceCP=0,tension=0,last='';const recent=[];
  // a level with a mini-boss gets a wide flat clearing for it past the middle, right after a checkpoint
  const MB=LEVELS[level].miniboss, mbAt=MB?Math.floor(total*.68):-1;
  const miniArena=()=>{stepTo(clamp(h,3,5));SEG.rest(true);
    const n=24,c0=x;run(n,h);sporeLine(c0+9,c0+12,h,110);spawn(MB,c0+n-6,{force:true})};
  for(let i=0;i<total;i++){
    progress=i/total;
    // after two hard sections, or when a checkpoint is due, give a breather that ends at the flag
    if(heavy>=2||sinceCP>=4||(sinceCP>=3&&tension>=1.4)){
      const cp=sinceCP>=2,sx=x;SEG.rest(cp);PLAN.push({t:'rest',cp,c:sx});heavy=0;if(cp){sinceCP=0;tension=0}}
    if(i===Math.floor(total/2)){run(9,h);shops.push({x:(x-5)*TS+TS/2,y:top(h)})}
    if(i===mbAt){const sx=x;miniArena();PLAN.push({t:'miniboss',k:MB,c:sx});heavy=0;sinceCP=1;tension=0}
    const tg=target(progress),sx=x;
    let type,L=0,d=.2;
    if(secretAt.has(i)){type=secretAt.get(i);runSecret(type);PLAN.push({t:'secret:'+type,d,c:sx})}
    else{
      const cands=[];
      for(const ty in W){ if(ty===last&&ty!=='flat') continue;
        const ruin=RUIN_T.indexOf(ty)>=0;
        if(!forest&&i>=midA&&i<=midB&&!ruin) continue;
        const used=recent.filter(t=>t===ty).length;   // variety: recently seen or already used twice → rarer
        let w=W[ty]*(recent.slice(-4).indexOf(ty)>=0?(ruin?.6:.35):1)*(used>=2?(ruin?.5:.15):1);
        if(ruin) w*=.18+2.6*Math.exp(-(((progress-.5)/.17)**2));
        for(let l=0;l<(i<2?1:3);l++){const dd=SEG_DIFF[ty][l];cands.push([[ty,l,dd],w*Math.exp(-(((dd-tg)/.11)**2))+1e-4])}}
      [type,L,d]=wpick(cands);SEG[type](L);PLAN.push({t:type,L,d:+d.toFixed(2),target:+tg.toFixed(2),c:sx});
    }
    last=type;recent.push(type);heavy=d>=.6?heavy+1:0;sinceCP++;tension+=d;
  }
  // approach: checkpoint + last shop, then climb to the high ledge above the arena
  run(4,h);checks.push({x:(x-2)*TS+TS/2,y:top(h),on:false});
  run(9,h);shops.push({x:(x-5)*TS+TS/2,y:top(h)});
  stepTo(8);run(7,8);checks.push({x:(x-3)*TS+TS/2,y:top(8),on:false});
  // arena: you drop down into it from the ledge
  const a0=x; ARENA_L=a0*TS;
  run(38,2);
  if(forest){plank(a0+10,8,4);plank(a0+19,6,3);plank(a0+27,8,4);items.push({k:'heart',x:(a0+20)*TS+TS/2,y:6*TS-26,ph:0})}
  else{ // dragon arena: low refuges for the burning-floor attack plus two high perches for reaching the flying dragon
    plank(a0+3,9,4);plank(a0+14,9,5);plank(a0+27,9,4);plank(a0+8,6,3);plank(a0+21,6,3);
    items.push({k:'heart',x:(a0+22)*TS+TS/2,y:6*TS-26,ph:0})}
  ARENA_R=x*TS;
  for(let i=0;i<4;i++)col(x+i,ROWS);x+=4;
  COLS=x;
  door={x:(a0+33)*TS,y:FLOOR-104,w:76,h:104};
  const safe=[...checks.map(c=>c.x/TS),...shops.map(s=>s.x/TS)];
  /* ---- dressing: grass, flowers, rocks, bushes, torches and breakable boxes on the top surfaces ---- */
  {const boxCols=[],big=decor.map(d=>d.x);
   for(let c=1;c<COLS-4;c++){
     let r=0;while(r<ROWS&&grid[r][c]===T_EMPTY&&flow[r][c]!==9)r++;
     if(r>=ROWS||r<2) continue;const t=grid[r][c];
     if(!(t===T_SOLID||t===T_PLANK)||flow[r][c]===6||safe.some(q=>Math.abs(q-c)<1.6)||springs.some(sp=>Math.abs(sp.x/TS+.6-c)<1.5)) continue;
     const arena=c>=a0, gnd=t===T_SOLID&&!arena&&!big.some(bx=>Math.abs(bx-(c*TS+TS/2))<80);
     if(forest){if(chance(.42))deco('grass',c,r,ri(-12,12));
       if(gnd){if(chance(.07))deco('flower',c,r,ri(-10,10));else if(chance(.05))deco('shroom',c,r,ri(-10,10));else if(chance(.06))deco('bush',c,r);else if(chance(.04))deco('rock',c,r,ri(-8,8))}}
     else{if(chance(.26))deco('dgrass',c,r,ri(-12,12));
       if(gnd){if(chance(.06))deco('rock',c,r,ri(-8,8));else if(chance(.035))deco('bones',c,r,ri(-8,8));else if(chance(.045))deco('dcactus',c,r,ri(-6,6))}}
     if(gnd&&c>24&&c<a0-10&&grid[r][c-1]===T_SOLID&&grid[r][c+1]===T_SOLID&&grid[r-1][c-1]===T_EMPTY&&grid[r-1][c+1]===T_EMPTY&&grid[r-2][c]===T_EMPTY&&flow[r-1][c]!==9&&!safe.some(q=>Math.abs(q-c)<6)) boxCols.push(c);
   }
   for(const q of checks) deco('torch',Math.floor(q.x/TS)+1,Math.round(q.y/TS),10);
   for(const q of shops){deco('torch',Math.floor(q.x/TS)-2,Math.round(q.y/TS));deco('torch',Math.floor(q.x/TS)+2,Math.round(q.y/TS))}
   const taken=spawns.map(q=>q.c),kinds=forest?['barrel','crate']:['pot','pot','crate'];let nb=ri(5,8);
   for(let tries=0;tries<300&&nb>0&&boxCols.length;tries++){const c=pick(boxCols);
     if(taken.some(q=>Math.abs(q-c)<(PROPS.has(spawns.find(z=>z.c===q)?.type)?7:2))) continue;
     spawn(pick(kinds),c);taken.push(c);nb--;
     if(chance(.3)&&boxCols.indexOf(c+1)>=0){spawn(pick(kinds),c+1);taken.push(c+1)}}}
  // mummies get stuck inside the ruined buildings: inside the ruined town they are replaced by other desert foes
  const inRuins=c=>ruins.some(q=>c*TS+TS>=q.x0-TS&&c*TS<=q.x1+TS);
  for(const s of spawns) if(s.type==='mummy'&&inRuins(s.c)) s.type=pick(['scorpion','scarab']);
  for(const s of spawns){
    if(s.c<22||(s.type!=='parrot'&&!PROPS.has(s.type)&&!(s.extra&&s.extra.force)&&safe.some(c=>Math.abs(c-s.c)<5))) continue;
    const e=makeEnemy(s.type,s.c,s.extra);if(!e) continue; enemies.push(e);
    if(s.extra&&s.extra.riders){
      const seats=s.extra.riders.length===1?[3]:s.extra.riders[0]==='orc'?[1,4]:[2,5];
      e.riders=[];
      s.extra.riders.forEach((t,i)=>{const r=makeEnemy(t,s.c);if(!r)return;const sg=e.segs[seats[i]];
        r.rider=e;r.seat=seats[i];r.x=sg.x-r.w/2;r.y=e.gy-33-r.h;r.face=e.dir;e.riders.push(r);enemies.push(r)});
    }}
  sporeTotal=items.filter(i=>i.k==='spore').length;
  if(ruins.length) ruinSpan=[Math.min(...ruins.map(q=>q.x0)),Math.max(...ruins.map(q=>q.x1))];
  B=makeBoss();
}


