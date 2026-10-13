/* nidalee — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Nidalee.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"nidalee", name:"Nidalee", label:"Nidalee", splash:0,
    base:{hp:[610,109], mana:[295,45], ad:[58,3.5],
          ar:[32,5], mr:[30,1.45],
          as:0.638, asPerLevel:3.22, ms:335},
    abilities_meta:[
      {k:"q", en:"Javelin Toss / Takedown", fr:"Javelot / Mise à terre"},
      {k:"w", en:"Bushwhack / Pounce", fr:"Guérilla / Bond"},
      {k:"e", en:"Primal Surge / Swipe", fr:"Charge primale / Taillade"},
      {k:"r", en:"Aspect Of The Cougar", fr:"Aspect du Couguar"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[70,90,110,130,150], qAP:0.5, qMax:[227.5,292.5,357.5,422.5,487.5], qMaxAP:1.625, qCd:[6,6,6,6,6],
      wFlat:[40,80,120,160,200], wAP:0.2, wCd:[13,12,11,10,9],
      eAS:[30,40,50,60,70], eHealMin:[50,75,100,125,150], eHealMinAP:0.35, eHealMax:[100,150,200,250,300], eHealMaxAP:0.7, eCd:[12,12,12,12,12],
      rCd:[3,3,3]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Javelin Toss / Takedown */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      A.qMax = R(T.qMax,qr) + T.qMaxAP*ap;
      /* W — Bushwhack / Pounce */
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      /* E — Primal Surge / Swipe */
      A.eAS = R(T.eAS,er);
      A.eHealMin = R(T.eHealMin,er) + T.eHealMinAP*ap;
      A.eHealMax = R(T.eHealMax,er) + T.eHealMaxAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qMax=0; }
      if(!learned.w){ A.wDmg=0; }
      if(!learned.e){ A.eAS=0; A.eHealMin=0; A.eHealMax=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Prowl","Prédateur"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Javelin Toss / Takedown", fr:"Q — Javelot / Mise à terre"},
      {id:"w", kind:"spell", en:"W — Bushwhack / Pounce", fr:"W — Guérilla / Bond"},
      {id:"e", kind:"cast", label:"E", en:"E — Primal Surge / Swipe", fr:"E — Charge primale / Taillade"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"javelinTossTakedown", v:A.qDmg, type:"magic"});
      if(st.id === "w") out.parts.push({n:"bushwhackPounce", v:A.wDmg, type:"magic"});
      if(st.id === "e"){
        out.heal = A.eHealMin;
        out.asBonus = A.eAS;
      }
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("damage"), val:n0(A.qMax)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("bonusAs"), val:"+" + pc(A.eAS)},
         {lab:TR("healing"), val:n0(A.eHealMin)},
         {lab:TR("healing"), val:n0(A.eHealMax)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q : 2 formes dans le wiki (Javelin Toss, Takedown) — seule la premiere est modelisee
   - W : 2 formes dans le wiki (Bushwhack, Pounce) — seule la premiere est modelisee
   - E : 2 formes dans le wiki (Primal Surge, Swipe) — seule la premiere est modelisee
   - Q : pas de ligne de degats simple, « Minimum Magic Damage » prise comme ligne principale
   - W : pas de ligne de degats simple, « Total Magic Damage » prise comme ligne principale
   - W / Magic Damage Per Tick : ligne non modelisee (10 to 50 (+ 5% AP))
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
