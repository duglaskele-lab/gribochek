/* ---------- main loop (render capped at 60 fps, fixed 120 Hz physics) ---------- */
newGame();
showScreen('title');
let last=performance.now(), accum=0, lastDraw=0; const DT=1/120, FRAME_MS=1000/FPS_CAP;
function frame(t){
  requestAnimationFrame(frame);
  const since=t-lastDraw;
  if(since<FRAME_MS-1) return;
  lastDraw=t-(since%FRAME_MS>FRAME_MS-1?0:since%FRAME_MS);
  const d=Math.min(.05,(t-last)/1000); last=t;
  if(state==='play'&&!DBG_FREEZE){accum+=d; while(accum>=DT){step(DT);accum-=DT}}
  else {time+=d; if(state==='title'&&P){camX+=45*d; if(camX>COLS*TS-VW) camX=0}}
  render();
}
requestAnimationFrame(frame);
