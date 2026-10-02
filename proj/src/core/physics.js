/* ---------- physics ---------- */
// updates b.inWater and b.flowV (water current); returns the gravity multiplier
function waterPhys(b){
  const w=waterAt(b.x+b.w/2,b.y+b.h*.55);
  const was=b.inWater; b.inWater=!!w; b.flowV=w?(w-10)*FLOW_V:0;
  if(b.inWater!==was&&b===P&&time>.5){sfx('splash');splash(b.x+b.w/2,b.y+b.h*.55)}
  return b.inWater?WATER_G:1;
}
function moveBody(b,dt,oneway=true){
  b.hitWall=0;
  const vx=b.vx+(b.flowV||0)+(b.windV||0);
  b.x+=vx*dt;
  const r0=Math.floor(b.y/TS), r1=Math.floor((b.y+b.h-0.01)/TS);
  if(vx>0){const c=Math.floor((b.x+b.w)/TS);for(let r=r0;r<=r1;r++)if(solid(c,r)){b.x=c*TS-b.w;if(b.vx>0)b.vx=0;b.hitWall=1;break}}
  else if(vx<0){const c=Math.floor(b.x/TS);for(let r=r0;r<=r1;r++)if(solid(c,r)){b.x=(c+1)*TS;if(b.vx<0)b.vx=0;b.hitWall=-1;break}}
  const prevBottom=b.y+b.h;
  b.y+=b.vy*dt; b.onGround=false; b.ride=null;
  const c0=Math.floor(b.x/TS), c1=Math.floor((b.x+b.w-0.01)/TS);
  if(b.vy>=0){
    const r=Math.floor((b.y+b.h)/TS);
    for(let c=c0;c<=c1;c++){const t=tile(c,r);
      if(isSolidT(t)||(t===T_PLANK&&oneway&&!(b.drop>0)&&prevBottom<=r*TS+0.5)){b.y=r*TS-b.h;b.vy=0;b.onGround=true;b.landTile=t;b.landC=c;b.landR=r;break}}
    if(!b.onGround&&oneway&&!(b.drop>0)) for(const pl of dynPlats){
      if(pl.owner===b) continue;
      if(b.x+b.w>pl.x&&b.x<pl.x+pl.w&&prevBottom<=pl.y+0.5&&b.y+b.h>=pl.y){b.y=pl.y-b.h;b.vy=0;b.onGround=true;b.ride=pl;b.landTile=T_PLANK;break}}
  }else{
    const r=Math.floor(b.y/TS);
    for(let c=c0;c<=c1;c++)if(solid(c,r)){b.y=(r+1)*TS;b.vy=0;break}
  }
}
// is there walkable floor one step ahead in direction dir (and no wall)?
function groundAhead(e,dir,dist=TS*.7){
  const ac=Math.floor((e.x+e.w/2+dir*(e.w/2+dist*.5))/TS), fr=Math.floor((e.y+e.h+4)/TS);
  if(solid(ac,fr-1)) return false;
  return isFloorT(tile(ac,fr));
}

