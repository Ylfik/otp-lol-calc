/* talon — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Talon.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"talon", name:"Talon", label:"Talon", splash:0,
    base:{hp:[658,109], mana:[400,37], ad:[68,3.1],
          ar:[30,4.7], mr:[36,2.05],
          as:0.625, asPerLevel:2.9, ms:335},
    abilities_meta:[
      {k:"q", en:"Noxian Diplomacy", fr:"Diplomatie noxienne"},
      {k:"w", en:"Rake", fr:"Ratissage"},
      {k:"e", en:"Assassin's Path", fr:"Voie de l'assassin"},
      {k:"r", en:"Shadow Assault", fr:"Assaut ténébreux"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[65,85,105,125,145], qBonusAD:1, qCritical:[97.5,127.5,157.5,187.5,217.5], qCriticalBonusAD:1.5, qCd:[8,7.5,7,6.5,6],
      wFlat:[50,60,70,80,90], wBonusAD:0.4, wTotal:[110,150,190,230,270], wTotalBonusAD:1.3, wSlow:[40,45,50,55,60], wCd:[9,8.5,8,7.5,7],
      eCd:[2,2,2,2,2],
      rFlat:[90,135,180], rBonusAD:1, rMs:[40,55,70], rTotal:[180,270,360], rTotalBonusAD:2, rCd:[100,80,60]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Noxian Diplomacy */
      A.qDmg = R(T.qFlat,qr) + T.qBonusAD*bonusAD;
      A.qCritical = R(T.qCritical,qr) + T.qCriticalBonusAD*bonusAD;
      /* W — Rake */
      A.wDmg = R(T.wFlat,wr) + T.wBonusAD*bonusAD;
      A.wTotal = R(T.wTotal,wr) + T.wTotalBonusAD*bonusAD;
      A.wSlow = R(T.wSlow,wr);
      /* R — Shadow Assault */
      A.rDmg = R(T.rFlat,rr) + T.rBonusAD*bonusAD;
      A.rMs = R(T.rMs,rr);
      A.rTotal = R(T.rTotal,rr) + T.rTotalBonusAD*bonusAD;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qCritical=0; }
      if(!learned.w){ A.wDmg=0; A.wTotal=0; A.wSlow=0; }
      if(!learned.r){ A.rDmg=0; A.rMs=0; A.rTotal=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Blade's End","Saignée fatale"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Noxian Diplomacy", fr:"Q — Diplomatie noxienne"},
      {id:"w", kind:"spell", en:"W — Rake", fr:"W — Ratissage"},
      {id:"r", kind:"spell", en:"R — Shadow Assault", fr:"R — Assaut ténébreux"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"noxianDiplomacy", v:A.qDmg, type:"phys"});
      if(st.id === "w") out.parts.push({n:"rake", v:A.wDmg, type:"phys"});
      if(st.id === "r") out.parts.push({n:"shadowAssault", v:A.rDmg, type:"phys"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("damage"), val:n0(A.qCritical)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("damage"), val:n0(A.wTotal)},
         {lab:TR("slow"), val:pc(A.wSlow)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("msBonus"), val:"+" + pc(A.rMs)},
         {lab:TR("damage"), val:n0(A.rTotal)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - W / Physical Damage : doublon de Physical Damage, ignore
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
