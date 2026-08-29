/* tahmkench — loaded on demand by index.html.
   Replace this file alone to change this champion. */
window.CHAMPION = {
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Tongue Lash",  fr:"Q — Coup de langue"},
      {id:"w", kind:"spell", en:"W — Abyssal Dive", fr:"W — Plongée abyssale"},
      {id:"r", kind:"cast", label:"R", en:"R — Devour", fr:"R — Dévoration"}
    ],
    onStep(key, st, c){
      const {A} = c, out = {parts:[]};
      /* An Acquired Taste rides on every attack and on the Q */
      if(st.kind === "attack") out.parts.push({n:"acquiredTaste", v:A.pOnHit, type:"magic"});
      if(st.id === "q"){ out.parts.push({n:"tongueLash", v:A.qDmg + A.pOnHit, type:"magic"}); out.heal = A.qHeal; }
      if(st.id === "w") out.parts.push({n:"abyssalDive", v:A.wDmg, type:"magic"});
      if(st.id === "r") out.shield = A.rShield;
      return out;
    },
    key:"tahmkench", name:"TahmKench", splash:0, label:"Tahm Kench",
    base:{hp:[640,103], mana:[325,50], ad:[56,3.2], ar:[39,4.7], mr:[32,2.05],
          as:0.658, asPerLevel:2.5, ms:335},
    abilities_meta:[
      {k:"q", en:"Tongue Lash",    fr:"Coup de langue"},
      {k:"w", en:"Abyssal Dive", fr:"Plongée abyssale"},
      {k:"e", en:"Thick Skin",     fr:"Peau épaisse"},
      {k:"r", en:"Devour", fr:"Dévoration"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[75,120,165,210,255], qAP:1.00,
      qHeal:[10,15,20,25,30], qHealMiss:[5,5.5,6,6.5,7],
      wFlat:[100,135,170,205,240], wAP:1.50, wRefund:[40,42.5,45,47.5,50],
      eStore:[15,23,31,39,47], eStoreUp:[42,44,46,48,50],
      rShield:[650,800,950], rAP:1.00,
      qCd:[7,6.5,6,5.5,5], wCd:[21,20,19,18,17], eCd:[3,3,3,3,3], rCd:[120,100,80]
    },
    abilities(c){
      const {A, T, qr, wr, er, rr, tot, learned} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      A.qDmg      = R(T.qFlat,qr) + T.qAP*ap;
      A.qHeal     = R(T.qHeal,qr);
      A.qHealMiss = R(T.qHealMiss,qr);
      A.wDmg      = R(T.wFlat,wr) + T.wAP*ap;
      A.wRefund   = R(T.wRefund,wr);
      A.eStore    = R(T.eStore,er);
      A.eStoreUp  = R(T.eStoreUp,er);
      A.rShield   = R(T.rShield,rr) + T.rAP*ap;
      /* An Acquired Taste: bonus magic damage on attacks and on the Q */
      const bonusHP = tot.hp - c.base.hp;
      A.pOnHit = c.lerp(5, 60, c.L, 12) + 0.04 * bonusHP + (1.25 * bonusHP / 100) * ap / 100;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah;
      A.eCd = R(T.eCd,er); A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qHeal=0; }
      if(!learned.w){ A.wDmg=0; }
      if(!learned.r) A.rShield=0;
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["An Acquired Taste","Goût acquis"],
    passiveRows(c){
      const {A, TR, n0} = c;
      return [
        {lab:TR("tPhit"),  val:n0(A.pOnHit)},
        {lab:TR("kMarks"), val:"3"}
      ];
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("healing"), val:n0(A.qHeal) + " + " + pc(A.qHealMiss)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)}, {lab:TR("tRefund"), val:pc(A.wRefund)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("tStore"), val:pc(A.eStore)}, {lab:TR("tStoreUp"), val:pc(A.eStoreUp), awk:true},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("shield"), val:n0(A.rShield)}, {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };
