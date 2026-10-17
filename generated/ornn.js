/* ornn — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Ornn.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"ornn", name:"Ornn", label:"Ornn", splash:0,
    base:{hp:[660,109], mana:[341,65], ad:[69,3.5],
          ar:[33,5.2], mr:[32,2.05],
          as:0.625, asPerLevel:2, ms:335},
    abilities_meta:[
      {k:"q", en:"Volcanic Rupture", fr:"Fracture magmatique"},
      {k:"w", en:"Bellows Breath", fr:"Fournaise"},
      {k:"e", en:"Searing Charge", fr:"Ruée ardente"},
      {k:"r", en:"Call of the Forge God", fr:"Appel du dieu de la forge"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[20,45,70,95,120], qAD:1.1, qCd:[9,8.5,8,7.5,7],
      wHpPct:[12,13,14,15,16], wCd:[12,11.5,11,10.5,10],
      eFlat:[80,125,170,215,260], eArmor:0.4, eMr:0.4, eCd:[14,13.5,13,12.5,12],
      rFlat:[125,175,225], rAP:0.2, rSlow:[40,50,60], rTotal:[250,350,450], rTotalAP:0.4, rCd:[140,120,100]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Volcanic Rupture */
      A.qDmg = R(T.qFlat,qr) + T.qAD*tot.ad;
      /* W — Bellows Breath */
      A.wHpPct = R(T.wHpPct,wr);   /* % des PV de la cible, applique dans onStep */
      /* E — Searing Charge */
      A.eDmg = R(T.eFlat,er) + T.eArmor*tot.ar + T.eMr*tot.mr;
      /* R — Call of the Forge God */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.rSlow = R(T.rSlow,rr);
      A.rTotal = R(T.rTotal,rr) + T.rTotalAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wHpPct=0; }
      if(!learned.e){ A.eDmg=0; }
      if(!learned.r){ A.rDmg=0; A.rSlow=0; A.rTotal=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Living Forge","Forgeron ambulant"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Volcanic Rupture", fr:"Q — Fracture magmatique"},
      {id:"w", kind:"spell", en:"W — Bellows Breath", fr:"W — Fournaise"},
      {id:"e", kind:"spell", en:"E — Searing Charge", fr:"E — Ruée ardente"},
      {id:"r", kind:"spell", en:"R — Call of the Forge God", fr:"R — Appel du dieu de la forge"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"volcanicRupture", v:A.qDmg, type:"phys"});
      if(st.id === "w") out.parts.push({n:"bellowsBreath", v:hp * A.wHpPct/100, type:"magic"});
      if(st.id === "e") out.parts.push({n:"searingCharge", v:A.eDmg, type:"phys"});
      if(st.id === "r") out.parts.push({n:"callOfTheForgeGod", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("mPpct"), val:pc(A.wHpPct)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("slow"), val:pc(A.rSlow)},
         {lab:TR("damage"), val:n0(A.rTotal)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - W : pas de ligne de degats simple, « Total Magic Damage » prise comme ligne principale
   - W / Magic Damage Per Tick : ligne non modelisee (12/5 to 16/5% of target's maximum health)
   - W / Total Minimum/Minion Damage : ligne non modelisee (80 to 280)
   - W / Minimum/Minion Damage Per Tick : ligne non modelisee (80/5 to 280/5)
   - W / Total Monster Damage Cap : ligne non modelisee (260 to 500)
   - W / Monster Damage Cap Per Tick : ligne non modelisee (260/5 to 500/5)
   - E / Physical Damage : « 40% bonus armor » est lu comme une part des resistances DU CHAMPION — a verifier, le wiki ne le dit pas toujours
   - E / Physical Damage : « 40% bonus magic resistance » est lu comme une part des resistances DU CHAMPION — a verifier, le wiki ne le dit pas toujours
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
