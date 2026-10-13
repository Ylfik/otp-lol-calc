/* swain — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Swain.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"swain", name:"Swain", label:"Swain", splash:0,
    base:{hp:[595,99], mana:[400,29], ad:[58,2.7],
          ar:[23,4.7], mr:[34,1.55],
          as:0.625, asPerLevel:2.11, ms:330},
    abilities_meta:[
      {k:"q", en:"Death's Hand", fr:"Poigne mortifère"},
      {k:"w", en:"Vision of Empire", fr:"Œil de l'empire"},
      {k:"e", en:"Nevermove", fr:"Capture"},
      {k:"r", en:"Demonic Ascension", fr:"Incarnation démoniaque"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[60,90,120,150,180], qAP:0.45, qTotal:[120,180,240,300,360], qTotalAP:0.9, qCd:[7,6,5,4,3],
      wFlat:[70,115,160,205,250], wAP:0.6, wCd:[20,19,18,17,16],
      eFlat:[90,130,170,210,250], eAP:0.7, eCd:[12,11.5,11,10.5,10],
      rCd:[120,120,120]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Death's Hand */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      A.qTotal = R(T.qTotal,qr) + T.qTotalAP*ap;
      /* W — Vision of Empire */
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      /* E — Nevermove */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qTotal=0; }
      if(!learned.w){ A.wDmg=0; }
      if(!learned.e){ A.eDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Ravenous Flock","Nuée de corbeaux"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Death's Hand", fr:"Q — Poigne mortifère"},
      {id:"w", kind:"spell", en:"W — Vision of Empire", fr:"W — Œil de l'empire"},
      {id:"e", kind:"spell", en:"E — Nevermove", fr:"E — Capture"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"deathSHand", v:A.qDmg, type:"magic"});
      if(st.id === "w") out.parts.push({n:"visionOfEmpire", v:A.wDmg, type:"magic"});
      if(st.id === "e") out.parts.push({n:"nevermove", v:A.eDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("damage"), val:n0(A.qTotal)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q : 2 formes dans le wiki (Death's Hand, Decrepify) — seule la premiere est modelisee
   - E : 2 formes dans le wiki (Nevermove, Torment) — seule la premiere est modelisee
   - R : 2 formes dans le wiki (Demonic Ascension, Demonflare) — seule la premiere est modelisee
   - Q / Bonus Damage Per Bolt : ligne non modelisee (60*0.25 to 180*0.25 (+ 45*0.25% AP))
   - W / Minion Damage : ligne non modelisee (70/2 to 250/2 (+ 60/2% AP))
   - R / Magic Damage per Tick : ligne non modelisee (15/2 to 35/2 (+ 4/2% AP))
   - R / Heal per Tick : ligne non modelisee (15/2 to 45/2 (+ 5/2% AP) (+ 1.5/2% of his bonus health))
   - R / Reduced Heal per Tick : ligne non modelisee (15*0.5*0.1 to 45*0.5*0.1 (+ 5*0.5*0.1% AP) (+ 1.5*0.5*0.1% of his bonus health))
   - passif : 2 blocs dans le wiki (Ravenous Flock, Carrion Renewal) — seul le premier est modelise
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
