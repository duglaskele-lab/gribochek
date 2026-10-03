"""Test cases. Each test is a function taking a Ctx; register it with @test('name', tags...).
Return a short string to print on success; raise (assert) to fail. Page errors fail the test automatically."""
import os
TESTS=[]
class T:
    def __init__(s,name,tags,fn): s.name,s.tags,s.fn=name,tags,fn
def test(name,*tags):
    def d(fn): TESTS.append(T(name,(name,)+tags,fn)); return fn
    return d

class Ctx:
    def __init__(s,browser,root,w=1280,h=720):
        s.root=root; s.errors=[]
        s.page=browser.new_page(viewport={'width':w,'height':h})
        s.page.on('pageerror',lambda e:s.errors.append(str(e)))
        s.page.goto('file://'+os.path.join(root,'dist/gribochek.html'))
        s.page.wait_for_timeout(300)
    def js(s,code,arg=None):
        """run JS; `g` is window.__grib.dbg"""
        return s.page.evaluate('(arg)=>{const g=window.__grib.dbg;'+code+'}',arg)
    def start(s,level,seed=1):
        s.js(f'g.start({level},{seed});g.freeze();')
    def sim(s,sec,each=''):
        s.js(f'g.sim({sec},i=>{{{each}}});')
    def shot(s,name,look=True):
        s.js(('g.look();' if look else '')+'g.render();'); s.page.screenshot(path=os.path.join(s.root,'tests/out',name+'.png'))
    def resize(s,w,h): s.page.set_viewport_size({'width':w,'height':h}); s.page.wait_for_timeout(150)
    def close(s): s.page.close()

# ------------------------------------------------------------------ general
@test('smoke')
def smoke(c):
    for l in c.js('return Object.keys(g.levels).map(Number)'):
        for seed in (1,2):
            c.start(l,seed); c.sim(2)
    # and the real-time loop still runs the game
    c.js('g.start(1,1);g.freeze(false)'); t0=c.page.evaluate('window.__grib.dbg.P.x'); c.js('g.key("r",1)'); c.page.wait_for_timeout(500); c.js('g.key("r",0)')
    assert c.page.evaluate('window.__grib.dbg.P.x')>t0+40, 'player did not move in real time'
    return 'every level loads and runs'

@test('player')
def player(c):
    # umbrella glide speed settles at GLIDE_V
    c.start(1,3)
    v=c.js("g.setSpores(200);g.openShop();g.buy('umbrella');document.getElementById('go').click();"
           "const P=g.P;P.y=40;P.vy=200;P.onGround=false;g.key('j',1);g.sim(.8,()=>{P.y=Math.min(P.y,60)});g.key('j',0);return P.vy")
    assert abs(v-71)<3, v
    return f'umbrella fall speed {v:.0f}'

@test('enemies')
def enemies(c):
    # every enemy type can be spawned next to the player and live for a few seconds without errors
    for l in (1,2,3,4):
        c.start(l,1)
        c.js("const P=g.P;P.inv=1e9;for(const e of g.enemies){e.x=P.x+200+Math.random()*300}")
        c.sim(6,"g.P.inv=1e9;")
    return 'all spawned foes on levels 1-4 run 6 s next to the player'

# ------------------------------------------------------------------ generators
def gen(c,level,n):
    bad=[]
    for seed in range(1,n+1):
        c.js(f'g.start({level},{seed})')
        info=c.page.evaluate('window.__grib.info()')
        if info.get('fail') or info.get('repairs',0)>0: bad.append((seed,info))
    assert not bad, f'level {level}: {len(bad)} bad seeds, first {bad[:2]}'
    return f'{n} maps passable'
@test('gen1','gen') 
def gen1(c): return gen(c,1,20)
@test('gen2','gen')
def gen2(c): return gen(c,2,20)
@test('gen3','gen')
def gen3(c): return gen(c,3,20)
@test('gen4','gen')
def gen4(c): return gen(c,4,40)

# ------------------------------------------------------------------ bosses
def boss_fight(c,level,expect_states=(),secs=45):
    c.js(f'g.startBoss({level});g.freeze();')
    # walk into the arena and let it lock
    c.js("const P=g.P;P.inv=1e9;P.x=g.arena[0]+300;P.y=g.P.y;")
    c.js("const P=g.P,G=g.grid,c=Math.floor(P.x/40);let r=0;while(r<G.length-1&&!(G[r][c]===1||G[r][c]===2))r++;P.y=r*40-58;P.vy=0")
    c.sim(1.5,"g.P.inv=1e9;")
    if not c.js('return g.arenaLocked'): c.js('g.lock()')
    seen=c.js("""const seen=new Set();const P=g.P;
      g.sim(SECS,i=>{P.inv=1e9;if(P.hp<1)P.hp=3;seen.add(g.B.state);
        if(i%420===0){P.x=g.arena[0]+80+Math.random()*(g.arena[1]-g.arena[0]-160)}
        if(i===HALF)g.B.hp=g.B.max?g.B.max*.4:g.B.hp});
      return [...seen]""".replace('SECS',str(secs)).replace('HALF',str(secs*60)))
    c.shot(f'boss{level}',look=False)
    missing=[s for s in expect_states if s not in seen]
    assert not missing, f'states never reached: {missing}'
    # finish it off
    c.js("let k=0;g.sim(30,i=>{g.P.inv=1e9;if(g.dead)return false;if(i%30===0&&g.B.state!=='dying'){const B=g.B;"
         "if(B.heads){B.heads.forEach((h,j)=>{if(!h.dead)try{g.hit(j,30)}catch(e){}})}else g.hitBoss(30,B.x+B.w/2,B.y+B.h/2)}})")
    assert c.js('return g.dead'), 'boss did not die'
    return f'states: {len(seen)}, beaten'
