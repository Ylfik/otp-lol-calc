/* hecarim — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Hecarim.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"hecarim", name:"Hecarim", label:"Hecarim", splash:0,
    base:{hp:[625,106], mana:[280,40], ad:[66,3.7],
          ar:[32,5.45], mr:[32,2.05],
          as:0.67, asPerLevel:2.5, ms:345},
    abilities_meta:[
      {k:"q", en:"Rampage", fr:"Carnage"},
      {k:"w", en:"Spirit of Dread", fr:"Essence de la peur"},
      {k:"e", en:"Devastating Charge", fr:"Charge dévastatrice"},
      {k:"r", en:"Onslaught of Shadows", fr:"Légion des ombres"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[60,90,120,150,180], qBonusAD:0.9,
      wFlat:[80,120,160,200,240], wAP:0.8, wCd:[14,14,14,14,14],
      eFlat:[30,45,60,75,90], eBonusAD:0.5, eMax:[60,90,120,150,180], eMaxBonusAD:1, eCd:[20,19,18,17,16],
      rFlat:[150,250,350], rAP:1, rCd:[140,120,100]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Rampage */
      A.qDmg = R(T.qFlat,qr) + T.qBonusAD*bonusAD;
      /* W — Spirit of Dread */
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      /* E — Devastating Charge */
      A.eDmg = R(T.eFlat,er) + T.eBonusAD*bonusAD;
      A.eMax = R(T.eMax,er) + T.eMaxBonusAD*bonusAD;
      /* R — Onslaught of Shadows */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wDmg=0; }
      if(!learned.e){ A.eDmg=0; A.eMax=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Warpath","Galop"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Rampage", fr:"Q — Carnage"},
      {id:"w", kind:"spell", en:"W — Spirit of Dread", fr:"W — Essence de la peur"},
      {id:"e", kind:"spell", en:"E — Devastating Charge", fr:"E — Charge dévastatrice"},
      {id:"r", kind:"spell", en:"R — Onslaught of Shadows", fr:"R — Légion des ombres"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"rampage", v:A.qDmg, type:"phys"});
      if(st.id === "w") out.parts.push({n:"spiritOfDread", v:A.wDmg, type:"magic"});
      if(st.id === "e") out.parts.push({n:"devastatingCharge", v:A.eDmg, type:"phys"});
      if(st.id === "r") out.parts.push({n:"onslaughtOfShadows", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("damage"), val:n0(A.eMax)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q / Minion damage : ligne non modelisee (60*0.6 to 180*0.6 (+ 90*0.6% bonus AD))
   - Q : recharge qui varie avec le niveau (4 a -8.75) non modelisee
   - W : pas de ligne de degats simple, « Total Magic Damage » prise comme ligne principale
   - W / Magic Damage Per Tick : ligne non modelisee (20 to 60 (+ 20% AP))
   - W / Bonus Resistances : ligne non modelisee (5 to 25)
   - W / Capped Healing : ligne non modelisee (120 to 240)
   - E : pas de ligne de degats simple, « Minimum Physical Damage » prise comme ligne principale
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
