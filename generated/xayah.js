/* xayah — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Xayah.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"xayah", name:"Xayah", label:"Xayah", splash:0,
    base:{hp:[630,107], mana:[340,40], ad:[60,3.5],
          ar:[25,4.2], mr:[33,1.1],
          as:0.658, asPerLevel:3.9, ms:330},
    abilities_meta:[
      {k:"q", en:"Double Daggers", fr:"Dagues jumelles"},
      {k:"w", en:"Deadly Plumage", fr:"Plumage mortel"},
      {k:"e", en:"Bladecaller", fr:"Appel des lames"},
      {k:"r", en:"Featherstorm", fr:"Rafale de plumes"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[90,120,150,180,210], qBonusAD:1, qCd:[10,9.5,9,8.5,8],
      wAS:[35,40,45,50,55], wCd:[18,17,16,15,14],
      eCd:[12,11,10,9,8],
      rFlat:[200,300,400], rBonusAD:1, rCd:[140,120,100]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Double Daggers */
      A.qDmg = R(T.qFlat,qr) + T.qBonusAD*bonusAD;
      /* W — Deadly Plumage */
      A.wAS = R(T.wAS,wr);
      /* R — Featherstorm */
      A.rDmg = R(T.rFlat,rr) + T.rBonusAD*bonusAD;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wAS=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Clean Cuts","Plumes perçantes"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Double Daggers", fr:"Q — Dagues jumelles"},
      {id:"w", kind:"cast", label:"W", en:"W — Deadly Plumage", fr:"W — Plumage mortel"},
      {id:"r", kind:"spell", en:"R — Featherstorm", fr:"R — Rafale de plumes"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"doubleDaggers", v:A.qDmg, type:"phys"});
      if(st.id === "w") out.asBonus = A.wAS;
      if(st.id === "r") out.parts.push({n:"featherstorm", v:A.rDmg, type:"phys"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("bonusAs"), val:"+" + pc(A.wAS)},
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
   - Q : pas de ligne de degats simple, « Total Physical Damage » prise comme ligne principale
   - Q / Physical Damage Per Hit : ligne non modelisee (45 to 105 (+ 50% bonus AD))
   - Q / Reduced Damage per Hit : ligne non modelisee (45/2 to 105/2 (+ 25% bonus AD))
   - Q / Total Reduced Damage : ligne non modelisee (45 to 105 (+ 50% bonus AD))
   - E / Physical Damage Per Feather : ligne non modelisee (50 to 110 (+ 40% bonus AD))
   - E / Minion Damage Per Feather : ligne non modelisee (50/2 to 110/2 (+ 40/2% bonus AD))
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