@test('boss1','boss')
def boss1(c): return boss_fight(c,1)
@test('boss2','boss')
def boss2(c): return boss_fight(c,2)
@test('boss3','boss')
def boss3(c): return boss_fight(c,3)
@test('boss4','boss','ice')
def boss4(c):
    return boss_fight(c,4,['idle','slamWind','slam','punchWind','punch','throwWind','headThrow','volleyWind','volley',
                           'hopWind','hop','splitWind','split','reform','enrage','clapWind','clapOut','clap','frostWind','frost'],secs=150)

@test('snowman_moves','boss4','ice')
def snowman_moves(c):
    c.js('g.startBoss(4);g.freeze();')
    c.js("const P=g.P;P.inv=1e9;P.x=g.arena[0]+200;g.lock();g.sim(2.5,()=>{P.inv=1e9})")
    r=c.js("""const B=g.B,out={},mid=(g.arena[0]+g.arena[1])/2;
      const reset=()=>{B.state='idle';B.t=9;B.pieces=null;B.x=mid-B.w/2;B.y=g.B.y;B.vx=0;g.P.x=mid-400;g.P.vx=0;g.P.vy=0};
      // the clap: hurts her in the air beside it, not on the ground
      const clap=air=>{reset();const P=g.P;P.inv=0;P.hurtT=0;P.hp=5;P.x=mid+200;const y0=P.y;B.face=1;B.state='clapWind';B.t=.3;
        let hurt=false;g.sim(1,()=>{if(air){P.y=y0-120;P.vy=0;P.onGround=false}if(P.hurtT>0)hurt=true;if(B.state==='idle')return false});P.y=y0;P.inv=1e9;return hurt};
      out.clapAir=clap(true);out.clapGround=clap(false);
      // 75% less damage while it is apart
      reset();B.state='split';const h=B.hp;g.hitBoss(4,B.x,B.y);out.splitDmg=h-B.hp;B.state='idle';
      // the frost beam walks away from it
      reset();B.phase=2;B.face=1;g.P.x=mid-300;B.state='frostWind';B.t=.05;const xs=[];
      g.sim(2,()=>{g.P.inv=1e9;if(B.frost&&B.state==='frost')xs.push(B.frost.gx);if(B.state==='idle')return false});
      out.frostNear=xs[0]-mid;out.frostFar=xs[xs.length-1]-mid;
      // after reassembly the arms start short
      reset();g.P.x=mid+400;B.state='throwWind';B.t=.05;B.tMax=.05;let arm=null;
      g.sim(10,()=>{g.P.inv=1e9;if(B.state==='reform'&&arm===null&&B.hf){const b=B.pieces;arm=1}if(B.state==='reform'&&B.hf&&arm===1){arm=Math.hypot(B.hf.x-(B.x+B.w/2),B.hf.y-(B.y+80))}if(B.state==='idle'&&arm!==null)return false});
      out.arm=arm;return out""")
    assert r['clapAir'] and not r['clapGround'], r
    assert abs(r['splitDmg']-1)<.01, r
    assert 0<r['frostNear']<200 and r['frostFar']>400, r
    assert r['arm'] is not None and r['arm']<140, r
    return f"clap hits only in the air; frost beam {r['frostNear']:.0f} -> {r['frostFar']:.0f} px; arms regrow from {r['arm']:.0f} px"

@test('snowman_throw','boss4','ice')
def snowman_throw(c):
    # the head throw ends with the snowman whole again; the hall has no ledges; after the fight the ice wall
    # opens and the door, one screen to the right of the hall, can be reached
    c.js('g.startBoss(4);g.freeze();')
    c.js("const P=g.P;P.inv=1e9;P.x=g.arena[0]+200;g.lock();g.sim(2.5,()=>{P.inv=1e9})")
    r=c.js("""const B=g.B,P=g.P,out={};
      const G=g.grid,a0=g.arena[0]/40,a1=g.arena[1]/40;let planks=0;for(const row of G)for(let c=a0;c<a1;c++)if(row[c]===2)planks++;out.planks=planks;
      let ok=0;   // only the bouncing head is left
      for(let n=0;n<4;n++){B.x=(g.arena[0]+g.arena[1])/2-B.w/2+(n-1.5)*120;P.x=B.x+(n%2?500:-350);P.vx=0;
        B.state='throwWind';B.t=.05;B.tMax=.05;let seen=false;
        g.sim(10,()=>{P.inv=1e9;if(B.state==='headThrow')seen=true;else if(seen)return false});
        if(seen&&B.state==='reform'&&!B.pieces)ok++;B.state='idle';B.t=5}
      out.bounce=ok;
      // beat it: the gate opens and the door can be entered
      g.hitBoss(999,B.x+B.w/2,B.y+B.h/2);g.sim(4,()=>{P.inv=1e9});
      out.dead=g.dead;out.gateOpen=G[G.length-3][a1]===0;
      const door=g.door;out.doorPast=door.x>g.arena[1]+300;
      P.x=g.arena[1]-200;P.y=P.y;g.key('r',1);let entered=false;g.sim(6,()=>{if(g.P.entering)entered=true});g.key('r',0);
      out.entered=entered;return out""")
    assert r['planks']==0, r
    assert r['bounce']==4, r
    assert r['dead'] and r['gateOpen'] and r['doorPast'] and r['entered'], r
    return 'the bouncing head always comes back; gate opens, door reached'

# ------------------------------------------------------------------ ice cave
@test('ice_physics','ice')
def ice_physics(c):
    def slide(fv):
        for seed in range(1,40):
            c.start(4,seed)
            ok=c.js(f"""const G=g.grid,F=g.flow;for(let x=20;x<300;x++)for(let r=3;r<22;r++){{let n=0;
              while(G[r][x+n]===1&&F[r][x+n]==={fv}&&G[r-1][x+n]===0&&G[r-2][x+n]===0&&n<14)n++;
              if(n>=14){{g.enemies.length=0;const P=g.P;P.x=x*40+5;P.y=r*40-58;P.vx=275;P.vy=0;P.onGround=true;return true}}}}return false""")
            if ok:
                x0=c.js('return g.P.x'); c.sim(1.5); return c.js('return g.P.x')-x0
        raise AssertionError('no flat stretch found')
    ice,rock=slide(11),slide(0)
    assert ice>80 and rock<30, (ice,rock)
    return f'slide on ice {ice:.0f}px, on rock {rock:.0f}px'

