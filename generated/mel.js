/* mel — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Mel.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"mel", name:"Mel", label:"Mel", splash:0,
    base:{hp:[630,99], mana:[480,28], ad:[54,3.3],
          ar:[21,5.2], mr:[30,1.3],
          as:0.625, asPerLevel:2.5, ms:330},
    abilities_meta:[
      {k:"q", en:"Radiant Volley", fr:"Salve radieuse"},
      {k:"w", en:"Rebuttal", fr:"Réfutation"},
      {k:"e", en:"Solar Snare", fr:"Piège solaire"},
      {k:"r", en:"Golden Eclipse", fr:"Éclipse dorée"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[60,85,110,135,160], qAP:0.55, qTotal:[85,127,173,223,277], qTotalAP:[0.8,0.85,0.9,0.95,1], qCd:[10,9,8,7,6],
      wShield:[80,110,140,170,200], wShieldAP:0.7, wFlat:[40,45,50,55,60], wAP100:5, wReplicated:[28,31.5,35,38.5,42], wReplicatedAP100:3.5, wCd:[38,35,32,29,26],
      eFlat:[60,105,150,195,240], eAP:0.7, eCd:[11,10.5,10,9.5,9],
      rMax:[10,20,30], rIncPctPerStack:[1,2,3], rFlat:[125,200,275], rAP:0.3, rAP2:[0.04,0.07,0.1], rCd:[120,100,80]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Radiant Volley */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      A.qTotal = R(T.qTotal,qr) + R(T.qTotalAP,qr)*ap;
      /* W — Rebuttal */
      A.wShield = R(T.wShield,wr) + T.wShieldAP*ap;
      A.wDmg = R(T.wFlat,wr) + T.wAP100*ap/100;
      A.wReplicated = R(T.wReplicated,wr) + T.wReplicatedAP100*ap/100;
      /* E — Solar Snare */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      /* R — Golden Eclipse */
      A.rMax = R(T.rMax,rr);
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap + R(T.rAP2,rr)*ap;
      A.rIncPerStack = A.rDmg * (1 + (R(T.rIncPctPerStack,rr))/100);
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qTotal=0; }
      if(!learned.w){ A.wShield=0; A.wDmg=0; A.wReplicated=0; }
      if(!learned.e){ A.eDmg=0; }
      if(!learned.r){ A.rMax=0; A.rDmg=0; A.rIncPerStack=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Searing Brilliance","Luminescence incandescente"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Radiant Volley", fr:"Q — Salve radieuse"},
      {id:"w", kind:"spell", en:"W — Rebuttal", fr:"W — Réfutation"},
      {id:"e", kind:"spell", en:"E — Solar Snare", fr:"E — Piège solaire"},
      {id:"r", kind:"spell", en:"R — Golden Eclipse", fr:"R — Éclipse dorée"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"radiantVolley", v:A.qDmg, type:"magic"});
      if(st.id === "w"){
        out.parts.push({n:"rebuttal", v:A.wDmg, type:"magic"});
        out.shield = A.wShield;
      }
      if(st.id === "e") out.parts.push({n:"solarSnare", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"goldenEclipse", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("damage"), val:n0(A.qTotal)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("shield"), val:n0(A.wShield)},
         {lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("damage"), val:n0(A.wReplicated)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rMax)},
         {lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("damage"), val:n0(A.rIncPerStack)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q : pas de ligne de degats simple, « Initial Explosion Magic Damage » prise comme ligne principale
   - Q / Magic Damage per Subsequent Explosion : ligne non modelisee (5 to 13 (+ 5% AP))
   - Q / Number of Bolts : ligne non modelisee (6 to 10)
   - E / Field Magic Damage per Tick : ligne non modelisee (2 to 8 (+ 1% AP))
   - E / Field Magic Damage per Second : ligne non modelisee (2*8 to 8*8 (+ 1*8% AP))
   - E / Orb Minion Magic Damage : ligne non modelisee (60*0.5 to 240*0.5 (+ 70*0.5% AP))
   - E / Field Minion Magic Damage per Tick : ligne non modelisee (2*0.5 to 8*0.5 (+ 1*0.5% AP))
   - E / Field Magic Damage per Second : ligne non modelisee (2*0.5*8 to 8*0.5*8 (+ 1*0.5*8% AP))
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
