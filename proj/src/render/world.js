/* ---------- drawing ---------- */
const PAL={
  forest:{sky1:'#8cc4cf',sky2:'#e8e0b0',hill:'#9cbf9a',hill2:'#6f9a78',dirt:'#8b5a36',dirt2:'#6f4527',stone:'#a67a50',top:'#79ab4c',top2:'#5d8a38',sun:'rgba(255,246,200,.55)'},
  swamp:{sky1:'#4f6f5a',sky2:'#a7b98a',hill:'#5f7a5a',hill2:'#44604a',dirt:'#5c4a33',dirt2:'#473824',stone:'#7d6d4d',top:'#5f8a3a',top2:'#4a7030',sun:'rgba(0,0,0,0)'},
  desert:{sky1:'#f3b36b',sky2:'#fbe7b5',hill:'#e8c78c',hill2:'#d4a86a',dirt:'#d9b26e',dirt2:'#b98d4b',stone:'#c49a5c',top:'#f0d493',top2:'#dcb36d',sun:'rgba(255,250,215,.8)'},
};
const pal=()=>LV().pal||PAL[BIOME];
function mixHex(a,b,t){const pa=parseInt(a.slice(1),16),pb=parseInt(b.slice(1),16);const r=Math.round(((pa>>16)&255)*(1-t)+((pb>>16)&255)*t),g=Math.round(((pa>>8)&255)*(1-t)+((pb>>8)&255)*t),bl=Math.round((pa&255)*(1-t)+(pb&255)*t);return `rgb(${r},${g},${bl})`}
function drawBG(){
  if(LV().drawBG){LV().drawBG();return}
  const p=pal();
  const g=ctx.createLinearGradient(0,0,0,VH);
  g.addColorStop(0,skyHeat>0?mixHex(p.sky1,'#7a1f1a',skyHeat*.7):p.sky1);
  g.addColorStop(1,skyHeat>0?mixHex(p.sky2,'#e0622e',skyHeat*.6):p.sky2);
  ctx.fillStyle=g; ctx.fillRect(0,-OFFY-2,VW,VH+OFFY*2+4);
  ctx.fillStyle=p.sun; ctx.beginPath(); ctx.arc(VW*.72,120,BIOME==='desert'?90:70,0,7); ctx.fill();
  const layer=(fac,base,amp,colr,freq)=>{
    ctx.fillStyle=colr; ctx.beginPath(); ctx.moveTo(0,VH+OFFY+4);
    const o=camX*fac;
    for(let x=0;x<=VW+20;x+=20){const wx=x+o;ctx.lineTo(x,base+Math.sin(wx*freq)*amp+Math.sin(wx*freq*2.7+1)*amp*.4)}
    ctx.lineTo(VW,VH+OFFY+4); ctx.fill();
  };
  layer(.12,330,BIOME==='desert'?30:40,p.hill,BIOME==='desert'?.003:.004);
  const fac=.3,o=camX*fac, spacing=BIOME==='desert'?340:230;
  for(let i=Math.floor(o/spacing)-1;i<=Math.floor((o+VW)/spacing)+1;i++){
    const h=hash(i,7), x=i*spacing-o+h*120;
    if(BIOME==='forest'){
      const H=170+h*140, cw=90+h*70;
      ctx.fillStyle='#7ea58a'; ctx.fillRect(x-9,420-H,18,H+100);
      ctx.fillStyle=h>.5?'#b98a6a':'#a9927a';
      ctx.beginPath(); ctx.ellipse(x,420-H,cw/2,cw*.32,0,Math.PI,0); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.35)';
      for(let k=0;k<4;k++){ctx.beginPath();ctx.arc(x-cw*.3+k*cw*.2,420-H-cw*.12-hash(i,k)*cw*.1,3+hash(k,i)*3,0,7);ctx.fill()}
    }else{
      if(h>.55){const s=110+h*90;ctx.fillStyle='#d9ae72';ctx.beginPath();ctx.moveTo(x-s,420);ctx.lineTo(x,420-s*.85);ctx.lineTo(x+s,420);ctx.fill();
        ctx.fillStyle='#c79858';ctx.beginPath();ctx.moveTo(x,420-s*.85);ctx.lineTo(x+s,420);ctx.lineTo(x+s*.25,420);ctx.fill()}
      else{ctx.fillStyle='#a7b86a';const H=60+h*60;ctx.beginPath();ctx.roundRect(x-8,420-H,16,H+60,8);ctx.fill();
        ctx.beginPath();ctx.roundRect(x-26,420-H*.7,12,H*.4,6);ctx.fill();ctx.beginPath();ctx.roundRect(x+14,420-H*.8,12,H*.35,6);ctx.fill()}
    }
  }
  if(BIOME==='desert'&&ruinSpan){ // the ruined town on the horizon fades in as you get close to it
    const cx=camX+VW/2, d=cx<ruinSpan[0]?ruinSpan[0]-cx:cx>ruinSpan[1]?cx-ruinSpan[1]:0, al=clamp(1-d/1100,0,1);
    if(al>0){ctx.save();ctx.globalAlpha=al;ctx.strokeStyle='rgba(120,80,40,.35)';ctx.lineWidth=2;const f=.22,o=camX*f,sp=120;
      for(let i=Math.floor(o/sp)-1;i<=Math.floor((o+VW)/sp)+1;i++){const h=hash(i,41),x=i*sp-o+h*40,base=432;
        ctx.fillStyle=h>.5?'#d2a56c':'#c99a60';
        if(h<.22){const H=120+h*200;ctx.fillRect(x-7,base-H,14,H);ctx.strokeRect(x-7,base-H,14,H);ctx.fillRect(x-11,base-H-6,22,8);onionDome(x,base-H-6,22,26,'#c99a60')}
        else if(h<.6){const W=60+h*60,H=50+h*50;ctx.fillRect(x-W/2,base-H,W,H);ctx.strokeRect(x-W/2,base-H,W,H);if(h>.35)onionDome(x,base-H,W*.6,40+h*30,'#cfa266');
          ctx.fillStyle='rgba(90,60,30,.35)';ruinArch(x-8,base-H*.7,16,H*.5);ctx.fill()}
        else{const W=40+h*40,H=30+h*40;ctx.beginPath();ctx.moveTo(x-W/2,base);ctx.lineTo(x-W/2,base-H);ctx.lineTo(x-W*.1,base-H+10);ctx.lineTo(x+W*.15,base-H-8);ctx.lineTo(x+W/2,base-H+4);ctx.lineTo(x+W/2,base);ctx.closePath();ctx.fill();ctx.stroke()}}
      ctx.restore()}
  }
  layer(.5,440,22,p.hill2,.009);
}
const rowLo=()=>Math.max(0,Math.floor((camY-OFFY/camZ)/TS)-1), rowHi=()=>Math.min(ROWS-1,Math.ceil((camY+VHZ+OFFY/camZ)/TS)+1);
// solid-looking for drawing: real solids plus fake walls that have not been found yet
const vsol=(c,r)=>{const t=tile(c,r);return isSolidT(t)||(t===T_FAKE&&flow[r][c]!==8)};
function roofed(c,r){for(let k=r-1;k>=0;k--){const t=grid[k][c];if(isSolidT(t))return true;if(t!==T_WATER)return false}return false}
// ruin bricks: sandstone courses with mortar joints, a chipped top edge and clear cracks on breakable walls
function drawBrick(c,r,t){
  const x=c*TS,y=r*TS,h=hash(c,r);
  ctx.fillStyle=h>.78?'#cfa46b':'#dcb47c';ctx.fillRect(x-.5,y-.5,TS+1,TS+1);
  ctx.save();ctx.strokeStyle='rgba(122,82,40,.55)';ctx.lineWidth=1.6;ctx.beginPath();
  for(let k=1;k<3;k++){ctx.moveTo(x,y+k*13.3);ctx.lineTo(x+TS,y+k*13.3)}
  for(let k=0;k<3;k++){const off=((r+k)%2)?10:30;ctx.moveTo(x+off,y+k*13.3);ctx.lineTo(x+off,y+(k+1)*13.3)}
  ctx.stroke();
  ctx.fillStyle='rgba(255,240,205,.35)';ctx.fillRect(x+3,y+3,12,3);
  const sw=switches.find(q=>!q.done&&q.c===c&&q.r===r);
  if(sw){ctx.fillStyle='rgba(122,82,40,.18)';ctx.fillRect(x+12,y+15,18,11);ctx.strokeStyle='rgba(122,82,40,.5)';ctx.lineWidth=1.2;ctx.strokeRect(x+12.5,y+15.5,17,10)}
  ctx.restore();
  ctx.strokeStyle=INK;ctx.lineWidth=3;
  const up=tile(c,r-1),top=!vsol(c,r-1)&&up!==T_WATER&&up!==T_SAND;
  if(top){ctx.fillStyle='#ecd09a';ctx.fillRect(x-.5,y,TS+1,5);ctx.beginPath();ctx.moveTo(x-.5,y);
    if(h>.55){ctx.lineTo(x+12,y);ctx.lineTo(x+15,y+5);ctx.lineTo(x+21,y+4);ctx.lineTo(x+23,y)}ctx.lineTo(x+TS+.5,y);ctx.stroke()}
  if(!vsol(c-1,r)&&c>0){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+TS);ctx.stroke()}
  if(!vsol(c+1,r)&&c<COLS-1){ctx.beginPath();ctx.moveTo(x+TS,y);ctx.lineTo(x+TS,y+TS);ctx.stroke()}
  if(r<ROWS-1&&!vsol(c,r+1)){ctx.beginPath();ctx.moveTo(x,y+TS);ctx.lineTo(x+TS,y+TS);ctx.stroke()}
  if(t===T_CRACKW){ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x+6,y+4);ctx.lineTo(x+14,y+16);ctx.lineTo(x+10,y+26);ctx.lineTo(x+20,y+36);
    ctx.moveTo(x+30,y+3);ctx.lineTo(x+24,y+14);ctx.lineTo(x+32,y+22);ctx.moveTo(x+14,y+16);ctx.lineTo(x+24,y+14);ctx.stroke();ctx.lineWidth=3}
}
function drawSolid(c,r,t,p){
  if(LV().drawSolid){LV().drawSolid(c,r,t,p);return}
  if(flow[r][c]===4){drawBrick(c,r,t);return}
  const x=c*TS,y=r*TS;
      ctx.fillStyle=p.dirt; ctx.fillRect(x-.5,y-.5,TS+1,TS+1);
      const h=hash(c,r);
      ctx.fillStyle=p.dirt2; ctx.beginPath(); ctx.arc(x+8+h*22,y+10+hash(r,c)*20,2.5+h*2,0,7); ctx.fill();
      if(h>.6){ctx.fillStyle=p.stone;ctx.beginPath();ctx.ellipse(x+26-h*10,y+28,5,3.5,0,0,7);ctx.fill()}
      const up=tile(c,r-1), top=!vsol(c,r-1)&&up!==T_WATER&&up!==T_SAND;
      if(top){
        ctx.fillStyle=p.top; ctx.beginPath(); ctx.moveTo(x-.5,y);
        ctx.lineTo(x+TS+.5,y); ctx.lineTo(x+TS+.5,y+10);
        for(let k=3;k>=0;k--) ctx.quadraticCurveTo(x+k*10+5,y+18+hash(c,k)*4,x+k*10,y+10);
        ctx.fill();
        ctx.fillStyle=p.top2; ctx.fillRect(x-.5,y+2,TS+1,3);
        ctx.beginPath(); ctx.moveTo(x-.5,y); ctx.lineTo(x+TS+.5,y); ctx.stroke();
        if(BIOME!=='desert'&&hash(c,99)>.6){ctx.beginPath();const gx=x+hash(c,5)*30+5;ctx.moveTo(gx,y);ctx.lineTo(gx-3,y-8);ctx.moveTo(gx+4,y);ctx.lineTo(gx+6,y-10);ctx.stroke()}
        if(BIOME==='desert'&&hash(c,98)>.8){ctx.fillStyle=p.stone;ctx.beginPath();ctx.ellipse(x+hash(c,4)*30+5,y-2,5,3,0,Math.PI,0);ctx.fill();ctx.stroke()}
      }
      if(!vsol(c-1,r)&&c>0){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+TS);ctx.stroke()}
      if(!vsol(c+1,r)&&c<COLS-1){ctx.beginPath();ctx.moveTo(x+TS,y);ctx.lineTo(x+TS,y+TS);ctx.stroke()}
      if(r<ROWS-1&&!vsol(c,r+1)){ctx.beginPath();ctx.moveTo(x,y+TS);ctx.lineTo(x+TS,y+TS);ctx.stroke()}
      // secret cracks are only faint hairlines now
      if(t===T_CRACK||t===T_CRACKW){ctx.save();ctx.strokeStyle='rgba(43,26,18,.3)';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(x+8+h*6,y+8);ctx.lineTo(x+14+h*6,y+17);ctx.lineTo(x+11+h*6,y+25);
        ctx.moveTo(x+28-h*5,y+12);ctx.lineTo(x+24-h*5,y+19);ctx.stroke();ctx.restore()}
}
// fake walls are drawn over the player and the hidden room; once found they turn see-through
