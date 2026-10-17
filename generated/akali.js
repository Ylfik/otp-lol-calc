/* akali — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Akali.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"akali", name:"Akali", label:"Akali", splash:0,
    base:{hp:[600,119], mana:[200,0], ad:[62,3.3],
          ar:[23,4.7], mr:[37,2.05],
          as:0.625, asPerLevel:3.2, ms:345},
    abilities_meta:[
      {k:"q", en:"Five Point Strike", fr:"Vague de kunais"},
      {k:"w", en:"Twilight Shroud", fr:"Linceul nébuleux"},
      {k:"e", en:"Shuriken Flip", fr:"Lancer acrobatique"},
      {k:"r", en:"Perfect Execution", fr:"Maîtrise absolue"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[45,70,95,120,145], qAD:0.65, qAP:0.6, qCd:[1.5,1.5,1.5,1.5,1.5],
      wMs:[30,35,40,45,50], wCd:[20,19,18,17,16],
      eFlat:[21,42,63,84,105], eAD:0.3, eAP:0.33, eTotal:[70,140,210,280,350], eTotalAD:1, eTotalAP:1.1, eCd:[16,14.5,13,11.5,10],
      rFlat:[110,220,330], rBonusAD:0.5, rAP:0.3, rMin:[70,140,210], rMinAP:0.3, rMax:[210,420,630], rMaxAP:0.9, rCd:[120,90,60]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Five Point Strike */
      A.qDmg = R(T.qFlat,qr) + T.qAD*tot.ad + T.qAP*ap;
      /* W — Twilight Shroud */
      A.wMs = R(T.wMs,wr);
      /* E — Shuriken Flip */
      A.eDmg = R(T.eFlat,er) + T.eAD*tot.ad + T.eAP*ap;
      A.eTotal = R(T.eTotal,er) + T.eTotalAD*tot.ad + T.eTotalAP*ap;
      /* R — Perfect Execution */
      A.rDmg = R(T.rFlat,rr) + T.rBonusAD*bonusAD + T.rAP*ap;
      A.rMin = R(T.rMin,rr) + T.rMinAP*ap;
      A.rMax = R(T.rMax,rr) + T.rMaxAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wMs=0; }
      if(!learned.e){ A.eDmg=0; A.eTotal=0; }
      if(!learned.r){ A.rDmg=0; A.rMin=0; A.rMax=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Assassin's Mark","Marque d'assassin"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Five Point Strike", fr:"Q — Vague de kunais"},
      {id:"w", kind:"cast", label:"W", en:"W — Twilight Shroud", fr:"W — Linceul nébuleux"},
      {id:"e", kind:"spell", en:"E — Shuriken Flip", fr:"E — Lancer acrobatique"},
      {id:"r", kind:"spell", en:"R — Perfect Execution", fr:"R — Maîtrise absolue"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"fivePointStrike", v:A.qDmg, type:"magic"});
      if(st.id === "e") out.parts.push({n:"shurikenFlip", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"perfectExecution", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("msBonus"), val:"+" + pc(A.wMs)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("damage"), val:n0(A.eTotal)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("damage"), val:n0(A.rMin)},
         {lab:TR("damage"), val:n0(A.rMax)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q : 2 formes dans le wiki (Five Point Strike, Mark of the Assassin) — seule la premiere est modelisee
   - E : 2 formes dans le wiki (Shuriken Flip, Crescent Slash) — seule la premiere est modelisee
   - R : 2 formes dans le wiki (Perfect Execution, Shadow Dance) — seule la premiere est modelisee
   - W / Shroud Duration : ligne non modelisee (5 to 7 seconds)
   - E / Magic Damage : doublon de Magic Damage, ignore
   - passif : 2 blocs dans le wiki (Assassin's Mark, Twin Disciplines) — seul le premier est modelise
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   - ressource particuliere (Energy) : non modelisee
   ------------------------------------------------------------------ */
