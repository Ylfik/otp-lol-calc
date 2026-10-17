/* monkeyking — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Wukong.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"monkeyking", name:"MonkeyKing", label:"Wukong", splash:0,
    base:{hp:[610,99], mana:[330,65], ad:[66,3.5],
          ar:[31,4.7], mr:[28,2.05],
          as:0.69, asPerLevel:3, ms:340},
    abilities_meta:[
      {k:"q", en:"Crushing Blow", fr:"Écrasement"},
      {k:"w", en:"Warrior Trickster", fr:"Guerrier espiègle"},
      {k:"e", en:"Nimbus Strike", fr:"Nimbus"},
      {k:"r", en:"Cyclone", fr:"Cyclone"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[20,45,70,95,120], qBonusAD:0.5, qCd:[8,7.5,7,6.5,6],
      wCd:[22,21,20,19,18],
      eFlat:[80,120,160,200,240], eAP:1, eAS:[40,45,50,55,60], eCd:[10,9.25,8.5,7.75,7],
      rHpPct:[8,12,16], rAD:2.75, rMaxHpPct:[16,24,32], rMaxAD:5.5, rCd:[130,110,90]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Crushing Blow */
      A.qDmg = R(T.qFlat,qr) + T.qBonusAD*bonusAD;
      /* E — Nimbus Strike */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      A.eAS = R(T.eAS,er);
      /* R — Cyclone */
      A.rHpPct = R(T.rHpPct,rr) + T.rAD*tot.ad;   /* % des PV de la cible, applique dans onStep */
      A.rMaxHpPct = R(T.rMaxHpPct,rr) + T.rMaxAD*tot.ad;   /* % des PV de la cible, applique dans onStep */
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.e){ A.eDmg=0; A.eAS=0; }
      if(!learned.r){ A.rHpPct=0; A.rMaxHpPct=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Stone Skin","Peau de pierre"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Crushing Blow", fr:"Q — Écrasement"},
      {id:"e", kind:"spell", en:"E — Nimbus Strike", fr:"E — Nimbus"},
      {id:"r", kind:"spell", en:"R — Cyclone", fr:"R — Cyclone"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"crushingBlow", v:A.qDmg, type:"phys"});
      if(st.id === "e"){
        out.parts.push({n:"nimbusStrike", v:A.eDmg, type:"magic"});
        out.asBonus = A.eAS;
      }
      if(st.id === "r") out.parts.push({n:"cyclone", v:hp * A.rHpPct/100 + hp * A.rMaxHpPct/100, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("bonusAs"), val:"+" + pc(A.eAS)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("mPpct"), val:pc(A.rHpPct)},
         {lab:TR("mPpct"), val:pc(A.rMaxHpPct)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - W : 2 formes dans le wiki (Warrior Trickster, Decoy) — seule la premiere est modelisee
   - Q / Bonus Range : ligne non modelisee (135 to 175)
   - Q / Armor Reduction : ligne non modelisee (10 to 30% of target's armor)
   - W / Clone Outgoing Damage : ligne non modelisee (40 to 60%)
   - R : pas de ligne de degats simple, « Total Physical Damage » prise comme ligne principale
   - R / Physical Damage Per Tick : ligne non modelisee (8/8 to 16/8% of target's maximum health (+ 275/8% AD))
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   - R : « Cyclone » invoque une unite — ses propres degats ne sont pas dans les donnees de la competence
   ------------------------------------------------------------------ */
