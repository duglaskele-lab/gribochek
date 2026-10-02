/* ---------- segment difficulty table ---------- */
// difficulty of each segment at tier 0 (intro), 1 (normal), 2 (hard); 0..1 scale
const SEG_DIFF={
  flat:[.1,.28,.48], hills:[.14,.3,.46], gap:[.2,.4,.6], dashgap:[.42,.58,.74], thorns:[.25,.45,.64], dashThorns:[.46,.62,.8],
  movers:[.3,.5,.72], moverRiver:[.34,.54,.74], plateau:[.3,.5,.7], pond:[.12,.26,.42], river:[.2,.4,.6], riverArcher:[.4,.6,.8],
  caterpillar:[.36,.56,.76], orcs:[.36,.56,.78], climb:[.24,.44,.64], pillars:[.3,.5,.74],
  cactusField:[.36,.56,.76], worms:[.36,.56,.76], quicksand:[.3,.5,.72],
  ruinHouse:[.18,.38,.58], ruinWalls:[.26,.46,.66], ruinArcade:[.22,.42,.62],
  slab:[.2,.4,.6], crumbleBridge:[.26,.46,.66], lift:[.22,.4,.6], camp:[.26,.46,.68], oasis:[.12,.26,.42], springs:[.12,.3,.5],
};
const SEG_WEIGHT={
  forest:{flat:2,hills:2.5,gap:3,dashgap:1.2,thorns:1.8,dashThorns:1,movers:1.3,moverRiver:1,plateau:1.6,pond:1,river:1.4,riverArcher:1.1,caterpillar:1.5,orcs:1.4,climb:1.3,pillars:1.2,slab:1.3,crumbleBridge:1.3,lift:1,camp:1.3,springs:1},
  desert:{flat:2,hills:2.5,gap:3,dashgap:1.2,thorns:1.6,dashThorns:1,movers:1.3,moverRiver:.6,plateau:1.4,pond:.6,riverArcher:.8,cactusField:1.5,worms:1.5,climb:1.3,pillars:1.3,quicksand:2.2,slab:1.2,crumbleBridge:.7,lift:1,camp:1.2,oasis:1.1,springs:.7,ruinHouse:1.6,ruinWalls:1.6,ruinArcade:1.4},
};
// at most two secrets per level; the newer hiding places come up a bit more often
const SECRET_KINDS={
  forest:[['breakable',1],['fake',1],['crack',1],['bounce',.8],['nook',.7],['falsefloor',1],['invisible',.8],['spring',.8],['underpass',1.6],['leap',1.6],['waterfall',1.6]],
  desert:[['breakable',1],['fake',1],['crack',1],['bounce',.8],['nook',.4],['falsefloor',1],['invisible',.8],['spring',.8],['mirage',1.6],['well',1.6],['switch',1.6]],
};
const RUIN_T=['ruinHouse','ruinWalls','ruinArcade'];
let PLAN=[], GEN_INFO={}, secretZones=[], secretsFound=0;

