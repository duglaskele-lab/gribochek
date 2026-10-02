/* ---------- debug / test hooks (window.__grib) ---------- */
// Used by the tests in tests/. dbg.freeze() + dbg.sim(seconds) run the game logic as fast as possible with a
// fixed 1/120 s step, so a minute of boss fight is checked in a fraction of a second.
let DBG_FREEZE=false;
window.__grib={plan:()=>PLAN,info:()=>GEN_INFO,secrets:()=>secretZones.length,
  dbg:{start:(l,s)=>{startAtLevel(1);startLevel(l,s||1);snapshotLevel()},get P(){return P},get B(){return B},get enemies(){return enemies},get plats(){return plats},get springs(){return springs},
    get arena(){return[ARENA_L,ARENA_R]},get grid(){return grid},get cam(){return[camX,camY]},get checks(){return checks},get items(){return items},get shops(){return shops},get zones(){return secretZones},get covers(){return covers},get switches(){return switches},buy:id=>buy(id),openShop:()=>openShop(),setSpores:n=>{spores=n},validate:()=>(LV().validate||validateLevel)(),bossPrep:()=>bossPrep(),get flow(){return flow},setPoison:v=>{poisonLvl=v},
    hit:(i,d)=>{B.lastHead=B.heads[i];hitBoss(d,B.heads[i].x,B.heads[i].y)},get state(){return state},get eshots(){return eshots},get poison(){return poisonLvl},get dead(){return bossDead},
    lock:()=>{if(!arenaLocked)startBossFight()},
    // ---- for tests: run the game without waiting for real time ----
    freeze:on=>{DBG_FREEZE=on!==false},            // stop the real-time loop from stepping (rendering goes on)
    sim:(sec,each)=>{const n=Math.round(sec*120);for(let i=0;i<n;i++){if(each&&each(i)===false)break;if(state==='play')step(1/120)}},
    render:()=>render(),
    look:()=>{camX=clamp(P.x+P.w/2-VW/2,0,Math.max(0,COLS*TS-VW));camY=camTargetY()},   // put the camera on the player now
    key:(name,down)=>{inp[name]=down?1:0},          // hold / release a game input: l r j s d ...
    startBoss:l=>startBoss(l),
    spawn:(type,x,y)=>{const e=makeEnemy(type,Math.floor(x/TS),{y});if(e)enemies.push(e);return e},
    hitBoss:(d,x,y)=>hitBoss(d,x,y),
    attack:(e,dmg,srcX)=>attackEnemy(e,dmg,srcX,e.x+e.w/2,e.y+e.h/2,null),   // a punch / mushroom hit coming from srcX
    get levels(){return LEVELS},get bosses(){return BOSSES},get level(){return LEVEL},get parts(){return parts},
    get arenaLocked(){return arenaLocked},get spores(){return spores},get ruins(){return ruins},get door(){return door},
    croc:()=>crocChoose(),dragon:()=>dragonChoose(),get vw(){return VW},punch:()=>punch(),throwShroom:()=>throwShroom(),maxMana:()=>maxMana(),get shotLvl(){return shotLvl},get shots(){return shots},bossSeen:m=>bossSeen(m)}};   // the crocodile picks its next move now
