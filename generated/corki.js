/* corki — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Corki.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"corki", name:"Corki", label:"Corki", splash:0,
    base:{hp:[610,100], mana:[350,40], ad:[52,2.5],
          ar:[27,4.5], mr:[33,1.1],
          as:0.644, asPerLevel:2.8, ms:325},
    abilities_meta:[
      {k:"q", en:"Phosphorus Bomb", fr:"Bombe au phosphore"},
      {k:"w", en:"Valkyrie", fr:"Valkyrie"},
      {k:"e", en:"Gatling Gun", fr:"Gatling"},
      {k:"r", en:"Missile Barrage", fr:"Barrage de projectiles"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[60,105,150,195,240], qBonusAD:1.25, qAP:1, qCd:[9,8.5,8,7.5,7],
      wFlat:[150,225,300,375,450], wBonusAD:2, wAP:1.5, wCd:[20,18,16,14,12],
      eFlat:[80,130,180,230,280], eBonusAD:2.4, eCd:[12,12,12,12,12],
      rFlat:[90,170,250], rBonusAD:0.85, rBig:[180,340,500], rBigBonusAD:1.7, rCd:[2,2,2]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Phosphorus Bomb */
      A.qDmg = R(T.qFlat,qr) + T.qBonusAD*bonusAD + T.qAP*ap;
      /* W — Valkyrie */
      A.wDmg = R(T.wFlat,wr) + T.wBonusAD*bonusAD + T.wAP*ap;
      /* E — Gatling Gun */
      A.eDmg = R(T.eFlat,er) + T.eBonusAD*bonusAD;
      /* R — Missile Barrage */
      A.rDmg = R(T.rFlat,rr) + T.rBonusAD*bonusAD;
      A.rBig = R(T.rBig,rr) + T.rBigBonusAD*bonusAD;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wDmg=0; }
      if(!learned.e){ A.eDmg=0; }
      if(!learned.r){ A.rDmg=0; A.rBig=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Hextech Munitions","Munitions Hextech"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Phosphorus Bomb", fr:"Q — Bombe au phosphore"},
      {id:"w", kind:"spell", en:"W — Valkyrie", fr:"W — Valkyrie"},
      {id:"e", kind:"spell", en:"E — Gatling Gun", fr:"E — Gatling"},
      {id:"r", kind:"spell", en:"R — Missile Barrage", fr:"R — Barrage de projectiles"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"phosphorusBomb", v:A.qDmg, type:"magic"});
      if(st.id === "w") out.parts.push({n:"valkyrie", v:A.wDmg, type:"magic"});
      if(st.id === "e") out.parts.push({n:"gatlingGun", v:A.eDmg, type:"phys"});
      if(st.id === "r") out.parts.push({n:"missileBarrage", v:A.rDmg, type:"phys"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("damage"), val:n0(A.rBig)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - W : 2 formes dans le wiki (Valkyrie, Special Delivery) — seule la premiere est modelisee
   - W : pas de ligne de degats simple, « Total Magic Damage » prise comme ligne principale
   - W / Magic Damage Per Tick : ligne non modelisee (30 to 90 (+ 40% bonus AD) (+ 30% AP))
   - E : pas de ligne de degats simple, « Total Physical Damage » prise comme ligne principale
   - E / Physical Damage Per Tick : ligne non modelisee (80/16 to 280/16 (+ 240/16% bonus AD))
   - E / Resistances Reduction Per Stack : ligne non modelisee (3 to 5)
   - E / Total Resistances Reduction : ligne non modelisee (3*4 to 5*4)
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
