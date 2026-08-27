/* kayle — loaded on demand by index.html.
   Replace this file alone to change this champion. */
window.CHAMPION = {
    stepMenu:[
      {id:"aa",  kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"aaE",   kind:"attack", starfire:true, en:"Auto, Starfire", fr:"Auto, Lame stellaire"},
      {id:"aaEx",  kind:"attack", exalted:true, en:"Auto, exalted", fr:"Auto, exaltée"},
      {id:"q", kind:"spell", en:"Q — Radiant Blast", fr:"Q — Explosion radieuse"},
      {id:"w", kind:"cast", label:"W", en:"W — Celestial Blessing", fr:"W — Bénédiction céleste"},
      {id:"e", kind:"cast", label:"E", en:"E — Starfire Spellblade", fr:"E — Lame stellaire"},
      {id:"r", kind:"spell", en:"R — Divine Judgment", fr:"R — Jugement divin"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.kind === "attack" && st.starfire)
        out.parts.push({n:"starfire",
          v:A.eDmg + Math.max(0, hp - cur) * A.eMissPct/100, type:"magic"});
      if(st.kind === "attack" && st.exalted && A.pWave)
        out.parts.push({n:"divineAscent", v:A.pWave, type:"magic"});
      if(st.id === "q") out.parts.push({n:"radiantBlast",   v:A.qDmg, type:"magic"});
      if(st.id === "w") out.heal = A.wHeal;
      if(st.id === "r") out.parts.push({n:"divineJudgment", v:A.rDmg, type:"magic"});
      return out;
    },
    key:"kayle", name:"Kayle", splash:0,
    base:{hp:[670,92], mana:[330,50], ad:[50,2.5], ar:[26,4.2], mr:[22,1.3],
          as:0.625, asPerLevel:1.5, ms:335},
    abilities_meta:[
      {k:"q", en:"Radiant Blast",   fr:"Explosion radieuse"},
      {k:"w", en:"Celestial Blessing", fr:"Bénédiction céleste"},
      {k:"e", en:"Starfire Spellblade", fr:"Lame stellaire"},
      {k:"r", en:"Divine Judgment", fr:"Jugement divin"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[60,90,120,150,180], qBonusAD:0.60, qAP:0.50, qSlow:[25,30,35,40,45],
      wHeal:[55,80,105,130,155], wAP:0.25, wMs:[24,28,32,36,40], wMsAP:8,
      eFlat:[15,20,25,30,35], eBonusAD:0.10, eAP:0.20,
      eMissPct:[8,8.5,9,9.5,10], eMissAP:1.5,
      rDmg:[200,300,400], rBonusAD:1.00, rAP:0.70,
      qCd:[12,11,10,9,8], wCd:[15,15,15,15,15], eCd:[8,7.5,7,6.5,6], rCd:[160,120,80]
    },
    abilities(c){
      const {A, T, qr, wr, er, rr, tot, bonusAD, learned} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      A.qDmg    = R(T.qFlat,qr) + T.qBonusAD*bonusAD + T.qAP*ap;
      A.qSlow   = R(T.qSlow,qr);
      A.wHeal   = R(T.wHeal,wr) + T.wAP*ap;
      A.wMs     = R(T.wMs,wr) + T.wMsAP*ap/100;
      A.eDmg    = R(T.eFlat,er) + T.eBonusAD*bonusAD + T.eAP*ap;
      A.eMissPct= R(T.eMissPct,er) + T.eMissAP*ap/100;
      A.rDmg    = R(T.rDmg,rr) + T.rBonusAD*bonusAD + T.rAP*ap;
      /* Divine Ascent: four forms, taken at levels 1, 6, 11 and 16 */
      const L = c.L;
      A.pForm   = L >= 16 ? 4 : L >= 11 ? 3 : L >= 6 ? 2 : 1;
      A.pAsPer  = 6;                              /* per stack of Zeal, five of them */
      A.pAsMax  = 30;
      A.pRange  = L >= 16 ? 625 : L >= 6 ? 525 : 175;
      /* from level 11 an exalted attack throws a wave of fire */
      A.pWave   = L >= 11 ? 20 + 3 * (L - 11) + 0.10 * bonusAD + 0.25 * ap : 0;
      A.pAlways = L >= 16;                        /* exalted for good */
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah;
      A.eCd = R(T.eCd,er)/ah; A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qSlow=0; }
      if(!learned.w){ A.wHeal=0; A.wMs=0; }
      if(!learned.e){ A.eDmg=0; A.eMissPct=0; }
      if(!learned.r) A.rDmg=0;
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Divine Ascent","Ascension divine"],
    passiveRows(c){
      const {A, TR, n0, pc} = c;
      const form = ["Zealous","Arisen","Aflame","Transcendent"][A.pForm - 1];
      return [{lab:TR("kayForm"),  val:form},
              {lab:TR("kayRange"), val:n0(A.pRange)},
              {lab:TR("bonusAs"),  val:"+" + pc(A.pAsMax), awk:true},
              {lab:TR("kayWave"),  val:A.pWave ? n0(A.pWave) : "—", awk:true}];
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)}, {lab:TR("slow"), val:pc(A.qSlow)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("healing"), val:n0(A.wHeal)}, {lab:TR("msBonus"), val:"+" + pc(A.wMs)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)}, {lab:TR("kayEmiss"), val:pc(A.eMissPct), awk:true},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)}, {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };
