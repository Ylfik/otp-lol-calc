/* Lucian — généré depuis les données du wiki, passif écrit à la main.

   Lightslinger : après un sort, l'attaque suivante tire un second coup.

     « deals 50 to 60 (paliers aux niveaux 1, 7, 13) % AD physical
       damage, increased to 100% AD against minions »
       — data/champions/Lucian, passif Lightslinger

   Ce sont des paliers, pas une montée continue : 50 % de l'AD du niveau
   1 au 6, 55 % du 7 au 12, 60 % ensuite.

   Vérifié par tools/check-passives.js. */
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
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[90,130,170,210,250], qBonusAD:1, qCd:[9,8,7,6,5],
      wFlat:[75,110,145,180,215], wAP:0.9, wMs:[60,65,70,75,80], wCd:[14,13,12,11,10],
      eCd:[16,15.5,15,14.5,14],
      rCd:[110,100,90],
      /* passif : paliers aux niveaux 1, 7 et 13, en part de l'AD total */
      pPaliers:[[1,50],[7,55],[13,60]]
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
      /* Lightslinger — le second coup */
      A.pPct = T.pPaliers.filter(([n]) => L >= n).pop()[1];
      A.pShot = A.pPct/100 * tot.ad;
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Lightslinger","Pistolero"],
    l10n:{
      lucianShot:["Lightslinger, the second shot","Tire-lumière, le second coup"]
    },
    passiveRows(c){
      const {A, TR, n0, pc} = c;
      return [{lab:TR("lucianShot"), val:n0(A.pShot) + " (" + pc(A.pPct) + " AD)"}];
    },
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"shot2", kind:"spell", en:"Lightslinger second shot", fr:"Second coup de Tire-lumière"},
      {id:"q", kind:"spell", en:"Q — Piercing Light", fr:"Q — Lumière perforante"},
      {id:"w", kind:"spell", en:"W — Ardent Blaze", fr:"W — Flamboiement"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "shot2") out.parts.push({n:"lightslinger", v:A.pShot, type:"phys"});
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

/* Le passif, que le générateur ne sait pas lire, est écrit plus haut. */
