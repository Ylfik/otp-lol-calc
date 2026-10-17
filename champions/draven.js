/* Draven — généré depuis les données du wiki.

   League of Draven ne change aucun chiffre de ce calculateur : les
   charges d'Adoration rapportent de l'or à l'élimination, rien de plus.

     « he consumes all of his Adoration stacks and gains 25 + (2*stacks)
       bonus gold » — data/champions/Draven, passif League of Draven

   La ligne du passif le dit en toutes lettres plutôt que de se taire :
   un passif absent de la page ressemble à un oubli. */
window.CHAMPION = {
    key:"draven", name:"Draven", label:"Draven", splash:0,
    base:{hp:[675,104], mana:[361,39], ad:[64,3.4],
          ar:[29,4.5], mr:[33,1.1],
          as:0.679, asPerLevel:2.7, ms:330},
    abilities_meta:[
      {k:"q", en:"Spinning Axe", fr:"Hache tournoyante"},
      {k:"w", en:"Blood Rush", fr:"Pulsion sanguinaire"},
      {k:"e", en:"Stand Aside", fr:"Division"},
      {k:"r", en:"Whirling Death", fr:"Volée mortelle"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[40,45,50,55,60], qBonusAD:[0.75,0.85,0.95,1.05,1.15], qCd:[12,11,10,9,8],
      wAS:[20,25,30,35,40], wMs:[50,55,60,65,70], wCd:[12,12,12,12,12],
      eFlat:[75,110,145,180,215], eBonusAD:0.5, eSlow:[20,25,30,35,40], eCd:[16,15,14,13,12],
      rFlat:[200,300,400], rBonusAD:[1.1,1.3,1.5], rTotal:[400,600,800], rTotalBonusAD:[2.2,2.6,3], rMin:[100,150,200], rMinBonusAD:[0.55,0.65,0.75], rCd:[100,90,80]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Spinning Axe */
      A.qDmg = R(T.qFlat,qr) + R(T.qBonusAD,qr)*bonusAD;
      /* W — Blood Rush */
      A.wAS = R(T.wAS,wr);
      A.wMs = R(T.wMs,wr);
      /* E — Stand Aside */
      A.eDmg = R(T.eFlat,er) + T.eBonusAD*bonusAD;
      A.eSlow = R(T.eSlow,er);
      /* R — Whirling Death */
      A.rDmg = R(T.rFlat,rr) + R(T.rBonusAD,rr)*bonusAD;
      A.rTotal = R(T.rTotal,rr) + R(T.rTotalBonusAD,rr)*bonusAD;
      A.rMin = R(T.rMin,rr) + R(T.rMinBonusAD,rr)*bonusAD;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wAS=0; A.wMs=0; }
      if(!learned.e){ A.eDmg=0; A.eSlow=0; }
      if(!learned.r){ A.rDmg=0; A.rTotal=0; A.rMin=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["League of Draven","League of Draven"],
    l10n:{
      dravenGold:["Adoration: bonus gold on takedown — no effect on these numbers",
                  "Adoration : or bonus à l'élimination — sans effet sur ces chiffres"]
    },
    passiveRows(c){
      return [{lab:c.TR("dravenGold"), val:"—"}];
    },
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Spinning Axe", fr:"Q — Hache tournoyante"},
      {id:"w", kind:"cast", label:"W", en:"W — Blood Rush", fr:"W — Pulsion sanguinaire"},
      {id:"e", kind:"spell", en:"E — Stand Aside", fr:"E — Division"},
      {id:"r", kind:"spell", en:"R — Whirling Death", fr:"R — Volée mortelle"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"spinningAxe", v:A.qDmg, type:"phys"});
      if(st.id === "w") out.asBonus = A.wAS;
      if(st.id === "e") out.parts.push({n:"standAside", v:A.eDmg, type:"phys"});
      if(st.id === "r") out.parts.push({n:"whirlingDeath", v:A.rDmg, type:"phys"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("bonusAs"), val:"+" + pc(A.wAS)},
         {lab:TR("msBonus"), val:"+" + pc(A.wMs)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("slow"), val:pc(A.eSlow)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("damage"), val:n0(A.rTotal)},
         {lab:TR("damage"), val:n0(A.rMin)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* Le passif, que le générateur ne sait pas lire, est écrit plus haut. */
