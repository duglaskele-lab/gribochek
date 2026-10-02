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
