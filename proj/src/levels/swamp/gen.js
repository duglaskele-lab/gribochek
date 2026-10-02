/* ---------- level 3: tall swamp ---------- */
// Two screens tall. Giant trees work as towers: a ladder of branches from the bog to a wide platform on top.
// Between towers there is an optional high route (branches, some of them rotten and falling) and, always,
// a low route through the bog. The validator ignores the rotten branches and checks that from every spot
// the player can reach, the arena is still reachable, so a fallen branch never leaves you stuck.
function genSwamp(seed){
  let v=null;
  const fails=[];
  for(let attempt=0;attempt<40;attempt++){buildSwamp(seed,attempt);v=validateSwamp();if(v.ok){GEN_INFO={attempt,repairs:0,fails};return}fails.push({v,plan:PLAN.filter(q=>q.t.startsWith('secret')).map(q=>q.t+'@'+q.c).join(',')})}
  GEN_INFO={attempt:40,repairs:0,fail:v};
}
function buildSwamp(seed,attempt){
  LEVEL=3;BIOME='swamp';SEED=seed;ROWS=28+14;WH=ROWS*TS;FLOOR=(ROWS-2)*TS;ARENA_TRIG_Y=FLOOR-13*TS;CAM_BOT=28*TS;   // arena: one screen below the rest of the level
  RNG=makeRng(seed*7919+3*104729+17+attempt*15485863);
  grid=Array.from({length:ROWS},()=>new Uint8Array(MAXC));
  flow=Array.from({length:ROWS},()=>new Int8Array(MAXC));
  COLS=MAXC;
  plats=[];enemies=[];items=[];checks=[];shops=[];powerSpots=[];secretZones=[];PLAN=[];trees=[];decor=[];springs=[];hiddenPlanks=false;covers=[];switches=[];ruins=[];ruinSpan=null;
  const spawns=[], WL=24, GR=23;   // bog surface row, island/ground top row
  const ground=(c0,n,top)=>{for(let c=c0;c<c0+n;c++)for(let r=top;r<ROWS;r++)grid[r][c]=T_SOLID};
  const bog=(c0,n)=>{for(let c=c0;c<c0+n;c++){for(let r=WL;r<=26;r++)grid[r][c]=T_WATER;for(let r=27;r<ROWS;r++)grid[r][c]=T_SOLID}};
  const plank=(c,r,w)=>{for(let i=0;i<w;i++)if(grid[r][c+i]===T_EMPTY)grid[r][c+i]=T_PLANK};
  const crumb=(c,r,w)=>plats.push({crumble:true,x:c*TS,y:r*TS,w:w*TS,h:16,x0:c*TS,x1:c*TS,vx:0,hy:r*TS,st:'idle',t:0,vy:0,rot:0});
  // moving rafts: horizontal (c0 → c1 on row r) and vertical lifts on vines (column c, rows rTop..rBot)
  const moverH=(c0,c1,r,w,sp)=>{const x0=c0*TS,x1=c1*TS;plats.push({swamp:1,x:chance(.5)?x0:x1,y:r*TS,w:w*TS,h:18,x0,x1,vx:(chance(.5)?1:-1)*sp,y0:r*TS,y1:r*TS,vy:0})};
  // vertical lifts always hang from a branch: a beam from the next trunk sits over the top stop
  const moverV=(c,rTop,rBot,w,sp,tc)=>{const y0=rTop*TS,y1=rBot*TS,ar=Math.max(0,rTop-4),b1=tc!=null?tc+3:c+w;plank(c-1,ar,b1-c+2);
    plats.push({swamp:1,lift:1,x:c*TS,y:y0+RNG()*(y1-y0),w:w*TS,h:18,x0:c*TS,x1:c*TS,vx:0,y0,y1,vy:(chance(.5)?1:-1)*sp,wt:0,anchor:ar*TS+12})};
  const spore=(c,y)=>items.push({k:'spore',x:c*TS+TS/2,y,ph:RNG()*6});
  const sporeRow=(c0,c1,r,up=30)=>{for(let c=c0;c<=c1;c++)spore(c,r*TS-up)};
  const arc=(c0,c1,y0,hgt)=>{const n=c1-c0;for(let i=1;i<n;i++){const t=i/n;spore(c0+i,y0-Math.sin(t*Math.PI)*hgt)}};
  const spawnAt=(type,c,r)=>spawns.push({type,c,extra:{y:r*TS}});
  const deco=(k,c,r,dx=0)=>decor.push({k,x:c*TS+TS/2+dx,y:r*TS,s:RNG()});
  const box=(c,r)=>spawnAt(chance(.5)?'barrel':'crate',c,r);
  // a strip of floor (ground or plank) gets some grass tufts and maybe a bush
  const dress=(c0,w,r,bushP=.3)=>{for(let c=c0;c<c0+w;c++)if(chance(.4))deco('grass',c,r,ri(-12,12));if(w>=3&&chance(bushP))deco('bush',c0+ri(0,w-1),r)};
  let progress=0;
  // one enemy that fits on a floor of width w; the mix gets meaner towards the end
  const foeOn=(c,r,w)=>spawnAt(wpick([['lizSword',3],['lizMage',1.6+progress*2],['frog',1.4+progress],['maskGob',w>=3?1.2+progress*1.6:0],
    ['lizChief',w>=5&&progress>.35?.6+progress:0]]),c,r);
  // branches from the end of one platform (col c0, row r0) to the start of another (col c1, row r1)
  const bridge=(c0,r0,c1,r1,crumbleP,foes)=>{
    let c=c0,r=r0,n=0;
    while(c1-c-1>3&&n<20){n++;
      const g=ri(2,3),ns=c+1+g;
      let w=ri(2,4);if(ns+w>c1-1)w=c1-1-ns;if(w<2)break;
      const remain=Math.max(1,c1-ns);
      let nr=r+Math.round((r1-r)*(g+w)/(remain+g))+pick([-1,0,0,1]);
      nr=clamp(clamp(nr,r-2,r+2),3,20);
      const py=Math.min(r,nr)*TS;
      if(chance(crumbleP)) crumb(ns,nr,w);
      else{plank(ns,nr,w);if(foes&&w>=3&&chance(foes))foeOn(ns+(w>>1),nr,w);
        else if(progress>.15&&chance(.18))spawnAt('spider',ns+(w>>1),nr);   // hangs under the branch
        if(chance(.3))deco('grass',ns+ri(0,w-1),nr)}
      arc(c,ns,py-36,40);
      c=ns+w-1;r=nr;
    }
    arc(c,c1,Math.min(r,r1)*TS-36,40);
  };
  // the piranhas' pools: only the wider ones get a fish (it can barely hunt in a narrow one)
  const fishPools=(s0,n,p0)=>{let a=s0;
    while(a<s0+n){if(grid[25][a]!==T_WATER){a++;continue}let z=a;while(z<s0+n&&grid[25][z]===T_WATER)z++;
      const w=z-a;if(w>=4&&chance(p0+(w>=7?.25:0)))spawnAt('piranha',(a+z)>>1,26);
      if(w>=10&&chance(.45))spawnAt('piranha',a+2,26);a=z}};
  // a muddy island: an enemy, a box or spores, plus some greenery
  const islandFill=(c,w,first)=>{
    dress(c,w,GR,.35);
    if(first){sporeRow(c+1,c+w-2,GR);return}
    const roll=RNG();
    if(roll<.42+progress*.3){
      if(progress>.3&&w>=5&&chance(.3))spawnAt('lizChief',c+(w>>1),GR);
      else spawnAt(wpick([['lizSword',3],['frog',2],['maskGob',1.3+progress*1.5]]),c+(w>>1),GR)}
    else if(roll<.62) box(c+ri(0,w-1),GR);
    else sporeRow(c+1,c+w-2,GR);
    if(chance(.12))deco('torch',c,GR,-6);
  };
  /* ---- low routes: what lies in the bog between two nodes ---- */
  const LOW={
    // classic: muddy islands with wide pools between them
    islands(s0,n,first){bog(s0,n);let c=s0+ri(1,2);
      while(true){const w=ri(3,5);if(c+w>s0+n-2)break;ground(c,w,GR);islandFill(c,w,first);if(!first)lastIslands.push({c,w});c+=w+ri(3,6)}
      if(!first)fishPools(s0,n,.35+progress*.3)},
    // one wide lake: rafts drift across it, sometimes a lift on vines climbs up to the next tree
    lake(s0,n,first,nx){bog(s0,n);
      if(n>=14&&chance(.5)){const c=s0+(n>>1)-1;ground(c,3,GR);dress(c,3,GR,.5);if(chance(.5))box(c+1,GR)}
      fishPools(s0,n,.7);
      const sp=55+progress*45;let c=s0+1;const end=nx.lift?s0+n-5:s0+n-2;
      while(c+5<=end){const r=ri(20,21);moverH(c,c+2,r,3,sp);spore(c+2,r*TS-40);c+=ri(6,7)}
      if(nx.lift){moverV(s0+n-3,nx.top,21,3,95,s0+n);for(let r=nx.top+3;r<21;r+=3)spore(s0+n-3,r*TS-10)}},
    // reed beds: wide overgrown islands and narrow channels; masked goblins hide in the bushes, frogs hop about
    reeds(s0,n,first){bog(s0,n);let c=s0+ri(1,2);
      while(true){const w=ri(4,6);if(c+w>s0+n-2)break;ground(c,w,GR);dress(c,w,GR,.7);if(!first)lastIslands.push({c,w});
        if(!first){const t=wpick([['maskGob',2+progress*2],['frog',2],['lizSword',1],[null,1.2]]);if(t)spawnAt(t,c+ri(1,w-2),GR);else if(chance(.6))box(c+ri(0,w-1),GR)}
        else sporeRow(c+1,c+w-2,GR);
        c+=w+ri(2,4)}
      if(!first)fishPools(s0,n,.3)},
  };
  // a loose layer of extra branches over the bog: more ways up and down, some of them rotten
  const looseLayer=(s0,n,skipFrom)=>{let mc=s0+ri(1,3);
    while(mc<s0+n-3){const w=ri(2,4),r=ri(12,19);if(mc+w>=skipFrom)break;
      if(chance(.3+progress*.25)) crumb(mc,r,w);
      else{plank(mc,r,w);if(w>=3&&chance(.15+progress*.25))foeOn(mc+1,r,w);else{sporeRow(mc,mc+w-1,r);if(progress>.2&&chance(.2))spawnAt('spider',mc+1,r)}}
      mc+=w+ri(2,4)}};
  /* ---- secrets: at most two per level, placed on the way when a fitting spot comes up ---- */
  const zone=(c0,r0,w,hh)=>{const z={x:c0*TS,y:r0*TS,w:w*TS,h:hh*TS,found:false};secretZones.push(z);return z};
  const hideIn=(z,n0)=>{for(let i=n0;i<items.length;i++)items[i].hid=z};
  let lastIslands=[];
  const SSEC={
    // an underwater tunnel at the foot of an island opens into a dry hollow inside it
    sunken(){const cand=lastIslands.filter(q=>q.w>=5);if(!cand.length)return false;const {c,w}=pick(cand),n0=items.length,rw=Math.min(3,w-2);
      for(const r of [25,26]){grid[r][c]=T_WATER;flow[r][c]=0;for(let i=1;i<=rw;i++)grid[r][c+i]=T_FAKE}
      items.push({k:'gold',x:(c+rw)*TS+TS/2,y:26*TS+12,ph:0});if(rw>=2)spore(c+1,26*TS+16);
      hideIn(zone(c+1,25,rw,2),n0);return true},
    // invisible branches above a crown lead to a nest in the sky
    canopy(node){if(node.kind!=='tower'||node.top<8)return false;const tx=node.x,nt=node.top,n0=items.length;
      const ra=nt-3,rb=nt-6,ca=chance(.5)?tx+6:tx+1,cb=ca>tx+4?tx+2:tx+5;
      for(let i=0;i<2;i++)if(grid[ra][ca+i]!==T_EMPTY)return false;for(let i=0;i<3;i++)if(grid[rb][cb+i]!==T_EMPTY)return false;
      plank(ca,ra,2);plank(cb,rb,3);for(let i=0;i<2;i++)flow[ra][ca+i]=6;for(let i=0;i<3;i++)flow[rb][cb+i]=6;hiddenPlanks=true;
      items.push({k:'gold',x:(cb+1)*TS+TS/2,y:rb*TS-30,ph:0});spore(cb,rb*TS-30);spore(cb+2,rb*TS-30);
      hideIn(zone(cb,rb-2,3,2),n0);return true},
    // a hollow in a giant trunk, behind a piece of bark that looks like the rest of the tree
    trunk(node,tree){if(node.kind!=='tower'||!tree||tree.stump)return false;const tx=node.x,nt=node.top;
      const g=node.rungs.find(q=>q.side===0&&q.r-2>=nt+3&&!node.rungs.some(o=>Math.abs(o.r-(q.r-2))<1));if(!g)return false;
      const pr=g.r-2,pc=tx+4;if(grid[pr][pc]!==T_EMPTY||grid[pr-1][pc]!==T_EMPTY||grid[pr-2][pc]!==T_EMPTY)return false;
      const n0=items.length;plank(pc,pr,1);tree.w=Math.max(tree.w,68);
      items.push({k:'gold',x:pc*TS+TS/2,y:pr*TS-26,ph:0});
      const z=zone(pc,pr-2,1,2);hideIn(z,n0);
      covers.push({k:'bark',tree,zone:z,x:pc*TS-3,y:(pr-2)*TS-2,w:TS+6,h:2*TS+18});return true},
  };
  const nSec=chance(.75)?2:1, secPool=[['sunken',1],['canopy',1],['trunk',1]], secKinds=[];
  while(secKinds.length<nSec){const k=wpick(secPool);secKinds.push(k);secPool.splice(secPool.findIndex(o=>o[0]===k),1)}
  const secAt=nSec===2?[.12+RNG()*.2,.5+RNG()*.2]:[.25+RNG()*.4];let secI=0;
  /* ---- the level: nodes (trees, low stumps, clearings) linked by bog; ~25% longer than it used to be ---- */
  ground(0,12,GR);sporeRow(5,8,GR);dress(1,10,GR,0);deco('torch',10,GR);
  let x=12;
  const LEN=176+ri(-5,5);
  const roles=[[.14,'cp'],[.34,'shop'],[.55,'cp'],[.77,'cp']];let roleI=0;
  // tree height follows the level: the first trees are the shortest, the last ones touch the sky
  const topFor=p=>clamp(Math.round(17-12*p)+ri(-1,1),4,18);
  let prev=null,k=0,dips=0;
  while(x<LEN||k<2){
    progress=clamp((x-12)/(LEN-12),0,1);
    const first=k===0;
    // in the middle: a dip with a stump or no tree at all, so the bog is the way forward
    let kind='tower';
    if(!first&&prev&&prev.kind==='tower'&&progress>.26&&progress<.8&&dips<2&&(chance(dips?.22:.4)||(progress>.58&&!dips)))
      kind=chance(.5)?'clearing':'stump';
    const top=kind==='clearing'?GR:kind==='stump'?ri(18,19):(x+20>=LEN?ri(4,5):topFor(progress));
    const lowT=first?'islands':wpick([['islands',3],['lake',progress>.1?2.2:.7],['reeds',1.7]]);
    const lift=lowT==='lake'&&kind==='tower'&&top<=16&&chance(.6);
    const spanW=first?ri(4,6):lowT==='lake'?ri(13,17):ri(11,16),s0=x;
    lastIslands=[];LOW[lowT](s0,spanW,first,{lift,top});
    if(!first&&lowT!=='lake')looseLayer(s0,spanW,lift?s0+spanW-5:s0+spanW);
    if(!first&&progress>.18&&chance(.3+progress*.35))spawnAt('mosquito',s0+(spanW>>1),ri(11,17));
    const tx=s0+spanW;
    let node;
    if(kind==='clearing'){
      // a clearing without trees: firm ground, torches, crates, grass, sometimes a goblin in the bushes
      const cw=ri(10,13);ground(tx,cw,GR);dress(tx,cw,GR,.8);
      deco('torch',tx+1,GR);deco('torch',tx+cw-2,GR);
      for(let j=0,nb=ri(1,3);j<nb;j++)box(tx+ri(2,cw-3),GR);
      spawnAt(wpick([['maskGob',2],['frog',1.5],['lizSword',1.5]]),tx+ri(3,cw-4),GR);
      if(progress>.45&&chance(.5))spawnAt('lizChief',tx+(cw>>1),GR);
      arc(tx+1,tx+cw-2,GR*TS-40,70);
      node={kind,x:tx,w:cw,top:GR,rungs:[]};
    }else{
      const tw=9;ground(tx,tw,GR);
      trees.push({x:(tx+4.5)*TS,w:kind==='stump'?ri(52,62):ri(62,80),top:top*TS,bot:28*TS,stump:kind==='stump'});
      const D=GR-top,n=Math.ceil(D/3),rungs=[];
      for(let i=1;i<n;i++){const r=Math.round(top+i*D/n),side=(n-i)%2,w=ri(3,4);plank(side?tx+9-w:tx,r,w);rungs.push({r,side,c:side?tx+9-w:tx,w})}
      plank(tx,top,9);dress(tx,9,top,.25);dress(tx,9,GR,.3);
      for(const g of rungs) spore(g.side?tx+6:tx+1,g.r*TS-30);
      node={kind,x:tx,w:tw,top,rungs};
      // spiders wait under the rungs, the column below them is clear down to the ground
      if(progress>.12)for(const g of rungs)if(g.r<GR-3&&chance(.2+progress*.25)){spawnAt('spider',g.c+(g.w>>1),g.r);break}
    }
    const nx=node.x,nw=node.w,nt=node.top;
    let role='foe';
    if(!first&&roleI<roles.length&&progress>=roles[roleI][0]){role=roles[roleI][1];roleI++}
    if(role==='shop'){shops.push({x:(nx+5)*TS+TS/2,y:nt*TS});deco('torch',nx+1,nt);deco('torch',nx+nw-1,nt)}
    else if(role==='cp'){checks.push({x:(nx+1)*TS+TS/2,y:nt*TS,on:false});deco('torch',nx+3,nt)}
    else if(!first&&kind!=='clearing'){
      if(progress>.3&&chance(.5))spawnAt('lizChief',nx+5,nt);
      else{spawnAt(wpick([['lizMage',2],['maskGob',1.2+progress],['frog',1]]),nx+6,nt);if(chance(.5))spawnAt('lizSword',nx+3,nt)}
      if(chance(.4))box(nx+ri(1,7),nt)}
    if(role!=='shop'&&kind!=='clearing'&&chance(.4)) items.push({k:'heart',x:(nx+7)*TS+TS/2,y:nt*TS-30,ph:0});
    if((k===1||k===3||k===6)&&kind==='tower'&&chance(.6)){const px=(nx+4)*TS+TS/2,py=nt*TS-70;items.push({k:'power',x:px,y:py,ph:0});powerSpots.push([px,py])}
    if(k>1&&node.rungs.length&&chance(.5)){const g=pick(node.rungs);spawnAt(chance(.6)?'lizSword':'lizMage',g.side?nx+7:nx+1,g.r)}
    // the optional high route from the previous node
    if(prev&&!lift){
      const both=prev.kind!=='clearing'&&kind!=='clearing';
      const type=wpick([['canopy',both?4:2],['long',both&&spanW>=11?3.2:0],['mid',both?2.4:0],['none',1]]), cp=.3+progress*.35, foes=.3+progress*.3;
      const pe=prev.x+prev.w-1;   // last column of the previous node
      if(type==='canopy') bridge(pe,prev.top,nx,nt,cp,foes);
      else if(type==='mid'){
        const a=prev.rungs.filter(g=>g.side===1&&g.r>=10&&g.r<=18), b=node.rungs.filter(g=>g.side===0&&g.r>=10&&g.r<=18);
        if(a.length&&b.length) bridge(pe,pick(a).r,nx,pick(b).r,cp*.6,foes);
        else bridge(pe,prev.top,nx,nt,cp,foes);
      }else if(type==='long'){
        // a long straight bough off one of the crowns, with a crowd on it or a lizardman hut
        const Lb=clamp(spanW-ri(4,6),7,14),fromPrev=chance(.5),R=fromPrev?prev.top:nt,c0=fromPrev?pe+1:nx-Lb;
        plank(c0,R,Lb);
        if(fromPrev) bridge(c0+Lb-1,R,nx,nt,cp*.5,foes); else bridge(pe,prev.top,c0,R,cp*.5,foes);
        dress(c0,Lb,R,.4);
        if(progress>.2&&chance(.55)){const hc=c0+ri(2,Lb-5);spawnAt('lizHut',hc+1,R);deco('torch',hc-1,R);if(hc+5<c0+Lb)deco('torch',hc+4,R);
          if(chance(.5))box(c0,R);sporeRow(c0,c0+1,R)}
        else{const nf=ri(1,2)+(progress>.5?1:0);for(let j=0;j<nf;j++)foeOn(c0+2+Math.round(j*(Lb-4)/Math.max(1,nf)),R,5);
          if(chance(.5))box(c0+Lb-2,R);sporeRow(c0+1,c0+Lb-2,R,34)}
        if(progress>.15&&chance(.5))spawnAt('spider',c0+ri(2,Lb-3),R);
      }
      PLAN.push({t:'span:'+type+'/'+lowT+'/'+kind,c:s0,top:nt});
    }else PLAN.push({t:'span:'+(lift?'lift':'none')+'/'+lowT+'/'+kind,c:s0,top:nt});
    // a secret, if one is due here: the planned kind first, then the ones that were not used
    if(!first&&secI<secKinds.length&&progress>=secAt[secI]&&role!=='shop'){
      const tree=kind!=='clearing'?trees[trees.length-1]:null, late=progress>secAt[secI]+.16;
      const order=[secKinds[secI],...(late?['sunken','canopy','trunk'].filter(q=>secKinds.indexOf(q)<0):[])];
      for(const kk of order) if(SSEC[kk](node,tree)){if(kk!==secKinds[secI])secKinds[secI]=kk;PLAN.push({t:'secret:'+kk,c:nx});secI++;break}}
    if(kind!=='tower')dips++;
    prev=node;x=nx+nw;k++;
  }
  // final approach: stepping stones in the bog, then a cliff with a checkpoint and the last shop
  const s0=x,spanW=ri(7,9);
  bog(s0,spanW);ground(s0+1,3,GR);ground(s0+spanW-3,3,GR);plank(s0+spanW-3,20,3);dress(s0+1,3,GR,.5);
  const cliff=s0+spanW;
  ground(cliff,11,17);dress(cliff,11,17,.3);
  bridge(prev.x+prev.w-1,prev.top,cliff,17,.3,0);
  checks.push({x:(cliff+2)*TS+TS/2,y:17*TS,on:false});deco('torch',cliff+4,17);
  shops.push({x:(cliff+7)*TS+TS/2,y:17*TS});deco('torch',cliff+10,17);
  // hydra arena: poisoned floor, two ledges on each side; you drop in from the cliff
  const a0=cliff+11,AW=24; ARENA_L=a0*TS;
  const fr=ROWS-2;   // arena floor row, a full screen below the bog
  ground(a0,AW,fr);
  plank(a0+1,fr-6,3);plank(a0+5,fr-3,3);plank(a0+AW-4,fr-6,3);plank(a0+AW-8,fr-3,3);
  plank(a0+3,fr-9,3);plank(a0+AW-6,fr-9,3);plank(a0+6,fr-12,3);plank(a0+AW-9,fr-12,3);
  items.push({k:'heart',x:(a0+2)*TS+TS/2,y:(fr-6)*TS-26,ph:0});
  ARENA_R=(a0+AW)*TS;
  ground(a0+AW,4,0);
  COLS=a0+AW+4;
  door={x:(ARENA_L+ARENA_R)/2-38,y:FLOOR-104,w:76,h:104};
  const safe=[...checks.map(q=>q.x/TS),...shops.map(q=>q.x/TS)];
  for(const sp of spawns){
    const prop=sp.type==='barrel'||sp.type==='crate';
    if(sp.c<18||(!prop&&safe.some(q=>Math.abs(q-sp.c)<5))) continue;
    const e=makeEnemy(sp.type,sp.c,sp.extra); if(e) enemies.push(e);
  }
  sporeTotal=items.filter(i=>i.k==='spore').length;
  B=makeHydra();
}
function validateSwamp(){
  const goalC=Math.floor(ARENA_L/TS), nodes=[], byCol=Array.from({length:COLS},()=>[]);
  const add=(c,y,k)=>{const n={c,y,k,out:[],inn:[]};nodes.push(n);byCol[c].push(n)};
  const free=t=>!isSolidT(t);
  for(let c=0;c<COLS;c++) for(let r=0;r<ROWS;r++){
    const t=grid[r][c], up=tile(c,r-1);
    if(isFloorT(t)&&up!==T_WATER&&free(up)&&free(tile(c,r-2))) add(c,r*TS,t===T_PLANK?'plank':'floor');
    else if(t===T_WATER&&up!==t&&free(up)) add(c,r*TS,'water');
  }
  const solidTop=new Array(COLS).fill(WH);
  for(let c=0;c<COLS;c++) for(let r=0;r<ROWS;r++) if(isSolidT(grid[r][c])){solidTop[c]=r*TS;break}
  const clearCol=(c,r0,r1)=>{for(let r=r0;r<=r1;r++) if(isSolidT(tile(c,r))) return false; return true};
  const oneway=k=>k==='plank';
  const canMove=(a,b)=>{
    const dx=b.c-a.c, dy=b.y-a.y, gap=Math.abs(dx)-1;
    if(dx===0) return dy>0?(oneway(a.k)&&clearCol(a.c,Math.floor(a.y/TS)+1,Math.floor(b.y/TS)-1)):(oneway(b.k)&&-dy<=REACH.rise-8&&clearCol(a.c,Math.floor(b.y/TS),Math.floor(a.y/TS)-1));
    if(a.k==='water'){if(-dy>48||gap>2) return false}
    else{if(-dy>REACH.rise-10) return false; if(gap>0){const r=REACH.reach(dy,true);if(r<0||r*.92<gap*TS) return false}}
    const hi=Math.min(a.y,b.y), hiRow=Math.floor(hi/TS), s=Math.sign(dx);
    for(let c=a.c+s;c!==b.c;c+=s) if(solidTop[c]<hi||!clearCol(c,hiRow-2,hiRow-1)) return false;
    if(!clearCol(a.c,hiRow-2,Math.floor(a.y/TS)-1)) return false;
    if(!clearCol(b.c,hiRow-2,Math.floor(b.y/TS)-1)) return false;
    return true;
  };
  for(const a of nodes) for(let c=Math.max(0,a.c-10);c<=Math.min(COLS-1,a.c+10);c++) for(const b of byCol[c]) if(b!==a&&canMove(a,b)){a.out.push(b);b.inn.push(a)}
  const start=byCol[3].find(n=>n.k==='floor'); if(!start) return {ok:false,why:'start'};
  const fw=new Set([start]),q=[start];
  while(q.length){const a=q.shift();for(const b of a.out)if(!fw.has(b)){fw.add(b);q.push(b)}}
  const goals=nodes.filter(n=>n.c>=goalC);
  if(!goals.some(n=>fw.has(n))){let far=0;for(const n of fw)far=Math.max(far,n.c);return {ok:false,why:'unreachable',far}}
  const bw=new Set(goals),q2=[...goals];
  while(q2.length){const a=q2.shift();for(const b of a.inn)if(!bw.has(b)){bw.add(b);q2.push(b)}}
  for(const n of fw) if(!bw.has(n)) return {ok:false,why:'trap',c:n.c,y:n.y};
  return {ok:true,nodes:nodes.length};
}
function drawSwampBG(){
  const k=WH>VH?clamp(camY/((CAM_BOT||WH)-VH),0,1):1;
  const g=ctx.createLinearGradient(0,-OFFY,0,VH+OFFY);
  g.addColorStop(0,mixHex('#8fbba0','#35524a',k));g.addColorStop(1,mixHex('#d4e4ac','#5f7a4e',k));
  ctx.fillStyle=g;ctx.fillRect(0,-OFFY-2,VW,VH+OFFY*2+4);
  ctx.fillStyle='rgba(255,250,200,.07)';
  for(let i=0;i<4;i++){const x=((i*330-camX*.08)%(VW+400)+VW+400)%(VW+400)-200;ctx.beginPath();ctx.moveTo(x,-OFFY);ctx.lineTo(x+90,-OFFY);ctx.lineTo(x+260,VH+OFFY);ctx.lineTo(x+120,VH+OFFY);ctx.fill()}
  const layer=(fac,sp,colr,wmin,wmax,sd)=>{const o=camX*fac;ctx.fillStyle=colr;
    for(let i=Math.floor(o/sp)-1;i<=Math.floor((o+VW)/sp)+1;i++){const h=hash(i,sd),x=i*sp-o+h*sp*.5,w=wmin+h*(wmax-wmin);
      ctx.fillRect(x-w/2,-OFFY-2,w,VH+OFFY*2+4);
      const dir=h>.5?1:-1;for(let j=0;j<2;j++){const by=((hash(i,sd+j+1)*1000-camY*fac)%1000+1000)%1000-200;
        ctx.beginPath();ctx.moveTo(x,by);ctx.lineTo(x+dir*w*2.4,by-46);ctx.lineTo(x+dir*w*2.4,by-32);ctx.lineTo(x,by+18);ctx.fill()}}};
  layer(.15,210,'rgba(60,92,74,.5)',26,48,11);
  layer(.35,300,'rgba(42,68,52,.65)',44,74,23);
  if(k<.95){ctx.strokeStyle=`rgba(96,128,70,${.55*(1-k)})`;ctx.lineWidth=3;const o=camX*.35;
    for(let i=Math.floor(o/90)-1;i<=Math.floor((o+VW)/90)+1;i++){const x=i*90-o+hash(i,31)*60,len=60+hash(i,32)*140,y0=-OFFY-camY*.35;
      if(y0+len<-OFFY) continue;ctx.beginPath();ctx.moveTo(x,y0);for(let y=0;y<=len;y+=12)ctx.lineTo(x+Math.sin(time*1.2+i+y*.05)*4,y0+y);ctx.stroke()}}
  const bogY=(24*TS-camY)*camZ;
  if(bogY<VH+OFFY+40){const fg=ctx.createLinearGradient(0,bogY-160,0,bogY+10);fg.addColorStop(0,'rgba(215,232,190,0)');fg.addColorStop(1,'rgba(215,232,190,.4)');ctx.fillStyle=fg;ctx.fillRect(0,bogY-160,VW,170)}
  for(let i=0;i<16;i++){const fx=((hash(i,5)*VW*1.4+time*20*(hash(i,6)-.5)-camX*.2)%(VW+40)+VW+40)%(VW+40)-20,
      fy=((hash(i,7)*VH+Math.sin(time*.8+i)*30-camY*.1)%VH+VH)%VH, a=.35+.4*Math.sin(time*3+i*2);
    ctx.fillStyle=`rgba(230,255,150,${a})`;ctx.beginPath();ctx.arc(fx,fy,2.6,0,7);ctx.fill()}
}
function drawTrunkBody(t){
  const x=t.x-t.w/2, top=t.top-24, bot=t.bot, w=t.w;
  ctx.strokeStyle=INK;ctx.lineWidth=3;
  ctx.fillStyle='#6b4a32';ctx.fillRect(x,top,w,bot-top-120);
  ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x,bot-120);ctx.moveTo(x+w,top);ctx.lineTo(x+w,bot-120);ctx.stroke();
  ctx.strokeStyle='rgba(43,26,18,.35)';ctx.lineWidth=2;
  const y0=Math.max(top,camY-60),y1=Math.min(bot,camY+VH+60);
  for(let y=Math.floor(y0/34)*34;y<y1;y+=34){const hx=x+8+hash(y|0,t.x|0)*(w-16);ctx.beginPath();ctx.moveTo(hx,y);ctx.quadraticCurveTo(hx+4,y+12,hx,y+24);ctx.stroke()}
  ctx.fillStyle='rgba(112,150,70,.55)';for(let k=0;k<6;k++){const yy=top+60+hash(k,t.x|0)*(bot-top-240);ctx.beginPath();ctx.ellipse(x+(k%2?w-6:6),yy,8,18,0,0,7);ctx.fill()}
}
function drawTrees(){
  for(const t of trees){
    if(t.x+t.w/2+160<camX||t.x-t.w/2-160>camX+VW) continue;
    const x=t.x-t.w/2, top=t.top-24, bot=t.bot, w=t.w;
    ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.lineJoin='round';
    ctx.fillStyle='#5a3e28';ctx.beginPath();ctx.moveTo(x-46,bot);ctx.quadraticCurveTo(x-6,bot-70,x,bot-190);ctx.lineTo(x+w,bot-190);ctx.quadraticCurveTo(x+w+6,bot-70,x+w+46,bot);ctx.closePath();ctx.fill();ctx.stroke();
    drawTrunkBody(t);
    ctx.strokeStyle=INK;ctx.lineWidth=3;
    for(let k=0;k<8;k++){const cs=t.stump?.72:1,cx=t.x+(hash(k,t.x|0)-.5)*w*3.4*cs,cy=top-6-hash(k+9,t.x|0)*80*cs,r=(38+hash(k+3,t.x|0)*34)*cs;
      ctx.fillStyle=k%2?'#3d6b35':'#4f8240';ctx.beginPath();ctx.arc(cx,cy,r,0,7);ctx.fill();ctx.stroke()}
    ctx.fillStyle='rgba(180,220,120,.35)';for(let k=0;k<5;k++){ctx.beginPath();ctx.arc(t.x+(hash(k,7)-.5)*w*2.6,top-30-hash(k,8)*60,8,0,7);ctx.fill()}
  }
}
