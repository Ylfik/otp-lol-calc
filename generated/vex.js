/* vex — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Vex.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"vex", name:"Vex", label:"Vex", splash:0,
    base:{hp:[590,104], mana:[490,32], ad:[54,2.75],
          ar:[23,4.45], mr:[28,1.3],
          as:0.669, asPerLevel:1, ms:335},
    abilities_meta:[
      {k:"q", en:"Mistral Bolt", fr:"Mistral perdant"},
      {k:"w", en:"Personal Space", fr:"Lâchez-moi !"},
      {k:"e", en:"Looming Darkness", fr:"Ténèbres imminentes"},
      {k:"r", en:"Shadow Surge", fr:"Déferlement d'Ombre"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[70,115,160,205,250], qAP:0.7, qCd:[8,7,6,5,4],
      wShield:[50,75,100,125,150], wShieldAP:0.75, wFlat:[80,120,160,200,240], wAP:0.3, wCd:[16,15,14,13,12],
      eFlat:[50,70,90,110,130], eAP:[0.4,0.45,0.5,0.55,0.6], eSlow:[30,35,40,45,50], eCd:[12,12,12,12,12],
      rFlat:[75,125,175], rAP:0.2, rTotal:[225,375,525], rTotalAP:0.7, rCd:[140,120,100]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Mistral Bolt */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      /* W — Personal Space */
      A.wShield = R(T.wShield,wr) + T.wShieldAP*ap;
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      /* E — Looming Darkness */
      A.eDmg = R(T.eFlat,er) + R(T.eAP,er)*ap;
      A.eSlow = R(T.eSlow,er);
      /* R — Shadow Surge */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.rTotal = R(T.rTotal,rr) + T.rTotalAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wShield=0; A.wDmg=0; }
      if(!learned.e){ A.eDmg=0; A.eSlow=0; }
      if(!learned.r){ A.rDmg=0; A.rTotal=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Doom 'n Gloom","Malheur et Désespoir"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Mistral Bolt", fr:"Q — Mistral perdant"},
      {id:"w", kind:"spell", en:"W — Personal Space", fr:"W — Lâchez-moi !"},
      {id:"e", kind:"spell", en:"E — Looming Darkness", fr:"E — Ténèbres imminentes"},
      {id:"r", kind:"spell", en:"R — Shadow Surge", fr:"R — Déferlement d'Ombre"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"mistralBolt", v:A.qDmg, type:"magic"});
      if(st.id === "w"){
        out.parts.push({n:"personalSpace", v:A.wDmg, type:"magic"});
        out.shield = A.wShield;
      }
      if(st.id === "e") out.parts.push({n:"loomingDarkness", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"shadowSurge", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("shield"), val:n0(A.wShield)},
         {lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("slow"), val:pc(A.eSlow)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("damage"), val:n0(A.rTotal)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - R / Magic Damage : doublon de Magic Damage, ignore
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
