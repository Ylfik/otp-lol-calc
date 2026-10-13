/* viktor — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Viktor.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"viktor", name:"Viktor", label:"Viktor", splash:0,
    base:{hp:[600,100], mana:[405,45], ad:[53,3],
          ar:[23,4.4], mr:[30,1.3],
          as:0.658, asPerLevel:2.11, ms:335},
    abilities_meta:[
      {k:"q", en:"Siphon Power", fr:"Siphonnage"},
      {k:"w", en:"Gravity Field", fr:"Champ gravitationnel"},
      {k:"e", en:"Hextech Ray", fr:"Rayon Hextech"},
      {k:"r", en:"Arcane Storm", fr:"Tempête arcanique"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[60,75,90,105,120], qAP:0.4, qModified:[20,45,70,95,120], qModifiedAD:1, qModifiedAP:0.5, qTotal:[80,120,160,200,240], qTotalAD:1, qTotalAP:0.9, qCd:[9,8,7,6,5],
      wSlow:[33,36,39,42,45], wCd:[17,16,15,14,13],
      eFlat:[70,110,150,190,230], eAP:0.5, eTotal:[90,160,230,300,370], eTotalAP:1.3, eCd:[12,11,10,9,8],
      rFlat:[100,175,250], rAP:0.5, rTotal:[490,805,1120], rTotalAP:2.6, rCd:[120,100,80]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Siphon Power */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      A.qModified = R(T.qModified,qr) + T.qModifiedAD*tot.ad + T.qModifiedAP*ap;
      A.qTotal = R(T.qTotal,qr) + T.qTotalAD*tot.ad + T.qTotalAP*ap;
      /* W — Gravity Field */
      A.wSlow = R(T.wSlow,wr);
      /* E — Hextech Ray */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      A.eTotal = R(T.eTotal,er) + T.eTotalAP*ap;
      /* R — Arcane Storm */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.rTotal = R(T.rTotal,rr) + T.rTotalAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qModified=0; A.qTotal=0; }
      if(!learned.w){ A.wSlow=0; }
      if(!learned.e){ A.eDmg=0; A.eTotal=0; }
      if(!learned.r){ A.rDmg=0; A.rTotal=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Glorious Evolution","Glorieuse évolution"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Siphon Power", fr:"Q — Siphonnage"},
      {id:"w", kind:"cast", label:"W", en:"W — Gravity Field", fr:"W — Champ gravitationnel"},
      {id:"e", kind:"spell", en:"E — Hextech Ray", fr:"E — Rayon Hextech"},
      {id:"r", kind:"spell", en:"R — Arcane Storm", fr:"R — Tempête arcanique"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"siphonPower", v:A.qDmg, type:"magic"});
      if(st.id === "e") out.parts.push({n:"hextechRay", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"arcaneStorm", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("damage"), val:n0(A.qModified)},
         {lab:TR("damage"), val:n0(A.qTotal)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("slow"), val:pc(A.wSlow)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("damage"), val:n0(A.eTotal)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("damage"), val:n0(A.rTotal)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - E : 2 formes dans le wiki (Hextech Ray, Death Ray) — seule la premiere est modelisee
   - R : 2 formes dans le wiki (Arcane Storm, Chaos Storm) — seule la premiere est modelisee
   - E / Magic Damage : doublon de Magic Damage, ignore
   - R / Magic Damage Per Tick : ligne non modelisee (65 to 145 (+ 35% AP))
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
