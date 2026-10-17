/* shen — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Shen.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"shen", name:"Shen", label:"Shen", splash:0,
    base:{hp:[610,99], mana:[400,0], ad:[64,3],
          ar:[34,4.2], mr:[32,2.05],
          as:0.751, asPerLevel:3, ms:340},
    abilities_meta:[
      {k:"q", en:"Twilight Assault", fr:"Assaut crépusculaire"},
      {k:"w", en:"Spirit's Refuge", fr:"Refuge spirituel"},
      {k:"e", en:"Shadow Dash", fr:"Rush des ombres"},
      {k:"r", en:"Stand United", fr:"Soutien indéfectible"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qSlow:[25,30,35,40,45], qHpPct:[2,2.5,3,3.5,4], qHpPctAP100:1.5, qTotalHpPct:[6,7.5,9,10.5,12], qTotalHpPctAP100:4.5, qMaxHpPct:[5,5.5,6,6.5,7], qMaxHpPctAP100:2, qCd:[8,7.25,6.5,5.75,5],
      wCd:[16,14.5,13,11.5,10],
      eFlat:[60,85,110,135,160], eBonusHp:0.11, eCd:[18,16,14,12,10],
      rShieldMin:[120,220,320], rShieldMinAP:1.35, rShieldMinBonusHp:0.15, rShieldMax:[192,352,512], rShieldMaxAP:2.16, rShieldMaxBonusHp:0.24, rCd:[200,180,160]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Twilight Assault */
      A.qSlow = R(T.qSlow,qr);
      A.qHpPct = R(T.qHpPct,qr) + T.qHpPctAP100*ap/100;   /* % des PV de la cible, applique dans onStep */
      A.qDmg = lerp(10,40,L,16);
      A.qTotalHpPct = R(T.qTotalHpPct,qr) + T.qTotalHpPctAP100*ap/100;   /* % des PV de la cible, applique dans onStep */
      A.qTotal = lerp(30,120,L,16);
      A.qMaxHpPct = R(T.qMaxHpPct,qr) + T.qMaxHpPctAP100*ap/100;   /* % des PV de la cible, applique dans onStep */
      A.qMax = lerp(10,40,L,16);
      /* E — Shadow Dash */
      A.eDmg = R(T.eFlat,er) + T.eBonusHp*bonusHP;
      /* R — Stand United */
      A.rShieldMin = R(T.rShieldMin,rr) + T.rShieldMinAP*ap + T.rShieldMinBonusHp*bonusHP;
      A.rShieldMax = R(T.rShieldMax,rr) + T.rShieldMaxAP*ap + T.rShieldMaxBonusHp*bonusHP;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qSlow=0; A.qHpPct=0; A.qDmg=0; A.qTotalHpPct=0; A.qTotal=0; A.qMaxHpPct=0; A.qMax=0; }
      if(!learned.e){ A.eDmg=0; }
      if(!learned.r){ A.rShieldMin=0; A.rShieldMax=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Ki Barrier","Barrière de ki"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Twilight Assault", fr:"Q — Assaut crépusculaire"},
      {id:"e", kind:"spell", en:"E — Shadow Dash", fr:"E — Rush des ombres"},
      {id:"r", kind:"cast", label:"R", en:"R — Stand United", fr:"R — Soutien indéfectible"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"twilightAssault", v:A.qDmg + hp * A.qHpPct/100 + hp * A.qTotalHpPct/100 + hp * A.qMaxHpPct/100, type:"magic"});
      if(st.id === "e") out.parts.push({n:"shadowDash", v:A.eDmg, type:"phys"});
      if(st.id === "r") out.shield = A.rShieldMin;
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("slow"), val:pc(A.qSlow)},
         {lab:TR("mPpct"), val:pc(A.qHpPct)},
         {lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("shield"), val:n0(A.rShieldMin)},
         {lab:TR("shield"), val:n0(A.rShieldMax)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q / Bonus Magic Damage : progression par paliers (6) approximee par une interpolation du niveau 1 au 16
   - Q / Total Magic Damage : progression par paliers (6) approximee par une interpolation du niveau 1 au 16
   - Q / Increased Bonus Damage : progression par paliers (6) approximee par une interpolation du niveau 1 au 16
   - Q / Total Increased Damage : doublon de Total Magic Damage, ignore
   - Q / Maximum Monster Damage : ligne non modelisee (100 to 200)
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   - ressource particuliere (Energy) : non modelisee
   ------------------------------------------------------------------ */
