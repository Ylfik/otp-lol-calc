/* kayn — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Kayn.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"kayn", name:"Kayn", label:"Kayn", splash:0,
    base:{hp:[655,103], mana:[410,50], ad:[68,3.3],
          ar:[38,4.5], mr:[32,2.05],
          as:0.669, asPerLevel:2.7, ms:340},
    abilities_meta:[
      {k:"q", en:"Reaping Slash", fr:"Moisson cruelle"},
      {k:"w", en:"Blade's Reach", fr:"Entaille sombre"},
      {k:"e", en:"Shadow Step", fr:"Passe-muraille"},
      {k:"r", en:"Umbral Trespass", fr:"Intrusion obscure"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[75,105,135,165,195], qBonusAD:0.85, qTotal:[150,210,270,330,390], qTotalBonusAD:1.7, qCd:[7,6.5,6,5.5,5],
      wFlat:[85,130,175,220,265], wBonusAD:1.1, wCd:[13,12,11,10,9],
      eHeal:[90,100,110,120,130], eHealBonusAD:0.45, eCd:[21,19,17,15,13],
      rFlat:[150,250,350], rBonusAD:1.5, rCd:[120,100,80]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Reaping Slash */
      A.qDmg = R(T.qFlat,qr) + T.qBonusAD*bonusAD;
      A.qTotal = R(T.qTotal,qr) + T.qTotalBonusAD*bonusAD;
      /* W — Blade's Reach */
      A.wDmg = R(T.wFlat,wr) + T.wBonusAD*bonusAD;
      /* E — Shadow Step */
      A.eHeal = R(T.eHeal,er) + T.eHealBonusAD*bonusAD;
      /* R — Umbral Trespass */
      A.rDmg = R(T.rFlat,rr) + T.rBonusAD*bonusAD;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qTotal=0; }
      if(!learned.w){ A.wDmg=0; }
      if(!learned.e){ A.eHeal=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["The Darkin Scythe","Faux des Darkin"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Reaping Slash", fr:"Q — Moisson cruelle"},
      {id:"w", kind:"spell", en:"W — Blade's Reach", fr:"W — Entaille sombre"},
      {id:"e", kind:"cast", label:"E", en:"E — Shadow Step", fr:"E — Passe-muraille"},
      {id:"r", kind:"spell", en:"R — Umbral Trespass", fr:"R — Intrusion obscure"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"reapingSlash", v:A.qDmg, type:"phys"});
      if(st.id === "w") out.parts.push({n:"bladeSReach", v:A.wDmg, type:"phys"});
      if(st.id === "e") out.heal = A.eHeal;
      if(st.id === "r") out.parts.push({n:"umbralTrespass", v:A.rDmg, type:"phys"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("damage"), val:n0(A.qTotal)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("healing"), val:n0(A.eHeal)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q / Non-Champion Damage : ligne non modelisee (75+40 to 195+40 (+ 85% bonus AD))
   - Q / Total Non-Champion Damage : ligne non modelisee ((75+40)*2 to (195+40)*2 (+ 85*2% bonus AD))
   - Q / Capped Monster Damage per Hit : ligne non modelisee (200 to 400)
   - Q / Total Capped Monster Damage : ligne non modelisee (200*2 to 400*2)
   - E / Duration : ligne non modelisee (7 to 9 seconds)
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
