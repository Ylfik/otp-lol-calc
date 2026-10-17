/* ivern — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Ivern.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"ivern", name:"Ivern", label:"Ivern", splash:0,
    base:{hp:[630,99], mana:[450,60], ad:[50,3],
          ar:[27,4.7], mr:[30,1.3],
          as:0.644, asPerLevel:3.4, ms:330},
    abilities_meta:[
      {k:"q", en:"Rootcaller", fr:"Enracinement"},
      {k:"w", en:"Brushmaker", fr:"Main verte"},
      {k:"e", en:"Triggerseed", fr:"Graine à retardement"},
      {k:"r", en:"Daisy!", fr:"Marguerite !"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[80,125,170,215,260], qAP:0.7, qCc:[1.6,1.7,1.8,1.9,2], qCd:[14,13,12,11,10],
      wFlat:[20,27.5,35,42.5,50], wAP:0.2, wAlly:[10,15,20,25,30], wAllyAP:0.1,
      eShield:[75,115,155,195,235], eShieldAP:0.5, eFlat:[70,90,110,130,150], eAP:0.8, eSlow:[40,45,50,55,60], eCd:[11,10,9,8,7],
      rCd:[140,130,120]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Rootcaller */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      A.qCc = R(T.qCc,qr);
      /* W — Brushmaker */
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      A.wAlly = R(T.wAlly,wr) + T.wAllyAP*ap;
      /* E — Triggerseed */
      A.eShield = R(T.eShield,er) + T.eShieldAP*ap;
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      A.eSlow = R(T.eSlow,er);
      A.qCd = R(T.qCd,qr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qCc=0; }
      if(!learned.w){ A.wDmg=0; A.wAlly=0; }
      if(!learned.e){ A.eShield=0; A.eDmg=0; A.eSlow=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Friend of the Forest","Ami de la forêt"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Rootcaller", fr:"Q — Enracinement"},
      {id:"w", kind:"spell", en:"W — Brushmaker", fr:"W — Main verte"},
      {id:"e", kind:"spell", en:"E — Triggerseed", fr:"E — Graine à retardement"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"rootcaller", v:A.qDmg, type:"magic"});
      if(st.id === "w") out.parts.push({n:"brushmaker", v:A.wDmg, type:"magic"});
      if(st.id === "e"){
        out.parts.push({n:"triggerseed", v:A.eDmg, type:"magic"});
        out.shield = A.eShield;
      }
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("comboTime"), val:n0(A.qCc)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("damage"), val:n0(A.wAlly)}],
        [{lab:TR("shield"), val:n0(A.eShield)},
         {lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("slow"), val:pc(A.eSlow)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - W : aucune recharge dans les donnees wiki
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   - R : « Daisy! » invoque une unite — ses propres degats ne sont pas dans les donnees de la competence
   ------------------------------------------------------------------ */
