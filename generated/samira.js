/* samira — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Samira.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"samira", name:"Samira", label:"Samira", splash:0,
    base:{hp:[630,108], mana:[349,38], ad:[57,3],
          ar:[26,4.7], mr:[33,1.1],
          as:0.658, asPerLevel:3.3, ms:335},
    abilities_meta:[
      {k:"q", en:"Flair", fr:"Panache"},
      {k:"w", en:"Blade Whirl", fr:"Tourbillon de lame"},
      {k:"e", en:"Wild Rush", fr:"Charge sauvage"},
      {k:"r", en:"Inferno Trigger", fr:"Gâchette infernale"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[0,5,10,15,20], qAD:1.1, qCd:[6,5,4,3,2],
      wFlat:[40,70,100,130,160], wBonusAD:1, wCd:[30,28,26,24,22],
      eFlat:[50,60,70,80,90], eBonusAD:0.2, eAS:[20,25,30,35,40], eCd:[20,18,16,14,12],
      rFlat:[200,400,600], rAD:3
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Flair */
      A.qDmg = R(T.qFlat,qr) + T.qAD*tot.ad;
      /* W — Blade Whirl */
      A.wDmg = R(T.wFlat,wr) + T.wBonusAD*bonusAD;
      /* E — Wild Rush */
      A.eDmg = R(T.eFlat,er) + T.eBonusAD*bonusAD;
      A.eAS = R(T.eAS,er);
      /* R — Inferno Trigger */
      A.rDmg = R(T.rFlat,rr) + T.rAD*tot.ad;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wDmg=0; }
      if(!learned.e){ A.eDmg=0; A.eAS=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Daredevil Impulse","Élan téméraire"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Flair", fr:"Q — Panache"},
      {id:"w", kind:"spell", en:"W — Blade Whirl", fr:"W — Tourbillon de lame"},
      {id:"e", kind:"spell", en:"E — Wild Rush", fr:"E — Charge sauvage"},
      {id:"r", kind:"spell", en:"R — Inferno Trigger", fr:"R — Gâchette infernale"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"flair", v:A.qDmg, type:"phys"});
      if(st.id === "w") out.parts.push({n:"bladeWhirl", v:A.wDmg, type:"phys"});
      if(st.id === "e"){
        out.parts.push({n:"wildRush", v:A.eDmg, type:"magic"});
        out.asBonus = A.eAS;
      }
      if(st.id === "r") out.parts.push({n:"infernoTrigger", v:A.rDmg, type:"phys"});
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
         {lab:TR("bonusAs"), val:"+" + pc(A.eAS)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - slot non reconnu « CTRL+2 » pour Taunt
   - W : pas de ligne de degats simple, « Total Physical Damage » prise comme ligne principale
   - W / Physical Damage per Hit : ligne non modelisee (20 to 80 (+ 50% bonus AD))
   - R : pas de ligne de degats simple, « Total Physical Damage » prise comme ligne principale
   - R / Physical Damage Per Shot : ligne non modelisee (20 to 60 (+ 30% AD))
   - R / Minion Damage Per Shot : ligne non modelisee (20*0.25 to 60*0.25 (+ 30*0.25% AD))
   - R / Total Minion Damage : ligne non modelisee (20*0.25*10 to 60*0.25*10 (+ 30*0.25*10% AD))
   - R : aucune recharge dans les donnees wiki
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
