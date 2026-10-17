/* zeri — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Zeri.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"zeri", name:"Zeri", label:"Zeri", splash:0,
    base:{hp:[600,110], mana:[250,45], ad:[56,2],
          ar:[24,4.2], mr:[33,1.1],
          as:0.658, asPerLevel:2, ms:330},
    abilities_meta:[
      {k:"q", en:"Burst Fire", fr:"Rafale"},
      {k:"w", en:"Ultrashock Laser", fr:"Laser électrocuteur"},
      {k:"e", en:"Spark Surge", fr:"Charge ionique"},
      {k:"r", en:"Lightning Crash", fr:"Éruption électrique"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[15,17,19,21,23], qAD:[1.04,1.08,1.12,1.16,1.2],
      wFlat:[30,70,110,150,190], wAD:1.2, wAP:0.5, wSlow:[30,35,40,45,50], wCd:[12,11,10,9,8],
      eFlat:[22,24,26,28,30], eAP:0.2, eBurst:[80,85,90,95,100], eCd:[24,22.5,21,19.5,18],
      rFlat:[150,250,350], rBonusAD:0.6, rAP:1.1, rCd:[80,75,70]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Burst Fire */
      A.qDmg = R(T.qFlat,qr) + R(T.qAD,qr)*tot.ad;
      /* W — Ultrashock Laser */
      A.wDmg = R(T.wFlat,wr) + T.wAD*tot.ad + T.wAP*ap;
      A.wSlow = R(T.wSlow,wr);
      /* E — Spark Surge */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      A.eBurst = R(T.eBurst,er);
      /* R — Lightning Crash */
      A.rDmg = R(T.rFlat,rr) + T.rBonusAD*bonusAD + T.rAP*ap;
      A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wDmg=0; A.wSlow=0; }
      if(!learned.e){ A.eDmg=0; A.eBurst=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Living Battery","Batterie vivante"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Burst Fire", fr:"Q — Rafale"},
      {id:"w", kind:"spell", en:"W — Ultrashock Laser", fr:"W — Laser électrocuteur"},
      {id:"e", kind:"spell", en:"E — Spark Surge", fr:"E — Charge ionique"},
      {id:"r", kind:"spell", en:"R — Lightning Crash", fr:"R — Éruption électrique"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"burstFire", v:A.qDmg, type:"phys"});
      if(st.id === "w") out.parts.push({n:"ultrashockLaser", v:A.wDmg, type:"phys"});
      if(st.id === "e") out.parts.push({n:"sparkSurge", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"lightningCrash", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("slow"), val:pc(A.wSlow)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("damage"), val:n0(A.eBurst)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q : pas de ligne de degats simple, « Total Physical Damage » prise comme ligne principale
   - Q / Total Critical Strike Damage : ligne non modelisee (15*150 to 23*150 (+ 104*150 to 120*150% AD))
   - Q / Total Infinity Edge Damage : ligne non modelisee ({{ap|15*(150+{{#expr:*(150*100/200)/100}}) to 23*(150+{{#expr:*(150*100/200)/100}})}} {{as|(+ {{ap|104*(150+{{#expr:*(150*100/200)/100}}) to 120*(150+{{#expr:*(150*100/200)/100}})}}% AD)}})
   - Q / Physical Damage per Hit : ligne non modelisee (15/7 to 23/7 (+ 104/7 to 120/7% AD))
   - Q / Critical Strike per Hit : ligne non modelisee (15*150/7 to 23*150/7 (+ 104*150/7 to 120*150/7% AD))
   - Q / Infinity Edge Damage per Hit : ligne non modelisee ({{ap|15*(150+{{#expr:*(150*100/200)/100}})/7 to 23*(150+{{#expr:*(150*100/200)/100}})/7|round=2}} {{as|(+ {{ap|104*(150+{{#expr:*(150*100/200)/100}})/7 to 120*(150+{{#expr:*(150*100/200)/100}})/7|round=2}}% AD)}})
   - Q : aucune recharge dans les donnees wiki
   - W / Critical Strike Damage : ligne non modelisee (30*150/100 to 190*150/100 (+ 120*150/100% AD) (+ 50*150/100% AP))
   - W / Infinity Edge Damage : ligne non modelisee ({{ap|30*(150/100+{{#expr:*50/10000}}) to 190*(150/100+{{#expr:*50/10000}})}} {{as|(+ {{ap|120*(150/100+{{#expr:*50/10000}})}}% AD)}} {{as|(+ {{ap|50*(150/100+{{#expr:*50/10000}})}}% AP)}})
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
