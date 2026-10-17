/* maokai — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Maokai.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"maokai", name:"Maokai", label:"Maokai", splash:0,
    base:{hp:[665,109], mana:[375,43], ad:[64,3.3],
          ar:[35,5.2], mr:[32,2.05],
          as:0.8, asPerLevel:2.125, ms:335},
    abilities_meta:[
      {k:"q", en:"Bramble Smash", fr:"Coup de ronces"},
      {k:"w", en:"Twisted Advance", fr:"Croissance torturée"},
      {k:"e", en:"Sapling Toss", fr:"Jet d'arbrisseau"},
      {k:"r", en:"Nature's Grasp", fr:"Emprise de la nature"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[75,120,165,210,255], qHpPct:[2,2.5,3,3.5,4], qAP:0.5, qCd:[7,6.5,6,5.5,5],
      wFlat:[60,85,110,135,160], wAP:0.4, wCc:[1,1.1,1.2,1.3,1.4], wCd:[14,13,12,11,10],
      eFlat:[50,75,100,125,150], eBonusHp:0.05, eAP:0.25, eTotalBonusHp:0.066667, eTotalAP:0.333333, eCd:[18,17,16,15,14],
      rMs:[40,50,60], rFlat:[150,225,300], rAP:0.75, rCd:[130,110,90]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Bramble Smash */
      A.qHpPct = R(T.qHpPct,qr);   /* % des PV de la cible, applique dans onStep */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      /* W — Twisted Advance */
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      A.wCc = R(T.wCc,wr);
      /* E — Sapling Toss */
      A.eDmg = R(T.eFlat,er) + T.eBonusHp*bonusHP + T.eAP*ap;
      A.eTotal = T.eTotalBonusHp*bonusHP + T.eTotalAP*ap;
      /* R — Nature's Grasp */
      A.rMs = R(T.rMs,rr);
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qHpPct=0; A.qDmg=0; }
      if(!learned.w){ A.wDmg=0; A.wCc=0; }
      if(!learned.e){ A.eDmg=0; A.eTotal=0; }
      if(!learned.r){ A.rMs=0; A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Sap Magic","Sève magique"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Bramble Smash", fr:"Q — Coup de ronces"},
      {id:"w", kind:"spell", en:"W — Twisted Advance", fr:"W — Croissance torturée"},
      {id:"e", kind:"spell", en:"E — Sapling Toss", fr:"E — Jet d'arbrisseau"},
      {id:"r", kind:"spell", en:"R — Nature's Grasp", fr:"R — Emprise de la nature"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"brambleSmash", v:A.qDmg + hp * A.qHpPct/100, type:"magic"});
      if(st.id === "w") out.parts.push({n:"twistedAdvance", v:A.wDmg, type:"magic"});
      if(st.id === "e") out.parts.push({n:"saplingToss", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"natureSGrasp", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("mPpct"), val:pc(A.qHpPct)},
         {lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("comboTime"), val:n0(A.wCc)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("damage"), val:n0(A.eTotal)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("msBonus"), val:"+" + pc(A.rMs)},
         {lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q / Bonus Monster Damage : ligne non modelisee (150 to 190)
   - Q / Total Monster Damage : ligne non modelisee (75+150 to 255+190 (+ 2 to 4% of the target's maximum health) (+ 50% AP))
   - E / Magic Damage per Instance : ligne non modelisee (50*2/3 to 150*2/3 (+ 5*2/3% bonus health) (+ 25*2/3% AP))
   - E / Total Magic Damage : doublon de Total Attached Sapling Damage, ignore
   - E / Minion Damage : ligne non modelisee (50 to 150 (+ 5% bonus health) (+ 25% AP))
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
