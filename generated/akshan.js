/* akshan — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Akshan.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"akshan", name:"Akshan", label:"Akshan", splash:0,
    base:{hp:[610,107], mana:[350,40], ad:[52,3],
          ar:[26,4.7], mr:[33,1.1],
          as:0.638, asPerLevel:4, ms:330},
    abilities_meta:[
      {k:"q", en:"Avengerang", fr:"Vengerang"},
      {k:"w", en:"Going Rogue", fr:"Cavalier seul"},
      {k:"e", en:"Heroic Swing", fr:"Envolée héroïque"},
      {k:"r", en:"Comeuppance", fr:"Bien mérité !"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[45,75,105,135,165], qBonusAD:0.7, qTotal:[90,150,210,270,330], qTotalBonusAD:1.4, qCd:[9,8,7,6,5],
      wMs:[80,90,100,110,120], wCd:[18,14,10,6,2],
      eCd:[18,16.5,15,13.5,12],
      rMin:[125,210,315], rMinAD:[0.75,0.9,1.05], rFlat:[375,630,945], rAD:[2.25,2.7,3.15], rCd:[100,85,70]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Avengerang */
      A.qDmg = R(T.qFlat,qr) + T.qBonusAD*bonusAD;
      A.qTotal = R(T.qTotal,qr) + T.qTotalBonusAD*bonusAD;
      /* W — Going Rogue */
      A.wMs = R(T.wMs,wr);
      /* R — Comeuppance */
      A.rMin = R(T.rMin,rr) + R(T.rMinAD,rr)*tot.ad;
      A.rDmg = R(T.rFlat,rr) + R(T.rAD,rr)*tot.ad;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qTotal=0; }
      if(!learned.w){ A.wMs=0; }
      if(!learned.r){ A.rMin=0; A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Dirty Fighting","Fourberie"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Avengerang", fr:"Q — Vengerang"},
      {id:"w", kind:"cast", label:"W", en:"W — Going Rogue", fr:"W — Cavalier seul"},
      {id:"r", kind:"spell", en:"R — Comeuppance", fr:"R — Bien mérité !"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"avengerang", v:A.qDmg, type:"phys"});
      if(st.id === "r") out.parts.push({n:"comeuppance", v:A.rDmg, type:"phys"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("damage"), val:n0(A.qTotal)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("msBonus"), val:"+" + pc(A.wMs)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rMin)},
         {lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q / Non-Champion Damage : ligne non modelisee (40 to 80%)
   - E / Physical Damage per Shot : ligne non modelisee (8 to 40 (+ 25% AD) (1 + 0.3 per 100% bonus attack speed))
   - R / Maximum Bullets Stored : ligne non modelisee (5 to 7)
   - R / Bullet Storing Interval Time : ligne non modelisee (2.5/4 to 2.5/6 seconds)
   - R / Minimum Physical Damage per Bullet : ligne non modelisee (25 to 45 (+ 15% AD)<!-- -->)
   - R / Maximum Physical Damage per Bullet : ligne non modelisee (25*3 to 45*3 (+ 15*3% AD)<!-- -->)
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
