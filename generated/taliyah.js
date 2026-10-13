/* taliyah — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Taliyah.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"taliyah", name:"Taliyah", label:"Taliyah", splash:0,
    base:{hp:[550,104], mana:[470,30], ad:[58,3.3],
          ar:[18,4.7], mr:[28,1.3],
          as:0.658, asPerLevel:1.36, ms:330},
    abilities_meta:[
      {k:"q", en:"Threaded Volley", fr:"Rafale filée"},
      {k:"w", en:"Seismic Shove", fr:"Poussée sismique"},
      {k:"e", en:"Unraveled Earth", fr:"Défilage tellurique"},
      {k:"r", en:"Weaver's Wall", fr:"Mur de la tisseuse"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[55,72.5,90,107.5,125], qAP:0.5, qTotal:[143,188.5,234,279.5,325], qTotalAP:1.3, qMax:[99,130.5,162,193.5,225], qMaxAP:0.9, qSecondary:[55,72.5,90,107.5,125], qSecondaryAP:0.5, qSlow:[20,25,30,35,40], qCd:[7,6,5,4,3],
      wCd:[14,12.5,11,9.5,8],
      eFlat:[60,105,150,195,240], eAP:0.6, eDetonation:[25,40,55,70,85], eDetonationAP:0.3, eTotal:[62.5,100,137.5,175,212.5], eTotalAP:0.75, eCd:[14,14,14,14,14],
      rCd:[180,150,120]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Threaded Volley */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      A.qTotal = R(T.qTotal,qr) + T.qTotalAP*ap;
      A.qMax = R(T.qMax,qr) + T.qMaxAP*ap;
      A.qSecondary = R(T.qSecondary,qr) + T.qSecondaryAP*ap;
      A.qSlow = R(T.qSlow,qr);
      /* E — Unraveled Earth */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      A.eDetonation = R(T.eDetonation,er) + T.eDetonationAP*ap;
      A.eTotal = R(T.eTotal,er) + T.eTotalAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qTotal=0; A.qMax=0; A.qSecondary=0; A.qSlow=0; }
      if(!learned.e){ A.eDmg=0; A.eDetonation=0; A.eTotal=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Rock Surfing","Surf tellurique"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Threaded Volley", fr:"Q — Rafale filée"},
      {id:"e", kind:"spell", en:"E — Unraveled Earth", fr:"E — Défilage tellurique"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"threadedVolley", v:A.qDmg, type:"magic"});
      if(st.id === "e") out.parts.push({n:"unraveledEarth", v:A.eDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("damage"), val:n0(A.qTotal)},
         {lab:TR("damage"), val:n0(A.qMax)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("damage"), val:n0(A.eDetonation)},
         {lab:TR("damage"), val:n0(A.eTotal)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q / Reduced Damage : ligne non modelisee (55*0.4 to 125*0.4 (+ 50*0.4% AP))
   - Q / Bonus Monster Damage : ligne non modelisee (20 to 40)
   - Q / Boulder Bonus Monster Damage : ligne non modelisee (20*1.8 to 40*1.8)
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
