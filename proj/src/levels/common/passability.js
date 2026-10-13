/* ---------- passability check ---------- */
// Builds standable spots (ground, planks, water and sand surfaces, moving platforms) and searches left to right
// using the jump model: rise limit, jump/dash reach for the gap width, walls in between and ceilings overhead.
function validateLevel(){
  const goalC=Math.floor(ARENA_L/TS), nodes=[], byCol=Array.from({length:COLS},()=>[]);
  const add=(c,y,k)=>{if(c<0||c>=COLS)return;const n={c,y,k};nodes.push(n);byCol[c].push(n)};
  const free=t=>!isSolidT(t);
  for(let c=0;c<COLS;c++) for(let r=0;r<ROWS;r++){
    const t=grid[r][c], up=tile(c,r-1);
    if(isFloorT(t)&&up!==T_WATER&&up!==T_SAND&&up!==T_THORN&&free(up)&&free(tile(c,r-2))) add(c,r*TS,t===T_PLANK?'plank':'floor');
    else if((t===T_WATER||t===T_SAND)&&up!==t&&free(up)) add(c,r*TS,t===T_WATER?'water':'sand');
  }
  for(const pl of plats){if(pl.crumble)continue;const a=Math.floor(pl.x0/TS),b=Math.floor((pl.x1+pl.w)/TS);
    if(pl.vy){for(let y=pl.y1;y>=pl.y0;y-=TS)for(let c=a;c<b;c++)add(c,y,'plat');for(let c=a;c<b;c++)add(c,pl.y0,'plat')}   // a lift: every height it passes
    else for(let c=a;c<b;c++)add(c,pl.y,'plat')}
  const solidTop=new Array(COLS).fill(WH);
  for(let c=0;c<COLS;c++) for(let r=0;r<ROWS;r++) if(isSolidT(grid[r][c])){solidTop[c]=r*TS;break}
  const clearCol=(c,r0,r1)=>{for(let r=r0;r<=r1;r++) if(isSolidT(tile(c,r))) return false; return true};
  const canMove=(a,b)=>{
    const dx=b.c-a.c, dy=b.y-a.y, gap=Math.abs(dx)-1;
    const oneway=k=>k==='plank'||k==='plat';
    if(dx===0) return dy>0?(oneway(a.k)&&clearCol(a.c,Math.floor(a.y/TS)+1,Math.floor(b.y/TS)-1)):(oneway(b.k)&&-dy<=REACH.rise-8&&clearCol(a.c,Math.floor(b.y/TS),Math.floor(a.y/TS)-1));
    if(a.k==='water'){if(-dy>48||gap>2) return false}
    else if(a.k==='sand'){if(-dy>20||gap>2) return false}
    else{if(-dy>REACH.rise-10) return false; if(gap>0){const r=REACH.reach(dy,true);if(r<0||r*.92<gap*TS) return false}}
    const hi=Math.min(a.y,b.y), hiRow=Math.floor(hi/TS), s=Math.sign(dx);
    for(let c=a.c+s;c!==b.c;c+=s) if(solidTop[c]<hi||!clearCol(c,hiRow-2,hiRow-1)) return false;
    if(!clearCol(a.c,hiRow-2,Math.floor(a.y/TS)-1)) return false;   // ceiling over the take-off
    if(!clearCol(b.c,hiRow-2,Math.floor(b.y/TS)-1)) return false;   // ceiling over the landing
    return true;
  };
  let start=byCol[3].find(n=>n.k==='floor')||byCol[3][0];
  if(!start) return {ok:false,far:3};
  const seen=new Set([start]), q=[start];let far=start;
  while(q.length){
    const a=q.shift();
    if(a.c>far.c) far=a;
    if(a.c>=goalC) return {ok:true,far};
    for(let c=Math.max(0,a.c-3);c<=Math.min(COLS-1,a.c+10);c++) for(const b of byCol[c])
      if(!seen.has(b)&&canMove(a,b)){seen.add(b);q.push(b)}
  }
  return {ok:false,far};
}
// fallback fix: lay plain ground right after the furthest reachable spot
function repairColumn(n){
  const c=n.c+1, R=clamp(Math.floor(n.y/TS),2,ROWS-2);
  for(let r=0;r<ROWS;r++){
    if(r>=R){grid[r][c]=T_SOLID;flow[r][c]=0}
    else if(r>=R-3&&grid[r][c]!==T_EMPTY){grid[r][c]=T_EMPTY;flow[r][c]=0}
  }
}
// The passability check of the levels with their own generators (4 and 5): standable spots (floors, planks,
// platforms; a lift joins the top and bottom of its run) linked by walks, drops and jumps the jump model allows,
// with headroom under ceilings. From the start the goal column must be reachable, and from every spot reached the
// goal must still be reachable (no traps). sky: the rows above the map are open air (no roof).
function graphCheck(startY,goalC,sky){
  const nodes=[], byCol=Array.from({length:COLS},()=>[]);
  const add=(c,y,k)=>{if(c<0||c>=COLS)return null;const n={c,y,k,out:[],inn:[]};nodes.push(n);byCol[c].push(n);return n};
  const rides=[];   // [top node, bottom node] of every column of a lift
  const free=t=>!isSolidT(t);
  for(let c=0;c<COLS;c++)for(let r=2;r<ROWS;r++){const t=grid[r][c],up=grid[r-1][c];
    if(isFloorT(t)&&free(up)&&up!==T_THORN&&free(grid[r-2][c]))add(c,r*TS,t===T_PLANK?'plank':'floor')}
  for(const pl of plats){const a=Math.floor(pl.x0/TS),b=Math.floor((pl.x1+pl.w)/TS);
    if(pl.vy&&pl.y0!==pl.y1){for(let c=a;c<b;c++){const t=add(c,pl.y0,'plat'),d=add(c,pl.y1,'plat');if(t&&d)rides.push([t,d])}continue}
    for(let c=a;c<b;c++)add(c,pl.hy!=null?pl.hy:pl.y,'plat')}
  const clearCol=(c,r0,r1)=>{if(c<0||c>=COLS)return false;for(let r=r0;r<=r1;r++){if(r<0){if(sky)continue;return false}if(isSolidT(grid[r][c]))return false}return true};
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
