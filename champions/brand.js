/* Brand — généré depuis les données du wiki, passif écrit à la main.

   Blaze : les sorts de Brand posent une charge d'Embrasement, jusqu'à
   trois. Chaque charge brûle la cible pour une part de SES points de vie
   maximum, et la troisième charge sur un champion finit par exploser.

     « the target is dealt magic damage equal to 2% of their maximum
       health over 4 seconds » (par charge)
   Les PV de la cible n'arrivent pas jusqu'à abilities() : les lignes du
   passif affichent donc des pourcentages, et onStep les applique aux PV
   de la cible choisie en haut de page.
     « dealt magic damage equal to 6 to 12 (par niveau) (+ 2% per 100 AP)
       of their maximum health » (la détonation)
       — data/champions/Brand, passif Blaze

   Vérifié par tools/check-passives.js. */
window.CHAMPION = {
    key:"brand", name:"Brand", label:"Brand", splash:0,
    base:{hp:[570,105], mana:[469,21], ad:[57,3],
          ar:[24,4.2], mr:[30,1.3],
          as:0.681, asPerLevel:2, ms:340},
    abilities_meta:[
      {k:"q", en:"Sear", fr:"Brûlure"},
      {k:"w", en:"Pillar of Flame", fr:"Colonne de flammes"},
      {k:"e", en:"Conflagration", fr:"Conflagration"},
      {k:"r", en:"Pyroclasm", fr:"Pyrolyse"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[70,100,130,160,190], qAP:0.65, qCd:[8,7.5,7,6.5,6],
      wFlat:[75,120,165,210,255], wAP:0.7, wMax:[93.75,150,206.25,262.5,318.75], wMaxAP:0.875, wCd:[10,9.5,9,8.5,8],
      eFlat:[55,80,105,130,155], eAP:0.6, eCd:[13,12,11,10,9],
      rFlat:[100,175,250], rAP:0.3, rTotal:[300,525,750], rTotalAP:0.9, rSlow:[30,45,60], rCd:[100,90,80],
      /* passif : part des PV max de la cible */
      pStackPct:2, pBoomPct:[6,12], pBoomAP:0.02
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Sear */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      /* W — Pillar of Flame */
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      A.wMax = R(T.wMax,wr) + T.wMaxAP*ap;
      /* E — Conflagration */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      /* R — Pyroclasm */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.rTotal = R(T.rTotal,rr) + T.rTotalAP*ap;
      A.rSlow = R(T.rSlow,rr);
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wDmg=0; A.wMax=0; }
      if(!learned.e){ A.eDmg=0; }
      if(!learned.r){ A.rDmg=0; A.rTotal=0; A.rSlow=0; }
      /* Blaze — tout se compte en part des PV max de la CIBLE, que
         abilities() ne connaît pas : seul onStep la reçoit. On garde donc
         ici les pourcentages, et la multiplication se fait là-bas. */
      A.pStackPct = T.pStackPct;
      A.pStack3Pct = T.pStackPct * 3;
      A.pBoomPct = lerp(T.pBoomPct[0], T.pBoomPct[1], L) + T.pBoomAP*ap;
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Blaze","Flammes"],
    l10n:{
      brandStack:["Ablaze, one stack over 4 s","Embrasement, une charge sur 4 s"],
      brandStack3:["Ablaze, three stacks","Embrasement, trois charges"],
      brandBoom:["Detonation at three stacks","Détonation à trois charges"]
    },
    passiveRows(c){
      const {A, TR, pc} = c;
      return [{lab:TR("brandStack"), val:pc(A.pStackPct)},
              {lab:TR("brandStack3"), val:pc(A.pStack3Pct)},
              {lab:TR("brandBoom"), val:pc(A.pBoomPct)}];
    },
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"blaze3", kind:"spell", en:"Ablaze — three stacks", fr:"Embrasement — trois charges"},
      {id:"blazeBoom", kind:"spell", en:"Detonation", fr:"Détonation"},
      {id:"q", kind:"spell", en:"Q — Sear", fr:"Q — Brûlure"},
      {id:"w", kind:"spell", en:"W — Pillar of Flame", fr:"W — Colonne de flammes"},
      {id:"e", kind:"spell", en:"E — Conflagration", fr:"E — Conflagration"},
      {id:"r", kind:"spell", en:"R — Pyroclasm", fr:"R — Pyrolyse"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "blaze3") out.parts.push({n:"ablaze", v:hp*A.pStack3Pct/100, type:"magic"});
      if(st.id === "blazeBoom") out.parts.push({n:"detonation", v:hp*A.pBoomPct/100, type:"magic"});
      if(st.id === "q") out.parts.push({n:"sear", v:A.qDmg, type:"magic"});
      if(st.id === "w") out.parts.push({n:"pillarOfFlame", v:A.wDmg, type:"magic"});
      if(st.id === "e") out.parts.push({n:"conflagration", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"pyroclasm", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("damage"), val:n0(A.wMax)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("damage"), val:n0(A.rTotal)},
         {lab:TR("slow"), val:pc(A.rSlow)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* Le passif, que le générateur ne sait pas lire, est écrit plus haut. */
