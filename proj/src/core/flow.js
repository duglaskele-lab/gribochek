/* ---------- level flow ---------- */
function startLevel(level,seed){
  genLevel(level,seed);tidyItems();sporeTotal=items.filter(i=>i.k==='spore').length;
  shots=[];eshots=[];parts=[];floaters=[];ghosts=[];pwaves=[];spells=[];dynPlats=plats.slice();
  hitstop=0;shakeT=0;shakeM=0;arenaLocked=false;arenaIn=false;bossDead=false;skyHeat=0;secretsFound=0;
  const y=(LV().startY?LV().startY():topY(3))-HERO().h;
  P=newPlayer(3*TS,y);
  if(carry){P.maxhp=carry.maxhp;P.hp=carry.maxhp;P.mana=maxMana()}   // a new level starts with full health and mana // a new level starts at full health
  cp={x:P.x,y:P.y};camX=0;poisonLvl=0;camZ=1;camY=camTargetY();
  enemySnap=structuredClone(enemies.filter(e=>!e.prop));magnetT=0;
  playSong('level');
}
function newGame(){
  time=0;runTime=0;spores=0;sporesGot=0;manaUps=0;shotLvl=1;hasCloak=false;hasUmbrella=false;carry=null;
  startLevel(1,(Math.random()*1e9)|0);
}
function finishLevel(){
  if(LEVEL<levelNums().length){carry={hp:P.hp,maxhp:P.maxhp,mana:P.mana};state='next';showScreen('next')}
  else {state='win';showScreen('win')}
}
