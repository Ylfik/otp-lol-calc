/* twistedfate — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Twisted Fate.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"twistedfate", name:"TwistedFate", label:"Twisted Fate", splash:0,
    base:{hp:[604,108], mana:[333,39], ad:[52,2.5],
          ar:[24,4.35], mr:[30,1.3],
          as:0.625, asPerLevel:2.5, ms:330},
    abilities_meta:[
      {k:"q", en:"Wild Cards", fr:"Atouts"},
      {k:"w", en:"Pick a Card", fr:"Bonne pioche"},
      {k:"e", en:"Stacked Deck", fr:"Paquet"},
      {k:"r", en:"Destiny", fr:"Destinée"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[60,105,150,195,240], qBonusAD:0.5, qAP:0.85, qCd:[6,5.75,5.5,5.25,5],
      wFlat:[40,60,80,100,120], wAD:1, wAP:1, wSlow:[30,35,40,45,50], wCc:[1,1.25,1.5,1.75,2], wCd:[6,6,6,6,6],
      eAS:[15,25,35,45,55], eFlat:[65,90,115,140,165], eBonusAD:0.2, eAP:0.4,
      rCc:[6,8,10], rCd:[170,140,110]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Wild Cards */
      A.qDmg = R(T.qFlat,qr) + T.qBonusAD*bonusAD + T.qAP*ap;
      /* W — Pick a Card */
      A.wDmg = R(T.wFlat,wr) + T.wAD*tot.ad + T.wAP*ap;
      A.wSlow = R(T.wSlow,wr);
      A.wCc = R(T.wCc,wr);
      /* E — Stacked Deck */
      A.eAS = R(T.eAS,er);
      A.eDmg = R(T.eFlat,er) + T.eBonusAD*bonusAD + T.eAP*ap;
      /* R — Destiny */
      A.rCc = R(T.rCc,rr);
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wDmg=0; A.wSlow=0; A.wCc=0; }
      if(!learned.e){ A.eAS=0; A.eDmg=0; }
      if(!learned.r){ A.rCc=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Loaded Dice","Dé pipé"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Wild Cards", fr:"Q — Atouts"},
      {id:"w", kind:"spell", en:"W — Pick a Card", fr:"W — Bonne pioche"},
      {id:"e", kind:"spell", en:"E — Stacked Deck", fr:"E — Paquet"},
      {id:"r", kind:"cast", label:"R", en:"R — Destiny", fr:"R — Destinée"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"wildCards", v:A.qDmg, type:"magic"});
      if(st.id === "w") out.parts.push({n:"pickACard", v:A.wDmg, type:"magic"});
      if(st.id === "e"){
        out.parts.push({n:"stackedDeck", v:A.eDmg, type:"magic"});
        out.asBonus = A.eAS;
      }
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("slow"), val:pc(A.wSlow)},
         {lab:TR("comboTime"), val:n0(A.wCc)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("bonusAs"), val:"+" + pc(A.eAS)},
         {lab:TR("damage"), val:n0(A.eDmg)}],
        [{lab:TR("comboTime"), val:n0(A.rCc)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - W / Mana Restored : ligne non modelisee (70 to 150)
   - W / Magic Damage : doublon de Magic Damage, ignore
   - W / Magic Damage : doublon de Magic Damage, ignore
   - E : aucune recharge dans les donnees wiki
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
