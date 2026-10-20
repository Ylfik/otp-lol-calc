/* Poppy — généré depuis les données du wiki, passif écrit à la main.

   Iron Ambassador : périodiquement, Poppy lance son bouclier ; elle peut
   ensuite marcher dessus pour le récupérer.

     « dealing 20 + (180-20)/17*(x-1) bonus magic damage »
     « gaining a shield for 11 + (20-11)/17*(x-1) of her maximum health »
     recharge : « 16 to 8 for 3 » entre les niveaux 1 et 13
       — data/champions/Poppy, passif Iron Ambassador

   Le bouclier est une part des PV max de Poppy, pas de ceux de la cible :
   abilities() les connaît, le calcul se fait donc ici.

   Vérifié par tools/check-passives.js. */
window.CHAMPION = {
    key:"poppy", name:"Poppy", label:"Poppy", splash:0,
    base:{hp:[610,110], mana:[300,45], ad:[56,4],
          ar:[35,5], mr:[32,2.05],
          as:0.658, asPerLevel:2.5, ms:345},
    abilities_meta:[
      {k:"q", en:"Hammer Shock", fr:"Commotion"},
      {k:"w", en:"Steadfast Presence", fr:"Présence immuable"},
      {k:"e", en:"Heroic Charge", fr:"Charge héroïque"},
      {k:"r", en:"Keeper's Verdict", fr:"Verdict de la gardienne"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[30,55,80,105,130], qBonusAD:0.75, qHpPct:[7,7.5,8,8.5,9], qSlow:[20,23,26,29,32], qSlowBonusHp:0.008, qTotal:[60,110,160,210,260], qTotalBonusAD:1.5, qTotalHpPct:[14,15,16,17,18], qCd:[8,7,6,5,4],
      wFlat:[70,110,150,190,230], wAP:0.7, wCd:[20,18,16,14,12],
      eFlat:[40,60,80,100,120], eBonusAD:0.6, eCc:[1.6,1.7,1.8,1.9,2], eTotal:[80,120,160,200,240], eTotalBonusAD:1.2, eCd:[14,13,12,11,10],
      rFlat:[100,150,200], rBonusAD:0.45, rMax:[200,300,400], rMaxBonusAD:0.9, rCd:[140,120,100],
      /* passif : linéaire du niveau 1 au 18, recharge plafonnée au 13 */
      pFlat:[20,180], pShieldPct:[11,20], pCd:[16,8], pCdTop:13
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Hammer Shock */
      A.qHpPct = R(T.qHpPct,qr);   /* % des PV de la cible, applique dans onStep */
      A.qDmg = R(T.qFlat,qr) + T.qBonusAD*bonusAD;
      A.qSlow = R(T.qSlow,qr) + T.qSlowBonusHp*bonusHP;
      A.qTotalHpPct = R(T.qTotalHpPct,qr);   /* % des PV de la cible, applique dans onStep */
      A.qTotal = R(T.qTotal,qr) + T.qTotalBonusAD*bonusAD;
      /* W — Steadfast Presence */
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      /* E — Heroic Charge */
      A.eDmg = R(T.eFlat,er) + T.eBonusAD*bonusAD;
      A.eCc = R(T.eCc,er);
      A.eTotal = R(T.eTotal,er) + T.eTotalBonusAD*bonusAD;
      /* R — Keeper's Verdict */
      A.rDmg = R(T.rFlat,rr) + T.rBonusAD*bonusAD;
      A.rMax = R(T.rMax,rr) + T.rMaxBonusAD*bonusAD;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qHpPct=0; A.qDmg=0; A.qSlow=0; A.qTotalHpPct=0; A.qTotal=0; }
      if(!learned.w){ A.wDmg=0; }
      if(!learned.e){ A.eDmg=0; A.eCc=0; A.eTotal=0; }
      if(!learned.r){ A.rDmg=0; A.rMax=0; }
      /* Iron Ambassador — le bouclier lancé, puis ramassé */
      A.pDmg = lerp(T.pFlat[0], T.pFlat[1], L);
      A.pShieldPct = lerp(T.pShieldPct[0], T.pShieldPct[1], L);
      A.pShield = tot.hp * A.pShieldPct/100;
      A.pCd = lerp(T.pCd[0], T.pCd[1], L, T.pCdTop)/ah;
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Iron Ambassador","Ambassadrice de fer"],
    l10n:{
      poppyThrow:["Iron Ambassador, the thrown buckler","Ambassadrice de fer, le bouclier lancé"],
      poppyPick:["Shield on picking it back up","Bouclier en le ramassant"]
    },
    passiveRows(c){
      const {A, TR, n0, nf1} = c;
      return [{lab:TR("poppyThrow"), val:n0(A.pDmg)},
              {lab:TR("poppyPick"), val:n0(A.pShield)},
              {lab:TR("cooldown"), val:nf1.format(A.pCd)+" s"}];
    },
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"buckler", kind:"attack", en:"Iron Ambassador throw", fr:"Lancer de l'Ambassadrice de fer"},
      {id:"q", kind:"spell", en:"Q — Hammer Shock", fr:"Q — Commotion"},
      {id:"w", kind:"spell", en:"W — Steadfast Presence", fr:"W — Présence immuable"},
      {id:"e", kind:"spell", en:"E — Heroic Charge", fr:"E — Charge héroïque"},
      {id:"r", kind:"spell", en:"R — Keeper's Verdict", fr:"R — Verdict de la gardienne"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "buckler"){ out.parts.push({n:"ironAmbassador", v:A.pDmg, type:"magic"}); out.shield = A.pShield; }
      if(st.id === "q") out.parts.push({n:"hammerShock", v:A.qDmg + hp * A.qHpPct/100 + hp * A.qTotalHpPct/100, type:"phys"});
      if(st.id === "w") out.parts.push({n:"steadfastPresence", v:A.wDmg, type:"magic"});
      if(st.id === "e") out.parts.push({n:"heroicCharge", v:A.eDmg, type:"phys"});
      if(st.id === "r") out.parts.push({n:"keeperSVerdict", v:A.rDmg, type:"phys"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("mPpct"), val:pc(A.qHpPct)},
         {lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("slow"), val:pc(A.qSlow)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("comboTime"), val:n0(A.eCc)},
         {lab:TR("damage"), val:n0(A.eTotal)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("damage"), val:n0(A.rMax)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* Le passif, que le générateur ne sait pas lire, est écrit plus haut. */
