function drawHUD(){
  const W=cv.width/K;
  for(let i=0;i<P.maxhp;i++) heart(30+i*34,32,1.6,'#ff5b6e',i>=P.hp);
  sporeIcon(32,72,1.25);
  ctx.font='26px '+FONT;ctx.textAlign='left';ctx.fillStyle='#fff';ctx.strokeStyle=INK;ctx.lineWidth=5;
  const t=`${spores}`;ctx.strokeText(t,50,80);ctx.fillText(t,50,80);
  if(P.power){mushroom(34,112,12,Math.sin(time*3)*.15,P.power>1,P.power>=3);const t2='×'+P.power;ctx.strokeText(t2,52,118);ctx.fillText(t2,52,118)}
  {let gx=24;const gy=P.power?150:116;
   if(hasCloak){ctx.save();ctx.translate(gx+8,gy);ctx.fillStyle='#7a4ab8';ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(-5,-12);ctx.lineTo(5,-12);ctx.lineTo(12,12);ctx.quadraticCurveTo(0,8,-12,12);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();gx+=34}
   if(hasUmbrella){ctx.save();ctx.translate(gx+8,gy+2);ctx.scale(.42,.42);ctx.fillStyle='#e33b2e';ctx.strokeStyle=INK;ctx.lineWidth=6;ctx.beginPath();ctx.ellipse(0,0,30,21,0,Math.PI,0);ctx.closePath();ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,22);ctx.quadraticCurveTo(0,29,-7,27);ctx.stroke();ctx.restore()}}
  ctx.font='18px '+FONT;ctx.textAlign='right';ctx.lineWidth=4;const lt=T('levelName')(LEVEL);ctx.strokeText(lt,W-(isTouch?74:18),30);ctx.fillText(lt,W-(isTouch?74:18),30);
  if(secretZones.length){ctx.font='16px '+FONT;const st=T('secretsL')(secretsFound,secretZones.length);ctx.strokeText(st,W-(isTouch?74:18),52);ctx.fillText(st,W-(isTouch?74:18),52)}
  if(arenaLocked&&!bossDead&&B.state!=='sleep'){
    const bw=Math.min(420,W-160), bx=(W-bw)/2, byy=isTouch?82:40;
    ctx.fillStyle='rgba(43,26,18,.75)';ctx.beginPath();ctx.roundRect(bx-4,byy-4,bw+8,26,13);ctx.fill();
    ctx.fillStyle=B.hp<B.max/2?'#e0782a':'#79ab4c';ctx.beginPath();ctx.roundRect(bx,byy,Math.max(0,bw*B.hp/B.max),18,9);ctx.fill();
    ctx.textAlign='center';ctx.font='22px '+FONT;ctx.lineWidth=4;ctx.fillStyle='#fff';const nm=T(BOSSES[B.kind].nameKey);ctx.strokeText(nm,W/2,byy-8);ctx.fillText(nm,W/2,byy-8);
  }
}
function render(){
  ctx.setTransform(1,0,0,1,0,0);
  const p=pal();
  ctx.fillStyle=p.sky1;ctx.fillRect(0,0,cv.width,cv.height/2);
  ctx.fillStyle=p.dirt;ctx.fillRect(0,cv.height/2,cv.width,cv.height/2);
  if(!P) return;
  ctx.setTransform(K,0,0,K,0,OFFY*K);
  drawBG();
  let sx=0,sy=0; if(shakeT>0){sx=rand(-1,1)*shakeM;sy=rand(-1,1)*shakeM}
  const VW0=VW; VHZ=VH/camZ; VW=VW/camZ;   // culling below works in world units of the (possibly zoomed) view
  ctx.save(); try{
  ctx.scale(camZ,camZ);
  if(camZ===1) ctx.translate(Math.round((-camX+sx)*K)/K,Math.round((-camY+sy)*K)/K); else ctx.translate(-camX+sx,-camY+sy);
  if(LV().drawBack) LV().drawBack();   // per-level layer behind the trees and tiles
  drawTrees(); drawHydraBody(); drawRuinsBack(); drawTiles(); drawDoor(); drawChecks(); shops.forEach(drawShop); drawDecor(); drawPlats(); drawItems();
  for(const e of enemies){ if(e.type!=='caterpillar'&&(e.x+e.w<camX-80||e.x>camX+VW+80)) continue; EDRAW[e.type](e)}
  if(B&&(B.state!=='sleep'||Math.abs(B.x-camX)<VW+300)) drawBoss();
  if(BIOME==='swamp') drawPoison();
  drawPlayer();
  for(const s of shots) mushroom(s.x,s.y+s.r*.3,s.r,s.rot,s.red,s.gold);
  drawWaves(); drawEShots(); drawFakes(); drawCovers(); drawWater(); drawParts();
  }finally{ctx.restore();VW=VW0;VHZ=VH}
  ctx.setTransform(K,0,0,K,0,0);
  if(state!=='title') drawHUD();
}
