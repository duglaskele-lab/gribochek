/* ---------- crocodile ---------- */
function makeCroc(){return{kind:'croc',x:ARENA_L+22*TS,y:FLOOR-112,w:270,h:112,hp:44,max:44,face:-1,state:'sleep',t:0,vx:0,vy:0,jaw:0,flash:0,leg:0,aboveT:0,last:'',repeat:0,windMax:.85,high:false,phase:1,spitCD:0,shots:0,chompRun:0}}
function crocBody(){return{x:B.x+18,y:B.y+26,w:B.w-30,h:B.h-26}}
function crocTail(){const cx=B.x+B.w/2,by=B.y+B.h;return B.face>0?{x:cx-218,y:by-82,w:101,h:70}:{x:cx+117,y:by-82,w:101,h:70}}
function crocBite(){const hx=B.face>0?B.x+B.w-30:B.x-80;return{x:hx,y:B.y+10,w:110,h:70}}
const CHOMP_LUNGE=62;   // how far the bite lunge carries it forward (420 px/s braking at 1400 px/s² for .28 s)
const CHOMP_MAX=2;      // never more than two bites in a row
// the danger zone of the bite, drawn while it opens its jaws: where the bite will land after the lunge
function drawCrocBiteZone(){
  const wind=B.state==='chompWind', b=crocBite(), k=wind?clamp(1-B.t/.45,0,1):1;
  const x=b.x+(wind?B.face*CHOMP_LUNGE:0), a=wind?.12+.22*k:.38, pulse=.75+.25*Math.sin(time*30);
  ctx.save();ctx.fillStyle=`rgba(230,40,30,${a*pulse})`;ctx.strokeStyle=`rgba(200,20,10,${(a+.25)*pulse})`;ctx.lineWidth=3;ctx.setLineDash([10,7]);
  ctx.beginPath();ctx.roundRect(x,b.y,b.w,FLOOR-b.y,12);ctx.fill();ctx.stroke();
  ctx.setLineDash([]);ctx.fillStyle=`rgba(200,20,10,${(a+.15)*pulse})`;ctx.beginPath();ctx.ellipse(x+b.w/2,FLOOR-2,b.w/2,6,0,0,7);ctx.fill();
  ctx.restore();
}
function crocMouth(){return{x:B.x+B.w/2+B.face*172,y:B.y+B.h-52}}
// one rock of the spit burst: a fast arc that always lands at least MIN_D ahead of the mouth
// and flies high over anything closer, so standing next to the crocodile is safe
function crocSpitRock(){
  const m=crocMouth(), f=B.face, g=2200, MIN_D=260, i=B.shots;
  let tx=P.x+P.w/2+P.vx*.25+f*(i-2.5)*48;
  if(f*(tx-m.x)<MIN_D) tx=m.x+f*(MIN_D+i*28);
  tx=clamp(tx,ARENA_L+20,ARENA_R-20);
  const onPlat=P.onGround&&P.y+P.h<FLOOR-20, far=f*(tx-m.x)>=MIN_D&&Math.abs(tx-(P.x+P.w/2))<160;
  const ty=onPlat&&far?P.y+P.h*.5:FLOOR-14;
  const H=Math.max(140,(m.y-ty)+90), vy=-Math.sqrt(2*g*H);
  const Tt=(-vy+Math.sqrt(vy*vy+2*g*(ty-m.y)))/g;
  eshots.push({k:'rock',spit:true,x:m.x,y:m.y,vx:(tx-m.x)/Tt,vy,g,r:14});
  sfx('jump');dust(m.x,m.y,3,f);shake(.08,3);
}
function playerAbove(){return !P.dead&&P.onGround&&P.y+P.h<FLOOR-50}
const aboveLimit=()=>B.hp<B.max/2?.8:1.2;
function crocLeap(high){B.state='leapWind';B.t=high?.4:.28;B.high=high;B.aboveT=0;B.face=(P.x+P.w/2>B.x+B.w/2)?1:-1}
function crocLaunch(){
  const dx=P.x+P.w/2+P.vx*.3-(B.x+B.w/2), rise=Math.max(0,FLOOR-(P.y+P.h));
  let vy=980, vx;
  if(B.high){vy=Math.max(980,Math.sqrt(2*G*(rise+70)));vx=dx/(vy/G)} else vx=dx/(2*vy/G);
  B.vy=-vy;B.vx=clamp(vx,-760,760);B.state='leap';B.t=.15;sfx('jump');dust(B.x+B.w/2,FLOOR,10);
}
function crocChoose(){
  const p2=B.phase===2;
  const dx=P.x+P.w/2-(B.x+B.w/2), adx=Math.abs(dx), above=playerAbove();
  B.face=dx>0?1:-1;
  if(above&&B.aboveT>aboveLimit()){B.chompRun=0;return crocLeap(true)}
  // the player is pressed against a wall of the arena: usually jump, so she can slip out under it instead of being pinned
  if(!above&&Math.min(P.x-ARENA_L,ARENA_R-(P.x+P.w))<200&&Math.random()<.75){B.last='leap';B.repeat=0;B.chompRun=0;return crocLeap(false)}
  const opts=[], biteOk=B.chompRun<CHOMP_MAX;
  if(!above&&adx<270&&biteOk) opts.push(['chomp',5]);
  if(!above&&adx<=180&&!biteOk) opts.push(['leap',3]);   // too many bites already: something else, even up close
  if(!above&&adx>280) opts.push(['charge',3]);
  if(adx>180||above) opts.push(['leap',above?3:2]);
  if(!above&&adx>320) opts.push(['walk',1.5]);
  // phase 2: rock spit - dangerous from afar or on a platform, harmless right next to the crocodile
  if(p2&&B.spitCD<=0&&(adx>360||above)) opts.push(['spit',above?3.5:3]);
  if(!opts.length) opts.push(['walk',1]);
  for(const o of opts) if(o[0]===B.last) o[1]*=B.repeat>=1?.15:.6;
  let r=Math.random()*opts.reduce((a,o)=>a+o[1],0), pk=opts[0][0];
  for(const o of opts){r-=o[1];if(r<=0){pk=o[0];break}}
  B.repeat=pk===B.last?B.repeat+1:0; B.last=pk; B.chompRun=pk==='chomp'?B.chompRun+1:0;
  if(pk==='chomp'){B.state='chompWind';B.t=p2?.34:.45}
  else if(pk==='charge'){B.state='windup';B.t=B.windMax=p2?.65:.85}
  else if(pk==='leap') crocLeap(false);
  else if(pk==='spit'){B.state='spitWind';B.t=.7;B.shots=0;B.vx=0;sfx('roar')}
  else {B.state='walk';B.t=1.1}
}
function updateCroc(dt){
  if(playerAbove()) B.aboveT+=dt; else if(P.onGround) B.aboveT=Math.max(0,B.aboveT-dt*2);
  const p2=B.phase===2, mult=p2?1.25:1;
  if(B.spitCD>0) B.spitCD-=dt;
  B.vy+=G*dt; B.y+=B.vy*dt;
  const landed=B.y+B.h>=FLOOR; if(landed){B.y=FLOOR-B.h;B.vy=0}
  let wall=0; B.x+=B.vx*dt;
  if(B.x<ARENA_L){B.x=ARENA_L;wall=1} if(B.x+B.w>ARENA_R){B.x=ARENA_R-B.w;wall=1}
  if(Math.abs(B.vx)>10&&landed) B.leg+=dt*Math.abs(B.vx)/30;
  switch(B.state){
    case 'intro': B.t-=dt;B.jaw=.5+.5*Math.sin(time*18);if(B.t<=0){B.state='idle';B.t=.6;B.jaw=0}break;
    case 'idle': B.vx=approach(B.vx,0,1600*dt);B.jaw=approach(B.jaw,0,dt*3);B.t-=dt;
      if(B.phase===1&&B.hp<=B.max/2&&landed){B.state='enrage';B.t=1.5;B.vx=0;sfx('roar');shake(1,7);break}
      if(B.aboveT>aboveLimit()) B.t=Math.min(B.t,.12);
      if(B.t<=0) crocChoose();break;
    case 'walk': {const dx=P.x+P.w/2-(B.x+B.w/2);B.face=dx>0?1:-1;B.vx=B.face*140*mult;B.t-=dt;
      if(playerAbove()&&B.aboveT>aboveLimit()){B.state='idle';B.t=.1}
      else if(Math.abs(dx)<220&&!playerAbove()&&B.chompRun<CHOMP_MAX){B.state='chompWind';B.t=.4;B.chompRun++;B.last='chomp'}else if(B.t<=0){B.state='idle';B.t=.3}}break;
    case 'leapWind': B.vx=approach(B.vx,0,2000*dt);B.t-=dt;B.face=(P.x+P.w/2>B.x+B.w/2)?1:-1;
      if(Math.random()<.3) dust(B.x+B.w/2+rand(-100,100),FLOOR,1);
      if(B.t<=0) crocLaunch();break;
    case 'windup': B.vx=0;B.t-=dt;B.jaw=.25;
      if(Math.random()<.4) parts.push({x:B.x+B.w/2+B.face*150,y:B.y+45,vx:B.face*rand(40,120),vy:rand(-40,0),g:-30,c:'rgba(255,255,255,.8)',s:rand(4,7),life:.4,max:0,t:'puff'});
      if(B.t<=0){B.state='charge';B.vx=B.face*760*mult;sfx('roar');B.jaw=.6}break;
    case 'charge': if(Math.random()<.5)dust(B.x+B.w/2-B.face*100,FLOOR,1,-B.face);
      if(wall){B.state='stun';B.t=1.3;B.vx=0;B.jaw=0;shake(.45,13);sfx('boom');
        const n=p2?5:3;for(let i=0;i<n;i++)eshots.push({k:'rock',x:rand(ARENA_L+60,ARENA_R-60),y:-40-i*90,vy:0,g:1300,r:17})}break;
    case 'stun': B.t-=dt;if(B.t<=0){B.state='idle';B.t=.4}break;
    case 'leap': B.t-=dt;if(landed&&B.t<=0){
        B.vx=0;B.state='idle';B.t=p2?.5:.8;shake(.35,11);sfx('boom');dust(B.x+B.w/2,FLOOR,14);
        const sp=440*mult;
        eshots.push({k:'wave',x:B.x-10,y:FLOOR-30,w:34,h:30,vx:-sp});
        eshots.push({k:'wave',x:B.x+B.w-24,y:FLOOR-30,w:34,h:30,vx:sp});
      }break;
    case 'chompWind': B.vx=approach(B.vx,0,1600*dt);B.jaw=approach(B.jaw,1,dt*2.6);B.t-=dt;
      if(B.t<=0){B.state='chomp';B.t=.28;B.vx=B.face*420*mult;sfx('hit')}break;
    case 'chomp': B.jaw=approach(B.jaw,0,dt*12);B.vx=approach(B.vx,0,1400*dt);B.t-=dt;
      if(B.t<=0){B.state='idle';B.t=p2?.35:.6}break;
    case 'enrage': B.vx=0;B.t-=dt;B.jaw=.7+.3*Math.sin(time*22);
      if(Math.random()<.5) parts.push({x:crocMouth().x,y:crocMouth().y,vx:B.face*rand(60,160),vy:rand(-80,-20),g:-30,c:'rgba(255,255,255,.85)',s:rand(4,8),life:.5,max:0,t:'puff'});
      if(B.t<=0){B.phase=2;B.state='idle';B.t=.3;B.spitCD=1;floater(B.x+B.w/2,B.y-30,T('fPhase2c'))}break;
    case 'spitWind': B.vx=approach(B.vx,0,2000*dt);B.jaw=approach(B.jaw,1,dt*2.2);B.t-=dt;
      if(Math.random()<.35) parts.push({x:crocMouth().x,y:crocMouth().y,vx:B.face*rand(20,80),vy:rand(-40,10),g:0,c:'rgba(140,120,100,.7)',s:rand(3,6),life:.4,max:0,t:'puff'});
      if(B.t<=0){B.state='spit';B.t=0}break;
    case 'spit': B.vx=0;B.t-=dt;B.jaw=approach(B.jaw,.75,dt*6);
      if(B.t<=0&&B.shots<6){crocSpitRock();B.shots++;B.t=.13;B.jaw=1}
      else if(B.shots>=6&&B.t<=-.35){B.state='idle';B.t=.5;B.spitCD=4.5}break;
    case 'dying': B.t-=dt;B.vx=0;B.jaw=.8;
      if(Math.random()<.25){burst(B.x+rand(0,B.w),B.y+rand(0,B.h),8,Math.random()<.5?'#4f7d3c':'#ffd84a',200);sfx('hit')}
      if(B.t<=0) bossDefeated();break;
  }
}
function drawCroc(){
  const f=B.face, cx=B.x+B.w/2, by=B.y+B.h;
  const fl=B.flash>0, dying=B.state==='dying';
  const green=fl?'#fff':'#4f7d3c', dark=fl?'#fff':'#3a6130', belly=fl?'#fff':'#d4c886';
  ctx.save(); ctx.translate(cx,by);
  if(B.state==='windup'||dying) ctx.translate(rand(-2,2),0);
  ctx.scale(f,B.state==='leapWind'?.86:1);
  ctx.fillStyle='rgba(0,0,0,.18)';ctx.beginPath();ctx.ellipse(0,2,150,10,0,0,7);ctx.fill();
  ctx.lineWidth=3.5;ctx.strokeStyle=INK;ctx.lineJoin='round';
  const tw=Math.sin(time*3)*10;
  ctx.fillStyle=green;ctx.beginPath();ctx.moveTo(-100,-80);ctx.quadraticCurveTo(-170,-50,-215,-18+tw);ctx.quadraticCurveTo(-160,-20,-100,-28);ctx.closePath();ctx.fill();ctx.stroke();
  const lp=B.leg;
  const leg=(x,ph)=>{const lift=Math.max(0,Math.sin(lp+ph))*8;ctx.fillStyle=dark;ctx.beginPath();ctx.roundRect(x-12,-40-lift,26,40,8);ctx.fill();ctx.stroke();
    ctx.fillStyle=fl?'#fff':'#eee';for(let k=0;k<3;k++){ctx.beginPath();ctx.moveTo(x-10+k*9,-lift);ctx.lineTo(x-6+k*9,6-lift);ctx.lineTo(x-2+k*9,-lift);ctx.fill()}};
  leg(-85,0);leg(40,Math.PI);
  ctx.fillStyle=green;ctx.beginPath();ctx.ellipse(-20,-62,112,40,0,0,7);ctx.fill();ctx.stroke();
  ctx.fillStyle=belly;ctx.beginPath();ctx.ellipse(-20,-40,96,14,0,0,Math.PI);ctx.fill();
  ctx.strokeStyle='rgba(43,26,18,.4)';ctx.lineWidth=2;for(let k=-5;k<=5;k++){ctx.beginPath();ctx.moveTo(-20+k*16,-36);ctx.lineTo(-20+k*16,-28);ctx.stroke()}
  ctx.strokeStyle=INK;ctx.lineWidth=3.5;
  ctx.fillStyle=dark;for(let k=0;k<8;k++){const x=-110+k*22,y=-98+Math.abs(k-3.5)*1.6;ctx.beginPath();ctx.moveTo(x,y+6);ctx.lineTo(x+9,y-10);ctx.lineTo(x+18,y+6);ctx.fill();ctx.stroke()}
  ctx.fillStyle=dark;[[-60,-70],[-20,-78],[20,-66],[-90,-58]].forEach(([x,y])=>{ctx.beginPath();ctx.ellipse(x,y,9,6,0,0,7);ctx.fill()});
  leg(-55,Math.PI);leg(70,0);
  const jaw=B.jaw*.55;
  ctx.fillStyle=green;ctx.beginPath();ctx.moveTo(55,-58);ctx.lineTo(185,-44);ctx.quadraticCurveTo(195,-36,183,-28);ctx.lineTo(60,-30);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='#fff';for(let k=0;k<7;k++){const x=80+k*15;ctx.beginPath();ctx.moveTo(x,-45+k*.3);ctx.lineTo(x+5,-56);ctx.lineTo(x+10,-44+k*.3);ctx.fill();ctx.stroke()}
  if(jaw>.05){ctx.fillStyle='#b8404a';ctx.beginPath();ctx.moveTo(62,-58);ctx.lineTo(180,-46);ctx.lineTo(70,-50);ctx.fill()}
  ctx.save();ctx.translate(60,-60);ctx.rotate(-jaw);
  ctx.fillStyle=green;ctx.beginPath();ctx.moveTo(-10,-34);ctx.quadraticCurveTo(70,-30,128,-14);ctx.quadraticCurveTo(142,-8,132,4);ctx.lineTo(-5,6);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='#fff';for(let k=0;k<8;k++){const x=12+k*15;ctx.beginPath();ctx.moveTo(x,5);ctx.lineTo(x+5,16);ctx.lineTo(x+10,5);ctx.fill();ctx.stroke()}
  ctx.fillStyle=dark;ctx.beginPath();ctx.arc(122,-12,4,0,7);ctx.fill();
  ctx.fillStyle=green;ctx.beginPath();ctx.arc(12,-36,15,Math.PI,0);ctx.fill();ctx.stroke();
  const glow=B.state==='windup'?.35+.65*clamp(1-B.t/B.windMax,0,1):0;
  if(glow>0){const pr=.8+.2*Math.sin(time*30);for(const r of [48,32,20]){ctx.fillStyle=`rgba(255,60,20,${.32*glow*pr})`;ctx.beginPath();ctx.arc(13,-37,r*(.5+glow*.7),0,7);ctx.fill()}}
  ctx.fillStyle=fl?'#fff':(glow>0?`rgb(255,${Math.round(210-170*glow)},${Math.round(60-50*glow)})`:'#f3d23b');ctx.beginPath();ctx.ellipse(13,-37,9,7,0,0,7);ctx.fill();ctx.stroke();
  ctx.fillStyle=INK;if(B.state==='stun'||dying){ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(8,-42);ctx.lineTo(18,-32);ctx.moveTo(18,-42);ctx.lineTo(8,-32);ctx.stroke()}
  else{ctx.beginPath();ctx.ellipse(15,-37,2.5,6,0,0,7);ctx.fill();ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-2,-50);ctx.lineTo(26,-44);ctx.stroke()}
  ctx.restore();
  ctx.restore();
  if(B.state==='chompWind'||B.state==='chomp') drawCrocBiteZone();
  if(B.state==='stun') for(let k=0;k<3;k++){const a=time*5+k*2.1;drawStar(cx+f*60+Math.cos(a)*40,B.y-10+Math.sin(a)*10,7,time*4)}
}

registerBoss('croc',{make:makeCroc,update:updateCroc,draw:drawCroc,burst:'#4f7d3c',nameKey:'boss',introT:1.6,
  dmgMult:()=>B.state==='enrage'?.4:1});   // while it changes into phase 2 it takes 60% less damage
