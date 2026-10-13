/* karthus — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Karthus.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"karthus", name:"Karthus", label:"Karthus", splash:0,
    base:{hp:[620,110], mana:[467,31], ad:[46,3.25],
          ar:[21,4.7], mr:[30,1.3],
          as:0.625, asPerLevel:2.11, ms:335},
    abilities_meta:[
      {k:"q", en:"Lay Waste", fr:"Dévastation"},
      {k:"w", en:"Wall of Pain", fr:"Mur de douleur"},
      {k:"e", en:"Defile", fr:"Souillure"},
      {k:"r", en:"Requiem", fr:"Requiem"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[40,59,78,97,116], qAP:0.35, qIsolated:[80,118,156,194,232], qIsolatedAP:0.7, qCd:[1,1,1,1,1],
      wSlow:[40,50,60,70,80], wSlowReduced:[20,25,30,35,40], wCd:[15,15,15,15,15],
      rFlat:[200,350,500], rAP:0.7, rCd:[200,180,160]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Lay Waste */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      A.qIsolated = R(T.qIsolated,qr) + T.qIsolatedAP*ap;
      /* W — Wall of Pain */
      A.wSlow = R(T.wSlow,wr);
      A.wSlowReduced = R(T.wSlowReduced,wr);
      /* R — Requiem */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qIsolated=0; }
      if(!learned.w){ A.wSlow=0; A.wSlowReduced=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Death Defied","Déni de mort"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Lay Waste", fr:"Q — Dévastation"},
      {id:"w", kind:"cast", label:"W", en:"W — Wall of Pain", fr:"W — Mur de douleur"},
      {id:"r", kind:"spell", en:"R — Requiem", fr:"R — Requiem"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"layWaste", v:A.qDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"requiem", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("damage"), val:n0(A.qIsolated)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("slow"), val:pc(A.wSlow)},
         {lab:TR("slow"), val:pc(A.wSlowReduced)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - W / Wall Length : ligne non modelisee (800 to 1200 units)
   - E / Mana Restored : ligne non modelisee (10 to 50)
   - E / Magic Damage Per Tick : ligne non modelisee (30/4 to 110/4 (+ 5% AP))
   - E / Damage Per Second : ligne non modelisee (30 to 110 (+ 20% AP))
   - E : aucune recharge dans les donnees wiki
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
