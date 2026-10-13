/* skarner — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Skarner.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"skarner", name:"Skarner", label:"Skarner", splash:0,
    base:{hp:[630,110], mana:[320,40], ad:[63,5],
          ar:[33,4.5], mr:[32,2.05],
          as:0.625, asPerLevel:2, ms:335},
    abilities_meta:[
      {k:"q", en:"Shattered Earth / Upheaval", fr:"Terre brisée/Soulèvement"},
      {k:"w", en:"Seismic Bastion", fr:"Bastion sismique"},
      {k:"e", en:"Ixtal's Impact", fr:"Impact d'Ixtal"},
      {k:"r", en:"Impale", fr:"Empalement"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[30,60,90,120,150], qBonusAD:2.7, qBonusHp:0.09, qAS:[20,25,30,35,40], qCd:[8,6.75,5.5,4.25,3],
      wFlat:[50,70,90,110,130], wAP:0.8, wCd:[10,9,8,7,6],
      eFlat:[30,60,90,120,150], eBonusAD:1.2, eMaxHp:0.06, eCd:[22,21,20,19,18],
      rFlat:[150,250,350], rAP:1, rCd:[120,105,90]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Shattered Earth / Upheaval */
      A.qDmg = R(T.qFlat,qr) + T.qBonusAD*bonusAD + T.qBonusHp*bonusHP;
      A.qAS = R(T.qAS,qr);
      /* W — Seismic Bastion */
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      /* E — Ixtal's Impact */
      A.eDmg = R(T.eFlat,er) + T.eBonusAD*bonusAD + T.eMaxHp*tot.hp;
      /* R — Impale */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qAS=0; }
      if(!learned.w){ A.wDmg=0; }
      if(!learned.e){ A.eDmg=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Threads of Vibration","Échos des vibrations"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Shattered Earth / Upheaval", fr:"Q — Terre brisée/Soulèvement"},
      {id:"w", kind:"spell", en:"W — Seismic Bastion", fr:"W — Bastion sismique"},
      {id:"e", kind:"spell", en:"E — Ixtal's Impact", fr:"E — Impact d'Ixtal"},
      {id:"r", kind:"spell", en:"R — Impale", fr:"R — Empalement"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q"){
        out.parts.push({n:"shatteredEarthUpheaval", v:A.qDmg, type:"phys"});
        out.asBonus = A.qAS;
      }
      if(st.id === "w") out.parts.push({n:"seismicBastion", v:A.wDmg, type:"magic"});
      if(st.id === "e") out.parts.push({n:"ixtalSImpact", v:A.eDmg, type:"phys"});
      if(st.id === "r") out.parts.push({n:"impale", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("bonusAs"), val:"+" + pc(A.qAS)},
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
   - Q : 3 formes dans le wiki (Shattered Earth, Crystal Slash, Upheaval) — seule la premiere est modelisee
   - W : 2 formes dans le wiki (Seismic Bastion, Crystalline Exoskeleton) — seule la premiere est modelisee
   - E : 2 formes dans le wiki (Ixtal's Impact, Fracture) — seule la premiere est modelisee
   - Q : pas de ligne de degats simple, « Total Bonus Physical Damage » prise comme ligne principale
   - Q / Bonus Physical Damage per Hit : ligne non modelisee (10 to 50 (+ 90% bonus AD) (+ 3% of his bonus health))
   - Q / Monster Percent Health Damage Cap : ligne non modelisee (150 to 350)
   - passif : 2 blocs dans le wiki (Threads of Vibration, Crystal Spires) — seul le premier est modelise
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
