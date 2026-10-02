#!/usr/bin/env python3
"""Cuts Raithwyn's sprite sheet into frames and packs them into assets/raith.webp + src/sprites/raith.js.

  python3 tools/raith_atlas.py path/to/sheet.webp
  python3 tools/raith_atlas.py --edited path/to/edited_atlas.webp

The second form takes an edited copy of assets/raith.webp itself (possibly resized, e.g. by an image upload):
the frames are found where the current src/sprites/raith.js puts them, scaled to the new image size.

The sheet has one animation per row on a transparent background, frames separated by empty columns:
idle 1, jump 5, run 6, walk 8, hurt 2, laugh 4, punch 5, punch2 5. Each frame is cropped tight; its anchor x is the
middle of the head (the top quarter of the sprite), so the body stays put while the tail and arms swing.
"""
import sys, os, json
from PIL import Image
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAMES=['idle','jump','run','walk','hurt','laugh','punch','punch2']
def opaque(a,x,y): return a[x,y]>20
def save(crops):
    """pack (name, image, anchor x) frames into assets/raith.webp and write src/sprites/raith.js"""
    AW=2048; cx=cy=sh=0; place=[]; frames={}
    for name,fr,ax in crops:
        fw,fh=fr.size
        if cx+fw>AW: cx=0; cy+=sh+2; sh=0
        place.append((name,fr,ax,cx,cy)); cx+=fw+2; sh=max(sh,fh)
    atlas=Image.new('RGBA',(AW,cy+sh))
    for name,fr,ax,x,y in place:
        atlas.paste(fr,(x,y)); frames.setdefault(name,[]).append([x,y,fr.size[0],fr.size[1],round(ax,1)])
    atlas.save(os.path.join(ROOT,'assets/raith.webp'),'WEBP',quality=90,method=6)
    with open(os.path.join(ROOT,'src/sprites/raith.js'),'w') as f:
        f.write('/* ---------- Raithwyn: frames of assets/raith.webp (made by tools/raith_atlas.py) ---------- */\n')
        f.write('// [x, y, w, h, anchor x]; the sprite stands on its bottom edge\n')
        f.write('const RAITH_FRAMES='+json.dumps(frames,separators=(',',':'))+';\n')
    print(atlas.size, {k:len(v) for k,v in frames.items()}, os.path.getsize(os.path.join(ROOT,'assets/raith.webp')))
def head_anchor(fr):
    fa=fr.split()[3].load(); fw,fh=fr.size; top=max(1,fh//4)
    xs=[xx for yy in range(top) for xx in range(fw) if fa[xx,yy]>20]
    return sum(xs)/len(xs)
def from_edited(src):
    import re,math
    old=json.loads(re.search(r'RAITH_FRAMES=(\{.*\});',open(os.path.join(ROOT,'src/sprites/raith.js')).read()).group(1))
    oldsize=Image.open(os.path.join(ROOT,'assets/raith.webp')).size
    im=Image.open(src).convert('RGBA'); kx=im.size[0]/oldsize[0]; ky=im.size[1]/oldsize[1]; crops=[]
    for name in NAMES:
        for x,y,w,h,ax in old[name]:
            # stay inside the old rectangle (rounded inwards) so no sliver of a neighbour frame comes along
            box=(math.ceil(x*kx),math.ceil(y*ky),math.floor((x+w)*kx),math.floor((y+h)*ky))
            fr=im.crop(box); fr=fr.crop(fr.getbbox()); crops.append((name,fr,head_anchor(fr)))
    save(crops)
def main(src):
    im=Image.open(src).convert('RGBA'); W,H=im.size; a=im.split()[3].load()
    rows=[any(opaque(a,x,y) for x in range(0,W,2)) for y in range(H)]
    bands=[];y=0
    while y<H:
        if rows[y]:
            y0=y
            while y<H and rows[y]: y+=1
            bands.append((y0,y))
        y+=1
    assert len(bands)==len(NAMES), bands
    crops=[]
    for name,(y0,y1) in zip(NAMES,bands):
        cols=[any(opaque(a,x,y) for y in range(y0,y1)) for x in range(W)]
        x=0
        while x<W:
            if cols[x]:
                x0=x
                while x<W and cols[x]: x+=1
                box=im.crop((x0,y0,x,y1)).getbbox(); fr=im.crop((x0,y0,x,y1)).crop(box)
                crops.append((name,fr,head_anchor(fr)))
            x+=1
    save(crops)
if __name__=='__main__':
    if sys.argv[1]=='--edited': from_edited(sys.argv[2])
    else: main(sys.argv[1])
