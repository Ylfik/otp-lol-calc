/* irelia — loaded on demand by index.html.
   Replace this file alone to change this champion. */
window.CHAMPION = {
    stepMenu:[
      {id:"aa",  kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"aaF", kind:"attack", fervor:true, en:"Auto, four stacks", fr:"Auto, quatre charges"},
      {id:"q", kind:"spell", en:"Q — Bladesurge",   fr:"Q — Rush fatal"},
      {id:"w", kind:"spell", en:"W — Defiant Dance, charged", fr:"W — Danse de défi, chargée"},
      {id:"e", kind:"spell", en:"E — Flawless Duet", fr:"E — Duo parfait"},
      {id:"r", kind:"spell", en:"R — Vanguard's Edge", fr:"R — Pointe de l'avant-garde"}
    ],
    onStep(key, st, c){
      const {A} = c, out = {parts:[]};
      if(st.id === "q"){ out.parts.push({n:"bladesurge", v:A.qDmg, type:"phys"}); out.heal = A.qHeal; }
      if(st.id === "w") out.parts.push({n:"defiantDance",  v:A.wMax, type:"phys"});
      if(st.id === "e") out.parts.push({n:"flawlessDuet",  v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"vanguardsEdge", v:A.rDmg, type:"magic"});
      if(st.kind === "attack" && st.fervor)
        out.parts.push({n:"ionianFervor", v:A.pOnHit, type:"magic"});
      return out;
    },
    key:"irelia", name:"Irelia", splash:0,
    base:{hp:[630,115], mana:[350,50], ad:[65,3.5], ar:[36,4.7], mr:[30,2.05],
          as:0.656, asPerLevel:2.5, ms:335},
    abilities_meta:[
      {k:"q", en:"Bladesurge", fr:"Rush fatal"},
      {k:"w", en:"Defiant Dance", fr:"Danse de défi"},
      {k:"e", en:"Flawless Duet", fr:"Duo parfait"},
      {k:"r", en:"Vanguard's Edge", fr:"Pointe de l'avant-garde"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[5,25,45,65,85], qAD:0.70, qHealPct:[9,10,11,12,13],
      wMin:[10,20,30,40,50], wMinAD:0.40, wMinAP:0.50,
      eDmg:[70,110,150,190,230], eAP:1.00,
      rDmg:[125,200,275], rAP:0.70,
      qCd:[10,9,8,7,6], wCd:[20,18,16,14,12], eCd:[16,14.5,13,11.5,10], rCd:[125,105,85]
    },
    abilities(c){
      const {A, T, qr, wr, er, rr, tot, bonusAD, lerp, learned} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      A.qDmg  = R(T.qFlat,qr) + T.qAD*tot.ad;
      A.qHeal = R(T.qHealPct,qr)/100 * tot.ad;
      A.wMin  = R(T.wMin,wr) + T.wMinAD*tot.ad + T.wMinAP*ap;
      A.wMax  = A.wMin * 3;                     /* held to full charge */
      A.eDmg  = R(T.eDmg,er) + T.eAP*ap;
      A.rDmg  = R(T.rDmg,rr) + T.rAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah;
      A.eCd = R(T.eCd,er)/ah; A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qHeal=0; }
      if(!learned.w){ A.wMin=0; A.wMax=0; }
      if(!learned.e) A.eDmg=0;
      if(!learned.r) A.rDmg=0;
      /* Ionian Fervor: attack speed per stack, and an on-hit at four */
      A.pAsPer   = lerp(10, 25, c.L);
      A.pAsMax   = A.pAsPer * 4;
      A.pOnHit   = lerp(10, 61, c.L) + 0.20 * bonusAD;
      A.pStacks  = 4;
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Ionian Fervor","Ferveur ionienne"],
    passiveRows(c){
      const {A, TR, n0, pc} = c;
      return [
        {lab:TR("iPas"),    val:"+" + pc(A.pAsPer)},
        {lab:TR("iPasMax"), val:"+" + pc(A.pAsMax), awk:true},
        {lab:TR("iPhit"),   val:n0(A.pOnHit), awk:true},
        {lab:TR("kMarks"),  val:"4"}
      ];
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)}, {lab:TR("healing"), val:n0(A.qHeal)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("iWmin"), val:n0(A.wMin)}, {lab:TR("iWmax"), val:n0(A.wMax), awk:true},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)}, {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)}, {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };
