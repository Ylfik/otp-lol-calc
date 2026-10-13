/* lucian — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Lucian.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"lucian", name:"Lucian", label:"Lucian", splash:0,
    base:{hp:[641,100], mana:[320,43], ad:[60,2.9],
          ar:[28,4.2], mr:[33,1.1],
          as:0.638, asPerLevel:2.5, ms:335},
    abilities_meta:[
      {k:"q", en:"Piercing Light", fr:"Lumière perforante"},
      {k:"w", en:"Ardent Blaze", fr:"Flamboiement"},
      {k:"e", en:"Relentless Pursuit", fr:"Poursuite inlassable"},
      {k:"r", en:"The Culling", fr:"Déluge de balles"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[90,130,170,210,250], qBonusAD:1, qCd:[9,8,7,6,5],
      wFlat:[75,110,145,180,215], wAP:0.9, wMs:[60,65,70,75,80], wCd:[14,13,12,11,10],
      eCd:[16,15.5,15,14.5,14],
      rCd:[110,100,90]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Piercing Light */
      A.qDmg = R(T.qFlat,qr) + T.qBonusAD*bonusAD;
      /* W — Ardent Blaze */
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      A.wMs = R(T.wMs,wr);
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wDmg=0; A.wMs=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Lightslinger","Pistolero"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Piercing Light", fr:"Q — Lumière perforante"},
      {id:"w", kind:"spell", en:"W — Ardent Blaze", fr:"W — Flamboiement"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"piercingLight", v:A.qDmg, type:"phys"});
      if(st.id === "w") out.parts.push({n:"ardentBlaze", v:A.wDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("msBonus"), val:"+" + pc(A.wMs)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - R / Physical Damage Per Shot : ligne non modelisee (15 to 45 (+ 25% AD) (+ 15% AP))
   - R / Minion Damage Per Shot : ligne non modelisee ((15 to 45)*2.0 (+ 25*2.0% AD) (+ 15*2.0% AP))
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
