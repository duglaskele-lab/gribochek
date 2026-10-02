/* ---------- heroes: who the player plays ---------- */
// grib: the mushroom girl. raith: Raithwyn, a tall wolf girl (1.4 times the mushroom girl's height): a heavier
// punch with a shorter but taller shockwave, a longer dash, a heavier stomp, no thrown mushrooms - L is a strong punch (10 mana) that sends out a big
// shockwave over a medium distance - and no slowdown after a long fall. In the shop: hearts and more mana.
// The choice is made on the level-select screen and remembered; it applies from the next start of a level.
const HEROES={
  // wave: the punch's shockwave, len/tall scale its reach and height; dash: scales the dash length
  grib:{w:30,h:58,punch:DMG_PUNCH,stomp:DMG_STOMP,reach:52,wave:{len:1,tall:1},dash:1,heavyLand:true,umbrella:true,shop:null},
  raith:{w:32,h:76,punch:1.5,stomp:2,reach:66,wave:{len:.7,tall:1.3},dash:1.15,heavyLand:false,umbrella:false,shop:['heal','maxhp','manaUp'],
    strong:{cost:15,dmg:5,life:.42,t:.42}},
};
let hero='grib';
try{const v=localStorage.getItem('grib-hero');if(v&&HEROES[v])hero=v}catch(e){}
const HERO=()=>HEROES[hero];
function setHero(k){if(!HEROES[k])return;hero=k;try{localStorage.setItem('grib-hero',k)}catch(e){}}
