/* jax — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Jax.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"jax", name:"Jax", label:"Jax", splash:0,
    base:{hp:[650,103], mana:[339,52], ad:[68,4.25],
          ar:[36,4.2], mr:[32,2.05],
          as:0.638, asPerLevel:3.4, ms:350},
    abilities_meta:[
      {k:"q", en:"Leap Strike", fr:"Frappe bondissante"},
      {k:"w", en:"Empower", fr:"Élargissement"},
      {k:"e", en:"Counter Strike", fr:"Contre-attaque"},
      {k:"r", en:"Grandmaster-at-Arms", fr:"Maître d'armes"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[65,105,145,185,225], qBonusAD:1, qCd:[8,7.5,7,6.5,6],
      wFlat:[50,85,120,155,190], wAP:0.6, wCd:[7,6,5,4,3],
      eFlat:[40,70,100,130,160], eAP:0.7, eHpPct:4, eMax:[80,140,200,260,320], eMaxAP:1.4, eMaxHpPct:8, eCd:[17,15,13,11,9],
      rFlat:[75,130,185], rAP:0.6, rCd:[110,100,90]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Leap Strike */
      A.qDmg = R(T.qFlat,qr) + T.qBonusAD*bonusAD;
      /* W — Empower */
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      /* E — Counter Strike */
      A.eHpPct = T.eHpPct;   /* % des PV de la cible, applique dans onStep */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      A.eMaxHpPct = T.eMaxHpPct;   /* % des PV de la cible, applique dans onStep */
      A.eMax = R(T.eMax,er) + T.eMaxAP*ap;
      /* R — Grandmaster-at-Arms */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wDmg=0; }
      if(!learned.e){ A.eHpPct=0; A.eDmg=0; A.eMaxHpPct=0; A.eMax=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Relentless Assault","Acharnement"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Leap Strike", fr:"Q — Frappe bondissante"},
      {id:"w", kind:"spell", en:"W — Empower", fr:"W — Élargissement"},
      {id:"e", kind:"spell", en:"E — Counter Strike", fr:"E — Contre-attaque"},
      {id:"r", kind:"spell", en:"R — Grandmaster-at-Arms", fr:"R — Maître d'armes"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"leapStrike", v:A.qDmg, type:"phys"});
      if(st.id === "w") out.parts.push({n:"empower", v:A.wDmg, type:"magic"});
      if(st.id === "e") out.parts.push({n:"counterStrike", v:A.eDmg + hp * A.eHpPct/100 + hp * A.eMaxHpPct/100, type:"magic"});
      if(st.id === "r") out.parts.push({n:"grandmasterAtArms", v:A.rDmg, type:"magic"});
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
        [{lab:TR("mPpct"), val:pc(A.eHpPct)},
         {lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("mPpct"), val:pc(A.eMaxHpPct)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - R : 2 formes dans le wiki (Grandmaster-at-Arms, Grandmaster's Might) — seule la premiere est modelisee
   - E : pas de ligne de degats simple, « Minimum Magic Damage » prise comme ligne principale
   - R / Magic Damage : doublon de Additional Magic Damage, ignore
   - R / Bonus Armor : ligne non modelisee (45 to 75 (+ 40% bonus AD))
   - R / Bonus Magic Resistance : ligne non modelisee (45*0.6 to 75*0.6 (+ 40*0.6% bonus AD))
   - R / Bonus Armor per Champion Hit : ligne non modelisee (20 to 30 (+ 10% bonus AD))
   - R / Bonus Magic Resistance per Champion Hit : ligne non modelisee (20*0.6 to 30*0.6 (+ 10*0.6% bonus AD))
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
