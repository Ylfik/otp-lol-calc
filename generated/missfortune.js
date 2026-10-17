/* missfortune — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Miss Fortune.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"missfortune", name:"MissFortune", label:"Miss Fortune", splash:0,
    base:{hp:[625,100], mana:[300,40], ad:[55,2.4],
          ar:[25,4], mr:[33,1.1],
          as:0.656, asPerLevel:3, ms:325},
    abilities_meta:[
      {k:"q", en:"Double Up", fr:"Doublé"},
      {k:"w", en:"Strut", fr:"Fanfaronne"},
      {k:"e", en:"Make It Rain", fr:"Pluie de balles"},
      {k:"r", en:"Bullet Time", fr:"Barrage de plomb"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[20,45,70,95,120], qAD:1, qAP:0.35, qCd:[7,6,5,4,3],
      wMs:[30,35,40,45,50], wMsMax:[60,70,80,90,100], wAS:[40,55,70,85,100], wCd:[12,12,12,12,12],
      eFlat:[70,100,130,160,190], eAP:1.2, eCd:[18,17,16,15,14],
      rFlat:[280,500,720], rAD:[8.4,9.6,10.8], rAP:[3.5,4,4.5], rCd:[120,110,100]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Double Up */
      A.qDmg = R(T.qFlat,qr) + T.qAD*tot.ad + T.qAP*ap;
      /* W — Strut */
      A.wMs = R(T.wMs,wr);
      A.wMsMax = R(T.wMsMax,wr);
      A.wAS = R(T.wAS,wr);
      /* E — Make It Rain */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      /* R — Bullet Time */
      A.rDmg = R(T.rFlat,rr) + R(T.rAD,rr)*tot.ad + R(T.rAP,rr)*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wMs=0; A.wMsMax=0; A.wAS=0; }
      if(!learned.e){ A.eDmg=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Love Tap","Cœur volage"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Double Up", fr:"Q — Doublé"},
      {id:"w", kind:"cast", label:"W", en:"W — Strut", fr:"W — Fanfaronne"},
      {id:"e", kind:"spell", en:"E — Make It Rain", fr:"E — Pluie de balles"},
      {id:"r", kind:"spell", en:"R — Bullet Time", fr:"R — Barrage de plomb"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"doubleUp", v:A.qDmg, type:"phys"});
      if(st.id === "w") out.asBonus = A.wAS;
      if(st.id === "e") out.parts.push({n:"makeItRain", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"bulletTime", v:A.rDmg, type:"phys"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("msBonus"), val:"+" + pc(A.wMs)},
         {lab:TR("msBonus"), val:"+" + pc(A.wMsMax)},
         {lab:TR("bonusAs"), val:"+" + pc(A.wAS)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - E : pas de ligne de degats simple, « Total Magic Damage » prise comme ligne principale
   - E / Magic Damage Per Tick : ligne non modelisee (70/8 to 190/8 (+ 120/8% AP))
   - R : pas de ligne de degats simple, « Maximum Total Physical Damage » prise comme ligne principale
   - R / Physical Damage per Wave : ligne non modelisee (20 to 40 (+ 60% AD) (+ 25% AP))
   - R / Total Waves : ligne non modelisee (14 to 18)
   - R / Wave Interval Time : ligne non modelisee (2.85/(14 to 18) seconds)
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
