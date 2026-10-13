/* sylas — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Sylas.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"sylas", name:"Sylas", label:"Sylas", splash:0,
    base:{hp:[600,122], mana:[400,70], ad:[61,3],
          ar:[29,5.2], mr:[32,2.55],
          as:0.645, asPerLevel:3.5, ms:340},
    abilities_meta:[
      {k:"q", en:"Chain Lash", fr:"Croix du forçat"},
      {k:"w", en:"Kingslayer", fr:"Régicide"},
      {k:"e", en:"Abscond / Abduct", fr:"Évasion / Enlèvement"},
      {k:"r", en:"Hijack", fr:"Détournement"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[40,60,80,100,120], qAP:0.4, qSlow:[15,20,25,30,35], qTotal:[100,175,250,325,400], qTotalAP:1.2, qCd:[10,9,8,7,6],
      wFlat:[75,110,145,180,215], wAP:0.6, wHealMin:[20,40,60,80,100], wHealMinAP:0.3, wHealMinBonusHp:0.05, wHealMax:[40,80,120,160,200], wHealMaxAP:0.6, wHealMaxBonusHp:0.1, wCd:[12,10.5,9,7.5,6],
      eCd:[13,12,11,10,9],
      rCd:[80,55,30]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Chain Lash */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      A.qSlow = R(T.qSlow,qr);
      A.qTotal = R(T.qTotal,qr) + T.qTotalAP*ap;
      /* W — Kingslayer */
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      A.wHealMin = R(T.wHealMin,wr) + T.wHealMinAP*ap + T.wHealMinBonusHp*bonusHP;
      A.wHealMax = R(T.wHealMax,wr) + T.wHealMaxAP*ap + T.wHealMaxBonusHp*bonusHP;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qSlow=0; A.qTotal=0; }
      if(!learned.w){ A.wDmg=0; A.wHealMin=0; A.wHealMax=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Petricite Burst","Volée de pétricite"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Chain Lash", fr:"Q — Croix du forçat"},
      {id:"w", kind:"spell", en:"W — Kingslayer", fr:"W — Régicide"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"chainLash", v:A.qDmg, type:"magic"});
      if(st.id === "w"){
        out.parts.push({n:"kingslayer", v:A.wDmg, type:"magic"});
        out.heal = A.wHealMin;
      }
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("slow"), val:pc(A.qSlow)},
         {lab:TR("damage"), val:n0(A.qTotal)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("healing"), val:n0(A.wHealMin)},
         {lab:TR("healing"), val:n0(A.wHealMax)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - E : 2 formes dans le wiki (Abscond, Abduct) — seule la premiere est modelisee
   - Q / Magic Damage : doublon de Magic Damage, ignore
   - Q / Minion Damage : ligne non modelisee (60*0.4 to 280*0.4 (+ 80*0.4% AP))
   - Q / Total Minion Damage : ligne non modelisee (40+(60*0.4) to 120+(280*0.4) (+ 40+(80*0.4)% AP))
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
