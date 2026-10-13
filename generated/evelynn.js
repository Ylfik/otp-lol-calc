/* evelynn — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Evelynn.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"evelynn", name:"Evelynn", label:"Evelynn", splash:0,
    base:{hp:[642,98], mana:[315,42], ad:[61,3],
          ar:[37,4.7], mr:[32,2.05],
          as:0.667, asPerLevel:2.1, ms:335},
    abilities_meta:[
      {k:"q", en:"Hate Spike", fr:"Piques de haine"},
      {k:"w", en:"Allure", fr:"Séduction"},
      {k:"e", en:"Whiplash", fr:"Coup de fouet"},
      {k:"r", en:"Last Caress", fr:"Faiseuse de veuves"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[25,30,35,40,45], qAP:0.25, qTotal:[45,75,105,135,165], qTotalAP:0.75, qMax:[75,90,105,120,135], qMaxAP:0.75, qCd:[4,4,4,4,4],
      wCc:[1.25,1.5,1.75,2,2.25], wFlat:[250,300,350,400,450], wAP:0.6, wCd:[15,14,13,12,11],
      eFlat:[60,90,120,150,180], eHpPct:3, eHpPctAP100:1.5, eMs:[30,35,40,45,50], eCd:[8,8,8,8,8],
      rFlat:[125,250,375], rAP:0.75, rMax:[300,600,900], rMaxAP:1.8, rCd:[120,100,80]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Hate Spike */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      A.qTotal = R(T.qTotal,qr) + T.qTotalAP*ap;
      A.qMax = R(T.qMax,qr) + T.qMaxAP*ap;
      /* W — Allure */
      A.wCc = R(T.wCc,wr);
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      /* E — Whiplash */
      A.eHpPct = T.eHpPct + T.eHpPctAP100*ap/100;   /* % des PV de la cible, applique dans onStep */
      A.eDmg = R(T.eFlat,er);
      A.eMs = R(T.eMs,er);
      /* R — Last Caress */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.rMax = R(T.rMax,rr) + T.rMaxAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qTotal=0; A.qMax=0; }
      if(!learned.w){ A.wCc=0; A.wDmg=0; }
      if(!learned.e){ A.eHpPct=0; A.eDmg=0; A.eMs=0; }
      if(!learned.r){ A.rDmg=0; A.rMax=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Demon Shade","Ombre démoniaque"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Hate Spike", fr:"Q — Piques de haine"},
      {id:"w", kind:"spell", en:"W — Allure", fr:"W — Séduction"},
      {id:"e", kind:"spell", en:"E — Whiplash", fr:"E — Coup de fouet"},
      {id:"r", kind:"spell", en:"R — Last Caress", fr:"R — Faiseuse de veuves"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"hateSpike", v:A.qDmg, type:"magic"});
      if(st.id === "w") out.parts.push({n:"allure", v:A.wDmg, type:"magic"});
      if(st.id === "e") out.parts.push({n:"whiplash", v:A.eDmg + hp * A.eHpPct/100, type:"magic"});
      if(st.id === "r") out.parts.push({n:"lastCaress", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("damage"), val:n0(A.qTotal)},
         {lab:TR("damage"), val:n0(A.qMax)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("comboTime"), val:n0(A.wCc)},
         {lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("mPpct"), val:pc(A.eHpPct)},
         {lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("msBonus"), val:"+" + pc(A.eMs)},
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
   - W : 2 formes dans le wiki (Allure, Dark Frenzy) — seule la premiere est modelisee
   - E : 3 formes dans le wiki (Whiplash, Empowered Whiplash, Ravage) — seule la premiere est modelisee
   - R : 2 formes dans le wiki (Last Caress, Agony's Embrace) — seule la premiere est modelisee
   - Q / Bonus Magic Damage : doublon de Magic Damage, ignore
   - Q / Magic Damage : doublon de Magic Damage, ignore
   - Q / Total Magic Damage : doublon de Total Bonus Damage, ignore
   - W / Magic Resistance Reduction : ligne non modelisee (35 to 45%)
   - W / Monster Charm Duration : ligne non modelisee (1.25+2.25 to 2.25+2.25 seconds)
   - passif : 2 blocs dans le wiki (Demon Shade, Shadow Walk) — seul le premier est modelise
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
