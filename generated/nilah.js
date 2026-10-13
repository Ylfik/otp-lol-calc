/* nilah — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Nilah.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"nilah", name:"Nilah", label:"Nilah", splash:0,
    base:{hp:[570,101], mana:[350,35], ad:[58,2],
          ar:[27,4.2], mr:[32,2.05],
          as:0.697, asPerLevel:1.25, ms:340},
    abilities_meta:[
      {k:"q", en:"Formless Blade", fr:"Lame fluide"},
      {k:"w", en:"Jubilant Veil", fr:"Voile de liesse"},
      {k:"e", en:"Slipstream", fr:"Torrent"},
      {k:"r", en:"Apotheosis", fr:"Apothéose"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[0,10,20,30,40], qAD:1, qMax:[0,19.1,38.2,57.3,76.4], qMaxAD:1.91, qCd:[4,4,4,4,4],
      wMs:[15,17.5,20,22.5,25], wCd:[26,25,24,23,22],
      eFlat:[60,70,80,90,100], eBonusAD:0.2,
      rTotal:[60,100,140], rTotalBonusAD:0.4, rFlat:[125,225,325], rBonusAD:1, rMax:[185,325,465], rMaxBonusAD:1.4, rCd:[110,95,80]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Formless Blade */
      A.qDmg = R(T.qFlat,qr) + T.qAD*tot.ad;
      A.qMax = R(T.qMax,qr) + T.qMaxAD*tot.ad;
      /* W — Jubilant Veil */
      A.wMs = R(T.wMs,wr);
      /* E — Slipstream */
      A.eDmg = R(T.eFlat,er) + T.eBonusAD*bonusAD;
      /* R — Apotheosis */
      A.rTotal = R(T.rTotal,rr) + T.rTotalBonusAD*bonusAD;
      A.rDmg = R(T.rFlat,rr) + T.rBonusAD*bonusAD;
      A.rMax = R(T.rMax,rr) + T.rMaxBonusAD*bonusAD;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qMax=0; }
      if(!learned.w){ A.wMs=0; }
      if(!learned.e){ A.eDmg=0; }
      if(!learned.r){ A.rTotal=0; A.rDmg=0; A.rMax=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Joy Unending","Joie éternelle"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Formless Blade", fr:"Q — Lame fluide"},
      {id:"w", kind:"cast", label:"W", en:"W — Jubilant Veil", fr:"W — Voile de liesse"},
      {id:"e", kind:"spell", en:"E — Slipstream", fr:"E — Torrent"},
      {id:"r", kind:"spell", en:"R — Apotheosis", fr:"R — Apothéose"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"formlessBlade", v:A.qDmg, type:"phys"});
      if(st.id === "e") out.parts.push({n:"slipstream", v:A.eDmg, type:"phys"});
      if(st.id === "r") out.parts.push({n:"apotheosis", v:A.rDmg, type:"phys"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("damage"), val:n0(A.qMax)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("msBonus"), val:"+" + pc(A.wMs)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)}],
        [{lab:TR("damage"), val:n0(A.rTotal)},
         {lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("damage"), val:n0(A.rMax)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q : pas de ligne de degats simple, « Minimum Physical Damage » prise comme ligne principale
   - E : aucune recharge dans les donnees wiki
   - R / Physical Damage per Tick : ligne non modelisee (15 to 35 3 (+ 10% bonus AD))
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
