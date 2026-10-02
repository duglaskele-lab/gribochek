function drawWater(){
  const c0=Math.max(0,Math.floor(camX/TS)-1), c1=Math.min(COLS-1,Math.ceil((camX+VW)/TS)+1), r0=rowLo(), r1=rowHi();
  const wc=waterTint();
  for(let c=c0;c<=c1;c++)for(let r=r0;r<=r1;r++) if(grid[r][c]===T_SAND) drawSand(c,r);
  ctx.beginPath(); let any=false;
  for(let c=c0;c<=c1;c++)for(let r=r0;r<=r1;r++) if(isWet(c,r)){ctx.rect(c*TS-.5,r*TS,TS+1,TS+.5);any=true}
  if(any){ctx.fillStyle=wc;ctx.fill()}
  for(let c=c0;c<=c1;c++)for(let r=r0;r<=r1;r++){
    if(!isWet(c,r)) continue; const x=c*TS,y=r*TS;
    if(!isWet(c,r-1)&&!isSolidT(tile(c,r-1))){
      ctx.strokeStyle='rgba(235,250,255,.9)';ctx.lineWidth=3;ctx.beginPath();
      for(let k=0;k<=4;k++){const wx=x+k*10,wy=y+2+Math.sin(time*3+(c*4+k)*.8)*2;k?ctx.lineTo(wx,wy):ctx.moveTo(wx,wy)}ctx.stroke();
    }
    const f=grid[r][c]===T_WATER?flow[r][c]:0;
    if(f){ctx.strokeStyle='rgba(255,255,255,.45)';ctx.lineWidth=2;
      for(let k=0;k<2;k++){const ph=((time*FLOW_V*f/TS+hash(c,r*3+k))%1+1)%1,sx=x+ph*TS,sy=y+10+k*16;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx+f*12,sy);ctx.stroke()}}
  }
  drawPlayerTint(wc);
}
const waterTint=()=>BIOME==='desert'?'rgba(70,170,190,.55)':BIOME==='swamp'?'rgba(78,110,56,.7)':'rgba(70,140,210,.5)';
// The water squares tint only the part of the girl that is inside them. Bits of her sprite that poke into rock
// (a wall at her side, the rock above her head) while she is under water get the same tint here, and so does
// everything below the surface of the hydra's poison, which is drawn behind her.
let tintCv=null,tintCx=null;
function drawPlayerTint(wc){
  const fr=P&&P._fr; if(!fr) return;
  // _fr: [anim, frame, x, bottom, face, alpha, squash, atlas?, frame rect?, scale?] - Raithwyn passes her own atlas
  const [n,i,cx,by,face,alpha,sy]=fr, img=fr[7]||sheet, f=fr[8]||FRAMES[n][i]; if(!f||!img.complete) return;
  const big=!!fr[7], bx=cx-(big?110:80),byy=by-(big?215:150),bw=big?220:160,bh=big?235:170;
  const zones=[];
  // rock tiles touching water (beside, above or below it) count as under water
  const cA=Math.floor(bx/TS),cB=Math.floor((bx+bw)/TS),rA=Math.max(0,Math.floor(byy/TS)),rB=Math.min(ROWS-1,Math.floor((byy+bh)/TS));
  for(let c=cA;c<=cB;c++)for(let r=rA;r<=rB;r++){
    if(!vsol(c,r)) continue;
    if(isWet(c-1,r)||isWet(c+1,r)||isWet(c,r+1)||isWet(c,r-1)) zones.push([c*TS-.5,r*TS-.5,TS+1,TS+1]);
    // the corner above-and-beside her head: rock that touches both a wet side and a tinted roof
    else if(vsol(c,r+1)&&((isWet(c-1,r+1)&&vsol(c-1,r))||(isWet(c+1,r+1)&&vsol(c+1,r)))) zones.push([c*TS-.5,r*TS-.5,TS+1,TS+1]);
  }
  const pz=BIOME==='swamp'&&poisonLvl>.01&&ARENA_R&&cx>ARENA_L-60&&cx<ARENA_R+60?poisonTop()+2:null;
  if(!zones.length&&pz===null) return;
  const S=K*camZ, W=Math.ceil(bw*S), Hh=Math.ceil(bh*S);
  if(!tintCv){tintCv=document.createElement('canvas');tintCx=tintCv.getContext('2d')}
  if(tintCv.width<W||tintCv.height<Hh){tintCv.width=Math.max(W,tintCv.width);tintCv.height=Math.max(Hh,tintCv.height)}
  const silhouette=col=>{const t=tintCx;t.setTransform(1,0,0,1,0,0);t.globalCompositeOperation='source-over';t.clearRect(0,0,tintCv.width,tintCv.height);
    t.setTransform(S,0,0,S,-bx*S,-byy*S);
    const [fx,fy,fw,fh,ax]=f, sc=fr[9]||SC*(ANIM_SCALE[n]||1);
    t.save();t.globalAlpha=alpha;t.translate(cx,by);t.scale(face,sy);t.drawImage(img,fx,fy,fw,fh,-ax*sc,-fh*sc,fw*sc,fh*sc);t.restore();
    t.globalCompositeOperation='source-in';t.setTransform(1,0,0,1,0,0);t.fillStyle=col;t.fillRect(0,0,tintCv.width,tintCv.height);
    t.globalCompositeOperation='source-over'};
  const blit=()=>ctx.drawImage(tintCv,0,0,W,Hh,bx,byy,W/S,Hh/S);
  if(zones.length){silhouette(wc);ctx.save();ctx.beginPath();for(const z of zones)ctx.rect(z[0],z[1],z[2],z[3]);ctx.clip();blit();ctx.restore()}
  if(pz!==null&&pz<byy+bh){silhouette('rgba(110,190,58,.72)');ctx.save();ctx.beginPath();ctx.rect(Math.max(bx,ARENA_L),pz,Math.min(bx+bw,ARENA_R)-Math.max(bx,ARENA_L),byy+bh-pz);ctx.clip();blit();ctx.restore()}
}
function drawSand(c,r,surf=tile(c,r-1)!==T_SAND){
  const x=c*TS,y=r*TS;
  ctx.fillStyle='rgba(196,132,62,.97)';ctx.fillRect(x-.5,surf?y+3:y,TS+1,surf?TS-2.5:TS+.5);
  ctx.fillStyle='rgba(110,68,28,.55)';
  for(let k=0;k<3;k++){const sy=y+((hash(r,c+k)*TS+time*7*(1+k*.3))%TS);ctx.beginPath();ctx.arc(x+4+hash(c,r+k)*32,sy,1.8,0,7);ctx.fill()}
  if(surf){
    ctx.strokeStyle='#8a5a2a';ctx.lineWidth=2.5;ctx.beginPath();
    for(let k=0;k<=4;k++){const wx=x+k*10,wy=y+3+Math.sin(time*1.4+(c*4+k)*.9)*1.3;k?ctx.lineTo(wx,wy):ctx.moveTo(wx,wy)}ctx.stroke();
    ctx.strokeStyle='rgba(138,90,42,.7)';ctx.lineWidth=2;const a=time*1.6+c;
    ctx.beginPath();ctx.arc(x+20,y+17,7+Math.sin(time*2+c)*1.5,a,a+3.6);ctx.stroke();
    ctx.beginPath();ctx.arc(x+20,y+17,3,a+2,a+4.5);ctx.stroke();
  }
}
