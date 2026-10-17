/* zyra — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Zyra.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"zyra", name:"Zyra", label:"Zyra", splash:0,
    base:{hp:[574,93], mana:[418,25], ad:[53,3.2],
          ar:[29,4.2], mr:[30,1.3],
          as:0.681, asPerLevel:2.11, ms:340},
    abilities_meta:[
      {k:"q", en:"Deadly Spines", fr:"Épines funestes"},
      {k:"w", en:"Rampant Growth", fr:"Croissance incontrôlée"},
      {k:"e", en:"Grasping Roots", fr:"Racines fixatrices"},
      {k:"r", en:"Stranglethorns", fr:"Ronces étrangleuses"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[60,100,140,180,220], qAP:0.65, qCd:[7,6.5,6,5.5,5],
      eFlat:[60,95,130,165,200], eAP:0.6, eCc:[1,1.25,1.5,1.75,2], eCd:[11,11,11,11,11],
      rFlat:[200,300,400], rAP:0.7, rCd:[110,100,90]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Deadly Spines */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      /* E — Grasping Roots */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      A.eCc = R(T.eCc,er);
      /* R — Stranglethorns */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.e){ A.eDmg=0; A.eCc=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Garden of Thorns","Jardin de ronces"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Deadly Spines", fr:"Q — Épines funestes"},
      {id:"e", kind:"spell", en:"E — Grasping Roots", fr:"E — Racines fixatrices"},
      {id:"r", kind:"spell", en:"R — Stranglethorns", fr:"R — Ronces étrangleuses"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"deadlySpines", v:A.qDmg, type:"magic"});
      if(st.id === "e") out.parts.push({n:"graspingRoots", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"stranglethorns", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("comboTime"), val:n0(A.eCc)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - W : aucune recharge dans les donnees wiki
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
