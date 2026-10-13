/* volibear — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Volibear.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"volibear", name:"Volibear", label:"Volibear", splash:0,
    base:{hp:[650,104], mana:[350,70], ad:[65,3.5],
          ar:[35,5.2], mr:[32,2.05],
          as:0.625, asPerLevel:2, ms:340},
    abilities_meta:[
      {k:"q", en:"Thundering Smash", fr:"Coup fulgurant"},
      {k:"w", en:"Frenzied Maul", fr:"Folie mutilatrice"},
      {k:"e", en:"Sky Splitter", fr:"Foudroiement"},
      {k:"r", en:"Stormbringer", fr:"Tempête incarnée"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qMs:[12,15.5,19,22.5,26], qMsMax:[24,31,38,45,52], qFlat:[10,20,30,40,50], qBonusAD:1.6, qCd:[12,11.5,11,10.5,10],
      wFlat:[5,30,55,80,105], wAD:1.1, wBonusHp:0.06, wHeal:[20,35,50,65,80], wHealMissPct:[8,11,14,17,20], wCd:[5,5,5,5,5],
      eFlat:[80,110,140,170,200], eAP:0.7, eHpPct:[11,12,13,14,15], eCd:[16,16,16,16,16],
      rFlat:[300,500,700], rBonusAD:2.5, rAP:1.25, rCd:[160,135,110]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Thundering Smash */
      A.qMs = R(T.qMs,qr);
      A.qMsMax = R(T.qMsMax,qr);
      A.qDmg = R(T.qFlat,qr) + T.qBonusAD*bonusAD;
      /* W — Frenzied Maul */
      A.wDmg = R(T.wFlat,wr) + T.wAD*tot.ad + T.wBonusHp*bonusHP;
      A.wHealMissPct = R(T.wHealMissPct,wr);
      A.wHeal = R(T.wHeal,wr);
      /* E — Sky Splitter */
      A.eHpPct = R(T.eHpPct,er);   /* % des PV de la cible, applique dans onStep */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      /* R — Stormbringer */
      A.rDmg = R(T.rFlat,rr) + T.rBonusAD*bonusAD + T.rAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qMs=0; A.qMsMax=0; A.qDmg=0; }
      if(!learned.w){ A.wDmg=0; A.wHealMissPct=0; A.wHeal=0; }
      if(!learned.e){ A.eHpPct=0; A.eDmg=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["The Relentless Storm","Tempête impitoyable"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Thundering Smash", fr:"Q — Coup fulgurant"},
      {id:"w", kind:"spell", en:"W — Frenzied Maul", fr:"W — Folie mutilatrice"},
      {id:"e", kind:"spell", en:"E — Sky Splitter", fr:"E — Foudroiement"},
      {id:"r", kind:"spell", en:"R — Stormbringer", fr:"R — Tempête incarnée"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"thunderingSmash", v:A.qDmg, type:"phys"});
      if(st.id === "w"){
        out.parts.push({n:"frenziedMaul", v:A.wDmg, type:"phys"});
        out.heal = A.wHeal;
      }
      if(st.id === "e") out.parts.push({n:"skySplitter", v:A.eDmg + hp * A.eHpPct/100, type:"magic"});
      if(st.id === "r") out.parts.push({n:"stormbringer", v:A.rDmg, type:"phys"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("msBonus"), val:"+" + pc(A.qMs)},
         {lab:TR("msBonus"), val:"+" + pc(A.qMsMax)},
         {lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("sQpct"), val:pc(A.wHealMissPct)},
         {lab:TR("healing"), val:n0(A.wHeal)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("mPpct"), val:pc(A.eHpPct)},
         {lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q : 2 formes dans le wiki (Thundering Smash, Rolling Thunder) — seule la premiere est modelisee
   - W : 2 formes dans le wiki (Frenzied Maul, Frenzy) — seule la premiere est modelisee
   - E : 2 formes dans le wiki (Sky Splitter, Majestic Roar) — seule la premiere est modelisee
   - R : 2 formes dans le wiki (Stormbringer, Thunder Claws) — seule la premiere est modelisee
   - W / Heal : « 8 to 20% of his missing health » est une part des PV du champion — le moteur ne suit pas ses PV courants, la valeur reste un pourcentage affiche
   - W / Minion Heal : ligne non modelisee (20*0.5 to 80*0.5 (+ 8*0.5 to 20*0.5% of his missing health))
   - E / Non-Champion Capped Damage : ligne non modelisee (150 to 610 (+ 70% AP))
   - R / Bonus Health : ligne non modelisee (175 to 525)
   - R / Turret Disable Duration : ligne non modelisee (2 to 4 seconds)
   - passif : 2 blocs dans le wiki (The Relentless Storm, Chosen of the Storm) — seul le premier est modelise
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
