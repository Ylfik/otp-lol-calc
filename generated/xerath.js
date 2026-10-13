/* xerath — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Xerath.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"xerath", name:"Xerath", label:"Xerath", splash:0,
    base:{hp:[575,106], mana:[400,22], ad:[55,3],
          ar:[22,4.7], mr:[30,1.3],
          as:0.658, asPerLevel:1.36, ms:340},
    abilities_meta:[
      {k:"q", en:"Arcanopulse", fr:"Rayon arcanique"},
      {k:"w", en:"Eye of Destruction", fr:"Œil de la destruction"},
      {k:"e", en:"Shocking Orb", fr:"Orbe d'électrocution"},
      {k:"r", en:"Rite of the Arcane", fr:"Rite arcanique"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[70,110,150,190,230], qAP:0.9, qCd:[9,8,7,6,5],
      wFlat:[50,85,120,155,190], wAP:0.65, wMax:[83.35,141.695,200.04,258.385,316.73], wMaxAP:1.08355, wSlowMax:[60,65,70,75,80], wCd:[14,13,12,11,10],
      eFlat:[70,100,130,160,190], eAP:0.45, eCd:[13,12.5,12,11.5,11],
      rFlat:[170,220,270], rAP:0.45, rTotal:[680,1100,1620], rTotalAP:[1.8,2.25,2.7], rPerStack:[20,25,30], rPerStackAP:0.05, rCd:[130,115,100]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Arcanopulse */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      /* W — Eye of Destruction */
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      A.wMax = R(T.wMax,wr) + T.wMaxAP*ap;
      A.wSlowMax = R(T.wSlowMax,wr);
      /* E — Shocking Orb */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      /* R — Rite of the Arcane */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.rTotal = R(T.rTotal,rr) + R(T.rTotalAP,rr)*ap;
      A.rPerStack = R(T.rPerStack,rr) + T.rPerStackAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wDmg=0; A.wMax=0; A.wSlowMax=0; }
      if(!learned.e){ A.eDmg=0; }
      if(!learned.r){ A.rDmg=0; A.rTotal=0; A.rPerStack=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Mana Surge","Afflux de mana"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Arcanopulse", fr:"Q — Rayon arcanique"},
      {id:"w", kind:"spell", en:"W — Eye of Destruction", fr:"W — Œil de la destruction"},
      {id:"e", kind:"spell", en:"E — Shocking Orb", fr:"E — Orbe d'électrocution"},
      {id:"r", kind:"spell", en:"R — Rite of the Arcane", fr:"R — Rite arcanique"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"arcanopulse", v:A.qDmg, type:"magic"});
      if(st.id === "w") out.parts.push({n:"eyeOfDestruction", v:A.wDmg, type:"magic"});
      if(st.id === "e") out.parts.push({n:"shockingOrb", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"riteOfTheArcane", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("damage"), val:n0(A.wMax)},
         {lab:TR("slow"), val:pc(A.wSlowMax)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("damage"), val:n0(A.rTotal)},
         {lab:TR("damage"), val:n0(A.rPerStack)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q / Mana Refunded : ligne non modelisee (80/2 to 120/2)
   - R / Number of Recasts : ligne non modelisee (4 to 6)
   - R / Maximum Stacks : ligne non modelisee (3 to 5)
   - R / Impact Distance to Reveal : ligne non modelisee (175 to 225)
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
