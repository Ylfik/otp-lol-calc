/* olaf — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Olaf.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"olaf", name:"Olaf", label:"Olaf", splash:0,
    base:{hp:[645,119], mana:[316,50], ad:[68,4.7],
          ar:[35,4.2], mr:[32,2.05],
          as:0.72, asPerLevel:2.7, ms:350},
    abilities_meta:[
      {k:"q", en:"Undertow", fr:"Déchireuse"},
      {k:"w", en:"Tough It Out", fr:"Force décuplée"},
      {k:"e", en:"Reckless Swing", fr:"Frappe sauvage"},
      {k:"r", en:"Ragnarok", fr:"Ragnarok"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[70,120,170,220,270], qBonusAD:1, qSlow:[30,35,40,45,50], qCd:[9,9,9,9,9],
      wAS:[40,50,60,70,80], wShield:[10,40,70,100,130], wShieldMissPct:17.5, wCd:[16,15,14,13,12],
      eFlat:[70,115,160,205,250], eAD:0.5, eCd:[11,10,9,8,7],
      rFlat:[10,20,30], rAD:0.25, rMs:[20,45,70], rCd:[100,90,80]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Undertow */
      A.qDmg = R(T.qFlat,qr) + T.qBonusAD*bonusAD;
      A.qSlow = R(T.qSlow,qr);
      /* W — Tough It Out */
      A.wAS = R(T.wAS,wr);
      A.wShieldMissPct = T.wShieldMissPct;
      A.wShield = R(T.wShield,wr);
      /* E — Reckless Swing */
      A.eDmg = R(T.eFlat,er) + T.eAD*tot.ad;
      /* R — Ragnarok */
      A.rDmg = R(T.rFlat,rr) + T.rAD*tot.ad;
      A.rMs = R(T.rMs,rr);
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qSlow=0; }
      if(!learned.w){ A.wAS=0; A.wShieldMissPct=0; A.wShield=0; }
      if(!learned.e){ A.eDmg=0; }
      if(!learned.r){ A.rDmg=0; A.rMs=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Berserker Rage","Rage du berzerker"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Undertow", fr:"Q — Déchireuse"},
      {id:"w", kind:"cast", label:"W", en:"W — Tough It Out", fr:"W — Force décuplée"},
      {id:"e", kind:"spell", en:"E — Reckless Swing", fr:"E — Frappe sauvage"},
      {id:"r", kind:"spell", en:"R — Ragnarok", fr:"R — Ragnarok"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"undertow", v:A.qDmg, type:"phys"});
      if(st.id === "w"){
        out.shield = A.wShield;
        out.asBonus = A.wAS;
      }
      if(st.id === "e") out.parts.push({n:"recklessSwing", v:A.eDmg, type:"true"});
      if(st.id === "r") out.parts.push({n:"ragnarok", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("slow"), val:pc(A.qSlow)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("bonusAs"), val:"+" + pc(A.wAS)},
         {lab:TR("sQpct"), val:pc(A.wShieldMissPct)},
         {lab:TR("shield"), val:n0(A.wShield)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("msBonus"), val:"+" + pc(A.rMs)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - W : 2 formes dans le wiki (Tough It Out, Vicious Strikes) — seule la premiere est modelisee
   - Q / Monster Bonus Physical Damage : ligne non modelisee (20 to 120)
   - Q / Total Monster Damage : ligne non modelisee (70+20 to 270+120 (+ 100% bonus AD))
   - W / Shield Strength : « 17.5% missing health » est une part des PV du champion — le moteur ne suit pas ses PV courants, la valeur reste un pourcentage affiche
   - R / Bonus Resistances : ligne non modelisee (10 to 20)
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
