/* mordekaiser — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Mordekaiser.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"mordekaiser", name:"Mordekaiser", label:"Mordekaiser", splash:0,
    base:{hp:[645,104], mana:[0,0], ad:[61,4],
          ar:[37,4.2], mr:[32,2.05],
          as:0.625, asPerLevel:1, ms:335},
    abilities_meta:[
      {k:"q", en:"Obliterate", fr:"Oblitération"},
      {k:"w", en:"Indestructible", fr:"Indestructible"},
      {k:"e", en:"Death's Grasp", fr:"Emprise funeste"},
      {k:"r", en:"Realm of Death", fr:"Royaume des morts"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qAdd:[80,115,150,185,220], qBonusAD:1.2, qAP:0.7, qIncPct:[30,35,40,45,50], qCd:[8,7,6,5,4],
      wShield:[35,37.5,40,42.5,45], wCd:[12,11,10,9,8],
      ePen:[5,7.5,10,12.5,15], eFlat:[60,80,100,120,140], eAP:0.45, eCd:[16,14,12,10,8],
      rCd:[140,120,100]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Obliterate */
      A.qDmg = lerp(0,85,L) + R(T.qAdd,qr) + T.qBonusAD*bonusAD + T.qAP*ap;
      A.qInc = A.qDmg * (1 + (R(T.qIncPct,qr))/100);
      /* W — Indestructible */
      A.wShield = R(T.wShield,wr);
      /* E — Death's Grasp */
      A.ePen = R(T.ePen,er);
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qInc=0; }
      if(!learned.w){ A.wShield=0; }
      if(!learned.e){ A.ePen=0; A.eDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Darkness Rise","Vortex de ténèbres"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Obliterate", fr:"Q — Oblitération"},
      {id:"w", kind:"cast", label:"W", en:"W — Indestructible", fr:"W — Indestructible"},
      {id:"e", kind:"spell", en:"E — Death's Grasp", fr:"E — Emprise funeste"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"obliterate", v:A.qDmg, type:"magic"});
      if(st.id === "w") out.shield = A.wShield;
      if(st.id === "e") out.parts.push({n:"deathSGrasp", v:A.eDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("damage"), val:n0(A.qInc)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("shield"), val:n0(A.wShield)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("mPen"), val:pc(A.ePen)},
         {lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   - ressource particuliere (Shield) : non modelisee
   ------------------------------------------------------------------ */