@test('ice_foes','ice')
def ice_foes(c):
    c.start(4,3)
    r=c.js("""const P=g.P;P.inv=1e9;const out={};
      for(const t of ['iceSlime','iceGolem','iceWitch']){const e=g.spawn(t,P.x+220,P.y+58);out[t]=!!e}
      g.sim(8,()=>{P.inv=1e9});
      // golem: hits from the left raise its left arm; then left hits are blocked and right hits land
      const gm=g.spawn('iceGolem',P.x+400,P.y+58);gm.hp=99;const cx=gm.x+gm.w/2;
      for(let i=0;i<5;i++)g.attack(gm,1,cx-60);
      out.guard=gm.guard>0&&gm.gside===-1;
      out.blockedLeft=g.attack(gm,1,cx-60)===false;
      out.hitsRight=g.attack(gm,1,cx+60)===true;
      return out""")
    assert all(r.values()), r
    return 'slime, golem, witch run; golem guard blocks only its side'

@test('bigslime','forest')
def bigslime(c):
    # every forest map has the mini-boss in its clearing; it wakes, uses all its moves, sheds kids and can be beaten
    for seed in range(1,11):
        c.start(1,seed)
        n=c.js("return g.enemies.filter(e=>e.type==='bigSlime').length")
        assert n==1, (seed,n)
    c.start(1,4)
    r=c.js("""const P=g.P,e=g.enemies.find(e=>e.type==='bigSlime');P.inv=1e9;const cx0=e.x+e.w/2,fy=e.y+e.h;
      P.x=e.x-260;P.y=fy-P.h;P.vx=0;P.vy=0;
      const seen=new Set(),shots=new Set();
      const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
      g.sim(40,i=>{P.inv=1e9;seen.add(e.state);if(i%360===0){P.x=clamp(e.x+e.w/2+((i/360)%2?400:-400),cx0-680,cx0+200);P.y=fy-P.h}   // she keeps changing sides
        for(const b of g.eshots)shots.add(b.k)});
      const out={states:[...seen].sort().join(','),shots:[...shots].sort().join(',')};
      for(let i=0;i<60&&!e.dead;i++){g.attack(e,1.25,e.x-10);g.sim(.05,()=>{P.inv=1e9})}
      out.dead=e.dead;out.kids=g.enemies.filter(k=>k.mini).length;
      g.sim(3,()=>{P.inv=1e9});
      return out""")
    assert r['dead'] and r['kids']>=3, r
    for s in ('wake','crouch','air','spitWind','ramWind','ram','ramStop'): assert s in r['states'], r
    assert 'goo' in r['shots'] and 'gooWave' in r['shots'], r
    # awake, it follows her out of its clearing, across the level, and never falls into a pit
    far=[]
    for seed in range(1,11):
        c.start(1,seed)
        rr=c.js("""const P=g.P,e=g.enemies.find(e=>e.type==='bigSlime');P.inv=1e9;const x0=e.x;
          P.x=e.x-300;P.y=e.y+e.h-P.h;g.sim(1,()=>{P.inv=1e9});
          // she walks back towards the start; it follows
          // she is always put down on solid ground, so she never falls and respawns (that would reset the foes)
          const G=g.grid,ground=c=>{for(let r=0;r<G.length;r++){if(G[r][c]===1)return r*40;if(G[r][c]===5||G[r][c]===6)return -1}return -1};
          g.sim(20,i=>{P.inv=1e9;if(i%120===0){let c=Math.max(5,Math.floor((e.x-350)/40));while(c>5&&(ground(c)<0||ground(c-1)<0||ground(c+1)<0))c--;
            P.x=c*40+5;P.y=ground(c)-P.h-2;P.vy=0;P.vx=0}});
          return [x0-e.x,e.dead||P!==g.P,e.hp]""")
        assert not rr[1] and rr[2]==48, (seed,rr)
        far.append(rr[0])
    assert max(far)>400, far
    # after a stomp it neither hops nor leaps for 1.25 s, but it may spit or ram
    c.start(1,4)
    st=c.js("""const P=g.P,e=g.enemies.find(e=>e.type==='bigSlime');P.inv=1e9;P.x=e.x-300;P.y=e.y+e.h-P.h;g.sim(1.5,()=>{P.inv=1e9});
      const res=[];for(let k=0;k<8;k++){g.sim(.5,()=>{P.inv=1e9});if(!e.onGround){g.sim(1.5,()=>{P.inv=1e9;return e.onGround?false:undefined})}
        e.state='idle';e.t=.05;e.hops=0;e.vx=0;
        P.x=e.x+e.w/2-P.w/2;P.y=e.y-P.h-4;P.vy=300;P.onGround=false;P.inv=0;P.dashT=0;
        const seen=new Set();let stomped=false;
        g.sim(1.2,()=>{if(e.noJump>0)stomped=true;if(stomped)seen.add(e.state);P.inv=stomped?1e9:0});
        res.push([stomped,[...seen].join(',')])}
      return res""")
    for stomped,states in st:
        assert stomped and 'crouch' not in states and 'air' not in states, st
    # with a pit dug in front of it the ram stops at the edge
    c.start(1,2)
    gap=c.js("""const P=g.P,e=g.enemies.find(e=>e.type==='bigSlime'),G=g.grid;
      const c0=Math.floor((e.x+e.w)/40)+3;for(let c=c0;c<c0+3;c++)for(let r=0;r<G.length;r++)G[r][c]=0;
      P.inv=1e9;P.x=c0*40+400;e.state='ramWind';e.t=.05;e.face=1;g.sim(3,()=>{P.inv=1e9});
      return c0*40-(e.x+e.w)""")
    assert 0<=gap<40, gap
    c.start(1,4)
    c.js("const P=g.P,e=g.enemies.find(e=>e.type==='bigSlime');P.x=e.x-200;P.y=e.y+e.h-P.h;P.inv=1e9;g.sim(.4,()=>{P.inv=1e9})")
    c.shot('bigslime_sleep')
    c.js("const P=g.P;g.sim(2.2,()=>{P.inv=1e9})"); c.shot('bigslime_awake')
    return f"states {r['states']}; kids {r['kids']}"

