/* katarina — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Katarina.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"katarina", name:"Katarina", label:"Katarina", splash:0,
    base:{hp:[672,108], mana:[0,0], ad:[58,3.2],
          ar:[32,4.7], mr:[32,2.05],
          as:0.658, asPerLevel:2.74, ms:335},
    abilities_meta:[
      {k:"q", en:"Bouncing Blade", fr:"Lame rebondissante"},
      {k:"w", en:"Preparation", fr:"Préparation"},
      {k:"e", en:"Shunpo", fr:"Shunpo"},
      {k:"r", en:"Death Lotus", fr:"Lotus mortel"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[80,115,150,185,220], qAP:0.4, qCd:[11,10,9,8,7],
      wMs:[50,60,70,80,90], wCd:[15,14,13,12,11],
      eFlat:[20,30,40,50,60], eAD:0.4, eAP:0.25, eCd:[12,11,10,9,8],
      rMax:240, rMax2:[375,562.5,750], rMaxAP:2.85, rFlat:[25,30,35], rCd:[75,60,45]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Bouncing Blade */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      /* W — Preparation */
      A.wMs = R(T.wMs,wr);
      /* E — Shunpo */
      A.eDmg = R(T.eFlat,er) + T.eAD*tot.ad + T.eAP*ap;
      /* R — Death Lotus */
      A.rMax = (T.rMax)/100*bonusAD;
      A.rMax = R(T.rMax2,rr) + T.rMaxAP*ap;
      A.rDmg = R(T.rFlat,rr);
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wMs=0; }
      if(!learned.e){ A.eDmg=0; }
      if(!learned.r){ A.rMax=0; A.rMax=0; A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Voracity","Voracité"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Bouncing Blade", fr:"Q — Lame rebondissante"},
      {id:"w", kind:"cast", label:"W", en:"W — Preparation", fr:"W — Préparation"},
      {id:"e", kind:"spell", en:"E — Shunpo", fr:"E — Shunpo"},
      {id:"r", kind:"spell", en:"R — Death Lotus", fr:"R — Lotus mortel"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"bouncingBlade", v:A.qDmg, type:"magic"});
      if(st.id === "e") out.parts.push({n:"shunpo", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"deathLotus", v:A.rDmg, type:"magic"});
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
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rMax)},
         {lab:TR("damage"), val:n0(A.rMax)},
         {lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - R / Physical Damage Per Dagger : ligne non modelisee (16% (+ 50% per 100% bonus attack speed) bonus AD)
   - R / Maximum Physical Damage : ratio sans statistique « 50*15% per 100% bonus attack speed » non modelise
   - R / Magic Damage Per Dagger : ligne non modelisee (25 to 50 (+ 19% AP))
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
