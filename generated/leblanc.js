/* leblanc — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/LeBlanc.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"leblanc", name:"Leblanc", label:"LeBlanc", splash:0,
    base:{hp:[598,108], mana:[400,25], ad:[55,2.2],
          ar:[22,4.2], mr:[30,1.3],
          as:0.658, asPerLevel:1.5, ms:340},
    abilities_meta:[
      {k:"q", en:"Sigil of Malice", fr:"Sceau de malveillance"},
      {k:"w", en:"Distortion", fr:"Distorsion"},
      {k:"e", en:"Ethereal Chains", fr:"Chaînes éthérées"},
      {k:"r", en:"Mimic", fr:"Imitation"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[65,90,115,140,165], qAP:0.4, qTotal:[130,180,230,280,330], qTotalAP:0.8, qCd:[6,6,6,6,6],
      wFlat:[75,115,155,195,235], wAP:0.9, wCd:[15,13.75,12.5,11.25,10],
      eFlat:[50,70,90,110,130], eAP:0.4, eFracture:[80,120,160,200,240], eFractureAP:0.85, eTotal:[130,190,250,310,370], eTotalAP:1.25, eCd:[14,13.25,12.5,11.75,11],
      rFlat:[70,150,230], rAP:0.4, rMark:[140,300,460], rMarkAP:0.8, rTotal:[210,450,690], rTotalAP:1.2, rApplication:[70,150,230], rApplicationAP:0.4, rFracture:[140,300,460], rFractureAP:0.85, rCd:[45,35,25]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Sigil of Malice */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      A.qTotal = R(T.qTotal,qr) + T.qTotalAP*ap;
      /* W — Distortion */
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      /* E — Ethereal Chains */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      A.eFracture = R(T.eFracture,er) + T.eFractureAP*ap;
      A.eTotal = R(T.eTotal,er) + T.eTotalAP*ap;
      /* R — Mimic */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.rMark = R(T.rMark,rr) + T.rMarkAP*ap;
      A.rTotal = R(T.rTotal,rr) + T.rTotalAP*ap;
      A.rApplication = R(T.rApplication,rr) + T.rApplicationAP*ap;
      A.rFracture = R(T.rFracture,rr) + T.rFractureAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qTotal=0; }
      if(!learned.w){ A.wDmg=0; }
      if(!learned.e){ A.eDmg=0; A.eFracture=0; A.eTotal=0; }
      if(!learned.r){ A.rDmg=0; A.rMark=0; A.rTotal=0; A.rApplication=0; A.rFracture=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Mirror Image","Image miroir"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Sigil of Malice", fr:"Q — Sceau de malveillance"},
      {id:"w", kind:"spell", en:"W — Distortion", fr:"W — Distorsion"},
      {id:"e", kind:"spell", en:"E — Ethereal Chains", fr:"E — Chaînes éthérées"},
      {id:"r", kind:"spell", en:"R — Mimic", fr:"R — Imitation"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"sigilOfMalice", v:A.qDmg, type:"magic"});
      if(st.id === "w") out.parts.push({n:"distortion", v:A.wDmg, type:"magic"});
      if(st.id === "e") out.parts.push({n:"etherealChains", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"mimic", v:A.rDmg, type:"magic"});
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
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("damage"), val:n0(A.eFracture)},
         {lab:TR("damage"), val:n0(A.eTotal)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("damage"), val:n0(A.rMark)},
         {lab:TR("damage"), val:n0(A.rTotal)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q : 2 formes dans le wiki (Sigil of Malice, Shatter Orb) — seule la premiere est modelisee
   - R : 3 formes dans le wiki (Mimic, Mimic Shatter Orb, Shadow of the Rose) — seule la premiere est modelisee
   - R / Magic Damage : doublon de Orb Magic Damage, ignore
   - R / Total Magic Damage : doublon de Total Magic Damage, ignore
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
