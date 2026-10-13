/* ziggs — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Ziggs.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"ziggs", name:"Ziggs", label:"Ziggs", splash:0,
    base:{hp:[606,106], mana:[480,23.5], ad:[55,3.1],
          ar:[21,4.7], mr:[30,1.3],
          as:0.656, asPerLevel:2, ms:325},
    abilities_meta:[
      {k:"q", en:"Bouncing Bomb", fr:"Bombe rebondissante"},
      {k:"w", en:"Satchel Charge", fr:"Charge explosive"},
      {k:"e", en:"Hexplosive Minefield", fr:"Mines Hexplosives"},
      {k:"r", en:"Mega Inferno Bomb", fr:"Méga bombe infernale"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[80,130,180,230,280], qAP:[0.6,0.65,0.7,0.75,0.8], qCd:[6,5.5,5,4.5,4],
      wFlat:[70,105,140,175,210], wAP:0.5, wCd:[20,18,16,14,12],
      eFlat:[150,350,550,750,950], eAP:[1.25,1.5,1.75,2,2.25], eSlow:[10,20,30,40,50], eCd:[16,16,16,16,16],
      rCd:[120,95,70]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Bouncing Bomb */
      A.qDmg = R(T.qFlat,qr) + R(T.qAP,qr)*ap;
      /* W — Satchel Charge */
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      /* E — Hexplosive Minefield */
      A.eDmg = R(T.eFlat,er) + R(T.eAP,er)*ap;
      A.eSlow = R(T.eSlow,er);
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wDmg=0; }
      if(!learned.e){ A.eDmg=0; A.eSlow=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Short Fuse","Mèche courte"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Bouncing Bomb", fr:"Q — Bombe rebondissante"},
      {id:"w", kind:"spell", en:"W — Satchel Charge", fr:"W — Charge explosive"},
      {id:"e", kind:"spell", en:"E — Hexplosive Minefield", fr:"E — Mines Hexplosives"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"bouncingBomb", v:A.qDmg, type:"magic"});
      if(st.id === "w") out.parts.push({n:"satchelCharge", v:A.wDmg, type:"magic"});
      if(st.id === "e") out.parts.push({n:"hexplosiveMinefield", v:A.eDmg, type:"magic"});
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
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("slow"), val:pc(A.eSlow)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - W / Demolition Threshold : ligne non modelisee (25 to 35% of turret's maximum health)
   - E : pas de ligne de degats simple, « Maximum Total Magic Damage » prise comme ligne principale
   - E / Magic Damage per Mine : ligne non modelisee (30 to 190 (+ 25 to 45% AP))
   - E / Reduced Damage per Mine : ligne non modelisee (30*0.4 to 190*0.4 (+ 25*0.4 to 45*0.4% AP))
   - R / Epicenter Magic Damage : ligne non modelisee (300 to 700 (+ 100% AP))
   - R / Reduced Damage : ligne non modelisee (300*0.65 to 700*0.65 (+ 100*0.65% AP))
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
