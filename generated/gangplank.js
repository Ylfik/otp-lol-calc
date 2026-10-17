/* gangplank — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Gangplank.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"gangplank", name:"Gangplank", label:"Gangplank", splash:0,
    base:{hp:[630,114], mana:[280,60], ad:[64,4.2],
          ar:[31,4.7], mr:[32,2.05],
          as:0.658, asPerLevel:3.2, ms:345},
    abilities_meta:[
      {k:"q", en:"Parrrley", fr:"Pourparlers"},
      {k:"w", en:"Remove Scurvy", fr:"Guérison du scorbut"},
      {k:"e", en:"Powder Keg", fr:"Baril de poudre"},
      {k:"r", en:"Cannon Barrage", fr:"Tir de barrage"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[10,40,70,100,130], qAD:1, qCd:[4.5,4.5,4.5,4.5,4.5],
      wHeal:[45,70,95,120,145], wHealAP:0.9, wHealMissPct:13, wCd:[22,20,18,16,14],
      eSlow:[40,50,60,70,80], eFlat:[75,95,115,135,155],
      rTotal:[480,840,1200], rTotalAP:1.2, rFlat:[120,210,300], rAP:0.3, rWith:[600,1050,1500], rWithAP:1.5, rMax:[840,1470,2100], rMaxAP:2.1, rCd:[160,140,120]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Parrrley */
      A.qDmg = R(T.qFlat,qr) + T.qAD*tot.ad;
      /* W — Remove Scurvy */
      A.wHealMissPct = T.wHealMissPct;
      A.wHeal = R(T.wHeal,wr) + T.wHealAP*ap;
      /* E — Powder Keg */
      A.eSlow = R(T.eSlow,er);
      A.eDmg = R(T.eFlat,er);
      /* R — Cannon Barrage */
      A.rTotal = R(T.rTotal,rr) + T.rTotalAP*ap;
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.rWith = R(T.rWith,rr) + T.rWithAP*ap;
      A.rMax = R(T.rMax,rr) + T.rMaxAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wHealMissPct=0; A.wHeal=0; }
      if(!learned.e){ A.eSlow=0; A.eDmg=0; }
      if(!learned.r){ A.rTotal=0; A.rDmg=0; A.rWith=0; A.rMax=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Trial by Fire","Épreuve du feu"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Parrrley", fr:"Q — Pourparlers"},
      {id:"w", kind:"cast", label:"W", en:"W — Remove Scurvy", fr:"W — Guérison du scorbut"},
      {id:"e", kind:"spell", en:"E — Powder Keg", fr:"E — Baril de poudre"},
      {id:"r", kind:"spell", en:"R — Cannon Barrage", fr:"R — Tir de barrage"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"parrrley", v:A.qDmg, type:"phys"});
      if(st.id === "w") out.heal = A.wHeal;
      if(st.id === "e") out.parts.push({n:"powderKeg", v:A.eDmg, type:"phys"});
      if(st.id === "r") out.parts.push({n:"cannonBarrage", v:A.rDmg, type:"true"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("sQpct"), val:pc(A.wHealMissPct)},
         {lab:TR("healing"), val:n0(A.wHeal)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("slow"), val:pc(A.eSlow)},
         {lab:TR("damage"), val:n0(A.eDmg)}],
        [{lab:TR("damage"), val:n0(A.rTotal)},
         {lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("damage"), val:n0(A.rWith)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q / Gold Plunder : ligne non modelisee ()
   - Q / Silver Serpent Plunder : ligne non modelisee (20px|link= 4 to 8)
   - W / Heal : « 13% missing health » est une part des PV du champion — le moteur ne suit pas ses PV courants, la valeur reste un pourcentage affiche
   - E / Maximum charges : ligne non modelisee (3)
   - E : aucune recharge dans les donnees wiki
   - R / Magic Damage Per Wave : ligne non modelisee (40 to 100 (+ 10% AP))
   - R / Magic Damage Per Cluster : ligne non modelisee (40*3 to 100*3 (+ 10*3% AP))
   - R / Total Magic Damage with Fire at Will : doublon de Total Magic Damage, ignore
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
