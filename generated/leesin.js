/* leesin — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Lee Sin.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"leesin", name:"LeeSin", label:"Lee Sin", splash:0,
    base:{hp:[645,108], mana:[200,0], ad:[66,3.4],
          ar:[36,4.5], mr:[32,2.05],
          as:0.651, asPerLevel:3, ms:345},
    abilities_meta:[
      {k:"q", en:"Sonic Wave / Resonating Strike", fr:"Onde sonore/Coup résonant"},
      {k:"w", en:"Safeguard / Iron Will", fr:"Rempart/Force d'âme"},
      {k:"e", en:"Tempest / Cripple", fr:"Trombe/Fracture"},
      {k:"r", en:"Dragon's Rage", fr:"Rage du dragon"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[60,90,120,150,180], qBonusAD:0.9, qCd:[10,9,8,7,6],
      wShield:[60,105,150,195,240], wShieldAP:0.8, wCd:[7,7,7,7,7],
      eFlat:[35,60,85,110,135], eAD:0.9, eCd:[8,8,8,8,8],
      rFlat:[175,400,625], rBonusAD:2, rCollision:[175,400,625], rCollisionBonusAD:2, rCollisionBonusHp:[0.12,0.15,0.18], rCd:[110,85,60]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Sonic Wave / Resonating Strike */
      A.qDmg = R(T.qFlat,qr) + T.qBonusAD*bonusAD;
      /* W — Safeguard / Iron Will */
      A.wShield = R(T.wShield,wr) + T.wShieldAP*ap;
      /* E — Tempest / Cripple */
      A.eDmg = R(T.eFlat,er) + T.eAD*tot.ad;
      /* R — Dragon's Rage */
      A.rDmg = R(T.rFlat,rr) + T.rBonusAD*bonusAD;
      A.rCollision = R(T.rCollision,rr) + T.rCollisionBonusAD*bonusAD + R(T.rCollisionBonusHp,rr)*bonusHP;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wShield=0; }
      if(!learned.e){ A.eDmg=0; }
      if(!learned.r){ A.rDmg=0; A.rCollision=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Flurry","Rafale"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Sonic Wave / Resonating Strike", fr:"Q — Onde sonore/Coup résonant"},
      {id:"w", kind:"cast", label:"W", en:"W — Safeguard / Iron Will", fr:"W — Rempart/Force d'âme"},
      {id:"e", kind:"spell", en:"E — Tempest / Cripple", fr:"E — Trombe/Fracture"},
      {id:"r", kind:"spell", en:"R — Dragon's Rage", fr:"R — Rage du dragon"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"sonicWaveResonatingStrike", v:A.qDmg, type:"phys"});
      if(st.id === "w") out.shield = A.wShield;
      if(st.id === "e") out.parts.push({n:"tempestCripple", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"dragonSRage", v:A.rDmg, type:"phys"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("shield"), val:n0(A.wShield)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("damage"), val:n0(A.rCollision)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q : 2 formes dans le wiki (Sonic Wave, Resonating Strike) — seule la premiere est modelisee
   - W : 2 formes dans le wiki (Safeguard, Iron Will) — seule la premiere est modelisee
   - E : 2 formes dans le wiki (Tempest, Cripple) — seule la premiere est modelisee
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   - ressource particuliere (Energy) : non modelisee
   ------------------------------------------------------------------ */
