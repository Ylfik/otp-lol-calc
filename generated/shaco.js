/* shaco — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Shaco.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"shaco", name:"Shaco", label:"Shaco", splash:0,
    base:{hp:[630,99], mana:[297,40], ad:[63,3],
          ar:[30,4], mr:[32,2.05],
          as:0.694, asPerLevel:3, ms:345},
    abilities_meta:[
      {k:"q", en:"Deceive", fr:"Tromperie"},
      {k:"w", en:"Jack In The Box", fr:"Boîte surprise"},
      {k:"e", en:"Two-Shiv Poison", fr:"Poison double"},
      {k:"r", en:"Hallucinate", fr:"Hallucination"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[25,35,45,55,65], qBonusAD:0.6, qCd:[13,12.5,12,11.5,11],
      wCc:[0.5,0.75,1,1.25,1.5], wCcRoot:[0.5,0.75,1,1,1], wCcSlow:[0.8,1.05,1.3,1.55,1.8], wFlat:[10,15,20,25,30], wAP:0.12, wMax:[25,40,55,70,85], wMaxAP:0.18, wCd:[15,15,15,15,15],
      eSlow:[20,22.5,25,27.5,30], eFlat:[70,95,120,145,170], eBonusAD:0.8, eAP:0.6, eMax:[105,142.5,180,217.5,255], eMaxBonusAD:1.2, eMaxAP:0.9, eSlowSlow:[20,22.5,25,27.5,30], eCd:[8,8,8,8,8],
      rFlat:[150,225,300], rAP:0.7, rModified:[10,20,30], rModifiedAP:0.1, rMax:[25,50,75], rMaxAP:0.15, rCd:[100,90,80]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Deceive */
      A.qDmg = R(T.qFlat,qr) + T.qBonusAD*bonusAD;
      /* W — Jack In The Box */
      A.wCc = R(T.wCc,wr);
      A.wCcRoot = R(T.wCcRoot,wr);
      A.wCcSlow = R(T.wCcSlow,wr);
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      A.wMax = R(T.wMax,wr) + T.wMaxAP*ap;
      /* E — Two-Shiv Poison */
      A.eSlow = R(T.eSlow,er);
      A.eDmg = R(T.eFlat,er) + T.eBonusAD*bonusAD + T.eAP*ap;
      A.eMax = R(T.eMax,er) + T.eMaxBonusAD*bonusAD + T.eMaxAP*ap;
      A.eSlowSlow = R(T.eSlowSlow,er);
      /* R — Hallucinate */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.rModified = R(T.rModified,rr) + T.rModifiedAP*ap;
      A.rMax = R(T.rMax,rr) + T.rMaxAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wCc=0; A.wCcRoot=0; A.wCcSlow=0; A.wDmg=0; A.wMax=0; }
      if(!learned.e){ A.eSlow=0; A.eDmg=0; A.eMax=0; A.eSlowSlow=0; }
      if(!learned.r){ A.rDmg=0; A.rModified=0; A.rMax=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Backstab","Traîtrise"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Deceive", fr:"Q — Tromperie"},
      {id:"w", kind:"spell", en:"W — Jack In The Box", fr:"W — Boîte surprise"},
      {id:"e", kind:"spell", en:"E — Two-Shiv Poison", fr:"E — Poison double"},
      {id:"r", kind:"spell", en:"R — Hallucinate", fr:"R — Hallucination"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"deceive", v:A.qDmg, type:"phys"});
      if(st.id === "w") out.parts.push({n:"jackInTheBox", v:A.wDmg, type:"magic"});
      if(st.id === "e") out.parts.push({n:"twoShivPoison", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"hallucinate", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("comboTime"), val:n0(A.wCc)},
         {lab:TR("comboTime"), val:n0(A.wCcRoot)},
         {lab:TR("comboTime"), val:n0(A.wCcSlow)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("slow"), val:pc(A.eSlow)},
         {lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("damage"), val:n0(A.eMax)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("damage"), val:n0(A.rModified)},
         {lab:TR("damage"), val:n0(A.rMax)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q / Invisibility Duration : ligne non modelisee (2.5 to 3.5 seconds)
   - W / Bonus Monster Damage : ligne non modelisee (20 to 80)
   - W / Total Monster Damage : ligne non modelisee (10+20 to 30+80 (+ 12% AP))
   - W / Increased Monster Damage : ligne non modelisee (25+20 to 85+80 (+ 18% AP))
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
