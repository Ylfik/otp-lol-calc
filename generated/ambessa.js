/* ambessa — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Ambessa.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"ambessa", name:"Ambessa", label:"Ambessa", splash:0,
    base:{hp:[630,110], mana:[200,0], ad:[63,3],
          ar:[35,4.9], mr:[32,2.05],
          as:0.625, asPerLevel:2.5, ms:335},
    abilities_meta:[
      {k:"q", en:"Cunning Sweep / Sundering Slam", fr:"Frappe fourbe / Frappe fracassante"},
      {k:"w", en:"Repudiation", fr:"Égide dévastatrice"},
      {k:"e", en:"Lacerate", fr:"Lacération"},
      {k:"r", en:"Public Execution", fr:"Exécution publique"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[20,30,40,50,60], qBonusAD:0.3, qHpPct:[2,2.25,2.5,2.75,3], qMax:[40,60,80,100,120], qMaxBonusAD:0.6, qMaxHpPct:[4,4.5,5,5.5,6], qCd:[14,13,12,11,10],
      wFlat:[50,75,100,125,150], wBonusAD:0.5, wMax:[75,112.5,150,187.5,225], wMaxBonusAD:0.75, wCd:[18,17,16,15,14],
      eFlat:[40,60,80,100,120], eBonusAD:0.5, eTotal:[80,120,160,200,240], eTotalBonusAD:1, eCd:[13,12,11,10,9],
      rHeal:[15,17.5,20], rHealReduced:[3.75,4.375,5], rFlat:[150,250,350], rBonusAD:0.8, rCd:[130,115,100]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Cunning Sweep / Sundering Slam */
      A.qHpPct = R(T.qHpPct,qr);   /* % des PV de la cible, applique dans onStep */
      A.qDmg = R(T.qFlat,qr) + T.qBonusAD*bonusAD;
      A.qMaxHpPct = R(T.qMaxHpPct,qr);   /* % des PV de la cible, applique dans onStep */
      A.qMax = R(T.qMax,qr) + T.qMaxBonusAD*bonusAD;
      /* W — Repudiation */
      A.wDmg = R(T.wFlat,wr) + T.wBonusAD*bonusAD;
      A.wMax = R(T.wMax,wr) + T.wMaxBonusAD*bonusAD;
      /* E — Lacerate */
      A.eDmg = R(T.eFlat,er) + T.eBonusAD*bonusAD;
      A.eTotal = R(T.eTotal,er) + T.eTotalBonusAD*bonusAD;
      /* R — Public Execution */
      A.rHeal = R(T.rHeal,rr);
      A.rHealReduced = R(T.rHealReduced,rr);
      A.rDmg = R(T.rFlat,rr) + T.rBonusAD*bonusAD;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qHpPct=0; A.qDmg=0; A.qMaxHpPct=0; A.qMax=0; }
      if(!learned.w){ A.wDmg=0; A.wMax=0; }
      if(!learned.e){ A.eDmg=0; A.eTotal=0; }
      if(!learned.r){ A.rHeal=0; A.rHealReduced=0; A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Drakehound's Step","Ruée des chiens-dragons"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Cunning Sweep / Sundering Slam", fr:"Q — Frappe fourbe / Frappe fracassante"},
      {id:"w", kind:"spell", en:"W — Repudiation", fr:"W — Égide dévastatrice"},
      {id:"e", kind:"spell", en:"E — Lacerate", fr:"E — Lacération"},
      {id:"r", kind:"spell", en:"R — Public Execution", fr:"R — Exécution publique"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"cunningSweepSunderingSlam", v:A.qDmg + hp * A.qHpPct/100 + hp * A.qMaxHpPct/100, type:"phys"});
      if(st.id === "w") out.parts.push({n:"repudiation", v:A.wDmg, type:"phys"});
      if(st.id === "e") out.parts.push({n:"lacerate", v:A.eDmg, type:"phys"});
      if(st.id === "r"){
        out.parts.push({n:"publicExecution", v:A.rDmg, type:"phys"});
        out.heal = A.rHeal;
      }
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("mPpct"), val:pc(A.qHpPct)},
         {lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("mPpct"), val:pc(A.qMaxHpPct)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("damage"), val:n0(A.wMax)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("damage"), val:n0(A.eTotal)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("healing"), val:n0(A.rHeal)},
         {lab:TR("healing"), val:n0(A.rHealReduced)},
         {lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q : 2 formes dans le wiki (Cunning Sweep, Sundering Slam) — seule la premiere est modelisee
   - R / Armor Penetration : ligne non modelisee (10 to 30%)
   - R / Healing Percentage : ratio sans statistique « 50% life steal » non modelise
   - R / Reduced Healing Percentage : ratio sans statistique « 50*0.25% life steal » non modelise
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   - ressource particuliere (Energy) : non modelisee
   ------------------------------------------------------------------ */
