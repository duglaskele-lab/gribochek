#!/usr/bin/env python3
"""Builds the single-file game dist/gribochek.html from src/.

  python3 build.py            build with  // ==== file ====  markers between source files
  python3 build.py --plain    build without markers (byte-for-byte like the old single file)

The source files are pieces of ONE function body (the game runs inside one closure),
so they are not standalone scripts: they share variables and are glued in the order of src/manifest.txt.
Top-level code runs in that order, so a file may only use, at load time, what earlier files define
(functions are hoisted, const/let are not). dist/linemap.txt maps lines of the built file back to sources.
"""
import base64, os, sys, subprocess, shutil
ROOT=os.path.dirname(os.path.abspath(__file__))
def rd(p):
    t=open(os.path.join(ROOT,p),encoding='utf-8').read()
    return t[:-1] if t.endswith('\n') else t   # drop only the final newline (blank lines inside stay)
def build(markers=True, out='dist/gribochek.html'):
    files=[l.strip() for l in rd('src/manifest.txt').splitlines() if l.strip() and not l.strip().startswith('#')]
    atlas=base64.b64encode(open(os.path.join(ROOT,'assets/sprites.png'),'rb').read()).decode()
    raith=base64.b64encode(open(os.path.join(ROOT,'assets/raith.webp'),'rb').read()).decode()   # Raithwyn's frames
    page=(rd('src/page.html').replace('{{STYLE}}',rd('src/style.css'))
          .replace('{{PRE}}',rd('src/sprites/frames.js')).replace('{{ATLAS}}',atlas).replace('{{RAITH}}',raith))
    head,tail=page.split('{{CODE}}')
    line=head.count('\n')+1            # 1-based line of the first code line
    chunks=[];linemap=[]
    for f in files:
        body=rd('src/'+f)
        if markers: chunks.append(f'// ==== {f} ===='); line+=1
        n=body.count('\n')+1; linemap.append((line,line+n-1,f)); line+=n
        chunks.append(body)
    html=head+'\n'.join(chunks)+tail+'\n'
    shift=0
    os.makedirs(os.path.join(ROOT,'dist'),exist_ok=True)
    open(os.path.join(ROOT,out),'w',encoding='utf-8').write(html)
    with open(os.path.join(ROOT,'dist/linemap.txt'),'w') as fh:
        for a,b,f in linemap: fh.write(f'{a+shift}-{b+shift}\t{f}\n')
    return html
def where(line):
    """built-file line number -> (source file, line in it)"""
    for l in open(os.path.join(ROOT,'dist/linemap.txt')):
        r,f=l.strip().split('\t');a,b=map(int,r.split('-'))
        if a<=line<=b: return f,line-a+1
    return None
def syntax_check(html):
    if not shutil.which('node'): return True
    code=html.split('<script>')[2].split('</script>')[0] if html.count('<script>')>1 else html.split('<script>')[1].split('</script>')[0]
    p=subprocess.run(['node','--check','-'],input=code,text=True,capture_output=True)
    if p.returncode: print(p.stderr); return False
    return True
if __name__=='__main__':
    if len(sys.argv)>2 and sys.argv[1]=='--where': print(where(int(sys.argv[2]))); sys.exit()
    h=build(markers='--plain' not in sys.argv)
    ok=syntax_check(h)
    print(('built' if ok else 'BUILT WITH SYNTAX ERRORS'), 'dist/gribochek.html', f'{len(h)//1024} KB')
    sys.exit(0 if ok else 1)
