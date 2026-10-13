/* graves — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Graves.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"graves", name:"Graves", label:"Graves", splash:0,
    base:{hp:[625,106], mana:[325,40], ad:[66,4],
          ar:[33,4.6], mr:[33,1.1],
          as:0.475, asPerLevel:3, ms:340},
    abilities_meta:[
      {k:"q", en:"End of the Line", fr:"Terminus"},
      {k:"w", en:"Smoke Screen", fr:"Écran de fumée"},
      {k:"e", en:"Quickdraw", fr:"Ruée vers l'or"},
      {k:"r", en:"Collateral Damage", fr:"Dégâts collatéraux"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[50,75,100,125,150], qBonusAD:0.55, qTotal:[130,200,270,340,410], qTotalBonusAD:[1,1.15,1.3,1.45,1.6], qCd:[13,11.25,9.5,7.75,6],
      wFlat:[60,110,160,210,260], wAP:0.6, wCd:[26,24,22,20,18],
      eCd:[16,15,14,13,12],
      rFlat:[275,425,575], rBonusAD:1.5, rCd:[100,80,60]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — End of the Line */
      A.qDmg = R(T.qFlat,qr) + T.qBonusAD*bonusAD;
      A.qTotal = R(T.qTotal,qr) + R(T.qTotalBonusAD,qr)*bonusAD;
      /* W — Smoke Screen */
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      /* R — Collateral Damage */
      A.rDmg = R(T.rFlat,rr) + T.rBonusAD*bonusAD;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qTotal=0; }
      if(!learned.w){ A.wDmg=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["New Destiny","Nouvelle destinée"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — End of the Line", fr:"Q — Terminus"},
      {id:"w", kind:"spell", en:"W — Smoke Screen", fr:"W — Écran de fumée"},
      {id:"r", kind:"spell", en:"R — Collateral Damage", fr:"R — Dégâts collatéraux"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"endOfTheLine", v:A.qDmg, type:"phys"});
      if(st.id === "w") out.parts.push({n:"smokeScreen", v:A.wDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"collateralDamage", v:A.rDmg, type:"phys"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("damage"), val:n0(A.qTotal)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q / Physical Damage : doublon de Physical Damage, ignore
   - E / Bonus Armor : ligne non modelisee (7 to 19)
   - E / Maximum Bonus Armor : ligne non modelisee (7*8 to 19*8)
   - E / Bonus Magic Resistance : ligne non modelisee (7*0.5 to 19*0.5)
   - E / Maximum Bonus MR : ligne non modelisee (7*0.5*8 to 19*0.5*8)
   - R / Reduced Damage : ligne non modelisee (200 to 440 (+ 120% bonus AD))
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
