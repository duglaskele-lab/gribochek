/* ---------- enemy drawing ---------- */
function limb(x1,y1,x2,y2,w,col){ctx.lineCap='round';ctx.strokeStyle=INK;ctx.lineWidth=w+5;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.strokeStyle=col;ctx.lineWidth=w;ctx.stroke()}
function blob(cx,by,hw,hh){ctx.beginPath();ctx.moveTo(cx-hw,by);ctx.bezierCurveTo(cx-hw*1.05,by-hh*1.25,cx+hw*1.05,by-hh*1.25,cx+hw,by);ctx.closePath()}
function shadow(cx,by,rx){ctx.fillStyle='rgba(0,0,0,.15)';ctx.beginPath();ctx.ellipse(cx,by+1,rx,4,0,0,7);ctx.fill()}
function eyes(x,y,f,gap=7,r=3,angry=false){
  ctx.fillStyle=INK;[-gap,gap].forEach(o=>{ctx.beginPath();ctx.ellipse(x+o+f*2,y,r,r*1.4,0,0,7);ctx.fill()});
  ctx.fillStyle='#fff';[-gap,gap].forEach(o=>{ctx.beginPath();ctx.arc(x+o+f*2+1,y-2,r*.45,0,7);ctx.fill()});
  if(angry){ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x-gap-5,y-r*2-3);ctx.lineTo(x-gap+4,y-r*1.4-1);ctx.moveTo(x+gap+5,y-r*2-3);ctx.lineTo(x+gap-4,y-r*1.4-1);ctx.stroke()}
}
const col=(e,c)=>e.flash>0?'#fff':c;
function drawWorm(e,cx,gy,h){
    if(e.rise<=.05){
      if(Math.abs(P.x-e.x)<520){ctx.fillStyle='rgba(160,110,60,.55)';const w=24+Math.sin(time*10)*4;ctx.beginPath();ctx.ellipse(cx,gy,w,6,0,Math.PI,0);ctx.fill()}
      if(e.state==='rumble'){ctx.fillStyle='rgba(120,70,40,.6)';ctx.beginPath();ctx.ellipse(cx+rand(-2,2),gy,30,9,0,Math.PI,0);ctx.fill()}
      return;
    }
    ctx.strokeStyle=INK;ctx.lineWidth=1.6;   // halved: the whole worm is drawn at 2x
    for(let k=0;k<Math.ceil(h/18);k++){const y=gy-k*18-9,w=20-k*.6+Math.sin(e.anim+k)*1.5;ctx.fillStyle=col(e,k%2?'#d886ad':'#c9709a');ctx.beginPath();ctx.ellipse(cx,y,w,11,0,0,7);ctx.fill();ctx.stroke()}
    const ty=gy-h;ctx.fillStyle=col(e,'#8a2f4f');ctx.beginPath();ctx.ellipse(cx,ty+4,16,8,0,0,7);ctx.fill();ctx.stroke();
    ctx.fillStyle='#fff';for(let i=0;i<6;i++){const a=i/6*Math.PI*2;ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*14,ty+4+Math.sin(a)*6);ctx.lineTo(cx+Math.cos(a)*8,ty+4+Math.sin(a)*3);ctx.lineTo(cx+Math.cos(a+.3)*14,ty+4+Math.sin(a+.3)*6);ctx.fill()}
    ctx.fillStyle='rgba(200,160,100,.8)';ctx.beginPath();ctx.ellipse(cx,gy,30,7,0,Math.PI,0);ctx.fill();
  }
