/* thresh — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Thresh.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"thresh", name:"Thresh", label:"Thresh", splash:0,
    base:{hp:[620,120], mana:[274,44], ad:[56,2.2],
          ar:[33,0], mr:[30,1.55],
          as:0.625, asPerLevel:3.5, ms:330},
    abilities_meta:[
      {k:"q", en:"Death Sentence", fr:"Peine capitale"},
      {k:"w", en:"Dark Passage", fr:"Lien des ténèbres"},
      {k:"e", en:"Flay", fr:"Fauchage"},
      {k:"r", en:"The Box", fr:"La cage"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[100,150,200,250,300], qAP:0.9, qCd:[19,16.5,14,11.5,9],
      wShield:[50,70,90,110,130], wCd:[21,20,19,18,17],
      eMinAD:0, eMaxAD:[0.9,1.2,1.5,1.8,2.1], eFlat:[75,120,165,210,255], eAP:0.7, eSlow:[20,25,30,35,40], eCd:[13,12.25,11.5,10.75,10],
      rFlat:[250,400,550], rAP:1, rCd:[120,100,80]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Death Sentence */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      /* W — Dark Passage */
      A.wShield = R(T.wShield,wr);
      /* E — Flay */
      A.eMin = T.eMinAD*tot.ad;
      A.eMax = R(T.eMaxAD,er)*tot.ad;
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      A.eSlow = R(T.eSlow,er);
      /* R — The Box */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wShield=0; }
      if(!learned.e){ A.eMin=0; A.eMax=0; A.eDmg=0; A.eSlow=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Damnation","Damnation"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Death Sentence", fr:"Q — Peine capitale"},
      {id:"w", kind:"cast", label:"W", en:"W — Dark Passage", fr:"W — Lien des ténèbres"},
      {id:"e", kind:"spell", en:"E — Flay", fr:"E — Fauchage"},
      {id:"r", kind:"spell", en:"R — The Box", fr:"R — La cage"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"deathSentence", v:A.qDmg, type:"magic"});
      if(st.id === "w") out.shield = A.wShield;
      if(st.id === "e") out.parts.push({n:"flay", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"theBox", v:A.rDmg, type:"magic"});
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
        [{lab:TR("damage"), val:n0(A.eMin)},
         {lab:TR("damage"), val:n0(A.eMax)},
         {lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - W / Shield Strength : ratio sans statistique « 2 per Damnation collected » non modelise
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
