/* tristana — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Tristana.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"tristana", name:"Tristana", label:"Tristana", splash:0,
    base:{hp:[640,102], mana:[300,32], ad:[60,3.4],
          ar:[30,4], mr:[33,1.1],
          as:0.656, asPerLevel:1.5, ms:325},
    abilities_meta:[
      {k:"q", en:"Rapid Fire", fr:"Tir rapide"},
      {k:"w", en:"Rocket Jump", fr:"Saut roquette"},
      {k:"e", en:"Explosive Charge", fr:"Charge explosive"},
      {k:"r", en:"Buster Shot", fr:"Tir à impact"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qAS:[60,75,90,105,120], qCd:[20,19,18,17,16],
      wFlat:[70,105,140,175,210], wBonusAD:1, wAP:0.5, wCd:[22,20,18,16,14],
      eFlat:[45,60,75,90,105], eAP:0.25, eMin:[60,85,110,135,160], eMinBonusAD:0.8, eMinAP:0.5, ePerStackBonusAD:0.2, ePerStackAP:0.125, eFullBonusAD:0.8, eFullAP:0.5, eCd:[16,15.5,15,14.5,14],
      rFlat:[225,275,325], rBonusAD:0.7, rAP:1, rCc:[0.4,0.55,0.7], rCd:[100,100,100]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Rapid Fire */
      A.qAS = R(T.qAS,qr);
      /* W — Rocket Jump */
      A.wDmg = R(T.wFlat,wr) + T.wBonusAD*bonusAD + T.wAP*ap;
      /* E — Explosive Charge */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      A.eMin = R(T.eMin,er) + T.eMinBonusAD*bonusAD + T.eMinAP*ap;
      A.ePerStack = T.ePerStackBonusAD*bonusAD + T.ePerStackAP*ap;
      A.eFull = T.eFullBonusAD*bonusAD + T.eFullAP*ap;
      /* R — Buster Shot */
      A.rDmg = R(T.rFlat,rr) + T.rBonusAD*bonusAD + T.rAP*ap;
      A.rCc = R(T.rCc,rr);
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qAS=0; }
      if(!learned.w){ A.wDmg=0; }
      if(!learned.e){ A.eDmg=0; A.eMin=0; A.ePerStack=0; A.eFull=0; }
      if(!learned.r){ A.rDmg=0; A.rCc=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Draw a Bead","Tir de précision"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"cast", label:"Q", en:"Q — Rapid Fire", fr:"Q — Tir rapide"},
      {id:"w", kind:"spell", en:"W — Rocket Jump", fr:"W — Saut roquette"},
      {id:"e", kind:"spell", en:"E — Explosive Charge", fr:"E — Charge explosive"},
      {id:"r", kind:"spell", en:"R — Buster Shot", fr:"R — Tir à impact"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.asBonus = A.qAS;
      if(st.id === "w") out.parts.push({n:"rocketJump", v:A.wDmg, type:"magic"});
      if(st.id === "e") out.parts.push({n:"explosiveCharge", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"busterShot", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("bonusAs"), val:"+" + pc(A.qAS)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("damage"), val:n0(A.eMin)},
         {lab:TR("damage"), val:n0(A.ePerStack)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("comboTime"), val:n0(A.rCc)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - E / Full Stack Physical Damage : doublon de Magic Damage, ignore
   - R / Knock Back Distance : ligne non modelisee (600)
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
