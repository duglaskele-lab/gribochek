/* ---------- world state ---------- */
let COLS=240, ARENA_L=0, ARENA_R=0, BIOME='forest', LEVEL=1, SEED=1;
let grid, flow;
let P,B,enemies,shots,eshots,parts,items,plats,dynPlats,checks,shops,door,camX,time,shakeT,shakeM,hitstop,
    arenaLocked,bossDead,cp,sporeTotal,spores,sporesGot,runTime,floaters,ghosts,powerSpots,pwaves,
    nearShop=null,shopMsg='',hasBag=false,hasCloak=false,hasUmbrella=false,carry=null,skyHeat=0,camY=0,trees=[],decor=[],springs=[],hiddenPlanks=false,covers=[],switches=[],ruins=[],ruinSpan=null,poisonLvl=0,camZ=1,VHZ=VH;

let SKY_TILE=T_EMPTY;   // what lies above the top row: open sky, or rock for levels with a roof (level def: roof:true)
const tile=(c,r)=>c<0||c>=COLS?T_SOLID:(r<0?SKY_TILE:r>=ROWS?T_EMPTY:grid[r][c]);
const isSolidT=t=>t===T_SOLID||t===T_CRACK||t===T_CRACKW;
const isFloorT=t=>t===T_SOLID||t===T_PLANK||t===T_CRACK||t===T_CRACKW;
const solid=(c,r)=>isSolidT(tile(c,r));
function topY(c){for(let r=0;r<ROWS;r++){const t=tile(c,r);if(isFloorT(t))return r*TS;if(t===T_WATER||t===T_SAND)return -1}return WH+400}
const WET_PLANK=7;   // flow marker: a plank that sits under water (the hydra pool after the fight)
const isWet=(c,r)=>{const t=tile(c,r);return t===T_WATER||(t===T_PLANK&&flow[r][c]===WET_PLANK)};
function waterAt(x,y){const c=Math.floor(x/TS),r=Math.floor(y/TS),t=tile(c,r);return t===T_WATER?(flow[r][c]||0)+10:t===T_PLANK&&flow[r][c]===WET_PLANK?10:0}
// if the body's feet are in quicksand, returns the y of the sand surface above them, else null
function sandSurf(b){const c=Math.floor((b.x+b.w/2)/TS);let r=Math.floor((b.y+b.h-2)/TS);if(tile(c,r)!==T_SAND)return null;while(r>0&&tile(c,r-1)===T_SAND)r--;return r*TS}

