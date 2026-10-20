/* Braum — généré depuis les données du wiki, passif écrit à la main.

   Concussive Blows : quatre charges sur une même cible, et la quatrième
   les consomme toutes.

     « The fourth stack against a target consumes them all to deal
       26 to 196 (par niveau) magic damage and stun them »
       — data/champions/Braum, passif Concussive Blows

   Vérifié par tools/check-passives.js. */
window.CHAMPION = {
    key:"braum", name:"Braum", label:"Braum", splash:0,
    base:{hp:[610,112], mana:[311,45], ad:[55,3.2],
          ar:[35,5], mr:[32,2.05],
          as:0.644, asPerLevel:3.5, ms:335},
    abilities_meta:[
      {k:"q", en:"Winter's Bite", fr:"Morsure de l'hiver"},
      {k:"w", en:"Stand Behind Me", fr:"Bouclier humain"},
      {k:"e", en:"Unbreakable", fr:"Incassable"},
      {k:"r", en:"Glacial Fissure", fr:"Fissure glaciale"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[75,120,165,210,255], qMaxHp:0.025, qCd:[8,7.5,7,6.5,6],
      wCd:[12,11,10,9,8],
      eCd:[16,14,12,10,8],
      rFlat:[150,250,350], rAP:0.6, rSlow:[40,50,60], rCd:[130,115,100],
      /* passif : linéaire du niveau 1 au 18 */
      pFlat:[26,196]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Winter's Bite */
      A.qDmg = R(T.qFlat,qr) + T.qMaxHp*tot.hp;
      /* R — Glacial Fissure */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.rSlow = R(T.rSlow,rr);
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.r){ A.rDmg=0; A.rSlow=0; }
      /* Concussive Blows — la quatrième charge */
      A.pDmg = lerp(T.pFlat[0], T.pFlat[1], L);
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Concussive Blows","Coups étourdissants"],
    l10n:{
      braumStun:["Concussive Blows, the fourth stack","Coups commotionnants, la quatrième charge"]
    },
    passiveRows(c){
      const {A, TR, n0} = c;
      return [{lab:TR("braumStun"), val:n0(A.pDmg)}];
    },
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"stun4", kind:"spell", en:"Concussive Blows — fourth stack", fr:"Coups commotionnants — quatrième charge"},
      {id:"q", kind:"spell", en:"Q — Winter's Bite", fr:"Q — Morsure de l'hiver"},
      {id:"r", kind:"spell", en:"R — Glacial Fissure", fr:"R — Fissure glaciale"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "stun4") out.parts.push({n:"concussiveBlows", v:A.pDmg, type:"magic"});
      if(st.id === "q") out.parts.push({n:"winterSBite", v:A.qDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"glacialFissure", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("slow"), val:pc(A.rSlow)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* Le passif, que le générateur ne sait pas lire, est écrit plus haut. */
