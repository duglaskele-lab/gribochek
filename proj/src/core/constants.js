const cv=document.getElementById('c'), ctx=cv.getContext('2d');
const sheet=new Image(); sheet.src=ATLAS_SRC;
const INK='#2b1a12';
const FONT='"Comic Sans MS","Chalkboard SE","Segoe Print","Marker Felt",cursive,sans-serif';
const TS=40, VH=14*TS, MAXC=560;
// ROWS/WH: world height in tiles/px (level 3 is two screens tall); FLOOR: boss-arena floor
let ROWS=14, WH=VH, FLOOR=12*TS, ARENA_TRIG_Y=9*TS, CAM_BOT=0;   // CAM_BOT: lowest point the camera shows outside the boss arena
const G=2000, JV=Math.round(740*Math.sqrt(1.25)), MAXV=275, SC=0.8, DASH_V=780, DASH_T=.17;
// STOMP_BOUNCE: the plain bounce off a foe's head, 30% higher than it was (480 px/s before)
const HEAVY_H=250, HEAVY_T=.35, HIGH_BOUNCE=1000, STOMP_BOUNCE=Math.round(480*Math.sqrt(1.3)), PUNCH_T=.24, PUNCH_ACTIVE=[.18,.07];
const WAVE_LIFE=.15, WAVE_SPEED=540, MAXHP_CAP=7, HP_BASE=3, GLIDE_V=71;
const DMG_PUNCH=1, DMG_STOMP=1, DMG_SHROOM=0.8, TRIPLE_PENALTY=.85, TAIL_MULT=1.25, EPS=1e-6;
const FLOW_V=150, WATER_G=.3;
// mana: thrown mushrooms (key L) cost mana; punching or stomping a foe gives it back
const MANA_BASE=50, MANA_UP=25, MANA_UPS=4, MANA_HIT=5, MANA_PICK=100, SHOT_COST=[0,5,8,10];   // SHOT_COST[number of mushrooms per throw]
const FPS_CAP=60;
// tile types
const T_EMPTY=0, T_SOLID=1, T_PLANK=2, T_THORN=3, T_CRACK=4, T_WATER=5, T_SAND=6, T_FAKE=7, T_CRACKW=8;
// quicksand: sinking speed, hop strength, move speed factor
const SAND_SINK=34, SAND_JV=560, SAND_SLOW=.42;

let K=1, VW=960, OFFY=0;
function resize(){
  const dpr=Math.min(window.devicePixelRatio||1,2);
  const r=cv.getBoundingClientRect();
  cv.width=Math.max(1,r.width*dpr|0); cv.height=Math.max(1,r.height*dpr|0);
  K=Math.min(cv.height/VH, cv.width/640);
  VW=cv.width/K; OFFY=(cv.height/K-VH)/2;
}
addEventListener('resize',resize); resize();

const rand=(a,b)=>a+Math.random()*(b-a);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const approach=(v,t,d)=>v<t?Math.min(v+d,t):Math.max(v-d,t);
const hash=(x,y)=>{let h=x*374761393+y*668265263;h=(h^(h>>13))*1274126177;return ((h^(h>>16))>>>0)/4294967295};
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
function circleBox(x,y,r,b){const cx=clamp(x,b.x,b.x+b.w),cy=clamp(y,b.y,b.y+b.h);return (x-cx)**2+(y-cy)**2<r*r}

