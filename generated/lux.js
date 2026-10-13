/* lux — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Lux.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"lux", name:"Lux", label:"Lux", splash:0,
    base:{hp:[580,99], mana:[440,23.5], ad:[54,3.3],
          ar:[21,5.2], mr:[30,1.3],
          as:0.669, asPerLevel:3, ms:330},
    abilities_meta:[
      {k:"q", en:"Light Binding", fr:"Entrave de lumière"},
      {k:"w", en:"Prismatic Barrier", fr:"Barrière prismatique"},
      {k:"e", en:"Lucent Singularity", fr:"Anomalie radieuse"},
      {k:"r", en:"Final Spark", fr:"Éclat final"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[80,120,160,200,240], qAP:0.75, qCd:[10,10,10,10,10],
      wShield:[40,55,70,85,100], wShieldAP:0.4, wShieldMax:[80,110,140,170,200], wShieldMaxAP:0.8, wCd:[12,11.5,11,10.5,10],
      eSlow:[25,30,35,40,45], eFlat:[65,115,165,215,265], eAP:0.8, eCd:[10,9.5,9,8.5,8],
      rFlat:[300,400,500], rAP:1.2, rCd:[60,50,40]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Light Binding */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      /* W — Prismatic Barrier */
      A.wShield = R(T.wShield,wr) + T.wShieldAP*ap;
      A.wShieldMax = R(T.wShieldMax,wr) + T.wShieldMaxAP*ap;
      /* E — Lucent Singularity */
      A.eSlow = R(T.eSlow,er);
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      /* R — Final Spark */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wShield=0; A.wShieldMax=0; }
      if(!learned.e){ A.eSlow=0; A.eDmg=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Illumination","Illumination"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Light Binding", fr:"Q — Entrave de lumière"},
      {id:"w", kind:"cast", label:"W", en:"W — Prismatic Barrier", fr:"W — Barrière prismatique"},
      {id:"e", kind:"spell", en:"E — Lucent Singularity", fr:"E — Anomalie radieuse"},
      {id:"r", kind:"spell", en:"R — Final Spark", fr:"R — Éclat final"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"lightBinding", v:A.qDmg, type:"magic"});
      if(st.id === "w") out.shield = A.wShield;
      if(st.id === "e") out.parts.push({n:"lucentSingularity", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"finalSpark", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("shield"), val:n0(A.wShield)},
         {lab:TR("shield"), val:n0(A.wShieldMax)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("slow"), val:pc(A.eSlow)},
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
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
