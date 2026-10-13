/* orianna — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Orianna.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"orianna", name:"Orianna", label:"Orianna", splash:0,
    base:{hp:[565,110], mana:[418,25], ad:[44,2.6],
          ar:[20,4.2], mr:[26,1.3],
          as:0.658, asPerLevel:3.5, ms:325},
    abilities_meta:[
      {k:"q", en:"Command: Attack", fr:"Ordre : Attaque"},
      {k:"w", en:"Command: Dissonance", fr:"Ordre : Dissonance"},
      {k:"e", en:"Command: Protect", fr:"Ordre : Protection"},
      {k:"r", en:"Command: Shockwave", fr:"Ordre : Onde de choc"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[60,90,120,150,180], qAP:0.55, qCd:[7,6,5,4,3],
      wFlat:[70,110,150,190,230], wAP:0.8, wMs:[20,25,30,35,40], wCd:[7,7,7,7,7],
      eFlat:[60,90,120,150,180], eAP:0.3, eShield:[55,90,125,160,195], eShieldAP:0.45, eCd:[9,9,9,9,9],
      rFlat:[225,350,475], rAP:1.1, rCd:[110,95,80]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Command: Attack */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      /* W — Command: Dissonance */
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      A.wMs = R(T.wMs,wr);
      /* E — Command: Protect */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      A.eShield = R(T.eShield,er) + T.eShieldAP*ap;
      /* R — Command: Shockwave */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wDmg=0; A.wMs=0; }
      if(!learned.e){ A.eDmg=0; A.eShield=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Clockwork Windup","Remontoir"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Command: Attack", fr:"Q — Ordre : Attaque"},
      {id:"w", kind:"spell", en:"W — Command: Dissonance", fr:"W — Ordre : Dissonance"},
      {id:"e", kind:"spell", en:"E — Command: Protect", fr:"E — Ordre : Protection"},
      {id:"r", kind:"spell", en:"R — Command: Shockwave", fr:"R — Ordre : Onde de choc"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"commandAttack", v:A.qDmg, type:"magic"});
      if(st.id === "w") out.parts.push({n:"commandDissonance", v:A.wDmg, type:"magic"});
      if(st.id === "e"){
        out.parts.push({n:"commandProtect", v:A.eDmg, type:"magic"});
        out.shield = A.eShield;
      }
      if(st.id === "r") out.parts.push({n:"commandShockwave", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("msBonus"), val:"+" + pc(A.wMs)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("shield"), val:n0(A.eShield)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q / Reduced Damage : ligne non modelisee (60*0.7 to 180*0.7 (+ 55*0.7% AP))
   - E / Bonus Resistances : ligne non modelisee (6 to 30)
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
