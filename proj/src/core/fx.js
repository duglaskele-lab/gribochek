/* ---------- fx ---------- */
function shake(t,m){shakeT=Math.max(shakeT,t);shakeM=Math.max(shakeT>0?shakeM:0,m)}
function burst(x,y,n,col,sp=220,g=900,size=[3,6],life=[.3,.6]){
  for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=Math.random()*sp;
    parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-sp*.3,g,c:col,s:rand(size[0],size[1]),life:rand(life[0],life[1]),max:0,t:'dot'})}
}
function dust(x,y,n=6,dir=0){const c=LV().dust||(BIOME==='desert'?'rgba(250,228,180,.9)':BIOME==='swamp'?'rgba(170,165,120,.85)':'rgba(240,228,200,.9)');for(let i=0;i<n;i++)parts.push({x:x+rand(-10,10),y,vx:rand(-60,60)+dir*80,vy:rand(-80,-20),g:-40,c,s:rand(4,8),life:rand(.25,.45),max:0,t:'puff'})}
function stars(x,y,n){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=rand(80,260);parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,g:300,c:'#ffd84a',s:rand(5,9),life:rand(.4,.8),max:0,t:'star',rot:Math.random()*6})}}
function splash(x,y){for(let i=0;i<10;i++)parts.push({x:x+rand(-12,12),y:Math.floor(y/TS)*TS+2,vx:rand(-90,90),vy:rand(-320,-120),g:1200,c:'rgba(190,230,255,.95)',s:rand(3,6),life:rand(.3,.55),max:0,t:'dot'})}
function embers(x,y,n=4){for(let i=0;i<n;i++)parts.push({x:x+rand(-8,8),y:y+rand(-8,8),vx:rand(-40,40),vy:rand(-120,-40),g:-60,c:Math.random()<.5?'#ffb13b':'#ff5a2a',s:rand(3,6),life:rand(.3,.6),max:0,t:'dot'})}
function floater(x,y,txt){floaters.push({x,y,txt,t:0})}
