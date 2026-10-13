/* poppy — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Poppy.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"poppy", name:"Poppy", label:"Poppy", splash:0,
    base:{hp:[610,110], mana:[300,45], ad:[56,4],
          ar:[35,5], mr:[32,2.05],
          as:0.658, asPerLevel:2.5, ms:345},
    abilities_meta:[
      {k:"q", en:"Hammer Shock", fr:"Commotion"},
      {k:"w", en:"Steadfast Presence", fr:"Présence immuable"},
      {k:"e", en:"Heroic Charge", fr:"Charge héroïque"},
      {k:"r", en:"Keeper's Verdict", fr:"Verdict de la gardienne"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[30,55,80,105,130], qBonusAD:0.75, qHpPct:[7,7.5,8,8.5,9], qSlow:[20,23,26,29,32], qSlowBonusHp:0.008, qTotal:[60,110,160,210,260], qTotalBonusAD:1.5, qTotalHpPct:[14,15,16,17,18], qCd:[8,7,6,5,4],
      wFlat:[70,110,150,190,230], wAP:0.7, wCd:[20,18,16,14,12],
      eFlat:[40,60,80,100,120], eBonusAD:0.6, eCc:[1.6,1.7,1.8,1.9,2], eTotal:[80,120,160,200,240], eTotalBonusAD:1.2, eCd:[14,13,12,11,10],
      rFlat:[100,150,200], rBonusAD:0.45, rMax:[200,300,400], rMaxBonusAD:0.9, rCd:[140,120,100]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Hammer Shock */
      A.qHpPct = R(T.qHpPct,qr);   /* % des PV de la cible, applique dans onStep */
      A.qDmg = R(T.qFlat,qr) + T.qBonusAD*bonusAD;
      A.qSlow = R(T.qSlow,qr) + T.qSlowBonusHp*bonusHP;
      A.qTotalHpPct = R(T.qTotalHpPct,qr);   /* % des PV de la cible, applique dans onStep */
      A.qTotal = R(T.qTotal,qr) + T.qTotalBonusAD*bonusAD;
      /* W — Steadfast Presence */
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      /* E — Heroic Charge */
      A.eDmg = R(T.eFlat,er) + T.eBonusAD*bonusAD;
      A.eCc = R(T.eCc,er);
      A.eTotal = R(T.eTotal,er) + T.eTotalBonusAD*bonusAD;
      /* R — Keeper's Verdict */
      A.rDmg = R(T.rFlat,rr) + T.rBonusAD*bonusAD;
      A.rMax = R(T.rMax,rr) + T.rMaxBonusAD*bonusAD;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qHpPct=0; A.qDmg=0; A.qSlow=0; A.qTotalHpPct=0; A.qTotal=0; }
      if(!learned.w){ A.wDmg=0; }
      if(!learned.e){ A.eDmg=0; A.eCc=0; A.eTotal=0; }
      if(!learned.r){ A.rDmg=0; A.rMax=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Iron Ambassador","Ambassadrice de fer"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Hammer Shock", fr:"Q — Commotion"},
      {id:"w", kind:"spell", en:"W — Steadfast Presence", fr:"W — Présence immuable"},
      {id:"e", kind:"spell", en:"E — Heroic Charge", fr:"E — Charge héroïque"},
      {id:"r", kind:"spell", en:"R — Keeper's Verdict", fr:"R — Verdict de la gardienne"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"hammerShock", v:A.qDmg + hp * A.qHpPct/100 + hp * A.qTotalHpPct/100, type:"phys"});
      if(st.id === "w") out.parts.push({n:"steadfastPresence", v:A.wDmg, type:"magic"});
      if(st.id === "e") out.parts.push({n:"heroicCharge", v:A.eDmg, type:"phys"});
      if(st.id === "r") out.parts.push({n:"keeperSVerdict", v:A.rDmg, type:"phys"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("mPpct"), val:pc(A.qHpPct)},
         {lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("slow"), val:pc(A.qSlow)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("comboTime"), val:n0(A.eCc)},
         {lab:TR("damage"), val:n0(A.eTotal)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("damage"), val:n0(A.rMax)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q / Capped Minion/Monster Health Damage : ligne non modelisee (70 to 210)
   - Q / Maximum Minion/Monster Damage : ligne non modelisee (30+70 to 130+210 (+ 75% bonus AD))
   - Q / Total Maximum Minion/Monster Damage : ligne non modelisee ((30+70)*2 to (130+210)*2 (+ 75*2% bonus AD))
   - passif : 6 blocs dans le wiki (Iron Ambassador, Devastating Blow, Diplomatic Immunity, Heroic Charge old, Paragon of Demacia, Valiant Fighter) — seul le premier est modelise
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
