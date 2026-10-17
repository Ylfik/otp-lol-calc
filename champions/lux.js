/* Lux — genere depuis les donnees du wiki, puis complete a la main pour
   son passif.

   Illumination : les sorts de Lux marquent leur cible ; l'attaque de base
   suivante, ou Eclat final, consomme la marque. Le wiki ecrit ses chiffres
   dans la prose du passif et non dans ses lignes de donnees, d'ou la
   partie ecrite ici :

     « deal 30 to 200 (par niveau) (+ 35% AP) bonus magic damage »
       — data/champions/Lux, passif Illumination

   Verifie par tools/check-passives.js. */
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
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[80,120,160,200,240], qAP:0.75, qCd:[10,10,10,10,10],
      wShield:[40,55,70,85,100], wShieldAP:0.4, wShieldMax:[80,110,140,170,200], wShieldMaxAP:0.8, wCd:[12,11.5,11,10.5,10],
      eSlow:[25,30,35,40,45], eFlat:[65,115,165,215,265], eAP:0.8, eCd:[10,9.5,9,8.5,8],
      rFlat:[300,400,500], rAP:1.2, rCd:[60,50,40],
      /* passif : lineaire du niveau 1 au 18 */
      pFlat:[30,200], pAP:0.35
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
      /* Illumination — la marque, consommee par une attaque ou par R */
      A.pDmg = lerp(T.pFlat[0], T.pFlat[1], L) + T.pAP*ap;
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Illumination","Illumination"],
    l10n:{
      luxMark:["Illumination, on consuming the mark","Illumination, en consommant la marque"]
    },
    passiveRows(c){
      const {A, TR, n0} = c;
      return [{lab:TR("luxMark"), val:n0(A.pDmg)}];
    },
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"illum", kind:"spell", en:"Illumination (consume the mark)",
       fr:"Illumination (consommer la marque)"},
      {id:"q", kind:"spell", en:"Q — Light Binding", fr:"Q — Entrave de lumière"},
      {id:"w", kind:"cast", label:"W", en:"W — Prismatic Barrier", fr:"W — Barrière prismatique"},
      {id:"e", kind:"spell", en:"E — Lucent Singularity", fr:"E — Anomalie radieuse"},
      {id:"r", kind:"spell", en:"R — Final Spark", fr:"R — Éclat final"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "illum") out.parts.push({n:"illumination", v:A.pDmg, type:"magic"});
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

/* Le passif, que le generateur ne savait pas lire, est ecrit plus haut. */
