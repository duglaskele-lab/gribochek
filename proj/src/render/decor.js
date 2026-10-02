/* ---------- decorations: grass, bushes, torches, cacti... and drawDecor(), which also draws kinds registered with registerDecor() ---------- */
function drawGrass(x,y,s){
  const n=3+(s*3|0),sw=Math.sin(time*1.6+x*.05)*2.5;ctx.lineCap='round';ctx.beginPath();
  for(let i=0;i<n;i++){const bx=x-8+i*16/(n-1),h=9+hash(i,x|0)*10;ctx.moveTo(bx,y+1);ctx.quadraticCurveTo(bx+sw*.4,y-h*.5,bx+sw+(i-n/2)*2.2,y-h)}
  ctx.strokeStyle='#3d5f28';ctx.lineWidth=3.2;ctx.stroke();ctx.strokeStyle='#7fb04a';ctx.lineWidth=1.4;ctx.stroke();
}
function drawBush(cx,by,s,shk=0){
  const w=26+s*10,sx=shk?Math.sin(time*45)*shk:0,B=[[-w*.62,-12,13],[w*.62,-11,12],[-w*.28,-22,16],[w*.26,-21,15],[0,-29,14]];
  ctx.beginPath();for(const [dx,dy,r] of B){ctx.moveTo(cx+sx+dx+r,by+dy);ctx.arc(cx+sx+dx,by+dy,r,0,7)}ctx.rect(cx+sx-w*.62,by-13,w*1.24,13);
  ctx.strokeStyle=INK;ctx.lineWidth=5;ctx.lineJoin='round';ctx.stroke();ctx.fillStyle='#3d6b35';ctx.fill();
  ctx.fillStyle='#4f8240';for(const [dx,dy,r] of B){ctx.beginPath();ctx.arc(cx+sx+dx-r*.2,by+dy-r*.25,r*.6,0,7);ctx.fill()}
  ctx.fillStyle='rgba(190,230,130,.55)';for(let k=0;k<5;k++){ctx.beginPath();ctx.ellipse(cx+sx+(hash(k,cx|0)-.5)*w*1.4,by-8-hash(k+5,cx|0)*24,3,1.8,hash(k,3)*3,0,7);ctx.fill()}
  if(s>.6){ctx.fillStyle='#d8452f';for(let k=0;k<3;k++){ctx.beginPath();ctx.arc(cx+sx+(hash(k,by|0)-.5)*w,by-10-hash(k+2,by|0)*16,2.4,0,7);ctx.fill()}}
}
function drawTorch(x,y,s){
  const top=y-56;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(x-13,y);ctx.lineTo(x,top+10);ctx.moveTo(x+13,y);ctx.lineTo(x,top+10);ctx.moveTo(x,y);ctx.lineTo(x,top+6);
  ctx.strokeStyle=INK;ctx.lineWidth=7;ctx.stroke();ctx.strokeStyle='#7a5230';ctx.lineWidth=3.5;ctx.stroke();
  ctx.strokeStyle='#c9a26b';ctx.lineWidth=2;ctx.beginPath();for(let k=0;k<3;k++){ctx.moveTo(x-4,top+14+k*4);ctx.lineTo(x+4,top+12+k*4)}ctx.stroke();
  const fl=.85+.15*Math.sin(time*13+s*20)+.08*Math.sin(time*29+s*7),fx=x,fy=top-2;
  const g=ctx.createRadialGradient(fx,fy-8,4,fx,fy-8,78*fl);g.addColorStop(0,'rgba(255,200,100,.38)');g.addColorStop(1,'rgba(255,170,60,0)');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(fx,fy-8,78*fl,0,7);ctx.fill();
  ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.fillStyle='#6f7880';ctx.beginPath();ctx.moveTo(x-14,top);ctx.quadraticCurveTo(x,top+18,x+14,top);ctx.closePath();ctx.fill();ctx.stroke();
  const flame=(w,h,c)=>{const sw=Math.sin(time*9+s*13)*3;ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(fx-w,fy);ctx.quadraticCurveTo(fx-w,fy-h*.55,fx+sw,fy-h);ctx.quadraticCurveTo(fx+w,fy-h*.55,fx+w,fy);ctx.quadraticCurveTo(fx,fy+w*.6,fx-w,fy);ctx.fill()};
  flame(11,30*fl,'#ff7a2a');flame(7.5,21*fl,'#ffb13b');flame(4,12*fl,'#fff0b8');
  if(Math.random()<.05) parts.push({x:fx+rand(-5,5),y:fy-18,vx:rand(-20,20),vy:rand(-90,-40),g:-30,c:Math.random()<.5?'#ffb13b':'#ff5a2a',s:rand(2,3.5),life:rand(.4,.8),max:0,t:'dot'});
}
function drawDecor(){
  for(const d of decor){ if(d.x<camX-140||d.x>camX+VW+140||d.y<camY-160||d.y>camY+VHZ+160) continue;
    switch(d.k){case 'grass':drawGrass(d.x,d.y,d.s);break;case 'bush':drawBush(d.x,d.y,d.s);break;case 'torch':drawTorch(d.x,d.y,d.s);break;
      case 'flower':drawFlower(d.x,d.y,d.s);break;case 'shroom':drawShrooms(d.x,d.y,d.s);break;case 'rock':drawRock(d.x,d.y,d.s);break;case 'bones':drawBones(d.x,d.y,d.s);break;
      case 'dcactus':drawDCactus(d.x,d.y,d.s);break;case 'dgrass':drawDGrass(d.x,d.y,d.s);break;case 'tent':drawTent(d.x,d.y,d.s);break;case 'palm':drawPalm(d.x,d.y,d.s);break;case 'well':drawWell(d.x,d.y);break;
      default: if(DECOR[d.k]) DECOR[d.k](d)}}
  for(const sp of springs) if(sp.x+sp.w>camX-40&&sp.x<camX+VW+40) drawSpring(sp);
}
// swamp rafts: horizontal drifting logs and lifts hanging on vines
function drawRaft(pl){
  const x=pl.x,y=pl.y,w=pl.w;ctx.lineJoin='round';ctx.lineCap='round';
  if(pl.lift){const top=pl.anchor!=null?pl.anchor:pl.y0-170;
    if(pl.anchor!=null){ctx.fillStyle='#5f8a3a';ctx.strokeStyle=INK;ctx.lineWidth=2;for(const vx of [x+12,x+w-12]){ctx.beginPath();ctx.ellipse(vx,top+2,6,4,0,0,7);ctx.fill();ctx.stroke()}}for(const vx of [x+12,x+w-12]){ctx.strokeStyle=INK;ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(vx,top);ctx.lineTo(vx,y+6);ctx.stroke();ctx.strokeStyle=BIOME==='desert'?'#c9a26b':'#5f8a3a';ctx.lineWidth=3;ctx.stroke()}
    ctx.fillStyle='#6fa04a';ctx.strokeStyle=INK;ctx.lineWidth=1.5;if(BIOME!=='desert')for(const vx of [x+12,x+w-12])for(let yy=y-26;yy>top;yy-=44){const s=((yy+vx)/44|0)%2?1:-1;ctx.beginPath();ctx.ellipse(vx+s*7,yy,7,3.5,s*.6,0,7);ctx.fill();ctx.stroke()}}
  ctx.strokeStyle=INK;ctx.lineWidth=3;
  for(let i=0;i<2;i++){ctx.fillStyle=i?'#6b4a2a':'#8a6238';ctx.beginPath();ctx.roundRect(x,y+1+i*8,w,11,5);ctx.fill();ctx.stroke()}
  ctx.fillStyle='#b98f5e';ctx.lineWidth=1.5;for(const ex of [x+5,x+w-5])for(let i=0;i<2;i++){ctx.beginPath();ctx.ellipse(ex,y+6.5+i*8,3.5,4.5,0,0,7);ctx.fill();ctx.stroke()}
  ctx.strokeStyle='#c9a26b';ctx.lineWidth=3;ctx.beginPath();for(const k of [.33,.67]){ctx.moveTo(x+w*k,y+1);ctx.lineTo(x+w*k+2,y+19)}ctx.stroke();
  ctx.fillStyle='#7aa048';ctx.fillRect(x+7,y-1,w-14,3);
}
function chiefSlam(e){
  const cx=e.x+e.w/2, by=e.y+e.h;
  shake(.35,9);sfx('boom');sfx('crack');
  for(let i=0;i<18;i++){const s=i<9?-1:1;parts.push({x:cx+s*rand(10,120),y:by-4,vx:s*rand(120,320),vy:rand(-220,-60),g:900,c:'rgba(170,160,120,.9)',s:rand(4,8),life:rand(.3,.6),max:0,t:'puff'})}
  const box={x:cx-125,y:by-55,w:250,h:60}, pb={x:P.x+3,y:P.y+6,w:P.w-6,h:P.h-6};
  if(!P.dead&&overlap(box,pb)) hurt(cx);
}

