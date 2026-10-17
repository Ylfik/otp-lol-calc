/* renekton — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Renekton.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"renekton", name:"Renekton", label:"Renekton", splash:0,
    base:{hp:[660,111], mana:[100,0], ad:[69,4.15],
          ar:[35,5.2], mr:[28,2.05],
          as:0.665, asPerLevel:2.75, ms:345},
    abilities_meta:[
      {k:"q", en:"Cull the Meek", fr:"Destruction des faibles"},
      {k:"w", en:"Ruthless Predator", fr:"Prédateur impitoyable"},
      {k:"e", en:"Slice and Dice", fr:"Tranche et coupe"},
      {k:"r", en:"Dominus", fr:"Dominus"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[60,90,120,150,180], qBonusAD:1, qMax:[90,135,180,225,270], qMaxBonusAD:1.4, qHeal:[50,75,100,125,150], qHealMax:[200,300,400,500,600], qHealHealing:[12,20,28,36,44], qHealHealingBonusAD:0.17, qCd:[7,7,7,7,7],
      wFlat:[10,40,70,100,130], wAD:1.5, wTotal:[15,60,105,150,195], wTotalAD:2.25, wCd:[16,14,12,10,8],
      eFlat:[40,70,100,130,160], eBonusAD:0.9, eTotal:[80,140,200,260,320], eTotalBonusAD:1.8, eMax:[70,115,160,205,250], eMaxBonusAD:1.35, eCd:[16,14.5,13,11.5,10],
      rFlat:[900,2250,3600], rBonusAD:1.5, rAP:1.5, rCd:[120,100,80]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Cull the Meek */
      A.qDmg = R(T.qFlat,qr) + T.qBonusAD*bonusAD;
      A.qMax = R(T.qMax,qr) + T.qMaxBonusAD*bonusAD;
      A.qHeal = R(T.qHeal,qr);
      A.qHealMax = R(T.qHealMax,qr);
      A.qHealHealing = R(T.qHealHealing,qr) + T.qHealHealingBonusAD*bonusAD;
      /* W — Ruthless Predator */
      A.wDmg = R(T.wFlat,wr) + T.wAD*tot.ad;
      A.wTotal = R(T.wTotal,wr) + T.wTotalAD*tot.ad;
      /* E — Slice and Dice */
      A.eDmg = R(T.eFlat,er) + T.eBonusAD*bonusAD;
      A.eTotal = R(T.eTotal,er) + T.eTotalBonusAD*bonusAD;
      A.eMax = R(T.eMax,er) + T.eMaxBonusAD*bonusAD;
      /* R — Dominus */
      A.rDmg = R(T.rFlat,rr) + T.rBonusAD*bonusAD + T.rAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qMax=0; A.qHeal=0; A.qHealMax=0; A.qHealHealing=0; }
      if(!learned.w){ A.wDmg=0; A.wTotal=0; }
      if(!learned.e){ A.eDmg=0; A.eTotal=0; A.eMax=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Reign of Anger","Règne de la colère"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Cull the Meek", fr:"Q — Destruction des faibles"},
      {id:"w", kind:"spell", en:"W — Ruthless Predator", fr:"W — Prédateur impitoyable"},
      {id:"e", kind:"spell", en:"E — Slice and Dice", fr:"E — Tranche et coupe"},
      {id:"r", kind:"spell", en:"R — Dominus", fr:"R — Dominus"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q"){
        out.parts.push({n:"cullTheMeek", v:A.qDmg, type:"phys"});
        out.heal = A.qHeal;
      }
      if(st.id === "w") out.parts.push({n:"ruthlessPredator", v:A.wDmg, type:"phys"});
      if(st.id === "e") out.parts.push({n:"sliceAndDice", v:A.eDmg, type:"phys"});
      if(st.id === "r") out.parts.push({n:"dominus", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("damage"), val:n0(A.qMax)},
         {lab:TR("healing"), val:n0(A.qHeal)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("damage"), val:n0(A.wTotal)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("damage"), val:n0(A.eTotal)},
         {lab:TR("damage"), val:n0(A.eMax)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q / Non-Champion Healing : ligne non modelisee (2 to 6 (+ 2% bonus AD))
   - Q / Enhanced Non-Champion Healing : ligne non modelisee (6 to 18 (+ 6% bonus AD))
   - Q / Enhanced Champion Healing : doublon de Enhanced Healing Cap, ignore
   - W : pas de ligne de degats simple, « Total Physical Damage » prise comme ligne principale
   - W / Physical Damage Per Hit : ligne non modelisee (5 to 65 (+ 75% AD))
   - E / Total Enhanced Damage : doublon de Total Physical Damage, ignore
   - E / Armor Reduction : ligne non modelisee (25 to 35%)
   - R : pas de ligne de degats simple, « Total Magic Damage » prise comme ligne principale
   - R / Bonus Health : ligne non modelisee (300 to 700)
   - R / Magic Damage Per Tick : ligne non modelisee (30 to 120 (+ 5% bonus AD) (+ 5% AP))
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   - ressource particuliere (Fury) : non modelisee
   ------------------------------------------------------------------ */
