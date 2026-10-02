/* ---------- jump reach model (shared by the generator and the passability check) ---------- */
// Simulates a running full-height jump with the real player physics, with and without an air dash at the apex.
const REACH=(()=>{
  const sim=dash=>{const pts=[];let x=0,y=0,vy=-JV,dashed=false,dT=0;const dt=1/240;
    for(let i=0;i<240*3&&y<1400;i++){
      if(dash&&!dashed&&vy>-60){dashed=true;dT=DASH_T}
      if(dT>0){dT-=dt;x+=DASH_V*dt;vy=0;pts.push([x,y,1]);continue}
      let g=G; if(Math.abs(vy)<150) g*=.55; else if(vy>0) g*=1.2;
      vy=Math.min(vy+g*dt,1000); x+=MAXV*dt; y+=vy*dt; pts.push([x,y,vy]);
    } return pts};
  const A=sim(false), D=sim(true);
  const reach=(pts,dy)=>{for(const p of pts) if(p[2]>0&&p[1]>=dy) return p[0]; return -1};
  let apex=0; for(const p of A) apex=Math.min(apex,p[1]);
  // rise: how high the feet get (px); reach(dy): horizontal px covered before landing dy px lower (negative dy = higher)
  return {rise:-apex, reach:(dy,dash)=>reach(dash?D:A,dy)};
})();

