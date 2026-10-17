/* soraka — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Soraka.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"soraka", name:"Soraka", label:"Soraka", splash:0,
    base:{hp:[605,88], mana:[425,40], ad:[50,3],
          ar:[32,5], mr:[30,1.3],
          as:0.625, asPerLevel:2.14, ms:325},
    abilities_meta:[
      {k:"q", en:"Starcall", fr:"Appel de l'étoile"},
      {k:"w", en:"Astral Infusion", fr:"Infusion astrale"},
      {k:"e", en:"Equinox", fr:"Équinoxe"},
      {k:"r", en:"Wish", fr:"Souhait"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[85,120,155,190,225], qAP:0.35, qHealTotal:[60,75,90,105,120], qHealTotalAP:0.3, qMs:[20,22.5,25,27.5,30], qCd:[8,7,6,5,4],
      wHeal:[90,110,130,150,170], wHealAP:0.5, wCd:[6,5,4,3,2],
      eFlat:[70,95,120,145,170], eAP:0.4, eTotal:[140,190,240,290,340], eTotalAP:0.8, eCc:[1,1.25,1.5,1.75,2], eCd:[20,19,18,17,16],
      rHeal:[150,250,350], rHealAP:0.5, rHealMax:[225,375,525], rHealMaxAP:0.75, rCd:[150,135,120]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Starcall */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      A.qHealTotal = R(T.qHealTotal,qr) + T.qHealTotalAP*ap;
      A.qMs = R(T.qMs,qr);
      /* W — Astral Infusion */
      A.wHeal = R(T.wHeal,wr) + T.wHealAP*ap;
      /* E — Equinox */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      A.eTotal = R(T.eTotal,er) + T.eTotalAP*ap;
      A.eCc = R(T.eCc,er);
      /* R — Wish */
      A.rHeal = R(T.rHeal,rr) + T.rHealAP*ap;
      A.rHealMax = R(T.rHealMax,rr) + T.rHealMaxAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qHealTotal=0; A.qMs=0; }
      if(!learned.w){ A.wHeal=0; }
      if(!learned.e){ A.eDmg=0; A.eTotal=0; A.eCc=0; }
      if(!learned.r){ A.rHeal=0; A.rHealMax=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Salvation","Salut"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Starcall", fr:"Q — Appel de l'étoile"},
      {id:"w", kind:"cast", label:"W", en:"W — Astral Infusion", fr:"W — Infusion astrale"},
      {id:"e", kind:"spell", en:"E — Equinox", fr:"E — Équinoxe"},
      {id:"r", kind:"cast", label:"R", en:"R — Wish", fr:"R — Souhait"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q"){
        out.parts.push({n:"starcall", v:A.qDmg, type:"magic"});
        out.heal = A.qHealTotal;
      }
      if(st.id === "w") out.heal = A.wHeal;
      if(st.id === "e") out.parts.push({n:"equinox", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.heal = A.rHeal;
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("healing"), val:n0(A.qHealTotal)},
         {lab:TR("msBonus"), val:"+" + pc(A.qMs)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("healing"), val:n0(A.wHeal)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("damage"), val:n0(A.eTotal)},
         {lab:TR("comboTime"), val:n0(A.eCc)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("healing"), val:n0(A.rHeal)},
         {lab:TR("healing"), val:n0(A.rHealMax)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q / Heal per Tick : ligne non modelisee (60/12 to 120/12 (+ 30/12% AP))
   - W / Health Cost Reduction : ligne non modelisee (80 to 100%)
   - W / Reduced Health Cost : ligne non modelisee (2 to 0% of maximum health)
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
