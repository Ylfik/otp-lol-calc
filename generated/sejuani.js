/* sejuani — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Sejuani.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"sejuani", name:"Sejuani", label:"Sejuani", splash:0,
    base:{hp:[630,114], mana:[400,40], ad:[66,4],
          ar:[34,5.45], mr:[32,2.05],
          as:0.688, asPerLevel:3.5, ms:340},
    abilities_meta:[
      {k:"q", en:"Arctic Assault", fr:"Assaut arctique"},
      {k:"w", en:"Winter's Wrath", fr:"Colère de l'hiver"},
      {k:"e", en:"Permafrost", fr:"Permafrost"},
      {k:"r", en:"Glacial Prison", fr:"Prison de glace"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[90,140,190,240,290], qAP:0.75, qCd:[18,16.5,15,13.5,12],
      wFlat:[5,15,25,35,45], wAP:0.3, wMaxHp:0.04, wTotal:[10,40,70,100,130], wTotalAP:0.9, wTotalMaxHp:0.12, wCd:[9,8,7,6,5],
      eFlat:[55,105,155,205,255], eAP:0.7, eCd:[1.5,1.5,1.5,1.5,1.5],
      rFlat:[125,150,175], rAP:0.4, rMax:[200,300,400], rMaxAP:0.8, rCd:[120,105,90]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Arctic Assault */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      /* W — Winter's Wrath */
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap + T.wMaxHp*tot.hp;
      A.wTotal = R(T.wTotal,wr) + T.wTotalAP*ap + T.wTotalMaxHp*tot.hp;
      /* E — Permafrost */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      /* R — Glacial Prison */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.rMax = R(T.rMax,rr) + T.rMaxAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wDmg=0; A.wTotal=0; }
      if(!learned.e){ A.eDmg=0; }
      if(!learned.r){ A.rDmg=0; A.rMax=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Fury of the North","Fureur du nord"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Arctic Assault", fr:"Q — Assaut arctique"},
      {id:"w", kind:"spell", en:"W — Winter's Wrath", fr:"W — Colère de l'hiver"},
      {id:"e", kind:"spell", en:"E — Permafrost", fr:"E — Permafrost"},
      {id:"r", kind:"spell", en:"R — Glacial Prison", fr:"R — Prison de glace"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"arcticAssault", v:A.qDmg, type:"magic"});
      if(st.id === "w") out.parts.push({n:"winterSWrath", v:A.wDmg, type:"phys"});
      if(st.id === "e") out.parts.push({n:"permafrost", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"glacialPrison", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("damage"), val:n0(A.wTotal)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
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
   - W / Physical Damage : doublon de Physical Damage, ignore
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
