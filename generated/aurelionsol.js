/* aurelionsol — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Aurelion Sol.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"aurelionsol", name:"AurelionSol", label:"Aurelion Sol", splash:0,
    base:{hp:[600,90], mana:[530,40], ad:[58,3.2],
          ar:[22,4], mr:[30,1.3],
          as:0.625, asPerLevel:1.5, ms:340},
    abilities_meta:[
      {k:"q", en:"Breath of Light", fr:"Souffle de lumière"},
      {k:"w", en:"Astral Flight", fr:"Vol astral"},
      {k:"e", en:"Singularity", fr:"Trou noir"},
      {k:"r", en:"Falling Star / The Skies Descend", fr:"Étoile finale/Apocalypse"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qTotal:[146.25,195,243.75,292.5], qTotalAP:1.7875, qFlat:[73.125,97.5,121.875,146.25], qAP:0.89375, qCd:[3,3,3,3,3],
      wFlat:[108,109,110,111,112], wCd:[22,20,18,16,14],
      eFlat:[50,75,100,125,150], eAP:0.6, eCd:[12,12,12,12,12],
      rFlat:[150,250,350], rAP:0.75, rCd:[120,110,100]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Breath of Light */
      A.qTotal = R(T.qTotal,qr) + T.qTotalAP*ap;
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      /* W — Astral Flight */
      A.wDmg = R(T.wFlat,wr);
      /* E — Singularity */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      /* R — Falling Star / The Skies Descend */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qTotal=0; A.qDmg=0; }
      if(!learned.w){ A.wDmg=0; }
      if(!learned.e){ A.eDmg=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Cosmic Creator","Créateur cosmique"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Breath of Light", fr:"Q — Souffle de lumière"},
      {id:"w", kind:"spell", en:"W — Astral Flight", fr:"W — Vol astral"},
      {id:"e", kind:"spell", en:"E — Singularity", fr:"E — Trou noir"},
      {id:"r", kind:"spell", en:"R — Falling Star / The Skies Descend", fr:"R — Étoile finale/Apocalypse"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"breathOfLight", v:A.qDmg, type:"magic"});
      if(st.id === "w") out.parts.push({n:"astralFlight", v:A.wDmg, type:"magic"});
      if(st.id === "e") out.parts.push({n:"singularity", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"fallingStarTheSkiesDescend", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qTotal)},
         {lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q : 2 formes dans le wiki (Breath of Light, Starsurge) — seule la premiere est modelisee
   - W : 2 formes dans le wiki (Astral Flight, Celestial Expansion) — seule la premiere est modelisee
   - E : 2 formes dans le wiki (Singularity, Comet of Legend) — seule la premiere est modelisee
   - R : 3 formes dans le wiki (Falling Star, The Skies Descend, Voice of Light) — seule la premiere est modelisee
   - Q / Magic Damage per Tick : ligne non modelisee (45/8 to 105/8 (+ 55/8% AP))
   - Q / Magic Damage per Second : ligne non modelisee (45 to 105 (+ 55% AP))
   - Q / Secondary Target Damage per Tick : ligne non modelisee ((45/8)*0.5 to (105/8)*0.5 (+ (55/8)*0.5% AP))
   - Q / Secondary Magic Damage per Second : ligne non modelisee (45*0.5 to 105*0.5 (+ 55*0.5% AP))
   - Q / Bonus Magic Damage : doublon de Secondary Target Total Maximum Damage, ignore
   - E : pas de ligne de degats simple, « Total Magic Damage » prise comme ligne principale
   - E / Magic Damage per Tick : ligne non modelisee (2.5 to 7.5 (+ 3% AP))
   - passif : 2 blocs dans le wiki (Cosmic Creator, Center of the Universe) — seul le premier est modelise
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
