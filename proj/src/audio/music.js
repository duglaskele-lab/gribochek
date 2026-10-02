/* ---------- music: small chiptune sequencer (original tunes in a handheld-RPG style) ---------- */
const NOTE_IDX={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
function midi(n){const m=/^([A-G])([#b]?)(-?\d)$/.exec(n);return NOTE_IDX[m[1]]+(m[2]==='#'?1:m[2]==='b'?-1:0)+12*(+m[3]+1)}
const mfreq=m=>440*Math.pow(2,(m-69)/12);
function chordTones(name){
  const m=/^([A-G][#b]?)(m?)$/.exec(name), r=midi(m[1]+'2');
  return [r,r+(m[2]?3:4),r+7];
}
// A song is a list of sections played in order and looped. Lead: "E5:2 r:2 ..." in 16th steps;
// chords one per bar ("C,D" = half a bar each); drum/bass/arp patterns are 16-step strings.
function compileSong(d){
  const steps=[];
  for(const name of d.order){
    // "A2" = section A replayed with the song's variant settings (different timbre/arpeggio)
    const sec=Object.assign({},d,d.sections[name]||Object.assign({},d.sections[name.slice(0,-1)],d.variant));
    const lead=[];let st=0;
    for(const tok of sec.lead.trim().split(/\s+/)){const [n,l]=tok.split(':'),len=+l||1;if(n!=='r')lead.push({s:st,m:midi(n),d:len});st+=len}
    const bars=st/16;
    if(bars!==sec.chords.length) throw new Error(`song section ${name}: ${bars} bars of lead, ${sec.chords.length} chords`);
    const base=steps.length;
    for(let i=0;i<st;i++){
      const c=sec.chords[Math.floor(i/16)].split(','), bi=i%16;
      steps.push({ch:chordTones(c[Math.floor(bi*c.length/16)]),bi,notes:[],b:pat(sec.bass,bi),a:pat(sec.arp,bi),
        k:pat(sec.kick,bi),s:pat(sec.snare,bi),h:pat(sec.hat,bi),g:pat(sec.gtr||'.',bi),cr:!!d.crash&&i===0,lw:sec.lw||25,lv:sec.lv||.22,av:sec.av||.05,bv:sec.bv||.42})
    }
    for(const n of lead) steps[base+n.s].notes.push(n);
  }
  return Object.assign({},d,{len:steps.length,steps});
}
const pat=(p,i)=>{p=p.replace(/\s/g,'');return p[i%p.length]};
const SONGS={
  forest:compileSong({bpm:144,vol:1,order:['intro','A','B','A2','C','D','B'],variant:{lw:'square',lv:.17,arp:'1.5.8.5.3.5.8.5.',hat:'....x.......x...'},
    bass:'R.O.R.O.R.O.R.O.', arp:'1.3.5.3.1.3.5.3.', kick:'x.......x.......', snare:'....x.......x...', hat:'..x...x...x...x.',
    sections:{
      intro:{chords:['G','C','G','D'],lead:'r:64',kick:'x...............',snare:'................',hat:'........x.......',bass:'R.......R.......'},
      A:{chords:['G','Em','C','D','G','Em','C,D','G'],
        lead:`D5:2 G5:2 A5:2 B5:4 A5:2 G5:2 D5:2  E5:2 G5:2 B5:4 A5:2 G5:2 E5:4  C5:2 E5:2 G5:2 C6:4 B5:2 A5:2 G5:2  A5:4 F#5:2 D5:2 E5:2 F#5:2 A5:4
              B5:3 A5:1 G5:2 D5:2 G5:2 B5:2 D6:4  C6:2 B5:2 A5:2 G5:2 E5:4 G5:4  E5:2 G5:2 C6:2 B5:2 A5:2 F#5:2 D5:2 F#5:2  G5:6 D5:2 G5:4 r:4`},
      B:{chords:['C','D','Bm','Em','C','D','Em','D'],
        lead:`E5:4 G5:4 E5:2 D5:2 C5:4  D5:2 E5:2 F#5:4 A5:4 F#5:4  B4:2 D5:2 F#5:4 B5:4 A5:2 F#5:2  G5:6 F#5:2 E5:8
              E5:2 F#5:2 G5:4 C6:4 B5:2 A5:2  A5:2 B5:2 A5:2 F#5:2 D5:4 F#5:4  G5:4 A5:4 B5:4 G5:4  A5:8 D6:8`},
      C:{chords:['Em','C','G','D','Em','C','Am','D'],lw:'triangle',lv:.34,arp:'1...5...3...5...',kick:'x...............',snare:'................',hat:'....x.......x...',bass:'R.......O.......',
        lead:`B4:8 E5:4 G5:4  G5:6 E5:2 C5:8  D5:4 G5:4 B5:6 A5:2  A5:12 F#5:4  G5:4 F#5:4 E5:4 B4:4  C5:4 E5:4 G5:8  A5:6 G5:2 E5:4 C5:4  D5:16`},
      D:{chords:['C','D','Em','Em','Am','D','G','G'],lw:12,
        lead:`G5:2 E5:2 G5:2 C6:2 E6:4 D6:4  C6:2 A5:2 F#5:2 A5:2 D6:8  B5:2 G5:2 E5:2 G5:2 B5:4 E6:4  D6:4 B5:4 G5:8
              C6:2 B5:2 A5:2 E5:2 A5:4 C6:4  B5:2 A5:2 F#5:2 D5:2 F#5:4 A5:4  G5:4 B5:4 D6:4 B5:4  D6:4 C6:2 B5:2 A5:4 F#5:4`},
    }}),
  desert:compileSong({bpm:126,vol:1,order:['intro','A','B','C','A2','D','B'],variant:{lw:'square',lv:.17,arp:'1.5.3.5.1.5.3.5.'},
    bass:'R..RF.R.R..RF.O.', arp:'1..5..3.1..5..3.', kick:'x.....x.x.......', snare:'....x.......x..x', hat:'..x.x...x.x...x.',
    sections:{
      intro:{chords:['Dm','Dm','A','Dm'],lead:'r:64',snare:'................',hat:'..x.....x.x.....'},
      A:{chords:['Dm','Dm','C','Dm','Bb','A','Dm','A'],
        lead:`D5:2 E5:2 F5:4 E5:2 D5:2 C#5:2 D5:2  A5:4 G5:2 F5:2 E5:4 D5:4  E5:2 G5:2 C6:4 Bb5:2 A5:2 G5:4  F5:2 E5:2 D5:4 A4:4 D5:4
              D6:4 C6:2 Bb5:2 A5:4 G5:4  A5:2 Bb5:2 A5:2 G5:2 F5:2 E5:2 C#5:4  D5:2 F5:2 A5:2 D6:6 C#6:2 D6:2  E6:4 C#6:4 A5:8`},
      B:{chords:['Gm','A','Dm','Dm','Gm','C','F','A'],
        lead:`G5:4 Bb5:4 D6:4 Bb5:4  C#6:4 E6:4 C#6:4 A5:4  F5:2 A5:2 D6:4 F6:4 D6:4  E6:2 D6:2 C#6:2 D6:2 A5:8
              Bb5:2 A5:2 G5:4 D5:4 G5:4  E5:2 F5:2 G5:4 C6:4 E5:4  F5:4 A5:4 C6:4 A5:4  C#6:6 E6:2 A5:8`},
      C:{chords:['Dm','Bb','C','A','Dm','Gm','A','A'],lw:'triangle',lv:.34,arp:'1.......5.......',kick:'x.......x.......',snare:'................',hat:'....x.......x...',bass:'R.......F.......',
        lead:`A4:8 D5:4 F5:4  F5:6 D5:2 Bb4:8  C5:4 E5:4 G5:6 F5:2  E5:12 C#5:4  D5:4 F5:4 A5:4 G5:4  Bb5:6 A5:2 G5:8  A5:4 G5:2 F5:2 E5:4 C#5:4  E5:16`},
      D:{chords:['Bb','C','Dm','Dm','Gm','A','Dm','A'],lw:12,
        lead:`F5:2 Bb5:2 D6:4 C6:2 Bb5:2 A5:4  G5:2 C6:2 E6:4 D6:2 C6:2 Bb5:4  A5:2 D6:2 F6:4 E6:2 D6:2 C#6:4  D6:8 A5:8
              G5:2 Bb5:2 D6:2 G6:2 F6:4 D6:4  E6:2 C#6:2 A5:2 G5:2 F5:2 E5:2 C#5:4  D5:2 E5:2 F5:2 G5:2 A5:4 D6:4  C#6:4 E6:4 A5:8`},
    }}),
  // crocodile: menacing A-phrygian riffs, chugging bass, driving drums
  croc:compileSong({bpm:176,vol:1.25,order:['intro','A','B','C','A2','B'],variant:{lw:12,lv:.2,hat:'xxxxxxxxxxxxxxxx'},
    bass:'RR.RRR.ORR.RRFRO', arp:'................', kick:'x.x...x.x.x...x.', snare:'....x.......x...', hat:'x.xxx.xxx.xxx.xx', lw:25, lv:.24, bv:.5,
    sections:{
      intro:{chords:['Am','Am','F','E'],lw:'square',lv:.16,snare:'....x.......x.xx',
        lead:`A4:1 r:1 A4:1 r:1 C5:2 A4:2 E5:2 Eb5:2 D5:2 C5:2  A4:1 r:1 A4:1 r:1 C5:2 A4:2 E5:2 Eb5:2 D5:2 C5:2
              F4:1 r:1 F4:1 r:1 A4:2 F4:2 C5:2 B4:2 Bb4:2 A4:2  E4:2 G#4:2 B4:2 E5:2 F5:2 E5:2 D5:2 B4:2`},
      A:{chords:['Am','Am','F','E','Am','Am','Bb','E'],
        lead:`E5:2 A5:2 r:1 A5:1 G5:2 A5:2 C6:2 B5:2 A5:2  E5:2 A5:2 r:1 A5:1 G5:2 E5:4 D5:2 C5:2  F5:2 A5:2 C6:4 B5:2 A5:2 G5:2 A5:2  G#5:4 B5:4 E6:4 D6:2 B5:2
              A5:2 C6:2 E6:2 C6:2 A5:2 E5:2 A5:4  G5:2 A5:2 B5:2 C6:2 D6:2 C6:2 B5:2 G5:2  F5:2 Bb5:2 D6:4 C6:2 Bb5:2 A5:2 F5:2  E5:1 E5:1 G#5:2 B5:2 E6:6 r:4`},
      B:{chords:['Dm','Am','Bb','E','Dm','F','E','E'],hat:'xxxxxxxxxxxxxxxx',
        lead:`D6:4 A5:2 F5:2 D5:4 F5:4  E5:2 A5:2 C6:4 E6:4 C6:4  D6:2 C6:2 Bb5:2 F5:2 Bb5:4 D6:4  E6:2 D6:2 B5:2 G#5:2 E5:4 G#5:4
              F5:2 E5:2 D5:2 F5:2 A5:2 D6:2 F6:4  E6:2 D6:2 C6:2 A5:2 F5:4 A5:4  B5:2 C6:2 D6:2 E6:2 F6:4 E6:4  G#6:4 E6:4 B5:4 G#5:4`},
      C:{chords:['Am','F','Bb','E'],kick:'x.......x.x.....',snare:'........x.......',hat:'x.x.x.x.x.x.x.x.',bass:'R.......R.R.....',
        lead:`A5:2 r:6 E5:2 r:6  F5:2 r:6 C5:2 r:6  Bb5:2 r:6 F5:2 r:6  E5:1 G#5:1 B5:1 E6:1 G#6:4 r:8`},
    }}),
  // dragon: fantasy rock in D minor: distorted power-chord chugs, heroic lead, crashes on every section
  dragon:compileSong({bpm:150,fast:1,vol:1.1,crash:1,order:['intro','A','B','I','C','A','B'],
    bass:'R.R.R.R.R.R.O.R.', arp:'................', arp2:'1358135813581358', gtr:'x.x.x.xxx.x.x.xx',
    kick:'x...x.x.x...x.x.', kick2:'x.xxx.xxx.xxx.xx', snare:'....x.......x...', hat:'x.x.x.x.x.x.x.x.', hat2:'xxxxxxxxxxxxxxxx', lw:25, lv:.22,
    sections:{
      intro:{chords:['Dm','Bb','C','A'],lead:'r:64',gtr:'X.......X...x.x.',kick:'x.......x.......',snare:'............x...',hat:'................'},
      A:{chords:['Dm','Dm','Bb','C','Dm','Dm','Gm','A'],
        lead:`D5:4 F5:2 A5:2 D6:6 C6:2  A5:4 F5:2 E5:2 D5:4 A4:4  Bb4:2 D5:2 F5:2 Bb5:4 A5:2 G5:2 F5:2  E5:4 G5:4 C6:4 E5:4
              F5:2 G5:2 A5:4 D6:4 E6:4  F6:4 E6:2 D6:2 A5:8  Bb5:4 A5:2 G5:2 D5:4 G5:4  A5:4 C#6:4 E6:4 C#6:4`},
      B:{chords:['Bb','F','C','Dm','Bb','F','A','A'],gtr:'X.......X.......',lv:.25,
        lead:`D6:6 C6:2 Bb5:4 F5:4  C6:6 A5:2 F5:8  E5:2 G5:2 C6:4 E6:4 D6:4  D6:8 A5:8
              F6:6 E6:2 D6:4 Bb5:4  C6:4 F6:4 A6:8  G6:4 F6:2 E6:2 C#6:4 E6:4  E6:8 A5:8`},
      I:{chords:['Gm','Dm','Bb','A'],lw:'triangle',lv:.32,gtr:'X...............',kick:'x.......x.......',snare:'........x.......',hat:'....x.......x...',bass:'R.......R.......',
        lead:'G5:16 F5:16 D5:16 E5:8 C#5:8'},
      C:{chords:['Dm','C','Bb','A','Dm','C','Bb','A'],gtr:'x.x.x.x.x.x.x.x.',lw:12,lv:.2,
        lead:`D5:1 F5:1 A5:1 D6:1 F6:1 D6:1 A5:1 F5:1 D5:1 F5:1 A5:1 D6:1 F6:2 E6:2  C5:1 E5:1 G5:1 C6:1 E6:1 C6:1 G5:1 E5:1 C5:1 E5:1 G5:1 C6:1 E6:2 D6:2
              Bb4:1 D5:1 F5:1 Bb5:1 D6:1 Bb5:1 F5:1 D5:1 Bb4:1 D5:1 F5:1 Bb5:1 D6:2 C6:2  A4:1 C#5:1 E5:1 A5:1 C#6:1 A5:1 E5:1 C#5:1 A5:1 C#6:1 E6:1 A6:1 G6:2 E6:2
              F6:2 E6:2 D6:2 A5:2 F6:2 E6:2 D6:4  E6:2 D6:2 C6:2 G5:2 E6:2 D6:2 C6:4  D6:2 C6:2 Bb5:2 F5:2 D6:2 C6:2 Bb5:4  C#6:2 E6:2 A6:4 G6:2 E6:2 C#6:4`},
    }}),
  // swamp: slow, murky E minor with a creeping bass
  swamp:compileSong({bpm:112,vol:1,order:['intro','A','B','A2','B'],variant:{lw:'triangle',lv:.3,arp:'1...5...8...5...'},
    bass:'R...O...R...R.O.', arp:'1.5.8.5.3.5.8.5.', kick:'x.......x..x....', snare:'....x.......x...', hat:'..x...x...x...x.',
    sections:{
      intro:{chords:['Em','C','Em','B'],lead:'r:64',kick:'x...............',snare:'................',hat:'........x.......',bass:'R.......R.......'},
      A:{chords:['Em','Em','C','D','Em','Em','Am','B'],
        lead:`E5:4 G5:2 B5:2 A5:4 G5:4  F#5:2 G5:2 E5:4 B4:8  C5:2 E5:2 G5:4 C6:4 B5:4  A5:4 F#5:2 D5:2 E5:4 F#5:4
              G5:4 B5:2 E6:2 D6:4 B5:4  A5:2 B5:2 G5:4 E5:8  C6:4 B5:2 A5:2 E5:4 A5:4  B5:6 A5:2 F#5:4 D#5:4`},
      B:{chords:['C','G','D','Em','C','G','B','B'],
        lead:`E5:4 C5:4 G5:8  D5:2 G5:2 B5:4 D6:4 B5:4  A5:6 F#5:2 D5:8  E5:2 F#5:2 G5:4 B5:8
              C6:4 B5:4 G5:4 E5:4  D6:4 B5:2 G5:2 D5:8  D#5:4 F#5:4 B5:4 A5:4  B5:16`},
    }}),
  // hydra: heavy C minor stomp with guitar stabs
  hydra:compileSong({bpm:168,vol:1.2,order:['intro','A','B','A2','B'],variant:{lw:12,lv:.2,hat:'xxxxxxxxxxxxxxxx'},
    bass:'RR.RR.RORR.RR.RO', arp:'................', kick:'x..x..x.x..x..x.', snare:'....x.......x...', hat:'x.x.x.x.x.x.x.x.', lw:25, lv:.24, bv:.5,
    sections:{
      intro:{chords:['Cm','Cm','Ab','G'],lead:'r:64',kick:'x...x...x...x...',snare:'................',gtr:'X...............'},
      A:{chords:['Cm','Cm','Ab','Bb','Cm','Cm','Ab','G'],
        lead:`C5:2 Eb5:2 G5:2 C6:4 Bb5:2 G5:4  Ab5:2 G5:2 Eb5:2 D5:2 C5:8  Eb5:2 Ab5:2 C6:4 Bb5:2 Ab5:2 G5:4  F5:2 Bb5:2 D6:4 C6:4 Bb5:4
              G5:4 C6:2 Eb6:2 D6:4 C6:4  Bb5:2 C6:2 G5:4 Eb5:8  Ab5:4 C6:4 Eb6:4 D6:4  D6:6 B5:2 G5:8`},
      B:{chords:['Ab','Bb','Cm','Cm','Ab','Bb','G','G'],gtr:'X.......X.......',
        lead:`C6:4 Eb6:4 Ab5:8  D6:4 F6:4 Bb5:8  Eb6:2 D6:2 C6:2 G5:2 Eb5:4 G5:4  C6:16
              Ab5:2 C6:2 Eb6:4 Ab6:4 G6:4  F6:4 D6:2 Bb5:2 F5:4 D6:4  B5:4 D6:4 G6:4 F6:4  D6:8 G5:8`},
    }}),
  victory:compileSong({bpm:150,after:'level',vol:1.2,order:['A'],
    bass:'R.....R.........', arp:'................', kick:'x.....x.........', snare:'................', hat:'................',
    sections:{A:{chords:['C','C'],lead:'C5:1 E5:1 G5:1 C6:3 r:2 G5:2 C6:6  r:16'}}}),
};
const MVOL=.055;
const MUSIC={cur:null,song:null,step:0,next:0,gain:null,on:true};
try{MUSIC.on=localStorage.getItem('grib-music')!=='off'}catch(e){}
let WAVE25=null,WAVE12=null,NOISE=null;
function pulseWave(d){const n=32,re=new Float32Array(n),im=new Float32Array(n);for(let k=1;k<n;k++){re[k]=Math.sin(2*Math.PI*k*d)/(Math.PI*k);im[k]=(1-Math.cos(2*Math.PI*k*d))/(Math.PI*k)}return AC.createPeriodicWave(re,im)}
function musicInit(){
  if(!AC||MUSIC.gain) return;
  MUSIC.gain=AC.createGain();MUSIC.gain.gain.value=0;
  const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=3200;lp.Q.value=.3; // softer, less piercing
  MUSIC.gain.connect(lp).connect(AC.destination);
  WAVE25=pulseWave(.25);WAVE12=pulseWave(.125);
  NOISE=AC.createBuffer(1,AC.sampleRate,AC.sampleRate);const d=NOISE.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  setInterval(musicTick,25);
  if(MUSIC.cur){const c=MUSIC.cur;MUSIC.cur=null;playSong(c)}
}
function playSong(name){
  if(name==='level') name=LV().song;
  if(MUSIC.cur===name) return;
  MUSIC.cur=name;MUSIC.song=SONGS[name];MUSIC.step=0;MUSIC.next=AC?AC.currentTime+.06:0;
}
function toggleMusic(){
  MUSIC.on=!MUSIC.on;try{localStorage.setItem('grib-music',MUSIC.on?'on':'off')}catch(e){}
  const b=document.getElementById('music');if(b){b.textContent=musicLabel();b.setAttribute('aria-pressed',MUSIC.on)}
}
function mTone(wave,freq,t,dur,vol,vib){
  const o=AC.createOscillator(),g=AC.createGain();
  if(wave===25)o.setPeriodicWave(WAVE25);else if(wave===12)o.setPeriodicWave(WAVE12);else o.type=wave;
  o.frequency.value=freq;
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.006);g.gain.setTargetAtTime(vol*.65,t+.03,.08);g.gain.setTargetAtTime(0,t+dur,.025);
  o.connect(g).connect(MUSIC.gain);o.start(t);o.stop(t+dur+.2);
  if(vib){const l=AC.createOscillator(),lg=AC.createGain();l.frequency.value=5.5;lg.gain.value=14;l.connect(lg).connect(o.detune);l.start(t+.14);l.stop(t+dur+.2)}
}
function mNoise(t,dur,vol,hp){
  const s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();
  s.buffer=NOISE;f.type='highpass';f.frequency.value=hp;
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);
  s.connect(f).connect(g).connect(MUSIC.gain);s.start(t,Math.random()*.5);s.stop(t+dur+.02);
}
function mKick(t){const o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.setValueAtTime(160,t);o.frequency.exponentialRampToValueAtTime(42,t+.12);
  g.gain.setValueAtTime(.75,t);g.gain.exponentialRampToValueAtTime(.001,t+.16);o.connect(g).connect(MUSIC.gain);o.start(t);o.stop(t+.18)}
let DIST=null;
function mGuitar(m,t,dur,vol){
  if(!DIST){DIST=new Float32Array(1024);for(let i=0;i<1024;i++){const x=i/1023*2-1;DIST[i]=Math.tanh(x*5)}}
  const sh=AC.createWaveShaper(),f=AC.createBiquadFilter(),g=AC.createGain();
  sh.curve=DIST;f.type='lowpass';f.frequency.value=1500;
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.004);g.gain.setTargetAtTime(vol*.7,t+.03,.12);g.gain.setTargetAtTime(0,t+dur,.03);
  sh.connect(f).connect(g).connect(MUSIC.gain);
  for(const [iv,det] of [[0,-7],[7,6],[12,0]]){const o=AC.createOscillator(),og=AC.createGain();o.type='sawtooth';o.frequency.value=mfreq(m+iv);o.detune.value=det;og.gain.value=.35;o.connect(og).connect(sh);o.start(t);o.stop(t+dur+.25)}
}
function scheduleStep(s,i,t,sd){
  const st=s.steps[i], ch=st.ch, bi=st.bi, p2=s.fast&&B&&B.kind==='dragon'&&B.phase===2&&MUSIC.cur==='dragon';
  for(const n of st.notes) mTone(st.lw,mfreq(n.m),t,n.d*sd*.9,st.lv,n.d>=4);
  if(st.b!=='.'){const m=st.b==='R'?ch[0]:st.b==='O'?ch[0]+12:ch[2];mTone('triangle',mfreq(m),t,sd*1.6,st.bv)}
  const a=p2&&s.arp2?pat(s.arp2,bi):st.a;
  if(a!=='.'){const m={1:ch[0],3:ch[1],5:ch[2],8:ch[0]+12}[a]+24;mTone(12,mfreq(m),t,sd*.8,p2?.08:st.av)}
  if((p2&&s.kick2?pat(s.kick2,bi):st.k)==='x') mKick(t);
  if(st.s==='x'){mNoise(t,.12,.26,1300);mTone('triangle',190,t,.05,.16)}
  if(st.g==='x') mGuitar(ch[0]+12,t,sd*.8,.13); else if(st.g==='X') mGuitar(ch[0]+12,t,sd*7.5,.12);
  if(st.cr) mNoise(t,.9,.13,4500);
  if((p2&&s.hat2?pat(s.hat2,bi):st.h)==='x') mNoise(t,.03,.06,7000);
}
function musicTick(){
  if(!AC||!MUSIC.gain) return;
  const playing=state==='play'||state==='shop'||state==='title';
  const target=MUSIC.on&&playing?(state==='shop'?MVOL*.5:state==='title'?MVOL*.6:MVOL)*(MUSIC.song&&MUSIC.song.vol||1)*VOL.music*1.43:0;
  MUSIC.gain.gain.setTargetAtTime(target,AC.currentTime,.08);
  if(!MUSIC.song||!playing||!MUSIC.on){MUSIC.next=AC.currentTime+.06;return}
  let s=MUSIC.song;
  while(MUSIC.next<AC.currentTime+.12){
    const tempo=s.bpm*(s.fast&&B&&B.kind==='dragon'&&B.phase===2?1.12:1), sd=60/tempo/4;
    scheduleStep(s,MUSIC.step,MUSIC.next,sd);
    MUSIC.next+=sd;MUSIC.step++;
    if(MUSIC.step>=s.len){MUSIC.step=0;if(s.after){const nx=MUSIC.next;MUSIC.cur=null;playSong(s.after);MUSIC.next=nx;s=MUSIC.song}}
  }
}