@test('respawn','player','enemies')
def respawn(c):
    # when the player dies, killed foes come back and wounded ones heal
    for l in (1,2,3,4):
        c.start(l,2)
        r=c.js("""const P=g.P,foes=()=>g.enemies.filter(e=>!e.prop),n0=foes().length,a=foes();
          a[0].dead=true;a[1].hp=.01;
          g.sim(.02,()=>{P.inv=1e9});const n2=foes().length;
          P.inv=0;P.hp=0;P.dead=true;P.deadT=0;P.fell=true;g.sim(2);   // she dies and comes back at the checkpoint
          const after=foes();return {n0,n2,n3:after.length,healed:after.every(e=>e.hp>.01)}""")
        assert r['n2']==r['n0']-1 and r['n3']==r['n0'] and r['healed'], (l,r)
    return 'killed foes return after the player dies on levels 1-4'

@test('pickup','player')
def pickup(c):
    # picking up the power mushroom locks the player only for the pick-up part of the animation
    c.start(1,1)
    t=c.js("""const P=g.P;g.items.push({k:'power',x:P.x+P.w/2,y:P.y+P.h/2,ph:0});let t=0;
      g.sim(2,i=>{if(P.pickT<0&&i>2)return false;t=i/120});return t""")
    assert t<.6, t
    return f'locked for {t:.2f} s'

@test('magnet','boss1')
def magnet(c):
    # after the boss dies its spores fly to the player by themselves
    c.js('g.startBoss(1);g.freeze();')
    c.js("const P=g.P;P.inv=1e9;P.x=g.arena[0]+120;g.lock();g.sim(2.5,()=>{P.inv=1e9});g.hitBoss(999,g.B.x+g.B.w/2,g.B.y+g.B.h/2)")
    r=c.js("""const P=g.P,bonus=()=>g.items.filter(i=>i.bonus);g.sim(5,()=>{P.inv=1e9;if(g.dead)return false});
      const n0=bonus().length;g.sim(.4,()=>{P.inv=1e9});const early=bonus().filter(i=>i.magnet).length;
      g.sim(.2,()=>{P.inv=1e9});const pulled=bonus().filter(i=>i.magnet).length;
      g.sim(2,()=>{P.inv=1e9});return [g.dead,n0,early,pulled,bonus().length]""")
    assert r[0] and r[1]==10 and r[2]==0 and r[3]>0 and r[4]==0, r
    return 'all 10 boss spores collected automatically'

@test('croc_rules','boss1')
def croc_rules(c):
    c.js('g.startBoss(1);g.freeze();')
    c.js("const P=g.P;P.inv=1e9;P.x=g.arena[0]+300;g.lock();g.sim(2.5,()=>{P.inv=1e9})")
    r=c.js("""const B=g.B,P=g.P,out={};
      // only 75% of the damage while turning into phase 2
      B.state='enrage';B.t=1;let h=B.hp;g.hitBoss(10,B.x+B.w/2,B.y+B.h/2);out.enrage=h-B.hp;
      B.state='idle';h=B.hp;g.hitBoss(10,B.x+B.w/2,B.y+B.h/2);out.normal=h-B.hp;
      // never three bites in a row, even with the player right in front of it
      let run=0,worst=0;for(let i=0;i<300;i++){B.state='idle';B.t=0;B.x=(g.arena[0]+g.arena[1])/2-B.w/2;
        P.x=B.x+B.w+20;P.y=g.P.y;B.aboveT=0;g.croc();const bite=B.state==='chompWind';run=bite?run+1:0;worst=Math.max(worst,run)}
      out.worst=worst;
      // player against a wall: it mostly jumps
      let leaps=0;for(let i=0;i<400;i++){B.state='idle';B.t=0;B.chompRun=0;B.x=g.arena[0]+300;P.x=g.arena[0]+40;g.croc();if(B.state==='leapWind')leaps++}
      out.wall=leaps/400;return out""")
    assert abs(r['enrage']-7.5)<.01 and abs(r['normal']-10)<.01, r
    assert r['worst']<=2, r
    assert .65<r['wall']<.9, r
    return f"bites in a row <= {r['worst']}, near wall leaps {r['wall']:.0%}"

@test('dragon_armor','boss2')
def dragon_armor(c):
    # every inferno takes 75% less damage, from its wind-up to the end of its breath
    c.js('g.startBoss(2);g.freeze();')
    c.js("const P=g.P;P.inv=1e9;P.x=g.arena[0]+200;g.lock();g.sim(2.5,()=>{P.inv=1e9})")
    r=c.js("""const B=g.B,P=g.P,hit=()=>{const h=B.hp;g.hitBoss(4,B.x+B.w/2,B.y+B.h/2);return h-B.hp};
      g.hitBoss(B.hp-B.max/2+1,B.x+B.w/2,B.y+B.h/2);   // down to half: it enrages
      g.sim(5,()=>{P.inv=1e9;if(B.state==='infernoWind')return false});const wind=hit();
      g.sim(5,()=>{P.inv=1e9;if(B.state==='inferno')return false});const first=hit();
      g.sim(5,()=>{P.inv=1e9;if(B.state==='hover')return false});const after=hit();
      B.infCD=0;B.state='infernoWind';B.t=1;B.infDir=1;g.sim(1.1,()=>{P.inv=1e9});const second=hit();
      return [first,after,second,wind]""")
    assert abs(r[0]-1)<.01 and abs(r[1]-4)<.01 and abs(r[2]-1)<.01 and abs(r[3]-1)<.01, r
    return 'every inferno armoured, wind-up included'

