/* ashe — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Ashe.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"ashe", name:"Ashe", label:"Ashe", splash:0,
    base:{hp:[610,101], mana:[280,35], ad:[59,3],
          ar:[26,4.6], mr:[33,1.1],
          as:0.658, asPerLevel:3, ms:325},
    abilities_meta:[
      {k:"q", en:"Ranger's Focus", fr:"Concentration du ranger"},
      {k:"w", en:"Volley", fr:"Salve"},
      {k:"e", en:"Hawkshot", fr:"Rapace"},
      {k:"r", en:"Enchanted Crystal Arrow", fr:"Flèche de cristal enchantée"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qAS:[20,30,40,50,60],
      wFlat:[60,95,130,165,200], wBonusAD:1, wCd:[18,14.5,11,7.5,4],
      eCd:[5,5,5,5,5],
      rFlat:[200,400,600], rAP:1.2, rCd:[100,80,60]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Ranger's Focus */
      A.qAS = R(T.qAS,qr);
      /* W — Volley */
      A.wDmg = R(T.wFlat,wr) + T.wBonusAD*bonusAD;
      /* R — Enchanted Crystal Arrow */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qAS=0; }
      if(!learned.w){ A.wDmg=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Frost Shot","Tir givrant"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"cast", label:"Q", en:"Q — Ranger's Focus", fr:"Q — Concentration du ranger"},
      {id:"w", kind:"spell", en:"W — Volley", fr:"W — Salve"},
      {id:"r", kind:"spell", en:"R — Enchanted Crystal Arrow", fr:"R — Flèche de cristal enchantée"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.asBonus = A.qAS;
      if(st.id === "w") out.parts.push({n:"volley", v:A.wDmg, type:"phys"});
      if(st.id === "r") out.parts.push({n:"enchantedCrystalArrow", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("bonusAs"), val:"+" + pc(A.qAS)}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
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
   - Q / Physical Damage Per Arrow : ligne non modelisee (110/5 to 130/5% AD)
   - Q / Total Damage Per Flurry : ligne non modelisee (110 to 130% AD)
   - Q : aucune recharge dans les donnees wiki
   - W / Arrows : ligne non modelisee (7 to 11)
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
