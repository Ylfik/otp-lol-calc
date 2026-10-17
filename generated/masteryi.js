/* masteryi — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Master Yi.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"masteryi", name:"MasterYi", label:"Master Yi", splash:0,
    base:{hp:[640,105], mana:[251,42], ad:[65,2.5],
          ar:[33,5], mr:[32,2.05],
          as:0.679, asPerLevel:2.5, ms:355},
    abilities_meta:[
      {k:"q", en:"Alpha Strike", fr:"Assaut éclair"},
      {k:"w", en:"Meditate", fr:"Méditation"},
      {k:"e", en:"Wuju Style", fr:"Style Wuju"},
      {k:"r", en:"Highlander", fr:"Highlander"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[20,40,60,80,100], qAD:0.7, qMax:[35,70,105,140,175], qMaxAD:1.225, qCd:[20,19.5,19,18.5,18],
      wHealMin:[120,200,280,360,440], wHealMinAP:1, wHealMax:[240,400,560,720,880], wHealMaxAP:2, wCd:[10,10,10,10,10],
      eFlat:[20,25,30,35,40], eBonusAD:0.35, eCd:[14,14,14,14,14],
      rAS:[25,45,65], rMs:[40,50,60], rCd:[85,85,85]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Alpha Strike */
      A.qDmg = R(T.qFlat,qr) + T.qAD*tot.ad;
      A.qMax = R(T.qMax,qr) + T.qMaxAD*tot.ad;
      /* W — Meditate */
      A.wHealMin = R(T.wHealMin,wr) + T.wHealMinAP*ap;
      A.wHealMax = R(T.wHealMax,wr) + T.wHealMaxAP*ap;
      /* E — Wuju Style */
      A.eDmg = R(T.eFlat,er) + T.eBonusAD*bonusAD;
      /* R — Highlander */
      A.rAS = R(T.rAS,rr);
      A.rMs = R(T.rMs,rr);
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qMax=0; }
      if(!learned.w){ A.wHealMin=0; A.wHealMax=0; }
      if(!learned.e){ A.eDmg=0; }
      if(!learned.r){ A.rAS=0; A.rMs=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Double Strike","Coup double"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Alpha Strike", fr:"Q — Assaut éclair"},
      {id:"w", kind:"cast", label:"W", en:"W — Meditate", fr:"W — Méditation"},
      {id:"e", kind:"spell", en:"E — Wuju Style", fr:"E — Style Wuju"},
      {id:"r", kind:"cast", label:"R", en:"R — Highlander", fr:"R — Highlander"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"alphaStrike", v:A.qDmg, type:"phys"});
      if(st.id === "w") out.heal = A.wHealMin;
      if(st.id === "e") out.parts.push({n:"wujuStyle", v:A.eDmg, type:"true"});
      if(st.id === "r") out.asBonus = A.rAS;
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("damage"), val:n0(A.qMax)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("healing"), val:n0(A.wHealMin)},
         {lab:TR("healing"), val:n0(A.wHealMax)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("bonusAs"), val:"+" + pc(A.rAS)},
         {lab:TR("msBonus"), val:"+" + pc(A.rMs)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q / Reduced Damage per hit : ligne non modelisee (20*0.25 to 100*0.25 (+ 70*0.25% AD))
   - Q / Primary Bonus Monster Damage : ligne non modelisee (60 to 160)
   - Q / Combined Primary Monster Damage : ligne non modelisee (20+60 to 100+160 (+ 70% AD))
   - Q / Reduced Monster Damage per hit : ligne non modelisee ((20+60)*0.25 to (100+160)*0.25 (+ 70*0.25% AD))
   - Q / Max Single-Target Monster Damage : ligne non modelisee ((20+60)*(1+0.25*3) to (100+160)*(1+0.25*3) (+ 70*(1+0.25*3)% AD))
   - W / Minimum Heal Per Tick : ligne non modelisee (15 to 55 (+ 12.5% AP))
   - W / Maximum Heal Per Tick : ligne non modelisee (15*2 to 55*2 (+ 25% AP))
   - W / Modified Damage Reduction : ligne non modelisee (45 to 55%)
   - W / Turret Modified Damage Reduction : ligne non modelisee (45/2 to 55/2%)
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