@test('witch_flake','ice')
def witch_flake(c):
    # the witch's snowflake flies through rock and speeds up
    c.start(4,3)
    r=c.js("""const P=g.P;P.inv=1e9;g.enemies.length=0;const G=g.grid;
      // fired along row 1, inside the rock of the cave roof
      g.eshots.push({k:'flake',x:P.x,y:60,vx:230,vy:0,sp:230,home:0,r:17,life:4,rot:0});const b=g.eshots[g.eshots.length-1];let inRock=0;const v0=230;g.sim(1.5,()=>{P.inv=1e9;P.x=b.x+600;if(!b.dead&&G[Math.floor(b.y/40)]&&G[Math.floor(b.y/40)][Math.floor(b.x/40)]===1)inRock++});
      const speed=Math.hypot(b.vx,b.vy);
      // it hits her once and flies on
      const hp=P.hp;P.inv=0;P.hp=5;b.x=P.x+P.w/2-40;b.y=P.y+P.h/2;b.vx=300;b.vy=0;b.hitP=false;let alive=0;
      g.sim(.4,()=>{if(!b.dead)alive++});const hurt=P.hp<5;P.inv=1e9;
      return [inRock,speed,b.dead,hurt,alive>40]""")
    assert r[0]>60 and r[1]>500 and r[3] and r[4], r
    return f'through rock for {r[0]} steps, speed 230 -> {r[1]:.0f}'

@test('mana','player')
def mana(c):
    # punches and stomps do 1 damage and give 5 mana; L throws mushrooms for mana; shop upgrades and pickups
    c.start(1,2)
    r=c.js("""const P=g.P,out={};P.inv=1e9;g.enemies.length=0;const press=k=>{g.key(k,1);g.sim(.02);g.key(k,0)};
      out.start=[P.mana,g.maxMana()];
      // a punch on a foe: 1 damage, +5 mana (once per punch)
      P.mana=20;let e=g.spawn('orc',P.x+70,P.y+P.h);e.hp=10;e.face=1;P.face=1;g.punch();g.sim(.4,()=>{P.inv=1e9});
      out.punch=[10-e.hp,P.mana];g.enemies.length=0;
      // a stomp: 1.5 damage, +5 mana, the plain bounce 764 px/s (its height x1.3 x1.3 x1.5 since 480)
      P.mana=20;e=g.spawn('orc',P.x+P.w/2,P.y+P.h);e.hp=10;P.x=e.x+e.w/2-P.w/2;P.y=e.y-P.h-2;P.vy=300;P.onGround=false;P.inv=0;let vy=null;
      g.sim(.1,()=>{if(vy===null&&g.P.vy<0)vy=g.P.vy});out.stomp=[10-e.hp,g.P.mana,Math.round(vy)];const ox=e.x+e.w/2,oy=e.y+e.h;g.enemies.length=0;
      // with jump held: the high bounce, 17% lower in height than before (911 px/s)
      {const Q=g.P;e=g.spawn('orc',ox,oy);e.hp=10;Q.x=e.x+e.w/2-Q.w/2;Q.y=e.y-Q.h-2;Q.vy=300;Q.onGround=false;Q.inv=0;g.key('j',1);let hv=null;
       g.sim(.1,()=>{if(hv===null&&g.P.vy<0)hv=g.P.vy});g.key('j',0);out.high=Math.round(hv);g.enemies.length=0}
      // L: one mushroom for 5 mana; with no mana, nothing
      g.P.inv=1e9;g.P.y=0;g.sim(1.5,()=>{g.P.inv=1e9});const Q=g.P;Q.mana=12;Q.shootCD=0;g.throwShroom();out.throw1=[Q.mana,g.shots.length];
      Q.shootCD=0;Q.mana=3;const n0=g.shots.length;g.throwShroom();out.empty=[Q.mana,g.shots.length-n0];
      // the shop: upgrades
      g.setSpores(500);g.openShop();g.buy('manaUp');g.buy('manaUp');g.buy('manaUp');g.buy('manaUp');g.buy('manaUp');out.maxMana=g.maxMana();
      g.buy('shots');out.lvl2=g.shotLvl;g.buy('shots');out.lvl3=g.shotLvl;out.spent=500-g.spores;
      Q.mana=0;g.buy('mush');out.mush=Q.mana;
      document.getElementById('go').click();
      Q.shootCD=0;Q.mana=20;const n1=g.shots.length;g.throwShroom();out.throw3=[Q.mana,g.shots.length-n1];
      // the big mushroom on the ground: +100 mana
      Q.mana=10;g.items.push({k:'power',x:Q.x+Q.w/2,y:Q.y+Q.h/2,ph:0});g.sim(.05,()=>{Q.inv=1e9});out.pick=Q.mana;
      return out""")
    assert r['start']==[100,100], r
    assert r['punch']==[1,25], r
    assert r['stomp'][0]==1.5 and r['stomp'][1]==25 and abs(r['stomp'][2]+764)<3, r
    assert abs(r['high']+911)<3, r
    assert r['throw1']==[7,1] and r['empty']==[3,0], r
    assert r['maxMana']==200 and r['lvl2']==2 and r['lvl3']==3, r
    assert r['spent']==4*25+30+60, r
    assert r['mush']==100 and r['throw3']==[10,3] and r['pick']==110, r
    return 'punch 1 / stomp 1.5 dmg, +5 mana; throws 5/8/10; shop and pickups work'

@test('dragon_gust','boss2')
def dragon_gust(c):
    # the dragon never starts the gust closer than half a screen to the player
    c.js('g.startBoss(2);g.freeze();')
    c.js("const P=g.P;P.inv=1e9;P.x=g.arena[0]+300;g.lock();g.sim(2.5,()=>{P.inv=1e9})")
    r=c.js("""const B=g.B,P=g.P;B.phase=2;let near=0,far=0;
      for(let i=0;i<400;i++){B.state='hover';B.t=0;B.last='';B.infCD=99;const d=i%2?150:600;B.x=P.x+P.w/2+d-B.w/2;g.dragon();
        if(B.state==='gust'){if(d<g.vw/2)near++;else far++}}
      return [near,far]""")
    assert r[0]==0 and r[1]>0, r
    return f'gusts started from afar: {r[1]}, from close by: {r[0]}'

