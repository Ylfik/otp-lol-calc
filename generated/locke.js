/* locke — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Locke.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"locke", name:"Locke", label:"Locke", splash:0,
    base:{hp:[620,109], mana:[280,70], ad:[58,3],
          ar:[32,4.2], mr:[32,2.05],
          as:0.688, asPerLevel:3.3, ms:340},
    abilities_meta:[
      {k:"q", en:"Ritual Nails", fr:"Clous rituels"},
      {k:"w", en:"Soul Ignition", fr:"Brûlure d'âme"},
      {k:"e", en:"Ashen Pursuit", fr:"Traque cendrée"},
      {k:"r", en:"Purgatory", fr:"Purgatoire"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qMax:[120,144,168,192,216], qMaxAP:0.6, qFlat:[18,26,34,42,50], qAP:[0.25,0.275,0.3,0.325,0.35], qTwo:[43.2,62.4,81.6,100.8,120], qTwoAP:[0.6,0.66,0.72,0.78,0.84], qThree:[75.6,109.2,142.8,176.4,210], qThreeAP:[1.05,1.155,1.26,1.365,1.47], qCd:[10,9,8,7,6],
      wFlat:[40,60,80,100,120], wAP:1, wCd:[18,17,16,15,14],
      eFlat:[40,50,60,70,80], eAP:0.4, eDash:[40,60,80,100,120], eDashAP:0.4, eTotal:[80,110,140,170,200], eTotalAP:0.8, eCd:[10,10,10,10,10],
      rFlat:[150,225,300], rAP:0.6, rCd:[120,100,80]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Ritual Nails */
      A.qMax = R(T.qMax,qr) + T.qMaxAP*ap;
      A.qDmg = R(T.qFlat,qr) + R(T.qAP,qr)*ap;
      A.qTwo = R(T.qTwo,qr) + R(T.qTwoAP,qr)*ap;
      A.qThree = R(T.qThree,qr) + R(T.qThreeAP,qr)*ap;
      /* W — Soul Ignition */
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      /* E — Ashen Pursuit */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      A.eDash = R(T.eDash,er) + T.eDashAP*ap;
      A.eTotal = R(T.eTotal,er) + T.eTotalAP*ap;
      /* R — Purgatory */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qMax=0; A.qDmg=0; A.qTwo=0; A.qThree=0; }
      if(!learned.w){ A.wDmg=0; }
      if(!learned.e){ A.eDmg=0; A.eDash=0; A.eTotal=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Silver Stake","Pieu argenté"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Ritual Nails", fr:"Q — Clous rituels"},
      {id:"w", kind:"spell", en:"W — Soul Ignition", fr:"W — Brûlure d'âme"},
      {id:"e", kind:"spell", en:"E — Ashen Pursuit", fr:"E — Traque cendrée"},
      {id:"r", kind:"spell", en:"R — Purgatory", fr:"R — Purgatoire"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"ritualNails", v:A.qDmg, type:"magic"});
      if(st.id === "w") out.parts.push({n:"soulIgnition", v:A.wDmg, type:"magic"});
      if(st.id === "e") out.parts.push({n:"ashenPursuit", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"purgatory", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qMax)},
         {lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("damage"), val:n0(A.qTwo)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("damage"), val:n0(A.eDash)},
         {lab:TR("damage"), val:n0(A.eTotal)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q / Magic Damage per Nail : ligne non modelisee (40 to 72 (+ 20% AP))
   - Q / Maximum Total Magic Damage : doublon de Maximum Nail Damage, ignore
   - R / Execute Threshold : ligne non modelisee (10 to 12% (+ 0.5% per Sealed Champion stack) of the target's maximum health)
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
