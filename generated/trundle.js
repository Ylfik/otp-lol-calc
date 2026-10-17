/* trundle — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Trundle.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"trundle", name:"Trundle", label:"Trundle", splash:0,
    base:{hp:[650,110], mana:[340,45], ad:[68,4.5],
          ar:[37,4.5], mr:[32,2.05],
          as:0.67, asPerLevel:2.9, ms:350},
    abilities_meta:[
      {k:"q", en:"Chomp", fr:"Morsure"},
      {k:"w", en:"Frozen Domain", fr:"Royaume gelé"},
      {k:"e", en:"Pillar of Ice", fr:"Montagne de glace"},
      {k:"r", en:"Subjugate", fr:"Soumission"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[10,30,50,70,90], qAD:[0.15,0.25,0.35,0.45,0.55], qAttack:[20,25,30,35,40], qCd:[3.5,3.5,3.5,3.5,3.5],
      wAS:[30,50,70,90,110], wMs:[20,28,36,44,52], wCd:[18,17,16,15,14],
      eSlow:[34,38,42,46,50], eCd:[21,19.5,18,16.5,15],
      rHpPct:[20,25,30], rAP100:2, rHealTotalHpPct:[20,25,30], rHealTotalAP100:2, rMinHpPct:[10,12.5,15], rMinAP100:1, rHealMinHpPct:[10,12.5,15], rHealMinAP100:1, rCd:[120,100,80]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Chomp */
      A.qDmg = R(T.qFlat,qr) + R(T.qAD,qr)*tot.ad;
      A.qAttack = R(T.qAttack,qr);
      /* W — Frozen Domain */
      A.wAS = R(T.wAS,wr);
      A.wMs = R(T.wMs,wr);
      /* E — Pillar of Ice */
      A.eSlow = R(T.eSlow,er);
      /* R — Subjugate */
      A.rHpPct = R(T.rHpPct,rr) + T.rAP100*ap/100;   /* % des PV de la cible, applique dans onStep */
      A.rHealTotalHpPct = R(T.rHealTotalHpPct,rr) + T.rHealTotalAP100*ap/100;   /* % des PV de la cible, applique dans onStep */
      A.rMinHpPct = R(T.rMinHpPct,rr) + T.rMinAP100*ap/100;   /* % des PV de la cible, applique dans onStep */
      A.rHealMinHpPct = R(T.rHealMinHpPct,rr) + T.rHealMinAP100*ap/100;   /* % des PV de la cible, applique dans onStep */
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qAttack=0; }
      if(!learned.w){ A.wAS=0; A.wMs=0; }
      if(!learned.e){ A.eSlow=0; }
      if(!learned.r){ A.rHpPct=0; A.rHealTotalHpPct=0; A.rMinHpPct=0; A.rHealMinHpPct=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["King's Tribute","Tribut du roi"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Chomp", fr:"Q — Morsure"},
      {id:"w", kind:"cast", label:"W", en:"W — Frozen Domain", fr:"W — Royaume gelé"},
      {id:"e", kind:"cast", label:"E", en:"E — Pillar of Ice", fr:"E — Montagne de glace"},
      {id:"r", kind:"spell", en:"R — Subjugate", fr:"R — Soumission"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"chomp", v:A.qDmg, type:"phys"});
      if(st.id === "w") out.asBonus = A.wAS;
      if(st.id === "r") out.parts.push({n:"subjugate", v:hp * A.rHpPct/100 + hp * A.rHealTotalHpPct/100 + hp * A.rMinHpPct/100 + hp * A.rHealMinHpPct/100, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("damage"), val:n0(A.qAttack)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("bonusAs"), val:"+" + pc(A.wAS)},
         {lab:TR("msBonus"), val:"+" + pc(A.wMs)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("slow"), val:pc(A.eSlow)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("mPpct"), val:pc(A.rHpPct)},
         {lab:TR("mPpct"), val:pc(A.rHealTotalHpPct)},
         {lab:TR("mPpct"), val:pc(A.rMinHpPct)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q / Attack Damage Reduction : ligne non modelisee (20/2 to 40/2)
   - R : pas de ligne de degats simple, « Total Magic Damage » prise comme ligne principale
   - R / Magic Damage Per Second : ligne non modelisee (20/8 to 30/8% (+ 0.25% per 100 AP) of the target's maximum health)
   - R / Healing Per Second : ligne non modelisee (20/8 to 30/8% (+ 0.25% per 100 AP) of the target's maximum health)
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