@test('boss_start','boss')
def boss_start(c):
    # every boss fight starts once its sprite comes into view, wherever the player is, without the crash and roar
    out=[]
    for l in (1,2,3,4):
        c.js(f'g.startBoss({l});g.freeze();')
        r=c.js("""const P=g.P,G=g.grid;P.inv=1e9;let at=null;
          // put her at the last checkpoint before the arena, then run to the right
          const cp=g.checks.reduce((a,q)=>q.x<g.arena[0]&&(!a||q.x>a.x)?q:a,null);P.x=cp.x-P.w/2-120;P.y=cp.y-P.h;P.vy=0;g.look();
          const seenAtStart=g.bossSeen(0);
          g.sim(.5,()=>{P.inv=1e9});const lockedEarly=g.arenaLocked;
          // levels 1-2: run right until it starts; 3-4 have drops and walls on the way, so she is put at the arena's door
          if(g.level>2){P.x=g.arena[0]+30;P.y=g.B.y+g.B.h-P.h-2;P.vy=0}
          g.sim(30,i=>{P.inv=1e9;g.key('r',1);if(g.arenaLocked){at=P.x;return false}});g.key('r',0);
          if(lockedEarly)return [false,false,'early',seenAtStart];
          return [g.arenaLocked,at!==null&&g.bossSeen(0),g.B.state,seenAtStart]""")
        assert r[0] and r[1] and r[2]=='intro' and not r[3], (l,r)
        out.append(l)
    return 'levels %s: the fight starts when the boss comes into view'%out

@test('caterpillar_bite','enemies')
def caterpillar_bite(c):
    # the caterpillar only bites with a small box low in front of its head; standing on its head is safe
    c.start(1,1)
    r=c.js("""const P=g.P;g.enemies.length=0;const e=g.spawn('caterpillar',P.x+400,P.y+P.h);e.hp=99;const out={};
      const h=e.segs[0];P.inv=0;P.hp=9;P.x=h.x-P.w/2;P.y=e.gy-38-P.h;P.vy=0;let hits=0;
      g.sim(1,()=>{P.x=e.segs[0].x-P.w/2;P.inv=0;if(P.hurtT>0)hits++});out.onHead=hits;
      P.hp=9;P.x=e.segs[0].x+e.dir*40-P.w/2;P.y=e.gy-P.h;P.vy=0;P.onGround=true;hits=0;
      g.sim(.3,()=>{P.inv=0;if(P.hurtT>0)hits++});out.inFront=hits;P.inv=1e9;return out""")
    assert r['onHead']==0 and r['inFront']>0, r
    return 'safe on its head, bitten in front'

@test('snow_fill','ice')
def snow_fill(c):
    # a skylight that comes into view is already full of falling snow, top to bottom
    for seed in range(1,10):
        c.start(4,seed)
        r=c.js("""const S=window.__grib.dbg.skylights;if(!S.length)return null;const s=S[0],P=g.P;P.inv=1e9;
          P.x=(s.x0+s.x1)/2;P.y=Math.min(s.fy,g.grid.length*40)-200;g.look();g.sim(1/60,()=>{P.inv=1e9;P.vy=0});
          const fl=g.parts.filter(p=>p.t==='snow'&&p.x>=s.x0&&p.x<=s.x1);if(!fl.length)return [0,0];
          const ys=fl.map(p=>p.y);return [fl.length,Math.max(...ys)-Math.min(...ys)]""")
        if r: break
    assert r[0]>30 and r[1]>250, r
    return f'{r[0]} flakes over {r[1]:.0f} px at once'

@test('boss_knockback','boss')
def boss_knockback(c):
    # player hits push the crocodile (phase 1 only) and the flying dragon back a little; hydra heads are pushed away
    out={}
    c.js('g.startBoss(1);g.freeze();');c.js("const P=g.P;P.inv=1e9;P.x=g.arena[0]+300;g.lock();g.sim(2.5,()=>{P.inv=1e9})")
    out['croc']=c.js("""const B=g.B,P=g.P;B.state='idle';B.t=9;B.x=(g.arena[0]+g.arena[1])/2-B.w/2;P.x=B.x-100;let x=B.x;g.hitBoss(1,B.x,B.y+40);const d1=B.x-x;
      B.phase=2;x=B.x;g.hitBoss(1,B.x,B.y+40);return [d1,B.x-x]""")
    c.js('g.startBoss(2);g.freeze();');c.js("const P=g.P;P.inv=1e9;P.x=g.arena[0]+300;g.lock();g.sim(2.5,()=>{P.inv=1e9})")
    out['dragon']=c.js("""const B=g.B,P=g.P;B.state='hover';B.t=9;B.x=(g.arena[0]+g.arena[1])/2;B.y=120;P.x=B.x+B.w+200;let x=B.x;g.hitBoss(1,B.x,B.y+40);const d1=B.x-x;
      B.state='tired';B.t=9;B.y=g.B.y;x=B.x;g.hitBoss(1,B.x,B.y+40);return [d1,B.x-x]""")
    c.js('g.startBoss(3);g.freeze();');c.js("const P=g.P;P.inv=1e9;P.x=g.arena[0]+300;g.lock();g.sim(3,()=>{P.inv=1e9})")
    out['hydra']=c.js("""const B=g.B,P=g.P;g.sim(3,()=>{P.inv=1e9;if(B.state==='fight')return false});const h=B.heads[0];P.x=h.x-200;const x=h.x;g.hit(0,.5);return h.x-x""")
    assert out['croc'][0]>3 and out['croc'][1]==0, out   # she is on its left: it is pushed right
    assert out['dragon'][0]<-3 and out['dragon'][1]==0, out
    assert out['hydra']>5, out
    return 'croc (phase 1), flying dragon and hydra heads are pushed back'

