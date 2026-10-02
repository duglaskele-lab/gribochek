/* ---------- audio ---------- */
let AC=null, SFX_BUS=null;
const VOL={music:.7,sfx:.8};
try{const v=JSON.parse(localStorage.getItem('grib-vol')||'{}');if(v.music>=0)VOL.music=v.music;if(v.sfx>=0)VOL.sfx=v.sfx}catch(e){}
function saveVol(){try{localStorage.setItem('grib-vol',JSON.stringify(VOL))}catch(e){}}
function applySfxVol(){if(SFX_BUS)SFX_BUS.gain.value=VOL.sfx*1.25}
function initAudio(){ if(AC) return; try{AC=new (window.AudioContext||window.webkitAudioContext)();SFX_BUS=AC.createGain();SFX_BUS.connect(AC.destination);applySfxVol()}catch(e){} }
function tone(f1,f2,dur,type='square',vol=.05,delay=0){
  if(!AC) return; const t=AC.currentTime+delay;
  const o=AC.createOscillator(), g=AC.createGain();
  o.type=type; o.frequency.setValueAtTime(f1,t); o.frequency.exponentialRampToValueAtTime(Math.max(20,f2),t+dur);
  g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(g).connect(SFX_BUS); o.start(t); o.stop(t+dur+.02);
}
const SFX={
  jump:()=>tone(380,720,.11,'square',.035),
  shoot:()=>tone(820,300,.08,'triangle',.06),
  hit:()=>tone(240,90,.09,'square',.045),
  kill:()=>{tone(500,120,.15,'square',.05);tone(900,1400,.08,'sine',.04,.05)},
  coin:()=>{tone(990,990,.05,'sine',.05);tone(1480,1480,.09,'sine',.05,.05)},
  hurt:()=>tone(330,90,.3,'sawtooth',.05),
  land:()=>tone(160,60,.07,'triangle',.06),
  power:()=>[523,659,784,1046].forEach((f,i)=>tone(f,f,.1,'square',.04,i*.08)),
  boom:()=>{tone(120,35,.45,'sawtooth',.08);tone(80,30,.5,'square',.05)},
  roar:()=>{tone(90,60,.8,'sawtooth',.08);tone(140,70,.8,'square',.04)},
  check:()=>[660,880].forEach((f,i)=>tone(f,f,.12,'triangle',.06,i*.1)),
  throwb:()=>tone(300,500,.1,'triangle',.04),
  dash:()=>{tone(700,180,.14,'sawtooth',.035);tone(1200,500,.08,'triangle',.03)},
  punch:()=>{tone(260,90,.09,'triangle',.06);tone(900,300,.05,'square',.02)},
  clang:()=>{tone(1400,1100,.12,'square',.04);tone(2100,1800,.1,'triangle',.03)},
  splash:()=>tone(500,120,.18,'sine',.05),
  crack:()=>{tone(200,50,.35,'sawtooth',.07);tone(90,40,.4,'square',.05,.05)},
  fire:()=>tone(160,90,.25,'sawtooth',.035),
  screech:()=>{tone(900,1400,.25,'sawtooth',.03);tone(1300,700,.2,'square',.02,.1)},
  select:()=>tone(660,660,.04,'triangle',.04),
  deny:()=>tone(180,140,.12,'square',.04),
  sand:()=>{tone(260,90,.2,'triangle',.045);tone(150,60,.24,'sawtooth',.02,.04)},
  secret:()=>[784,988,1175,1568].forEach((f,i)=>tone(f,f,.1,'triangle',.05,i*.07)),
  creak:()=>{tone(180,110,.28,'sawtooth',.03);tone(260,150,.2,'triangle',.03,.09)},
  lick:()=>{tone(700,250,.12,'triangle',.05);tone(300,520,.08,'sine',.04,.1)},
  rustle:()=>{tone(1800,900,.12,'sawtooth',.02);tone(1200,700,.15,'square',.015,.05)},
  buzz:()=>{tone(190,240,.4,'sawtooth',.025);tone(380,330,.4,'square',.012)},
  squawk:()=>{tone(1100,1700,.08,'square',.03);tone(1500,900,.12,'square',.03,.08);tone(1200,1800,.07,'square',.025,.2)},
};
const sfx=n=>SFX[n]&&SFX[n]();

