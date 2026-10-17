/* kled — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Kled.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"kled", name:"Kled", label:"Kled", splash:0,
    base:{hp:[410,84], mana:[100,0], ad:[65,3.5],
          ar:[35,5.2], mr:[28,2.05],
          as:0.625, asPerLevel:3.5, ms:305},
    abilities_meta:[
      {k:"q", en:"Bear Trap on a Rope", fr:"Piège à ours en laisse"},
      {k:"w", en:"Violent Tendencies", fr:"Penchant pour la violence"},
      {k:"e", en:"Jousting", fr:"Joute"},
      {k:"r", en:"Chaaaaaaaarge!!!", fr:"Chaaaaaaaargez !!!"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[30,55,80,105,130], qBonusAD:0.6, qTotal:[90,165,240,315,390], qTotalBonusAD:1.8, qSlow:[30,35,40,45,50], qCd:[11,10,9,8,7],
      wFlat:[20,30,40,50,60], wHpPct:[4.5,5,5.5,6,6.5], wStructureAdd:[0,15,30,45,60], wCd:[13,12,11,10,9],
      eFlat:[35,60,85,110,135], eBonusAD:0.55, eTotal:[70,120,170,220,270], eTotalBonusAD:1.1, eCd:[13,12,11,10,9],
      rShieldTotal:[200,300,400], rShieldTotalBonusAD:3, rShieldMin:[40,60,80], rShieldMinBonusAD:0.6, rHpPct:[4,6,8], rBonusAD100:3, rMaxHpPct:[12,18,24], rMaxBonusAD100:9, rCd:[140,125,110]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Bear Trap on a Rope */
      A.qDmg = R(T.qFlat,qr) + T.qBonusAD*bonusAD;
      A.qTotal = R(T.qTotal,qr) + T.qTotalBonusAD*bonusAD;
      A.qSlow = R(T.qSlow,qr);
      /* W — Violent Tendencies */
      A.wHpPct = R(T.wHpPct,wr);   /* % des PV de la cible, applique dans onStep */
      A.wDmg = R(T.wFlat,wr);
      A.wStructure = R(T.wStructureAdd,wr);
      /* E — Jousting */
      A.eDmg = R(T.eFlat,er) + T.eBonusAD*bonusAD;
      A.eTotal = R(T.eTotal,er) + T.eTotalBonusAD*bonusAD;
      /* R — Chaaaaaaaarge!!! */
      A.rShieldTotal = R(T.rShieldTotal,rr) + T.rShieldTotalBonusAD*bonusAD;
      A.rShieldMin = R(T.rShieldMin,rr) + T.rShieldMinBonusAD*bonusAD;
      A.rHpPct = R(T.rHpPct,rr) + T.rBonusAD100*bonusAD/100;   /* % des PV de la cible, applique dans onStep */
      A.rMaxHpPct = R(T.rMaxHpPct,rr) + T.rMaxBonusAD100*bonusAD/100;   /* % des PV de la cible, applique dans onStep */
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qTotal=0; A.qSlow=0; }
      if(!learned.w){ A.wHpPct=0; A.wDmg=0; A.wStructure=0; }
      if(!learned.e){ A.eDmg=0; A.eTotal=0; }
      if(!learned.r){ A.rShieldTotal=0; A.rShieldMin=0; A.rHpPct=0; A.rMaxHpPct=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Skaarl, the Cowardly Lizard","Skaarl, le Lézard froussard"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Bear Trap on a Rope", fr:"Q — Piège à ours en laisse"},
      {id:"w", kind:"spell", en:"W — Violent Tendencies", fr:"W — Penchant pour la violence"},
      {id:"e", kind:"spell", en:"E — Jousting", fr:"E — Joute"},
      {id:"r", kind:"spell", en:"R — Chaaaaaaaarge!!!", fr:"R — Chaaaaaaaargez !!!"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"bearTrapOnARope", v:A.qDmg, type:"phys"});
      if(st.id === "w") out.parts.push({n:"violentTendencies", v:A.wDmg + hp * A.wHpPct/100, type:"phys"});
      if(st.id === "e") out.parts.push({n:"jousting", v:A.eDmg, type:"phys"});
      if(st.id === "r"){
        out.parts.push({n:"chaaaaaaaarge", v:hp * A.rHpPct/100 + hp * A.rMaxHpPct/100, type:"magic"});
        out.shield = A.rShieldTotal;
      }
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("damage"), val:n0(A.qTotal)},
         {lab:TR("slow"), val:pc(A.qSlow)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("mPpct"), val:pc(A.wHpPct)},
         {lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("damage"), val:n0(A.wStructure)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("damage"), val:n0(A.eTotal)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("shield"), val:n0(A.rShieldTotal)},
         {lab:TR("shield"), val:n0(A.rShieldMin)},
         {lab:TR("mPpct"), val:pc(A.rHpPct)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q : 2 formes dans le wiki (Bear Trap on a Rope, Pocket Pistol) — seule la premiere est modelisee
   - E : 2 formes dans le wiki (Jousting, Dismounted Jousting) — seule la premiere est modelisee
   - R : 2 formes dans le wiki (Chaaaaaaaarge!!!, Dismounted Chaaaaaaaarge!!!) — seule la premiere est modelisee
   - Q / Minion and Small Monster Damage : ligne non modelisee (30*1.5 to 130*1.5 (+ 90% bonus AD))
   - Q / Physical Damage : doublon de Physical Damage, ignore
   - R : pas de ligne de degats simple, « Minimum Magic Damage » prise comme ligne principale
   - R / Shield Per Instance : ligne non modelisee (20 to 40 (+ 30% bonus AD))
   - passif : 2 blocs dans le wiki (Skaarl the Cowardly Lizard, Dismounted Skaarl the Cowardly Lizard) — seul le premier est modelise
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   - ressource particuliere (Courage) : non modelisee
   ------------------------------------------------------------------ */
