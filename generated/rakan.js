/* rakan — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Rakan.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"rakan", name:"Rakan", label:"Rakan", splash:0,
    base:{hp:[610,99], mana:[315,50], ad:[62,3.5],
          ar:[30,4.9], mr:[32,2.05],
          as:0.635, asPerLevel:3, ms:335},
    abilities_meta:[
      {k:"q", en:"Gleaming Quill", fr:"Rémige rayonnante"},
      {k:"w", en:"Grand Entrance", fr:"Entrée triomphale"},
      {k:"e", en:"Battle Dance", fr:"Valse guerrière"},
      {k:"r", en:"The Quickness", fr:"Danse ultime"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[70,115,160,205,250], qAP:0.7, qCd:[11,10,9,8,7],
      wFlat:[70,120,170,220,270], wAP:0.8, wCd:[14,13,12,11,10],
      eShield:[50,75,100,125,150], eShieldAP:0.7, eCd:[20,18,16,14,12],
      rFlat:[100,200,300], rAP:0.5, rCc:[1,1.25,1.5], rCd:[130,110,90]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Gleaming Quill */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      /* W — Grand Entrance */
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      /* E — Battle Dance */
      A.eShield = R(T.eShield,er) + T.eShieldAP*ap;
      /* R — The Quickness */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.rCc = R(T.rCc,rr);
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wDmg=0; }
      if(!learned.e){ A.eShield=0; }
      if(!learned.r){ A.rDmg=0; A.rCc=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Fey Feathers","Plumes enchantées"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Gleaming Quill", fr:"Q — Rémige rayonnante"},
      {id:"w", kind:"spell", en:"W — Grand Entrance", fr:"W — Entrée triomphale"},
      {id:"e", kind:"cast", label:"E", en:"E — Battle Dance", fr:"E — Valse guerrière"},
      {id:"r", kind:"spell", en:"R — The Quickness", fr:"R — Danse ultime"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"gleamingQuill", v:A.qDmg, type:"magic"});
      if(st.id === "w") out.parts.push({n:"grandEntrance", v:A.wDmg, type:"magic"});
      if(st.id === "e") out.shield = A.eShield;
      if(st.id === "r") out.parts.push({n:"theQuickness", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("shield"), val:n0(A.eShield)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("comboTime"), val:n0(A.rCc)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
