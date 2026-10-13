/* ---------- level 5 music ---------- */
Object.assign(SONGS,{
  // the ruined city: a brooding E minor at a walking pace, a square lead over a dark bass and distant guitar stabs
  city:compileSong({bpm:112,vol:1.1,order:['intro','A','B','A2','C','B'],variant:{lw:'triangle',lv:.3,arp:'1.5.8.5.3.5.8.5.'},
    bass:'R...R.O.R...R.O.', arp:'1...5...8...5...', kick:'x.......x.x.....', snare:'....x.......x...', hat:'..x...x...x...x.',
    lw:'square', lv:.16, av:.03, bv:.46, gtr:'X...............',
    sections:{
      intro:{chords:['Em','Em','C','B'],lead:'r:64',kick:'x...............',snare:'................',hat:'........x.......'},
      A:{chords:['Em','C','Am','B','Em','C','D','B'],
        lead:`E5:4 G5:2 B5:2 A5:4 G5:4  E5:2 G5:2 C6:4 B5:4 G5:4  A5:4 C6:2 E6:2 D6:4 C6:4  B5:8 D#5:4 F#5:4
              G5:4 B5:2 E6:2 D6:4 B5:4  C6:4 G5:4 E5:4 G5:4  F#5:4 A5:2 D6:2 C6:4 A5:4  B5:12 r:4`},
      B:{chords:['Am','Em','C','D','Am','Em','B','B'],gtr:'X.......X.......',
        lead:`A5:2 B5:2 C6:4 E6:4 C6:4  B5:6 G5:2 E5:8  C6:4 E6:4 G6:4 E6:4  F#6:6 D6:2 A5:8
              A5:2 C6:2 E6:4 A6:4 E6:4  G6:4 E6:4 B5:4 G5:4  F#5:2 A5:2 B5:2 D#6:2 F#6:4 D#6:4  B5:16`},
      C:{chords:['Em','C','Am','B'],lw:'sine',lv:.32,arp:'................',kick:'................',snare:'................',hat:'....x.......x...',bass:'R...............',
        lead:`E5:8 B4:8  C5:8 G5:8  A5:8 E5:8  D#5:16`},
    }}),
  // the Mutank: a grinding C minor at full throttle, chugging guitar, tritone stabs
  mutank:compileSong({bpm:168,vol:1.25,crash:1,order:['intro','A','B','C','A2','B'],variant:{lw:12,lv:.2,hat:'xxxxxxxxxxxxxxxx'},
    bass:'RR.RRR.ORR.RRFRO', arp:'................', kick:'x.x...x.x.x...x.', snare:'....x.......x...', hat:'x.xxx.xxx.xxx.xx', lw:25, lv:.24, bv:.52, gtr:'X..X..X.X..X..X.',
    sections:{
      intro:{chords:['Cm','Cm','Ab','G'],lw:'square',lv:.16,snare:'....x.......x.xx',
        lead:`C5:1 r:1 C5:1 r:1 Eb5:2 C5:2 F#5:2 G5:2 Eb5:2 C5:2  C5:1 r:1 C5:1 r:1 Eb5:2 C5:2 F#5:2 G5:2 Eb5:2 C5:2
              Ab4:1 r:1 Ab4:1 r:1 C5:2 Ab4:2 D5:2 Eb5:2 C5:2 Ab4:2  G4:2 B4:2 D5:2 G5:2 Ab5:2 G5:2 F5:2 D5:2`},
      A:{chords:['Cm','Cm','Ab','G','Cm','Eb','F','G'],
        lead:`G5:2 C6:2 r:1 C6:1 Bb5:2 C6:2 Eb6:2 D6:2 C6:2  G5:2 C6:2 r:1 C6:1 Bb5:2 G5:4 F5:2 Eb5:2  Ab5:2 C6:2 Eb6:4 D6:2 C6:2 Bb5:2 C6:2  B5:4 D6:4 G6:4 F6:2 D6:2
              C6:2 Eb6:2 G6:2 Eb6:2 C6:2 G5:2 C6:4  Bb5:2 C6:2 D6:2 Eb6:2 F6:2 Eb6:2 D6:2 Bb5:2  Ab5:2 C6:2 F6:4 Eb6:2 C6:2 Ab5:2 F5:2  G5:1 G5:1 B5:2 D6:2 G6:6 r:4`},
      B:{chords:['Fm','Cm','Ab','G','Fm','Ab','G','G'],hat:'xxxxxxxxxxxxxxxx',
        lead:`F6:4 C6:2 Ab5:2 F5:4 Ab5:4  G5:2 C6:2 Eb6:4 G6:4 Eb6:4  F6:2 Eb6:2 C6:2 Ab5:2 C6:4 F6:4  G6:2 F6:2 D6:2 B5:2 G5:4 B5:4
              Ab5:2 G5:2 F5:2 Ab5:2 C6:2 F6:2 Ab6:4  G6:2 F6:2 Eb6:2 C6:2 Ab5:4 C6:4  D6:2 Eb6:2 F6:2 G6:2 Ab6:4 G6:4  B6:4 G6:4 D6:4 B5:4`},
      C:{chords:['Cm','Ab','Fm','G'],kick:'x.......x.x.....',snare:'........x.......',hat:'x.x.x.x.x.x.x.x.',bass:'R.......R.R.....',gtr:'X...............',
        lead:`C6:2 r:6 G5:2 r:6  Ab5:2 r:6 Eb5:2 r:6  F5:2 r:6 C5:2 r:6  G5:1 B5:1 D6:1 G6:1 B6:4 r:8`},
    }}),
});
