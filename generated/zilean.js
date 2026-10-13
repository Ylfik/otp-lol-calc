/* zilean — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Zilean.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"zilean", name:"Zilean", label:"Zilean", splash:0,
    base:{hp:[574,96], mana:[452,50], ad:[52,3],
          ar:[24,5], mr:[30,1.3],
          as:0.658, asPerLevel:2.13, ms:335},
    abilities_meta:[
      {k:"q", en:"Time Bomb", fr:"Bombe à retardement"},
      {k:"w", en:"Rewind", fr:"Retour rapide"},
      {k:"e", en:"Time Warp", fr:"Distorsion temporelle"},
      {k:"r", en:"Chronoshift", fr:"Retour temporel"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[75,115,165,230,300], qAP:0.9, qCc:[1.1,1.2,1.3,1.4,1.5], qCd:[10,9.5,9,8.5,8],
      wCd:[14,12,10,8,6],
      eMs:[40,55,70,85], eCd:[15,15,15,15,15],
      rHeal:[600,850,1100], rHealAP:2, rCd:[120,90,60]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Time Bomb */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      A.qCc = R(T.qCc,qr);
      /* E — Time Warp */
      A.eMs = R(T.eMs,er);
      /* R — Chronoshift */
      A.rHeal = R(T.rHeal,rr) + T.rHealAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qCc=0; }
      if(!learned.e){ A.eMs=0; }
      if(!learned.r){ A.rHeal=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Time In A Bottle","Temps dans une bouteille"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Time Bomb", fr:"Q — Bombe à retardement"},
      {id:"e", kind:"cast", label:"E", en:"E — Time Warp", fr:"E — Distorsion temporelle"},
      {id:"r", kind:"cast", label:"R", en:"R — Chronoshift", fr:"R — Retour temporel"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"timeBomb", v:A.qDmg, type:"magic"});
      if(st.id === "r") out.heal = A.rHeal;
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("comboTime"), val:n0(A.qCc)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("msBonus"), val:"+" + pc(A.eMs)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("healing"), val:n0(A.rHeal)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
