/* chogath — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Cho'Gath.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"chogath", name:"Chogath", label:"Cho'Gath", splash:0,
    base:{hp:[644,94], mana:[270,60], ad:[69,4.2],
          ar:[38,4.5], mr:[32,2.05],
          as:0.658, asPerLevel:1.44, ms:345},
    abilities_meta:[
      {k:"q", en:"Rupture", fr:"Rupture"},
      {k:"w", en:"Feral Scream", fr:"Cri sauvage"},
      {k:"e", en:"Vorpal Spikes", fr:"Piques vorpales"},
      {k:"r", en:"Feast", fr:"Festin"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[80,135,190,245,300], qAP:1, qCd:[6,6,6,6,6],
      wFlat:[80,130,180,230,280], wAP:0.7, wCc:[1.6,1.7,1.8,1.9,2], wCd:[11,10.5,10,9.5,9],
      eFlat:[20,40,60,80,100], eAP:0.3, eHpPct:[2.5,2.85,3.2,3.55,3.9], eTotal:[60,120,180,240,300], eTotalAP:0.9, eTotalHpPct:[7.5,8.55,9.6,10.65,11.7], eSlow:[30,35,40,45,50], eCd:[8,7,6,5,4],
      rFlat:[300,475,650], rAP:0.5, rBonusHp:0.1, rCd:[80,70,60]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Rupture */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      /* W — Feral Scream */
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      A.wCc = R(T.wCc,wr);
      /* E — Vorpal Spikes */
      A.eHpPct = R(T.eHpPct,er);   /* % des PV de la cible, applique dans onStep */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      A.eTotalHpPct = R(T.eTotalHpPct,er);   /* % des PV de la cible, applique dans onStep */
      A.eTotal = R(T.eTotal,er) + T.eTotalAP*ap;
      A.eSlow = R(T.eSlow,er);
      /* R — Feast */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap + T.rBonusHp*bonusHP;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wDmg=0; A.wCc=0; }
      if(!learned.e){ A.eHpPct=0; A.eDmg=0; A.eTotalHpPct=0; A.eTotal=0; A.eSlow=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Carnivore","Carnivore"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Rupture", fr:"Q — Rupture"},
      {id:"w", kind:"spell", en:"W — Feral Scream", fr:"W — Cri sauvage"},
      {id:"e", kind:"spell", en:"E — Vorpal Spikes", fr:"E — Piques vorpales"},
      {id:"r", kind:"spell", en:"R — Feast", fr:"R — Festin"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"rupture", v:A.qDmg, type:"magic"});
      if(st.id === "w") out.parts.push({n:"feralScream", v:A.wDmg, type:"magic"});
      if(st.id === "e") out.parts.push({n:"vorpalSpikes", v:A.eDmg + hp * A.eHpPct/100 + hp * A.eTotalHpPct/100, type:"magic"});
      if(st.id === "r") out.parts.push({n:"feast", v:A.rDmg, type:"true"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("comboTime"), val:n0(A.wCc)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("mPpct"), val:pc(A.eHpPct)},
         {lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("mPpct"), val:pc(A.eTotalHpPct)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - E / Monster Damage : ligne non modelisee (100 to 300 (+ 30% AP))
   - E / Total Monster Damage : ligne non modelisee (100*3 to 300*3 (+ 30*3% AP))
   - R / Non-Champion True Damage : ligne non modelisee (1200 (+ 50% AP) (+ 10% bonus health))
   - R / Bonus Health Per Stack : ligne non modelisee (80 to 160)
   - R / Bonus Attack Range Per Stack : ligne non modelisee (4.7 to 7.7)
   - R / Bonus Size Per Stack : ligne non modelisee ((60 to 100)/10%)
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
