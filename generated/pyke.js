/* pyke — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Pyke.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"pyke", name:"Pyke", label:"Pyke", splash:0,
    base:{hp:[670,110], mana:[415,50], ad:[62,2],
          ar:[37,4.7], mr:[32,2.05],
          as:0.667, asPerLevel:2.5, ms:330},
    abilities_meta:[
      {k:"q", en:"Bone Skewer", fr:"Harponnage"},
      {k:"w", en:"Ghostwater Dive", fr:"Plongée spectrale"},
      {k:"e", en:"Phantom Undertow", fr:"Ressac fantôme"},
      {k:"r", en:"Death From Below", fr:"Exécution abyssale"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[100,150,200,250,300], qBonusAD:0.75, qCd:[10,9.5,9,8.5,8],
      wCd:[14,13,12,11,10],
      eFlat:[100,150,200,250,300], eBonusAD:1, eCd:[15,14,13,12,11],
      rCd:[100,85,70]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Bone Skewer */
      A.qDmg = R(T.qFlat,qr) + T.qBonusAD*bonusAD;
      /* E — Phantom Undertow */
      A.eDmg = R(T.eFlat,er) + T.eBonusAD*bonusAD;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.e){ A.eDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Gift of the Drowned Ones","Don des noyés"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Bone Skewer", fr:"Q — Harponnage"},
      {id:"e", kind:"spell", en:"E — Phantom Undertow", fr:"E — Ressac fantôme"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"boneSkewer", v:A.qDmg, type:"phys"});
      if(st.id === "e") out.parts.push({n:"phantomUndertow", v:A.eDmg, type:"phys"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
