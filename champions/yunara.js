/* yunara — loaded on demand by index.html.
   Replace this file alone to change this champion. */
window.CHAMPION = {
    stepMenu:[
      {id:"aa",  kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"aaQ", kind:"attack", empowered:true, en:"Auto, Q active", fr:"Auto, Q actif"},
      {id:"q", kind:"cast", label:"Q", en:"Q — Path of Devotion", fr:"Q — Voie de la dévotion"},
      {id:"w", kind:"spell", en:"W — Blade Sever", fr:"W — Lame tranchante"},
      {id:"e", kind:"cast", label:"E", en:"E — Unseen Step", fr:"E — Pas invisible"},
      {id:"r", kind:"spell", en:"R — Arc of Ruin", fr:"R — Arc de ruine"}
    ],
    onStep(key, st, c){
      const {A} = c, out = {parts:[]};
      if(st.kind === "attack")
        out.parts.push({n:"pathOfDevotion", v:st.empowered ? A.qBoth : A.qPassive, type:"magic"});
      if(st.id === "q") out.asBonus = A.qAS;
      if(st.id === "w"){
        out.parts.push({n:"bladeSever",       v:A.wDmg,    type:"magic"});
        out.parts.push({n:"bladeSeverLinger", v:A.wLinger, type:"magic"});
      }
      if(st.id === "r") out.parts.push({n:"arcOfRuin", v:A.rDmg, type:"magic"});
      return out;
    },
    key:"yunara", name:"Yunara", splash:0,
    base:{hp:[590,110], mana:[275,45], ad:[55,3], ar:[25,4.4], mr:[33,1.1],
          as:0.65, asPerLevel:2, ms:325},
    abilities_meta:[
      {k:"q", en:"Path of Devotion", fr:"Voie de la dévotion"},
      {k:"w", en:"Blade Sever",      fr:"Lame tranchante"},
      {k:"e", en:"Unseen Step",      fr:"Pas invisible"},
      {k:"r", en:"Arc of Ruin",      fr:"Arc de ruine"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qPass:[5,10,15,20,25], qAP:0.20, qAS:[20,30,40,50,60],
      wFlat:[55,95,135,175,215], wBonusAD:0.85, wAP:0.50, wLinger:0.6,
      eMs:[30,35,40,45,50],
      rDmg:[160,320,480],
      wCd:[10,10,10,10,10], eCd:[9,9,9,9,9], rCd:[100,90,80]
    },
    abilities(c){
      const {A, T, qr, wr, er, rr, tot, learned} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      const bonusAD = c.bonusAD;
      A.qPassive = R(T.qPass,qr) + T.qAP*ap;
      A.qActive  = A.qPassive;                     /* the active adds the same again */
      A.qBoth    = A.qPassive + A.qActive;
      A.qAS      = R(T.qAS,qr);
      A.wDmg     = R(T.wFlat,wr) + T.wBonusAD*bonusAD + T.wAP*ap;
      A.wLinger  = A.wDmg * T.wLinger;             /* spread over four ticks */
      A.eMs      = R(T.eMs,er);
      A.eMsUp    = A.eMs * 1.5;
      A.rDmg     = R(T.rDmg,rr);
      /* every critical strike carries bonus magic damage on top */
      A.pCritPct = 10 + 10 * ap / 100;
      A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qPassive=0; A.qActive=0; A.qBoth=0; A.qAS=0; }
      if(!learned.w){ A.wDmg=0; A.wLinger=0; }
      if(!learned.e){ A.eMs=0; A.eMsUp=0; }
      if(!learned.r) A.rDmg=0;
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Chosen of the Kanmei","Élue des Kanmei"],
    passiveRows(c){
      const {A, TR, pc} = c;
      return [{lab:TR("yPcrit"), val:pc(A.pCritPct)}];
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      return [
        [{lab:TR("yQpass"), val:n0(A.qPassive)},
         {lab:TR("yQboth"), val:n0(A.qBoth), awk:true},
         {lab:TR("bonusAs"), val:"+" + pc(A.qAS)}],
        [{lab:TR("yWinit"), val:n0(A.wDmg)}, {lab:TR("yWling"), val:n0(A.wLinger), awk:true},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("msBonus"), val:"+" + pc(A.eMs)}, {lab:TR("yEup"), val:"+" + pc(A.eMsUp), awk:true},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)}, {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };
