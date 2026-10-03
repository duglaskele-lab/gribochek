/* ---------- heroes: who the player plays ---------- */
// grib: the mushroom girl. raith: Raithwyn, a tall wolf girl (1.4 times the mushroom girl's height): a heavier
// punch with a shorter but taller shockwave, a longer dash, a heavier stomp, no thrown mushrooms and no slowdown after a long
// fall. Instead of mushrooms she casts spells: L - a hadoken (a ball of purple fire flying straight ahead), I - a small
// magic sphere that flies ahead along a wide sine wave. In the shop: hearts, the red mushroom (+100 mana) and more mana.
// The choice is made on the level-select screen and remembered; it applies from the next start of a level.
const HEROES={
  // wave: the punch's shockwave, len/tall scale its reach and height, col: its colours (main, inner rings; default yellow); dash: scales the dash length
  grib:{w:30,h:58,punch:DMG_PUNCH,stomp:DMG_STOMP,reach:52,wave:{len:1,tall:1},dash:1,heavyLand:true,umbrella:true,shop:null},
  raith:{w:32,h:76,punch:1.5,stomp:2,reach:66,wave:{len:.7,tall:1.3,col:['#b77ee0','#e6d4ff']},dash:1.15,heavyLand:false,umbrella:false,shop:['heal','maxhp','mush','manaUp'],
    // spells: cost (mana, paid when the spell leaves her hand), dmg, t: the whole cast, fire: when in it the shot flies out,
    // speed (px/s), life (s), r: hit radius; spot: where the ball is in her cast frames, in sheet pixels from the frame's
    // anchor (forward, up), so the shot starts right there; the sphere also sways up and down: amp (px), per: one full sway (s)
    hadoken:{cost:15,dmg:5,t:.54,fire:.36,speed:640,life:1.3,r:22,spot:[96,104]},
    sphere:{cost:5,dmg:5,t:.5,fire:.43,speed:360,life:2.4,r:12,amp:114,per:1.1,spot:[57,159]}},
};
let hero='grib';
try{const v=localStorage.getItem('grib-hero');if(v&&HEROES[v])hero=v}catch(e){}
const HERO=()=>HEROES[hero];
function setHero(k){if(!HEROES[k])return;hero=k;try{localStorage.setItem('grib-hero',k)}catch(e){}applyLang()}
