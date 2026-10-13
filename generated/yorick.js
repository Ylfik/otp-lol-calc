/* yorick — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Yorick.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"yorick", name:"Yorick", label:"Yorick", splash:0,
    base:{hp:[650,114], mana:[300,60], ad:[62,5],
          ar:[36,4.5], mr:[32,2.05],
          as:0.625, asPerLevel:2, ms:340},
    abilities_meta:[
      {k:"q", en:"Last Rites", fr:"Derniers sacrements"},
      {k:"w", en:"Dark Procession", fr:"Sombre cortège"},
      {k:"e", en:"Mourning Mist", fr:"Brume endeuillée"},
      {k:"r", en:"Eulogy of the Isles", fr:"Élégie des Îles"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[30,50,70,90,110], qAD:0.5, qHealMissPct:[6,7,8,9,10], qCd:[6,5.5,5,4.5,4],
      wCd:[20,18,16,14,12],
      eHpPct:[6,6.5,7,7.5,8], eAP100:3, eMs:[18,21,24,27,30], eCd:[12,11,10,9,8],
      rCd:[160,130,100]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Last Rites */
      A.qDmg = R(T.qFlat,qr) + T.qAD*tot.ad;
      A.qHealMissPct = R(T.qHealMissPct,qr);
      /* E — Mourning Mist */
      A.eHpPct = R(T.eHpPct,er) + T.eAP100*ap/100;   /* % des PV de la cible, applique dans onStep */
      A.eMs = R(T.eMs,er);
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qHealMissPct=0; }
      if(!learned.e){ A.eHpPct=0; A.eMs=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Shepherd of Souls","Berger des âmes"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Last Rites", fr:"Q — Derniers sacrements"},
      {id:"e", kind:"spell", en:"E — Mourning Mist", fr:"E — Brume endeuillée"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"lastRites", v:A.qDmg, type:"phys"});
      if(st.id === "e") out.parts.push({n:"mourningMist", v:hp * A.eHpPct/100, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("sQpct"), val:pc(A.qHealMissPct)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("mPpct"), val:pc(A.eHpPct)},
         {lab:TR("msBonus"), val:"+" + pc(A.eMs)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q : 2 formes dans le wiki (Last Rites, Awakening) — seule la premiere est modelisee
   - Q / Heal : « 6 to 10% of his missing health » est une part des PV du champion — le moteur ne suit pas ses PV courants, la valeur reste un pourcentage affiche
   - Q / Non-Champion Heal : ligne non modelisee (8/2+2/2*x for 6; then +3/2*x for 6; then +5/2*x for 8 (+ 6*0.5 to 10*0.5% of his missing health))
   - W / Wall Health : ligne non modelisee (2)
   - E / Minimum Minion Damage : ligne non modelisee (70 to 210 (+ 100% AP))
   - E / Capped Monster Damage : ligne non modelisee (50 to 150 (+ 100% AP))
   - E / Armor Reduction : ligne non modelisee (13 to 25% of target's armor)
   - R / Mist Walkers : ligne non modelisee (2)
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
