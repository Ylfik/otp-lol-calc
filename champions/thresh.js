/* thresh — loaded on demand by index.html.
   Replace this file alone to change this champion. */
window.CHAMPION = {
    key:"thresh", name:"Thresh", splash:0,
    /* Damnation gives him no armour growth: souls are his armour */
    base:{hp:[620,120], mana:[274,44], ad:[56,2.2], ar:[33,0], mr:[30,1.55],
          as:0.625, asPerLevel:3.5, ms:330},
    abilities_meta:[
      {k:"q", en:"Death Sentence", fr:"Condamnation"},
      {k:"w", en:"Dark Passage",   fr:"Passage obscur"},
      {k:"e", en:"Flay",           fr:"Écorchement"},
      {k:"r", en:"The Box",        fr:"La Boîte"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    /* souls are gathered over a game, so the count is a build choice */
    stacks:{max:999, def:100, en:"Souls", fr:"âmes"},
    ranks:{
      qFlat:[100,150,200,250,300], qAP:0.90,
      wShield:[50,70,90,110,130], wPerSoul:2,
      ePerSoul:1.7, eADlo:0.90, eADhi:2.10,
      rFlat:[250,400,550], rAP:1.00,
      qCd:[19,16.5,14,11.5,9], wCd:[21,20,19,18,17], eCd:[13,12.25,11.5,10.75,10], rCd:[120,100,80]
    },
    abilities(c){
      const {A, T, qr, wr, er, rr, tot, learned} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      const n = c.stacks || 0;
      A.souls   = n;
      A.soulAR  = n * 0.75;                 /* each soul is armour and ability power */
      A.soulAP  = n * 0.75;
      A.qDmg    = R(T.qFlat,qr) + T.qAP*ap;
      A.wShield = R(T.wShield,wr) + T.wPerSoul * n;
      A.eMin    = T.ePerSoul * n;
      A.eMax    = A.eMin + (T.eADlo + (T.eADhi - T.eADlo) * (er - 1) / 4) * tot.ad;
      A.rDmg    = R(T.rFlat,rr) + T.rAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah;
      A.eCd = R(T.eCd,er)/ah; A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q) A.qDmg = 0;
      if(!learned.w) A.wShield = 0;
      if(!learned.e){ A.eMin = 0; A.eMax = 0; }
      if(!learned.r) A.rDmg = 0;
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Damnation","Damnation"],
    passiveRows(c){
      const {A, TR, n0} = c;
      return [{lab:TR("thSouls"), val:n0(A.souls)},
              {lab:TR("thSoulAr"), val:n0(A.soulAR)},
              {lab:TR("thSoulAp"), val:n0(A.soulAP)}];
    },
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Death Sentence", fr:"Q — Condamnation"},
      {id:"w", kind:"cast", label:"W", en:"W — Dark Passage", fr:"W — Passage obscur"},
      {id:"e", kind:"spell", en:"E — Flay, fully wound up", fr:"E — Écorchement, pleinement chargé"},
      {id:"r", kind:"spell", en:"R — The Box", fr:"R — La Boîte"}
    ],
    onStep(key, st, c){
      const {A} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"deathSentence", v:A.qDmg, type:"magic"});
      if(st.id === "w") out.shield = A.wShield;
      if(st.id === "e") out.parts.push({n:"flay", v:A.eMax, type:"magic"});
      if(st.id === "r") out.parts.push({n:"theBox", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, nf1} = c;
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)}, {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("shield"), val:n0(A.wShield)}, {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("thEmin"), val:n0(A.eMin)}, {lab:TR("thEmax"), val:n0(A.eMax), awk:true},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)}, {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
};
