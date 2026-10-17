/* jarvaniv — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Jarvan IV.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"jarvaniv", name:"JarvanIV", label:"Jarvan IV", splash:0,
    base:{hp:[640,104], mana:[300,55], ad:[64,3],
          ar:[36,4.6], mr:[32,2.05],
          as:0.658, asPerLevel:2.5, ms:340},
    abilities_meta:[
      {k:"q", en:"Dragon Strike", fr:"Frappe du dragon"},
      {k:"w", en:"Golden Aegis", fr:"Égide dorée"},
      {k:"e", en:"Demacian Standard", fr:"Étendard demacien"},
      {k:"r", en:"Cataclysm", fr:"Cataclysme"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[90,130,170,210,250], qBonusAD:1.45, qCd:[10,9,8,7,6],
      wSlow:[15,20,25,30,35], wShield:[60,80,100,120,140], wShieldBonusAD:0.7, wCd:[9,9,9,9,9],
      eAS:[20,22.5,25,27.5,30], eFlat:[80,120,160,200,240], eAP:0.8, eCd:[12,11.5,11,10.5,10],
      rFlat:[200,325,450], rBonusAD:1.8, rCd:[120,105,90]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Dragon Strike */
      A.qDmg = R(T.qFlat,qr) + T.qBonusAD*bonusAD;
      /* W — Golden Aegis */
      A.wSlow = R(T.wSlow,wr);
      A.wShield = R(T.wShield,wr) + T.wShieldBonusAD*bonusAD;
      /* E — Demacian Standard */
      A.eAS = R(T.eAS,er);
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      /* R — Cataclysm */
      A.rDmg = R(T.rFlat,rr) + T.rBonusAD*bonusAD;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wSlow=0; A.wShield=0; }
      if(!learned.e){ A.eAS=0; A.eDmg=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Martial Cadence","Cadence martiale"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Dragon Strike", fr:"Q — Frappe du dragon"},
      {id:"w", kind:"cast", label:"W", en:"W — Golden Aegis", fr:"W — Égide dorée"},
      {id:"e", kind:"spell", en:"E — Demacian Standard", fr:"E — Étendard demacien"},
      {id:"r", kind:"spell", en:"R — Cataclysm", fr:"R — Cataclysme"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"dragonStrike", v:A.qDmg, type:"phys"});
      if(st.id === "w") out.shield = A.wShield;
      if(st.id === "e"){
        out.parts.push({n:"demacianStandard", v:A.eDmg, type:"magic"});
        out.asBonus = A.eAS;
      }
      if(st.id === "r") out.parts.push({n:"cataclysm", v:A.rDmg, type:"phys"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("slow"), val:pc(A.wSlow)},
         {lab:TR("shield"), val:n0(A.wShield)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("bonusAs"), val:"+" + pc(A.eAS)},
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
   - Q / Armor Reduction : ligne non modelisee (10 to 26% of target's armor)
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
