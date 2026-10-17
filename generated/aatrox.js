/* aatrox — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Aatrox.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"aatrox", name:"Aatrox", label:"Aatrox", splash:0,
    base:{hp:[650,114], mana:[0,0], ad:[60,5],
          ar:[38,4.8], mr:[32,2.05],
          as:0.651, asPerLevel:2.5, ms:345},
    abilities_meta:[
      {k:"q", en:"The Darkin Blade", fr:"Épée des Darkin"},
      {k:"w", en:"Infernal Chains", fr:"Chaînes infernales"},
      {k:"e", en:"Umbral Dash", fr:"Ruée obscure"},
      {k:"r", en:"World Ender", fr:"Fossoyeur des mondes"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[10,25,40,55,70], qAD:[0.6,0.675,0.75,0.825,0.9], qFirst:[17.5,43.75,70,96.25,122.5], qFirstAD:[1.05,1.18125,1.3125,1.44375,1.575], qSecond:[12.5,31.25,50,68.75,87.5], qSecondAD:[0.75,0.84375,0.9375,1.03125,1.125], qThird:[15,37.5,60,82.5,105], qThirdAD:[0.9,1.0125,1.125,1.2375,1.35], qCd:[14,12,10,8,6],
      wFlat:[30,40,50,60,70], wAD:0.4, wSlow:[25,27.5,30,32.5,35], wTotal:[60,80,100,120,140], wTotalAD:0.8, wCd:[18,16.5,15,13.5,12],
      eCd:[9,8,7,6,5],
      rMs:[60,80,100], rFlat:[20,30,40], rHealMax:[50,75,100], rCd:[120,100,80]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — The Darkin Blade */
      A.qDmg = R(T.qFlat,qr) + R(T.qAD,qr)*tot.ad;
      A.qFirst = R(T.qFirst,qr) + R(T.qFirstAD,qr)*tot.ad;
      A.qSecond = R(T.qSecond,qr) + R(T.qSecondAD,qr)*tot.ad;
      A.qThird = R(T.qThird,qr) + R(T.qThirdAD,qr)*tot.ad;
      /* W — Infernal Chains */
      A.wDmg = R(T.wFlat,wr) + T.wAD*tot.ad;
      A.wSlow = R(T.wSlow,wr);
      A.wTotal = R(T.wTotal,wr) + T.wTotalAD*tot.ad;
      /* R — World Ender */
      A.rMs = R(T.rMs,rr);
      A.rDmg = (R(T.rFlat,rr))/100*tot.ad;
      A.rHealMax = R(T.rHealMax,rr);
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qFirst=0; A.qSecond=0; A.qThird=0; }
      if(!learned.w){ A.wDmg=0; A.wSlow=0; A.wTotal=0; }
      if(!learned.r){ A.rMs=0; A.rDmg=0; A.rHealMax=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Deathbringer Stance","Posture du massacreur"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — The Darkin Blade", fr:"Q — Épée des Darkin"},
      {id:"w", kind:"spell", en:"W — Infernal Chains", fr:"W — Chaînes infernales"},
      {id:"r", kind:"spell", en:"R — World Ender", fr:"R — Fossoyeur des mondes"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"theDarkinBlade", v:A.qDmg, type:"phys"});
      if(st.id === "w") out.parts.push({n:"infernalChains", v:A.wDmg, type:"phys"});
      if(st.id === "r"){
        out.parts.push({n:"worldEnder", v:A.rDmg, type:"magic"});
        out.heal = A.rHealMax;
      }
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("damage"), val:n0(A.qFirst)},
         {lab:TR("damage"), val:n0(A.qSecond)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("slow"), val:pc(A.wSlow)},
         {lab:TR("damage"), val:n0(A.wTotal)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("msBonus"), val:"+" + pc(A.rMs)},
         {lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("healing"), val:n0(A.rHealMax)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q : 2 formes dans le wiki (The Darkin Blade, Dark Flight) — seule la premiere est modelisee
   - W : 2 formes dans le wiki (Infernal Chains, Blood Thirst / Blood Price) — seule la premiere est modelisee
   - E : 2 formes dans le wiki (Umbral Dash, Blades of Torment) — seule la premiere est modelisee
   - R : 2 formes dans le wiki (World Ender, Massacre) — seule la premiere est modelisee
   - Q / Second Sweetspot Damage : doublon de First Cast Damage, ignore
   - Q / Third Sweetspot Damage : doublon de First Cast Damage, ignore
   - W / Minion Damage : ligne non modelisee (30*2 to 70*2 (+ 80% AD))
   - passif : 2 blocs dans le wiki (Deathbringer Stance, Blood Well) — seul le premier est modelise
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   - ressource particuliere (Blood Well) : non modelisee
   ------------------------------------------------------------------ */
