/* aurora — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Aurora.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"aurora", name:"Aurora", label:"Aurora", splash:0,
    base:{hp:[607,110], mana:[475,30], ad:[53,3],
          ar:[23,4.5], mr:[32,1.3],
          as:0.668, asPerLevel:2, ms:335},
    abilities_meta:[
      {k:"q", en:"Twofold Hex", fr:"Maléfice"},
      {k:"w", en:"Across the Veil", fr:"Derrière le voile"},
      {k:"e", en:"The Weirding", fr:"Sortilège"},
      {k:"r", en:"Between Worlds", fr:"Entre les mondes"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[45,70,95,120,145], qAP:0.4, qMin:[45,70,95,120,145], qMinAP:0.4, qMax:[67.5,105,142.5,180,217.5], qMaxAP:0.6, qSubsequent:[9,14,19,24,29], qSubsequentAP:0.08, qCd:[9,8.5,8,7.5,7],
      wMs:[20,25,30,35,40], wCd:[22,21,20,19,18],
      eFlat:[80,120,160,200,240], eAP:0.7, eCd:[15,14,13,12,11],
      rFlat:[175,275,375], rAP:0.7, rCc:[1.5,1.75,2], rCd:[140,120,100]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Twofold Hex */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      A.qMin = R(T.qMin,qr) + T.qMinAP*ap;
      A.qMax = R(T.qMax,qr) + T.qMaxAP*ap;
      A.qSubsequent = R(T.qSubsequent,qr) + T.qSubsequentAP*ap;
      /* W — Across the Veil */
      A.wMs = R(T.wMs,wr);
      /* E — The Weirding */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      /* R — Between Worlds */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.rCc = R(T.rCc,rr);
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qMin=0; A.qMax=0; A.qSubsequent=0; }
      if(!learned.w){ A.wMs=0; }
      if(!learned.e){ A.eDmg=0; }
      if(!learned.r){ A.rDmg=0; A.rCc=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Spirit Abjuration","Abjuration spirituelle"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Twofold Hex", fr:"Q — Maléfice"},
      {id:"w", kind:"cast", label:"W", en:"W — Across the Veil", fr:"W — Derrière le voile"},
      {id:"e", kind:"spell", en:"E — The Weirding", fr:"E — Sortilège"},
      {id:"r", kind:"spell", en:"R — Between Worlds", fr:"R — Entre les mondes"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"twofoldHex", v:A.qDmg, type:"magic"});
      if(st.id === "e") out.parts.push({n:"theWeirding", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"betweenWorlds", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("damage"), val:n0(A.qMin)},
         {lab:TR("damage"), val:n0(A.qMax)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("msBonus"), val:"+" + pc(A.wMs)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("comboTime"), val:n0(A.rCc)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q / Subsequent Bolt Maximum Magic Damage : doublon de Magic Damage, ignore
   - W / Invisibility Duration : ligne non modelisee (1 to 1.6 seconds)
   - R / ''Across the Veil'' Duration : ligne non modelisee (4 to 5 seconds)
   - R / Rift Duration : ligne non modelisee (2.25 to 3.25 seconds)
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
