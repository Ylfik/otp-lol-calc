/* neeko — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Neeko.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"neeko", name:"Neeko", label:"Neeko", splash:0,
    base:{hp:[610,104], mana:[450,30], ad:[48,2.5],
          ar:[21,5.2], mr:[30,1.3],
          as:0.625, asPerLevel:3.5, ms:340},
    abilities_meta:[
      {k:"q", en:"Blooming Burst", fr:"Explosion florale"},
      {k:"w", en:"Shapesplitter", fr:"Métaclonage"},
      {k:"e", en:"Tangle-Barbs", fr:"Spirale épineuse"},
      {k:"r", en:"Pop Blossom", fr:"Floraison renversante"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qMin:[60,110,160,210,260], qMinAP:0.6, qFlat:[35,60,85,110,135], qAP:0.25, qTotal:[130,230,330,430,530], qTotalAP:1.1, qCd:[9,8.5,8,7.5,7],
      wFlat:[30,65,100,135,170], wAP:0.6, wMs:[10,17.5,25,32.5,40], wMsMovement:[20,25,30,35,40], wCd:[16,15,14,13,12],
      eFlat:[80,115,150,185,220], eAP:0.65, eCc:[0.7,0.9,1.1,1.3,1.5], eCcMax:[2,2.25,2.5,2.75,3], eCd:[12,11.5,11,10.5,10],
      rFlat:[150,350,550], rAP:1.2, rCd:[120,105,90]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Blooming Burst */
      A.qMin = R(T.qMin,qr) + T.qMinAP*ap;
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      A.qTotal = R(T.qTotal,qr) + T.qTotalAP*ap;
      /* W — Shapesplitter */
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      A.wMs = R(T.wMs,wr);
      A.wMsMovement = R(T.wMsMovement,wr);
      /* E — Tangle-Barbs */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      A.eCc = R(T.eCc,er);
      A.eCcMax = R(T.eCcMax,er);
      /* R — Pop Blossom */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qMin=0; A.qDmg=0; A.qTotal=0; }
      if(!learned.w){ A.wDmg=0; A.wMs=0; A.wMsMovement=0; }
      if(!learned.e){ A.eDmg=0; A.eCc=0; A.eCcMax=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Inherent Glamour","Mirage inné"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Blooming Burst", fr:"Q — Explosion florale"},
      {id:"w", kind:"spell", en:"W — Shapesplitter", fr:"W — Métaclonage"},
      {id:"e", kind:"spell", en:"E — Tangle-Barbs", fr:"E — Spirale épineuse"},
      {id:"r", kind:"spell", en:"R — Pop Blossom", fr:"R — Floraison renversante"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"bloomingBurst", v:A.qDmg, type:"magic"});
      if(st.id === "w") out.parts.push({n:"shapesplitter", v:A.wDmg, type:"magic"});
      if(st.id === "e") out.parts.push({n:"tangleBarbs", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"popBlossom", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qMin)},
         {lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("damage"), val:n0(A.qTotal)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("msBonus"), val:"+" + pc(A.wMs)},
         {lab:TR("msBonus"), val:"+" + pc(A.wMsMovement)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("comboTime"), val:n0(A.eCc)},
         {lab:TR("comboTime"), val:n0(A.eCcMax)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q / Bonus Monster Damage : ligne non modelisee (35 to 95)
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
