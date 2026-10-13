/* morgana — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Morgana.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"morgana", name:"Morgana", label:"Morgana", splash:0,
    base:{hp:[630,104], mana:[340,60], ad:[56,3.5],
          ar:[25,4.2], mr:[30,1.3],
          as:0.625, asPerLevel:1.53, ms:335},
    abilities_meta:[
      {k:"q", en:"Dark Binding", fr:"Entrave sombre"},
      {k:"w", en:"Tormented Shadow", fr:"Tourment ténébreux"},
      {k:"e", en:"Black Shield", fr:"Bouclier noir"},
      {k:"r", en:"Soul Shackles", fr:"Chaînes spirituelles"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[80,135,190,245,300], qAP:0.9, qCc:[2,2.25,2.5,2.75,3], qCd:[10,10,10,10,10],
      wFlat:[90,155,220,285,350], wAP:1, wMax:[180,310,440,570,700], wMaxAP:2, wCd:[12,12,12,12,12],
      eShield:[100,155,210,265,320], eShieldAP:0.7, eCd:[26,23.5,21,18.5,16],
      rFlat:[200,275,350], rAP:0.8, rTotal:[400,550,700], rTotalAP:1.6, rMs:[20,40,60], rCc:[1.5,1.75,2], rCd:[120,110,100]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Dark Binding */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      A.qCc = R(T.qCc,qr);
      /* W — Tormented Shadow */
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      A.wMax = R(T.wMax,wr) + T.wMaxAP*ap;
      /* E — Black Shield */
      A.eShield = R(T.eShield,er) + T.eShieldAP*ap;
      /* R — Soul Shackles */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.rTotal = R(T.rTotal,rr) + T.rTotalAP*ap;
      A.rMs = R(T.rMs,rr);
      A.rCc = R(T.rCc,rr);
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qCc=0; }
      if(!learned.w){ A.wDmg=0; A.wMax=0; }
      if(!learned.e){ A.eShield=0; }
      if(!learned.r){ A.rDmg=0; A.rTotal=0; A.rMs=0; A.rCc=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Soul Siphon","Siphon d'âme"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Dark Binding", fr:"Q — Entrave sombre"},
      {id:"w", kind:"spell", en:"W — Tormented Shadow", fr:"W — Tourment ténébreux"},
      {id:"e", kind:"cast", label:"E", en:"E — Black Shield", fr:"E — Bouclier noir"},
      {id:"r", kind:"spell", en:"R — Soul Shackles", fr:"R — Chaînes spirituelles"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"darkBinding", v:A.qDmg, type:"magic"});
      if(st.id === "w") out.parts.push({n:"tormentedShadow", v:A.wDmg, type:"magic"});
      if(st.id === "e") out.shield = A.eShield;
      if(st.id === "r") out.parts.push({n:"soulShackles", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("comboTime"), val:n0(A.qCc)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("damage"), val:n0(A.wMax)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("shield"), val:n0(A.eShield)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("damage"), val:n0(A.rTotal)},
         {lab:TR("msBonus"), val:"+" + pc(A.rMs)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - W : 2 formes dans le wiki (Tormented Shadow, Tormented Soil) — seule la premiere est modelisee
   - W : pas de ligne de degats simple, « Minimum Total Damage » prise comme ligne principale
   - W / Minimum Damage Per Tick : ligne non modelisee (9 to 35 (+ 10% AP))
   - W / Maximum Damage Per Tick : ligne non modelisee (9*2 to 35*2 (+ 10*2% AP))
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
