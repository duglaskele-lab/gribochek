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
def boss_fight(c,level,expect_states=()):
    c.js(f'g.startBoss({level});g.freeze();')
    # walk into the arena and let it lock
    c.js("const P=g.P;P.inv=1e9;P.x=g.arena[0]+300;P.y=g.P.y;")
    c.js("const P=g.P,G=g.grid,c=Math.floor(P.x/40);let r=0;while(r<G.length-1&&!(G[r][c]===1||G[r][c]===2))r++;P.y=r*40-58;P.vy=0")
    c.sim(1.5,"g.P.inv=1e9;")
    if not c.js('return g.arenaLocked'): c.js('g.lock()')
    seen=c.js("""const seen=new Set();const P=g.P;
      g.sim(45,i=>{P.inv=1e9;if(P.hp<1)P.hp=3;seen.add(g.B.state);
        if(i%420===0){P.x=g.arena[0]+80+Math.random()*(g.arena[1]-g.arena[0]-160)}
        if(i===2700)g.B.hp=g.B.max?g.B.max*.4:g.B.hp});
      return [...seen]""")
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
    return boss_fight(c,4,['idle','slamWind','slam','punchWind','punch','upperWind','upper','volleyWind','volley',
                           'hopWind','hop','splitWind','split','reform','enrage'])

# ------------------------------------------------------------------ ice cave
@test('ice_physics','ice')
def ice_physics(c):
    def slide(fv):
        for seed in range(1,40):
            c.start(4,seed)
            ok=c.js(f"""const G=g.grid,F=g.flow;for(let x=20;x<300;x++)for(let r=3;r<22;r++){{let n=0;
              while(G[r][x+n]===1&&F[r][x+n]==={fv}&&G[r-1][x+n]===0&&G[r-2][x+n]===0&&n<14)n++;
              if(n>=14){{const P=g.P;P.x=x*40+5;P.y=r*40-58;P.vx=275;P.vy=0;P.onGround=true;return true}}}}return false""")
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
