/* nunu — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Nunu.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"nunu", name:"Nunu", label:"Nunu & Willump", splash:0,
    base:{hp:[610,90], mana:[280,42], ad:[61,3],
          ar:[29,4.2], mr:[32,2.05],
          as:0.625, asPerLevel:2.25, ms:345},
    abilities_meta:[
      {k:"q", en:"Consume", fr:"Voracité"},
      {k:"w", en:"Biggest Snowball Ever!", fr:"Boule de neige géante !"},
      {k:"e", en:"Snowball Barrage", fr:"Rafale de boules de neige"},
      {k:"r", en:"Absolute Zero", fr:"Zéro absolu"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[60,100,140,180,220], qAP:0.65, qBonusHp:0.05, qHealMin:[39,57,75,93,111], qHealMinAP:0.54, qHealMinBonusHp:0.06, qHealMax:[58.5,85.5,112.5,139.5,166.5], qHealMaxAP:0.81, qHealMaxBonusHp:0.09, qCd:[13,12,11,10,9],
      wFlat:[36,45,54,63,72], wAP:0.3, wMax:[180,225,270,315,360], wMaxAP:1.5, wCd:[14,14,14,14,14],
      eTotal:[45,67.5,90,112.5,135], eTotalAP:0.36, eSlow:[30,35,40,45,50], eMax:[135,202.5,270,337.5,405], eMaxAP:1.35, eFlat:[20,30,40,50,60], eAP:0.8, eCd:[14,13,12,11,10],
      rShield:[65,75,85], rShieldAP:1.5, rShieldBonusHp:[0.3,0.4,0.5], rFlat:[625,950,1275], rAP:3, rCd:[110,100,90]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Consume */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap + T.qBonusHp*bonusHP;
      A.qHealMin = R(T.qHealMin,qr) + T.qHealMinAP*ap + T.qHealMinBonusHp*bonusHP;
      A.qHealMax = R(T.qHealMax,qr) + T.qHealMaxAP*ap + T.qHealMaxBonusHp*bonusHP;
      /* W — Biggest Snowball Ever! */
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      A.wMax = R(T.wMax,wr) + T.wMaxAP*ap;
      /* E — Snowball Barrage */
      A.eTotal = R(T.eTotal,er) + T.eTotalAP*ap;
      A.eSlow = R(T.eSlow,er);
      A.eMax = R(T.eMax,er) + T.eMaxAP*ap;
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      /* R — Absolute Zero */
      A.rShield = R(T.rShield,rr) + T.rShieldAP*ap + R(T.rShieldBonusHp,rr)*bonusHP;
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qHealMin=0; A.qHealMax=0; }
      if(!learned.w){ A.wDmg=0; A.wMax=0; }
      if(!learned.e){ A.eTotal=0; A.eSlow=0; A.eMax=0; A.eDmg=0; }
      if(!learned.r){ A.rShield=0; A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Call of the Freljord","Appel de Freljord"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Consume", fr:"Q — Voracité"},
      {id:"w", kind:"spell", en:"W — Biggest Snowball Ever!", fr:"W — Boule de neige géante !"},
      {id:"e", kind:"spell", en:"E — Snowball Barrage", fr:"E — Rafale de boules de neige"},
      {id:"r", kind:"spell", en:"R — Absolute Zero", fr:"R — Zéro absolu"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q"){
        out.parts.push({n:"consume", v:A.qDmg, type:"magic"});
        out.heal = A.qHealMin;
      }
      if(st.id === "w") out.parts.push({n:"biggestSnowballEver", v:A.wDmg, type:"magic"});
      if(st.id === "e") out.parts.push({n:"snowballBarrage", v:A.eDmg, type:"magic"});
      if(st.id === "r"){
        out.parts.push({n:"absoluteZero", v:A.rDmg, type:"magic"});
        out.shield = A.rShield;
      }
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("healing"), val:n0(A.qHealMin)},
         {lab:TR("healing"), val:n0(A.qHealMax)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("damage"), val:n0(A.wMax)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eTotal)},
         {lab:TR("slow"), val:pc(A.eSlow)},
         {lab:TR("damage"), val:n0(A.eMax)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("shield"), val:n0(A.rShield)},
         {lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - W : 2 formes dans le wiki (Biggest Snowball Ever!, Blood Boil) — seule la premiere est modelisee
   - E : 2 formes dans le wiki (Snowball Barrage, Ice Blast) — seule la premiere est modelisee
   - Q / Non-Champion True Damage : ligne non modelisee (400 to 1200)
   - Q / Base Non-Champion Heal : ligne non modelisee (65 to 185 (+ 90% AP) (+ 10% bonus health))
   - Q / Empowered Non-Champion Heal : ligne non modelisee (65*1.5 to 185*1.5 (+ 90*1.5% AP) (+ 10*1.5% bonus health))
   - W : pas de ligne de degats simple, « Minimum Magic Damage » prise comme ligne principale
   - W / Minimum Minion/Monster Roll Damage : ligne non modelisee (36*0.333 to 72*0.333 (+ 30*0.333% AP))
   - W / Maximum Minion/Monster Roll Damage : ligne non modelisee (36*0.333*5 to 72*0.333*5 (+ 30*0.333*5% AP))
   - E / Magic Damage Per Hit : ligne non modelisee (15 to 45 (+ 12% AP))
   - R : pas de ligne de degats simple, « Maximum Magic Damage » prise comme ligne principale
   - passif : 2 blocs dans le wiki (Call of the Freljord, Visionary) — seul le premier est modelise
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
