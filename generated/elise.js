/* elise — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Elise.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"elise", name:"Elise", label:"Elise", splash:0,
    base:{hp:[620,109], mana:[324,50], ad:[55,3],
          ar:[30,4.5], mr:[30,1.3],
          as:0.625, asPerLevel:1.75, ms:330},
    abilities_meta:[
      {k:"q", en:"Neurotoxin / Venomous Bite", fr:"Neurotoxine/Morsure venimeuse"},
      {k:"w", en:"Volatile Spiderling / Skittering Frenzy", fr:"Araignée explosive/Frénésie symbiotique"},
      {k:"e", en:"Cocoon / Rappel", fr:"Cocon/Suspension"},
      {k:"r", en:"Spider Form", fr:"Forme arachnéenne"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[40,70,100,130,160], qCurPct:4, qCurPctAP100:3, qCd:[6,6,6,6,6],
      wFlat:[60,100,140,180,220], wAP:0.75, wCd:[12,12,12,12,12],
      eCc:[1.6,1.8,2,2.2,2.4], eCd:[12,11.5,11,10.5,10],
      rCd:[3,3,3]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Neurotoxin / Venomous Bite */
      A.qCurPct = T.qCurPct + T.qCurPctAP100*ap/100;   /* % des PV de la cible, applique dans onStep */
      A.qDmg = R(T.qFlat,qr);
      /* W — Volatile Spiderling / Skittering Frenzy */
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      /* E — Cocoon / Rappel */
      A.eCc = R(T.eCc,er);
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qCurPct=0; A.qDmg=0; }
      if(!learned.w){ A.wDmg=0; }
      if(!learned.e){ A.eCc=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Spider Queen","Reine araignée"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Neurotoxin / Venomous Bite", fr:"Q — Neurotoxine/Morsure venimeuse"},
      {id:"w", kind:"spell", en:"W — Volatile Spiderling / Skittering Frenzy", fr:"W — Araignée explosive/Frénésie symbiotique"},
      {id:"e", kind:"cast", label:"E", en:"E — Cocoon / Rappel", fr:"E — Cocon/Suspension"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"neurotoxinVenomousBite", v:A.qDmg + cur * A.qCurPct/100, type:"magic"});
      if(st.id === "w") out.parts.push({n:"volatileSpiderlingSkitteringFrenzy", v:A.wDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("mPpct"), val:pc(A.qCurPct)},
         {lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("comboTime"), val:n0(A.eCc)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q : 2 formes dans le wiki (Neurotoxin, Venomous Bite) — seule la premiere est modelisee
   - W : 2 formes dans le wiki (Volatile Spiderling, Skittering Frenzy) — seule la premiere est modelisee
   - E : 2 formes dans le wiki (Cocoon, Rappel) — seule la premiere est modelisee
   - Q / Capped Monster Damage : ligne non modelisee (65 to 145 (+ 90% AP))
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   - W : « Volatile Spiderling » invoque une unite — ses propres degats ne sont pas dans les donnees de la competence
   ------------------------------------------------------------------ */
