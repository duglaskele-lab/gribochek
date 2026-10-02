/* ---------- level 4 music ---------- */
Object.assign(SONGS,{
  // ice cave: a slow, melancholic E minor; a soft sine lead over long bass notes, crystal chimes and gusts of snowy wind
  ice:compileSong({bpm:84,vol:1.1,order:['intro','A','B','A2','C','B'],variant:{lw:'triangle',lv:.26,bell:'b...b.....b.b...'},
    bass:'R.......O.......', arp:'1.....5.....8...', kick:'................', snare:'................', hat:'................',
    lw:'sine', lv:.34, av:.022, bv:.36, bell:'b.....b.......b.', wind:'w...............',
    sections:{
      intro:{chords:['Em','C','G','D'],lead:'r:64',arp:'................',bell:'b.......b...b...'},
      A:{chords:['Em','C','G','D','Em','C','Am','B'],
        lead:`B4:6 E5:2 G5:8  E5:6 G5:2 C6:8  B5:4 A5:4 G5:4 D5:4  F#5:12 A5:4
              G5:6 F#5:2 E5:8  C5:4 E5:4 G5:8  A5:6 G5:2 E5:4 C5:4  D#5:16`},
      B:{chords:['C','D','Bm','Em','Am','D','G','B'],
        lead:`E5:4 G5:4 C6:8  D6:6 C6:2 A5:8  B5:4 F#5:4 D5:8  E5:12 r:4
              C6:4 B5:4 A5:4 E5:4  F#5:6 A5:2 D6:8  B5:4 G5:4 D5:4 G5:4  F#5:8 D#5:8`},
      C:{chords:['Am','Em','C','B','Am','Em','C','B'],arp:'................',bass:'R...............',bell:'b...b...b...b...',
        lead:`r:4 E6:4 C6:8  r:4 B5:4 G5:8  r:4 E5:4 G5:4 C6:4  B5:16
              r:4 A5:4 C6:8  B5:4 G5:4 E5:8  E5:4 G5:4 C6:4 E6:4  D#6:16`},
    }}),
  // snowman: bouncy, menacing G minor march with guitar stabs
  snowman:compileSong({bpm:164,vol:1.2,order:['intro','A','B','A2','B'],variant:{lw:12,lv:.2,hat:'xxxxxxxxxxxxxxxx'},
    bass:'R.RRO.R.R.RRO.RO', arp:'8.5.3.5.8.5.3.5.', kick:'x..x..x.x..x..x.', snare:'....x.......x...', hat:'x.x.x.x.x.x.x.x.', lw:25, lv:.24, bv:.5, av:.035,
    sections:{
      intro:{chords:['Gm','Gm','Eb','D'],lead:'r:64',kick:'x...x...x...x...',snare:'................',gtr:'X...............'},
      A:{chords:['Gm','Gm','Eb','F','Gm','Gm','Eb','D'],
        lead:`G5:2 Bb5:2 D6:4 C6:2 Bb5:2 A5:4  Bb5:2 A5:2 G5:2 D5:2 G5:8  Eb5:2 G5:2 Bb5:4 Eb6:4 D6:4  C6:2 A5:2 F5:4 A5:4 C6:4
              D6:4 G6:2 F6:2 D6:4 Bb5:4  C6:2 D6:2 Bb5:2 G5:2 D5:8  Eb6:4 D6:2 C6:2 G5:4 Bb5:4  A5:4 F#5:4 D5:4 F#5:4`},
      B:{chords:['Cm','D','Gm','Gm','Eb','F','D','D'],gtr:'X.......X.......',
        lead:`G5:4 C6:4 Eb6:8  F#6:4 D6:4 A5:8  Bb5:2 A5:2 G5:2 D5:2 G5:4 Bb5:4  D6:16
              Eb6:2 D6:2 C6:2 G5:2 Eb6:4 G6:4  F6:4 C6:4 A5:4 F5:4  F#5:2 A5:2 D6:2 F#6:2 A6:4 F#6:4  D6:8 A5:8`},
    }}),
});
