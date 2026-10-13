/* senna — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Senna.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"senna", name:"Senna", label:"Senna", splash:0,
    base:{hp:[530,89], mana:[350,45], ad:[50,0],
          ar:[25,4], mr:[33,1.1],
          as:0.625, asPerLevel:2.6, ms:330},
    abilities_meta:[
      {k:"q", en:"Piercing Darkness", fr:"Ombre perforante"},
      {k:"w", en:"Last Embrace", fr:"Dernière étreinte"},
      {k:"e", en:"Curse of the Black Mist", fr:"Malédiction de la Brume noire"},
      {k:"r", en:"Dawning Shadow", fr:"Ténèbres aveuglantes"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[30,55,80,105,130], qBonusAD:0.6, qCc:[1,1.25,1.5,1.75,2], qHeal:[40,60,80,100,120], qHealBonusAD:0.4, qHealAP:0.35, qCd:[15,15,15,15,15],
      wFlat:[70,110,150,190,230], wBonusAD:0.9, wCc:[1.25,1.5,1.75,2,2.25], wCd:[11,11,11,11,11],
      eCc:[6,6.5,7,7.5,8], eCd:[26,24.5,23,21.5,20],
      rFlat:[250,400,550], rBonusAD:1.15, rAP:0.7, rShield:[120,160,200], rShieldAP:0.5, rCd:[140,120,100]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Piercing Darkness */
      A.qDmg = R(T.qFlat,qr) + T.qBonusAD*bonusAD;
      A.qCc = R(T.qCc,qr);
      A.qHeal = R(T.qHeal,qr) + T.qHealBonusAD*bonusAD + T.qHealAP*ap;
      /* W — Last Embrace */
      A.wDmg = R(T.wFlat,wr) + T.wBonusAD*bonusAD;
      A.wCc = R(T.wCc,wr);
      /* E — Curse of the Black Mist */
      A.eCc = R(T.eCc,er);
      /* R — Dawning Shadow */
      A.rDmg = R(T.rFlat,rr) + T.rBonusAD*bonusAD + T.rAP*ap;
      A.rShield = R(T.rShield,rr) + T.rShieldAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qCc=0; A.qHeal=0; }
      if(!learned.w){ A.wDmg=0; A.wCc=0; }
      if(!learned.e){ A.eCc=0; }
      if(!learned.r){ A.rDmg=0; A.rShield=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Absolution","Absolution"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Piercing Darkness", fr:"Q — Ombre perforante"},
      {id:"w", kind:"spell", en:"W — Last Embrace", fr:"W — Dernière étreinte"},
      {id:"e", kind:"cast", label:"E", en:"E — Curse of the Black Mist", fr:"E — Malédiction de la Brume noire"},
      {id:"r", kind:"spell", en:"R — Dawning Shadow", fr:"R — Ténèbres aveuglantes"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q"){
        out.parts.push({n:"piercingDarkness", v:A.qDmg, type:"phys"});
        out.heal = A.qHeal;
      }
      if(st.id === "w") out.parts.push({n:"lastEmbrace", v:A.wDmg, type:"phys"});
      if(st.id === "r"){
        out.parts.push({n:"dawningShadow", v:A.rDmg, type:"phys"});
        out.shield = A.rShield;
      }
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("comboTime"), val:n0(A.qCc)},
         {lab:TR("healing"), val:n0(A.qHeal)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("comboTime"), val:n0(A.wCc)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("comboTime"), val:n0(A.eCc)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("shield"), val:n0(A.rShield)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - slot non reconnu « A » pour Basic Attack
   - R / Shield Strength : ratio sans statistique « 150% Absolution » non modelise
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
