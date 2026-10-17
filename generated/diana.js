/* diana — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Diana.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"diana", name:"Diana", label:"Diana", splash:0,
    base:{hp:[640,109], mana:[375,25], ad:[57,3],
          ar:[31,4.3], mr:[32,2.05],
          as:0.625, asPerLevel:2, ms:345},
    abilities_meta:[
      {k:"q", en:"Crescent Strike", fr:"Croissant lunaire"},
      {k:"w", en:"Pale Cascade", fr:"Corps célestes"},
      {k:"e", en:"Lunar Rush", fr:"Rush lunaire"},
      {k:"r", en:"Moonfall", fr:"Attraction lunaire"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[70,105,140,175,210], qAP:0.7, qCd:[8,7.5,7,6.5,6],
      wShield:[45,60,75,90,105], wShieldAP:0.3, wShieldBonusHp:0.14, wFlat:[60,96,132,168,204], wAP:0.54, wShieldMax:[90,120,150,180,210], wShieldMaxAP:0.6, wShieldMaxBonusHp:0.28, wCd:[15,13.5,12,10.5,9],
      eFlat:[50,70,90,110,130], eAP:0.6, eCd:[22,20,18,16,14],
      rSlow:[40,50,60], rFlat:[200,300,400], rAP:0.6, rTotal:[340,540,740], rTotalAP:1.2, rCd:[100,90,80]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Crescent Strike */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      /* W — Pale Cascade */
      A.wShield = R(T.wShield,wr) + T.wShieldAP*ap + T.wShieldBonusHp*bonusHP;
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      A.wShieldMax = R(T.wShieldMax,wr) + T.wShieldMaxAP*ap + T.wShieldMaxBonusHp*bonusHP;
      /* E — Lunar Rush */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      /* R — Moonfall */
      A.rSlow = R(T.rSlow,rr);
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.rTotal = R(T.rTotal,rr) + T.rTotalAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wShield=0; A.wDmg=0; A.wShieldMax=0; }
      if(!learned.e){ A.eDmg=0; }
      if(!learned.r){ A.rSlow=0; A.rDmg=0; A.rTotal=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Moonsilver Blade","Lame sélène"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Crescent Strike", fr:"Q — Croissant lunaire"},
      {id:"w", kind:"spell", en:"W — Pale Cascade", fr:"W — Corps célestes"},
      {id:"e", kind:"spell", en:"E — Lunar Rush", fr:"E — Rush lunaire"},
      {id:"r", kind:"spell", en:"R — Moonfall", fr:"R — Attraction lunaire"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"crescentStrike", v:A.qDmg, type:"magic"});
      if(st.id === "w"){
        out.parts.push({n:"paleCascade", v:A.wDmg, type:"magic"});
        out.shield = A.wShield;
      }
      if(st.id === "e") out.parts.push({n:"lunarRush", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"moonfall", v:A.rDmg, type:"magic"});
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
         {lab:TR("shield"), val:n0(A.wShieldMax)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("slow"), val:pc(A.rSlow)},
         {lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("damage"), val:n0(A.rTotal)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - W : pas de ligne de degats simple, « Total Magic Damage » prise comme ligne principale
   - W / Magic Damage per Orb : ligne non modelisee (20 to 68 (+ 18% AP))
   - R / Bonus Damage Per Champion : ligne non modelisee (35 to 85 (+ 15% AP))
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
