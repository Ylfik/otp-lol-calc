/* syndra — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Syndra.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"syndra", name:"Syndra", label:"Syndra", splash:0,
    base:{hp:[583,100], mana:[480,40], ad:[54,2.9],
          ar:[25,4], mr:[30,1.3],
          as:0.658, asPerLevel:2, ms:330},
    abilities_meta:[
      {k:"q", en:"Dark Sphere", fr:"Sphère noire"},
      {k:"w", en:"Force of Will", fr:"Force de la volonté"},
      {k:"e", en:"Scatter the Weak", fr:"Dispersion des faibles"},
      {k:"r", en:"Unleashed Power", fr:"Déchaînement de puissance"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[90,125,160,195,230], qAP:0.7, qCd:[7,7,7,7,7],
      wFlat:[70,100,130,160,190], wAP:0.65, wTotal:[78.4,112,145.6,179.2,212.8], wTotalAP:[0.742,0.748,0.754,0.76,0.766], wTotalAP2:0.0114, wCd:[13,12,11,10,9],
      eFlat:[60,95,130,165,200], eAP:0.6, eCd:[15,15,15,15,15],
      rFlat:[240,360,480], rAP:0.6, rMax:[560,840,1120], rMaxAP:1.4, rCd:[120,100,80]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Dark Sphere */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      /* W — Force of Will */
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      A.wTotal = R(T.wTotal,wr) + R(T.wTotalAP,wr)*ap + T.wTotalAP2*ap;
      /* E — Scatter the Weak */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      /* R — Unleashed Power */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.rMax = R(T.rMax,rr) + T.rMaxAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wDmg=0; A.wTotal=0; }
      if(!learned.e){ A.eDmg=0; }
      if(!learned.r){ A.rDmg=0; A.rMax=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Transcendent","Transcendance"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Dark Sphere", fr:"Q — Sphère noire"},
      {id:"w", kind:"spell", en:"W — Force of Will", fr:"W — Force de la volonté"},
      {id:"e", kind:"spell", en:"E — Scatter the Weak", fr:"E — Dispersion des faibles"},
      {id:"r", kind:"spell", en:"R — Unleashed Power", fr:"R — Déchaînement de puissance"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"darkSphere", v:A.qDmg, type:"magic"});
      if(st.id === "w") out.parts.push({n:"forceOfWill", v:A.wDmg, type:"magic"});
      if(st.id === "e") out.parts.push({n:"scatterTheWeak", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"unleashedPower", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("damage"), val:n0(A.wTotal)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
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
   - W / Bonus True Damage : doublon de Magic Damage, ignore
   - R : pas de ligne de degats simple, « Minimum Magic Damage » prise comme ligne principale
   - R / Ability Haste : ligne non modelisee (10 to 30)
   - R / Magic Damage per Sphere : ligne non modelisee (80 to 160 (+ 20% AP))
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
