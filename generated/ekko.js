/* ekko — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Ekko.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"ekko", name:"Ekko", label:"Ekko", splash:0,
    base:{hp:[655,99], mana:[280,70], ad:[58,3],
          ar:[32,4.2], mr:[32,2.05],
          as:0.688, asPerLevel:3.3, ms:340},
    abilities_meta:[
      {k:"q", en:"Timewinder", fr:"Rétrobang"},
      {k:"w", en:"Parallel Convergence", fr:"Convergence parallèle"},
      {k:"e", en:"Phase Dive", fr:"Rush déphasé"},
      {k:"r", en:"Chronobreak", fr:"Chronofracture"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qMin:[80,95,110,125,140], qMinAP:0.3, qSlow:[40,45,50,55,60], qFlat:[40,65,90,115,140], qAP:0.6, qTotal:[120,160,200,240,280], qTotalAP:0.9, qCd:[9,8.5,8,7.5,7],
      wShield:[100,120,140,160,180], wShieldAP:1.5, wCd:[22,20,18,16,14],
      eFlat:[50,75,100,125,150], eAP:0.4, eCd:[9,8.5,8,7.5,7],
      rFlat:[200,350,500], rAP:1.75, rHealMin:[100,150,200], rHealMinAP:0.6, rHealMax:[400,600,800], rHealMaxAP:2.4, rCd:[110,80,50]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Timewinder */
      A.qMin = R(T.qMin,qr) + T.qMinAP*ap;
      A.qSlow = R(T.qSlow,qr);
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      A.qTotal = R(T.qTotal,qr) + T.qTotalAP*ap;
      /* W — Parallel Convergence */
      A.wShield = R(T.wShield,wr) + T.wShieldAP*ap;
      /* E — Phase Dive */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      /* R — Chronobreak */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.rHealMin = R(T.rHealMin,rr) + T.rHealMinAP*ap;
      A.rHealMax = R(T.rHealMax,rr) + T.rHealMaxAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qMin=0; A.qSlow=0; A.qDmg=0; A.qTotal=0; }
      if(!learned.w){ A.wShield=0; }
      if(!learned.e){ A.eDmg=0; }
      if(!learned.r){ A.rDmg=0; A.rHealMin=0; A.rHealMax=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Z-Drive Resonance","RéZonance"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Timewinder", fr:"Q — Rétrobang"},
      {id:"w", kind:"cast", label:"W", en:"W — Parallel Convergence", fr:"W — Convergence parallèle"},
      {id:"e", kind:"spell", en:"E — Phase Dive", fr:"E — Rush déphasé"},
      {id:"r", kind:"spell", en:"R — Chronobreak", fr:"R — Chronofracture"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"timewinder", v:A.qDmg, type:"magic"});
      if(st.id === "w") out.shield = A.wShield;
      if(st.id === "e") out.parts.push({n:"phaseDive", v:A.eDmg, type:"magic"});
      if(st.id === "r"){
        out.parts.push({n:"chronobreak", v:A.rDmg, type:"magic"});
        out.heal = A.rHealMin;
      }
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qMin)},
         {lab:TR("slow"), val:pc(A.qSlow)},
         {lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("shield"), val:n0(A.wShield)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("healing"), val:n0(A.rHealMin)},
         {lab:TR("healing"), val:n0(A.rHealMax)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
