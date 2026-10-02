/* ---------- seeded RNG for level generation ---------- */
function makeRng(seed){let s=(seed>>>0)||123456789;return()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296}}
let RNG=Math.random;
const ri=(a,b)=>a+Math.floor(RNG()*(b-a+1));
const pick=arr=>arr[Math.floor(RNG()*arr.length)];
const chance=p=>RNG()<p;
function wpick(list){let s=0;for(const o of list)s+=o[1];let r=RNG()*s;for(const o of list){r-=o[1];if(r<=0)return o[0]}return list[list.length-1][0]}

