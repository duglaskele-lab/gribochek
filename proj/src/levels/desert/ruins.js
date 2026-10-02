/* ---------- ruins of the eastern town (drawn behind the tiles) ---------- */
function ruinArch(x,y,w,h){ctx.beginPath();ctx.moveTo(x,y+h);ctx.lineTo(x,y+w*.55);ctx.quadraticCurveTo(x,y,x+w/2,y-w*.15);ctx.quadraticCurveTo(x+w,y,x+w,y+w*.55);ctx.lineTo(x+w,y+h);ctx.closePath()}
function onionDome(cx,by,w,h,col){ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(cx-w/2,by);ctx.bezierCurveTo(cx-w*.75,by-h*.55,cx-w*.1,by-h*.7,cx,by-h);ctx.bezierCurveTo(cx+w*.1,by-h*.7,cx+w*.75,by-h*.55,cx+w/2,by);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(cx,by-h);ctx.lineTo(cx,by-h-16);ctx.stroke();ctx.fillStyle='#e8b84a';ctx.beginPath();ctx.arc(cx,by-h-18,4,0,7);ctx.fill();ctx.stroke()}
function drawRuinsBack(){
  if(!ruins.length) return;
  ctx.save();ctx.lineJoin='round';
  for(const q of ruins){ if(q.x1<camX-160||q.x0>camX+VW+160) continue;
    if(q.k==='back'){ // a broken town wall far behind the path, with arched windows
      const H=120+q.s*70, n=Math.max(2,Math.round((q.x1-q.x0)/40));
      ctx.fillStyle='rgba(196,150,96,.55)';ctx.strokeStyle='rgba(43,26,18,.35)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(q.x0,q.base);
      for(let i=0;i<=n;i++){const x=q.x0+(q.x1-q.x0)*i/n,hh=H*(.55+.45*hash(i,q.x0|0));ctx.lineTo(x,q.base-hh);if(i<n)ctx.lineTo(x+(q.x1-q.x0)/n*.5,q.base-hh+(hash(i+7,q.x0|0)>.5?12:-6))}
      ctx.lineTo(q.x1,q.base);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.fillStyle='rgba(120,78,40,.35)';for(let x=q.x0+30+q.s*40;x<q.x1-50;x+=110){ruinArch(x,q.base-H*.62,34,H*.36);ctx.fill()}
      ctx.strokeStyle='rgba(122,82,40,.25)';ctx.lineWidth=1.5;ctx.beginPath();for(let y=q.base-26;y>q.base-H*.5;y-=26){ctx.moveTo(q.x0,y);ctx.lineTo(q.x1,y)}ctx.stroke();
    }else if(q.k==='house'){ // back wall of the house (a window in it) and a dome on the roof
      if(!q.sealed){ctx.fillStyle='#b88a52';ctx.fillRect(q.x0,q.top,q.x1-q.x0,q.base-q.top);
        ctx.fillStyle='rgba(60,36,18,.45)';ruinArch((q.x0+q.x1)/2-16,q.top+46,32,q.base-q.top-80);ctx.fill();
        ctx.strokeStyle='rgba(122,82,40,.35)';ctx.lineWidth=1.5;ctx.beginPath();for(let y=q.top+60;y<q.base;y+=26){ctx.moveTo(q.x0,y);ctx.lineTo(q.x1,y)}ctx.stroke()}
      if(q.dome){ctx.strokeStyle=INK;ctx.lineWidth=3;const w=(q.x1-q.x0)*.52;
        ctx.fillStyle='#d8b07a';ctx.fillRect((q.x0+q.x1)/2-w*.42,q.top-18,w*.84,20);ctx.strokeRect((q.x0+q.x1)/2-w*.42,q.top-18,w*.84,20);
        onionDome((q.x0+q.x1)/2,q.top-18,w,96+q.s*30,q.s>.5?'#5aa0a8':'#e3c27f');
        if(q.s>.35){ctx.fillStyle='rgba(43,26,18,.25)';ctx.beginPath();ctx.arc((q.x0+q.x1)/2+w*.14,q.top-50,9,0,7);ctx.fill()}}   // a hole in the old dome
    }else if(q.k==='arcade'){ // back wall with a row of arches and slim columns under the walkway
      ctx.fillStyle='rgba(184,138,82,.8)';ctx.fillRect(q.x0,q.top+TS,q.x1-q.x0,q.base-q.top-TS);
      ctx.fillStyle='rgba(60,36,18,.4)';for(let x=q.x0+8;x+q.step-16<=q.x1;x+=q.step){ruinArch(x+10,q.top+TS+16,q.step-36,q.base-q.top-TS-16);ctx.fill()}
      ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.fillStyle='#c9a06a';
      for(let x=q.x0;x<=q.x1+1;x+=q.step){if(x>q.x1-TS)break;ctx.fillRect(x+12,q.top+2*TS,16,q.base-q.top-2*TS);ctx.strokeRect(x+12,q.top+2*TS,16,q.base-q.top-2*TS)}
    }
  }
  ctx.restore();
}
// things drawn in front of the player that hide a secret: a waterfall, a piece of bark on a giant trunk
