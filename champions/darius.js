/* Darius — généré depuis les données du wiki, passif écrit à la main.

   Hemorrhage : chaque attaque et chaque sort pose une charge de
   saignement, jusqu'à cinq, qui saigne la cible sur toute sa durée.

     « For each stack, the target is dealt 13 to 30 (par niveau)
       (+ 30% bonus AD) total physical damage over the duration, up to a
       maximum of 13*5 to 30*5 (+ 150% bonus AD) »
       — data/champions/Darius, passif Hemorrhage

   Vérifié par tools/check-passives.js. */
window.CHAMPION = {
    key:"darius", name:"Darius", label:"Darius", splash:0,
    base:{hp:[652,114], mana:[263,58], ad:[64,5],
          ar:[37,5.2], mr:[32,2.05],
          as:0.625, asPerLevel:1, ms:340},
    abilities_meta:[
      {k:"q", en:"Decimate", fr:"Décimation"},
      {k:"w", en:"Crippling Strike", fr:"Estropiaison"},
      {k:"e", en:"Apprehend", fr:"Crampon"},
      {k:"r", en:"Noxian Guillotine", fr:"Guillotine noxienne"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[50,80,110,140,170], qAD:[1,1.1,1.2,1.3,1.4], qCd:[9,8,7,6,5],
      wFlat:[40,45,50,55,60], wCd:[5,5,5,5,5],
      eCd:[26,23.5,21,18.5,16],
      rFlat:[125,250,375], rBonusAD:0.75, rPerStack:[25,50,75], rPerStackBonusAD:0.15, rMax:[250,500,750], rMaxBonusAD:1.5, rCd:[120,100,80],
      /* passif : par charge, linéaire du niveau 1 au 18 */
      pFlat:[13,30], pBonusAD:0.30, pMaxStacks:5
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Decimate */
      A.qDmg = R(T.qFlat,qr) + R(T.qAD,qr)*tot.ad;
      /* W — Crippling Strike */
      A.wDmg = (R(T.wFlat,wr))/100*tot.ad;
      /* R — Noxian Guillotine */
      A.rDmg = R(T.rFlat,rr) + T.rBonusAD*bonusAD;
      A.rPerStack = R(T.rPerStack,rr) + T.rPerStackBonusAD*bonusAD;
      A.rMax = R(T.rMax,rr) + T.rMaxBonusAD*bonusAD;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wDmg=0; }
      if(!learned.r){ A.rDmg=0; A.rPerStack=0; A.rMax=0; }
      /* Hemorrhage — une charge, puis les cinq */
      A.pStack = lerp(T.pFlat[0], T.pFlat[1], L) + T.pBonusAD*bonusAD;
      A.pFull = A.pStack * T.pMaxStacks;
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Hemorrhage","Plaie béante"],
    l10n:{
      dariusBleed:["Hemorrhage, one stack over 5 s","Hémorragie, une charge sur 5 s"],
      dariusBleed5:["Hemorrhage, five stacks","Hémorragie, cinq charges"]
    },
    passiveRows(c){
      const {A, TR, n0} = c;
      return [{lab:TR("dariusBleed"), val:n0(A.pStack)},
              {lab:TR("dariusBleed5"), val:n0(A.pFull)}];
    },
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"bleed5", kind:"spell", en:"Hemorrhage — five stacks", fr:"Hémorragie — cinq charges"},
      {id:"q", kind:"spell", en:"Q — Decimate", fr:"Q — Décimation"},
      {id:"w", kind:"spell", en:"W — Crippling Strike", fr:"W — Estropiaison"},
      {id:"r", kind:"spell", en:"R — Noxian Guillotine", fr:"R — Guillotine noxienne"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "bleed5") out.parts.push({n:"hemorrhage", v:A.pFull, type:"phys"});
      if(st.id === "q") out.parts.push({n:"decimate", v:A.qDmg, type:"phys"});
      if(st.id === "w") out.parts.push({n:"cripplingStrike", v:A.wDmg, type:"phys"});
      if(st.id === "r") out.parts.push({n:"noxianGuillotine", v:A.rDmg, type:"true"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("damage"), val:n0(A.rPerStack)},
         {lab:TR("damage"), val:n0(A.rMax)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* Le passif, que le générateur ne sait pas lire, est écrit plus haut. */
