/* zeri — loaded on demand by index.html.
   Replace this file alone to change this champion. */
window.CHAMPION = {
    stepMenu:[
      {id:"aa",     kind:"attack", en:"Auto — a zap", fr:"Auto — un zap"},
      {id:"aaFull", kind:"attack", full:true, en:"Auto, full charge", fr:"Auto, charge pleine"},
      {id:"q", kind:"spell", en:"Q — Burst Fire",       fr:"Q — Rafale"},
      {id:"w", kind:"spell", en:"W — Ultrashock Laser", fr:"W — Laser électrocuteur"},
      {id:"e", kind:"spell", en:"E — Spark Surge",      fr:"E — Charge ionique"},
      {id:"r", kind:"cast", label:"R", en:"R — Lightning Crash", fr:"R — Éruption électrique"}
    ],
    onStep(key, st, c){
      const {A, hp} = c, out = {parts:[]};
      if(st.kind === "attack"){
        out.parts.push({n:"zap", v:A.pZap, type:"magic"});   /* her attack is a zap */
        if(st.full) out.parts.push({n:"fullCharge", v:A.pFull + hp*A.pFullPct/100, type:"magic"});
      }
      if(st.id === "q") out.parts.push({n:"burstFire",  v:A.qBurst, type:"phys"});
      if(st.id === "qR"){
        out.parts.push({n:"burstFire",     v:A.qBurst,  type:"phys"});
        out.parts.push({n:"lightningRound", v:A.rQbonus, type:"magic"});
      }
      if(st.id === "w") out.parts.push({n:"ultrashock", v:A.wDmg,   type:"phys"});
      if(st.id === "e") out.parts.push({n:"sparkSurge", v:A.eDmg,   type:"magic"});
      if(st.id === "r") out.parts.push({n:"lightningCrash", v:A.rDmg, type:"magic"});
      return out;
    },
    key:"zeri", name:"Zeri", splash:0,
    base:{hp:[600,110], mana:[250,45], ad:[56,2], ar:[24,4.2], mr:[33,1.1],
          as:0.658, asPerLevel:2, ms:330},
    abilities_meta:[
      {k:"q", en:"Burst Fire", fr:"Rafale"},
      {k:"w", en:"Ultrashock Laser", fr:"Laser électrocuteur"},
      {k:"e", en:"Spark Surge", fr:"Charge ionique"},
      {k:"r", en:"Lightning Crash", fr:"Éruption électrique"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      /* the Q is her basic attack: one burst of 7 pellets */
      qFlat:[15,17,19,21,23], qADlo:104, qADhi:120, qRounds:7,
      wFlat:[30,70,110,150,190], wAD:1.20, wAP:0.50, wSlow:[30,35,40,45,50],
      eDmg:[22,24,26,28,30], eAP:0.20,
      rDmg:[150,250,350], rBonusAD:0.60, rAP:1.10,
      wCd:[12,11,10,9,8], eCd:[24,22.5,21,19.5,18], rCd:[80,75,70]
    },
    abilities(c){
      const {A, T, qr, wr, er, rr, tot, learned} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      const bonusAD = c.bonusAD;
      const adPct = T.qADlo + (T.qADhi - T.qADlo) * (qr - 1) / 4;
      A.qBurst   = R(T.qFlat,qr) + adPct/100 * tot.ad;
      A.qPerHit  = A.qBurst / T.qRounds;
      A.qRounds  = T.qRounds;
      A.wDmg     = R(T.wFlat,wr) + T.wAD*tot.ad + T.wAP*ap;
      A.wSlow    = R(T.wSlow,wr);
      A.eDmg     = R(T.eDmg,er) + T.eAP*ap;
      A.rDmg     = R(T.rDmg,rr) + T.rBonusAD*bonusAD + T.rAP*ap;
      /* Lightning Rounds: her Q gains bonus magic damage, doubled at full crit */
      A.rCritUp  = Math.min(100, tot.crit);
      A.rQbonus  = (22 + (30 - 22) * (rr - 1) / 2 + 0.20 * ap) * (1 + A.rCritUp/100);
      /* Living Battery: her attack is a zap, and at full charge it detonates */
      const L = c.L;
      A.pZap     = (10 + (15/17)*(L-1)) * (0.7025 + 0.0175*(L-1)) + 0.03*ap;
      A.pExec    = c.lerp(70, 160, L) + 0.20*ap;      /* the health it finishes below */
      A.pFull    = c.lerp(75, 160, L) + 1.10*ap;
      A.pFullPct = c.lerp(1, 11, L);                  /* of the target's maximum health */
      A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qBurst=0; A.qPerHit=0; }
      if(!learned.w){ A.wDmg=0; A.wSlow=0; }
      if(!learned.e) A.eDmg=0;
      if(!learned.r) A.rDmg=0;
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Living Battery","Batterie vivante"],
    passiveRows(c){
      const {A, TR, n0, pc} = c;
      return [
        {lab:TR("zPzap"),    val:n0(A.pZap)},
        {lab:TR("zPexec"),   val:n0(A.pExec)},
        {lab:TR("zPfull"),   val:n0(A.pFull), awk:true},
        {lab:TR("zPfullPct"),val:pc(A.pFullPct), awk:true}
      ];
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      return [
        [{lab:TR("zQburst"), val:n0(A.qBurst)},
         {lab:TR("zQhit"),   val:n0(A.qPerHit) + " x " + A.qRounds, awk:true}],
        [{lab:TR("damage"), val:n0(A.wDmg)}, {lab:TR("slow"), val:pc(A.wSlow)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)}, {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("zRq"), val:n0(A.rQbonus), awk:true},
         {lab:TR("kdEcrit"), val:"+" + pc(A.rCritUp), awk:true},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };
