/* illaoi — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Illaoi.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"illaoi", name:"Illaoi", label:"Illaoi", splash:0,
    base:{hp:[656,115], mana:[350,50], ad:[65,5],
          ar:[35,5], mr:[32,2.05],
          as:0.625, asPerLevel:2.5, ms:350},
    abilities_meta:[
      {k:"q", en:"Tentacle Smash", fr:"Coup de tentacule"},
      {k:"w", en:"Harsh Lesson", fr:"Âpre leçon"},
      {k:"e", en:"Test of Spirit", fr:"Épreuve de l'esprit"},
      {k:"r", en:"Leap of Faith", fr:"Acte de foi"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qIncPct:[10,15,20,25,30], qCd:[10,9,8,7,6],
      wHpPct:[3,3.5,4,4.5,5], wAD:0.035, wMin:[20,30,40,50,60], wCd:[4,4,4,4,4],
      eFlat:[25,30,35,40,45], eAD:0.08, eCd:[16,15,14,13,12],
      rFlat:[150,250,350], rBonusAD:0.5, rCd:[120,95,70]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* W — Harsh Lesson */
      A.wHpPct = R(T.wHpPct,wr) + T.wAD*tot.ad;   /* % des PV de la cible, applique dans onStep */
      A.wMin = R(T.wMin,wr);
      /* E — Test of Spirit */
      A.eDmg = R(T.eFlat,er) + T.eAD*tot.ad;
      /* R — Leap of Faith */
      A.rDmg = R(T.rFlat,rr) + T.rBonusAD*bonusAD;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.w){ A.wHpPct=0; A.wMin=0; }
      if(!learned.e){ A.eDmg=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Prophet of an Elder God","Prophétesse d'un dieu ancestral"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"w", kind:"spell", en:"W — Harsh Lesson", fr:"W — Âpre leçon"},
      {id:"e", kind:"spell", en:"E — Test of Spirit", fr:"E — Épreuve de l'esprit"},
      {id:"r", kind:"spell", en:"R — Leap of Faith", fr:"R — Acte de foi"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "w") out.parts.push({n:"harshLesson", v:hp * A.wHpPct/100, type:"magic"});
      if(st.id === "e") out.parts.push({n:"testOfSpirit", v:A.eDmg, type:"phys"});
      if(st.id === "r") out.parts.push({n:"leapOfFaith", v:A.rDmg, type:"phys"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("mPpct"), val:pc(A.wHpPct)},
         {lab:TR("damage"), val:n0(A.wMin)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q / Damage Increase : augmentation sans ligne de degats a augmenter
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
