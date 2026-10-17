/* blitzcrank — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Blitzcrank.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"blitzcrank", name:"Blitzcrank", label:"Blitzcrank", splash:0,
    base:{hp:[600,109], mana:[267,40], ad:[62,3.5],
          ar:[37,4.7], mr:[32,2.05],
          as:0.625, asPerLevel:1.13, ms:325},
    abilities_meta:[
      {k:"q", en:"Rocket Grab", fr:"Grappin propulsé"},
      {k:"w", en:"Overdrive", fr:"Surcharge"},
      {k:"e", en:"Power Fist", fr:"Poing d'acier"},
      {k:"r", en:"Static Field", fr:"Champ de stase"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[110,160,210,260,310], qAP:1.2, qCd:[20,19,18,17,16],
      wAS:[30,40,50,60,70], wMsMin:[60,65,70,75,80], wCd:[15,15,15,15,15],
      eCd:[7,6.5,6,5.5,5],
      rFlat:[50,100,150], rAP:[0.3,0.4,0.5], rMaxMana:0.02, rCd:[60,40,20]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Rocket Grab */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      /* W — Overdrive */
      A.wAS = R(T.wAS,wr);
      A.wMsMin = R(T.wMsMin,wr);
      /* R — Static Field */
      A.rDmg = R(T.rFlat,rr) + R(T.rAP,rr)*ap + T.rMaxMana*tot.mana;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wAS=0; A.wMsMin=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Mana Barrier","Barrière de mana"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Rocket Grab", fr:"Q — Grappin propulsé"},
      {id:"w", kind:"cast", label:"W", en:"W — Overdrive", fr:"W — Surcharge"},
      {id:"r", kind:"spell", en:"R — Static Field", fr:"R — Champ de stase"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"rocketGrab", v:A.qDmg, type:"magic"});
      if(st.id === "w") out.asBonus = A.wAS;
      if(st.id === "r") out.parts.push({n:"staticField", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("bonusAs"), val:"+" + pc(A.wAS)},
         {lab:TR("msBonus"), val:"+" + pc(A.wMsMin)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - R / Magic Damage : doublon de Magic Damage, ignore
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