@test('snowman_phase3','boss4','ice')
def snowman_phase3(c):
    c.js('g.startBoss(4);g.freeze();')
    c.js("const P=g.P;P.inv=1e9;P.x=g.arena[0]+200;g.lock();g.sim(2.5,()=>{P.inv=1e9})")
    r=c.js("""const B=g.B,P=g.P,mid=(g.arena[0]+g.arena[1])/2,out={};
      // far away: never the clap or the frost breath
      B.phase=2;let bad=0;for(let i=0;i<300;i++){B.state='idle';B.t=0;B.last='';B.x=g.arena[0]+30;P.x=g.arena[1]-100;g.snowman();if(B.state==='clapWind'||B.state==='frostWind')bad++}
      out.farBad=bad;
      // phase 3 at a third of its health, then hops make 30% of its moves
      B.state='idle';B.t=9;B.x=mid-B.w/2;B.hp=B.max/3-.1;g.sim(.05,()=>{P.inv=1e9});out.phase=B.phase;
      let hops=0,n=0;for(let i=0;i<1000;i++){B.state='idle';B.t=0;B.last='';B.splitCD=0;B.throwCD=0;B.x=mid-B.w/2;P.x=mid+300;g.snowman();n++;if(B.state==='hopWind')hops++}
      out.hopShare=hops/n;return out""")
    assert r['farBad']==0 and r['phase']==3 and .24<r['hopShare']<.36, r
    return f"no clap/frost from afar; phase 3, hops {r['hopShare']:.0%}"

@test('sand_idle','player')
def sand_idle(c):
    # sinking in quicksand she shows the standing sprite, not a jump
    for seed in range(1,15):
        c.start(2,seed)
        pos=c.js("""const G=g.grid;for(let x=10;x<G[0].length-2;x++)for(let r=2;r<G.length-1;r++)if(G[r][x]===6&&G[r-1][x]===0&&G[r][x+1]===6)return [x,r];return null""")
        if pos: break
    x,r=pos
    fr=c.js(f"const P=g.P;P.inv=1e9;P.x={x}*40+5;P.y={r}*40-50;P.vx=0;P.vy=0;g.sim(.4,()=>{{P.inv=1e9}});g.render();return [P.inSand,P._fr[0]]")
    assert fr[0] and fr[1]=='idle', fr
    return 'idle sprite in quicksand'

@test('raith','player','enemies')
def raith(c):
    # Raithwyn: taller, 1.5 punches, 2 stomps, L = hadoken (15 mana, 5 damage), I = a sphere on a sine wave (5 mana, 5
    # damage), hearts-only shop, no heavy-landing lock, a death animation in fog; every level starts and runs with her
    try:
        c.js("g.setHero('raith')")
        for l in (1,2,3,4):
            c.start(l,1); c.sim(1.5,"g.P.inv=1e9;")
            assert c.js("return g.P.h")==76, l
        c.js("g.setHero('grib')");c.start(1,2)
        gd=c.js("const R=g.P;R.inv=1e9;g.sim(.3,()=>{R.inv=1e9});const x0=R.x;g.dash();g.sim(.3,()=>{R.inv=1e9;R.vy=0});return R.x-x0")
        c.js("g.setHero('raith')");c.start(1,2)
        r=c.js("""const P=g.P,out={};P.inv=1e9;g.enemies.length=0;
          let e=g.spawn('orc',P.x+70,P.y+P.h);e.hp=20;e.face=1;P.face=1;g.punch();out.punchAnim=P.punchAnim;g.sim(.4,()=>{P.inv=1e9});out.punch=20-e.hp;g.enemies.length=0;
          // both punch animations come up
          const anims=new Set();for(let i=0;i<40;i++){P.shootCD=0;g.punch();anims.add(P.punchAnim)}P.punchT=0;out.anims=[...anims].sort();
          // the hadoken: the cast frames, then a fireball that hits a small foe 300 px away
          P.mana=50;e=g.spawn('slime',P.x+P.w/2+300,P.y+P.h);e.hp=20;P.face=1;P.shootCD=0;g.cast('hadoken');g.sim(.1,()=>{P.inv=1e9});g.render();out.castFr=P._fr[0];
          g.sim(1,()=>{P.inv=1e9});out.hadoken=[20-e.hp,P.mana];g.enemies.length=0;
          // the sphere: sways up and down by a wide sine wave, 5 damage for 5 mana
          P.mana=50;P.shootCD=0;g.cast('sphere');g.sim(.1,()=>{P.inv=1e9});g.render();out.sphereFr=P._fr[0];
          let lo=1e9,hi=-1e9;g.sim(1.6,()=>{P.inv=1e9;for(const s of g.spells){lo=Math.min(lo,s.y);hi=Math.max(hi,s.y)}});out.sway=hi-lo;out.sphereMana=P.mana;g.spells.length=0;
          e=g.spawn('slime',P.x+P.w/2+220,P.y+P.h);e.hp=20;P.shootCD=0;g.cast('sphere');g.sim(1.5,()=>{P.inv=1e9});out.sphere=20-e.hp;g.enemies.length=0;
          // not enough mana: no cast
          P.mana=3;P.shootCD=0;g.cast('sphere');out.denied=!(P.castT>0);P.mana=50;
          // a stomp
          e=g.spawn('orc',P.x+P.w/2,P.y+P.h);e.hp=20;P.x=e.x+e.w/2-P.w/2;P.y=e.y-P.h-2;P.vy=300;P.onGround=false;P.inv=0;g.sim(.1);out.stomp=20-e.hp;g.enemies.length=0;
          // a long fall: no heavy-landing lock
          const Q=g.P;Q.inv=1e9;g.sim(1.5,()=>{Q.inv=1e9});Q.y-=400;Q.vy=0;Q.onGround=false;let lock=0;g.sim(1.5,()=>{if(Q.heavyT>0)lock++});out.heavy=lock;
          out.shop=g.shopIds();
          // the dash is 15% longer than the mushroom girl's; her punch sends a short, tall shockwave
          const dashLen=()=>{const R=g.P;R.inv=1e9;R.vx=0;R.vy=0;g.sim(.3,()=>{R.inv=1e9});const x0=R.x;g.dash();g.sim(.3,()=>{R.inv=1e9;R.vy=0});return R.x-x0};
          out.dash=dashLen();
          {const R=g.P;R.shootCD=0;g.punch();g.sim(.1,()=>{R.inv=1e9});const w=g.pwaves[0];out.wave=!!w&&w.tall>1.2&&w.life0<.11}
          // dying: the fog, then back at the checkpoint
          Q.inv=0;Q.hp=0;Q.dead=true;Q.deadT=0;Q.fell=false;g.sim(.5);g.render();out.deathFr=Q._fr[0];g.sim(1.5);out.stillDead=g.P===Q;g.sim(.6);out.back=g.P!==Q;
          return out""")
        r['gribDash']=gd
        assert r['punch']==1.5 and r['anims']==['punch','punch2'] and r['stomp']==2, r
        assert r['castFr']=='hadoken' and r['hadoken']==[5,35] and r['sphereFr']=='sphere' and r['sphereMana']==45 and r['sphere']==5 and r['sway']>60 and r['denied'], r
        assert r['deathFr']=='death', r
        assert r['heavy']==0 and r['shop']==['heal','maxhp','manaUp'] and r['stillDead'] and r['back'], r
        assert abs(r['dash']/r['gribDash']-1.15)<.06 and r['wave'], r
        return 'all levels run; punch 1.5 + short tall wave, dash x1.15, hadoken 5 for 15 mana, sine sphere 5 for 5, stomp 2; shop: hearts + mana; death frames + fog'
    finally:
        c.js("g.setHero('grib')")

