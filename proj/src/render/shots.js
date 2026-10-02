function drawEShots(){
  for(const b of eshots){
    switch(b.k){
      case 'banana': banana(b.x,b.y,b.rot);break;
      case 'arrow': {ctx.save();ctx.translate(b.x,b.y);ctx.rotate(Math.atan2(b.vy,b.vx));
        ctx.strokeStyle=INK;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-16,0);ctx.lineTo(10,0);ctx.stroke();ctx.strokeStyle='#b8834f';ctx.lineWidth=2;ctx.stroke();
        ctx.fillStyle='#cfd5da';ctx.strokeStyle=INK;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(10,-4);ctx.lineTo(17,0);ctx.lineTo(10,4);ctx.closePath();ctx.fill();ctx.stroke();
        ctx.fillStyle='#d8332f';ctx.beginPath();ctx.moveTo(-16,0);ctx.lineTo(-20,-5);ctx.lineTo(-11,0);ctx.lineTo(-20,5);ctx.closePath();ctx.fill();ctx.restore();break}
      case 'dart': {ctx.save();ctx.translate(b.x,b.y);ctx.rotate(Math.atan2(b.vy,b.vx));
        ctx.strokeStyle=INK;ctx.lineWidth=3.5;ctx.beginPath();ctx.moveTo(-9,0);ctx.lineTo(10,0);ctx.stroke();ctx.strokeStyle='#e8dcc0';ctx.lineWidth=1.6;ctx.stroke();
        ctx.fillStyle='#d8452f';ctx.beginPath();ctx.ellipse(-11,0,5,3.5,0,0,7);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(-14,0,3,2.2,0,0,7);ctx.fill();ctx.restore();break}
      case 'needle': ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.rot);ctx.strokeStyle=INK;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-9,0);ctx.lineTo(9,0);ctx.stroke();ctx.strokeStyle='#e8f0c0';ctx.lineWidth=2;ctx.stroke();ctx.restore();break;
      case 'wave': {ctx.fillStyle=BIOME==='desert'?'#d8b06a':'#a88a64';ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.beginPath();
        const s=Math.sign(b.vx);ctx.moveTo(b.x,FLOOR);ctx.quadraticCurveTo(b.x+b.w/2-s*6,FLOOR-b.h*1.5,b.x+b.w,FLOOR);ctx.closePath();ctx.fill();ctx.stroke();break}
      case 'rock': case 'meteor': {
        const hgt=FLOOR-b.y; ctx.fillStyle=`rgba(0,0,0,${clamp(.35-hgt/1600,.05,.35)})`;ctx.beginPath();ctx.ellipse(b.x,FLOOR-2,b.r*1.3,5,0,0,7);ctx.fill();
        if(b.k==='meteor'){ctx.fillStyle='rgba(255,120,30,.35)';ctx.beginPath();ctx.arc(b.x,b.y,b.r*1.6,0,7);ctx.fill()}
        ctx.fillStyle=b.k==='meteor'?'#5a3a2a':'#8f8272';ctx.strokeStyle=b.k==='meteor'?'#ff8a2a':INK;ctx.lineWidth=3;ctx.beginPath();
        for(let i=0;i<7;i++){const a=i/7*Math.PI*2,rr=b.r*(.8+hash(i,3)*.3);ctx.lineTo(b.x+Math.cos(a)*rr,b.y+Math.sin(a)*rr)}ctx.closePath();ctx.fill();ctx.stroke();break}
      case 'flame': {const k=clamp(b.life/.9,0,1);ctx.fillStyle=`rgba(255,${Math.round(90+140*k)},40,${.35+.5*k})`;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,7);ctx.fill();
        ctx.fillStyle=`rgba(255,240,150,${.6*k})`;ctx.beginPath();ctx.arc(b.x,b.y,b.r*.45,0,7);ctx.fill();break}
      case 'fireball': ctx.fillStyle='rgba(255,140,40,.4)';ctx.beginPath();ctx.arc(b.x,b.y,b.r*1.6,0,7);ctx.fill();
        ctx.fillStyle='#ff6a1a';ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,7);ctx.fill();ctx.stroke();
        ctx.fillStyle='#ffe07a';ctx.beginPath();ctx.arc(b.x-2,b.y-2,b.r*.45,0,7);ctx.fill();break;
      case 'axe': drawAxe(b.x,b.y,b.rot);break;
      case 'orb': ctx.fillStyle='rgba(170,140,255,.35)';ctx.beginPath();ctx.arc(b.x,b.y,b.r*1.8,0,7);ctx.fill();
        ctx.fillStyle='#b89aff';ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,7);ctx.fill();ctx.stroke();
        ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(b.x-2,b.y-2,b.r*.4,0,7);ctx.fill();break;
      case 'acid': ctx.fillStyle='rgba(150,230,80,.35)';ctx.beginPath();ctx.arc(b.x,b.y,b.r*1.6,0,7);ctx.fill();
        ctx.fillStyle='#9be04a';ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(b.x,b.y,b.r,b.r*1.15,0,0,7);ctx.fill();ctx.stroke();
        ctx.fillStyle='#e8ffb0';ctx.beginPath();ctx.arc(b.x-3,b.y-3,b.r*.35,0,7);ctx.fill();break;
      case 'burn': {const a=clamp(b.life,0,1);for(let k=0;k<3;k++){const fx=b.x-14+k*14,h=14+Math.sin(time*14+k*2+b.x)*5;
        ctx.fillStyle=`rgba(255,${120+k*40},40,${.8*a})`;ctx.beginPath();ctx.moveTo(fx-7,FLOOR);ctx.quadraticCurveTo(fx,FLOOR-h*1.6,fx+7,FLOOR);ctx.fill()}break}
      default: if(SHOTS[b.k]) SHOTS[b.k].draw(b); break;
      case 'vent': {
        ctx.strokeStyle=b.st==='idle'?'#6b2a1a':'#ff7a2a';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(b.x-18,FLOOR-2);ctx.lineTo(b.x-6,FLOOR-6);ctx.lineTo(b.x+4,FLOOR-2);ctx.lineTo(b.x+18,FLOOR-5);ctx.stroke();
        if(b.st==='warn'){ctx.fillStyle=`rgba(255,110,30,${.3+.3*Math.sin(time*25)})`;ctx.beginPath();ctx.ellipse(b.x,FLOOR-4,26,10,0,0,7);ctx.fill()}
        if(b.st==='erupt'){const g=ctx.createLinearGradient(0,FLOOR,0,FLOOR-170);g.addColorStop(0,'rgba(255,230,120,.95)');g.addColorStop(.5,'rgba(255,120,30,.85)');g.addColorStop(1,'rgba(255,60,20,0)');
          ctx.fillStyle=g;const w=20+Math.sin(time*30)*3;ctx.beginPath();ctx.moveTo(b.x-w,FLOOR);ctx.quadraticCurveTo(b.x-w*1.2,FLOOR-100,b.x,FLOOR-175);ctx.quadraticCurveTo(b.x+w*1.2,FLOOR-100,b.x+w,FLOOR);ctx.fill()}
        break}
    }
  }
}
function drawWaves(){
  for(const w of pwaves){ if(w.delay>0) continue;
    const k=w.life/(w.life0||WAVE_LIFE), r=(14+(1-k)*14)*(w.big?2.4:1);
    ctx.save(); ctx.translate(w.x,w.y); ctx.scale(w.face,1); ctx.lineCap='round';
    if(w.big){ctx.fillStyle=`rgba(150,90,220,${.28*k})`;ctx.beginPath();ctx.ellipse(-10,0,r*.9,r*1.25,0,0,7);ctx.fill()}
    for(let j=0;j<3;j++){
      const rr=r-j*7; if(rr<4) continue;
      ctx.globalAlpha=k*(1-j*.25);
      ctx.strokeStyle=INK; ctx.lineWidth=(6-j)*k+3; ctx.beginPath(); ctx.arc(-j*9,0,rr,-1.05,1.05); ctx.stroke();
      ctx.strokeStyle=w.big?(j?'#e6d4ff':'#b77ee0'):(j?'#fff4c2':'#ffd84a'); ctx.lineWidth=(6-j)*k+1; ctx.stroke();
    }
    ctx.restore();
  }
  ctx.globalAlpha=1;
}
function drawParts(){
  for(const p of parts){
    const a=clamp(p.life/(p.max||1),0,1);
    ctx.globalAlpha=a;
    if(p.t==='star') drawStar(p.x,p.y,p.s,p.rot||0);
    else if(p.t==='helm') drawHelm(p.x,p.y,p.rot||0);
    else if(p.t==='snow'){ctx.globalAlpha=Math.min(1,p.life*3);ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.x+Math.sin(time*2+p.ph)*6,p.y,p.s,0,7);ctx.fill()}
    else if(p.t==='puff'){ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.x,p.y,p.s*(1.4-a*.4),0,7);ctx.fill()}
    else{ctx.fillStyle=p.c;ctx.fillRect(p.x-p.s/2,p.y-p.s/2,p.s,p.s)}
  }
  ctx.globalAlpha=1;
  ctx.font='22px '+FONT;ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle=INK;
  for(const f of floaters){ctx.globalAlpha=clamp(1.3-f.t,0,1);ctx.fillStyle='#fff';ctx.strokeText(f.txt,f.x,f.y);ctx.fillText(f.txt,f.x,f.y)}
  ctx.globalAlpha=1;
}
