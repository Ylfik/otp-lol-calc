/* lillia — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Lilia.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"lillia", name:"Lillia", label:"Lilia", splash:0,
    base:{hp:[605,105], mana:[410,50], ad:[61,3.1],
          ar:[24,4.5], mr:[32,1.55],
          as:0.625, asPerLevel:2.7, ms:330},
    abilities_meta:[
      {k:"q", en:"Blooming Blows", fr:"Frappe fleurie"},
      {k:"w", en:"Watch Out! Eep!", fr:"Attention, désolée !"},
      {k:"e", en:"Swirlseed", fr:"Graine tournoyante"},
      {k:"r", en:"Lilting Lullaby", fr:"Douce berceuse"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qMsPerStack:[3,4,5,6,7], qMsPerStackAP100:3, qMsMax:[12,16,20,24,28], qMsMaxAP100:12, qFlat:[35,45,55,65,75], qAP:0.35, qTotal:[70,90,110,130,150], qTotalAP:0.7, qCd:[6,5.5,5,4.5,4],
      wFlat:[80,100,120,140,160], wAP:0.35, wMax:[240,300,360,420,480], wMaxAP:1.05, wCd:[14,13,12,11,10],
      eFlat:[60,85,110,135,160], eAP:0.5, eCd:[12,12,12,12,12],
      rFlat:[100,150,200], rAP:0.4, rCd:[150,130,110]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Blooming Blows */
      A.qMsPerStack = R(T.qMsPerStack,qr) + T.qMsPerStackAP100*ap/100;
      A.qMsMax = R(T.qMsMax,qr) + T.qMsMaxAP100*ap/100;
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      A.qTotal = R(T.qTotal,qr) + T.qTotalAP*ap;
      /* W — Watch Out! Eep! */
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      A.wMax = R(T.wMax,wr) + T.wMaxAP*ap;
      /* E — Swirlseed */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      /* R — Lilting Lullaby */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qMsPerStack=0; A.qMsMax=0; A.qDmg=0; A.qTotal=0; }
      if(!learned.w){ A.wDmg=0; A.wMax=0; }
      if(!learned.e){ A.eDmg=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Dream-Laden Bough","Bâton chargé de rêves"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Blooming Blows", fr:"Q — Frappe fleurie"},
      {id:"w", kind:"spell", en:"W — Watch Out! Eep!", fr:"W — Attention, désolée !"},
      {id:"e", kind:"spell", en:"E — Swirlseed", fr:"E — Graine tournoyante"},
      {id:"r", kind:"spell", en:"R — Lilting Lullaby", fr:"R — Douce berceuse"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"bloomingBlows", v:A.qDmg, type:"magic"});
      if(st.id === "w") out.parts.push({n:"watchOutEep", v:A.wDmg, type:"magic"});
      if(st.id === "e") out.parts.push({n:"swirlseed", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"liltingLullaby", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("msBonus"), val:"+" + pc(A.qMsPerStack)},
         {lab:TR("msBonus"), val:"+" + pc(A.qMsMax)},
         {lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("damage"), val:n0(A.wMax)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - W / Minion Damage : ligne non modelisee (80*0.5 to 160*0.5 (+ 17.5% AP))
   - W / Increased Minion Damage : ligne non modelisee (80*0.5*3 to 160*0.5*3 (+ 52.5% AP))
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
