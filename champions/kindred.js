/* kindred — loaded on demand by index.html.
   Replace this file alone to change this champion. */
window.CHAMPION = {
    key:"kindred", name:"Kindred", splash:0,
    base:{hp:[595,104], mana:[300,35], ad:[65,3.25], ar:[29,4.7], mr:[33,1.1],
          as:0.625, asPerLevel:3.5, ms:325},
    abilities_meta:[
      {k:"q", en:"Dance of Arrows",       fr:"Danse des flèches"},
      {k:"w", en:"Wolf's Frenzy",         fr:"Frénésie de Loup"},
      {k:"e", en:"Mounting Dread", fr:"Terreur mortelle"},
      {k:"r", en:"Lamb's Respite", fr:"Repos d'Agneau"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    /* marks are gathered over a game and make the kit scale */
    stacks:{max:99, def:6, en:"Marks", fr:"marques"},
    ranks:{
      qFlat:[40,65,90,115,140], qBonusAD:0.75,
      wFlat:[25,30,35,40,45], wBonusAD:0.20, wAP:0.20, wPct:1.5, wPctPerMark:1,
      eFlat:[80,110,140,170,200], eBonusAD:1.00, ePct:5, ePctPerMark:0.5,
      rHeal:[225,300,375],
      qCd:[9,9,9,9,9], wCd:[18,17,16,15,14], eCd:[14,12.5,11,9.5,8], rCd:[160,140,120]
    },
    abilities(c){
      const {A, T, qr, wr, er, rr, tot, bonusAD, learned} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      const n = c.stacks || 0;
      A.marks   = n;
      /* the wiki's table: nothing before four marks, +75 there, then +25 every
         three more, up to +250 at twenty-five */
      A.range   = 500 + (n < 4 ? 0 : Math.min(250, 75 + 25 * Math.floor((n - 4) / 3)));
      A.qDmg    = R(T.qFlat,qr) + T.qBonusAD*bonusAD;
      A.wDmg    = R(T.wFlat,wr) + T.wBonusAD*bonusAD + T.wAP*ap;
      A.wPct    = T.wPct + T.wPctPerMark * n;      /* of the target's current health */
      A.eDmg    = R(T.eFlat,er) + T.eBonusAD*bonusAD;
      A.ePct    = T.ePct + T.ePctPerMark * n;      /* of the target's missing health */
      A.eSlow   = 30 + 5 * ap / 100;
      A.qAS     = 35 + 5 * n;                      /* and it resets her attack */
      /* Wolf's pounce is not a critical strike: the chance simply raises it,
         by up to 50% at full crit, and excess crit chance is wasted */
      A.eCritUp = Math.min(1, tot.crit / 100) * 50;
      A.rHeal   = R(T.rHeal,rr);
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah;
      A.eCd = R(T.eCd,er)/ah; A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg = 0; A.qAS = 0; }
      if(!learned.w){ A.wDmg = 0; A.wPct = 0; }
      if(!learned.e){ A.eDmg = 0; A.ePct = 0; }
      if(!learned.r) A.rHeal = 0;
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Mark of the Kindred","Marque de Kindred"],
    passiveRows(c){
      const {A, TR, n0} = c;
      return [{lab:TR("kdMarks"), val:n0(A.marks)}, {lab:TR("kdRange"), val:n0(A.range)}];
    },
    /* Mounting Dread marks, the attacks stack it, the third sends Wolf */
    newState(){ return {dread:0, marked:false}; },
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Dance of Arrows", fr:"Q — Danse des flèches"},
      {id:"w", kind:"spell", en:"W — Wolf's Frenzy, the whole zone",
       fr:"W — Frénésie de Loup, toute la zone",
       /* Wolf bites for four seconds at Lamb's own rate */
       times:c => Math.max(1, 4 * (c.tot.as || 0.6))},
      {id:"e", kind:"cast", label:"E", en:"E — Mounting Dread, the mark", fr:"E — Terreur mortelle, la marque"},
      {id:"r", kind:"cast", label:"R", en:"R — Lamb's Respite", fr:"R — Repos d'Agneau"}
    ],
    onStep(key, st, c){
      const {A, hp, cur, memo} = c, out = {parts:[]};
      if(st.id === "q"){
        out.parts.push({n:"danceOfArrows", v:A.qDmg, type:"phys"});
        out.asBonus = A.qAS;
        out.reset = true;                 /* it resets her attack timer */
      }
      if(st.id === "w")
        out.parts.push({n:"wolfsFrenzy", v:A.wDmg + cur*A.wPct/100, type:"magic"});
      /* the cast only marks and slows; Wolf pounces on the third attack after it */
      if(st.id === "e"){ memo.marked = true; memo.dread = 0; }
      if(st.kind === "attack" && memo.marked){
        memo.dread++;
        if(memo.dread >= 3){
          memo.dread = 0; memo.marked = false;
          out.parts.push({n:"mountingDread",
            v:(A.eDmg + Math.max(0, hp - cur)*A.ePct/100) * (1 + A.eCritUp/100), type:"phys"});
        }
      }
      if(st.id === "r") out.heal = A.rHeal;
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)}, {lab:TR("bonusAs"), val:"+" + pc(A.qAS), awk:true},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)}, {lab:TR("kdWpct"), val:pc(A.wPct), awk:true},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)}, {lab:TR("kdEpct"), val:pc(A.ePct), awk:true},
         {lab:TR("kdEcrit"), val:"+" + pc(A.eCritUp), awk:true},
         {lab:TR("slow"), val:pc(A.eSlow)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("healing"), val:n0(A.rHeal)}, {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
};
