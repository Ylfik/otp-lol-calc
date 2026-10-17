/* kassadin — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Kassadin.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"kassadin", name:"Kassadin", label:"Kassadin", splash:0,
    base:{hp:[646,113], mana:[400,87], ad:[59,3.9],
          ar:[21,4], mr:[30,1.3],
          as:0.64, asPerLevel:3.7, ms:335},
    abilities_meta:[
      {k:"q", en:"Null Sphere", fr:"Orbe du Néant"},
      {k:"w", en:"Nether Blade", fr:"Lame éthérée"},
      {k:"e", en:"Force Pulse", fr:"Pulsation"},
      {k:"r", en:"Riftwalk", fr:"Fissure"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[65,95,125,155,185], qAP:0.8, qShield:[80,110,140,170,200], qShieldAP:0.3, qCd:[9,8.5,8,7.5,7],
      wFlat:[50,75,100,125,150], wAP:0.8, wCd:[7,7,7,7,7],
      eFlat:[70,100,130,160,190], eAP:0.7, eSlow:[50,55,60,65,70], eCd:[21,20,19,18,17],
      rFlat:[80,95,110], rAP:0.5, rMaxMana:0.02, rPerStack:[35,45,55], rPerStackAP:0.07, rPerStackMaxMana:0.01, rMax:[140,180,220], rMaxAP:0.28, rMaxMaxMana:0.04, rCd:[5,3.5,2]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Null Sphere */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      A.qShield = R(T.qShield,qr) + T.qShieldAP*ap;
      /* W — Nether Blade */
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      /* E — Force Pulse */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      A.eSlow = R(T.eSlow,er);
      /* R — Riftwalk */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap + T.rMaxMana*tot.mana;
      A.rPerStack = R(T.rPerStack,rr) + T.rPerStackAP*ap + T.rPerStackMaxMana*tot.mana;
      A.rMax = R(T.rMax,rr) + T.rMaxAP*ap + T.rMaxMaxMana*tot.mana;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qShield=0; }
      if(!learned.w){ A.wDmg=0; }
      if(!learned.e){ A.eDmg=0; A.eSlow=0; }
      if(!learned.r){ A.rDmg=0; A.rPerStack=0; A.rMax=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Void Stone","Pierre du Néant"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Null Sphere", fr:"Q — Orbe du Néant"},
      {id:"w", kind:"spell", en:"W — Nether Blade", fr:"W — Lame éthérée"},
      {id:"e", kind:"spell", en:"E — Force Pulse", fr:"E — Pulsation"},
      {id:"r", kind:"spell", en:"R — Riftwalk", fr:"R — Fissure"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q"){
        out.parts.push({n:"nullSphere", v:A.qDmg, type:"magic"});
        out.shield = A.qShield;
      }
      if(st.id === "w") out.parts.push({n:"netherBlade", v:A.wDmg, type:"magic"});
      if(st.id === "e") out.parts.push({n:"forcePulse", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"riftwalk", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("shield"), val:n0(A.qShield)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("slow"), val:pc(A.eSlow)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("damage"), val:n0(A.rPerStack)},
         {lab:TR("damage"), val:n0(A.rMax)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - W : pas de ligne de degats simple, « Increased Bonus Magic Damage » prise comme ligne principale
   - W / Mana Restored : ligne non modelisee (4 to 6% of missing mana)
   - W / Mana Restored Against Champions : ligne non modelisee (4*5 to 6*5% of missing mana)
   - R / Maximum Magic Damage : doublon de Maximum Bonus Damage, ignore
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
