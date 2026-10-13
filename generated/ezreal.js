/* ezreal — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Ezreal.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"ezreal", name:"Ezreal", label:"Ezreal", splash:0,
    base:{hp:[600,102], mana:[375,70], ad:[60,3.75],
          ar:[24,4.2], mr:[33,1.1],
          as:0.625, asPerLevel:2.5, ms:325},
    abilities_meta:[
      {k:"q", en:"Mystic Shot", fr:"Tir mystique"},
      {k:"w", en:"Essence Flux", fr:"Flux essentiel"},
      {k:"e", en:"Arcane Shift", fr:"Transfert arcanique"},
      {k:"r", en:"Trueshot Barrage", fr:"Arc térébrant"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[20,45,70,95,120], qAD:1.3, qAP:0.4, qCd:[5.5,5.25,5,4.75,4.5],
      wFlat:[80,135,190,245,300], wBonusAD:1, wAP:0.9, wCd:[8,8,8,8,8],
      eFlat:[80,130,180,230,280], eBonusAD:0.6, eAP:0.75, eCd:[26,23,20,17,14],
      rFlat:[350,550,750], rBonusAD:1, rAP:1.1, rModified:[150,225,300], rModifiedBonusAD:1, rModifiedAP:1.1, rCd:[120,105,90]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Mystic Shot */
      A.qDmg = R(T.qFlat,qr) + T.qAD*tot.ad + T.qAP*ap;
      /* W — Essence Flux */
      A.wDmg = R(T.wFlat,wr) + T.wBonusAD*bonusAD + T.wAP*ap;
      /* E — Arcane Shift */
      A.eDmg = R(T.eFlat,er) + T.eBonusAD*bonusAD + T.eAP*ap;
      /* R — Trueshot Barrage */
      A.rDmg = R(T.rFlat,rr) + T.rBonusAD*bonusAD + T.rAP*ap;
      A.rModified = R(T.rModified,rr) + T.rModifiedBonusAD*bonusAD + T.rModifiedAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wDmg=0; }
      if(!learned.e){ A.eDmg=0; }
      if(!learned.r){ A.rDmg=0; A.rModified=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Rising Spell Force","Force grandissante"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Mystic Shot", fr:"Q — Tir mystique"},
      {id:"w", kind:"spell", en:"W — Essence Flux", fr:"W — Flux essentiel"},
      {id:"e", kind:"spell", en:"E — Arcane Shift", fr:"E — Transfert arcanique"},
      {id:"r", kind:"spell", en:"R — Trueshot Barrage", fr:"R — Arc térébrant"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"mysticShot", v:A.qDmg, type:"phys"});
      if(st.id === "w") out.parts.push({n:"essenceFlux", v:A.wDmg, type:"magic"});
      if(st.id === "e") out.parts.push({n:"arcaneShift", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"trueshotBarrage", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("damage"), val:n0(A.rModified)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
