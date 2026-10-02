/* ---------- ice cave drawing ---------- */
function drawIceBG(){
  const g=ctx.createLinearGradient(0,-OFFY,0,VH+OFFY);g.addColorStop(0,'#1b2840');g.addColorStop(.55,'#2c4264');g.addColorStop(1,'#1f3150');
  ctx.fillStyle=g;ctx.fillRect(0,-OFFY-2,VW,VH+OFFY*2+4);
  // far rock: hanging teeth above, rising ones below, both drifting slower than the camera
  const teeth=(fac,sp,colr,base,len,seed,top)=>{const o=camX*fac,yo=-camY*fac*.5;ctx.fillStyle=colr;ctx.beginPath();
    const edge=top?-OFFY-4:VH+OFFY+4,i0=Math.floor(o/sp)-1,i1=Math.floor((o+VW)/sp)+2;ctx.moveTo(i0*sp-o,edge);
    for(let i=i0;i<=i1;i++){const x=i*sp-o,h=hash(i,seed),h2=hash(i+1,seed),y0=base+h*24,tip=base+len*(.35+h*.9);
      ctx.lineTo(x,top?y0+yo:VH-y0+yo);ctx.lineTo(x+sp*(.35+h2*.3),top?tip+yo:VH-tip+yo)}
    ctx.lineTo(i1*sp-o,edge);ctx.closePath();ctx.fill()};
  teeth(.12,90,'rgba(52,74,108,.75)',30,90,3,true);teeth(.12,110,'rgba(52,74,108,.75)',40,70,5,false);
  teeth(.28,70,'rgba(30,45,72,.9)',-10,70,7,true);teeth(.28,84,'rgba(30,45,72,.9)',-6,60,9,false);
  // glowing crystals in the dark
  for(let i=0;i<22;i++){const sw=VW+80,x=((hash(i,11)*sw*3-camX*.22)%sw+sw)%sw-40,y=((hash(i,12)*VH*1.6-camY*.15)%(VH+40)+VH+40)%(VH+40)-20,
      a=.25+.35*Math.max(0,Math.sin(time*1.4+i*1.7)),s=2+hash(i,13)*3;
    ctx.fillStyle=`rgba(150,220,255,${a*.35})`;ctx.beginPath();ctx.arc(x,y,s*4,0,7);ctx.fill();
    ctx.fillStyle=`rgba(210,245,255,${a+.2})`;ctx.beginPath();ctx.moveTo(x,y-s*2);ctx.lineTo(x+s,y);ctx.lineTo(x,y+s*2);ctx.lineTo(x-s,y);ctx.closePath();ctx.fill()}
}
// daylight through the open roof (drawn behind the tiles, so the rock masks it)
function drawSkylights(){
  for(const s of skylights){if(s.x1<camX-60||s.x0>camX+VW+60)continue;
    const g=ctx.createLinearGradient(0,Math.max(0,camY)-OFFY,0,s.fy);g.addColorStop(0,'rgba(235,248,255,.5)');g.addColorStop(1,'rgba(200,230,255,.08)');
    ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(s.x0,-OFFY-60);ctx.lineTo(s.x1,-OFFY-60);ctx.lineTo(s.x1+40,s.fy);ctx.lineTo(s.x0-40,s.fy);ctx.closePath();ctx.fill();
    ctx.fillStyle='rgba(225,242,255,.6)';ctx.fillRect(s.x0,-OFFY-80,s.x1-s.x0,80+OFFY+30);
  }
}
function drawIceSolid(c,r,t,p){
  const x=c*TS,y=r*TS,h=hash(c,r),f=flow[r][c];
  const top=!vsol(c,r-1)&&r>0,bot=r<ROWS-1&&!vsol(c,r+1);
  if(f===ICE_B||t===T_CRACKW){ // clear ice: a stepping block, or a crystal wall that can be smashed
    const crys=t===T_CRACKW, same=(cc,rr)=>{const q=tile(cc,rr);return crys?q===T_CRACKW:(isSolidT(q)&&rr>=0&&rr<ROWS&&cc>=0&&cc<COLS&&flow[rr][cc]===ICE_B)};
    ctx.fillStyle=crys?'#93cfea':'#c3e9f9';ctx.fillRect(x-.5,y-.5,TS+1,TS+1);
    ctx.fillStyle='rgba(255,255,255,.5)';ctx.beginPath();ctx.moveTo(x+4,y+TS-7);ctx.lineTo(x+TS-12,y+4);ctx.lineTo(x+TS-5,y+4);ctx.lineTo(x+11,y+TS-7);ctx.closePath();ctx.fill();
    ctx.fillStyle='rgba(80,140,195,.22)';ctx.fillRect(x-.5,y+TS-9,TS+1,9);
    if(crys){ctx.save();ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x+6+h*6,y+3);ctx.lineTo(x+15,y+15);ctx.lineTo(x+9,y+26);ctx.lineTo(x+19,y+37);
      ctx.moveTo(x+15,y+15);ctx.lineTo(x+29,y+12);ctx.lineTo(x+35-h*4,y+3);ctx.moveTo(x+29,y+12);ctx.lineTo(x+27,y+27);ctx.lineTo(x+36,y+34);
      ctx.strokeStyle='rgba(255,255,255,.95)';ctx.lineWidth=3;ctx.stroke();ctx.strokeStyle='rgba(43,60,90,.75)';ctx.lineWidth=1.4;ctx.stroke();ctx.restore()}
    ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.beginPath();
    if(!same(c,r-1)){ctx.moveTo(x,y);ctx.lineTo(x+TS,y)}
    if(!same(c,r+1)){ctx.moveTo(x,y+TS);ctx.lineTo(x+TS,y+TS)}
    if(!same(c-1,r)){ctx.moveTo(x,y);ctx.lineTo(x,y+TS)}
    if(!same(c+1,r)){ctx.moveTo(x+TS,y);ctx.lineTo(x+TS,y+TS)}
    ctx.stroke();
    if(!crys&&top){ctx.strokeStyle='rgba(255,255,255,.95)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+5,y+4);ctx.lineTo(x+TS-6,y+4);ctx.stroke();ctx.strokeStyle=INK;ctx.lineWidth=3}
    return;
  }
  ctx.fillStyle=p.dirt;ctx.fillRect(x-.5,y-.5,TS+1,TS+1);
  ctx.fillStyle=p.dirt2;ctx.beginPath();ctx.arc(x+8+h*22,y+10+hash(r,c)*20,2.5+h*2.5,0,7);ctx.fill();
  if(h>.62){ctx.fillStyle=p.stone;ctx.beginPath();ctx.moveTo(x+18-h*8,y+24);ctx.lineTo(x+26-h*8,y+18);ctx.lineTo(x+32-h*8,y+26);ctx.lineTo(x+24-h*8,y+31);ctx.closePath();ctx.fill()}
  if(h<.07){ctx.fillStyle='rgba(170,225,255,.75)';ctx.beginPath();ctx.moveTo(x+12,y+9);ctx.lineTo(x+15,y+14);ctx.lineTo(x+12,y+19);ctx.lineTo(x+9,y+14);ctx.closePath();ctx.fill()}
  ctx.strokeStyle=INK;ctx.lineWidth=3;
  if(top){
    if(f===ICE_F){ // glassy frozen floor: a shiny cap with streaks
      ctx.fillStyle='#d4f1ff';ctx.fillRect(x-.5,y,TS+1,10);ctx.fillStyle='rgba(110,185,230,.6)';ctx.fillRect(x-.5,y+8,TS+1,3);
      ctx.strokeStyle='rgba(255,255,255,.95)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+3+h*12,y+4);ctx.lineTo(x+15+h*12,y+4);ctx.moveTo(x+24-h*6,y+6);ctx.lineTo(x+30-h*6,y+6);ctx.stroke();ctx.strokeStyle=INK;ctx.lineWidth=3}
    else{ctx.fillStyle=p.top;ctx.beginPath();ctx.moveTo(x-.5,y);ctx.lineTo(x+TS+.5,y);ctx.lineTo(x+TS+.5,y+7);
      for(let k=3;k>=0;k--)ctx.quadraticCurveTo(x+k*10+5,y+13+hash(c,k)*4,x+k*10,y+7);ctx.fill();
      ctx.fillStyle=p.top2;ctx.fillRect(x-.5,y+5,TS+1,2)}
    ctx.beginPath();ctx.moveTo(x-.5,y);ctx.lineTo(x+TS+.5,y);ctx.stroke()}
  if(!vsol(c-1,r)&&c>0){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+TS);ctx.stroke()}
  if(!vsol(c+1,r)&&c<COLS-1){ctx.beginPath();ctx.moveTo(x+TS,y);ctx.lineTo(x+TS,y+TS);ctx.stroke()}
  if(bot){ // the underside of the roof: a frosty fringe with little icicles
    ctx.fillStyle='#cfeaf8';ctx.beginPath();ctx.moveTo(x,y+TS);
    for(let k=0;k<3;k++){const ix=x+6+k*12+hash(c,k+20)*4,L=4+hash(c+k,r)*9;ctx.lineTo(ix-3,y+TS);ctx.lineTo(ix,y+TS+L);ctx.lineTo(ix+3,y+TS)}
    ctx.lineTo(x+TS,y+TS);ctx.closePath();ctx.fill();ctx.lineWidth=1.5;ctx.stroke();ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(x,y+TS);ctx.lineTo(x+TS,y+TS);ctx.stroke()}
  if(t===T_CRACK){ctx.save();ctx.strokeStyle='rgba(43,26,18,.3)';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(x+8+h*6,y+12);ctx.lineTo(x+14+h*6,y+19);ctx.lineTo(x+11+h*6,y+27);
    ctx.moveTo(x+28-h*5,y+14);ctx.lineTo(x+24-h*5,y+21);ctx.stroke();ctx.restore()}
}
function drawIcicle(x,y,s){
  const L=16+s*34,w=5+s*6;ctx.fillStyle='#cdeefc';ctx.strokeStyle=INK;ctx.lineWidth=2.2;ctx.lineJoin='round';
  ctx.beginPath();ctx.moveTo(x-w,y-1);ctx.quadraticCurveTo(x-w*.3,y+L*.5,x,y+L);ctx.quadraticCurveTo(x+w*.3,y+L*.5,x+w,y-1);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(x-w*.4,y+3);ctx.lineTo(x-w*.12,y+L*.6);ctx.stroke();
  const ph=(time*.5+s*7)%1;if(s>.5&&ph<.4){ctx.fillStyle='rgba(200,235,255,.85)';ctx.beginPath();ctx.arc(x,y+L+3+ph*60,2.2,0,7);ctx.fill()}   // a drip now and then
}
function drawCrystal(x,y,s){
  const c1=s>.5?'#9fe0ff':'#c9b2ff',c2=s>.5?'#5fb0de':'#9a82e0',glow=.25+.2*Math.sin(time*2+x*.05);
  ctx.fillStyle=s>.5?`rgba(150,220,255,${glow})`:`rgba(200,170,255,${glow})`;ctx.beginPath();ctx.ellipse(x,y-10,24,18,0,0,7);ctx.fill();
  ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.lineJoin='round';
  for(const [dx,hh,a,w] of [[-9,18,-.35,6],[9,16,.4,6],[0,28,0,8]]){ctx.save();ctx.translate(x+dx,y);ctx.rotate(a);
    ctx.fillStyle=c1;ctx.beginPath();ctx.moveTo(-w,0);ctx.lineTo(-w,-hh);ctx.lineTo(0,-hh-w);ctx.lineTo(w,-hh);ctx.lineTo(w,0);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle=c2;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-hh-w);ctx.lineTo(w,-hh);ctx.lineTo(w,0);ctx.closePath();ctx.fill();ctx.restore()}
}
function drawSnowDrift(x,y,s){
  const w=22+s*20;ctx.fillStyle='#f2f8ff';ctx.strokeStyle=INK;ctx.lineWidth=2.2;
  ctx.beginPath();ctx.moveTo(x-w,y+1);ctx.quadraticCurveTo(x-w*.45,y-9-s*8,x,y-7-s*6);ctx.quadraticCurveTo(x+w*.5,y-12-s*6,x+w,y+1);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='rgba(170,205,235,.55)';ctx.beginPath();ctx.ellipse(x+w*.25,y-2,w*.4,3,0,0,7);ctx.fill();
}
function drawFlake(x,y,r,rot,glow){
  ctx.save();ctx.translate(x,y);ctx.rotate(rot);
  if(glow){ctx.fillStyle='rgba(150,215,255,.35)';ctx.beginPath();ctx.arc(0,0,r*1.7,0,7);ctx.fill()}
  ctx.lineCap='round';
  for(const [w,c] of [[6,INK],[3.2,'#e8f8ff']]){ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();
    for(let k=0;k<6;k++){const a=k*Math.PI/3,ca=Math.cos(a),sa=Math.sin(a);ctx.moveTo(0,0);ctx.lineTo(ca*r,sa*r);
      const bx=ca*r*.55,by=sa*r*.55;for(const s of [-1,1]){const b=a+s*.7;ctx.moveTo(bx,by);ctx.lineTo(bx+Math.cos(b)*r*.35,by+Math.sin(b)*r*.35)}}
    ctx.stroke()}
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,0,r*.22,0,7);ctx.fill();
  ctx.restore();
}

