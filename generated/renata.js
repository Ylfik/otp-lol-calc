/* renata — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Renata Glasc.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"renata", name:"Renata", label:"Renata Glasc", splash:0,
    base:{hp:[545,94], mana:[350,50], ad:[49,3],
          ar:[27,4.7], mr:[30,1.3],
          as:0.625, asPerLevel:2.11, ms:330},
    abilities_meta:[
      {k:"q", en:"Handshake", fr:"Poignée de main"},
      {k:"w", en:"Bailout", fr:"Patronage"},
      {k:"e", en:"Loyalty Program", fr:"Programme de fidélité"},
      {k:"r", en:"Hostile Takeover", fr:"Prise de contrôle hostile"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[80,125,170,215,260], qAP:0.8, qCd:[16,16,16,16,16],
      wAS:[10,15,20,25,30], wASAP100:1, wASMax:[20,30,40,50,60], wASMaxAP100:2, wMs:[10,12.5,15,17.5,20], wMsAP100:1, wMsMax:[20,25,30,35,40], wMsMaxAP100:2, wCd:[28,27,26,25,24],
      eFlat:[65,95,125,155,185], eAP:0.55, eShield:[50,65,80,95,110], eShieldAP:0.5, eCd:[14,13,12,11,10],
      rCc:[1.25,1.75,2.25], rCd:[150,130,110]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Handshake */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      /* W — Bailout */
      A.wAS = R(T.wAS,wr) + T.wASAP100*ap/100;
      A.wASMax = R(T.wASMax,wr) + T.wASMaxAP100*ap/100;
      A.wMs = R(T.wMs,wr) + T.wMsAP100*ap/100;
      A.wMsMax = R(T.wMsMax,wr) + T.wMsMaxAP100*ap/100;
      /* E — Loyalty Program */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      A.eShield = R(T.eShield,er) + T.eShieldAP*ap;
      /* R — Hostile Takeover */
      A.rCc = R(T.rCc,rr);
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wAS=0; A.wASMax=0; A.wMs=0; A.wMsMax=0; }
      if(!learned.e){ A.eDmg=0; A.eShield=0; }
      if(!learned.r){ A.rCc=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Leverage","Pression"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Handshake", fr:"Q — Poignée de main"},
      {id:"w", kind:"cast", label:"W", en:"W — Bailout", fr:"W — Patronage"},
      {id:"e", kind:"spell", en:"E — Loyalty Program", fr:"E — Programme de fidélité"},
      {id:"r", kind:"cast", label:"R", en:"R — Hostile Takeover", fr:"R — Prise de contrôle hostile"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"handshake", v:A.qDmg, type:"magic"});
      if(st.id === "w") out.asBonus = A.wAS;
      if(st.id === "e"){
        out.parts.push({n:"loyaltyProgram", v:A.eDmg, type:"magic"});
        out.shield = A.eShield;
      }
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("bonusAs"), val:"+" + pc(A.wAS)},
         {lab:TR("bonusAs"), val:"+" + pc(A.wASMax)},
         {lab:TR("msBonus"), val:"+" + pc(A.wMs)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("shield"), val:n0(A.eShield)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("comboTime"), val:n0(A.rCc)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
