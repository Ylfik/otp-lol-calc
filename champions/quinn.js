/* Quinn — généré depuis les données du wiki, passif écrit à la main.

   Harrier : les sorts de Quinn marquent leur cible ; l'attaque suivante
   consomme la marque.

     « basic attacks against Harrier targets are empowered to consume the
       mark to deal 15 + (120-15)/17*(x-1) (+ 40% bonus AD) bonus
       physical damage » — data/champions/Quinn, passif Harrier

   Vérifié par tools/check-passives.js. */
window.CHAMPION = {
    key:"quinn", name:"Quinn", label:"Quinn", splash:0,
    base:{hp:[565,107], mana:[269,35], ad:[59,3.2],
          ar:[28,4.7], mr:[33,1.1],
          as:0.668, asPerLevel:3.1, ms:330},
    abilities_meta:[
      {k:"q", en:"Blinding Assault", fr:"Assaut aveuglant"},
      {k:"w", en:"Heightened Senses", fr:"Œil d'aigle"},
      {k:"e", en:"Vault", fr:"Salto"},
      {k:"r", en:"Behind Enemy Lines", fr:"En territoire ennemi"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[65,100,135,170,205], qBonusAD:[0.8,0.85,0.9,0.95,1], qAP:0.5, qCd:[11,10.5,10,9.5,9],
      wAS:[28,41,54,67,80], wMs:[20,25,30,35,40], wCd:[50,45,40,35,30],
      eFlat:[40,65,90,115,140], eBonusAD:0.2, eCd:[12,11,10,9,8],
      rMsTotal:[70,100,130], rCd:[3,3,3],
      /* passif : linéaire du niveau 1 au 18 */
      pFlat:[15,120], pBonusAD:0.40
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Blinding Assault */
      A.qDmg = R(T.qFlat,qr) + R(T.qBonusAD,qr)*bonusAD + T.qAP*ap;
      /* W — Heightened Senses */
      A.wAS = R(T.wAS,wr);
      A.wMs = R(T.wMs,wr);
      /* E — Vault */
      A.eDmg = R(T.eFlat,er) + T.eBonusAD*bonusAD;
      /* R — Behind Enemy Lines */
      A.rMsTotal = R(T.rMsTotal,rr);
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wAS=0; A.wMs=0; }
      if(!learned.e){ A.eDmg=0; }
      if(!learned.r){ A.rMsTotal=0; }
      /* Harrier — l'attaque qui consomme la marque */
      A.pDmg = lerp(T.pFlat[0], T.pFlat[1], L) + T.pBonusAD*bonusAD;
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Harrier","Busard"],
    l10n:{
      quinnMark:["Harrier, the empowered attack","Harceleur, l'attaque renforcée"]
    },
    passiveRows(c){
      const {A, TR, n0} = c;
      return [{lab:TR("quinnMark"), val:n0(A.pDmg)}];
    },
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"harrier", kind:"attack", en:"Attack on a Harrier mark", fr:"Attaque sur une marque de Harceleur"},
      {id:"q", kind:"spell", en:"Q — Blinding Assault", fr:"Q — Assaut aveuglant"},
      {id:"w", kind:"cast", label:"W", en:"W — Heightened Senses", fr:"W — Œil d'aigle"},
      {id:"e", kind:"spell", en:"E — Vault", fr:"E — Salto"},
      {id:"r", kind:"cast", label:"R", en:"R — Behind Enemy Lines", fr:"R — En territoire ennemi"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "harrier") out.parts.push({n:"harrier", v:A.pDmg, type:"phys"});
      if(st.id === "q") out.parts.push({n:"blindingAssault", v:A.qDmg, type:"phys"});
      if(st.id === "w") out.asBonus = A.wAS;
      if(st.id === "e") out.parts.push({n:"vault", v:A.eDmg, type:"phys"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("bonusAs"), val:"+" + pc(A.wAS)},
         {lab:TR("msBonus"), val:"+" + pc(A.wMs)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("msBonus"), val:"+" + pc(A.rMsTotal)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* Le passif, que le générateur ne sait pas lire, est écrit plus haut. */
