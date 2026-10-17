/* kindred — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Kindred.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"kindred", name:"Kindred", label:"Kindred", splash:0,
    base:{hp:[595,104], mana:[300,35], ad:[65,3.25],
          ar:[29,4.7], mr:[33,1.1],
          as:0.625, asPerLevel:3.5, ms:325},
    abilities_meta:[
      {k:"q", en:"Dance of Arrows", fr:"Danse des flèches"},
      {k:"w", en:"Wolf's Frenzy", fr:"Frénésie de Loup"},
      {k:"e", en:"Mounting Dread", fr:"Terreur mortelle"},
      {k:"r", en:"Lamb's Respite", fr:"Repos d'Agneau"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[40,65,90,115,140], qBonusAD:0.75, qCd:[9,9,9,9,9],
      wFlat:[25,30,35,40,45], wBonusAD:0.2, wAP:0.2, wCurPct:1.5, wCd:[18,17,16,15,14],
      eFlat:[80,110,140,170,200], eBonusAD:1, eMissPct:5, eCd:[14,12.5,11,9.5,8],
      rHeal:[225,300,375], rCd:[160,140,120]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Dance of Arrows */
      A.qDmg = R(T.qFlat,qr) + T.qBonusAD*bonusAD;
      /* W — Wolf's Frenzy */
      A.wCurPct = T.wCurPct;   /* % des PV de la cible, applique dans onStep */
      A.wDmg = R(T.wFlat,wr) + T.wBonusAD*bonusAD + T.wAP*ap;
      /* E — Mounting Dread */
      A.eMissPct = T.eMissPct;   /* % des PV de la cible, applique dans onStep */
      A.eDmg = R(T.eFlat,er) + T.eBonusAD*bonusAD;
      /* R — Lamb's Respite */
      A.rHeal = R(T.rHeal,rr);
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wCurPct=0; A.wDmg=0; }
      if(!learned.e){ A.eMissPct=0; A.eDmg=0; }
      if(!learned.r){ A.rHeal=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Mark of the Kindred","Marque de Kindred"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Dance of Arrows", fr:"Q — Danse des flèches"},
      {id:"w", kind:"spell", en:"W — Wolf's Frenzy", fr:"W — Frénésie de Loup"},
      {id:"e", kind:"spell", en:"E — Mounting Dread", fr:"E — Terreur mortelle"},
      {id:"r", kind:"cast", label:"R", en:"R — Lamb's Respite", fr:"R — Repos d'Agneau"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"danceOfArrows", v:A.qDmg, type:"phys"});
      if(st.id === "w") out.parts.push({n:"wolfSFrenzy", v:A.wDmg + cur * A.wCurPct/100, type:"magic"});
      if(st.id === "e") out.parts.push({n:"mountingDread", v:A.eDmg + Math.max(0, hp - cur) * A.eMissPct/100, type:"phys"});
      if(st.id === "r") out.heal = A.rHeal;
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("mPpct"), val:pc(A.wCurPct)},
         {lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("mPpct"), val:pc(A.eMissPct)},
         {lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("healing"), val:n0(A.rHeal)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q / Static Cooldown : ligne non modelisee (4 to 2 seconds)
   - W / Magic Damage : bonus par charge dans « 1.5% (+ 1% per Mark of the Kindred) of target's current health » non modelise
   - W / Monster Damage : ligne non modelisee (25*1.5 to 45*1.5 (+ 20*1.5% bonus AD) (+ 20*1.5% AP) (+ 1.5*1.5% (+ 1*1.5% per Mark of the Kindred) of target's current health))
   - E / Additional Physical Damage : bonus par charge dans « 5% (+ 0.5% per Mark of the Kindred) of target's missing health » non modelise
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   - W : « Wolf's Frenzy » invoque une unite — ses propres degats ne sont pas dans les donnees de la competence
   ------------------------------------------------------------------ */
