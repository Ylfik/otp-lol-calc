/* anivia — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Anivia.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"anivia", name:"Anivia", label:"Anivia", splash:0,
    base:{hp:[550,92], mana:[495,45], ad:[51,3.2],
          ar:[19,4.1], mr:[30,1.3],
          as:0.658, asPerLevel:1.68, ms:325},
    abilities_meta:[
      {k:"q", en:"Flash Frost", fr:"Lance de glace"},
      {k:"w", en:"Crystallize", fr:"Cristallisation"},
      {k:"e", en:"Frostbite", fr:"Gelure"},
      {k:"r", en:"Glacial Storm", fr:"Tempête glaciale"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[50,70,90,110,130], qAP:0.25, qTotal:[110,165,220,275,330], qTotalAP:0.7, qCc:[1.1,1.2,1.3,1.4,1.5], qCd:[11,10,9,8,7],
      wCd:[17,17,17,17,17],
      eFlat:[55,80,105,130,155], eAP:0.55, eMax:[110,160,210,260,310], eMaxAP:1.1, eCd:[4,4,4,4,4],
      rSlow:[0,10,20], rSlowSlow:[20,30,40], rSlowMax:[30,45,60], rCd:[4,3,2]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Flash Frost */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      A.qTotal = R(T.qTotal,qr) + T.qTotalAP*ap;
      A.qCc = R(T.qCc,qr);
      /* E — Frostbite */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      A.eMax = R(T.eMax,er) + T.eMaxAP*ap;
      /* R — Glacial Storm */
      A.rSlow = R(T.rSlow,rr);
      A.rSlowSlow = R(T.rSlowSlow,rr);
      A.rSlowMax = R(T.rSlowMax,rr);
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qTotal=0; A.qCc=0; }
      if(!learned.e){ A.eDmg=0; A.eMax=0; }
      if(!learned.r){ A.rSlow=0; A.rSlowSlow=0; A.rSlowMax=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Rebirth","Renaissance"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Flash Frost", fr:"Q — Lance de glace"},
      {id:"e", kind:"spell", en:"E — Frostbite", fr:"E — Gelure"},
      {id:"r", kind:"cast", label:"R", en:"R — Glacial Storm", fr:"R — Tempête glaciale"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"flashFrost", v:A.qDmg, type:"magic"});
      if(st.id === "e") out.parts.push({n:"frostbite", v:A.eDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("damage"), val:n0(A.qTotal)},
         {lab:TR("comboTime"), val:n0(A.qCc)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("damage"), val:n0(A.eMax)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("slow"), val:pc(A.rSlow)},
         {lab:TR("slow"), val:pc(A.rSlowSlow)},
         {lab:TR("slow"), val:pc(A.rSlowMax)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q / Magic Damage : doublon de Magic Damage, ignore
   - W / Width : ligne non modelisee (pathing radius 600 to 1000 units)
   - W / Number of ice segments : ligne non modelisee (4 to 8 chunks of ice)
   - W / Distance between outermost segments : ligne non modelisee (400 to 800 units)
   - W / Distance between individual segments : ligne non modelisee (133.33 units)
   - R / Magic Damage per Tick : ligne non modelisee (15 to 30 (+ 6.25% AP))
   - R / Empowered Damage per Tick : ligne non modelisee (15*3 to 30*3 (+ 6.25*3% AP))
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
