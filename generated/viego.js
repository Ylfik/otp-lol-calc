/* viego — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Viego.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"viego", name:"Viego", label:"Viego", splash:0,
    base:{hp:[630,109], mana:[0,0], ad:[57,4],
          ar:[34,4.6], mr:[32,2.05],
          as:0.658, asPerLevel:2.75, ms:345},
    abilities_meta:[
      {k:"q", en:"Blade of the Ruined King", fr:"Lame du roi déchu"},
      {k:"w", en:"Spectral Maw", fr:"Gueule spectrale"},
      {k:"e", en:"Harrowed Path", fr:"Chemin tourmenté"},
      {k:"r", en:"Heartbreaker", fr:"Cœur brisé"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qCurPct:[2,3,4,5,6], qCriticalCurPct:[3.4,5.1,6.8,8.5,10.2], qMin:[10,15,20,25,30], qFlat:[25,40,55,70,85], qAD:0.7, qCd:[5,4.5,4,3.5,3],
      wFlat:[80,135,190,245,300], wAP:1, wCd:[8,8,8,8,8],
      eAS:[30,35,40,45,50], eMs:[25,27.5,30,32.5,35], eMsAP100:4, eCd:[14,12,10,8,6],
      rMissPct:[12,16,20], rBonusAD100:5, rCd:[120,100,80]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Blade of the Ruined King */
      A.qCurPct = R(T.qCurPct,qr);   /* % des PV de la cible, applique dans onStep */
      A.qCriticalCurPct = R(T.qCriticalCurPct,qr);   /* % des PV de la cible, applique dans onStep */
      A.qMin = R(T.qMin,qr);
      A.qDmg = R(T.qFlat,qr) + T.qAD*tot.ad;
      /* W — Spectral Maw */
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      /* E — Harrowed Path */
      A.eAS = R(T.eAS,er);
      A.eMs = R(T.eMs,er) + T.eMsAP100*ap/100;
      /* R — Heartbreaker */
      A.rMissPct = R(T.rMissPct,rr) + T.rBonusAD100*bonusAD/100;   /* % des PV de la cible, applique dans onStep */
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qCurPct=0; A.qCriticalCurPct=0; A.qMin=0; A.qDmg=0; }
      if(!learned.w){ A.wDmg=0; }
      if(!learned.e){ A.eAS=0; A.eMs=0; }
      if(!learned.r){ A.rMissPct=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Sovereign's Domination","Assujettissement"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Blade of the Ruined King", fr:"Q — Lame du roi déchu"},
      {id:"w", kind:"spell", en:"W — Spectral Maw", fr:"W — Gueule spectrale"},
      {id:"e", kind:"cast", label:"E", en:"E — Harrowed Path", fr:"E — Chemin tourmenté"},
      {id:"r", kind:"spell", en:"R — Heartbreaker", fr:"R — Cœur brisé"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"bladeOfTheRuinedKing", v:A.qDmg + cur * A.qCurPct/100 + cur * A.qCriticalCurPct/100, type:"phys"});
      if(st.id === "w") out.parts.push({n:"spectralMaw", v:A.wDmg, type:"magic"});
      if(st.id === "e") out.asBonus = A.eAS;
      if(st.id === "r") out.parts.push({n:"heartbreaker", v:Math.max(0, hp - cur) * A.rMissPct/100, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("mPpct"), val:pc(A.qCurPct)},
         {lab:TR("mPpct"), val:pc(A.qCriticalCurPct)},
         {lab:TR("damage"), val:n0(A.qMin)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("bonusAs"), val:"+" + pc(A.eAS)},
         {lab:TR("msBonus"), val:"+" + pc(A.eMs)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("mPpct"), val:pc(A.rMissPct)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
