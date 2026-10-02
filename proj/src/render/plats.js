function drawCrumble(pl){
  if(pl.st==='gone'||pl.x+pl.w<camX-40||pl.x>camX+VW+40) return;
  ctx.save();ctx.globalAlpha=pl.st==='respawn'?clamp(1-pl.t/.5,0,1):1;
  ctx.translate(pl.x+pl.w/2+(pl.st==='shake'?rand(-2.5,2.5):0),pl.y+8);if(pl.st==='fall')ctx.rotate(pl.rot);
  const w=pl.w;ctx.strokeStyle=INK;ctx.lineWidth=3;
  if(pl.stone){ctx.fillStyle='#d8b07a';ctx.fillRect(-w/2,-8,w,22);ctx.strokeStyle='rgba(122,82,40,.55)';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(-w/2,3);ctx.lineTo(w/2,3);
    for(let k=1;k<w/30;k++){ctx.moveTo(-w/2+k*30,-8);ctx.lineTo(-w/2+k*30,3)}ctx.stroke();ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.strokeRect(-w/2,-8,w,22);
    ctx.strokeStyle='rgba(43,26,18,.6)';ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(-w/2+w*.3,-8);ctx.lineTo(-w/2+w*.36,2);ctx.lineTo(-w/2+w*.3,14);ctx.moveTo(w/2-w*.25,-8);ctx.lineTo(w/2-w*.3,6);ctx.stroke();
    ctx.restore();return}
  if(pl.style&&PLAT_STYLES[pl.style]){PLAT_STYLES[pl.style](pl,w);ctx.restore();return}
  ctx.fillStyle='#8f6a44';ctx.beginPath();ctx.roundRect(-w/2,-8,w,17,8);ctx.fill();ctx.stroke();
  ctx.fillStyle='#b98f5e';for(const sx of [-1,1]){ctx.beginPath();ctx.ellipse(sx*(w/2-5),0,4,7,0,0,7);ctx.fill();ctx.lineWidth=1.8;ctx.stroke()}
  ctx.fillStyle='#6b4c30';for(let k=0;k<w/28;k++){const hx=-w/2+14+k*28+hash(k,pl.hy|0)*8;ctx.beginPath();ctx.ellipse(hx,2,5,3,0,0,7);ctx.fill()}
  ctx.strokeStyle='rgba(43,26,18,.75)';ctx.lineWidth=2;ctx.beginPath();
  for(let k=0;k<w/34;k++){const cx=-w/2+18+k*34;ctx.moveTo(cx,-8);ctx.lineTo(cx+4,-2);ctx.lineTo(cx-2,3);ctx.lineTo(cx+3,9)}ctx.stroke();
  ctx.fillStyle='#7aa048';ctx.fillRect(-w/2+6,-10,w-12,3);
  ctx.restore();
}
function drawPlats(){
  for(const pl of plats){
    if(pl.crumble){drawCrumble(pl);continue}
    if(pl.swamp||pl.lift){if(pl.x+pl.w>camX-40&&pl.x<camX+VW+40)drawRaft(pl);continue}
    ctx.fillStyle=BIOME==='desert'?'#e6c98f':'#e0c89a'; ctx.strokeStyle=INK; ctx.lineWidth=3;
    ctx.beginPath(); ctx.moveTo(pl.x,pl.y+4);
    ctx.quadraticCurveTo(pl.x+pl.w/2,pl.y-10,pl.x+pl.w,pl.y+4);
    ctx.quadraticCurveTo(pl.x+pl.w+4,pl.y+18,pl.x+pl.w-10,pl.y+20);
    ctx.lineTo(pl.x+10,pl.y+20); ctx.quadraticCurveTo(pl.x-4,pl.y+18,pl.x,pl.y+4); ctx.fill(); ctx.stroke();
    ctx.lineWidth=1.5; ctx.strokeStyle='rgba(43,26,18,.5)';
    for(let k=1;k<6;k++){ctx.beginPath();ctx.moveTo(pl.x+k*pl.w/6,pl.y+20);ctx.lineTo(pl.x+k*pl.w/6+(k-3)*3,pl.y+8);ctx.stroke()}
  }
}
