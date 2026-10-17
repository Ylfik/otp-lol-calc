/* camille — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Camille.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"camille", name:"Camille", label:"Camille", splash:0,
    base:{hp:[650,99], mana:[375,52], ad:[68,3.8],
          ar:[35,4.5], mr:[32,2.05],
          as:0.644, asPerLevel:2.5, ms:340},
    abilities_meta:[
      {k:"q", en:"Precision Protocol", fr:"Protocole de précision"},
      {k:"w", en:"Tactical Sweep", fr:"Balayage tactique"},
      {k:"e", en:"Hookshot", fr:"Grappin"},
      {k:"r", en:"The Hextech Ultimatum", fr:"Ultimatum Hextech"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[20,25,30,35,40], qMs:[25,30,35,40,45], qMax:[40,50,60,70,80], qCd:[9,8,7,6,5],
      wFlat:[60,85,110,135,160], wBonusAD:0.6, wHpPct:[7,7.5,8,8.5,9], wBonusAD100:2.5, wCd:[12,11.5,11,10.5,10],
      eCd:[16,15,14,13,12],
      rCurPct:[4,6,8], rCd:[140,115,90]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Precision Protocol */
      A.qDmg = (R(T.qFlat,qr))/100*tot.ad;
      A.qMs = R(T.qMs,qr);
      A.qMax = (R(T.qMax,qr))/100*tot.ad;
      /* W — Tactical Sweep */
      A.wDmg = R(T.wFlat,wr) + T.wBonusAD*bonusAD;
      A.wHpPct = R(T.wHpPct,wr) + T.wBonusAD100*bonusAD/100;   /* % des PV de la cible, applique dans onStep */
      /* R — The Hextech Ultimatum */
      A.rCurPct = R(T.rCurPct,rr);   /* % des PV de la cible, applique dans onStep */
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qMs=0; A.qMax=0; }
      if(!learned.w){ A.wDmg=0; A.wHpPct=0; }
      if(!learned.r){ A.rCurPct=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Adaptive Defenses","Protection modulable"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Precision Protocol", fr:"Q — Protocole de précision"},
      {id:"w", kind:"spell", en:"W — Tactical Sweep", fr:"W — Balayage tactique"},
      {id:"r", kind:"spell", en:"R — The Hextech Ultimatum", fr:"R — Ultimatum Hextech"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"precisionProtocol", v:A.qDmg, type:"phys"});
      if(st.id === "w") out.parts.push({n:"tacticalSweep", v:A.wDmg + hp * A.wHpPct/100, type:"phys"});
      if(st.id === "r") out.parts.push({n:"theHextechUltimatum", v:cur * A.rCurPct/100, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("msBonus"), val:"+" + pc(A.qMs)},
         {lab:TR("damage"), val:n0(A.qMax)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("mPpct"), val:pc(A.wHpPct)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("mPpct"), val:pc(A.rCurPct)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - E : 2 formes dans le wiki (Hookshot, Wall Dive) — seule la premiere est modelisee
   - W / Non-Epic Monster Damage : ligne non modelisee (60/2 to 160/2 (+ 30% bonus AD))
   - W / Bonus Non-Epic Monster Damage : ligne non modelisee (7/2 to 9/2% (+ 1.25% per 100 bonus AD) of target's maximum health)
   - R / Zone Duration : ligne non modelisee (2.5 to 4 seconds)
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
