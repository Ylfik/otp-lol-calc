/* milio — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Milio.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"milio", name:"Milio", label:"Milio", splash:0,
    base:{hp:[560,88], mana:[365,43], ad:[48,3.2],
          ar:[26,4.6], mr:[30,1.3],
          as:0.625, asPerLevel:3, ms:330},
    abilities_meta:[
      {k:"q", en:"Ultra Mega Fire Kick", fr:"Ultra méga boule de feu"},
      {k:"w", en:"Cozy Campfire", fr:"Feu de camp"},
      {k:"e", en:"Warm Hugs", fr:"Chaud devant !"},
      {k:"r", en:"Breath of Life", fr:"Flammes vitales"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[80,140,200,260,320], qAP:1.2, qSlow:[40,45,50,55,60], qSlowAP100:5, qCd:[10,10,10,10,10],
      wHealTotal:[70,90,110,130,150], wHealTotalAP:0.15, wCd:[29,27,25,23,21],
      eShield:[45,75,105,135,165], eShieldAP:0.45, eMs:[12,14,16,18,20],
      rHeal:[150,250,350], rHealAP:0.5, rCd:[160,145,130]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Ultra Mega Fire Kick */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      A.qSlow = R(T.qSlow,qr) + T.qSlowAP100*ap/100;
      /* W — Cozy Campfire */
      A.wHealTotal = R(T.wHealTotal,wr) + T.wHealTotalAP*ap;
      /* E — Warm Hugs */
      A.eShield = R(T.eShield,er) + T.eShieldAP*ap;
      A.eMs = R(T.eMs,er);
      /* R — Breath of Life */
      A.rHeal = R(T.rHeal,rr) + T.rHealAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qSlow=0; }
      if(!learned.w){ A.wHealTotal=0; }
      if(!learned.e){ A.eShield=0; A.eMs=0; }
      if(!learned.r){ A.rHeal=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Fired Up!","Tout feu tout flamme"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Ultra Mega Fire Kick", fr:"Q — Ultra méga boule de feu"},
      {id:"w", kind:"cast", label:"W", en:"W — Cozy Campfire", fr:"W — Feu de camp"},
      {id:"e", kind:"cast", label:"E", en:"E — Warm Hugs", fr:"E — Chaud devant !"},
      {id:"r", kind:"cast", label:"R", en:"R — Breath of Life", fr:"R — Flammes vitales"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"ultraMegaFireKick", v:A.qDmg, type:"magic"});
      if(st.id === "w") out.heal = A.wHealTotal;
      if(st.id === "e") out.shield = A.eShield;
      if(st.id === "r") out.heal = A.rHeal;
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("slow"), val:pc(A.qSlow)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("healing"), val:n0(A.wHealTotal)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("shield"), val:n0(A.eShield)},
         {lab:TR("msBonus"), val:"+" + pc(A.eMs)}],
        [{lab:TR("healing"), val:n0(A.rHeal)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - W / Base Attack Range Scaling : ligne non modelisee (10 to 20%)
   - W / Heal per Tick : ligne non modelisee (70/25 to 150/25 (+ 15/25% AP))
   - E : aucune recharge dans les donnees wiki
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
