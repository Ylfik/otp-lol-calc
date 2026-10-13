/* gnar — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Gnar.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"gnar", name:"Gnar", label:"Gnar", splash:0,
    base:{hp:[540,79], mana:[100,0], ad:[60,3.2],
          ar:[32,3.7], mr:[30,1.3],
          as:0.625, asPerLevel:6, ms:335},
    abilities_meta:[
      {k:"q", en:"Boomerang Throw / Boulder Toss", fr:"Jet de boomerang/Jet de rocher"},
      {k:"w", en:"Hyper / Wallop", fr:"Agitation/Beigne"},
      {k:"e", en:"Hop / Crunch", fr:"Rebond/Aplatissement"},
      {k:"r", en:"GNAR!", fr:"GNAR !"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[5,45,85,125,165], qAD:1.25, qSlow:[15,20,25,30,35], qCd:[16,14.5,13,11.5,10],
      wFlat:[0,10,20,30,40], wHpPct:[6,8,10,12,14], wAP:1,
      eAS:[40,45,50,55,60], eFlat:[50,85,120,155,190], eMaxHp:0.06, eCd:[22,19.5,17,14.5,12],
      rMs:[40,60,80], rFlat:[200,300,400], rBonusAD:0.5, rAP:1, rCc:[1.25,1.5,1.75], rMax:[300,450,600], rMaxBonusAD:0.75, rMaxAP:1.5, rCd:[90,60,30]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Boomerang Throw / Boulder Toss */
      A.qDmg = R(T.qFlat,qr) + T.qAD*tot.ad;
      A.qSlow = R(T.qSlow,qr);
      /* W — Hyper / Wallop */
      A.wHpPct = R(T.wHpPct,wr);   /* % des PV de la cible, applique dans onStep */
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      /* E — Hop / Crunch */
      A.eAS = R(T.eAS,er);
      A.eDmg = R(T.eFlat,er) + T.eMaxHp*tot.hp;
      /* R — GNAR! */
      A.rMs = R(T.rMs,rr);
      A.rDmg = R(T.rFlat,rr) + T.rBonusAD*bonusAD + T.rAP*ap;
      A.rCc = R(T.rCc,rr);
      A.rMax = R(T.rMax,rr) + T.rMaxBonusAD*bonusAD + T.rMaxAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qSlow=0; }
      if(!learned.w){ A.wHpPct=0; A.wDmg=0; }
      if(!learned.e){ A.eAS=0; A.eDmg=0; }
      if(!learned.r){ A.rMs=0; A.rDmg=0; A.rCc=0; A.rMax=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Rage Gene","Rage génique"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Boomerang Throw / Boulder Toss", fr:"Q — Jet de boomerang/Jet de rocher"},
      {id:"w", kind:"spell", en:"W — Hyper / Wallop", fr:"W — Agitation/Beigne"},
      {id:"e", kind:"spell", en:"E — Hop / Crunch", fr:"E — Rebond/Aplatissement"},
      {id:"r", kind:"spell", en:"R — GNAR!", fr:"R — GNAR !"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"boomerangThrowBoulderToss", v:A.qDmg, type:"phys"});
      if(st.id === "w") out.parts.push({n:"hyperWallop", v:A.wDmg + hp * A.wHpPct/100, type:"magic"});
      if(st.id === "e"){
        out.parts.push({n:"hopCrunch", v:A.eDmg, type:"phys"});
        out.asBonus = A.eAS;
      }
      if(st.id === "r") out.parts.push({n:"gnar", v:A.rDmg, type:"phys"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("slow"), val:pc(A.qSlow)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("mPpct"), val:pc(A.wHpPct)},
         {lab:TR("damage"), val:n0(A.wDmg)}],
        [{lab:TR("bonusAs"), val:"+" + pc(A.eAS)},
         {lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("msBonus"), val:"+" + pc(A.rMs)},
         {lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("comboTime"), val:n0(A.rCc)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q : 2 formes dans le wiki (Boomerang Throw, Boulder Toss) — seule la premiere est modelisee
   - W : 2 formes dans le wiki (Hyper, Wallop) — seule la premiere est modelisee
   - E : 2 formes dans le wiki (Hop, Crunch) — seule la premiere est modelisee
   - Q / Reduced Damage : ligne non modelisee (5/2 to 165/2 (+ 125/2% AD))
   - W : aucune recharge dans les donnees wiki
   - passif : 3 blocs dans le wiki (Rage Gene, Mega Gnar, Mini Gnar) — seul le premier est modelise
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   - ressource particuliere (Rage) : non modelisee
   ------------------------------------------------------------------ */
