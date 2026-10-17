/* riven — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Riven.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"riven", name:"Riven", label:"Riven", splash:0,
    base:{hp:[630,100], mana:[0,0], ad:[64,3],
          ar:[33,4.4], mr:[32,2.05],
          as:0.625, asPerLevel:3.5, ms:340},
    abilities_meta:[
      {k:"q", en:"Broken Wings", fr:"Ailes brisées"},
      {k:"w", en:"Ki Burst", fr:"Décharge de ki"},
      {k:"e", en:"Valor", fr:"Bravoure"},
      {k:"r", en:"Blade of the Exile", fr:"Lame de l'exilée"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[45,75,105,135,165], qBonusAD:[0.6,0.65,0.7,0.75,0.8], qTotal:[135,225,315,405,495], qTotalBonusAD:[1.8,1.95,2.1,2.25,2.4], qCd:[13,13,13,13,13],
      wFlat:[65,95,125,155,185], wBonusAD:1, wCd:[11,10,9,8,7],
      eShield:[70,95,120,145,170], eShieldBonusAD:1.1, eCd:[10,9,8,7,6],
      rCd:[120,90,60]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Broken Wings */
      A.qDmg = R(T.qFlat,qr) + R(T.qBonusAD,qr)*bonusAD;
      A.qTotal = R(T.qTotal,qr) + R(T.qTotalBonusAD,qr)*bonusAD;
      /* W — Ki Burst */
      A.wDmg = R(T.wFlat,wr) + T.wBonusAD*bonusAD;
      /* E — Valor */
      A.eShield = R(T.eShield,er) + T.eShieldBonusAD*bonusAD;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qTotal=0; }
      if(!learned.w){ A.wDmg=0; }
      if(!learned.e){ A.eShield=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Runic Blade","Lame runique"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Broken Wings", fr:"Q — Ailes brisées"},
      {id:"w", kind:"spell", en:"W — Ki Burst", fr:"W — Décharge de ki"},
      {id:"e", kind:"cast", label:"E", en:"E — Valor", fr:"E — Bravoure"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"brokenWings", v:A.qDmg, type:"phys"});
      if(st.id === "w") out.parts.push({n:"kiBurst", v:A.wDmg, type:"phys"});
      if(st.id === "e") out.shield = A.eShield;
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
        [{lab:TR("shield"), val:n0(A.eShield)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - R : 2 formes dans le wiki (Blade of the Exile, Wind Slash) — seule la premiere est modelisee
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
