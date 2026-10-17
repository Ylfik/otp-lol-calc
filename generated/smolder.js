/* smolder — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Smolder.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"smolder", name:"Smolder", label:"Smolder", splash:0,
    base:{hp:[575,100], mana:[300,40], ad:[58,2.3],
          ar:[24,4], mr:[33,1.1],
          as:0.638, asPerLevel:4, ms:330},
    abilities_meta:[
      {k:"q", en:"Super Scorcher Breath", fr:"Boule de feu draconique"},
      {k:"w", en:"Achooo!", fr:"Atchoum !"},
      {k:"e", en:"Flap, Flap, Flap", fr:"Flap, flap, flap !"},
      {k:"r", en:"MMOOOMMMM!", fr:"MAMAAAN !"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[60,70,80,90,100], qBonusAD:1.3, qCd:[5.5,5,4.5,4,3.5],
      wFlat:[60,70,80,90,100], wBonusAD:0.6, wExplosion:[10,35,60,85,110], wExplosionBonusAD:0.5, wExplosionAP:0.8, wTotal:[70,105,140,175,210], wTotalBonusAD:1.1, wTotalAP:0.8, wCd:[14,13,12,11,10],
      eFlat:[50,75,100,125,150], eAD:1.5, eCd:[24,22,20,18,16],
      rHeal:[100,175,250], rHealBonusAD:0.75, rHealAP:0.75, rFlat:[150,250,350], rBonusAD:1, rAP:1, rMax:[225,375,525], rMaxBonusAD:1.5, rMaxAP:1.5, rCd:[120,110,100]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Super Scorcher Breath */
      A.qDmg = R(T.qFlat,qr) + T.qBonusAD*bonusAD;
      /* W — Achooo! */
      A.wDmg = R(T.wFlat,wr) + T.wBonusAD*bonusAD;
      A.wExplosion = R(T.wExplosion,wr) + T.wExplosionBonusAD*bonusAD + T.wExplosionAP*ap;
      A.wTotal = R(T.wTotal,wr) + T.wTotalBonusAD*bonusAD + T.wTotalAP*ap;
      /* E — Flap, Flap, Flap */
      A.eDmg = R(T.eFlat,er) + T.eAD*tot.ad;
      /* R — MMOOOMMMM! */
      A.rHeal = R(T.rHeal,rr) + T.rHealBonusAD*bonusAD + T.rHealAP*ap;
      A.rDmg = R(T.rFlat,rr) + T.rBonusAD*bonusAD + T.rAP*ap;
      A.rMax = R(T.rMax,rr) + T.rMaxBonusAD*bonusAD + T.rMaxAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wDmg=0; A.wExplosion=0; A.wTotal=0; }
      if(!learned.e){ A.eDmg=0; }
      if(!learned.r){ A.rHeal=0; A.rDmg=0; A.rMax=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Dragon Practice","Dragon en herbe"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Super Scorcher Breath", fr:"Q — Boule de feu draconique"},
      {id:"w", kind:"spell", en:"W — Achooo!", fr:"W — Atchoum !"},
      {id:"e", kind:"spell", en:"E — Flap, Flap, Flap", fr:"E — Flap, flap, flap !"},
      {id:"r", kind:"spell", en:"R — MMOOOMMMM!", fr:"R — MAMAAAN !"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"superScorcherBreath", v:A.qDmg, type:"phys"});
      if(st.id === "w") out.parts.push({n:"achooo", v:A.wDmg, type:"phys"});
      if(st.id === "e") out.parts.push({n:"flapFlapFlap", v:A.eDmg, type:"phys"});
      if(st.id === "r"){
        out.parts.push({n:"mmooommmm", v:A.rDmg, type:"phys"});
        out.heal = A.rHeal;
      }
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("damage"), val:n0(A.wExplosion)},
         {lab:TR("damage"), val:n0(A.wTotal)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("healing"), val:n0(A.rHeal)},
         {lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("damage"), val:n0(A.rMax)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q / Physical Damage : doublon de Physical Damage, ignore
   - E : pas de ligne de degats simple, « Minimum Total Physical Damage » prise comme ligne principale
   - E / Physical Damage per Hit : ligne non modelisee (10 to 30 (+ 30% AD))
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
