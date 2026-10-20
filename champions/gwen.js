/* Gwen — généré depuis les données du wiki, passif écrit à la main.

   A Thousand Cuts : chaque coup prend une part des PV max de la cible,
   et en rend une part à Gwen, jusqu'à un plafond.

     « bonus magic damage equal to 1% (+ 0.6% per 100 AP) of the target's
       maximum health »
     « Heals Gwen for 67% of post-mitigation damage dealt against
       champions, capped at 12 to 40 (par niveau) (+ 7% AP) per instance »
       — data/champions/Gwen, passif A Thousand Cuts

   La part est celle des PV de la CIBLE : le pourcentage reste ici et
   onStep l'applique, comme pour Brand et Fiora.

   Vérifié par tools/check-passives.js. */
window.CHAMPION = {
    key:"gwen", name:"Gwen", label:"Gwen", splash:0,
    base:{hp:[620,115], mana:[330,40], ad:[63,3],
          ar:[39,4.9], mr:[32,2.05],
          as:0.69, asPerLevel:2.25, ms:340},
    abilities_meta:[
      {k:"q", en:"Snip Snip!", fr:"Tchac, tchac !"},
      {k:"w", en:"Hallowed Mist", fr:"Brume sacrée"},
      {k:"e", en:"Skip 'n Slash", fr:"Élan incisif"},
      {k:"r", en:"Needlework", fr:"Piqûre"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[60,85,110,135,160], qAP:0.35, qFinal:[60,85,110,135,160], qFinalAP:0.35, qFinalHpPct:0.6, qFinalHpPctAP100:1, qMin:[70,99,128,157,186], qMinAP:0.4, qCenter:[70,99,128,157,186], qCenterAP:0.4, qCenterHpPct:2, qCenterHpPctAP100:1, qMax:[110,155,200,245,290], qMaxAP:0.6, qCd:[6.5,5.75,5,4.25,3.5],
      wCd:[22,21,20,19,18],
      eAS:[30,42.5,55,67.5,80], eCd:[13,12.5,12,11.5,11],
      rFlat:[30,50,70], rAP:0.1, rHpPct:0.6, rHpPctAP100:1, rSlow:[30,45,60], rSlowSubsequent:[15,20,25], rSecond:[90,150,210], rSecondAP:0.3, rSecondHpPct:3, rSecondHpPctAP100:3, rThird:[150,250,350], rThirdAP:0.5, rThirdHpPct:5, rThirdHpPctAP100:5, rMax:[270,450,630], rMaxAP:0.9, rMaxHpPct:9, rMaxHpPctAP100:9, rCd:[120,100,80],
      /* passif : part des PV max de la cible, et plafond de soin */
      pPctBase:1, pPctPerAP:0.006, pHealShare:0.67, pHealCap:[12,40], pHealCapAP:0.07
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Snip Snip! */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      A.qFinalHpPct = T.qFinalHpPct + T.qFinalHpPctAP100*ap/100;   /* % des PV de la cible, applique dans onStep */
      A.qFinal = R(T.qFinal,qr) + T.qFinalAP*ap;
      A.qMin = R(T.qMin,qr) + T.qMinAP*ap;
      A.qCenterHpPct = T.qCenterHpPct + T.qCenterHpPctAP100*ap/100;   /* % des PV de la cible, applique dans onStep */
      A.qCenter = R(T.qCenter,qr) + T.qCenterAP*ap;
      A.qMax = R(T.qMax,qr) + T.qMaxAP*ap;
      /* E — Skip 'n Slash */
      A.eAS = R(T.eAS,er);
      /* R — Needlework */
      A.rHpPct = T.rHpPct + T.rHpPctAP100*ap/100;   /* % des PV de la cible, applique dans onStep */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.rSlow = R(T.rSlow,rr);
      A.rSlowSubsequent = R(T.rSlowSubsequent,rr);
      A.rSecondHpPct = T.rSecondHpPct + T.rSecondHpPctAP100*ap/100;   /* % des PV de la cible, applique dans onStep */
      A.rSecond = R(T.rSecond,rr) + T.rSecondAP*ap;
      A.rThirdHpPct = T.rThirdHpPct + T.rThirdHpPctAP100*ap/100;   /* % des PV de la cible, applique dans onStep */
      A.rThird = R(T.rThird,rr) + T.rThirdAP*ap;
      A.rMaxHpPct = T.rMaxHpPct + T.rMaxHpPctAP100*ap/100;   /* % des PV de la cible, applique dans onStep */
      A.rMax = R(T.rMax,rr) + T.rMaxAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qFinalHpPct=0; A.qFinal=0; A.qMin=0; A.qCenterHpPct=0; A.qCenter=0; A.qMax=0; }
      if(!learned.e){ A.eAS=0; }
      if(!learned.r){ A.rHpPct=0; A.rDmg=0; A.rSlow=0; A.rSlowSubsequent=0; A.rSecondHpPct=0; A.rSecond=0; A.rThirdHpPct=0; A.rThird=0; A.rMaxHpPct=0; A.rMax=0; }
      /* A Thousand Cuts — la part, et ce qu'elle rend */
      A.pPct = T.pPctBase + T.pPctPerAP*ap;
      A.pHealCap = lerp(T.pHealCap[0], T.pHealCap[1], L) + T.pHealCapAP*ap;
      /* onStep ne reçoit pas la table des rangs : la part voyage dans A */
      A.pHealShare = T.pHealShare;
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["A Thousand Cuts","Mille coupures"],
    l10n:{
      gwenCut:["A Thousand Cuts, share of the target's max health","Mille coupures, part des PV max de la cible"],
      gwenHeal:["Healing cap per hit on a champion","Plafond de soin par coup sur un champion"]
    },
    passiveRows(c){
      const {A, TR, n0, pc} = c;
      return [{lab:TR("gwenCut"), val:pc(A.pPct)},
              {lab:TR("gwenHeal"), val:n0(A.pHealCap)}];
    },
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"cut", kind:"spell", en:"A Thousand Cuts on-hit", fr:"Mille coupures, à l'impact"},
      {id:"q", kind:"spell", en:"Q — Snip Snip!", fr:"Q — Tchac, tchac !"},
      {id:"e", kind:"cast", label:"E", en:"E — Skip 'n Slash", fr:"E — Élan incisif"},
      {id:"r", kind:"spell", en:"R — Needlework", fr:"R — Piqûre"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "cut"){
        const coupe = hp*A.pPct/100;
        out.parts.push({n:"aThousandCuts", v:coupe, type:"magic"});
        /* 67 % des dégâts rendus, mais jamais plus que le plafond */
        out.heal = Math.min(A.pHealCap, coupe * A.pHealShare);
      }
      if(st.id === "q") out.parts.push({n:"snipSnip", v:A.qDmg + hp * A.qFinalHpPct/100 + hp * A.qCenterHpPct/100, type:"magic"});
      if(st.id === "e") out.asBonus = A.eAS;
      if(st.id === "r") out.parts.push({n:"needlework", v:A.rDmg + hp * A.rHpPct/100 + hp * A.rSecondHpPct/100 + hp * A.rThirdHpPct/100 + hp * A.rMaxHpPct/100, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("mPpct"), val:pc(A.qFinalHpPct)},
         {lab:TR("damage"), val:n0(A.qFinal)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("bonusAs"), val:"+" + pc(A.eAS)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("mPpct"), val:pc(A.rHpPct)},
         {lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("slow"), val:pc(A.rSlow)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* Le passif, que le générateur ne sait pas lire, est écrit plus haut. */
