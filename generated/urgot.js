/* urgot — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Urgot.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"urgot", name:"Urgot", label:"Urgot", splash:0,
    base:{hp:[655,102], mana:[340,45], ad:[63,4],
          ar:[36,5], mr:[32,2.05],
          as:0.625, asPerLevel:3.75, ms:330},
    abilities_meta:[
      {k:"q", en:"Corrosive Charge", fr:"Torpille corrosive"},
      {k:"w", en:"Purge", fr:"Géhenne"},
      {k:"e", en:"Disdain", fr:"Mépris"},
      {k:"r", en:"Fear Beyond Death", fr:"Règne de la terreur"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[25,70,115,160,205], qAD:0.7, qSlow:[45,50,55,60,65], qCd:[10,9.5,9,8.5,8],
      wFlat:12, wAD:[0.2,0.235,0.27,0.305,0.34], wCd:[12,9,6,3,0],
      eShield:[55,75,95,115,135], eShieldBonusAD:1.35, eShieldBonusHp:0.135, eFlat:[90,120,150,180,210], eBonusAD:1, eCd:[16,15.5,15,14.5,14],
      rFlat:[100,225,350], rBonusAD:0.5, rCd:[100,85,70]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Corrosive Charge */
      A.qDmg = R(T.qFlat,qr) + T.qAD*tot.ad;
      A.qSlow = R(T.qSlow,qr);
      /* W — Purge */
      A.wDmg = T.wFlat + R(T.wAD,wr)*tot.ad;
      /* E — Disdain */
      A.eShield = R(T.eShield,er) + T.eShieldBonusAD*bonusAD + T.eShieldBonusHp*bonusHP;
      A.eDmg = R(T.eFlat,er) + T.eBonusAD*bonusAD;
      /* R — Fear Beyond Death */
      A.rDmg = R(T.rFlat,rr) + T.rBonusAD*bonusAD;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qSlow=0; }
      if(!learned.w){ A.wDmg=0; }
      if(!learned.e){ A.eShield=0; A.eDmg=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Echoing Flames","Flammes purificatrices"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Corrosive Charge", fr:"Q — Torpille corrosive"},
      {id:"w", kind:"spell", en:"W — Purge", fr:"W — Géhenne"},
      {id:"e", kind:"spell", en:"E — Disdain", fr:"E — Mépris"},
      {id:"r", kind:"spell", en:"R — Fear Beyond Death", fr:"R — Règne de la terreur"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"corrosiveCharge", v:A.qDmg, type:"phys"});
      if(st.id === "w") out.parts.push({n:"purge", v:A.wDmg, type:"phys"});
      if(st.id === "e"){
        out.parts.push({n:"disdain", v:A.eDmg, type:"phys"});
        out.shield = A.eShield;
      }
      if(st.id === "r") out.parts.push({n:"fearBeyondDeath", v:A.rDmg, type:"phys"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("slow"), val:pc(A.qSlow)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("shield"), val:n0(A.eShield)},
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
   - Q : 2 formes dans le wiki (Corrosive Charge, Acid Hunter) — seule la premiere est modelisee
   - W : 2 formes dans le wiki (Purge, Terror Capacitor) — seule la premiere est modelisee
   - E : 2 formes dans le wiki (Disdain, Noxian Corrosive Charge) — seule la premiere est modelisee
   - R : 2 formes dans le wiki (Fear Beyond Death, Hyper-Kinetic Position Reverser) — seule la premiere est modelisee
   - passif : 2 blocs dans le wiki (Echoing Flames, Zaun-Touched Bolt Augmenter) — seul le premier est modelise
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
