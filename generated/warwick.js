/* warwick — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Warwick.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"warwick", name:"Warwick", label:"Warwick", splash:0,
    base:{hp:[620,99], mana:[280,35], ad:[65,2.5],
          ar:[33,4.4], mr:[32,2.05],
          as:0.638, asPerLevel:2, ms:335},
    abilities_meta:[
      {k:"q", en:"Jaws of the Beast", fr:"Dents de la bête"},
      {k:"w", en:"Blood Hunt", fr:"Traque sanguinaire"},
      {k:"e", en:"Primal Howl", fr:"Hurlement bestial"},
      {k:"r", en:"Infinite Duress", fr:"Contrainte infinie"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qHpPct:[6,7,8,9,10], qAD:1.2, qAP:1, qHeal:[25,37.5,50,62.5,75], qCd:[8,7.5,7,6.5,6],
      wAS:[70,80,90,100,110], wMs:[35,42.5,50,57.5,65], wASMax:[140,160,180,200,220], wMsMax:[70,85,100,115,130], wCd:[80,70,60,50,40],
      eCd:[15,14,13,12,11],
      rFlat:[175,350,525], rBonusAD:1.67, rCd:[110,90,70]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Jaws of the Beast */
      A.qHpPct = R(T.qHpPct,qr) + T.qAD*tot.ad + T.qAP*ap;   /* % des PV de la cible, applique dans onStep */
      A.qHeal = R(T.qHeal,qr);
      /* W — Blood Hunt */
      A.wAS = R(T.wAS,wr);
      A.wMs = R(T.wMs,wr);
      A.wASMax = R(T.wASMax,wr);
      A.wMsMax = R(T.wMsMax,wr);
      /* R — Infinite Duress */
      A.rDmg = R(T.rFlat,rr) + T.rBonusAD*bonusAD;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qHpPct=0; A.qHeal=0; }
      if(!learned.w){ A.wAS=0; A.wMs=0; A.wASMax=0; A.wMsMax=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Eternal Hunger","Soif inextinguible"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Jaws of the Beast", fr:"Q — Dents de la bête"},
      {id:"w", kind:"cast", label:"W", en:"W — Blood Hunt", fr:"W — Traque sanguinaire"},
      {id:"r", kind:"spell", en:"R — Infinite Duress", fr:"R — Contrainte infinie"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q"){
        out.parts.push({n:"jawsOfTheBeast", v:hp * A.qHpPct/100, type:"magic"});
        out.heal = A.qHeal;
      }
      if(st.id === "w") out.asBonus = A.wAS;
      if(st.id === "r") out.parts.push({n:"infiniteDuress", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("mPpct"), val:pc(A.qHpPct)},
         {lab:TR("healing"), val:n0(A.qHeal)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("bonusAs"), val:"+" + pc(A.wAS)},
         {lab:TR("msBonus"), val:"+" + pc(A.wMs)},
         {lab:TR("bonusAs"), val:"+" + pc(A.wASMax)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q : 2 formes dans le wiki (Jaws of the Beast, Hungering Strike) — seule la premiere est modelisee
   - W : 2 formes dans le wiki (Blood Hunt, Hunter's Call) — seule la premiere est modelisee
   - E : 2 formes dans le wiki (Primal Howl, Blood Scent) — seule la premiere est modelisee
   - Q / Capped Monster Damage : ligne non modelisee (150 to 210 (+ 120% AD) (+ 100% AP))
   - E / Damage Reduction : ligne non modelisee (35 to 55%)
   - R : pas de ligne de degats simple, « Total Magic Damage » prise comme ligne principale
   - passif : 2 blocs dans le wiki (Eternal Hunger, Eternal Thirst) — seul le premier est modelise
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
