/* karma — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Karma.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"karma", name:"Karma", label:"Karma", splash:0,
    base:{hp:[630,109], mana:[374,40], ad:[49,3],
          ar:[28,5], mr:[30,1.3],
          as:0.625, asPerLevel:2.3, ms:335},
    abilities_meta:[
      {k:"q", en:"Inner Flame", fr:"Flamme intérieure"},
      {k:"w", en:"Focused Resolve", fr:"Volonté concentrée"},
      {k:"e", en:"Inspire", fr:"Exaltation"},
      {k:"r", en:"Mantra", fr:"Mantra"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[60,110,160,210,260], qAP:0.7, qCd:[9,8,7,6,5],
      wFlat:[40,65,90,115,140], wAP:0.45, wTotal:[80,130,180,230,280], wTotalAP:0.9, wCc:[1.6,1.7,1.8,1.9,2], wCd:[12,12,12,12,12],
      eShield:[80,130,180,230,280], eShieldAP:0.6, eCd:[10,9.5,9,8.5,8],
      rCd:[40,38,36,34]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Inner Flame */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      /* W — Focused Resolve */
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      A.wTotal = R(T.wTotal,wr) + T.wTotalAP*ap;
      A.wCc = R(T.wCc,wr);
      /* E — Inspire */
      A.eShield = R(T.eShield,er) + T.eShieldAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wDmg=0; A.wTotal=0; A.wCc=0; }
      if(!learned.e){ A.eShield=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Gathering Fire","Concentration ardente"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Inner Flame", fr:"Q — Flamme intérieure"},
      {id:"w", kind:"spell", en:"W — Focused Resolve", fr:"W — Volonté concentrée"},
      {id:"e", kind:"cast", label:"E", en:"E — Inspire", fr:"E — Exaltation"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"innerFlame", v:A.qDmg, type:"magic"});
      if(st.id === "w") out.parts.push({n:"focusedResolve", v:A.wDmg, type:"magic"});
      if(st.id === "e") out.shield = A.eShield;
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("damage"), val:n0(A.wTotal)},
         {lab:TR("comboTime"), val:n0(A.wCc)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("shield"), val:n0(A.eShield)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q : 2 formes dans le wiki (Inner Flame, Soulflare) — seule la premiere est modelisee
   - W : 2 formes dans le wiki (Focused Resolve, Renewal) — seule la premiere est modelisee
   - E : 2 formes dans le wiki (Inspire, Defiance) — seule la premiere est modelisee
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
