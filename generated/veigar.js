/* veigar — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Veigar.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"veigar", name:"Veigar", label:"Veigar", splash:0,
    base:{hp:[580,108], mana:[490,26], ad:[52,2.7],
          ar:[18,5.2], mr:[32,1.3],
          as:0.625, asPerLevel:2.24, ms:340},
    abilities_meta:[
      {k:"q", en:"Baleful Strike", fr:"Coup malin"},
      {k:"w", en:"Dark Matter", fr:"Matière noire"},
      {k:"e", en:"Event Horizon", fr:"Profanation"},
      {k:"r", en:"Primordial Burst", fr:"Explosion primordiale"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[80,120,160,200,240], qAP:[0.5,0.55,0.6,0.65,0.7], qCd:[6,5.5,5,4.5,4],
      wFlat:[85,140,195,250,305], wAP:[0.7,0.8,0.9,1,1.1],
      eCc:[1.5,1.75,2,2.25,2.5], eCd:[20,18.5,17,15.5,14],
      rFlat:[175,250,325], rAP:[0.65,0.7,0.75], rMax:[350,500,650], rMaxAP:[1.3,1.4,1.5], rCd:[120,90,60]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Baleful Strike */
      A.qDmg = R(T.qFlat,qr) + R(T.qAP,qr)*ap;
      /* W — Dark Matter */
      A.wDmg = R(T.wFlat,wr) + R(T.wAP,wr)*ap;
      /* E — Event Horizon */
      A.eCc = R(T.eCc,er);
      /* R — Primordial Burst */
      A.rDmg = R(T.rFlat,rr) + R(T.rAP,rr)*ap;
      A.rMax = R(T.rMax,rr) + R(T.rMaxAP,rr)*ap;
      A.qCd = R(T.qCd,qr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wDmg=0; }
      if(!learned.e){ A.eCc=0; }
      if(!learned.r){ A.rDmg=0; A.rMax=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Phenomenal Evil Power","Pouvoir maléfique phénoménal"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Baleful Strike", fr:"Q — Coup malin"},
      {id:"w", kind:"spell", en:"W — Dark Matter", fr:"W — Matière noire"},
      {id:"e", kind:"cast", label:"E", en:"E — Event Horizon", fr:"E — Profanation"},
      {id:"r", kind:"spell", en:"R — Primordial Burst", fr:"R — Explosion primordiale"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"balefulStrike", v:A.qDmg, type:"magic"});
      if(st.id === "w") out.parts.push({n:"darkMatter", v:A.wDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"primordialBurst", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)}],
        [{lab:TR("comboTime"), val:n0(A.eCc)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("damage"), val:n0(A.rMax)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - W : aucune recharge dans les donnees wiki
   - R : pas de ligne de degats simple, « Minimum Magic Damage » prise comme ligne principale
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
