function drawItems(){
  for(const it of items){
    const y=it.y+(it.drop?0:Math.sin(it.ph)*4);
    if(it.x<camX-40||it.x>camX+VW+40) continue;
    if(it.hid&&!it.hid.found&&Math.hypot(it.x-P.x-P.w/2,it.y-P.y-P.h/2)>150) continue;   // treasure in a hiding place shows up only up close
    if(it.k==='spore') sporeIcon(it.x,y,1+Math.sin(it.ph*1.5)*.06);
    else if(it.k==='gold') sporeIcon(it.x,y,1.1+Math.sin(it.ph*1.5)*.08,true);
    else if(it.k==='heart') heart(it.x,y,1.4);
    else if(it.k==='power'){ctx.fillStyle='rgba(255,90,70,.3)';ctx.beginPath();ctx.arc(it.x,y,22+Math.sin(it.ph*2)*3,0,7);ctx.fill();mushroom(it.x,y+6,15,0,true)}
  }
}
function drawChecks(){
  for(const c of checks){
    const x=c.x,y=c.y; if(x<camX-60||x>camX+VW+60) continue;
    ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.fillStyle='#7a4b2b';ctx.fillRect(x-3,y-56,6,56);ctx.strokeRect(x-3,y-56,6,56);
    if(c.on){ctx.fillStyle='rgba(255,220,120,.45)';ctx.beginPath();ctx.arc(x,y-62,22+Math.sin(time*4)*2,0,7);ctx.fill()}
    mushroom(x,y-56,14,0,false);
    if(!c.on){ctx.fillStyle='rgba(43,26,18,.35)';ctx.beginPath();ctx.arc(x,y-58,14,Math.PI,0);ctx.fill()}
  }
}
function drawShop(sh){
  const x=sh.x,y=sh.y,bob=Math.sin(time*2+x)*2; if(x<camX-120||x>camX+VW+120) return;
  ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.lineJoin='round';
  // posts
  ctx.fillStyle='#7a4b2b';[x-70,x+62].forEach(px=>{ctx.fillRect(px,y-118,8,118);ctx.strokeRect(px,y-118,8,118)});
  // crooked sign on the left post
  ctx.save();ctx.translate(x-96,y-96);ctx.rotate(-.12+Math.sin(time*1.5+x)*.03);
  ctx.fillStyle='#7a4b2b';ctx.fillRect(22,-6,8,16);ctx.strokeRect(22,-6,8,16);
  ctx.fillStyle='#c9965e';ctx.beginPath();ctx.moveTo(-30,-2);ctx.lineTo(30,-6);ctx.lineTo(32,18);ctx.lineTo(-28,22);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle=INK;ctx.font='13px '+FONT;ctx.textAlign='center';ctx.fillText(T('shopSign'),1,13);ctx.restore();
  // huge backpack behind the trader
  const bx=x+12,byy=y-40+bob*.5;
  ctx.fillStyle='#6e4a2c';ctx.beginPath();ctx.roundRect(bx,byy-62,50,62,[14,14,6,6]);ctx.fill();ctx.stroke();
  ctx.fillStyle='#8a6038';ctx.beginPath();ctx.roundRect(bx+20,byy-44,26,20,5);ctx.fill();ctx.stroke(); // pocket
  ctx.strokeStyle=INK;ctx.lineWidth=3;
  [['#8fd0e8',bx+56,byy-50,7],['#f2a0c0',bx+56,byy-24,7]].forEach(([c,jx,jy,r])=>{ // jars hanging on the side
    ctx.fillStyle=c;ctx.beginPath();ctx.roundRect(jx-r,jy-r,r*2,r*2.2,4);ctx.fill();ctx.stroke();
    ctx.fillStyle='#8a5a36';ctx.fillRect(jx-r+1,jy-r-4,r*2-2,5);ctx.strokeRect(jx-r+1,jy-r-4,r*2-2,5)});
  mushroom(bx+30,byy-64,9,-.3,false); mushroom(bx+44,byy-62,7,.35,true);
  ctx.fillStyle='#9aa0a6';ctx.beginPath();ctx.arc(bx+10,byy-20,8,0,7);ctx.fill();ctx.stroke(); // little pan
  // the mole trader in a brown hooded cloak
  const mx=x-14,my=y-40+bob;
  ctx.fillStyle='#8a5a34';ctx.beginPath();ctx.moveTo(mx-30,my);ctx.quadraticCurveTo(mx-32,my-46,mx-24,my-62);
  ctx.quadraticCurveTo(mx,my-104,mx+24,my-62);ctx.quadraticCurveTo(mx+32,my-46,mx+30,my);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.strokeStyle='rgba(43,26,18,.45)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(mx-12,my-30);ctx.lineTo(mx-14,my);ctx.moveTo(mx+12,my-30);ctx.lineTo(mx+14,my);ctx.stroke();
  ctx.fillStyle='#c9a26a';ctx.fillRect(mx-24,my-26,48,5); // rope belt
  ctx.strokeStyle=INK;ctx.lineWidth=3;
  // open face: grey fur, pale snout, pink nose
  ctx.fillStyle='#6d625e';ctx.beginPath();ctx.ellipse(mx,my-62,17,18,0,0,7);ctx.fill();ctx.stroke();
  ctx.fillStyle='#b8aaa2';ctx.beginPath();ctx.ellipse(mx+2,my-52,10,8,0,0,7);ctx.fill();
  ctx.fillStyle='#f29aa8';ctx.beginPath();ctx.ellipse(mx+3,my-56,5,4,0,0,7);ctx.fill();ctx.stroke();
  ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(mx-6,my-52);ctx.lineTo(mx-20,my-55);ctx.moveTo(mx-6,my-49);ctx.lineTo(mx-20,my-48);
  ctx.moveTo(mx+12,my-52);ctx.lineTo(mx+24,my-55);ctx.moveTo(mx+12,my-49);ctx.lineTo(mx+24,my-48);ctx.stroke();
  // tiny round spectacles
  ctx.lineWidth=2.2;ctx.fillStyle='rgba(220,240,255,.55)';
  [[-6,-67],[8,-67]].forEach(([ex,ey])=>{ctx.beginPath();ctx.arc(mx+ex,my+ey,6,0,7);ctx.fill();ctx.stroke()});
  ctx.beginPath();ctx.moveTo(mx-0,my-67);ctx.lineTo(mx+2,my-67);ctx.stroke();
  const blink=(time+x*.01)%4<.14;
  ctx.fillStyle=INK;[[-6,-67],[8,-67]].forEach(([ex,ey])=>{ctx.beginPath();blink?ctx.fillRect(mx+ex-3,my+ey,6,1.5):ctx.arc(mx+ex,my+ey+1,1.8,0,7);ctx.fill()});
  ctx.fillStyle='rgba(255,255,255,.9)';ctx.beginPath();ctx.arc(mx-8+Math.sin(time)*1.5,my-70,1.5,0,7);ctx.fill();
  // hood rim over the forehead
  ctx.fillStyle='#8a5a34';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(mx-19,my-68);ctx.quadraticCurveTo(mx,my-92,mx+19,my-68);ctx.quadraticCurveTo(mx,my-82,mx-19,my-68);ctx.fill();ctx.stroke();
  // awning: patched canvas
  for(let k=0;k<7;k++){const ax=x-78+k*22.3;ctx.fillStyle=k%2?'#a8784a':'#e6d3ae';ctx.beginPath();ctx.moveTo(ax,y-138);ctx.lineTo(ax+22.3,y-138);
    ctx.lineTo(ax+22.3,y-118);ctx.quadraticCurveTo(ax+11,y-106,ax,y-118);ctx.closePath();ctx.fill();ctx.stroke()}
  ctx.fillStyle='#7c5a3a';ctx.beginPath();ctx.moveTo(x-84,y-138);ctx.lineTo(x,y-162);ctx.lineTo(x+84,y-138);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='#c9965e';ctx.beginPath();ctx.rect(x+18,y-152,16,10);ctx.fill();ctx.stroke();
  ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x+20,y-150);ctx.lineTo(x+32,y-144);ctx.moveTo(x+32,y-150);ctx.lineTo(x+20,y-144);ctx.stroke();ctx.lineWidth=3;
  // counter with the mole's big digging paws resting on it
  ctx.fillStyle='#a8744a';ctx.beginPath();ctx.roundRect(x-74,y-44,148,44,4);ctx.fill();ctx.stroke();
  ctx.fillStyle='#8b5a36';ctx.fillRect(x-74,y-44,148,8);ctx.strokeRect(x-74,y-44,148,8);
  [mx-20,mx+16].forEach(px=>{ctx.fillStyle='#f2b8b0';ctx.beginPath();ctx.ellipse(px,y-46,9,6,0,Math.PI,0);ctx.fill();ctx.stroke();
    ctx.fillStyle='#fff6e0';for(let k=0;k<3;k++){ctx.beginPath();ctx.moveTo(px-6+k*5,y-47);ctx.lineTo(px-4+k*5,y-41);ctx.lineTo(px-2+k*5,y-47);ctx.fill()}});
  heart(x-52,y-54,1.1); sporeIcon(x+40,y-54,.8); mushroom(x+60,y-50,8,0,true);
  if(nearShop===sh&&!isTouch){
    ctx.font='20px '+FONT;ctx.textAlign='center';const t=T('shopPrompt'),w=ctx.measureText(t).width+22;
    ctx.fillStyle='#fff';ctx.beginPath();ctx.roundRect(x-w/2,y-202,w,30,10);ctx.fill();ctx.stroke();
    ctx.fillStyle=INK;ctx.fillText(t,x,y-181);
  }
}
function drawDoor(){
  const d=door, x=d.x, y=d.y; if(x<camX-200||x>camX+VW+200) return;
  if(BIOME==='swamp'&&!bossDead) return;   // the stump door rises where the hydra sat
  ctx.strokeStyle=INK;ctx.lineWidth=3.5;
  if(BIOME!=='desert'){
    ctx.fillStyle='#8a6a4a';ctx.beginPath();ctx.roundRect(x-40,y-40,d.w+80,d.h+40,[30,30,0,0]);ctx.fill();ctx.stroke();
    ctx.fillStyle='#d2691e';ctx.beginPath();ctx.ellipse(x+d.w/2,y-40,d.w/2+80,48,0,Math.PI,0);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#fff';[[-50,-62,8],[0,-78,10],[48,-60,7],[-85,-48,5],[86,-46,6]].forEach(([dx,dy,r])=>{ctx.beginPath();ctx.arc(x+d.w/2+dx,y+dy,r,0,7);ctx.fill()});
  }else{
    ctx.fillStyle='#caa46a';ctx.beginPath();ctx.moveTo(x-60,y+d.h);ctx.lineTo(x-60,y-30);ctx.lineTo(x+d.w/2,y-90);ctx.lineTo(x+d.w+60,y-30);ctx.lineTo(x+d.w+60,y+d.h);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.strokeStyle='rgba(43,26,18,.35)';ctx.lineWidth=2;for(let k=0;k<4;k++){ctx.beginPath();ctx.moveTo(x-60,y-10+k*30);ctx.lineTo(x+d.w+60,y-10+k*30);ctx.stroke()}ctx.strokeStyle=INK;ctx.lineWidth=3.5;
  }
  ctx.fillStyle=bossDead?'#ffe7a3':'#5a3a22';
  ctx.beginPath();ctx.roundRect(x,y,d.w,d.h,[38,38,0,0]);ctx.fill();ctx.stroke();
  if(!bossDead){ctx.lineWidth=2;for(let k=1;k<4;k++){ctx.beginPath();ctx.moveTo(x+k*d.w/4,y+6);ctx.lineTo(x+k*d.w/4,y+d.h);ctx.stroke()}}
  else{ctx.fillStyle='rgba(255,231,163,.35)';ctx.beginPath();ctx.arc(x+d.w/2,y+d.h/2,70+Math.sin(time*3)*6,0,7);ctx.fill()}
}
