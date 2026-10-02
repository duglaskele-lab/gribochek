#!/usr/bin/env python3
"""Headless tests for the game (needs: pip install playwright && playwright install chromium).

  python3 tests/run.py                 list the tests and their tags
  python3 tests/run.py smoke boss4     run tests by name or tag
  python3 tests/run.py --changed       run only what the changed files can affect (git diff + untracked), plus smoke
  python3 tests/run.py --all           everything
  python3 tests/run.py --files src/levels/ice/snowman.js     same as --changed, for the given files

The game is built first (python3 build.py) unless --no-build is given. Screenshots go to tests/out/.
Game logic is driven with dbg.freeze() + dbg.sim(seconds): no waiting for real time.
"""
import os, sys, subprocess, json, time, fnmatch
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from zones import ZONES, ALWAYS
import cases

def changed_files():
    try:
        out=subprocess.run(['git','status','--porcelain'],cwd=ROOT,capture_output=True,text=True).stdout
        return [l[3:].strip() for l in out.splitlines() if l.strip()]
    except Exception: return []

def tags_for(files):
    tags=set(ALWAYS)
    for f in files:
        hit=False
        for pat,tg in ZONES:
            if fnmatch.fnmatch(f,pat): tags.update(tg); hit=True; break   # first (most specific) match wins
        if not hit and f.startswith('src/'): return None   # unknown source file: run everything
    return tags

def main():
    args=[a for a in sys.argv[1:]]
    build='--no-build' not in args; args=[a for a in args if a!='--no-build']
    tests=cases.TESTS
    if not args:
        for t in tests: print(f"{t.name:16} {' '.join(t.tags)}")
        return 0
    if '--all' in args: sel=tests
    else:
        if '--changed' in args or '--files' in args:
            files=args[args.index('--files')+1:] if '--files' in args else changed_files()
            want=tags_for(files)
            print('changed:',', '.join(files) or '(nothing)')
        else: want=set(args)
        sel=tests if want is None else [t for t in tests if t.name in want or want&set(t.tags)]
    print('running:',' '.join(t.name for t in sel))
    if build and subprocess.run([sys.executable,os.path.join(ROOT,'build.py')]).returncode: return 1
    from playwright.sync_api import sync_playwright
    os.makedirs(os.path.join(ROOT,'tests/out'),exist_ok=True)
    fails=0; t0=time.time()
    with sync_playwright() as p:
        br=p.chromium.launch()
        for t in sel:
            ctx=cases.Ctx(br,ROOT)
            s=time.time()
            try:
                msg=t.fn(ctx) or ''
                if ctx.errors: raise AssertionError('page errors: '+'; '.join(ctx.errors[:3]))
                print(f'  ok    {t.name:16} {time.time()-s:5.1f}s  {msg}')
            except Exception as e:
                fails+=1; print(f'  FAIL  {t.name:16} {time.time()-s:5.1f}s  {type(e).__name__}: {e}')
            finally: ctx.close()
        br.close()
    print(f'{len(sel)-fails}/{len(sel)} passed in {time.time()-t0:.1f}s')
    return 1 if fails else 0

if __name__=='__main__': sys.exit(main())
