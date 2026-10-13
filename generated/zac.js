/* zac — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Zac.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"zac", name:"Zac", label:"Zac", splash:0,
    base:{hp:[685,109], mana:[0,0], ad:[60,3.4],
          ar:[33,5.2], mr:[32,2.05],
          as:0.736, asPerLevel:1.6, ms:340},
    abilities_meta:[
      {k:"q", en:"Stretching Strikes", fr:"Étirements"},
      {k:"w", en:"Unstable Matter", fr:"Matière instable"},
      {k:"e", en:"Elastic Slingshot", fr:"Fronde"},
      {k:"r", en:"Let's Bounce!", fr:"Boing !"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[60,90,120,150,180], qAP:0.3, qBonusHp:0.03, qTotal:[120,180,240,300,360], qTotalAP:0.6, qTotalBonusHp:0.06, qCd:[14,12.5,11,9.5,8],
      wFlat:[40,50,60,70,80], wHpPct:[4,5,6,7,8], wHpPctAP100:3, wCd:[5,5,5,5,5],
      eFlat:[60,105,150,195,240], eAP:0.8, eCd:[21,18,15,12,9],
      rFlat:[300,475,650], rAP:1, rCd:[120,105,90]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Stretching Strikes */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap + T.qBonusHp*bonusHP;
      A.qTotal = R(T.qTotal,qr) + T.qTotalAP*ap + T.qTotalBonusHp*bonusHP;
      /* W — Unstable Matter */
      A.wHpPct = R(T.wHpPct,wr) + T.wHpPctAP100*ap/100;   /* % des PV de la cible, applique dans onStep */
      A.wDmg = R(T.wFlat,wr);
      /* E — Elastic Slingshot */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      /* R — Let's Bounce! */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qTotal=0; }
      if(!learned.w){ A.wHpPct=0; A.wDmg=0; }
      if(!learned.e){ A.eDmg=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Cell Division","Division cellulaire"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Stretching Strikes", fr:"Q — Étirements"},
      {id:"w", kind:"spell", en:"W — Unstable Matter", fr:"W — Matière instable"},
      {id:"e", kind:"spell", en:"E — Elastic Slingshot", fr:"E — Fronde"},
      {id:"r", kind:"spell", en:"R — Let's Bounce!", fr:"R — Boing !"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"stretchingStrikes", v:A.qDmg, type:"magic"});
      if(st.id === "w") out.parts.push({n:"unstableMatter", v:A.wDmg + hp * A.wHpPct/100, type:"magic"});
      if(st.id === "e") out.parts.push({n:"elasticSlingshot", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"letSBounce", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("damage"), val:n0(A.qTotal)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("mPpct"), val:pc(A.wHpPct)},
         {lab:TR("damage"), val:n0(A.wDmg)},
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
   - W / Capped Non-Champion Damage : ligne non modelisee (200+40 to 200+80)
   - E / Maximum Range Channel Duration : ligne non modelisee (0.9 to 1.3 seconds)
   - R : pas de ligne de degats simple, « Total Magic Damage » prise comme ligne principale
   - R / Magic Damage Per Hit : ligne non modelisee (120 to 260 (+ 40% AP))
   - R / Reduced Damage Per Hit : ligne non modelisee (120/2 to 260/2 (+ 20% AP))
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   - ressource particuliere (Health) : non modelisee
   ------------------------------------------------------------------ */
