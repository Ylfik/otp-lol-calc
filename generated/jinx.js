/* jinx — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Jinx.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"jinx", name:"Jinx", label:"Jinx", splash:0,
    base:{hp:[630,105], mana:[260,50], ad:[59,3.25],
          ar:[26,4.2], mr:[33,1.1],
          as:0.625, asPerLevel:1, ms:325},
    abilities_meta:[
      {k:"q", en:"Switcheroo!", fr:"Flip flap !"},
      {k:"w", en:"Zap!", fr:"Zap !"},
      {k:"e", en:"Flame Chompers!", fr:"Pyromâcheurs !"},
      {k:"r", en:"Super Mega Death Rocket!", fr:"Super roquette de la mort !"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qAS:[15,27.5,40,52.5,65], qASMax:[30,55,80,105,130],
      wFlat:[10,60,110,160,210], wAD:1.4, wSlow:[40,50,60,70,80], wCd:[8,7,6,5,4],
      eFlat:[90,140,190,240,290], eAP:1, eCd:[24,20.5,17,13.5,10],
      rFlat:[200,350,500], rBonusAD:1.2, rMissPct:[25,30,35], rMinBonusAD:0.12, rMinMissPct:[25,30,35], rMaxBonusAD:0.96, rMaxMissPct:0.8, rSecondaryBonusAD:0.096, rSecondaryMissPct:0.8, rCd:[85,65,45]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Switcheroo! */
      A.qAS = R(T.qAS,qr);
      A.qASMax = R(T.qASMax,qr);
      /* W — Zap! */
      A.wDmg = R(T.wFlat,wr) + T.wAD*tot.ad;
      A.wSlow = R(T.wSlow,wr);
      /* E — Flame Chompers! */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      /* R — Super Mega Death Rocket! */
      A.rMissPct = R(T.rMissPct,rr);   /* % des PV de la cible, applique dans onStep */
      A.rDmg = R(T.rFlat,rr) + T.rBonusAD*bonusAD;
      A.rMinMissPct = R(T.rMinMissPct,rr);   /* % des PV de la cible, applique dans onStep */
      A.rMin = T.rMinBonusAD*bonusAD;
      A.rMaxMissPct = T.rMaxMissPct;   /* % des PV de la cible, applique dans onStep */
      A.rMax = T.rMaxBonusAD*bonusAD;
      A.rSecondaryMissPct = T.rSecondaryMissPct;   /* % des PV de la cible, applique dans onStep */
      A.rSecondary = T.rSecondaryBonusAD*bonusAD;
      A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qAS=0; A.qASMax=0; }
      if(!learned.w){ A.wDmg=0; A.wSlow=0; }
      if(!learned.e){ A.eDmg=0; }
      if(!learned.r){ A.rMissPct=0; A.rDmg=0; A.rMinMissPct=0; A.rMin=0; A.rMaxMissPct=0; A.rMax=0; A.rSecondaryMissPct=0; A.rSecondary=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Get Excited!","Enthousiasme !"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"cast", label:"Q", en:"Q — Switcheroo!", fr:"Q — Flip flap !"},
      {id:"w", kind:"spell", en:"W — Zap!", fr:"W — Zap !"},
      {id:"e", kind:"spell", en:"E — Flame Chompers!", fr:"E — Pyromâcheurs !"},
      {id:"r", kind:"spell", en:"R — Super Mega Death Rocket!", fr:"R — Super roquette de la mort !"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.asBonus = A.qAS;
      if(st.id === "w") out.parts.push({n:"zap", v:A.wDmg, type:"phys"});
      if(st.id === "e") out.parts.push({n:"flameChompers", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"superMegaDeathRocket", v:A.rDmg + Math.max(0, hp - cur) * A.rMissPct/100 + Math.max(0, hp - cur) * A.rMinMissPct/100 + Math.max(0, hp - cur) * A.rMaxMissPct/100 + Math.max(0, hp - cur) * A.rSecondaryMissPct/100, type:"phys"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("bonusAs"), val:"+" + pc(A.qAS)},
         {lab:TR("bonusAs"), val:"+" + pc(A.qASMax)}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("slow"), val:pc(A.wSlow)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("mPpct"), val:pc(A.rMissPct)},
         {lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("mPpct"), val:pc(A.rMinMissPct)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q / Attack Speed per Subsequent Stack : ligne non modelisee (30/4 to 130/4%)
   - Q / Bonus Range : ligne non modelisee (100 to 200)
   - Q : aucune recharge dans les donnees wiki
   - R : pas de ligne de degats simple, « Maximum Physical Damage » prise comme ligne principale
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
