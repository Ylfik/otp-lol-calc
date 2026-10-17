/* ksante — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/K'Sante.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"ksante", name:"KSante", label:"K'Sante", splash:0,
    base:{hp:[625,120], mana:[320,60], ad:[64,3.5],
          ar:[36,5.2], mr:[30,2.1],
          as:0.688, asPerLevel:2.5, ms:330},
    abilities_meta:[
      {k:"q", en:"Ntofo Strikes", fr:"Coups de ntofo"},
      {k:"w", en:"Path Maker", fr:"Pour Nazumah !"},
      {k:"e", en:"Footwork", fr:"Jeu de jambes"},
      {k:"r", en:"All Out", fr:"Grand jeu"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[70,100,130,160,190], qArmor:0.4, qMr:0.4,
      wFlat:[45,75,105,135,165], wHpPct:8, wMin:[4.5,7.5,10.5,13.5,16.5], wMinHpPct:0.8, wMax:[36,60,84,108,132], wMaxHpPct:6.4, wTotal:[81,135,189,243,297], wTotalHpPct:14.4, wCd:[14,13,12,11,10],
      eShield:[70,112.5,155,197.5,240], eShieldBonusHp:0.135, eCd:[10,9.5,9,8.5,8],
      rFlat:[80,115,150], rStrike:[80,115,150], rStrikeBonusHp:0.05, rTotal:[160,230,300], rTotalBonusHp:0.05, rAS:[40,60,80], rCd:[120,100,80]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Ntofo Strikes */
      A.qDmg = R(T.qFlat,qr) + T.qArmor*tot.ar + T.qMr*tot.mr;
      /* W — Path Maker */
      A.wHpPct = T.wHpPct;   /* % des PV de la cible, applique dans onStep */
      A.wDmg = R(T.wFlat,wr);
      A.wMinHpPct = T.wMinHpPct;   /* % des PV de la cible, applique dans onStep */
      A.wMin = R(T.wMin,wr);
      A.wMaxHpPct = T.wMaxHpPct;   /* % des PV de la cible, applique dans onStep */
      A.wMax = R(T.wMax,wr);
      A.wTotalHpPct = T.wTotalHpPct;   /* % des PV de la cible, applique dans onStep */
      A.wTotal = R(T.wTotal,wr);
      /* E — Footwork */
      A.eShield = R(T.eShield,er) + T.eShieldBonusHp*bonusHP;
      /* R — All Out */
      A.rDmg = R(T.rFlat,rr);
      A.rStrike = R(T.rStrike,rr) + T.rStrikeBonusHp*bonusHP;
      A.rTotal = R(T.rTotal,rr) + T.rTotalBonusHp*bonusHP;
      A.rAS = R(T.rAS,rr);
      A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wHpPct=0; A.wDmg=0; A.wMinHpPct=0; A.wMin=0; A.wMaxHpPct=0; A.wMax=0; A.wTotalHpPct=0; A.wTotal=0; }
      if(!learned.e){ A.eShield=0; }
      if(!learned.r){ A.rDmg=0; A.rStrike=0; A.rTotal=0; A.rAS=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Dauntless Instinct","Instinct intrépide"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Ntofo Strikes", fr:"Q — Coups de ntofo"},
      {id:"w", kind:"spell", en:"W — Path Maker", fr:"W — Pour Nazumah !"},
      {id:"e", kind:"cast", label:"E", en:"E — Footwork", fr:"E — Jeu de jambes"},
      {id:"r", kind:"spell", en:"R — All Out", fr:"R — Grand jeu"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"ntofoStrikes", v:A.qDmg, type:"phys"});
      if(st.id === "w") out.parts.push({n:"pathMaker", v:A.wDmg + hp * A.wHpPct/100 + hp * A.wMinHpPct/100 + hp * A.wMaxHpPct/100 + hp * A.wTotalHpPct/100, type:"phys"});
      if(st.id === "e") out.shield = A.eShield;
      if(st.id === "r"){
        out.parts.push({n:"allOut", v:A.rDmg, type:"phys"});
        out.asBonus = A.rAS;
      }
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)}],
        [{lab:TR("mPpct"), val:pc(A.wHpPct)},
         {lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("mPpct"), val:pc(A.wMinHpPct)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("shield"), val:n0(A.eShield)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("damage"), val:n0(A.rStrike)},
         {lab:TR("damage"), val:n0(A.rTotal)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q / Physical Damage : « 40% bonus armor » est lu comme une part des resistances DU CHAMPION — a verifier, le wiki ne le dit pas toujours
   - Q / Physical Damage : « 40% bonus magic resistance » est lu comme une part des resistances DU CHAMPION — a verifier, le wiki ne le dit pas toujours
   - Q : aucune recharge dans les donnees wiki
   - W / Monster Damage Cap : ligne non modelisee (180 to 500)
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
