function drawCovers(){
  for(const q of covers){
    if(q.k==='fall'){ if(q.x+80<camX||q.x-80>camX+VW) continue;
      const inside=P.x+P.w>q.x-q.w/2-6&&P.x<q.x+q.w/2+30&&P.y+P.h>q.y0&&P.y<q.y1;
      ctx.save();ctx.globalAlpha=inside?.42:.92;
      const x0=q.x-q.w/2,hgt=q.y1-q.y0;
      const g=ctx.createLinearGradient(x0,0,x0+q.w,0);g.addColorStop(0,'rgba(120,185,230,.95)');g.addColorStop(.5,'rgba(175,220,250,.95)');g.addColorStop(1,'rgba(110,175,225,.95)');
      ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x0-10,q.y0);ctx.quadraticCurveTo(x0,q.y0+4,x0,q.y0+18);ctx.lineTo(x0-4,q.y1);ctx.lineTo(x0+q.w+4,q.y1);ctx.lineTo(x0+q.w,q.y0+14);ctx.quadraticCurveTo(x0+q.w-2,q.y0,x0+q.w-16,q.y0);ctx.closePath();ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,.8)';ctx.lineWidth=3;ctx.lineCap='round';
      for(let k=0;k<5;k++){const sx=x0+6+k*(q.w-12)/4,ph=((time*1.6+hash(k,q.x|0))%1)*hgt;for(let j=0;j<2;j++){const yy=q.y0+((ph+j*hgt*.5)%hgt);ctx.beginPath();ctx.moveTo(sx,yy);ctx.lineTo(sx,Math.min(q.y1,yy+26));ctx.stroke()}}
      ctx.strokeStyle='rgba(43,26,18,.5)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x0,q.y0+18);ctx.lineTo(x0-4,q.y1);ctx.moveTo(x0+q.w,q.y0+14);ctx.lineTo(x0+q.w+4,q.y1);ctx.stroke();
      ctx.fillStyle='rgba(255,255,255,.85)';for(let k=0;k<6;k++){const a=time*3+k;ctx.beginPath();ctx.arc(x0+q.w*(k/5)+Math.sin(a)*3,q.y1-6-Math.abs(Math.sin(a*1.3))*8,6+hash(k,3)*4,0,7);ctx.fill()}
      ctx.restore();
    }else if(q.k==='bark'){ const t=q.tree; if(t.x+t.w<camX||t.x-t.w>camX+VW) continue;
      const inside=q.zone.found||(P.x+P.w>q.x&&P.x<q.x+q.w&&P.y+P.h>q.y&&P.y<q.y+q.h);
      ctx.save();ctx.globalAlpha=inside?.3:1;ctx.beginPath();ctx.rect(q.x,q.y,q.w,q.h);ctx.clip();drawTrunkBody(t);ctx.restore();
    }
  }
}
// an old well with a little tiled roof; its rope disappears into the dark shaft
function drawWell(x,y){
  ctx.save();ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.lineJoin='round';
  ctx.fillStyle='#c9a06a';for(const s of [-1,1]){ctx.fillRect(x+s*27-5,y-66,10,66);ctx.strokeRect(x+s*27-5,y-66,10,66)}
  ctx.fillStyle='#4f8aa0';ctx.beginPath();ctx.moveTo(x-42,y-60);ctx.quadraticCurveTo(x-20,y-66,x,y-88);ctx.quadraticCurveTo(x+20,y-66,x+42,y-60);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x-27,y-50);ctx.lineTo(x+27,y-50);ctx.stroke();
  ctx.strokeStyle='#8a6a3a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+2,y-50);ctx.lineTo(x+2,y+18);ctx.stroke();
  ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.fillStyle='#d8b07a';
  for(const s of [-1,1]){ctx.beginPath();ctx.roundRect(s>0?x+20:x-32,y-14,12,14,3);ctx.fill();ctx.stroke()}
  ctx.restore();
}
function drawFakes(){
  const p=pal(), c0=Math.max(0,Math.floor(camX/TS)-1), c1=Math.min(COLS-1,Math.ceil((camX+VW)/TS)+1);
  for(let c=c0;c<=c1;c++)for(let r=rowLo();r<=rowHi();r++){
    if(grid[r][c]!==T_FAKE) continue; const x=c*TS,y=r*TS, found=flow[r][c]===8;
    if(!found&&flow[r][c]===3){drawSand(c,r,!(tile(c,r-1)===T_FAKE&&flow[r-1][c]===3));continue}
    if(!found&&flow[r][c]===5){ctx.strokeStyle=INK;ctx.lineWidth=3;drawBrick(c,r,T_SOLID);continue}
    if(!found){ctx.strokeStyle=INK;ctx.lineWidth=3;drawSolid(c,r,T_SOLID,p);if(Math.sin(time*1.7+c*2.3+r*5.1)>.997){ctx.fillStyle='rgba(255,246,200,.8)';drawStar(x+10+hash(c,r)*20,y+12+hash(r,c)*16,4,time)}continue}
    ctx.globalAlpha=found?.2:1;
    ctx.fillStyle=p.dirt;ctx.fillRect(x-1.5,y-1.5,TS+3,TS+3);
    const h=hash(c,r);ctx.fillStyle=p.dirt2;ctx.beginPath();ctx.arc(x+8+h*22,y+10+hash(r,c)*20,2.5+h*2,0,7);ctx.fill();
    ctx.strokeStyle=INK;ctx.lineWidth=3;
    if(!vsol(c-1,r)&&!found){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+TS);ctx.stroke()}
    if(!vsol(c+1,r)&&!found){ctx.beginPath();ctx.moveTo(x+TS,y);ctx.lineTo(x+TS,y+TS);ctx.stroke()}
    ctx.globalAlpha=1;
    // a rare faint glint is the only hint
    if(!found&&Math.sin(time*1.7+c*2.3+r*5.1)>.997){ctx.fillStyle='rgba(255,246,200,.8)';drawStar(x+10+h*20,y+12+hash(r,c)*16,4,time)}
  }
}
function drawTiles(){
  const p=pal(), c0=Math.max(0,Math.floor(camX/TS)-1), c1=Math.min(COLS-1,Math.ceil((camX+VW)/TS)+1);
  ctx.lineWidth=3; ctx.strokeStyle=INK; ctx.lineCap='round';
  for(let c=c0;c<=c1;c++)for(let r=rowLo();r<=rowHi();r++){
    const t=grid[r][c];
    if((!t&&flow[r][c]===9&&!LV().openRubble)||(t===T_FAKE&&flow[r][c]===8)||(t===T_WATER&&roofed(c,r))){ctx.fillStyle=p.dirt2;ctx.fillRect(c*TS-.5,r*TS-.5,TS+1,TS+1);if(t!==T_WATER)continue}
    if(!t||t===T_WATER||t===T_SAND||t===T_FAKE) continue; const x=c*TS,y=r*TS;
    if(isSolidT(t)){drawSolid(c,r,t,p);continue}
    if(t===T_PLANK){
      if(flow[r][c]===6){if(Math.sin(time*2.3+c*1.7+r)>.994){ctx.fillStyle='rgba(255,246,200,.8)';drawStar(x+20,y+6,4,time);ctx.strokeStyle=INK;ctx.lineWidth=3}continue}
      ctx.fillStyle=LV().plank?LV().plank[0]:'#b8834f'; ctx.fillRect(x-.5,y,TS+1,14);
      ctx.fillStyle=LV().plank?LV().plank[1]:'#9a6a3c'; ctx.fillRect(x-.5,y+9,TS+1,5);
      if(BIOME==='swamp'){ctx.fillStyle='#6f9c3c';ctx.fillRect(x-.5,y-2,TS+1,4)}
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+TS,y);ctx.moveTo(x,y+14);ctx.lineTo(x+TS,y+14);ctx.stroke();
      if(tile(c-1,r)!==T_PLANK){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+14);ctx.stroke()}
      if(tile(c+1,r)!==T_PLANK){ctx.beginPath();ctx.moveTo(x+TS,y);ctx.lineTo(x+TS,y+14);ctx.stroke()}
    }else if(t===T_THORN){
      if(BIOME==='forest'||LV().thorn){ctx.fillStyle=LV().thorn||'#5b3a5e';
        for(let k=0;k<4;k++){const sx=x+k*10;ctx.beginPath();ctx.moveTo(sx,y+TS);ctx.lineTo(sx+5,y+14+hash(c,k)*8);ctx.lineTo(sx+10,y+TS);ctx.closePath();ctx.fill();ctx.stroke()}}
      else{ctx.fillStyle='#6a9c4a';ctx.beginPath();ctx.roundRect(x+8,y+14,24,26,10);ctx.fill();ctx.stroke();
        ctx.lineWidth=2;for(let k=0;k<5;k++){const sy=y+18+k*4,s=k%2?-1:1;ctx.beginPath();ctx.moveTo(x+20+s*12,sy);ctx.lineTo(x+20+s*19,sy-3);ctx.stroke()}ctx.lineWidth=3}
    }
  }
}
