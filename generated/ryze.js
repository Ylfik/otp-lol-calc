/* ryze — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Ryze.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"ryze", name:"Ryze", label:"Ryze", splash:0,
    base:{hp:[620,124], mana:[300,70], ad:[55,3],
          ar:[22,4.7], mr:[32,1.3],
          as:0.658, asPerLevel:2.11, ms:340},
    abilities_meta:[
      {k:"q", en:"Overload", fr:"Court-circuit"},
      {k:"w", en:"Rune Prison", fr:"Prison runique"},
      {k:"e", en:"Spell Flux", fr:"Flux envoûtant"},
      {k:"r", en:"Realm Warp", fr:"Portail transdimensionnel"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[75,95,115,135,155], qAP:0.55, qMs:[28,32,36,40,44], qCd:[5,5,5,5,5],
      wFlat:[60,90,120,150,180], wAP:0.6, wCd:[11,10.5,10,9.5,9],
      eFlat:[60,90,120,150,180], eAP:0.5, eCd:[3.5,3.25,3,2.75,2.5],
      rFlat:[40,65,90], rCd:[180,160,140]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Overload */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      A.qMs = R(T.qMs,qr);
      /* W — Rune Prison */
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      /* E — Spell Flux */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      /* R — Realm Warp */
      A.rDmg = R(T.rFlat,rr);
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qMs=0; }
      if(!learned.w){ A.wDmg=0; }
      if(!learned.e){ A.eDmg=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Arcane Mastery","Maîtrise des arcanes"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Overload", fr:"Q — Court-circuit"},
      {id:"w", kind:"spell", en:"W — Rune Prison", fr:"W — Prison runique"},
      {id:"e", kind:"spell", en:"E — Spell Flux", fr:"E — Flux envoûtant"},
      {id:"r", kind:"spell", en:"R — Realm Warp", fr:"R — Portail transdimensionnel"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"overload", v:A.qDmg, type:"magic"});
      if(st.id === "w") out.parts.push({n:"runePrison", v:A.wDmg, type:"magic"});
      if(st.id === "e") out.parts.push({n:"spellFlux", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"realmWarp", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("msBonus"), val:"+" + pc(A.qMs)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
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
   - Q / Magic Damage : ratio sans statistique « 2% bonus mana » non modelise
   - W / Magic Damage : ratio sans statistique « 3% bonus mana » non modelise
   - E / Magic Damage : ratio sans statistique « 2% bonus mana » non modelise
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
