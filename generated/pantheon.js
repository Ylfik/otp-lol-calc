/* pantheon — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Pantheon.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"pantheon", name:"Pantheon", label:"Pantheon", splash:0,
    base:{hp:[650,109], mana:[317,31], ad:[64,3.3],
          ar:[40,4.95], mr:[28,2.05],
          as:0.658, asPerLevel:2.95, ms:345},
    abilities_meta:[
      {k:"q", en:"Comet Spear", fr:"Lance astrale"},
      {k:"w", en:"Shield Vault", fr:"Assaut martial"},
      {k:"e", en:"Aegis Assault", fr:"Égide impénétrable"},
      {k:"r", en:"Grand Starfall", fr:"Météore"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[70,100,130,160,190], qBonusAD:1.15, qAP:0.5, qMax:[155,230,305,380,455], qMaxBonusAD:2.3, qMaxAP:1, qHurl:[35,50,65,80,95], qHurlBonusAD:0.575, qHurlAP:0.25, qThrust:[70,100,130,160,190], qThrustBonusAD:1.15, qCd:[11,10.25,9.5,8.75,8],
      wHpPct:[6,6.5,7,7.5,8], wAP100:1.5, wBonusHp:0.004, wCd:[13,12,11,10,9],
      eFlat:[55,105,155,205,255], eBonusAD:1.5, eCd:[22,21,20,19,18],
      rFlat:[300,500,700], rAP:1, rCd:[180,165,150]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Comet Spear */
      A.qDmg = R(T.qFlat,qr) + T.qBonusAD*bonusAD + T.qAP*ap;
      A.qMax = R(T.qMax,qr) + T.qMaxBonusAD*bonusAD + T.qMaxAP*ap;
      A.qHurl = R(T.qHurl,qr) + T.qHurlBonusAD*bonusAD + T.qHurlAP*ap;
      A.qThrust = R(T.qThrust,qr) + T.qThrustBonusAD*bonusAD;
      /* W — Shield Vault */
      A.wHpPct = R(T.wHpPct,wr) + T.wAP100*ap/100 + T.wBonusHp*bonusHP;   /* % des PV de la cible, applique dans onStep */
      /* E — Aegis Assault */
      A.eDmg = R(T.eFlat,er) + T.eBonusAD*bonusAD;
      /* R — Grand Starfall */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qMax=0; A.qHurl=0; A.qThrust=0; }
      if(!learned.w){ A.wHpPct=0; }
      if(!learned.e){ A.eDmg=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Mortal Will","Ardeur mortelle"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Comet Spear", fr:"Q — Lance astrale"},
      {id:"w", kind:"spell", en:"W — Shield Vault", fr:"W — Assaut martial"},
      {id:"e", kind:"spell", en:"E — Aegis Assault", fr:"E — Égide impénétrable"},
      {id:"r", kind:"spell", en:"R — Grand Starfall", fr:"R — Météore"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"cometSpear", v:A.qDmg, type:"phys"});
      if(st.id === "w") out.parts.push({n:"shieldVault", v:hp * A.wHpPct/100, type:"magic"});
      if(st.id === "e") out.parts.push({n:"aegisAssault", v:A.eDmg, type:"phys"});
      if(st.id === "r") out.parts.push({n:"grandStarfall", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("damage"), val:n0(A.qMax)},
         {lab:TR("damage"), val:n0(A.qHurl)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("mPpct"), val:pc(A.wHpPct)},
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
   - Q : 2 formes dans le wiki (Comet Spear, Spear Shot) — seule la premiere est modelisee
   - W : 2 formes dans le wiki (Shield Vault, Aegis of Zeonia) — seule la premiere est modelisee
   - E : 2 formes dans le wiki (Aegis Assault, Heartseeker Strike) — seule la premiere est modelisee
   - R : 2 formes dans le wiki (Grand Starfall, Grand Skyfall) — seule la premiere est modelisee
   - Q / Increased Hurl Secondary Damage : doublon de Increased Hurl Damage, ignore
   - Q / Increased Thrust Damage : doublon de Increased Hurl Damage, ignore
   - R / Armor Penetration : ligne non modelisee (10 to 30%)
   - R / Reduced Damage : ligne non modelisee (300/2 to 700/2 (+ 50% AP))
   - passif : 2 blocs dans le wiki (Mortal Will, Aegis Protection) — seul le premier est modelise
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
