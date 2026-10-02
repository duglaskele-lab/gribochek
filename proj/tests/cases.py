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
                           'hopWind','hop','splitWind','split','reform','enrage'],secs=120)

@test('snowman_throw','boss4','ice')
def snowman_throw(c):
    # every head-throw variant ends with the snowman whole again; the hall has no ledges; after the fight the ice wall
    # opens and the door, one screen to the right of the hall, can be reached
    c.js('g.startBoss(4);g.freeze();')
    c.js("const P=g.P;P.inv=1e9;P.x=g.arena[0]+200;g.lock();g.sim(2.5,()=>{P.inv=1e9})")
    r=c.js("""const B=g.B,P=g.P,out={};
      const G=g.grid,a0=g.arena[0]/40,a1=g.arena[1]/40;let planks=0;for(const row of G)for(let c=a0;c<a1;c++)if(row[c]===2)planks++;out.planks=planks;
      for(const kind of ['bounce','roll','fling']){let ok=0;
        for(let n=0;n<4;n++){B.x=(g.arena[0]+g.arena[1])/2-B.w/2+(n-1.5)*120;B.y=g.B.y;P.x=B.x+(n%2?500:-350);P.vx=0;
          B.forceThrow=kind;B.state='throwWind';B.t=.05;B.tMax=.05;let seen=false;
          g.sim(10,()=>{P.inv=1e9;if(B.state==='headThrow')seen=true;else if(seen)return false});
          if(seen&&B.state==='reform'&&!B.pieces)ok++;B.state='idle';B.t=5}
        out[kind]=ok}
      // beat it: the gate opens and the door can be entered
      g.hitBoss(999,B.x+B.w/2,B.y+B.h/2);g.sim(4,()=>{P.inv=1e9});
      out.dead=g.dead;out.gateOpen=G[G.length-3][a1]===0;
      const door=g.door;out.doorPast=door.x>g.arena[1]+300;
      P.x=g.arena[1]-200;P.y=P.y;g.key('r',1);let entered=false;g.sim(6,()=>{if(g.P.entering)entered=true});g.key('r',0);
      out.entered=entered;return out""")
    assert r['planks']==0, r
    assert r['bounce']==4 and r['roll']==4 and r['fling']==4, r
    assert r['dead'] and r['gateOpen'] and r['doorPast'] and r['entered'], r
    return 'all three head throws reassemble; gate opens, door reached'

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
    # the inferno that opens phase 2 takes 75% less damage until its breath ends; a later inferno has no armour
    c.js('g.startBoss(2);g.freeze();')
    c.js("const P=g.P;P.inv=1e9;P.x=g.arena[0]+200;g.lock();g.sim(2.5,()=>{P.inv=1e9})")
    r=c.js("""const B=g.B,P=g.P,hit=()=>{const h=B.hp;g.hitBoss(4,B.x+B.w/2,B.y+B.h/2);return h-B.hp};
      g.hitBoss(B.hp-B.max/2+1,B.x+B.w/2,B.y+B.h/2);   // down to half: it enrages
      g.sim(5,()=>{P.inv=1e9;if(B.state==='inferno')return false});const first=hit();
      g.sim(5,()=>{P.inv=1e9;if(B.state==='hover')return false});const after=hit();
      B.infCD=0;B.state='infernoWind';B.t=1;B.infDir=1;g.sim(1.1,()=>{P.inv=1e9});const second=hit();
      return [first,after,second,B.state]""")
    assert abs(r[0]-1)<.01 and abs(r[1]-4)<.01 and abs(r[2]-4)<.01, r
    return 'first inferno armoured, later ones not'

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
    for w,h,cols in [(1280,720,3),(800,600,2),(1366,560,3)]:
        c.resize(w,h); c.js('g.start(1,5);g.setSpores(50);g.openShop()'); c.page.wait_for_timeout(150)
        r=c.page.evaluate("()=>{const c=document.getElementById('card');return [c.scrollHeight<=c.clientHeight+2,getComputedStyle(document.querySelector('.shop-list')).gridTemplateColumns.split(' ').length]}")
        assert r==[True,cols], (w,h,r)
        c.page.screenshot(path=os.path.join(c.root,'tests/out',f'shop_{w}x{h}.png'))
        c.page.keyboard.press('Escape'); c.page.wait_for_timeout(100)
    return 'menus by keyboard, shop fits at 3 window sizes'