@test('frog_warn','enemies')
def frog_warn(c):
    # the frog shows a warning before every tongue lash
    c.start(3,1)
    r=c.js("""const P=g.P;P.inv=1e9;g.enemies.length=0;const f=g.spawn('frog',P.x+150,P.y+P.h);let prev='',ok=0,bad=0;
      g.sim(8,()=>{P.inv=1e9;if(f.state==='tongue'&&prev!=='tongue'){if(prev==='tongueWind')ok++;else bad++}prev=f.state});
      return [ok,bad]""")
    assert r[0]>0 and r[1]==0, r
    return f'{r[0]} tongue lashes, all announced'

@test('mummy_ruins','gen2')
def mummy_ruins(c):
    # no mummy is placed inside the ruined town of level 2
    n=0
    for seed in range(1,21):
        c.js(f'g.start(2,{seed})')
        r=c.js("""const R=g.ruins;return g.enemies.filter(e=>e.type==='mummy').map(e=>e.x+e.w/2).filter(x=>R.some(q=>x>=q.x0-40&&x<=q.x1+40)).length""")
        assert r==0, (seed,r)
        n+=c.js("return g.enemies.filter(e=>e.type==='mummy').length")
    assert n>0, 'no mummies at all'
    return f'{n} mummies on 20 maps, none in the ruins'

# ------------------------------------------------------------------ rendering / ui (screenshots for a human look)
@test('render')
def render(c):
    for l in (1,2,3,4):
        c.start(l,2); c.sim(.5); c.shot(f'level{l}')
    return 'screenshots in tests/out/level*.png'

@test('water','render')
def water(c):
    # under water, pressed against a wall: the part of her sprite inside the rock must be tinted too
    for seed in range(1,40):
        c.start(1,seed)
        pos=c.js("""const G=g.grid;for(let x=5;x<G[0].length-5;x++)for(let r=3;r<G.length-2;r++)
          if(G[r][x]===5&&G[r+1][x]===5&&G[r-1][x]===5&&G[r][x+1]===1&&G[r-1][x+1]===1&&G[r+1][x+1]===1&&G[r+2][x]===1)return [x,r];return null""")
        if pos: break
    assert pos, 'no pool next to a wall found'
    x,r=pos
    c.js(f"const P=g.P;P.x={x}*40+40-P.w;P.y={r+2}*40-58;P.vx=0;P.vy=0;P.face=1;P.inv=0;")
    c.sim(.05,f"const P=g.P;P.x={x}*40+40-P.w;P.y={r+2}*40-58;P.vy=0;")
    c.shot('water_wall')
    return 'screenshot tests/out/water_wall.png'

@test('ui')
def ui(c):
    k=c.page.keyboard; foc=lambda:c.page.evaluate("document.activeElement.id||document.activeElement.className")
    k.press('ArrowDown');k.press('Enter');c.page.wait_for_timeout(150)
    assert 'lvl-btn' in foc(), foc()
    n=c.page.evaluate("document.querySelectorAll('.boss-btn').length")
    assert n==c.js('return Object.keys(g.levels).length'), n
    k.press('Escape');c.page.wait_for_timeout(100)
    # in-game Esc menu: 'Main menu' is the last item
    c.js('g.start(1,1)');c.page.wait_for_timeout(50);c.page.keyboard.press('Escape');c.page.wait_for_timeout(150)
    last=c.page.evaluate("()=>{const b=[...document.querySelectorAll('#card .menu button')];return b.length?b[b.length-1].id:null}")
    assert last=='tomenu', last
    c.page.keyboard.press('Escape');c.page.wait_for_timeout(100)
    for w,h,cols in [(1280,720,4),(800,600,3),(1366,560,4)]:
        c.resize(w,h); c.js('g.start(1,5);g.setSpores(50);g.openShop()'); c.page.wait_for_timeout(150)
        r=c.page.evaluate("()=>{const c=document.getElementById('card');return [c.scrollHeight<=c.clientHeight+2,getComputedStyle(document.querySelector('.shop-list')).gridTemplateColumns.split(' ').length]}")
        assert r==[True,cols], (w,h,r)
        c.page.screenshot(path=os.path.join(c.root,'tests/out',f'shop_{w}x{h}.png'))
        c.page.keyboard.press('Escape'); c.page.wait_for_timeout(100)
    return 'menus by keyboard, shop fits at 3 window sizes'
