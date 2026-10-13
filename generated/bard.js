/* bard — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Bard.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"bard", name:"Bard", label:"Bard", splash:0,
    base:{hp:[630,103], mana:[350,50], ad:[52,3],
          ar:[32,4.7], mr:[30,1.3],
          as:0.658, asPerLevel:2, ms:335},
    abilities_meta:[
      {k:"q", en:"Cosmic Binding", fr:"Lien cosmique"},
      {k:"w", en:"Caretaker's Shrine", fr:"Don du gardien"},
      {k:"e", en:"Magical Journey", fr:"Route magique"},
      {k:"r", en:"Tempered Fate", fr:"Destin tempéré"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[80,120,160,200,240], qAP:0.8, qCc:[1,1.2,1.4,1.6,1.8], qCd:[11,10,9,8,7],
      wHealMin:[25,50,75,100,125], wHealMinAP:0.4, wHealMax:[50,87.5,125,162.5,200], wHealMaxAP:0.7, wMs:[20,22.5,25,27.5,30], wMsAP100:6,
      eCd:[22,20.5,19,17.5,16],
      rCd:[110,95,80]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Cosmic Binding */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      A.qCc = R(T.qCc,qr);
      /* W — Caretaker's Shrine */
      A.wHealMin = R(T.wHealMin,wr) + T.wHealMinAP*ap;
      A.wHealMax = R(T.wHealMax,wr) + T.wHealMaxAP*ap;
      A.wMs = R(T.wMs,wr) + T.wMsAP100*ap/100;
      A.qCd = R(T.qCd,qr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qCc=0; }
      if(!learned.w){ A.wHealMin=0; A.wHealMax=0; A.wMs=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Traveler's Call","Instinct du voyageur"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Cosmic Binding", fr:"Q — Lien cosmique"},
      {id:"w", kind:"cast", label:"W", en:"W — Caretaker's Shrine", fr:"W — Don du gardien"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"cosmicBinding", v:A.qDmg, type:"magic"});
      if(st.id === "w") out.heal = A.wHealMin;
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("comboTime"), val:n0(A.qCc)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("healing"), val:n0(A.wHealMin)},
         {lab:TR("healing"), val:n0(A.wHealMax)},
         {lab:TR("msBonus"), val:"+" + pc(A.wMs)}],
        [{lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - W : aucune recharge dans les donnees wiki
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
