/* nasus — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Nasus.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"nasus", name:"Nasus", label:"Nasus", splash:0,
    base:{hp:[650,104], mana:[326,62], ad:[67,4],
          ar:[34,4.7], mr:[32,2.05],
          as:0.638, asPerLevel:3.48, ms:350},
    abilities_meta:[
      {k:"q", en:"Siphoning Strike", fr:"Buveuse d'âmes"},
      {k:"w", en:"Wither", fr:"Flétrissement"},
      {k:"e", en:"Spirit Fire", fr:"Esprit enflammé"},
      {k:"r", en:"Fury of the Sands", fr:"Fureur des sables"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[30,50,70,90,110], qCd:[7.5,6.5,5.5,4.5,3.5],
      wSlowMax:[47,59,71,83,95], wCd:[15,14,13,12,11],
      eFlat:[50,80,110,140,170], eAP:0.6, eTotal:[100,160,220,280,340], eTotalAP:1.2, eCd:[12,12,12,12,12],
      rHpPct:[45,60,75], rAP100:15, rCd:[120,100,80]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Siphoning Strike */
      A.qDmg = R(T.qFlat,qr);
      /* W — Wither */
      A.wSlowMax = R(T.wSlowMax,wr);
      /* E — Spirit Fire */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      A.eTotal = R(T.eTotal,er) + T.eTotalAP*ap;
      /* R — Fury of the Sands */
      A.rHpPct = R(T.rHpPct,rr) + T.rAP100*ap/100;   /* % des PV de la cible, applique dans onStep */
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wSlowMax=0; }
      if(!learned.e){ A.eDmg=0; A.eTotal=0; }
      if(!learned.r){ A.rHpPct=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Soul Eater","Mangeur d'âmes"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Siphoning Strike", fr:"Q — Buveuse d'âmes"},
      {id:"w", kind:"cast", label:"W", en:"W — Wither", fr:"W — Flétrissement"},
      {id:"e", kind:"spell", en:"E — Spirit Fire", fr:"E — Esprit enflammé"},
      {id:"r", kind:"spell", en:"R — Fury of the Sands", fr:"R — Fureur des sables"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"siphoningStrike", v:A.qDmg, type:"phys"});
      if(st.id === "e") out.parts.push({n:"spiritFire", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"furyOfTheSands", v:hp * A.rHpPct/100, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("slow"), val:pc(A.wSlowMax)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("damage"), val:n0(A.eTotal)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("mPpct"), val:pc(A.rHpPct)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q / Bonus Physical Damage : ratio sans statistique « 100% of ''Siphoning Strike'' stacks » non modelise
   - W / Additional Slow Per Second : ligne non modelisee (3 to 15%)
   - W / Maximum Cripple : ligne non modelisee ((35+3*4)*0.75 to (35+15*4)*0.75%)
   - W / Additional Cripple Per Second : ligne non modelisee (3*0.75 to 15*0.75%)
   - E / Magic Damage Per Tick : ligne non modelisee (10 to 34 (+ 12% AP))
   - E / Armor Reduction : ligne non modelisee (30 to 50% of target's armor)
   - R : pas de ligne de degats simple, « Total Magic Damage » prise comme ligne principale
   - R / Bonus Health : ligne non modelisee (300 to 600)
   - R / Bonus Resistances : ligne non modelisee (40 to 70)
   - R / Increased Size : ligne non modelisee (30 to 40%)
   - R / Magic Damage Per Tick : ligne non modelisee (1.5 to 2.5% (+ 0.5% per 100 AP) of target's maximum health)
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
