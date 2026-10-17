/* hwei — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Hwei.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"hwei", name:"Hwei", label:"Hwei", splash:0,
    base:{hp:[580,109], mana:[480,30], ad:[54,3.3],
          ar:[21,4.7], mr:[30,1.3],
          as:0.69, asPerLevel:2.5, ms:330},
    abilities_meta:[
      {k:"q", en:"Subject: Disaster", fr:"Sujet : Désastres"},
      {k:"w", en:"Subject: Serenity", fr:"Sujet : Sérénités"},
      {k:"e", en:"Subject: Torment", fr:"Sujet : Tourments"},
      {k:"r", en:"Spiraling Despair", fr:"Vision de désespoir"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qCd:[10,9,8,7,6],
      wCd:[18,17.5,17,16.5,16],
      eCd:[12,11.5,11,10.5,10],
      rTotal:[30,60,90], rTotalAP:0.15, rFlat:[200,325,450], rAP:0.8, rMax:[230,385,540], rMaxAP:0.95, rCd:[120,100,80]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* R — Spiraling Despair */
      A.rTotal = R(T.rTotal,rr) + T.rTotalAP*ap;
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.rMax = R(T.rMax,rr) + T.rMaxAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.r){ A.rTotal=0; A.rDmg=0; A.rMax=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Signature of the Visionary","Signature du Visionnaire"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"r", kind:"spell", en:"R — Spiraling Despair", fr:"R — Vision de désespoir"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "r") out.parts.push({n:"spiralingDespair", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rTotal)},
         {lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("damage"), val:n0(A.rMax)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q : 4 formes dans le wiki (Subject: Disaster, Devastating Fire, Fleeting Current, Grim Visage) — seule la premiere est modelisee
   - W : 4 formes dans le wiki (Subject: Serenity, Gaze of the Abyss, Pool of Reflection, Severing Bolt) — seule la premiere est modelisee
   - E : 4 formes dans le wiki (Subject: Torment, Crushing Maw, Molten Fissure, Stirring Lights) — seule la premiere est modelisee
   - R : 2 formes dans le wiki (Spiraling Despair, Wash Brush) — seule la premiere est modelisee
   - R / Magic Damage per Tick : ligne non modelisee (10/4 to 30/4 (+ 5/4% AP))
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
