/* zaahen — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Zaahen.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"zaahen", name:"Zaahen", label:"Zaahen", splash:0,
    base:{hp:[640,114], mana:[350,55], ad:[63,4],
          ar:[36,5], mr:[32,2.05],
          as:0.625, asPerLevel:2.5, ms:345},
    abilities_meta:[
      {k:"q", en:"The Darkin Glaive", fr:"Glaive des Darkin"},
      {k:"w", en:"Dreaded Return", fr:"Retour redoutable"},
      {k:"e", en:"Aureate Rush", fr:"Incursion dorée"},
      {k:"r", en:"Grim Deliverance", fr:"Libération inexorable"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qTotal:[15,30,45,60,75], qTotalAD:1, qTotalBonusAD:[0.2,0.25,0.3,0.35,0.4], qHeal:[5,6,7,8,9], qFlat:[30,60,90,120,150], qBonusAD:[0.2,0.25,0.3,0.35,0.4], qCd:[10,9,8,7,6],
      wMin:[40,60,80,100,120], wMinBonusAD:0.5, wFlat:[30,50,70,90,110], wBonusAD:0.3, wTotal:[70,110,150,190,230], wTotalBonusAD:0.8, wCd:[14,13.5,13,12.5,12],
      eFlat:[40,60,80,100,120], eBonusAD:0.5, eMax:[60,90,120,150,180], eMaxBonusAD:0.75, eHpPct:[4,4.5,5,5.5,6], eCd:[10,9.5,9,8.5,8],
      rFlat:[250,400,550], rBonusAD:2, rCd:[110,95,80]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — The Darkin Glaive */
      A.qTotal = R(T.qTotal,qr) + T.qTotalAD*tot.ad + R(T.qTotalBonusAD,qr)*bonusAD;
      A.qHeal = (R(T.qHeal,qr))/100*tot.hp;
      A.qDmg = R(T.qFlat,qr) + R(T.qBonusAD,qr)*bonusAD;
      /* W — Dreaded Return */
      A.wMin = R(T.wMin,wr) + T.wMinBonusAD*bonusAD;
      A.wDmg = R(T.wFlat,wr) + T.wBonusAD*bonusAD;
      A.wTotal = R(T.wTotal,wr) + T.wTotalBonusAD*bonusAD;
      /* E — Aureate Rush */
      A.eDmg = R(T.eFlat,er) + T.eBonusAD*bonusAD;
      A.eMax = R(T.eMax,er) + T.eMaxBonusAD*bonusAD;
      A.eHpPct = R(T.eHpPct,er);   /* % des PV de la cible, applique dans onStep */
      /* R — Grim Deliverance */
      A.rDmg = R(T.rFlat,rr) + T.rBonusAD*bonusAD;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qTotal=0; A.qHeal=0; A.qDmg=0; }
      if(!learned.w){ A.wMin=0; A.wDmg=0; A.wTotal=0; }
      if(!learned.e){ A.eDmg=0; A.eMax=0; A.eHpPct=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Cultivation of War","Guerrier immortel"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — The Darkin Glaive", fr:"Q — Glaive des Darkin"},
      {id:"w", kind:"spell", en:"W — Dreaded Return", fr:"W — Retour redoutable"},
      {id:"e", kind:"spell", en:"E — Aureate Rush", fr:"E — Incursion dorée"},
      {id:"r", kind:"spell", en:"R — Grim Deliverance", fr:"R — Libération inexorable"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q"){
        out.parts.push({n:"theDarkinGlaive", v:A.qDmg, type:"phys"});
        out.heal = A.qHeal;
      }
      if(st.id === "w") out.parts.push({n:"dreadedReturn", v:A.wDmg, type:"phys"});
      if(st.id === "e") out.parts.push({n:"aureateRush", v:A.eDmg + hp * A.eHpPct/100, type:"phys"});
      if(st.id === "r") out.parts.push({n:"grimDeliverance", v:A.rDmg, type:"phys"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qTotal)},
         {lab:TR("healing"), val:n0(A.qHeal)},
         {lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wMin)},
         {lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("damage"), val:n0(A.wTotal)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("damage"), val:n0(A.eMax)},
         {lab:TR("mPpct"), val:pc(A.eHpPct)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q / Physical Damage per Hit : ligne non modelisee (15/2 to 75/2 (+ 100/2% AD) (+ 20/2 to 40/2% bonus AD))
   - Q / Non-Champion Healing : ligne non modelisee (5*0.5 to 9*0.5% of his maximum health)
   - R / Armor Penetration : ligne non modelisee (10 to 30%)
   - R / Healing per Champion hit : ligne non modelisee (250*0.33 to 550*0.33 (+ 200*0.33% bonus AD))
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
