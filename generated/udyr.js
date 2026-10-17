/* udyr — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Udyr.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"udyr", name:"Udyr", label:"Udyr", splash:0,
    base:{hp:[664,92], mana:[271,50], ad:[62,4],
          ar:[31,4.7], mr:[32,2.05],
          as:0.65, asPerLevel:3, ms:350},
    abilities_meta:[
      {k:"q", en:"Wilding Claw", fr:"Griffe sauvage"},
      {k:"w", en:"Iron Mantle", fr:"Cape de fer"},
      {k:"e", en:"Blazing Stampede", fr:"Piétinement flamboyant"},
      {k:"r", en:"Wingborne Storm", fr:"Tempête spirituelle"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qHpPct:[3,4,5,6,7,8], qBonusAD100:3.5, qTotalHpPct:[6,8,10,12,14,16], qTotalBonusAD100:7, qAS:[20,32,44,56,68,80], qFlat:[6,12,18,24,30,36], qBonusAD:0.2, qBonusHp:[0.01,0.012,0.014,0.016,0.018,0.02], qCd:[6,6,6,6,6],
      wShield:[45,65,85,105,125,145], wShieldBonusAD:0.5, wShieldAP:0.4, wShieldMaxHp:[0.02,0.023,0.026,0.029,0.032,0.035], wShieldMaxAdd:[45,65,85,105,125,145], wShieldMaxBonusAD:1, wShieldMaxAP:0.65, wShieldMaxMaxHp:0.08, wHealTotalBonusAD:0.5, wHealTotalAP:0.325, wHealTotalMaxHp:0.04, wCd:[6,6,6,6,6],
      eMs:[25,31,37,43,49,55], eMsBonusAD100:5, eMsDecayed:[7.5,9.3,11.1,12.9,14.7,16.5], eMsDecayedBonusAD100:1.5, eCd:[6,6,6,6,6],
      rFlat:[80,144,208,272,336,400], rAP:1.4, rSlow:[15,18,21,24,27,30], rSlowMax:[20,23,26,29,32,35], rCd:[6,6,6]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Wilding Claw */
      A.qHpPct = R(T.qHpPct,qr) + T.qBonusAD100*bonusAD/100;   /* % des PV de la cible, applique dans onStep */
      A.qTotalHpPct = R(T.qTotalHpPct,qr) + T.qTotalBonusAD100*bonusAD/100;   /* % des PV de la cible, applique dans onStep */
      A.qAS = R(T.qAS,qr);
      A.qDmg = R(T.qFlat,qr) + T.qBonusAD*bonusAD + R(T.qBonusHp,qr)*bonusHP;
      /* W — Iron Mantle */
      A.wShield = R(T.wShield,wr) + T.wShieldBonusAD*bonusAD + T.wShieldAP*ap + R(T.wShieldMaxHp,wr)*tot.hp;
      A.wShieldMax = lerp(20,150,L) + R(T.wShieldMaxAdd,wr) + T.wShieldMaxBonusAD*bonusAD + T.wShieldMaxAP*ap + T.wShieldMaxMaxHp*tot.hp;
      A.wHealTotal = lerp(10,75,L) + T.wHealTotalBonusAD*bonusAD + T.wHealTotalAP*ap + T.wHealTotalMaxHp*tot.hp;
      /* E — Blazing Stampede */
      A.eMs = R(T.eMs,er) + T.eMsBonusAD100*bonusAD/100;
      A.eMsDecayed = R(T.eMsDecayed,er) + T.eMsDecayedBonusAD100*bonusAD/100;
      /* R — Wingborne Storm */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.rSlow = R(T.rSlow,rr);
      A.rSlowMax = R(T.rSlowMax,rr);
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qHpPct=0; A.qTotalHpPct=0; A.qAS=0; A.qDmg=0; }
      if(!learned.w){ A.wShield=0; A.wShieldMax=0; A.wHealTotal=0; }
      if(!learned.e){ A.eMs=0; A.eMsDecayed=0; }
      if(!learned.r){ A.rDmg=0; A.rSlow=0; A.rSlowMax=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Bridge Between","Canalisation des esprits"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Wilding Claw", fr:"Q — Griffe sauvage"},
      {id:"w", kind:"cast", label:"W", en:"W — Iron Mantle", fr:"W — Cape de fer"},
      {id:"e", kind:"cast", label:"E", en:"E — Blazing Stampede", fr:"E — Piétinement flamboyant"},
      {id:"r", kind:"spell", en:"R — Wingborne Storm", fr:"R — Tempête spirituelle"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q"){
        out.parts.push({n:"wildingClaw", v:A.qDmg + hp * A.qHpPct/100 + hp * A.qTotalHpPct/100, type:"phys"});
        out.asBonus = A.qAS;
      }
      if(st.id === "w"){
        out.heal = A.wHealTotal;
        out.shield = A.wShield;
      }
      if(st.id === "r") out.parts.push({n:"wingborneStorm", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("mPpct"), val:pc(A.qHpPct)},
         {lab:TR("mPpct"), val:pc(A.qTotalHpPct)},
         {lab:TR("bonusAs"), val:"+" + pc(A.qAS)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("shield"), val:n0(A.wShield)},
         {lab:TR("shield"), val:n0(A.wShieldMax)},
         {lab:TR("healing"), val:n0(A.wHealTotal)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("msBonus"), val:"+" + pc(A.eMs)},
         {lab:TR("msBonus"), val:"+" + pc(A.eMsDecayed)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("slow"), val:pc(A.rSlow)},
         {lab:TR("slow"), val:pc(A.rSlowMax)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - W / Life Steal : ligne non modelisee (15 to 20 6%)
   - W / Total Healing : ratio sans statistique « 45/2 to 145/2 6 » non modelise
   - W / Heal per Tick : ligne non modelisee (20/16/2 + (150/16/2-20/16/2)/17*(x-1) for 20 (+ 45/16/2 to 145/16/2 6) (+ 100/16/2% bonus AD) (+ 65/16/2% AP) (+ 8/16/2% maximum health))
   - W / Increased Life Steal : ligne non modelisee (15*2 to 20*2 6%)
   - R : pas de ligne de degats simple, « Total Magic Damage » prise comme ligne principale
   - R / Magic Damage per Tick : ligne non modelisee (10 to 50 6 (+ 17.5% AP))
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   - une table a six rangs : ce kit ne suit pas le schema 5/5/5/3, rankCap a revoir
   ------------------------------------------------------------------ */
