/* ---------- heroes: who the player plays ---------- */
// grib: the mushroom girl. raith: Raithwyn, a tall wolf girl (1.4 times the mushroom girl's height): a heavier
// punch without a shockwave, a heavier stomp, no thrown mushrooms - L is a strong punch (10 mana) that sends out a big
// shockwave over a medium distance - and no slowdown after a long fall. In the shop she can only buy hearts.
// The choice is made on the level-select screen and remembered; it applies from the next start of a level.
const HEROES={
  grib:{w:30,h:58,punch:DMG_PUNCH,stomp:DMG_STOMP,reach:52,wave:true,heavyLand:true,umbrella:true,shop:null},
  raith:{w:32,h:76,punch:1.5,stomp:2,reach:66,wave:false,heavyLand:false,umbrella:false,shop:['heal','maxhp'],
    strong:{cost:10,dmg:5,life:.42,t:.42}},
};
let hero='grib';
try{const v=localStorage.getItem('grib-hero');if(v&&HEROES[v])hero=v}catch(e){}
const HERO=()=>HEROES[hero];
function setHero(k){if(!HEROES[k])return;hero=k;try{localStorage.setItem('grib-hero',k)}catch(e){}}