const EDRAW={
  slime(e){
    ctx.save();ctx.translate(e.x+e.w/2,e.y+e.h);ctx.scale(1.5,1.5);
    let sx=!e.onGround?.82:e.squash>0?1.28:1+Math.sin(time*6+e.x)*.05;
    const hw=19*sx, hh=26/sx;
    shadow(0,0,hw);blob(0,0,hw,hh);
    ctx.fillStyle=col(e,e.hue===2?'#b77ee0':e.hue?'#7cc4e0':'#8ed45e');ctx.fill();ctx.lineWidth=2.2;ctx.strokeStyle=INK;ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.7)';ctx.beginPath();ctx.ellipse(-hw*.45,-hh*.72,4,6,-.5,0,7);ctx.fill();
    eyes(e.dir*3,-hh*.5,e.dir,7,3);
    ctx.restore();
  },
  monkey(e){
    ctx.save();ctx.translate(e.x+e.w/2,e.y+e.h);ctx.scale(1.42,1.42);
    const f=e.face,fur=col(e,'#6b4226'),skin=col(e,'#e0b07e');
    const bob=Math.sin(time*5+e.x)*1.5, step=Math.sin(e.anim)*5;
    shadow(0,0,24);
    limb(-f*20,-46,-f*30,-8,11,fur);
    limb(-12,-18,-16+step,-3,12,fur);limb(12,-18,16-step,-3,12,fur);
    ctx.lineWidth=3;ctx.strokeStyle=INK;ctx.fillStyle=fur;ctx.beginPath();ctx.ellipse(0,-34+bob,27,28,0,0,7);ctx.fill();ctx.stroke();
    ctx.fillStyle=skin;ctx.beginPath();ctx.ellipse(f*4,-30+bob,15,17,0,0,7);ctx.fill();
    const hx=f*8,hy=-64+bob;
    ctx.fillStyle=fur;ctx.beginPath();ctx.arc(hx,hy,19,0,7);ctx.fill();ctx.stroke();
    ctx.fillStyle=skin;ctx.beginPath();ctx.arc(hx-f*16,hy-2,6,0,7);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.ellipse(hx+f*5,hy+3,13,11,0,0,7);ctx.fill();ctx.stroke();
    ctx.fillStyle=INK;ctx.beginPath();ctx.arc(hx+f*1,hy-3,2.4,0,7);ctx.arc(hx+f*11,hy-3,2.4,0,7);ctx.fill();
    ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(hx-f*4,hy-10);ctx.lineTo(hx+f*6,hy-6);ctx.moveTo(hx+f*16,hy-10);ctx.lineTo(hx+f*8,hy-6);ctx.stroke();
    ctx.beginPath();if(e.wind>0){ctx.ellipse(hx+f*7,hy+8,4,3,0,0,7);ctx.fill()}else{ctx.moveTo(hx+f*2,hy+9);ctx.lineTo(hx+f*12,hy+8);ctx.stroke()}
    if(e.wind>0){limb(f*18,-48,-f*4,-88,11,fur);banana(-f*4,-94,-f*.8)}
    else if(e.thrown>0) limb(f*18,-48,f*44,-50,11,fur);
    else {const beat=Math.abs(P.x-e.x)>620&&Math.sin(e.beat*8)>0;limb(f*18,-48,beat?f*6:f*28,beat?-40:-8,11,fur)}
    ctx.restore();
  },
  caterpillar(e){
    const n=e.segs.length;
    shadow((e.segs[0].x+e.segs[n-1].x)/2,e.gy,Math.abs(e.segs[0].x-e.segs[n-1].x)/2+20);
    for(let i=n-1;i>=0;i--){
      const s=e.segs[i], by=e.gy, bob=Math.sin(e.anim-i*.9)*2;
      if(i>0){
        ctx.strokeStyle=INK;ctx.lineWidth=2.5;const lp=Math.sin(e.anim-i)*3;
        ctx.beginPath();ctx.moveTo(s.x-6,by-6);ctx.lineTo(s.x-8+lp,by);ctx.moveTo(s.x+6,by-6);ctx.lineTo(s.x+8-lp,by);ctx.stroke();
        ctx.fillStyle=col(e,i%2?'#9ad35a':'#86c24a');ctx.lineWidth=3;ctx.beginPath();ctx.arc(s.x,by-17+bob,17,0,7);ctx.fill();ctx.stroke();
        ctx.fillStyle=col(e,'#f2c94c');ctx.beginPath();ctx.arc(s.x,by-26+bob,4,0,7);ctx.fill();
      }else{
        const f=e.dir;
        ctx.fillStyle=col(e,'#7ab63f');ctx.lineWidth=3;ctx.beginPath();ctx.arc(s.x,by-19,20,0,7);ctx.fill();ctx.stroke();
        ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(s.x-4,by-36);ctx.quadraticCurveTo(s.x-6+f*4,by-50,s.x+f*2-8,by-54);ctx.moveTo(s.x+6,by-36);ctx.quadraticCurveTo(s.x+10+f*4,by-50,s.x+f*6+10,by-54);ctx.stroke();
        ctx.fillStyle=INK;ctx.beginPath();ctx.arc(s.x+f*2-8,by-54,3,0,7);ctx.arc(s.x+f*6+10,by-54,3,0,7);ctx.fill();
        eyes(s.x+f*6,by-22,f,6,2.8);
        ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.beginPath();ctx.arc(s.x+f*8,by-12,5,.2,Math.PI-.2);ctx.stroke();
      }
    }
  },
  orc(e){
    const f=e.face,cx=e.x+e.w/2,by=e.y+e.h,skin=col(e,'#7f9a55'),step=Math.sin(e.anim)*5;
    shadow(cx,by,26);
    limb(cx-8,by-22,cx-10+step,by-3,11,col(e,'#5a4632'));limb(cx+8,by-22,cx+10-step,by-3,11,col(e,'#5a4632'));
    // club arm (back)
    const k=e.state==='swing'?1-e.t/.22:0, sw=e.state==='wind'?-2.4:e.state==='swing'?-2.4+k*3.1:-.35;
    ctx.save();ctx.translate(cx-f*2,by-44);ctx.scale(f,1);
    if(e.state==='swing'){ctx.strokeStyle=`rgba(255,255,255,${.75*(1-k*.5)})`;ctx.lineWidth=12;ctx.lineCap='round';ctx.beginPath();ctx.arc(0,0,72,-2.4,sw);ctx.stroke()}
    ctx.rotate(sw);
    limb(0,0,18,0,10,skin);
    ctx.strokeStyle=INK;ctx.lineWidth=2.5;
    ctx.fillStyle=col(e,'#6b4a2a');ctx.fillRect(12,-3,10,6);ctx.strokeRect(12,-3,10,6);
    ctx.fillStyle=col(e,'#e0b43a');ctx.beginPath();ctx.roundRect(21,-10,6,20,2);ctx.fill();ctx.stroke();
    ctx.fillStyle=col(e,'#dfe4e8');ctx.beginPath();ctx.moveTo(27,-5);ctx.lineTo(80,-4);ctx.lineTo(92,0);ctx.lineTo(80,4);ctx.lineTo(27,5);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.strokeStyle='rgba(43,26,18,.35)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(29,0);ctx.lineTo(80,0);ctx.stroke();
    ctx.restore();
    ctx.fillStyle=col(e,'#6b5a45');ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(cx-17,by-50,34,32,8);ctx.fill();ctx.stroke();
    ctx.fillStyle=skin;ctx.beginPath();ctx.arc(cx+f*3,by-58,14,0,7);ctx.fill();ctx.stroke();
    ctx.fillStyle=col(e,'#9aa0a6');ctx.beginPath();ctx.arc(cx+f*3,by-62,15,Math.PI,0);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(cx+f*6,by-50);ctx.lineTo(cx+f*8,by-57);ctx.lineTo(cx+f*10,by-50);ctx.fill();
    ctx.fillStyle=e.state==='wind'?'#ff4a2a':INK;ctx.beginPath();ctx.arc(cx+f*9,by-58,2.4,0,7);ctx.fill();
    // shield in front
    const sx=cx+f*20;
    ctx.fillStyle=col(e,'#a7773f');ctx.beginPath();ctx.ellipse(sx,by-38,9,28,0,0,7);ctx.fill();ctx.stroke();
    ctx.strokeStyle=col(e,'#c7cdd3');ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(sx,by-38,6,24,0,0,7);ctx.stroke();
    ctx.fillStyle=col(e,'#c7cdd3');ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.beginPath();ctx.arc(sx+f*2,by-38,5,0,7);ctx.fill();ctx.stroke();
    if(e.turnT>0){ctx.fillStyle=INK;ctx.font='20px '+FONT;ctx.textAlign='center';ctx.fillText('?',cx,by-80)}
  },
  scorpion(e){
    const f=e.face,cx=e.x+e.w/2,by=e.y+e.h,body=col(e,'#c9772e'),dark=col(e,'#9a5520'),step=Math.sin(e.anim)*3;
    shadow(cx,by,30);
    ctx.strokeStyle=INK;ctx.lineWidth=2.5;
    for(let i=0;i<3;i++){const lx=cx-12+i*12;ctx.beginPath();ctx.moveTo(lx,by-12);ctx.lineTo(lx-6+(i%2?step:-step),by);ctx.stroke()}
    ctx.fillStyle=body;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(cx,by-14,24,11,0,0,7);ctx.fill();ctx.stroke();
    // pincers
    const px=cx+f*26;ctx.fillStyle=dark;ctx.beginPath();ctx.ellipse(px,by-12,8,6,0,0,7);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(px+f*6,by-16);ctx.lineTo(px+f*14,by-18);ctx.moveTo(px+f*6,by-8);ctx.lineTo(px+f*14,by-6);ctx.stroke();
    // tail
    const raise=e.state==='wind'?1:e.state==='strike'?-.2:.5;
    const tx=cx-f*20,ty=by-18;
    ctx.lineWidth=9;ctx.strokeStyle=INK;ctx.beginPath();ctx.moveTo(tx,ty);ctx.quadraticCurveTo(tx-f*18,ty-30,tx+f*(4+raise*6),ty-40-raise*8);ctx.stroke();
    ctx.lineWidth=5;ctx.strokeStyle=body;ctx.stroke();
    const sx=e.state==='strike'?cx+f*40:tx+f*(4+raise*6), sy=e.state==='strike'?by-14:ty-40-raise*8;
    ctx.fillStyle=e.state==='wind'?'#ff5a2a':dark;ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(sx,sy,6,0,7);ctx.fill();ctx.stroke();
    ctx.fillStyle=INK;ctx.beginPath();ctx.arc(cx+f*12,by-18,2.2,0,7);ctx.arc(cx+f*18,by-18,2.2,0,7);ctx.fill();
  },
  parrot(e){
    const f=e.face,cx=e.x+e.w/2,cy=e.y+e.h/2,fl=Math.sin(e.anim)*15;
    ctx.save();ctx.translate(cx,cy);ctx.rotate((e.tilt||0)*f);ctx.scale(f,1);
    ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.lineJoin='round';
    // long tail feathers
    [['#d8332f',-2],['#2f6fd8',4]].forEach(([c,o])=>{ctx.fillStyle=col(e,c);ctx.beginPath();ctx.moveTo(-14,o);ctx.quadraticCurveTo(-34,o+6+Math.sin(time*6)*3,-44,o+14);ctx.lineTo(-38,o+18);ctx.quadraticCurveTo(-26,o+10,-12,o+6);ctx.closePath();ctx.fill();ctx.stroke()});
    // back wing
    ctx.fillStyle=col(e,'#2f6fd8');ctx.beginPath();ctx.moveTo(-4,-6);ctx.quadraticCurveTo(-18,-20-fl,-30,-14-fl*1.3);ctx.quadraticCurveTo(-18,-4,-6,2);ctx.closePath();ctx.fill();ctx.stroke();
    // body
    ctx.fillStyle=col(e,'#3fbf5a');ctx.beginPath();ctx.ellipse(0,0,18,13,-.15,0,7);ctx.fill();ctx.stroke();
    ctx.fillStyle=col(e,'#ffd84a');ctx.beginPath();ctx.ellipse(4,5,10,6,-.2,0,Math.PI);ctx.fill();
    // head with a silly crest
    ctx.fillStyle=col(e,'#ff5a3a');[[-2,-30,-8],[4,-32,-1],[10,-29,5]].forEach(([x,y,b])=>{ctx.beginPath();ctx.moveTo(b+6,-18);ctx.quadraticCurveTo(x-4,y+4,x,y);ctx.quadraticCurveTo(x+4,y+6,b+12,-17);ctx.closePath();ctx.fill();ctx.stroke()});
    ctx.fillStyle=col(e,'#3fbf5a');ctx.beginPath();ctx.arc(12,-12,11,0,7);ctx.fill();ctx.stroke();
    // big hooked beak, open when squawking or swooping
    const open=e.state==='squawk'||e.state==='swoop'?.5+.3*Math.sin(time*30):0;
    ctx.fillStyle=col(e,'#3b3b3b');ctx.beginPath();ctx.moveTo(20,-8);ctx.quadraticCurveTo(28,-4+open*6,22,2+open*6);ctx.quadraticCurveTo(19,-2,19,-6);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle=col(e,'#ffb13b');ctx.beginPath();ctx.moveTo(18,-17);ctx.quadraticCurveTo(34,-18,32,-4);ctx.quadraticCurveTo(28,-8,20,-7);ctx.closePath();ctx.fill();ctx.stroke();
    // googly eye that wobbles
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(12,-15,6.5,0,7);ctx.fill();ctx.stroke();
    const wob=Math.sin(time*9+e.x)*1.8;ctx.fillStyle=INK;ctx.beginPath();ctx.arc(13+wob*.6,-14+Math.abs(wob)*.5,2.8,0,7);ctx.fill();
    // front wing
    ctx.fillStyle=col(e,'#d8332f');ctx.beginPath();ctx.moveTo(-2,-4);ctx.quadraticCurveTo(-10,-22-fl,-24,-20-fl*1.4);ctx.quadraticCurveTo(-14,-2,-2,4);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle=col(e,'#ffd84a');ctx.beginPath();ctx.moveTo(-14,-16-fl);ctx.lineTo(-24,-20-fl*1.4);ctx.lineTo(-17,-10-fl*.6);ctx.closePath();ctx.fill();
    ctx.restore();
    if(e.state==='squawk'){ctx.font='20px '+FONT;ctx.textAlign='center';ctx.fillStyle='#fff';ctx.strokeStyle=INK;ctx.lineWidth=4;ctx.strokeText('!',cx,cy-34);ctx.fillText('!',cx,cy-34)}
  },
  goblin(e){
    const f=e.face,cx=e.x+e.w/2,by=e.y+e.h,skin=col(e,'#8fbf4a'),leather=col(e,'#7a5230'),step=(e.walkT>0||Math.abs(e.vx)>10)?Math.sin(e.anim)*4:0;
    shadow(cx,by,16);
    ctx.strokeStyle=INK;ctx.lineWidth=2.5;
    // quiver on the back
    ctx.fillStyle=col(e,'#5a3a22');ctx.save();ctx.translate(cx-f*10,by-30);ctx.rotate(-f*.3);ctx.beginPath();ctx.roundRect(-4,-14,8,20,3);ctx.fill();ctx.stroke();
    ctx.strokeStyle=col(e,'#d8332f');ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-2,-14);ctx.lineTo(-3,-19);ctx.moveTo(2,-14);ctx.lineTo(3,-19);ctx.stroke();ctx.restore();
    limb(cx-5,by-14,cx-6+step,by-2,7,leather);limb(cx+5,by-14,cx+6-step,by-2,7,leather);
    ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.fillStyle=leather;ctx.beginPath();ctx.roundRect(cx-11,by-30,22,18,6);ctx.fill();ctx.stroke();
    // head, long ears
    const hx=cx+f*2,hy=by-38;
    ctx.fillStyle=skin;[-1,1].forEach(s=>{ctx.beginPath();ctx.moveTo(hx+s*8,hy-4);ctx.lineTo(hx+s*22,hy-10);ctx.lineTo(hx+s*9,hy+3);ctx.closePath();ctx.fill();ctx.stroke()});
    ctx.beginPath();ctx.arc(hx,hy,11,0,7);ctx.fill();ctx.stroke();
    ctx.fillStyle=leather;ctx.beginPath();ctx.arc(hx,hy-3,11.5,Math.PI*1.05,Math.PI*1.95);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#ffe45c';ctx.beginPath();ctx.arc(hx+f*4,hy,3,0,7);ctx.fill();ctx.fillStyle=INK;ctx.beginPath();ctx.arc(hx+f*5,hy,1.4,0,7);ctx.fill();
    ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(hx+f*1,hy+6);ctx.lineTo(hx+f*8,hy+5);ctx.stroke();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(hx+f*3,hy+6);ctx.lineTo(hx+f*4,hy+9);ctx.lineTo(hx+f*5,hy+6);ctx.fill();
    // bow, aimed up for a lob; string pulled back while drawing
    const bx=cx+f*15, byy=by-26, pull=e.state==='draw'?Math.min(1,(.55-e.t)/.35):0;
    ctx.save();ctx.translate(bx,byy);ctx.scale(f,1);ctx.rotate(-.5);
    ctx.strokeStyle=col(e,'#8a5a36');ctx.lineWidth=4;ctx.beginPath();ctx.arc(-6,0,16,-1.2,1.2);ctx.stroke();
    const sxp=-6+16*Math.cos(1.2), syp=16*Math.sin(1.2), mid=sxp-pull*12;
    ctx.strokeStyle='#eee';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(sxp,-syp);ctx.lineTo(mid,0);ctx.lineTo(sxp,syp);ctx.stroke();
    if(e.state==='draw'){ctx.strokeStyle='#8a5a36';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(mid,0);ctx.lineTo(mid+26,0);ctx.stroke();
      ctx.fillStyle='#bfc5ca';ctx.beginPath();ctx.moveTo(mid+26,-3);ctx.lineTo(mid+32,0);ctx.lineTo(mid+26,3);ctx.fill()}
    ctx.restore();
    limb(cx+f*4,by-26,bx-f*(2+pull*8),byy+2,6,skin);
  },
  sandworm(e){
    // drawn at double scale around the burrow point
    const cx=e.x+e.w/2,gy=e.gy,S=2;ctx.save();ctx.translate(cx,gy);ctx.scale(S,S);ctx.translate(-cx,-gy);
    try{drawWorm(e,cx,gy,e.h/S)}finally{ctx.restore()}
  },
  cactus(e){
    const cx=e.x+e.w/2,by=e.y+e.h,p=e.puff>0?1+.12*Math.sin(e.puff*40):1,green=col(e,'#5f9d45');
    shadow(cx,by,20);
    ctx.save();ctx.translate(cx,by);ctx.scale(p,p);
    ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.fillStyle=green;
    ctx.beginPath();ctx.roundRect(-13,-62,26,62,13);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.roundRect(-28,-42,12,22,6);ctx.fill();ctx.stroke();ctx.beginPath();ctx.roundRect(16,-50,12,22,6);ctx.fill();ctx.stroke();
    ctx.strokeStyle=col(e,'#3f7a2e');ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-56);ctx.lineTo(0,-6);ctx.stroke();
    ctx.strokeStyle=INK;ctx.lineWidth=1.5;for(let i=0;i<8;i++){const y=-56+i*7,s=i%2?-1:1;ctx.beginPath();ctx.moveTo(s*13,y);ctx.lineTo(s*18,y-2);ctx.stroke()}
    if(e.puff>0){ctx.fillStyle='#ff6fa0';ctx.beginPath();ctx.arc(0,-64,6,0,7);ctx.fill();ctx.stroke()}
    eyes(e.face*3,-40,e.face,6,2.6,true);
    ctx.restore();
  },
  mummy(e){
    const cx=e.x+e.w/2,by=e.y+e.h,f=e.face,band=col(e,'#e8dcc0'),step=e.state==='leap'?6:Math.sin(e.anim)*5;
    shadow(cx,by,20);
    const sq=e.state==='crouch'?.8:e.squash>0?.88:1;
    if(sq!==1&&!e.pile){ctx.save();ctx.translate(cx,by);ctx.scale(2-sq,sq);ctx.translate(-cx,-by)}
    if(e.pile){ctx.fillStyle=band;ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(cx,by,24,12,0,Math.PI,0);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.fillStyle='#7fdc6a';const a=e.pileT<1?(Math.sin(time*20)>0?1:.3):.6;ctx.globalAlpha=a;ctx.beginPath();ctx.arc(cx-5,by-5,2.5,0,7);ctx.arc(cx+5,by-5,2.5,0,7);ctx.fill();ctx.globalAlpha=1;return}
    limb(cx-7,by-20,cx-8+step,by-3,10,band);limb(cx+7,by-20,cx+8-step,by-3,10,band);
    ctx.fillStyle=band;ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(cx-15,by-50,30,32,8);ctx.fill();ctx.stroke();
    if(e.state==='leap') limb(cx+f*6,by-42,cx+f*20,by-66,8,band); else limb(cx+f*6,by-42,cx+f*28,by-40,8,band);
    ctx.beginPath();ctx.arc(cx+f*2,by-54,13,0,7);ctx.fill();ctx.stroke();
    ctx.strokeStyle='rgba(43,26,18,.45)';ctx.lineWidth=1.5;for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(cx-14,by-46+i*6);ctx.lineTo(cx+14,by-43+i*6);ctx.stroke()}
    ctx.beginPath();ctx.moveTo(cx-10,by-58);ctx.lineTo(cx+13,by-55);ctx.moveTo(cx-11,by-50);ctx.lineTo(cx+12,by-48);ctx.stroke();
    ctx.fillStyle=e.revived?'#ff5a4a':'#7fdc6a';ctx.beginPath();ctx.arc(cx+f*6-4,by-54,2.6,0,7);ctx.arc(cx+f*6+5,by-54,2.6,0,7);ctx.fill();
    if(sq!==1) ctx.restore();
  },
  scarab(e){
    const cx=e.x+e.w/2,by=e.y+e.h,f=e.face,shell=col(e,'#2f6f78'),hi=col(e,'#58b3a8');
    shadow(cx,by,22);ctx.strokeStyle=INK;ctx.lineWidth=3;
    if(e.state==='flipped'){
      ctx.fillStyle=shell;ctx.beginPath();ctx.ellipse(cx,by-10,21,11,0,0,Math.PI);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.lineWidth=2.5;for(let i=0;i<3;i++){const lx=cx-10+i*10,w=Math.sin(time*18+i)*4;ctx.beginPath();ctx.moveTo(lx,by-12);ctx.lineTo(lx+w,by-26);ctx.stroke()}
      return;
    }
    if(e.state==='roll'){
      ctx.save();ctx.translate(cx,by-15);ctx.rotate(e.anim*f);ctx.fillStyle=shell;ctx.beginPath();ctx.arc(0,0,15,0,7);ctx.fill();ctx.stroke();
      ctx.strokeStyle=hi;ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,9,0,2);ctx.stroke();ctx.restore();return;
    }
    const sh=e.state==='wind'?rand(-1.5,1.5):0, step=Math.sin(e.anim)*3;
    ctx.lineWidth=2.5;for(let i=0;i<3;i++){const lx=cx-12+i*12;ctx.beginPath();ctx.moveTo(lx,by-8);ctx.lineTo(lx+(i%2?step:-step)-3,by);ctx.stroke()}
    ctx.lineWidth=3;ctx.fillStyle=shell;ctx.beginPath();ctx.ellipse(cx+sh,by-12,22,13,0,Math.PI,0);ctx.lineTo(cx+22+sh,by-7);ctx.lineTo(cx-22+sh,by-7);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.strokeStyle=hi;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx+sh,by-24);ctx.lineTo(cx+sh,by-8);ctx.stroke();ctx.beginPath();ctx.arc(cx-8+sh,by-16,5,Math.PI,1.5*Math.PI);ctx.stroke();
    ctx.fillStyle=col(e,'#1f4a50');ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(cx+f*22+sh,by-11,7,0,7);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(cx+f*26,by-16);ctx.quadraticCurveTo(cx+f*34,by-22,cx+f*32,by-30);ctx.stroke();
    ctx.fillStyle=e.state==='wind'?'#ff5a2a':'#fff';ctx.beginPath();ctx.arc(cx+f*24+sh,by-13,2,0,7);ctx.fill();
  },
  piranha(e){
    const cx=e.x+e.w/2, cy=e.y+e.h/2, f=e.face||1, flop=e.state==='flop', air=e.state==='leap';
    const rot=air?clamp(Math.atan2(e.vy,Math.abs(e.vx)+60),-1.1,1.1):flop?Math.sin(time*20)*.45:0;
    if(air||flop) shadow(cx,e.y+e.h,12);
    ctx.save();ctx.translate(cx,cy);ctx.scale(f*1.25,flop?-1.25:1.25);ctx.rotate(rot);
    ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.lineJoin='round';
    const w=Math.sin(e.anim*(flop?3:1.2))*4;
    ctx.fillStyle=col(e,'#4f6280');ctx.beginPath();ctx.moveTo(-12,0);ctx.lineTo(-24,-9+w);ctx.lineTo(-21,0);ctx.lineTo(-24,9+w);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(-6,-8);ctx.lineTo(0,-15);ctx.lineTo(5,-9);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle=col(e,'#5d6f8a');ctx.beginPath();ctx.ellipse(0,0,15,10,0,0,7);ctx.fill();ctx.stroke();
    ctx.fillStyle=col(e,'#d8503a');ctx.beginPath();ctx.ellipse(2,4,11,5,0,0,Math.PI);ctx.fill();
    ctx.fillStyle=col(e,'#4f6280');ctx.beginPath();ctx.moveTo(4,3);ctx.lineTo(17,1);ctx.quadraticCurveTo(19,7,13,9);ctx.lineTo(4,8);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#fff';for(let k=0;k<4;k++){const tx=6+k*3;ctx.beginPath();ctx.moveTo(tx,3);ctx.lineTo(tx+1.5,-1);ctx.lineTo(tx+3,3);ctx.fill()}
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(7,-3,3.6,0,7);ctx.fill();ctx.lineWidth=1.5;ctx.stroke();
    ctx.fillStyle=flop?INK:'#e8302a';ctx.beginPath();ctx.arc(8,-3,1.6,0,7);ctx.fill();
    ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(3,-8);ctx.lineTo(11,-6);ctx.stroke();
    ctx.restore();
    if(flop&&Math.random()<.1) parts.push({x:cx,y:e.y,vx:rand(-30,30),vy:-60,g:300,c:'rgba(190,230,255,.9)',s:3,life:.3,max:0,t:'dot'});
  },
  lizSword(e){
    const f=e.face,cx=e.x+e.w/2,by=e.y+e.h,skin=col(e,'#5f9a4a'),dark=col(e,'#3f6f34'),belly=col(e,'#d9d48f');
    shadow(cx,by,18);
    ctx.save();ctx.translate(cx,by);ctx.scale(f,1);ctx.lineJoin='round';
    const cr=e.state==='wind'?6:e.state==='jwind'?8:0;
    lizLower(e,skin,dark,cr);
    const bob=lizTorso(e,skin,belly,cr);
    limb(-4,-40+cr+bob,-10,-26+cr,6,dark);
    const hy=-53+cr+bob;
    ctx.fillStyle=col(e,'#d8452f');ctx.strokeStyle=INK;ctx.lineWidth=2;
    for(const [x,y] of [[-9,hy-2],[-6,hy-8],[-1,hy-11]]){ctx.beginPath();ctx.moveTo(x-3,y+4);ctx.lineTo(x-8,y-6);ctx.lineTo(x+4,y+2);ctx.closePath();ctx.fill();ctx.stroke()}
    lizHead(e,hy,skin,e.state==='wind'||e.state==='charge');
    const a=e.state==='wind'?-2.3:e.state==='charge'?-.05:(e.state==='jump'||e.state==='jwind')?-1.3:.75;
    const sx=5,sy=-41+cr+bob,hx=sx+Math.cos(a)*15,hyy=sy+Math.sin(a)*15;
    limb(sx,sy,hx,hyy,6,skin);
    ctx.save();ctx.translate(hx,hyy);ctx.rotate(a);ctx.strokeStyle=INK;ctx.lineWidth=2.2;
    ctx.fillStyle=col(e,'#6b4a2a');ctx.fillRect(-4,-2.5,7,5);ctx.strokeRect(-4,-2.5,7,5);
    ctx.fillStyle=col(e,'#e0b43a');ctx.beginPath();ctx.roundRect(3,-7,4,14,2);ctx.fill();ctx.stroke();
    ctx.fillStyle=col(e,'#e3e8ec');ctx.beginPath();ctx.moveTo(7,-3);ctx.quadraticCurveTo(26,-9,42,-3);ctx.lineTo(44,1);ctx.quadraticCurveTo(26,1,7,3);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.restore();
    if(e.state==='charge'){ctx.strokeStyle='rgba(255,255,255,.8)';ctx.lineWidth=3;ctx.lineCap='round';for(let k=0;k<3;k++){const y=-44+k*14;ctx.beginPath();ctx.moveTo(-30-k*6,y);ctx.lineTo(-58-k*8,y);ctx.stroke()}}
    ctx.restore();
  },
  lizMage(e){
    const f=e.face,cx=e.x+e.w/2,by=e.y+e.h,skin=col(e,'#4f9a7a'),dark=col(e,'#35705a'),robe=col(e,'#6a4a9a'),trim=col(e,'#e0b43a');
    const casting=e.state==='cast',k=casting?clamp(1-e.t/.65,0,1):0;
    shadow(cx,by,17);
    ctx.save();ctx.translate(cx,by);ctx.scale(f,1);ctx.lineJoin='round';
    lizLower(e,skin,dark,0);
    ctx.fillStyle=robe;ctx.strokeStyle=INK;ctx.lineWidth=2.6;
    ctx.beginPath();ctx.moveTo(-11,-47);ctx.lineTo(11,-47);ctx.lineTo(15,-9);ctx.quadraticCurveTo(0,-5,-14,-9);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle=trim;ctx.fillRect(-12,-15,26,3);ctx.strokeStyle=trim;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(1,-46);ctx.lineTo(2,-15);ctx.stroke();
    limb(-4,-42,-9,-27,6,robe);
    const hy=-54;
    for(const [c,x,y,r] of [['#3aa0d8',-11,-9,-.7],['#e0503a',-7,-13,-.45],['#f2c94c',-2,-14,-.2]]){ctx.fillStyle=col(e,c);ctx.strokeStyle=INK;ctx.lineWidth=1.8;ctx.beginPath();ctx.ellipse(x,hy+y,3,9,r,0,7);ctx.fill();ctx.stroke()}
    lizHead(e,hy,skin,casting);
    const a=casting?-.5-k*.3:-1.45,ddx=Math.cos(a),ddy=Math.sin(a),hx=11,hyy=-36;
    ctx.lineCap='round';ctx.strokeStyle=INK;ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(hx-ddx*28,hyy-ddy*28);ctx.lineTo(hx+ddx*36,hyy+ddy*36);ctx.stroke();
    ctx.strokeStyle=col(e,'#8a5a36');ctx.lineWidth=3;ctx.stroke();
    const ox=hx+ddx*42,oy=hyy+ddy*42,pu=casting?1+k*.8:1+Math.sin(time*4)*.1;
    ctx.fillStyle=`rgba(170,140,255,${casting?.25+.35*k:.2})`;ctx.beginPath();ctx.arc(ox,oy,11*pu+4,0,7);ctx.fill();
    ctx.fillStyle=col(e,'#b89aff');ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.beginPath();ctx.arc(ox,oy,6*pu,0,7);ctx.fill();ctx.stroke();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(ox-2,oy-2,2*pu,0,7);ctx.fill();
    limb(4,-42,hx,hyy,6,robe);
    ctx.restore();
    if(casting&&Math.random()<.4) parts.push({x:cx+f*ox+rand(-8,8),y:by+oy+rand(-8,8),vx:rand(-30,30),vy:rand(-60,-10),g:0,c:'#d8c8ff',s:rand(2,4),life:.35,max:0,t:'dot'});
  },
  lizChief(e){
    const f=e.face,cx=e.x+e.w/2,by=e.y+e.h,S=1.5,skin=col(e,'#4d7f3e'),dark=col(e,'#335a2a'),belly=col(e,'#cfc88a'),metal=col(e,'#9aa4ab'),metalD=col(e,'#6f7880');
    shadow(cx,by,30);
    ctx.save();ctx.translate(cx,by);if(e.state==='wind')ctx.translate(rand(-1,1),0);ctx.scale(f*S,S);ctx.lineJoin='round';
    const cr=e.state==='wind'?3:e.state==='recover'?4:e.state==='jwind'?7:0;
    lizLower(e,skin,dark,cr);
    const bob=lizTorso(e,skin,belly,cr);
    ctx.fillStyle=metal;ctx.strokeStyle=INK;ctx.lineWidth=2.4;
    ctx.beginPath();ctx.moveTo(-11,-45+cr+bob);ctx.quadraticCurveTo(3,-50+cr+bob,12,-44+cr+bob);ctx.lineTo(11,-24+cr+bob);ctx.quadraticCurveTo(0,-19+cr+bob,-11,-24+cr+bob);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle=col(e,'#5a3a22');ctx.fillRect(-12,-24+cr+bob,25,4);ctx.strokeRect(-12,-24+cr+bob,25,4);
    ctx.fillStyle=metalD;for(let k=0;k<3;k++){ctx.beginPath();ctx.roundRect(-10+k*7.5,-20+cr,7,8,2);ctx.fill();ctx.stroke()}
    ctx.fillStyle=INK;for(const [rx,ry] of [[-6,-40],[6,-40],[-6,-30],[6,-30]]){ctx.beginPath();ctx.arc(rx,ry+cr+bob,1.2,0,7);ctx.fill()}
    let a=-1.95;
    if(e.state==='wind') a=-2-.6*clamp((.8-e.t)/.5,0,1);
    else if(e.state==='swing') a=-2.6+clamp(1-e.t/.28,0,1)*3.5;
    else if(e.state==='recover') a=.9; else if(e.state==='stun') a=.6;
    else if(e.state==='throwWind') a=-2.1-.8*clamp((.7-e.t)/.5,0,1); else if(e.state==='jwind'||e.state==='jump') a=-2.5;
    const sx=2,sy=-42+cr+bob;
    if(e.axeOut){limb(-3,sy+2,10,sy+8,6,dark);limb(6,sy+1,20,sy+4,6,skin)}   // empty hands while the axe is flying
    else{
    ctx.save();ctx.translate(sx,sy);
    if(e.state==='swing'){ctx.strokeStyle='rgba(255,255,255,.75)';ctx.lineWidth=14;ctx.lineCap='round';ctx.beginPath();ctx.arc(0,0,62,-2.6,a);ctx.stroke()}
    ctx.rotate(a);ctx.lineCap='round';
    ctx.strokeStyle=INK;ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(-8,0);ctx.lineTo(56,0);ctx.stroke();ctx.strokeStyle=col(e,'#7a5230');ctx.lineWidth=3.2;ctx.stroke();
    ctx.fillStyle=col(e,'#d3d9de');ctx.strokeStyle=INK;ctx.lineWidth=2.4;
    ctx.beginPath();ctx.moveTo(44,-3);ctx.quadraticCurveTo(52,-26,68,-24);ctx.quadraticCurveTo(60,0,68,24);ctx.quadraticCurveTo(52,26,44,3);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.strokeStyle='rgba(43,26,18,.3)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(60,-18);ctx.quadraticCurveTo(55,0,60,18);ctx.stroke();
    ctx.restore();
    if(!(e.guard>0)) limb(-3,sy+2,sx+Math.cos(a)*10,sy+Math.sin(a)*10,6,dark);
    limb(6,sy+1,sx+Math.cos(a)*22,sy+Math.sin(a)*22,6,skin);
    }
    ctx.fillStyle=metal;ctx.strokeStyle=INK;ctx.lineWidth=2.2;ctx.beginPath();ctx.ellipse(4,sy-1,7,5,-.3,0,7);ctx.fill();ctx.stroke();
    const hy=-54+cr+bob, fury=e.state==='wind'||e.state==='throwWind'||e.state==='jwind';
    lizHead(e,hy,skin,!e.helmet||fury);
    if(e.helmet) helmShape(hy,metal,metalD,fury);
    else{ctx.strokeStyle='#b8404a';ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(-2,hy-11);ctx.lineTo(4,hy-7);ctx.moveTo(1,hy-12);ctx.lineTo(-1,hy-6);ctx.stroke()}
    if(e.guard>0){ // forearm laid flat over the head; the player can stand on it
      const gy=-68,blink=e.guard<1&&Math.floor(time*10)%2;
      limb(-3,sy+2,-18,gy+3,7,dark);limb(-18,gy,31,gy-1,7,blink?col(e,'#4a6a3a'):dark);
      ctx.fillStyle=dark;ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.beginPath();ctx.arc(32,gy-1,5.5,0,7);ctx.fill();ctx.stroke();
      ctx.fillStyle=metalD;ctx.beginPath();ctx.roundRect(-6,gy-4,14,8,3);ctx.fill();ctx.lineWidth=1.6;ctx.stroke()}
    ctx.restore();
    if(e.state==='stun') for(let k=0;k<3;k++){const an=time*5+k*2.1;drawStar(cx+f*12+Math.cos(an)*26,e.y-12+Math.sin(an)*7,6,time*4)}
    if(e.turnT>0){ctx.fillStyle=INK;ctx.font='22px '+FONT;ctx.textAlign='center';ctx.fillText('?',cx,e.y-26)}
  },
  maskGob(e){
    const hidden=e.state==='hide';
    drawBush(e.bx,e.by,.55,e.state==='leap'&&e.vy<0?3:0);
    if(hidden){ // only the burning eyes show through the leaves
      if(e.blink>0){const ex=e.bx+(e.face||1)*3,ey=e.by-22,fl=.75+.25*Math.sin(time*9+e.bx);
        ctx.fillStyle=`rgba(255,140,30,${.28*fl})`;for(const s of [-7,7]){ctx.beginPath();ctx.arc(ex+s,ey,9,0,7);ctx.fill()}
        ctx.fillStyle=`rgba(255,${190+50*fl|0},60,1)`;ctx.strokeStyle=INK;ctx.lineWidth=1.5;
        for(const s of [-7,7]){ctx.beginPath();ctx.ellipse(ex+s,ey,4.2,2.8,s*.04,0,7);ctx.fill();ctx.stroke()}
        ctx.fillStyle=INK;for(const s of [-7,7]){ctx.beginPath();ctx.ellipse(ex+s+(e.face||1),ey,1,2.4,0,0,7);ctx.fill()}}
      return}
    const f=e.face,cx=e.x+e.w/2,by=e.y+e.h,skin=col(e,'#6f9f4a'),cloth=col(e,'#8a4a2a'),air=!e.onGround,step=!air&&Math.abs(e.vx)>10?Math.sin(e.anim)*4:0;
    if(!air) shadow(cx,by,15);
    ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.lineJoin='round';
    limb(cx-5,by-14,cx-7+step-(air?3:0),by-2-(air?5:0),7,skin);limb(cx+5,by-14,cx+7-step+(air?3:0),by-2-(air?5:0),7,skin);
    ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.fillStyle=skin;ctx.beginPath();ctx.roundRect(cx-10,by-31,20,19,6);ctx.fill();ctx.stroke();
    ctx.fillStyle=cloth;ctx.beginPath();ctx.moveTo(cx-11,by-16);ctx.lineTo(cx+11,by-16);ctx.lineTo(cx+6,by-6);ctx.lineTo(cx,by-10);ctx.lineTo(cx-6,by-6);ctx.closePath();ctx.fill();ctx.stroke();
    for(let k=0;k<5;k++){ctx.fillStyle=['#d8452f','#f2c94c','#3aa0d8','#f2c94c','#d8452f'][k];ctx.beginPath();ctx.arc(cx-8+k*4,by-28+Math.abs(k-2)*1.2,1.9,0,7);ctx.fill()}
    // head: pointed ears behind a carved wooden totem mask
    const hx=cx+f*2,hy=by-41;
    ctx.fillStyle=skin;ctx.strokeStyle=INK;for(const s of [-1,1]){ctx.beginPath();ctx.moveTo(hx+s*9,hy-2);ctx.lineTo(hx+s*22,hy-9);ctx.lineTo(hx+s*10,hy+5);ctx.closePath();ctx.fill();ctx.stroke()}
    for(const [c,a] of [['#d8452f',-.45],['#3aa0d8',0],['#f2c94c',.45]]){ctx.save();ctx.translate(hx+a*14,hy-14);ctx.rotate(a);ctx.fillStyle=col(e,c);ctx.beginPath();ctx.ellipse(0,-9,3.6,10,0,0,7);ctx.fill();ctx.lineWidth=1.6;ctx.stroke();ctx.restore()}
    ctx.lineWidth=2.5;ctx.fillStyle=col(e,'#c9a26b');ctx.beginPath();ctx.moveTo(hx-11,hy-12);ctx.quadraticCurveTo(hx,hy-18,hx+11,hy-12);ctx.lineTo(hx+10,hy+8);ctx.quadraticCurveTo(hx,hy+15,hx-10,hy+8);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle=col(e,'#d8452f');ctx.fillRect(hx-1.5,hy-15,3,9);ctx.fillRect(hx-10,hy+1,20,2.5);
    ctx.fillStyle=INK;for(const s of [-5,5]){ctx.beginPath();ctx.ellipse(hx+s,hy-5,3.8,2.8,0,0,7);ctx.fill()}
    ctx.fillStyle='#ffb13b';for(const s of [-5,5]){ctx.beginPath();ctx.arc(hx+s+f,hy-5,1.6,0,7);ctx.fill()}
    ctx.fillStyle=INK;ctx.fillRect(hx-6,hy+5,12,5);ctx.fillStyle='#fff';for(let k=0;k<3;k++){ctx.beginPath();ctx.moveTo(hx-5+k*4,hy+5);ctx.lineTo(hx-3+k*4,hy+8.5);ctx.lineTo(hx-1+k*4,hy+5);ctx.fill()}
    // the blowgun points at the player
    const mx=hx+f*6,my=hy+7,ca=clamp(Math.atan2(P.y+P.h/2-my,(P.x+P.w/2-mx)*f),-.9,.9),ux=Math.cos(ca)*f,uy=Math.sin(ca);
    const tx=mx+ux*36,ty=my+uy*36;
    ctx.lineCap='round';ctx.strokeStyle=INK;ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(mx,my);ctx.lineTo(tx,ty);ctx.stroke();ctx.strokeStyle=col(e,'#a8844f');ctx.lineWidth=3;ctx.stroke();
    limb(cx+f*3,by-26,mx+ux*16,my+uy*16+3,5,skin);
    if(e.puff>0){ctx.fillStyle=`rgba(240,240,220,${e.puff*3})`;ctx.beginPath();ctx.arc(tx+ux*6,ty+uy*6,5+(.2-e.puff)*30,0,7);ctx.fill()}
    if(e.state==='aim'){ctx.fillStyle=`rgba(255,120,40,${.4+.3*Math.sin(time*30)})`;ctx.beginPath();ctx.arc(tx,ty,4,0,7);ctx.fill()}
  },
  mosquito(e){
    const cx=e.x+e.w/2,cy=e.y+e.h/2,f=e.face||1;
    if(e.state==='aim'){ctx.save();ctx.setLineDash([8,8]);ctx.lineDashOffset=-time*40;ctx.strokeStyle=`rgba(216,69,47,${.55+.3*Math.sin(time*22)})`;ctx.lineWidth=3;
      ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(e.tx,e.ty);ctx.stroke();ctx.restore()}
    const dir=e.state==='dive'||e.state==='stuck', a=dir?Math.atan2(e.vy,e.vx):(f>0?0:Math.PI);
    ctx.save();ctx.translate(cx,cy);ctx.rotate(a+(e.state==='stuck'?Math.sin(time*30)*.12:0));ctx.scale(1.3,Math.cos(a)<0?-1.3:1.3);
    ctx.lineJoin='round';
    const fl=e.state==='stuck'?Math.sin(time*50):Math.sin(time*70);
    ctx.fillStyle='rgba(225,242,255,.6)';ctx.strokeStyle='rgba(43,26,18,.55)';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.ellipse(-5,-11,14,4+fl*2.5,-.45,0,7);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.ellipse(1,-11,11,3.5-fl*2,-.95,0,7);ctx.fill();ctx.stroke();
    ctx.strokeStyle=INK;ctx.lineWidth=1.5;ctx.beginPath();
    for(let k=0;k<3;k++){ctx.moveTo(-2+k*4,4);ctx.lineTo(-6+k*3,12+k);ctx.lineTo(-12+k*2,18+k)}ctx.stroke();
    ctx.lineWidth=2.2;ctx.fillStyle=col(e,'#8a6a4a');ctx.beginPath();ctx.ellipse(-13,3,11,6,.2,0,7);ctx.fill();ctx.stroke();
    ctx.strokeStyle='rgba(43,26,18,.7)';ctx.lineWidth=2;ctx.beginPath();for(const sx of [-18,-13,-8]){ctx.moveTo(sx,-2);ctx.lineTo(sx+1.5,8.5)}ctx.stroke();
    ctx.strokeStyle=INK;ctx.lineWidth=2.2;ctx.fillStyle=col(e,'#5f5046');ctx.beginPath();ctx.ellipse(0,0,7,6,0,0,7);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.arc(8,1,5,0,7);ctx.fill();ctx.stroke();
    ctx.fillStyle='#e8302a';ctx.beginPath();ctx.arc(9.5,-.5,2.8,0,7);ctx.fill();
    ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(12,2);ctx.lineTo(27,3.5);ctx.stroke();
    ctx.restore();
  },
  spider(e){
    const cx=e.x+e.w/2,cy=e.y+e.h/2,open=e.state==='drop'||e.state==='hang';
    ctx.strokeStyle='rgba(245,245,235,.85)';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(cx,e.ay);ctx.lineTo(cx,e.y+2);ctx.stroke();
    ctx.strokeStyle=INK;ctx.lineWidth=2.6;ctx.lineJoin='round';ctx.lineCap='round';ctx.beginPath();
    for(const s of [-1,1])for(let i=0;i<4;i++){const w=Math.sin(time*(open?14:3)+i*1.7+s)*2.5,kx=cx+s*(12+i*2),ky=cy-9+i*5,fx=cx+s*(open?21+i*2:15+i),fy=cy+(open?-2+i*6:5+i*3)+w;
      ctx.moveTo(cx+s*4,cy-3+i*2);ctx.lineTo(kx,ky-6);ctx.lineTo(fx,fy)}
    ctx.stroke();
    ctx.lineWidth=2.4;ctx.fillStyle=col(e,'#4a2f4f');ctx.beginPath();ctx.ellipse(cx,cy-5,12,11,0,0,7);ctx.fill();ctx.stroke();
    ctx.fillStyle=col(e,'#e0782a');ctx.beginPath();ctx.moveTo(cx,cy-12);ctx.lineTo(cx+4,cy-6);ctx.lineTo(cx,cy);ctx.lineTo(cx-4,cy-6);ctx.closePath();ctx.fill();
    ctx.fillStyle=col(e,'#3a2438');ctx.beginPath();ctx.ellipse(cx,cy+8,8,6,0,0,7);ctx.fill();ctx.stroke();
    ctx.fillStyle='#ff4a3a';for(const [ex,ey] of [[-3.5,6],[3.5,6],[-2,9.5],[2,9.5]]){ctx.beginPath();ctx.arc(cx+ex,cy+ey,1.5,0,7);ctx.fill()}
    ctx.strokeStyle='#fff';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(cx-2.5,cy+13);ctx.lineTo(cx-1.5,cy+16);ctx.moveTo(cx+2.5,cy+13);ctx.lineTo(cx+1.5,cy+16);ctx.stroke();
  },
  frog(e){
    const f=e.face,cx=e.x+e.w/2,by=e.y+e.h,air=!e.onGround&&!e.inWater,skin=col(e,'#6f9a3a'),dark=col(e,'#4f7a2a'),belly=col(e,'#dcd89a');
    if(e.onGround) shadow(cx,by,18);
    ctx.save();ctx.translate(cx,by);ctx.scale(f,1);ctx.lineJoin='round';ctx.strokeStyle=INK;ctx.lineWidth=2.5;
    if(air){limb(-8,-9,-24,2,6,dark);limb(-24,2,-32,-2,4,dark)}else{ctx.fillStyle=dark;ctx.beginPath();ctx.ellipse(-12,-6,10,7,-.2,0,7);ctx.fill();ctx.stroke()}
    ctx.fillStyle=skin;ctx.beginPath();ctx.moveTo(-19,-1);ctx.quadraticCurveTo(-21,-25,1,-25);ctx.quadraticCurveTo(21,-24,21,-8);ctx.quadraticCurveTo(20,-1,10,0);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle=dark;for(const [sx,sy,r] of [[-9,-16,4],[-2,-20,3],[-12,-8,3]]){ctx.beginPath();ctx.arc(sx,sy,r,0,7);ctx.fill()}
    const pu=e.state==='tongue'?0:Math.max(0,Math.sin(time*4+e.ph))*3.5;
    ctx.fillStyle=belly;ctx.beginPath();ctx.ellipse(12,-4,5+pu,3.5+pu*.7,0,0,7);ctx.fill();ctx.lineWidth=1.6;ctx.stroke();
    ctx.lineWidth=2.5;for(const [ex,ey] of [[-1,-24],[10,-25]]){ctx.fillStyle=skin;ctx.beginPath();ctx.arc(ex,ey,6.5,0,7);ctx.fill();ctx.stroke();
      ctx.fillStyle='#f2c94c';ctx.beginPath();ctx.arc(ex+1,ey-1,4,0,7);ctx.fill();ctx.fillStyle=INK;ctx.fillRect(ex-2,ey-2,6,2)}
    ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(7,-11);ctx.quadraticCurveTo(15,-9,21,-12);ctx.stroke();
    limb(10,-4,15,0,5,dark);
    if(e.tl>2){ctx.lineCap='round';ctx.strokeStyle=INK;ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(18,-10);ctx.lineTo(18+e.tl,-10);ctx.stroke();
      ctx.strokeStyle='#e86a8a';ctx.lineWidth=5;ctx.stroke();ctx.fillStyle='#e86a8a';ctx.strokeStyle=INK;ctx.lineWidth=2.2;ctx.beginPath();ctx.arc(20+e.tl,-10,7,0,7);ctx.fill();ctx.stroke()}
    ctx.restore();
  },
  lizHut(e){
    const cx=e.x+e.w/2,by=e.y+e.h,dmg=1-e.hp/EDEF.lizHut.hp;
    ctx.save();ctx.translate(cx,by);ctx.lineJoin='round';ctx.strokeStyle=INK;ctx.lineWidth=3;
    ctx.fillStyle=col(e,'#7a5230');ctx.beginPath();ctx.roundRect(-38,-50,76,50,4);ctx.fill();ctx.stroke();
    ctx.strokeStyle='rgba(43,26,18,.4)';ctx.lineWidth=2;ctx.beginPath();for(let x=-26;x<38;x+=12){ctx.moveTo(x,-48);ctx.lineTo(x,-2)}ctx.stroke();
    ctx.strokeStyle=INK;ctx.lineWidth=3;
    const op=e.door>0;
    ctx.fillStyle=op?'#3a1a0a':'#2b1a12';ctx.beginPath();ctx.moveTo(-13,0);ctx.lineTo(-13,-24);ctx.quadraticCurveTo(0,-40,13,-24);ctx.lineTo(13,0);ctx.closePath();ctx.fill();ctx.stroke();
    if(op){ctx.fillStyle=`rgba(255,150,50,${.25+.2*Math.sin(time*20)})`;ctx.beginPath();ctx.ellipse(0,-14,11,14,0,0,7);ctx.fill()}
    else{ctx.fillStyle='#ffcf3a';for(const s of [-4,4]){ctx.beginPath();ctx.ellipse(s,-20,2.4,1.6,0,0,7);ctx.fill()}}
    ctx.fillStyle=col(e,'#d9d48f');ctx.beginPath();ctx.moveTo(20,-40);ctx.lineTo(32,-40);ctx.lineTo(30,-24);ctx.lineTo(26,-28);ctx.lineTo(22,-24);ctx.closePath();ctx.fill();ctx.lineWidth=2;ctx.stroke();ctx.lineWidth=3;
    ctx.fillStyle=col(e,'#a8904a');ctx.beginPath();ctx.moveTo(-52,-42);ctx.lineTo(0,-88);ctx.lineTo(52,-42);ctx.quadraticCurveTo(0,-34,-52,-42);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.strokeStyle='rgba(43,26,18,.45)';ctx.lineWidth=2;ctx.beginPath();for(let k=-3;k<=3;k++){ctx.moveTo(k*6,-82);ctx.lineTo(k*15,-42)}ctx.stroke();
    ctx.strokeStyle=INK;ctx.lineWidth=2;for(let k=-4;k<=4;k++){const sx=k*11;ctx.beginPath();ctx.moveTo(sx,-40+Math.abs(k)*.4);ctx.lineTo(sx+Math.sin(time*2+k)*1.5,-33);ctx.stroke()}
    // lizard skull totem and a banner
    ctx.lineWidth=2.5;ctx.fillStyle=col(e,'#e8dcc0');ctx.beginPath();ctx.ellipse(0,-92,9,7,0,0,7);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(4,-94);ctx.lineTo(18,-91);ctx.lineTo(4,-88);ctx.fill();ctx.stroke();
    ctx.fillStyle=INK;ctx.beginPath();ctx.arc(-2,-93,2,0,7);ctx.fill();
    ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-40,-44);ctx.lineTo(-40,-104);ctx.stroke();
    ctx.fillStyle=col(e,'#d8452f');ctx.beginPath();ctx.moveTo(-40,-104);ctx.quadraticCurveTo(-26,-100+Math.sin(time*4)*3,-16,-98);ctx.lineTo(-40,-88);ctx.closePath();ctx.fill();ctx.lineWidth=2;ctx.stroke();
    if(dmg>.25){ctx.strokeStyle=INK;ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(-30,-46);ctx.lineTo(-24,-36);ctx.lineTo(-28,-26);ctx.lineTo(-20,-16);
      if(dmg>.55){ctx.moveTo(26,-10);ctx.lineTo(20,-20);ctx.lineTo(28,-30);ctx.moveTo(-8,-70);ctx.lineTo(4,-62);ctx.lineTo(-2,-54)}ctx.stroke()}
    ctx.restore();
    if(dmg>.55&&Math.random()<.08) parts.push({x:cx+rand(-20,20),y:by-80,vx:rand(-10,10),vy:-40,g:-20,c:'rgba(120,110,100,.45)',s:rand(6,10),life:1,max:0,t:'puff'});
  },
  barrel(e){
    const cx=e.x+e.w/2,by=e.y+e.h;shadow(cx,by,16);ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.lineJoin='round';
    ctx.fillStyle=col(e,'#9a6a3c');ctx.beginPath();ctx.moveTo(cx-13,by);ctx.quadraticCurveTo(cx-21,by-20,cx-13,by-40);ctx.lineTo(cx+13,by-40);ctx.quadraticCurveTo(cx+21,by-20,cx+13,by);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.strokeStyle='rgba(43,26,18,.4)';ctx.lineWidth=1.6;ctx.beginPath();for(const k of [-7,0,7]){ctx.moveTo(cx+k*.8,by-39);ctx.quadraticCurveTo(cx+k*1.25,by-20,cx+k*.8,by-1)}ctx.stroke();
    for(const hy of [by-8,by-32]){ctx.strokeStyle=INK;ctx.lineWidth=5.5;ctx.beginPath();ctx.moveTo(cx-17,hy);ctx.quadraticCurveTo(cx,hy+3,cx+17,hy);ctx.stroke();ctx.strokeStyle=col(e,'#8a949b');ctx.lineWidth=3;ctx.stroke()}
    ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.fillStyle=col(e,'#b8834f');ctx.beginPath();ctx.ellipse(cx,by-40,13,3.5,0,0,7);ctx.fill();ctx.stroke();
  },
  crate(e){
    const cx=e.x+e.w/2,by=e.y+e.h,x=cx-19,y=by-38;shadow(cx,by,18);ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.lineJoin='round';
    ctx.fillStyle=col(e,'#b8834f');ctx.fillRect(x,y,38,38);ctx.strokeRect(x,y,38,38);
    ctx.strokeStyle='rgba(43,26,18,.4)';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(x+5,y+13);ctx.lineTo(x+33,y+13);ctx.moveTo(x+5,y+25);ctx.lineTo(x+33,y+25);ctx.stroke();
    ctx.strokeStyle=INK;ctx.lineWidth=2.2;ctx.strokeRect(x+5,y+5,28,28);
    ctx.lineWidth=5.5;ctx.beginPath();ctx.moveTo(x+7,y+31);ctx.lineTo(x+31,y+7);ctx.stroke();ctx.strokeStyle=col(e,'#8a5a36');ctx.lineWidth=3;ctx.stroke();
    ctx.fillStyle=INK;for(const [nx,ny] of [[3,3],[35,3],[3,35],[35,35]]){ctx.beginPath();ctx.arc(x+nx,y+ny,1.3,0,7);ctx.fill()}
  },
  pot(e){
    const cx=e.x+e.w/2,by=e.y+e.h;shadow(cx,by,14);ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.lineJoin='round';
    ctx.fillStyle=col(e,'#c8743a');ctx.beginPath();ctx.moveTo(cx-7,by);ctx.quadraticCurveTo(cx-19,by-14,cx-10,by-27);ctx.lineTo(cx-7,by-31);ctx.lineTo(cx+7,by-31);ctx.lineTo(cx+10,by-27);ctx.quadraticCurveTo(cx+19,by-14,cx+7,by);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle=col(e,'#a85a2a');ctx.beginPath();ctx.roundRect(cx-10,by-36,20,6,3);ctx.fill();ctx.stroke();
    ctx.strokeStyle=col(e,'#f0d493');ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(cx-13,by-17);for(let k=0;k<6;k++)ctx.lineTo(cx-13+(k+1)*26/6,by-17+(k%2?-3:3));ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.3)';ctx.beginPath();ctx.ellipse(cx-6,by-18,2.5,6,.2,0,7);ctx.fill();
  },
};
function lizLower(e,skin,dark,cr){
  const mv=Math.abs(e.vx)>10&&e.onGround, st=mv?Math.sin(e.anim)*5:0, tw=Math.sin(time*4+e.x*.1)*4;
  ctx.fillStyle=skin;ctx.strokeStyle=INK;ctx.lineWidth=2.6;
  ctx.beginPath();ctx.moveTo(-6,-27+cr);ctx.quadraticCurveTo(-26,-22+cr,-42,-3+tw);ctx.quadraticCurveTo(-24,-9+cr*.5,-4,-15+cr);ctx.closePath();ctx.fill();ctx.stroke();
  if(!e.onGround){limb(-5,-21+cr,-12,-8,8,dark);limb(6,-21+cr,12,-10,8,skin)}
  else{limb(-5,-21+cr,-7+st,-2,8,dark);limb(6,-21+cr,8-st,-2,8,skin)}
}
function lizTorso(e,skin,belly,cr){
  const bob=Math.abs(e.vx)>10?Math.abs(Math.sin(e.anim))*1.5:Math.sin(time*3+e.x)*.8;
  ctx.fillStyle=skin;ctx.strokeStyle=INK;ctx.lineWidth=2.6;ctx.beginPath();ctx.ellipse(0,-33+cr+bob,12,15,-.08,0,7);ctx.fill();ctx.stroke();
  ctx.fillStyle=belly;ctx.beginPath();ctx.ellipse(4,-31+cr+bob,6.5,11,-.08,0,7);ctx.fill();
  ctx.strokeStyle='rgba(43,26,18,.35)';ctx.lineWidth=1.5;for(let k=0;k<3;k++){ctx.beginPath();ctx.moveTo(0,-36+k*6+cr+bob);ctx.lineTo(9,-36+k*6+cr+bob);ctx.stroke()}
  return bob;
}
function lizHead(e,hy,skin,angry){
  ctx.fillStyle=skin;ctx.strokeStyle=INK;ctx.lineWidth=2.6;
  ctx.beginPath();ctx.moveTo(-8,hy+5);ctx.quadraticCurveTo(-11,hy-11,3,hy-12);ctx.quadraticCurveTo(17,hy-11,26,hy-4);ctx.quadraticCurveTo(30,hy+2,25,hy+6);ctx.lineTo(5,hy+8);ctx.quadraticCurveTo(-5,hy+11,-8,hy+5);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(9,hy+3);ctx.lineTo(25,hy+2);ctx.stroke();
  ctx.fillStyle='#fff';for(let k=0;k<3;k++){const tx=12+k*4.5;ctx.beginPath();ctx.moveTo(tx,hy+2.5);ctx.lineTo(tx+1.5,hy+5.5);ctx.lineTo(tx+3,hy+2.5);ctx.fill()}
  ctx.fillStyle=INK;ctx.beginPath();ctx.arc(24,hy-3,1.3,0,7);ctx.fill();
  ctx.fillStyle=angry?'#ff5a3a':'#f3d23b';ctx.beginPath();ctx.ellipse(5,hy-5,4.6,4,0,0,7);ctx.fill();ctx.lineWidth=1.8;ctx.stroke();
  ctx.fillStyle=INK;ctx.beginPath();ctx.ellipse(6,hy-5,1.2,3.3,0,0,7);ctx.fill();
  ctx.lineWidth=2.6;ctx.beginPath();ctx.moveTo(-1,hy-10);ctx.lineTo(11,hy-8);ctx.stroke();
}
// fully closed great helm with a narrow eye slit (covers the whole head and snout)
function helmShape(hy,metal,metalD,fury){
  ctx.strokeStyle=INK;ctx.lineWidth=2.4;ctx.lineJoin='round';
  ctx.fillStyle=metal;ctx.beginPath();
  ctx.moveTo(-14,hy+11);ctx.lineTo(-15,hy-8);ctx.quadraticCurveTo(-13,hy-23,4,hy-23);ctx.quadraticCurveTo(23,hy-22,31,hy-8);ctx.quadraticCurveTo(35,hy+3,31,hy+11);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.strokeStyle=metalD;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-12,hy-13);ctx.quadraticCurveTo(5,hy-27,27,hy-14);ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.28)';ctx.beginPath();ctx.ellipse(-4,hy-12,4,7,-.4,0,7);ctx.fill();
  ctx.fillStyle='#15100c';ctx.beginPath();ctx.roundRect(1,hy-7,28,4,2);ctx.fill();
  ctx.fillStyle=fury?'#ff3a1a':'#ffd23b';ctx.beginPath();ctx.arc(8,hy-5,1.9,0,7);ctx.fill();
  if(fury){ctx.fillStyle='rgba(255,70,30,.35)';ctx.beginPath();ctx.arc(8,hy-5,5,0,7);ctx.fill()}
  ctx.fillStyle=INK;for(const [x,y] of [[20,hy+2],[24,hy+2],[28,hy+2],[22,hy+5],[26,hy+5]]){ctx.beginPath();ctx.arc(x,y,.9,0,7);ctx.fill()}
  ctx.strokeStyle=INK;ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(-14,hy+7);ctx.lineTo(32,hy+7);ctx.stroke();
  ctx.fillStyle=metalD;for(const x of [-9,1,11,21]){ctx.beginPath();ctx.arc(x,hy+9,1.2,0,7);ctx.fill()}
}
function drawHelm(x,y,rot){ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.scale(1.5,1.5);ctx.translate(-9,0);helmShape(6,'#9aa4ab','#6f7880');ctx.restore()}
// the commander's big axe, drawn spinning around its middle
function drawAxe(x,y,rot){
  ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.scale(1.5,1.5);ctx.translate(-32,0);ctx.lineCap='round';
  ctx.strokeStyle=INK;ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(-8,0);ctx.lineTo(56,0);ctx.stroke();ctx.strokeStyle='#7a5230';ctx.lineWidth=3.2;ctx.stroke();
  ctx.fillStyle='#d3d9de';ctx.strokeStyle=INK;ctx.lineWidth=2.4;
  ctx.beginPath();ctx.moveTo(44,-3);ctx.quadraticCurveTo(52,-26,68,-24);ctx.quadraticCurveTo(60,0,68,24);ctx.quadraticCurveTo(52,26,44,3);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.restore();
}
