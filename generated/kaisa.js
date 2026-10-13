/* kaisa — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Kai'Sa.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"kaisa", name:"Kaisa", label:"Kai'Sa", splash:0,
    base:{hp:[640,102], mana:[345,40], ad:[59,2.6],
          ar:[25,4.2], mr:[33,1.1],
          as:0.644, asPerLevel:1.8, ms:335},
    abilities_meta:[
      {k:"q", en:"Icathian Rain", fr:"Pluie d'Icathia"},
      {k:"w", en:"Void Seeker", fr:"Rayon du Néant"},
      {k:"e", en:"Supercharge", fr:"Surpresseur"},
      {k:"r", en:"Killer Instinct", fr:"Instinct meurtrier"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[90,123.75,157.5,191.25,225], qBonusAD:1.2375, qAP:0.45, qTotal:[150,206.25,262.5,318.75,375], qTotalBonusAD:2.0625, qTotalAP:0.75, qCd:[10,9,8,7,6],
      wFlat:[30,55,80,105,130], wAD:1.3, wAP:0.45, wCd:[20,18.5,17,15.5,14],
      eMsMin:[55,60,65,70,75], eMsMax:[110,120,130,140,150], eAS:[40,50,60,70,80], eCd:[16,14.5,13,11.5,10],
      rShield:[100,150,200], rShieldAD:[0.9,1.35,1.8], rShieldAP:1.2, rCd:[130,100,70]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Icathian Rain */
      A.qDmg = R(T.qFlat,qr) + T.qBonusAD*bonusAD + T.qAP*ap;
      A.qTotal = R(T.qTotal,qr) + T.qTotalBonusAD*bonusAD + T.qTotalAP*ap;
      /* W — Void Seeker */
      A.wDmg = R(T.wFlat,wr) + T.wAD*tot.ad + T.wAP*ap;
      /* E — Supercharge */
      A.eMsMin = R(T.eMsMin,er);
      A.eMsMax = R(T.eMsMax,er);
      A.eAS = R(T.eAS,er);
      /* R — Killer Instinct */
      A.rShield = R(T.rShield,rr) + R(T.rShieldAD,rr)*tot.ad + T.rShieldAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qTotal=0; }
      if(!learned.w){ A.wDmg=0; }
      if(!learned.e){ A.eMsMin=0; A.eMsMax=0; A.eAS=0; }
      if(!learned.r){ A.rShield=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Second Skin","Seconde peau"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Icathian Rain", fr:"Q — Pluie d'Icathia"},
      {id:"w", kind:"spell", en:"W — Void Seeker", fr:"W — Rayon du Néant"},
      {id:"e", kind:"cast", label:"E", en:"E — Supercharge", fr:"E — Surpresseur"},
      {id:"r", kind:"cast", label:"R", en:"R — Killer Instinct", fr:"R — Instinct meurtrier"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"icathianRain", v:A.qDmg, type:"phys"});
      if(st.id === "w") out.parts.push({n:"voidSeeker", v:A.wDmg, type:"magic"});
      if(st.id === "e") out.asBonus = A.eAS;
      if(st.id === "r") out.shield = A.rShield;
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("damage"), val:n0(A.qTotal)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("msBonus"), val:"+" + pc(A.eMsMin)},
         {lab:TR("msBonus"), val:"+" + pc(A.eMsMax)},
         {lab:TR("bonusAs"), val:"+" + pc(A.eAS)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("shield"), val:n0(A.rShield)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q : pas de ligne de degats simple, « Total Single-Target Damage » prise comme ligne principale
   - Q / Physical Damage Per Missile : ligne non modelisee (40 to 100 (+ 55% bonus AD) (+ 20% AP))
   - Q / Reduced Damage Per Missile : ligne non modelisee (40*0.25 to 100*0.25 (+ 55*0.25% bonus AD) (+ 20*0.25% AP))
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
