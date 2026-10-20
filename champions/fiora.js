/* Fiora — généré depuis les données du wiki, passif écrit à la main.

   Duelist's Dance : frapper un Point vital inflige des dégâts bruts en
   part des PV de la cible, et soigne Fiora.

     « bonus true damage equal to 3% (+ 4% per 100 bonus AD) of target's
       maximum health, heal Fiora for 35 to 100 (par niveau) »
       — data/champions/Fiora, passif Duelist's Dance

   La part est celle des PV de la CIBLE : abilities() ne les connaît pas,
   le pourcentage reste ici et onStep l'applique.

   Vérifié par tools/check-passives.js. */
window.CHAMPION = {
    key:"fiora", name:"Fiora", label:"Fiora", splash:0,
    base:{hp:[620,105], mana:[300,60], ad:[66,3.3],
          ar:[33,4.7], mr:[32,2.05],
          as:0.69, asPerLevel:3.2, ms:345},
    abilities_meta:[
      {k:"q", en:"Lunge", fr:"Fente"},
      {k:"w", en:"Riposte", fr:"Riposte"},
      {k:"e", en:"Bladework", fr:"Botte secrète"},
      {k:"r", en:"Grand Challenge", fr:"Défi suprême"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[70,80,90,100,110], qBonusAD:[0.9,0.95,1,1.05,1.1], qCd:[13,11.25,9.5,7.75,6],
      wFlat:[110,150,190,230,270], wAP:1, wCd:[24,22,20,18,16],
      eAS:[50,60,70,80,90], eFlat:[160,170,180,190,200], eCd:[11,10,9,8,7],
      rMs:[10,20,30], rHealMax:[400,525,650], rHealMaxBonusAD:3.5, rCd:[110,90,70],
      /* passif : part des PV max de la cible, et soin par niveau */
      pPctBase:3, pPctPerAD:0.04, pHeal:[35,100]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Lunge */
      A.qDmg = R(T.qFlat,qr) + R(T.qBonusAD,qr)*bonusAD;
      /* W — Riposte */
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      /* E — Bladework */
      A.eAS = R(T.eAS,er);
      A.eDmg = R(T.eFlat,er);
      /* R — Grand Challenge */
      A.rMs = R(T.rMs,rr);
      A.rHealMax = R(T.rHealMax,rr) + T.rHealMaxBonusAD*bonusAD;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wDmg=0; }
      if(!learned.e){ A.eAS=0; A.eDmg=0; }
      if(!learned.r){ A.rMs=0; A.rHealMax=0; }
      /* Duelist's Dance — le Point vital */
      A.pPct = T.pPctBase + T.pPctPerAD*bonusAD;
      A.pHeal = lerp(T.pHeal[0], T.pHeal[1], L);
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Duelist's Dance","Danse de la duelliste"],
    l10n:{
      fioraVital:["Vital, share of the target's max health","Point vital, part des PV max de la cible"],
      fioraHeal:["Healing on a Vital","Soin sur un Point vital"]
    },
    passiveRows(c){
      const {A, TR, n0, pc} = c;
      return [{lab:TR("fioraVital"), val:pc(A.pPct)},
              {lab:TR("fioraHeal"), val:n0(A.pHeal)}];
    },
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"vital", kind:"spell", en:"Strike a Vital", fr:"Frapper un Point vital"},
      {id:"q", kind:"spell", en:"Q — Lunge", fr:"Q — Fente"},
      {id:"w", kind:"spell", en:"W — Riposte", fr:"W — Riposte"},
      {id:"e", kind:"spell", en:"E — Bladework", fr:"E — Botte secrète"},
      {id:"r", kind:"cast", label:"R", en:"R — Grand Challenge", fr:"R — Défi suprême"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "vital"){ out.parts.push({n:"duelistsDance", v:hp*A.pPct/100, type:"true"}); out.heal = A.pHeal; }
      if(st.id === "q") out.parts.push({n:"lunge", v:A.qDmg, type:"phys"});
      if(st.id === "w") out.parts.push({n:"riposte", v:A.wDmg, type:"magic"});
      if(st.id === "e"){
        out.parts.push({n:"bladework", v:A.eDmg, type:"phys"});
        out.asBonus = A.eAS;
      }
      if(st.id === "r") out.heal = A.rHealMax;
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
        [{lab:TR("bonusAs"), val:"+" + pc(A.eAS)},
         {lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("msBonus"), val:"+" + pc(A.rMs)},
         {lab:TR("healing"), val:n0(A.rHealMax)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* Le passif, que le générateur ne sait pas lire, est écrit plus haut. */
