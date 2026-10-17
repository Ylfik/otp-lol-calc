/* janna — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Janna.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"janna", name:"Janna", label:"Janna", splash:0,
    base:{hp:[570,90], mana:[360,50], ad:[47,2.5],
          ar:[28,4.5], mr:[30,1.3],
          as:0.625, asPerLevel:3, ms:325},
    abilities_meta:[
      {k:"q", en:"Howling Gale", fr:"Vent hurlant"},
      {k:"w", en:"Zephyr", fr:"Alizé"},
      {k:"e", en:"Eye Of The Storm", fr:"Œil du cyclone"},
      {k:"r", en:"Monsoon", fr:"Mousson"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[55,90,125,160,195], qAP:0.5, qMax:[85,135,185,235,285], qMaxAP:0.8, qCd:[14,14,14,14,14],
      wMs:[6,7,8,9,10], wMsAP100:2, wFlat:[55,85,115,145,175], wAP:0.5, wSlow:[20,24,28,32,36], wSlowAP100:6, wCd:[8,7.5,7,6.5,6],
      eShield:[80,120,160,200,240], eShieldAP:0.55, eFlat:[10,15,20,25,30], eAP:0.1, eCd:[16,15,14,13,12],
      rHealTotal:[300,450,600], rHealTotalAP:1.5, rCd:[130,115,100]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Howling Gale */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      A.qMax = R(T.qMax,qr) + T.qMaxAP*ap;
      /* W — Zephyr */
      A.wMs = R(T.wMs,wr) + T.wMsAP100*ap/100;
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      A.wSlow = R(T.wSlow,wr) + T.wSlowAP100*ap/100;
      /* E — Eye Of The Storm */
      A.eShield = R(T.eShield,er) + T.eShieldAP*ap;
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      /* R — Monsoon */
      A.rHealTotal = R(T.rHealTotal,rr) + T.rHealTotalAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qMax=0; }
      if(!learned.w){ A.wMs=0; A.wDmg=0; A.wSlow=0; }
      if(!learned.e){ A.eShield=0; A.eDmg=0; }
      if(!learned.r){ A.rHealTotal=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Tailwind","Zéphyr"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Howling Gale", fr:"Q — Vent hurlant"},
      {id:"w", kind:"spell", en:"W — Zephyr", fr:"W — Alizé"},
      {id:"e", kind:"spell", en:"E — Eye Of The Storm", fr:"E — Œil du cyclone"},
      {id:"r", kind:"cast", label:"R", en:"R — Monsoon", fr:"R — Mousson"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"howlingGale", v:A.qDmg, type:"magic"});
      if(st.id === "w") out.parts.push({n:"zephyr", v:A.wDmg, type:"magic"});
      if(st.id === "e"){
        out.parts.push({n:"eyeOfTheStorm", v:A.eDmg, type:"magic"});
        out.shield = A.eShield;
      }
      if(st.id === "r") out.heal = A.rHealTotal;
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("damage"), val:n0(A.qMax)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("msBonus"), val:"+" + pc(A.wMs)},
         {lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("slow"), val:pc(A.wSlow)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("shield"), val:n0(A.eShield)},
         {lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("healing"), val:n0(A.rHealTotal)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q : pas de ligne de degats simple, « Minimum Magic Damage » prise comme ligne principale
   - Q / Bonus Damage Per Second : ligne non modelisee (10 to 30 (+ 10% AP))
   - W / Magic Damage : ratio sans statistique « 30% bonus movement speed » non modelise
   - R / Heal Per Tick : ligne non modelisee (300/12 to 600/12 (+ 150/12% AP))
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
