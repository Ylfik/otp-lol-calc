/* naafiri — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Naafiri.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"naafiri", name:"Naafiri", label:"Naafiri", splash:0,
    base:{hp:[610,105], mana:[400,55], ad:[55,2],
          ar:[28,4.2], mr:[32,2.05],
          as:0.663, asPerLevel:2.1, ms:340},
    abilities_meta:[
      {k:"q", en:"Darkin Daggers", fr:"Dagues des Darkin"},
      {k:"w", en:"The Call of the Pack", fr:"Appel de la meute"},
      {k:"e", en:"Eviscerate", fr:"Éviscération"},
      {k:"r", en:"Hounds' Pursuit", fr:"Hallali"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[35,40,45,50,55], qBonusAD:0.2, qTotal:[35,60,85,110,135], qTotalBonusAD:0.8, qMin:[30,42.5,55,67.5,80], qMinBonusAD:0.4, qMax:[60,85,110,135,160], qMaxBonusAD:1.4, qHeal:[45,60,75,90,105], qHealBonusAD:0.4, qCd:[9,8.5,8,7.5,7],
      wMs:[20,22.5,25,27.5,30], wCd:[26,24,22,20,18],
      eFlat:[15,25,35,45,55], eBonusAD:0.4, eFlurry:[60,85,110,135,160], eFlurryBonusAD:0.8, eTotal:[75,110,145,180,215], eTotalBonusAD:1.2, eCd:[11,10,9,8,7],
      rFlat:[125,200,275], rBonusAD:1, rShield:[100,150,200], rShieldBonusAD:1.5, rCd:[110,95,80]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Darkin Daggers */
      A.qDmg = R(T.qFlat,qr) + T.qBonusAD*bonusAD;
      A.qTotal = R(T.qTotal,qr) + T.qTotalBonusAD*bonusAD;
      A.qMin = R(T.qMin,qr) + T.qMinBonusAD*bonusAD;
      A.qMax = R(T.qMax,qr) + T.qMaxBonusAD*bonusAD;
      A.qHeal = R(T.qHeal,qr) + T.qHealBonusAD*bonusAD;
      /* W — The Call of the Pack */
      A.wMs = R(T.wMs,wr);
      /* E — Eviscerate */
      A.eDmg = R(T.eFlat,er) + T.eBonusAD*bonusAD;
      A.eFlurry = R(T.eFlurry,er) + T.eFlurryBonusAD*bonusAD;
      A.eTotal = R(T.eTotal,er) + T.eTotalBonusAD*bonusAD;
      /* R — Hounds' Pursuit */
      A.rDmg = R(T.rFlat,rr) + T.rBonusAD*bonusAD;
      A.rShield = R(T.rShield,rr) + T.rShieldBonusAD*bonusAD;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qTotal=0; A.qMin=0; A.qMax=0; A.qHeal=0; }
      if(!learned.w){ A.wMs=0; }
      if(!learned.e){ A.eDmg=0; A.eFlurry=0; A.eTotal=0; }
      if(!learned.r){ A.rDmg=0; A.rShield=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["We Are More","La meute s'agrandit"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Darkin Daggers", fr:"Q — Dagues des Darkin"},
      {id:"w", kind:"cast", label:"W", en:"W — The Call of the Pack", fr:"W — Appel de la meute"},
      {id:"e", kind:"spell", en:"E — Eviscerate", fr:"E — Éviscération"},
      {id:"r", kind:"spell", en:"R — Hounds' Pursuit", fr:"R — Hallali"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q"){
        out.parts.push({n:"darkinDaggers", v:A.qDmg, type:"phys"});
        out.heal = A.qHeal;
      }
      if(st.id === "e") out.parts.push({n:"eviscerate", v:A.eDmg, type:"phys"});
      if(st.id === "r"){
        out.parts.push({n:"houndsPursuit", v:A.rDmg, type:"phys"});
        out.shield = A.rShield;
      }
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("damage"), val:n0(A.qTotal)},
         {lab:TR("damage"), val:n0(A.qMin)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("msBonus"), val:"+" + pc(A.wMs)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("damage"), val:n0(A.eFlurry)},
         {lab:TR("damage"), val:n0(A.eTotal)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("shield"), val:n0(A.rShield)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q : pas de ligne de degats simple, « Initial Physical Damage » prise comme ligne principale
   - Q / Bleed Physical Damage per Tick : ligne non modelisee (35/10 to 135/10 (+ 80/10% bonus AD))
   - Q / Total Physical Damage : doublon de Total Bleed Physical Damage, ignore
   - Q / Minimum Total Physical Damage : doublon de Minimum Bonus Physical Damage, ignore
   - Q / Maximum Total Physical Damage : doublon de Maximum Bonus Physical Damage, ignore
   - R / Physical Damage per ''We Are More'' : ligne non modelisee (12.5 to 27.5 (+ 10% bonus AD))
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
