/* vayne — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Vayne.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"vayne", name:"Vayne", label:"Vayne", splash:0,
    base:{hp:[580,98], mana:[232,35], ad:[60,2.35],
          ar:[23,4.6], mr:[33,1.1],
          as:0.658, asPerLevel:2.8, ms:330},
    abilities_meta:[
      {k:"q", en:"Tumble", fr:"Roulade"},
      {k:"w", en:"Silver Bolts", fr:"Carreaux d'argent"},
      {k:"e", en:"Condemn", fr:"Condamnation"},
      {k:"r", en:"Final Hour", fr:"Combat ultime"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[75,85,95,105,115], qAP:0.5, qCd:[6,5,4,3,2],
      wHpPct:[4,5.5,7,8.5,10], wMin:[40,55,70,85,100],
      eFlat:[50,85,120,155,190], eBonusAD:0.5, eTotal:[125,212.5,300,387.5,475], eTotalBonusAD:1.25, eCd:[20,18,16,14,12],
      rCc:[8,10,12], rFlat:[35,50,65], rCd:[100,85,70]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Tumble */
      A.qDmg = (R(T.qFlat,qr))/100*tot.ad + T.qAP*ap;
      /* W — Silver Bolts */
      A.wHpPct = R(T.wHpPct,wr);   /* % des PV de la cible, applique dans onStep */
      A.wMin = R(T.wMin,wr);
      /* E — Condemn */
      A.eDmg = R(T.eFlat,er) + T.eBonusAD*bonusAD;
      A.eTotal = R(T.eTotal,er) + T.eTotalBonusAD*bonusAD;
      /* R — Final Hour */
      A.rCc = R(T.rCc,rr);
      A.rDmg = R(T.rFlat,rr);
      A.qCd = R(T.qCd,qr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wHpPct=0; A.wMin=0; }
      if(!learned.e){ A.eDmg=0; A.eTotal=0; }
      if(!learned.r){ A.rCc=0; A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Night Hunter","Chasseresse nocturne"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Tumble", fr:"Q — Roulade"},
      {id:"w", kind:"spell", en:"W — Silver Bolts", fr:"W — Carreaux d'argent"},
      {id:"e", kind:"spell", en:"E — Condemn", fr:"E — Condamnation"},
      {id:"r", kind:"spell", en:"R — Final Hour", fr:"R — Combat ultime"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"tumble", v:A.qDmg, type:"phys"});
      if(st.id === "w") out.parts.push({n:"silverBolts", v:hp * A.wHpPct/100, type:"magic"});
      if(st.id === "e") out.parts.push({n:"condemn", v:A.eDmg, type:"phys"});
      if(st.id === "r") out.parts.push({n:"finalHour", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("mPpct"), val:pc(A.wHpPct)},
         {lab:TR("damage"), val:n0(A.wMin)}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("damage"), val:n0(A.eTotal)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("comboTime"), val:n0(A.rCc)},
         {lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - W / Monster Damage : ligne non modelisee (140 to 200)
   - W : aucune recharge dans les donnees wiki
   - E / Bonus Physical Damage : doublon de Physical Damage, ignore
   - R / Tumble Cooldown Reduction : ligne non modelisee (30 to 50%)
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
