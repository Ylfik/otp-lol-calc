/* teemo — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Teemo.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"teemo", name:"Teemo", label:"Teemo", splash:0,
    base:{hp:[615,104], mana:[334,25], ad:[54,3],
          ar:[24,4.5], mr:[30,1.3],
          as:0.69, asPerLevel:3.38, ms:330},
    abilities_meta:[
      {k:"q", en:"Blinding Dart", fr:"Fléchette aveuglante"},
      {k:"w", en:"Move Quick", fr:"Vélocité"},
      {k:"e", en:"Toxic Shot", fr:"Tir toxique"},
      {k:"r", en:"Noxious Trap", fr:"Piège nocif"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[80,125,170,215,260], qAP:0.7, qCc:[2,2.25,2.5,2.75,3], qCcMax:[4,4.5,5,5.5,6], qCd:[7,7,7,7,7],
      wMs:[12,16,20,24,28], wMsMax:[24,32,40,48,56], wCd:[14,14,14,14,14],
      eFlat:[9,23,37,51,65], eBonusAD:0.05, eAP:0.3, eTotal:[24,48,72,96,120], eTotalBonusAD:0.1, eTotalAP:0.4,
      rSlow:[30,40,50], rFlat:[200,325,450], rAP:0.5, rCd:[0.25,0.25,0.25]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Blinding Dart */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      A.qCc = R(T.qCc,qr);
      A.qCcMax = R(T.qCcMax,qr);
      /* W — Move Quick */
      A.wMs = R(T.wMs,wr);
      A.wMsMax = R(T.wMsMax,wr);
      /* E — Toxic Shot */
      A.eDmg = R(T.eFlat,er) + T.eBonusAD*bonusAD + T.eAP*ap;
      A.eTotal = R(T.eTotal,er) + T.eTotalBonusAD*bonusAD + T.eTotalAP*ap;
      /* R — Noxious Trap */
      A.rSlow = R(T.rSlow,rr);
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qCc=0; A.qCcMax=0; }
      if(!learned.w){ A.wMs=0; A.wMsMax=0; }
      if(!learned.e){ A.eDmg=0; A.eTotal=0; }
      if(!learned.r){ A.rSlow=0; A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Guerrilla Warfare","Guérilla"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Blinding Dart", fr:"Q — Fléchette aveuglante"},
      {id:"w", kind:"cast", label:"W", en:"W — Move Quick", fr:"W — Vélocité"},
      {id:"e", kind:"spell", en:"E — Toxic Shot", fr:"E — Tir toxique"},
      {id:"r", kind:"spell", en:"R — Noxious Trap", fr:"R — Piège nocif"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"blindingDart", v:A.qDmg, type:"magic"});
      if(st.id === "e") out.parts.push({n:"toxicShot", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"noxiousTrap", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("comboTime"), val:n0(A.qCc)},
         {lab:TR("comboTime"), val:n0(A.qCcMax)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("msBonus"), val:"+" + pc(A.wMs)},
         {lab:TR("msBonus"), val:"+" + pc(A.wMsMax)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("damage"), val:n0(A.eTotal)}],
        [{lab:TR("slow"), val:pc(A.rSlow)},
         {lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - E / Magic Damage per Tick : ligne non modelisee (6 to 30 (+ 2.5% bonus AD) (+ 10% AP))
   - E / Monster Damage On-Hit : ligne non modelisee (9*1.6 to 65*1.6 (+ 5*1.6% bonus AD) (+ 30*1.6% AP))
   - E / Monster Damage per Tick : ligne non modelisee (6*1.6 to 30*1.6 (+ 2.5*1.6% bonus AD) (+ 10*1.6% AP))
   - E / Total Monster Poison Damage : ligne non modelisee (6*4.0*1.6 to 30*4.0*1.6 (+ 2.5*4.0*1.6% bonus AD) (+ 10*4.0*1.6% AP))
   - E : aucune recharge dans les donnees wiki
   - R : pas de ligne de degats simple, « Total Magic Damage » prise comme ligne principale
   - R / Bounce Distance Cap : ligne non modelisee (350 to 550)
   - R / Maximum Charges : ligne non modelisee (3 to 5)
   - R / Magic Damage per Tick : ligne non modelisee (200/4 to 450/4 (+ 50/4% AP))
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
