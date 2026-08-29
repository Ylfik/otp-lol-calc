/* lillia — loaded on demand by index.html.
   Replace this file alone to change this champion. */
window.CHAMPION = {
    key:"lillia", name:"Lillia", label:"Lilia", splash:0,
    base:{hp:[605,105], mana:[410,50], ad:[61,3.1], ar:[22,4.5], mr:[32,1.55],
          as:0.625, asPerLevel:2.7, ms:330},
    abilities_meta:[
      {k:"q", en:"Blooming Blows", fr:"Frappe fleurie"},
      {k:"w", en:"Watch Out! Eep!", fr:"Attention, désolée !"},
      {k:"e", en:"Swirlseed", fr:"Graine tournoyante"},
      {k:"r", en:"Lilting Lullaby", fr:"Douce berceuse"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[35,45,55,65,75], qAP:0.35, qMs:[3,4,5,6,7], qMsAP:3,
      wFlat:[80,100,120,140,160], wAP:0.35, wCentre:3,
      eFlat:[60,85,110,135,160], eAP:0.50,
      rFlat:[100,150,200], rAP:0.40,
      qCd:[6,5.5,5,4.5,4], wCd:[14,13,12,11,10], eCd:[12,12,12,12,12], rCd:[150,130,110]
    },
    abilities(c){
      const {A, T, qr, wr, er, rr, tot, learned} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      A.qBoth = A.qDmg * 2;
      A.qMs = R(T.qMs,qr) + T.qMsAP*ap/100;
      A.qMsMax = A.qMs * 4;
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      A.wCentre = A.wDmg * T.wCentre;
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      /* Dream Dust: everything she touches burns for a share of its health */
      A.pPct  = 5 + 1.25 * ap / 100;
      A.pHeal = 6 + (90 - 6) * (c.L - 1) / 17 + 0.30 * ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah;
      A.eCd = R(T.eCd,er)/ah; A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg = 0; A.qBoth = 0; A.qMs = 0; A.qMsMax = 0; }
      if(!learned.w){ A.wDmg = 0; A.wCentre = 0; }
      if(!learned.e) A.eDmg = 0;
      if(!learned.r) A.rDmg = 0;
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Dream-Laden Bough","Bâton chargé de rêves"],
    passiveRows(c){
      const {A, TR, n0, pc} = c;
      return [{lab:TR("lPpct"),  val:pc(A.pPct)},
              {lab:TR("lPheal"), val:n0(A.pHeal), awk:true}];
    },
    stepMenu:[
      {id:"aa",   kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"dust", kind:"spell", dust:true, en:"Dream Dust, full burn", fr:"Poussière de rêve, brûlure complète"},
      {id:"q",  kind:"spell", en:"Q — Blooming Blows", fr:"Q — Frappe fleurie"},
      {id:"w",  kind:"spell", en:"W — Watch Out! Eep!", fr:"W — Attention, désolée !"},
      {id:"wC", kind:"spell", centre:true, en:"W — struck in the centre", fr:"W — Attention, désolée !"},
      {id:"e",  kind:"spell", en:"E — Swirlseed", fr:"E — Graine tournoyante"},
      {id:"r",  kind:"spell", en:"R — Lilting Lullaby", fr:"R — Douce berceuse"}
    ],
    onStep(key, st, c){
      const {A} = c, out = {parts:[]};
      if(st.dust){
        out.parts.push({n:"dreamDust", v:c.hp*A.pPct/100, type:"magic"});
        out.heal = A.pHeal;
      }
      if(st.id === "q")  out.parts.push({n:"bloomingBlows", v:A.qBoth, type:"magic"});
      if(st.id === "w")  out.parts.push({n:"watchOut", v:A.wDmg, type:"magic"});
      if(st.id === "wC") out.parts.push({n:"watchOutCentre", v:A.wCentre, type:"magic"});
      if(st.id === "e")  out.parts.push({n:"swirlseed", v:A.eDmg, type:"magic"});
      if(st.id === "r")  out.parts.push({n:"lullaby", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      return [
        [{lab:TR("lQboth"), val:n0(A.qBoth)}, {lab:TR("msBonus"), val:"+" + pc(A.qMsMax), awk:true},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)}, {lab:TR("lWcentre"), val:n0(A.wCentre), awk:true},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)}, {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)}, {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };
