/* ---------- level 4 music ---------- */
Object.assign(SONGS,{
  // ice cave: chilly C-sharp minor with a glassy bell lead
  ice:compileSong({bpm:118,vol:1,order:['intro','A','B','A2','C','B'],variant:{lw:'triangle',lv:.3,arp:'1.5.8.5.3.5.8.5.'},
    bass:'R...R.O.R...R.O.', arp:'8.5.3.5.1.5.3.5.', kick:'x.......x.......', snare:'....x.......x...', hat:'..x...x...x...x.', lw:12, lv:.17,
    sections:{
      intro:{chords:['C#m','A','E','G#'],lead:'r:64',kick:'x...............',snare:'................',hat:'........x.......',bass:'R.......R.......'},
      A:{chords:['C#m','C#m','A','B','C#m','G#m','A','G#'],
        lead:`C#5:2 E5:2 G#5:4 F#5:2 E5:2 D#5:2 E5:2  G#5:4 C#6:4 B5:2 G#5:2 E5:4  A5:2 C#6:2 E6:4 D#6:2 C#6:2 B5:4  F#5:4 A5:2 B5:2 D#6:4 B5:4
              C#6:4 B5:2 G#5:2 E5:4 G#5:4  D#5:2 F#5:2 B5:4 A#5:2 G#5:2 F#5:4  E5:2 A5:2 C#6:4 B5:2 A5:2 E5:4  G#5:6 C6:2 D#6:8`},
      B:{chords:['A','B','G#m','C#m','A','B','G#','G#'],
        lead:`E6:4 C#6:4 A5:8  F#6:4 D#6:4 B5:8  D#6:2 C#6:2 B5:2 G#5:2 D#5:4 G#5:4  E5:2 G#5:2 C#6:4 E6:8
              A5:2 C#6:2 E6:4 A6:4 G#6:4  F#6:4 D#6:2 B5:2 F#5:4 D#6:4  C6:4 D#6:4 G#6:4 F#6:4  D#6:8 G#5:8`},
      C:{chords:['C#m','A','E','B','C#m','A','G#','G#'],lw:'triangle',lv:.32,arp:'1...5...3...5...',kick:'x...............',snare:'................',hat:'....x.......x...',bass:'R.......O.......',
        lead:`G#4:8 C#5:4 E5:4  E5:6 C#5:2 A4:8  B4:4 E5:4 G#5:6 F#5:2  F#5:12 D#5:4  E5:4 D#5:4 C#5:4 G#4:4  A4:4 C#5:4 E5:8  F#5:6 E5:2 D#5:4 C6:4  G#5:16`},
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
