/* ---------- content registries ---------- */
// Levels, bosses, enemies, enemy projectiles, decorations and platform styles describe themselves in one
// object and register it here. The engine looks them up in these tables instead of asking "is this the ice level?",
// so a new level / foe / boss is a new file in src/levels/... plus a line in src/manifest.txt.
// (Levels 1-3 are older and still have some BIOME checks inside the engine; level 4 has none.)
const LEVELS={};       // number -> level definition, see ARCHITECTURE.md for the fields
const BOSSES={};       // kind   -> {make, update(dt), draw(), hitMult?(test), contact?(pb), burst, nameKey, introT?, camBottom?}
const SHOTS={};        // enemy projectile kind -> {update(b,dt,pb), draw(b), deflect?}  (deflect: a punch or shockwave knocks it away)
const DECOR={};        // decoration kind -> draw(d)
const PLAT_STYLES={};  // crumbling-platform style (pl.style) -> draw(pl,w), drawn around the platform's centre
const ENEMY_HOOKS={};  // enemy type -> {init?, contact?, blocks?(e,srcX), onHit?(e,srcX), onStomp?(e), onDeath?(e), heart?, deathColor?}
function registerLevel(n,def){
  LEVELS[n]=Object.assign({n},def);
  if(def.i18n) for(const l in def.i18n) if(I18N[l]) Object.assign(I18N[l],def.i18n[l]);
}
function registerBoss(kind,def){BOSSES[kind]=Object.assign({kind},def)}
function registerShot(kind,def){SHOTS[kind]=def}
function registerDecor(kind,draw){DECOR[kind]=draw}
function registerPlatStyle(kind,draw){PLAT_STYLES[kind]=draw}
// def: {size:{w,h,hp}, update(e,dt), draw(e), init?, contact?(e) -> {hurt:[boxes],stomp,dmg}, blocks?, onHit?, onStomp?, onDeath?, heart?, deathColor?}
function registerEnemy(type,def){EDEF[type]=def.size;EUPD[type]=def.update;EDRAW[type]=def.draw;ENEMY_HOOKS[type]=def}
const LV=()=>LEVELS[LEVEL]||{};
const levelNums=()=>Object.keys(LEVELS).map(Number).sort((a,b)=>a-b);
