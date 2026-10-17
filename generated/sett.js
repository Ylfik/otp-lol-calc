/* sett — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Sett.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"sett", name:"Sett", label:"Sett", splash:0,
    base:{hp:[670,114], mana:[0,0], ad:[60,4],
          ar:[33,4.7], mr:[28,2.05],
          as:0.625, asPerLevel:1.75, ms:340},
    abilities_meta:[
      {k:"q", en:"Knuckle Down", fr:"Rogne"},
      {k:"w", en:"Haymaker", fr:"Coup cathartique"},
      {k:"e", en:"Facebreaker", fr:"Casse-tête"},
      {k:"r", en:"The Show Stopper", fr:"Le Clou du spectacle"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[10,20,30,40,50], qHpPct:[1,1.5,2,2.5,3], qTotal:[20,40,60,80,100], qTotalHpPct:[2,3,4,5,6], qCd:[9,8,7,6,5],
      wFlat:[80,100,120,140,160], wBonusAD100:25, wCd:[18,16.5,15,13.5,12],
      eFlat:[50,70,90,110,130], eAD:0.6, eCd:[16,14.5,13,11.5,10],
      rFlat:[200,300,400], rBonusAD:1.2, rBonusHp:[0.4,0.5,0.6], rCd:[120,100,80]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Knuckle Down */
      A.qHpPct = R(T.qHpPct,qr);   /* % des PV de la cible, applique dans onStep */
      A.qDmg = R(T.qFlat,qr);
      A.qTotalHpPct = R(T.qTotalHpPct,qr);   /* % des PV de la cible, applique dans onStep */
      A.qTotal = R(T.qTotal,qr);
      /* W — Haymaker */
      A.wDmg = R(T.wFlat,wr) + T.wBonusAD100*bonusAD/100;
      /* E — Facebreaker */
      A.eDmg = R(T.eFlat,er) + T.eAD*tot.ad;
      /* R — The Show Stopper */
      A.rDmg = R(T.rFlat,rr) + T.rBonusAD*bonusAD + R(T.rBonusHp,rr)*bonusHP;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qHpPct=0; A.qDmg=0; A.qTotalHpPct=0; A.qTotal=0; }
      if(!learned.w){ A.wDmg=0; }
      if(!learned.e){ A.eDmg=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Pit Grit","Roi de l'arène"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Knuckle Down", fr:"Q — Rogne"},
      {id:"w", kind:"spell", en:"W — Haymaker", fr:"W — Coup cathartique"},
      {id:"e", kind:"spell", en:"E — Facebreaker", fr:"E — Casse-tête"},
      {id:"r", kind:"spell", en:"R — The Show Stopper", fr:"R — Le Clou du spectacle"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"knuckleDown", v:A.qDmg + hp * A.qHpPct/100 + hp * A.qTotalHpPct/100, type:"phys"});
      if(st.id === "w") out.parts.push({n:"haymaker", v:A.wDmg, type:"phys"});
      if(st.id === "e") out.parts.push({n:"facebreaker", v:A.eDmg, type:"phys"});
      if(st.id === "r") out.parts.push({n:"theShowStopper", v:A.rDmg, type:"phys"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("mPpct"), val:pc(A.qHpPct)},
         {lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("mPpct"), val:pc(A.qTotalHpPct)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - R / Reduced Damage : ligne non modelisee (200*0.25 to 400*0.25 (+ 30% bonus AD) (+ 40*0.25 to 60*0.25% of primary target's bonus health))
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   - ressource particuliere (Grit) : non modelisee
   ------------------------------------------------------------------ */
