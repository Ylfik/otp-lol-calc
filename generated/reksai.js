/* reksai — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Rek'Sai.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"reksai", name:"RekSai", label:"Rek'Sai", splash:0,
    base:{hp:[600,99], mana:[100,0], ad:[62,3],
          ar:[35,4.5], mr:[32,2.05],
          as:0.667, asPerLevel:2, ms:340},
    abilities_meta:[
      {k:"q", en:"Queen's Wrath / Prey Seeker", fr:"Courroux de la reine/Sondeur explosif"},
      {k:"w", en:"Burrow / Un-burrow", fr:"Enfouissement/Jaillissement"},
      {k:"e", en:"Furious Bite / Tunnel", fr:"Morsure féroce/Tunnel"},
      {k:"r", en:"Void Rush", fr:"Rush du Néant"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[30,35,40,45,50], qTotal:[90,105,120,135,150], qCd:[4,3.5,3,2.5,2],
      wMs:[5,10,15,20,25], wCd:[4,4,4,4,4],
      eFlat:[70,95,120,145,170], eBonusAD:0.6, eCd:[6,6,6,6,6],
      rFlat:[150,250,350], rBonusAD:1, rHpPct:[15,20,25], rCd:[120,100,80]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Queen's Wrath / Prey Seeker */
      A.qDmg = (R(T.qFlat,qr))/100*tot.ad;
      A.qTotal = (R(T.qTotal,qr))/100*tot.ad;
      /* W — Burrow / Un-burrow */
      A.wMs = R(T.wMs,wr);
      /* E — Furious Bite / Tunnel */
      A.eDmg = R(T.eFlat,er) + T.eBonusAD*bonusAD;
      /* R — Void Rush */
      A.rHpPct = R(T.rHpPct,rr);   /* % des PV de la cible, applique dans onStep */
      A.rDmg = R(T.rFlat,rr) + T.rBonusAD*bonusAD;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qTotal=0; }
      if(!learned.w){ A.wMs=0; }
      if(!learned.e){ A.eDmg=0; }
      if(!learned.r){ A.rHpPct=0; A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Fury of the Xer'Sai","Fureur des Xer'Sai"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Queen's Wrath / Prey Seeker", fr:"Q — Courroux de la reine/Sondeur explosif"},
      {id:"w", kind:"cast", label:"W", en:"W — Burrow / Un-burrow", fr:"W — Enfouissement/Jaillissement"},
      {id:"e", kind:"spell", en:"E — Furious Bite / Tunnel", fr:"E — Morsure féroce/Tunnel"},
      {id:"r", kind:"spell", en:"R — Void Rush", fr:"R — Rush du Néant"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"queenSWrathPreySeeker", v:A.qDmg, type:"phys"});
      if(st.id === "e") out.parts.push({n:"furiousBiteTunnel", v:A.eDmg, type:"phys"});
      if(st.id === "r") out.parts.push({n:"voidRush", v:A.rDmg + hp * A.rHpPct/100, type:"phys"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("damage"), val:n0(A.qTotal)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("msBonus"), val:"+" + pc(A.wMs)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("mPpct"), val:pc(A.rHpPct)},
         {lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q : 2 formes dans le wiki (Queen's Wrath, Prey Seeker) — seule la premiere est modelisee
   - W : 2 formes dans le wiki (Burrow, Unburrow) — seule la premiere est modelisee
   - E : 2 formes dans le wiki (Furious Bite, Tunnel) — seule la premiere est modelisee
   - E / True Damage : doublon de Physical Damage, ignore
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   - ressource particuliere (Fury) : non modelisee
   ------------------------------------------------------------------ */
