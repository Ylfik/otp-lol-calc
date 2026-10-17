/* kayle — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Kayle.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"kayle", name:"Kayle", label:"Kayle", splash:0,
    base:{hp:[670,92], mana:[330,50], ad:[50,2.5],
          ar:[26,4.2], mr:[22,1.3],
          as:0.625, asPerLevel:1.5, ms:335},
    abilities_meta:[
      {k:"q", en:"Radiant Blast", fr:"Incandescence"},
      {k:"w", en:"Celestial Blessing", fr:"Bénédiction céleste"},
      {k:"e", en:"Starfire Spellblade", fr:"Lame de feu stellaire"},
      {k:"r", en:"Divine Judgment", fr:"Jugement divin"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[60,90,120,150,180], qBonusAD:0.6, qAP:0.5, qSlow:[25,30,35,40,45], qCd:[12,11,10,9,8],
      wHeal:[55,80,105,130,155], wHealAP:0.25, wMs:[24,28,32,36,40], wMsAP100:8, wCd:[15,15,15,15,15],
      eFlat:[15,20,25,30,35], eBonusAD:0.1, eAP:0.2, eMissPct:[8,8.5,9,9.5,10], eAP100:1.5, eCd:[8,7.5,7,6.5,6],
      rFlat:[200,300,400], rBonusAD:1, rAP:0.7, rCd:[160,120,80]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Radiant Blast */
      A.qDmg = R(T.qFlat,qr) + T.qBonusAD*bonusAD + T.qAP*ap;
      A.qSlow = R(T.qSlow,qr);
      /* W — Celestial Blessing */
      A.wHeal = R(T.wHeal,wr) + T.wHealAP*ap;
      A.wMs = R(T.wMs,wr) + T.wMsAP100*ap/100;
      /* E — Starfire Spellblade */
      A.eDmg = R(T.eFlat,er) + T.eBonusAD*bonusAD + T.eAP*ap;
      A.eMissPct = R(T.eMissPct,er) + T.eAP100*ap/100;   /* % des PV de la cible, applique dans onStep */
      /* R — Divine Judgment */
      A.rDmg = R(T.rFlat,rr) + T.rBonusAD*bonusAD + T.rAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qSlow=0; }
      if(!learned.w){ A.wHeal=0; A.wMs=0; }
      if(!learned.e){ A.eDmg=0; A.eMissPct=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Divine Ascent","Ascension divine"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Radiant Blast", fr:"Q — Incandescence"},
      {id:"w", kind:"cast", label:"W", en:"W — Celestial Blessing", fr:"W — Bénédiction céleste"},
      {id:"e", kind:"spell", en:"E — Starfire Spellblade", fr:"E — Lame de feu stellaire"},
      {id:"r", kind:"spell", en:"R — Divine Judgment", fr:"R — Jugement divin"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"radiantBlast", v:A.qDmg, type:"magic"});
      if(st.id === "w") out.heal = A.wHeal;
      if(st.id === "e") out.parts.push({n:"starfireSpellblade", v:A.eDmg + Math.max(0, hp - cur) * A.eMissPct/100, type:"magic"});
      if(st.id === "r") out.parts.push({n:"divineJudgment", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("slow"), val:pc(A.qSlow)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("healing"), val:n0(A.wHeal)},
         {lab:TR("msBonus"), val:"+" + pc(A.wMs)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("mPpct"), val:pc(A.eMissPct)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
