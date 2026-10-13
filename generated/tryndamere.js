/* tryndamere — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Tryndamere.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"tryndamere", name:"Tryndamere", label:"Tryndamere", splash:0,
    base:{hp:[696,108], mana:[100,0], ad:[66,4.5],
          ar:[33,4.8], mr:[32,2.05],
          as:0.67, asPerLevel:3.4, ms:345},
    abilities_meta:[
      {k:"q", en:"Bloodlust", fr:"Soif de sang"},
      {k:"w", en:"Mocking Shout", fr:"Moquerie"},
      {k:"e", en:"Spinning Slash", fr:"Balafre"},
      {k:"r", en:"Undying Rage", fr:"Rage inépuisable"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[20,35,50,65,80], qHealMin:[30,40,50,60,70], qHealMinAP:0.3, qHealMax:[80,135,190,245,300], qHealMaxAP:1.5, qCd:[12,12,12,12,12],
      wSlow:[30,35,40,45,50], wCd:[14,14,14,14,14],
      eFlat:[80,120,160,200,240], eBonusAD:1, eAP:0.8, eCd:[12,11,10,9,8],
      rCd:[120,100,80]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Bloodlust */
      A.qDmg = R(T.qFlat,qr);
      A.qHealMin = R(T.qHealMin,qr) + T.qHealMinAP*ap;
      A.qHealMax = R(T.qHealMax,qr) + T.qHealMaxAP*ap;
      /* W — Mocking Shout */
      A.wSlow = R(T.wSlow,wr);
      /* E — Spinning Slash */
      A.eDmg = R(T.eFlat,er) + T.eBonusAD*bonusAD + T.eAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qHealMin=0; A.qHealMax=0; }
      if(!learned.w){ A.wSlow=0; }
      if(!learned.e){ A.eDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Battle Fury","Vague de violence"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Bloodlust", fr:"Q — Soif de sang"},
      {id:"w", kind:"cast", label:"W", en:"W — Mocking Shout", fr:"W — Moquerie"},
      {id:"e", kind:"spell", en:"E — Spinning Slash", fr:"E — Balafre"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q"){
        out.parts.push({n:"bloodlust", v:A.qDmg, type:"magic"});
        out.heal = A.qHealMin;
      }
      if(st.id === "e") out.parts.push({n:"spinningSlash", v:A.eDmg, type:"phys"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("healing"), val:n0(A.qHealMin)},
         {lab:TR("healing"), val:n0(A.qHealMax)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("slow"), val:pc(A.wSlow)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q : pas de ligne de degats simple, « Maximum Bonus Attack Damage » prise comme ligne principale
   - Q / Bonus Attack Damage per 1% missing health : ligne non modelisee ({{ap| to }})
   - Q / Heal Per 1 Fury : ligne non modelisee (0.5 to 2.3 (+ 1.2% AP))
   - W / Attack Damage Reduction : ligne non modelisee (20 to 80)
   - R / Fury Gained : ligne non modelisee (50)
   - R / Minimum Health Threshold : ligne non modelisee (30)
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   - ressource particuliere (Fury) : non modelisee
   ------------------------------------------------------------------ */
