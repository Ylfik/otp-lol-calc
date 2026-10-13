/* malzahar — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Malzahar.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"malzahar", name:"Malzahar", label:"Malzahar", splash:0,
    base:{hp:[580,101], mana:[375,28], ad:[55,3],
          ar:[18,4.7], mr:[30,1.3],
          as:0.625, asPerLevel:1.5, ms:335},
    abilities_meta:[
      {k:"q", en:"Call of the Void", fr:"Appel du Néant"},
      {k:"w", en:"Void Swarm", fr:"Nuée du Néant"},
      {k:"e", en:"Malefic Visions", fr:"Visions maléfiques"},
      {k:"r", en:"Nether Grasp", fr:"Poigne du Néant"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[70,105,140,175,210], qAP:0.55, qCc:[1,1.25,1.5,1.75,2], qCd:[6,6,6,6,6],
      wAdd:[12,14,16,18,20], wBonusAD:0.4, wAP:0.2, wCd:[8,8,8,8,8],
      eFlat:[80,115,150,185,220], eAP:0.8, eCd:[11,10,9,8,7],
      rFlat:[125,200,275], rAP:0.8, rTotalHpPct:[10,15,20], rTotalAP100:2.5, rCd:[140,110,80]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Call of the Void */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      A.qCc = R(T.qCc,qr);
      /* W — Void Swarm */
      A.wDmg = lerp(5,64.5,L) + R(T.wAdd,wr) + T.wBonusAD*bonusAD + T.wAP*ap;
      /* E — Malefic Visions */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      /* R — Nether Grasp */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.rTotalHpPct = R(T.rTotalHpPct,rr) + T.rTotalAP100*ap/100;   /* % des PV de la cible, applique dans onStep */
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qCc=0; }
      if(!learned.w){ A.wDmg=0; }
      if(!learned.e){ A.eDmg=0; }
      if(!learned.r){ A.rDmg=0; A.rTotalHpPct=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Void Shift","Plan du Néant"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Call of the Void", fr:"Q — Appel du Néant"},
      {id:"w", kind:"spell", en:"W — Void Swarm", fr:"W — Nuée du Néant"},
      {id:"e", kind:"spell", en:"E — Malefic Visions", fr:"E — Visions maléfiques"},
      {id:"r", kind:"spell", en:"R — Nether Grasp", fr:"R — Poigne du Néant"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"callOfTheVoid", v:A.qDmg, type:"magic"});
      if(st.id === "w") out.parts.push({n:"voidSwarm", v:A.wDmg, type:"magic"});
      if(st.id === "e") out.parts.push({n:"maleficVisions", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"netherGrasp", v:A.rDmg + hp * A.rTotalHpPct/100, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("comboTime"), val:n0(A.qCc)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("mPpct"), val:pc(A.rTotalHpPct)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - W / Voidling Duration : ligne non modelisee (8 seconds)
   - W / Minion Damage : ligne non modelisee ((5+3.5*(x-1)*(0.7025+0.0175*(x-1)))*3 (+ 12*3 to 20*3) (+ 40*3% bonus AD) (+ 20*3% AP))
   - E : pas de ligne de degats simple, « Total Magic Damage » prise comme ligne principale
   - E / Magic Damage Per Tick : ligne non modelisee (80/16 to 220/16 (+ 80/16% AP))
   - R : pas de ligne de degats simple, « Total Magic Damage » prise comme ligne principale
   - R / Magic Damage Per Tick : ligne non modelisee (125/10 to 275/10 (+ 8% AP))
   - R / Magic Damage Per Tick : ligne non modelisee (10/10 to 20/10% (+ 0.25% per 100 AP) of target's maximum health)
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
