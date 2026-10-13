/* galio — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Galio.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"galio", name:"Galio", label:"Galio", splash:0,
    base:{hp:[600,126], mana:[410,40], ad:[59,3.5],
          ar:[24,4.7], mr:[32,2.05],
          as:0.625, asPerLevel:1.5, ms:340},
    abilities_meta:[
      {k:"q", en:"Winds of War", fr:"Vents de guerre"},
      {k:"w", en:"Shield of Durand", fr:"Bouclier de Durand"},
      {k:"e", en:"Justice Punch", fr:"Horion de la justice"},
      {k:"r", en:"Hero's Entrance", fr:"Entrée héroïque"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[70,105,140,175,210], qAP:0.7, qCd:[11,10,9,8,7],
      wShield:[7.5,9,10.5,12,13.5], wFlat:[20,30,40,50,60], wAP:0.3, wMax:[60,90,120,150,180], wMaxAP:0.9, wCd:[18,17,16,15,14],
      eFlat:[100,135,170,205,240], eAP:1, eCd:[11,10,9,8,7],
      rFlat:[150,250,350], rAP:0.7, rMr:1, rCd:[180,160,140]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Winds of War */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      /* W — Shield of Durand */
      A.wShield = R(T.wShield,wr);
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      A.wMax = R(T.wMax,wr) + T.wMaxAP*ap;
      /* E — Justice Punch */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      /* R — Hero's Entrance */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap + T.rMr*tot.mr;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wShield=0; A.wDmg=0; A.wMax=0; }
      if(!learned.e){ A.eDmg=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Colossal Smash","Frappe colossale"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Winds of War", fr:"Q — Vents de guerre"},
      {id:"w", kind:"spell", en:"W — Shield of Durand", fr:"W — Bouclier de Durand"},
      {id:"e", kind:"spell", en:"E — Justice Punch", fr:"E — Horion de la justice"},
      {id:"r", kind:"spell", en:"R — Hero's Entrance", fr:"R — Entrée héroïque"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"windsOfWar", v:A.qDmg, type:"magic"});
      if(st.id === "w"){
        out.parts.push({n:"shieldOfDurand", v:A.wDmg, type:"magic"});
        out.shield = A.wShield;
      }
      if(st.id === "e") out.parts.push({n:"justicePunch", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"heroSEntrance", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("shield"), val:n0(A.wShield)},
         {lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("damage"), val:n0(A.wMax)},
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
   - Q : 2 formes dans le wiki (Winds of War, Resolute Smite) — seule la premiere est modelisee
   - W : 2 formes dans le wiki (Shield of Durand, Bulwark) — seule la premiere est modelisee
   - E : 2 formes dans le wiki (Justice Punch, Righteous Gust) — seule la premiere est modelisee
   - R : 2 formes dans le wiki (Hero's Entrance, Idol of Durand) — seule la premiere est modelisee
   - W : pas de ligne de degats simple, « Minimum Magic Damage » prise comme ligne principale
   - W / Physical Damage Reduction : ligne non modelisee (25/2 to 45/2% (+ 1.5% per 100 AP) (+ 8/2% per 100 bonus magic resistance) (+ 1/2% per 100 bonus health))
   - W / Magic Damage Reduction : ligne non modelisee (25 to 45% (+ 4% per 100 AP) (+ 8% per 100 bonus magic resistance) (+ 1% per 100 bonus health))
   - E / Non-Champion Damage : ligne non modelisee (100*0.8 to 240*0.8 (+ 100*0.8% AP))
   - R / Magic Damage : « 100% bonus magic resistance » est lu comme une part des resistances DU CHAMPION — a verifier, le wiki ne le dit pas toujours
   - passif : 2 blocs dans le wiki (Colossal Smash, Runic Skin) — seul le premier est modelise
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
