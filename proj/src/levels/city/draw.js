/* ---------- ruined city drawing ---------- */
// A smoky dusk: the sky goes from bruised violet to a sick orange glow low down, ruined towers stand in two layers
// (a few windows still glow purple: whatever came out of the ground is out there), smoke rises from fires far off,
// and purple ash drifts down.
function drawCityBG(){
  const g=ctx.createLinearGradient(0,-OFFY,0,VH+OFFY);g.addColorStop(0,'#2a1f3f');g.addColorStop(.45,'#5a3a5e');g.addColorStop(.78,'#c4706a');g.addColorStop(1,'#e8a26a');
  ctx.fillStyle=g;ctx.fillRect(0,-OFFY-2,VW,VH+OFFY*2+4);
  // a hazy sun behind the smog
  const sx=VW*.72-camX*.02,sy=VH*.52-camY*.05;ctx.fillStyle='rgba(255,200,150,.25)';ctx.beginPath();ctx.arc(sx,sy,90,0,7);ctx.fill();ctx.fillStyle='rgba(255,220,180,.55)';ctx.beginPath();ctx.arc(sx,sy,46,0,7);ctx.fill();
  // smoke columns far away
  for(let i=0;i<4;i++){const sw=VW+400,bx=((hash(i,41)*sw*2-camX*.08)%sw+sw)%sw-200,base=VH*.62-camY*.08;
    for(let k=0;k<7;k++){const ph=(time*.06+k/7)%1,y=base-ph*VH*.7,x=bx+Math.sin(ph*5+i)*30*ph+ph*80,r=18+ph*60;
      ctx.fillStyle=`rgba(60,45,70,${.32*(1-ph)})`;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill()}}
  // two layers of ruined towers
  const towers=(fac,seed,base,hMin,hMax,colr,win)=>{const o=camX*fac,yo=-camY*fac*.6,sp=70;
    const i0=Math.floor(o/sp)-1,i1=Math.floor((o+VW)/sp)+2;
    for(let i=i0;i<=i1;i++){const h=hash(i,seed);if(h<.12)continue;const w=sp*(.7+hash(i,seed+1)*.5),x=i*sp-o,top=base-hMin-(hMax-hMin)*hash(i,seed+2)+yo;
      ctx.fillStyle=colr;ctx.beginPath();ctx.moveTo(x,VH+OFFY+10);ctx.lineTo(x,top+10);
      // a broken, jagged top
      const n=4;for(let k=0;k<=n;k++){const u=k/n;ctx.lineTo(x+w*u,top+(hash(i*7+k,seed+3)>.5?hash(i+k,seed+4)*34:0))}
      ctx.lineTo(x+w,VH+OFFY+10);ctx.closePath();ctx.fill();
      if(win){for(let wy=top+26;wy<VH+OFFY;wy+=22)for(let wx=x+8;wx<x+w-10;wx+=16){const hh=hash(Math.floor(wx*.7+i),Math.floor(wy));
        if(hh<.08){const a=.35+.3*Math.sin(time*1.3+hh*90);ctx.fillStyle=`rgba(200,120,255,${a})`;ctx.fillRect(wx,wy,7,10)}
        else if(hh<.5){ctx.fillStyle='rgba(20,14,28,.45)';ctx.fillRect(wx,wy,7,10)}}}}};
  towers(.12,51,VH*.78,120,300,'rgba(70,52,84,.85)',true);
  towers(.3,61,VH*.95,60,220,'rgba(42,32,52,.95)',true);
  // drifting purple ash
  for(let i=0;i<26;i++){const sw=VW+60,x=((hash(i,71)*sw*3-camX*.4+Math.sin(time*.7+i)*30)%sw+sw)%sw-30,y=((hash(i,72)*VH+time*(14+hash(i,73)*18)-camY*.3)%(VH+40)+VH+40)%(VH+40)-20;
    ctx.fillStyle=`rgba(210,160,255,${.25+hash(i,74)*.35})`;ctx.beginPath();ctx.arc(x,y,1.4+hash(i,75)*1.8,0,7);ctx.fill()}
}
// behind the tiles: the insides of buildings and basements, and the steel girder over the Mutank's street
function drawCityBack(){
  const c0=Math.max(0,Math.floor(camX/TS)-1),c1=Math.min(COLS-1,Math.ceil((camX+VW)/TS)+1);
  for(let c=c0;c<=c1;c++)for(let r=rowLo();r<=rowHi();r++){const b=cityBg&&cityBg[r][c];if(!b)continue;const x=c*TS,y=r*TS,h=hash(c,r);
    if(b===1){ctx.fillStyle='#4c4256';ctx.fillRect(x-.5,y-.5,TS+1,TS+1);   // old wallpaper, stained and peeling
      ctx.fillStyle='rgba(120,100,130,.35)';if((c+r)%2)ctx.fillRect(x+4,y,6,TS);
      if(h<.18){ctx.fillStyle='rgba(30,22,36,.5)';ctx.beginPath();ctx.ellipse(x+20,y+20,14,9,h*9,0,7);ctx.fill()}
      if(h>.9){ctx.fillStyle='#8a5a3a';ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.strokeRect(x+10,y+8,18,14);ctx.fillStyle='rgba(255,220,160,.35)';ctx.fillRect(x+12,y+10,14,10)}}
    else{ctx.fillStyle='#2e2a33';ctx.fillRect(x-.5,y-.5,TS+1,TS+1);ctx.fillStyle='rgba(90,85,100,.35)';ctx.fillRect(x,y+TS-6,TS,2)}}
  // the girder across the top of the arena
  if(ARENA_R&&camX+VW>ARENA_L-200&&camX<ARENA_R+200){const y=MT_GIRDER_Y-20,x0=ARENA_L-3*TS,x1=ARENA_R+3*TS;
    ctx.fillStyle='#6b4a3a';ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.fillRect(x0,y,x1-x0,20);ctx.strokeRect(x0,y,x1-x0,20);
    ctx.fillStyle='#86604a';ctx.fillRect(x0,y+3,x1-x0,5);
    ctx.strokeStyle='rgba(43,26,18,.7)';ctx.lineWidth=2;for(let x=x0+20;x<x1;x+=40){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+20,y+20);ctx.moveTo(x+20,y);ctx.lineTo(x,y+20);ctx.stroke()}
    ctx.fillStyle='#d9c3a0';for(let x=x0+10;x<x1;x+=20){ctx.beginPath();ctx.arc(x,y+16,1.8,0,7);ctx.fill()}
    // chains hanging from it
    ctx.strokeStyle='#4a4a52';ctx.lineWidth=3;for(const fx of [.18,.55,.86]){const cx=ARENA_L+(ARENA_R-ARENA_L)*fx,len=60+hash(fx*10|0,3)*50,sw=Math.sin(time*1.2+fx*9)*6;
      ctx.beginPath();for(let k=0;k<len;k+=8){ctx.moveTo(cx+sw*k/len,y+20+k);ctx.lineTo(cx+sw*(k+5)/len,y+26+k)}ctx.stroke()}}
}
function drawCitySolid(c,r,t,p){
  const x=c*TS,y=r*TS,h=hash(c,r),f=flow[r][c];
  const top=!vsol(c,r-1)&&r>0,bot=r<ROWS-1&&!vsol(c,r+1);
  const edges=()=>{ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.beginPath();
    if(top){ctx.moveTo(x-.5,y);ctx.lineTo(x+TS+.5,y)}if(bot){ctx.moveTo(x,y+TS);ctx.lineTo(x+TS,y+TS)}
    if(!vsol(c-1,r)&&c>0){ctx.moveTo(x,y);ctx.lineTo(x,y+TS)}if(!vsol(c+1,r)&&c<COLS-1){ctx.moveTo(x+TS,y);ctx.lineTo(x+TS,y+TS)}ctx.stroke()};
  if(f===CITY_CAR)return;   // a wrecked car is drawn by its decoration
  if(f===CITY_JUNK){ // the barricade: crushed car bodies and tyres piled up
    const cols=['#8a3a2a','#3a5a7a','#6a6a72','#a08a3a'];ctx.fillStyle=cols[Math.floor(h*4)];ctx.fillRect(x-.5,y-.5,TS+1,TS+1);
    ctx.fillStyle='rgba(30,30,36,.55)';ctx.fillRect(x+4,y+6+h*10,TS-10,8);ctx.fillStyle='rgba(140,70,30,.5)';ctx.beginPath();ctx.arc(x+10+h*20,y+28,5,0,7);ctx.fill();
    ctx.fillStyle='#222';ctx.strokeStyle=INK;ctx.lineWidth=2;if(h>.6){ctx.beginPath();ctx.arc(x+20,y+20,11,0,7);ctx.fill();ctx.stroke();ctx.fillStyle='#777';ctx.beginPath();ctx.arc(x+20,y+20,4,0,7);ctx.fill()}
    edges();return}
  if(t===T_CRACKW){ // a brick wall with cracks: smash it
    ctx.fillStyle='#a8553e';ctx.fillRect(x-.5,y-.5,TS+1,TS+1);ctx.strokeStyle='rgba(60,25,15,.55)';ctx.lineWidth=1.6;ctx.beginPath();
    for(let k=0;k<4;k++){const yy=y+k*10;ctx.moveTo(x,yy);ctx.lineTo(x+TS,yy);const off=k%2?10:0;for(let bx=x+off;bx<x+TS;bx+=20){ctx.moveTo(bx,yy);ctx.lineTo(bx,yy+10)}}ctx.stroke();
    ctx.save();ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x+6+h*6,y+3);ctx.lineTo(x+15,y+15);ctx.lineTo(x+9,y+26);ctx.lineTo(x+19,y+37);ctx.moveTo(x+15,y+15);ctx.lineTo(x+29,y+12);ctx.lineTo(x+35-h*4,y+3);
    ctx.strokeStyle='rgba(255,230,200,.6)';ctx.lineWidth=3;ctx.stroke();ctx.strokeStyle='rgba(43,26,18,.85)';ctx.lineWidth=1.6;ctx.stroke();ctx.restore();
    ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.beginPath();if(tile(c,r-1)!==T_CRACKW){ctx.moveTo(x,y);ctx.lineTo(x+TS,y)}ctx.moveTo(x,y);ctx.lineTo(x,y+TS);ctx.moveTo(x+TS,y);ctx.lineTo(x+TS,y+TS);ctx.stroke();return}
  if(f===CITY_B){ // masonry: grey concrete panels, rows of windows, a concrete cap on the roof
    ctx.fillStyle=(c>>1)%2?'#7d7a80':'#86828a';ctx.fillRect(x-.5,y-.5,TS+1,TS+1);
    ctx.fillStyle='rgba(43,26,18,.12)';ctx.fillRect(x,y+TS-3,TS,3);
    if(!top&&r%2===0&&h>.15){const lit=hash(c,r*3)<.06,br=hash(c*3,r)<.25;   // windows
      ctx.fillStyle=lit?`rgba(200,120,255,${.5+.3*Math.sin(time*1.7+c)})`:br?'#1e1a26':'#3a3446';ctx.fillRect(x+9,y+8,22,20);
      ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.strokeRect(x+9,y+8,22,20);if(!br){ctx.beginPath();ctx.moveTo(x+20,y+8);ctx.lineTo(x+20,y+28);ctx.stroke()}
      else{ctx.strokeStyle='rgba(200,210,230,.6)';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(x+10,y+9);ctx.lineTo(x+16,y+16);ctx.lineTo(x+12,y+24);ctx.stroke()}}
    if(h<.08&&!top){ctx.fillStyle='rgba(43,26,18,.35)';ctx.beginPath();ctx.moveTo(x+4,y+4);ctx.lineTo(x+16,y+18);ctx.lineTo(x+10,y+30);ctx.lineTo(x+4,y+30);ctx.closePath();ctx.fill()}
    if(top){ctx.fillStyle='#b0abb2';ctx.fillRect(x-.5,y,TS+1,9);ctx.fillStyle='#d2ced4';ctx.fillRect(x-.5,y+1,TS+1,3)}
    if(t===T_CRACK){ctx.save();ctx.strokeStyle='rgba(43,26,18,.45)';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(x+8+h*6,y+2);ctx.lineTo(x+14+h*6,y+12);ctx.lineTo(x+11+h*6,y+22);ctx.moveTo(x+28-h*5,y+2);ctx.lineTo(x+24-h*5,y+14);ctx.stroke();ctx.restore()}
    edges();return}
  if(f===CITY_RUB){ // rubble: broken concrete with bent rebar
    ctx.fillStyle='#6e6a70';ctx.fillRect(x-.5,y-.5,TS+1,TS+1);
    ctx.fillStyle='#8f8a92';ctx.strokeStyle='rgba(43,26,18,.5)';ctx.lineWidth=1.6;
    for(let k=0;k<3;k++){const bx=x+4+hash(c,r+k)*24,by=y+4+hash(r,c+k)*24,s=6+hash(c+k,r)*7;ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(bx+s,by-2);ctx.lineTo(bx+s+2,by+s*.8);ctx.lineTo(bx-1,by+s);ctx.closePath();ctx.fill();ctx.stroke()}
    if(top){ctx.fillStyle='#a19ca4';ctx.beginPath();ctx.moveTo(x-.5,y);ctx.lineTo(x+TS+.5,y);ctx.lineTo(x+TS+.5,y+6);for(let k=3;k>=0;k--)ctx.lineTo(x+k*10,y+5+hash(c,k)*6);ctx.closePath();ctx.fill();
      if(h>.7){ctx.strokeStyle='#8a4a2a';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x+12,y+4);ctx.quadraticCurveTo(x+16,y-10,x+24,y-14);ctx.stroke()}}
    edges();return}
  // the street: cracked asphalt on a bed of gravel, then darker and darker earth with old pipes running through it
  let d=0;while(d<6&&r-d-1>=0&&vsol(c,r-d-1))d++;   // how deep under the surface
  const soil=['#6a5a52','#5a4c48','#4f423f','#463a38','#3e3331','#382e2c','#332a28'][d];
  ctx.fillStyle=soil;ctx.fillRect(x-.5,y-.5,TS+1,TS+1);
  if(d===1){ctx.fillStyle='#7d6c62';for(let k=0;k<5;k++){ctx.beginPath();ctx.arc(x+4+hash(c,k)*32,y+4+hash(k,c)*30,2+hash(c+k,r)*2,0,7);ctx.fill()}}
  else if(d>1){ctx.fillStyle='rgba(20,14,12,.25)';ctx.beginPath();ctx.arc(x+8+h*22,y+10+hash(r,c)*20,2.5+h*2.5,0,7);ctx.fill();
    if(hash(r,7)<.3&&d>=2){ctx.fillStyle='#55505a';ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.fillRect(x-.5,y+14,TS+1,12);ctx.beginPath();ctx.moveTo(x-.5,y+14);ctx.lineTo(x+TS+.5,y+14);ctx.moveTo(x-.5,y+26);ctx.lineTo(x+TS+.5,y+26);ctx.stroke();
      ctx.fillStyle='rgba(140,70,30,.45)';ctx.fillRect(x+hash(c,r)*30,y+16,6,8);if((c+r)%5===0){ctx.fillStyle='#6a6670';ctx.fillRect(x+16,y+12,8,16);ctx.strokeRect(x+16,y+12,8,16)}}
    else if(h>.93){ctx.fillStyle='#e8dcc0';ctx.beginPath();ctx.ellipse(x+20,y+22,7,3,h*5,0,7);ctx.fill()}}   // a bit of old bone
  if(top){ctx.fillStyle='#3e3e46';ctx.fillRect(x-.5,y,TS+1,12);ctx.fillStyle='#55555e';ctx.fillRect(x-.5,y+1,TS+1,3);
    if(c%4===0){ctx.fillStyle='rgba(230,200,90,.7)';ctx.fillRect(x+6,y+5,16,3)}   // the faded road marking
    if(h<.25){ctx.strokeStyle='rgba(15,15,20,.7)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x+4+h*40,y+2);ctx.lineTo(x+12+h*30,y+7);ctx.lineTo(x+20+h*20,y+5);ctx.stroke()}}
  edges();
}
// rusty rebar sticking up out of the rubble at the bottom of a crater
function drawCityThorn(c,r){
  const x=c*TS,y=r*TS;ctx.fillStyle='#6e6a70';ctx.beginPath();ctx.moveTo(x-.5,y+TS);for(let k=0;k<=4;k++)ctx.lineTo(x+k*10,y+TS-6-hash(c,k)*8);ctx.lineTo(x+TS+.5,y+TS);ctx.closePath();ctx.fill();
  ctx.lineCap='round';for(let k=0;k<3;k++){const bx=x+8+k*12,lean=(hash(c,k+5)-.5)*12,hh=20+hash(c+k,r)*10;
    ctx.strokeStyle=INK;ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(bx,y+TS-4);ctx.lineTo(bx+lean,y+TS-hh);ctx.stroke();
    ctx.strokeStyle='#a0583a';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='#c97a4a';ctx.beginPath();ctx.arc(bx+lean,y+TS-hh,2,0,7);ctx.fill()}
  ctx.strokeStyle=INK;ctx.lineWidth=3;
}
// the way out: a bunker door under a concrete hood, a green lamp over it
function drawCityDoor(d){
  const x=d.x,y=d.y;ctx.strokeStyle=INK;ctx.lineWidth=3.5;ctx.lineJoin='round';
  ctx.fillStyle='#7d7a80';ctx.beginPath();ctx.moveTo(x-46,y+d.h);ctx.lineTo(x-46,y-30);ctx.lineTo(x+d.w+46,y-30);ctx.lineTo(x+d.w+46,y+d.h);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='#a19ca4';ctx.beginPath();ctx.moveTo(x-60,y-30);ctx.lineTo(x-40,y-58);ctx.lineTo(x+d.w+40,y-58);ctx.lineTo(x+d.w+60,y-30);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle=bossDead?'#3a6a4a':'#4a4a52';ctx.beginPath();ctx.roundRect(x,y,d.w,d.h,[8,8,0,0]);ctx.fill();ctx.stroke();
  ctx.strokeStyle='rgba(43,26,18,.6)';ctx.lineWidth=2;for(let k=1;k<4;k++){ctx.beginPath();ctx.moveTo(x+6,y+k*d.h/4);ctx.lineTo(x+d.w-6,y+k*d.h/4);ctx.stroke()}
  ctx.fillStyle='#c9a050';ctx.beginPath();ctx.arc(x+d.w-14,y+d.h*.55,5,0,7);ctx.fill();ctx.strokeStyle=INK;ctx.stroke();
  const on=bossDead,a=on?.7+.3*Math.sin(time*4):.15;ctx.fillStyle=`rgba(120,255,140,${a*.4})`;ctx.beginPath();ctx.arc(x+d.w/2,y-44,22,0,7);ctx.fill();
  ctx.fillStyle=on?'#8aff9a':'#3a4a3a';ctx.beginPath();ctx.arc(x+d.w/2,y-44,8,0,7);ctx.fill();ctx.lineWidth=2.5;ctx.stroke();
}
/* ---------- decorations ---------- */
function drawCar(d){
  const x=d.x,y=d.y,f=d.f||1,s=d.s,body=['#8a3a2a','#3a5a7a','#6a6a72','#a08a3a','#4a6a3a'][Math.floor(s*5)];
  ctx.save();ctx.translate(x,y);ctx.scale(f,1);ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.lineJoin='round';
  shadow(0,0,46);
  ctx.fillStyle=body;ctx.beginPath();ctx.moveTo(-42,-10);ctx.lineTo(-40,-26);ctx.lineTo(-24,-30);ctx.lineTo(-14,-46);ctx.lineTo(16,-46);ctx.lineTo(28,-30);ctx.lineTo(42,-27);ctx.lineTo(42,-10);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='rgba(140,70,30,.55)';ctx.beginPath();ctx.arc(-26,-18,6,0,7);ctx.arc(20,-22,4,0,7);ctx.fill();
  ctx.fillStyle='#1e1a26';ctx.beginPath();ctx.moveTo(-11,-42);ctx.lineTo(0,-42);ctx.lineTo(0,-31);ctx.lineTo(-19,-31);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(4,-42);ctx.lineTo(14,-42);ctx.lineTo(22,-31);ctx.lineTo(4,-31);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.strokeStyle='rgba(200,210,230,.6)';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(6,-40);ctx.lineTo(11,-35);ctx.lineTo(8,-32);ctx.stroke();
  ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.fillStyle='#222';for(const wx of [-26,26]){ctx.beginPath();ctx.ellipse(wx,-7,10,s>.5?10:6,0,0,7);ctx.fill();ctx.stroke()}   // flat or missing tyres
  ctx.restore();
}
function drawLamp(x,y,s){
  const broken=s<.4,flick=broken?0:Math.sin(time*23+s*40)>.85?.2:1;ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.lineCap='round';
  ctx.save();ctx.translate(x,y);if(broken)ctx.rotate(.18);
  ctx.strokeStyle=INK;ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-150);ctx.quadraticCurveTo(0,-166,22,-164);ctx.stroke();
  ctx.strokeStyle='#4a4a52';ctx.lineWidth=4;ctx.stroke();
  ctx.fillStyle='#6a6a72';ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(14,-166);ctx.lineTo(34,-166);ctx.lineTo(30,-156);ctx.lineTo(18,-156);ctx.closePath();ctx.fill();ctx.stroke();
  if(!broken){ctx.fillStyle=`rgba(255,220,150,${.25*flick})`;ctx.beginPath();ctx.moveTo(18,-156);ctx.lineTo(30,-156);ctx.lineTo(54,-60);ctx.lineTo(-6,-60);ctx.closePath();ctx.fill();
    ctx.fillStyle=`rgba(255,236,180,${.9*flick+.1})`;ctx.beginPath();ctx.ellipse(24,-155,6,3,0,0,7);ctx.fill()}
  ctx.restore();
}
function drawCityDecor(k,d){
  const x=d.x,y=d.y,s=d.s;ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.lineJoin='round';ctx.lineCap='round';
  switch(k){
    case 'pole':{ctx.save();ctx.translate(x,y);ctx.rotate(-.12);ctx.fillStyle='#6a4a32';ctx.beginPath();ctx.roundRect(-6,-200,12,200,3);ctx.fill();ctx.stroke();
      ctx.fillStyle='#5a3e2a';ctx.fillRect(-26,-188,52,8);ctx.strokeRect(-26,-188,52,8);ctx.fillStyle='#9ac0d8';for(const px of [-20,20]){ctx.beginPath();ctx.arc(px,-192,4,0,7);ctx.fill();ctx.stroke()}ctx.restore();break}
    case 'stump':{ctx.fillStyle='#6a4a32';ctx.beginPath();ctx.moveTo(x-8,y);ctx.lineTo(x-7,y-40);ctx.lineTo(x-2,y-34);ctx.lineTo(x+3,y-44);ctx.lineTo(x+8,y);ctx.closePath();ctx.fill();ctx.stroke();break}
    case 'tank':{ctx.fillStyle='#7a5a42';for(const lx of [-22,22]){ctx.beginPath();ctx.moveTo(x+lx,y);ctx.lineTo(x+lx*.7,y-44);ctx.lineWidth=5;ctx.stroke()}ctx.lineWidth=3;
      ctx.beginPath();ctx.roundRect(x-30,y-100,60,58,6);ctx.fill();ctx.stroke();ctx.fillStyle='#6a4a32';ctx.beginPath();ctx.moveTo(x-34,y-100);ctx.lineTo(x,y-122);ctx.lineTo(x+34,y-100);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.strokeStyle='rgba(43,26,18,.5)';ctx.lineWidth=2;for(let k=1;k<4;k++){ctx.beginPath();ctx.moveTo(x-30,y-100+k*14);ctx.lineTo(x+30,y-100+k*14);ctx.stroke()}break}
    case 'antenna':{ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+s*10,y-70);ctx.moveTo(x-16,y-44);ctx.lineTo(x+18,y-50);ctx.moveTo(x-10,y-58);ctx.lineTo(x+14,y-62);ctx.stroke();break}
    case 'chimney':{ctx.fillStyle='#a8553e';ctx.beginPath();ctx.rect(x-12,y-40,24,40);ctx.fill();ctx.stroke();
      const ph=(time*.4+s)%1;ctx.fillStyle=`rgba(70,60,80,${.4*(1-ph)})`;ctx.beginPath();ctx.arc(x+ph*20,y-48-ph*60,8+ph*14,0,7);ctx.fill();break}
    case 'vent':{ctx.fillStyle='#8a8f99';ctx.beginPath();ctx.roundRect(x-18,y-24,36,24,4);ctx.fill();ctx.stroke();ctx.strokeStyle='rgba(43,26,18,.6)';ctx.lineWidth=2;for(let k=0;k<4;k++){ctx.beginPath();ctx.moveTo(x-12+k*8,y-20);ctx.lineTo(x-12+k*8,y-4);ctx.stroke()}break}
    case 'pillar':{ctx.fillStyle='#8f8a92';ctx.beginPath();ctx.moveTo(x-50,y+4);ctx.lineTo(x-56,y-14);ctx.lineTo(x+56,y-14);ctx.lineTo(x+50,y+4);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.strokeStyle='#8a4a2a';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x-50,y-14);ctx.lineTo(x-62,y-26);ctx.moveTo(x+44,y-14);ctx.lineTo(x+60,y-30);ctx.stroke();break}
    case 'liftTop':{ctx.fillStyle='#5b6170';ctx.beginPath();ctx.rect(x-60,y-14,120,14);ctx.fill();ctx.stroke();ctx.beginPath();ctx.arc(x,y+2,12,0,7);ctx.fill();ctx.stroke();break}
    case 'barrel':{ctx.fillStyle='#4a6a3a';ctx.beginPath();ctx.roundRect(x-14,y-36,28,36,4);ctx.fill();ctx.stroke();ctx.strokeStyle='rgba(43,26,18,.6)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-14,y-24);ctx.lineTo(x+14,y-24);ctx.moveTo(x-14,y-12);ctx.lineTo(x+14,y-12);ctx.stroke();
      // a fire in the barrel
      for(let k=0;k<3;k++){const fl=Math.sin(time*12+k*2+s*9)*4;ctx.fillStyle=k?'#ffb03a':'#ff6a2a';ctx.beginPath();ctx.moveTo(x-10+k*8,y-36);ctx.quadraticCurveTo(x-8+k*8,y-50-k*4+fl,x-4+k*6,y-58-k*3+fl);ctx.quadraticCurveTo(x+k*4,y-46,x-2+k*8,y-36);ctx.closePath();ctx.fill()}
      ctx.fillStyle='rgba(255,170,80,.18)';ctx.beginPath();ctx.arc(x,y-46,34,0,7);ctx.fill();break}
    case 'pipe':{ctx.fillStyle='#5b6170';ctx.beginPath();ctx.roundRect(x-26,y-58,52,58,6);ctx.fill();ctx.stroke();ctx.fillStyle='#1e1a26';ctx.beginPath();ctx.ellipse(x,y-30,16,18,0,0,7);ctx.fill();ctx.stroke();
      ctx.fillStyle=`rgba(170,90,230,${.25+.2*Math.sin(time*3+s*9)})`;ctx.beginPath();ctx.ellipse(x,y-30,10,12,0,0,7);ctx.fill();break}
    case 'rubble':{ctx.fillStyle='#8f8a92';ctx.strokeStyle=INK;ctx.lineWidth=2;for(let k=0;k<3;k++){const bx=x-14+k*12,sz=8+hash(k,s*99|0)*8;ctx.beginPath();ctx.moveTo(bx,y);ctx.lineTo(bx+2,y-sz);ctx.lineTo(bx+sz,y-sz+3);ctx.lineTo(bx+sz+2,y);ctx.closePath();ctx.fill();ctx.stroke()}break}
    case 'sign':{ctx.save();ctx.translate(x,y);ctx.rotate(-.5+s*.3);ctx.lineWidth=4;ctx.strokeStyle=INK;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-50);ctx.stroke();ctx.strokeStyle='#8a8f99';ctx.lineWidth=2;ctx.stroke();
      ctx.fillStyle=s>.5?'#e33b2e':'#3a8ee8';ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(0,-56,12,0,7);ctx.fill();ctx.stroke();ctx.fillStyle='#fff';ctx.fillRect(-7,-58,14,4);ctx.restore();break}
    case 'billboard':{ctx.fillStyle='#4a4a52';for(const lx of [-40,40]){ctx.fillRect(x+lx-3,y-4,6,4)}ctx.fillStyle='#e8d8b0';ctx.beginPath();ctx.rect(x-60,y-80,120,60);ctx.fill();ctx.stroke();
      ctx.fillStyle='#e33b2e';ctx.beginPath();ctx.arc(x-24,y-50,16,0,7);ctx.fill();ctx.fillStyle='#3a3446';ctx.font='bold 16px '+FONT;ctx.textAlign='center';ctx.fillText('SALE',x+22,y-44);
      ctx.fillStyle='rgba(43,26,18,.25)';ctx.beginPath();ctx.moveTo(x+20,y-80);ctx.lineTo(x+60,y-80);ctx.lineTo(x+60,y-34);ctx.closePath();ctx.fill();break}
    case 'scaffold':{ctx.strokeStyle='rgba(43,26,18,.55)';ctx.lineWidth=4;for(const lx of [-100,-20,60]){ctx.beginPath();ctx.moveTo(x+lx,y);ctx.lineTo(x+lx,y-380);ctx.stroke()}
      for(let k=1;k<9;k++){ctx.beginPath();ctx.moveTo(x-100,y-k*44);ctx.lineTo(x+60,y-k*44+(k%2?22:-22));ctx.stroke()}break}
    case 'manhole':{ctx.fillStyle='#3a3d45';ctx.beginPath();ctx.ellipse(x,y-2,22,5,0,0,7);ctx.fill();ctx.stroke();ctx.strokeStyle='rgba(120,120,130,.8)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x-12,y-3);ctx.lineTo(x+12,y-3);ctx.stroke();break}
    case 'car': drawCar(d);break;
    case 'lamp': drawLamp(x,y,s);break;
    case 'wire': drawWire(d.w);break;
  }
}
/* ---------- platform styles ---------- */
function drawSlab(pl,w){ // a slab of broken concrete with bent rebar
  ctx.fillStyle='#9a959e';ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-w/2,-8);ctx.lineTo(w/2,-8);ctx.lineTo(w/2-4,10);ctx.lineTo(w/2-12,6);ctx.lineTo(-w/2+10,12);ctx.lineTo(-w/2+2,6);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='#b8b3bc';ctx.fillRect(-w/2+3,-6,w-6,3);
  ctx.strokeStyle='#8a4a2a';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(-w/2+8,10);ctx.lineTo(-w/2+4,22);ctx.moveTo(w/2-14,8);ctx.lineTo(w/2-8,20);ctx.stroke();
  ctx.strokeStyle='rgba(43,26,18,.5)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-w*.1,-8);ctx.lineTo(-w*.05,0);ctx.lineTo(-w*.12,8);ctx.stroke();
}
function drawPallet(pl,w){ // a pallet of crates hanging from the crane on four cables
  ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-w/2+6,-8);ctx.lineTo(0,-110);ctx.lineTo(w/2-6,-8);ctx.moveTo(0,-110);ctx.lineTo(0,-900);ctx.stroke();
  ctx.fillStyle='#c9a06a';ctx.lineWidth=3;ctx.beginPath();ctx.rect(-w/2,-8,w,16);ctx.fill();ctx.stroke();
  ctx.strokeStyle='rgba(43,26,18,.6)';ctx.lineWidth=2;for(let k=1;k<4;k++){ctx.beginPath();ctx.moveTo(-w/2+k*w/4,-8);ctx.lineTo(-w/2+k*w/4,8);ctx.stroke()}
  ctx.fillStyle='#e0b23a';ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(0,-110,6,0,7);ctx.fill();ctx.stroke();
}
function drawCage(pl,w){ // a lift cage: a steel floor and a frame of bars
  ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-90);ctx.lineTo(0,-900);ctx.stroke();
  ctx.strokeStyle='rgba(43,26,18,.75)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-w/2+3,-8);ctx.lineTo(-w/2+3,-90);ctx.lineTo(w/2-3,-90);ctx.lineTo(w/2-3,-8);ctx.stroke();
  ctx.fillStyle='#5b6170';ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.beginPath();ctx.rect(-w/2,-8,w,16);ctx.fill();ctx.stroke();
  ctx.strokeStyle='rgba(200,210,230,.5)';ctx.lineWidth=1.5;for(let k=1;k<6;k++){ctx.beginPath();ctx.moveTo(-w/2+k*w/6,-6);ctx.lineTo(-w/2+k*w/6,6);ctx.stroke()}
}
