/* Lulu — généré depuis les données du wiki, passif écrit à la main.

   Pix tire trois projectiles à chaque attaque de Lulu. Un seul ennemi
   peut les prendre tous les trois.

     « Each bolt deals 5 to 39 (par niveau) (+ 5% AP) magic damage ...
       for a total of 5*3 to 39*3 (+ 15% AP) on hitting a single target
       with all three bolts » — data/champions/Lulu, passif Pix

   Vérifié par tools/check-passives.js. */
window.CHAMPION = {
    key:"lulu", name:"Lulu", label:"Lulu", splash:0,
    base:{hp:[565,92], mana:[350,55], ad:[47,2.6],
          ar:[26,4.6], mr:[30,1.3],
          as:0.625, asPerLevel:2.25, ms:330},
    abilities_meta:[
      {k:"q", en:"Glitterlance", fr:"Duo éclatant"},
      {k:"w", en:"Whimsy", fr:"Fantaisie"},
      {k:"e", en:"Help, Pix!", fr:"Pix à la rescousse !"},
      {k:"r", en:"Wild Growth", fr:"Croissance prodigieuse"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[60,95,130,165,200], qAP:0.5, qTotal:[90,142.5,195,247.5,300], qTotalAP:0.75, qCd:[7,7,7,7,7],
      wCc:[1.2,1.4,1.6,1.8,2], wAS:[20,22.5,25,27.5,30], wCcEffect:[3,3.25,3.5,3.75,4], wCd:[18,18,18,18,18],
      eFlat:[70,110,150,190,230], eAP:0.5, eShield:[70,110,150,190,230], eShieldAP:0.5, eCd:[10,9.5,9,8.5,8],
      rSlow:[30,45,60], rCd:[120,100,80],
      /* passif : par projectile, linéaire du niveau 1 au 18 */
      pFlat:[5,39], pAP:0.05, pBolts:3
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Glitterlance */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      A.qTotal = R(T.qTotal,qr) + T.qTotalAP*ap;
      /* W — Whimsy */
      A.wCc = R(T.wCc,wr);
      A.wAS = R(T.wAS,wr);
      A.wCcEffect = R(T.wCcEffect,wr);
      /* E — Help, Pix! */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      A.eShield = R(T.eShield,er) + T.eShieldAP*ap;
      /* R — Wild Growth */
      A.rSlow = R(T.rSlow,rr);
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qTotal=0; }
      if(!learned.w){ A.wCc=0; A.wAS=0; A.wCcEffect=0; }
      if(!learned.e){ A.eDmg=0; A.eShield=0; }
      if(!learned.r){ A.rSlow=0; }
      /* Pix — un projectile, puis les trois */
      A.pBolt = lerp(T.pFlat[0], T.pFlat[1], L) + T.pAP*ap;
      A.pAll = A.pBolt * T.pBolts;
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Pix, Faerie Companion","Pix, le Compagnon féérique"],
    l10n:{
      luluBolt:["Pix, one bolt","Pix, un projectile"],
      luluAll:["Pix, all three on one target","Pix, les trois sur une même cible"]
    },
    passiveRows(c){
      const {A, TR, n0} = c;
      return [{lab:TR("luluBolt"), val:n0(A.pBolt)},
              {lab:TR("luluAll"), val:n0(A.pAll)}];
    },
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"pix", kind:"spell", en:"Pix — three bolts", fr:"Pix — trois projectiles"},
      {id:"q", kind:"spell", en:"Q — Glitterlance", fr:"Q — Duo éclatant"},
      {id:"w", kind:"cast", label:"W", en:"W — Whimsy", fr:"W — Fantaisie"},
      {id:"e", kind:"spell", en:"E — Help, Pix!", fr:"E — Pix à la rescousse !"},
      {id:"r", kind:"cast", label:"R", en:"R — Wild Growth", fr:"R — Croissance prodigieuse"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "pix") out.parts.push({n:"pix", v:A.pAll, type:"magic"});
      if(st.id === "q") out.parts.push({n:"glitterlance", v:A.qDmg, type:"magic"});
      if(st.id === "w") out.asBonus = A.wAS;
      if(st.id === "e"){
        out.parts.push({n:"helpPix", v:A.eDmg, type:"magic"});
        out.shield = A.eShield;
      }
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("damage"), val:n0(A.qTotal)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("comboTime"), val:n0(A.wCc)},
         {lab:TR("bonusAs"), val:"+" + pc(A.wAS)},
         {lab:TR("comboTime"), val:n0(A.wCcEffect)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("shield"), val:n0(A.eShield)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("slow"), val:pc(A.rSlow)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* Le passif, que le générateur ne sait pas lire, est écrit plus haut. */
