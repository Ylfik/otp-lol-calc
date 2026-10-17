/* yone — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Yone.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"yone", name:"Yone", label:"Yone", splash:0,
    base:{hp:[620,105], mana:[500,0], ad:[62,2],
          ar:[33,4.6], mr:[32,2.05],
          as:0.625, asPerLevel:3.5, ms:345},
    abilities_meta:[
      {k:"q", en:"Mortal Steel", fr:"Acier mortel"},
      {k:"w", en:"Spirit Cleave", fr:"Fendoir spirituel"},
      {k:"e", en:"Soul Unbound", fr:"Libération spirituelle"},
      {k:"r", en:"Fate Sealed", fr:"Destin scellé"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[25,50,75,100,125], qAD:1.1,
      wTotal:[10,20,30,40,50], wTotalHpPct:[8,9,10,11,12], wFlat:[5,10,15,20,25], wHpPct:[4,4.5,5,5.5,6],
      eFlat:[25,27.5,30,32.5,35], eCd:[22,19,16,13,10],
      rTotal:[200,400,600], rTotalBonusAD:0.8, rFlat:[100,200,300], rBonusAD:0.4, rCd:[120,100,80]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Mortal Steel */
      A.qDmg = R(T.qFlat,qr) + T.qAD*tot.ad;
      /* W — Spirit Cleave */
      A.wTotalHpPct = R(T.wTotalHpPct,wr);   /* % des PV de la cible, applique dans onStep */
      A.wTotal = R(T.wTotal,wr);
      A.wHpPct = R(T.wHpPct,wr);   /* % des PV de la cible, applique dans onStep */
      A.wDmg = R(T.wFlat,wr);
      /* E — Soul Unbound */
      A.eDmg = R(T.eFlat,er);
      /* R — Fate Sealed */
      A.rTotal = R(T.rTotal,rr) + T.rTotalBonusAD*bonusAD;
      A.rDmg = R(T.rFlat,rr) + T.rBonusAD*bonusAD;
      A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wTotalHpPct=0; A.wTotal=0; A.wHpPct=0; A.wDmg=0; }
      if(!learned.e){ A.eDmg=0; }
      if(!learned.r){ A.rTotal=0; A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Way of the Hunter","Voie du chasseur"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Mortal Steel", fr:"Q — Acier mortel"},
      {id:"w", kind:"spell", en:"W — Spirit Cleave", fr:"W — Fendoir spirituel"},
      {id:"e", kind:"spell", en:"E — Soul Unbound", fr:"E — Libération spirituelle"},
      {id:"r", kind:"spell", en:"R — Fate Sealed", fr:"R — Destin scellé"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"mortalSteel", v:A.qDmg, type:"phys"});
      if(st.id === "w") out.parts.push({n:"spiritCleave", v:A.wDmg + hp * A.wTotalHpPct/100 + hp * A.wHpPct/100, type:"phys"});
      if(st.id === "e") out.parts.push({n:"soulUnbound", v:A.eDmg, type:"true"});
      if(st.id === "r") out.parts.push({n:"fateSealed", v:A.rDmg, type:"phys"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)}],
        [{lab:TR("mPpct"), val:pc(A.wTotalHpPct)},
         {lab:TR("damage"), val:n0(A.wTotal)},
         {lab:TR("mPpct"), val:pc(A.wHpPct)}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rTotal)},
         {lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q / Critical Strike Damage : ligne non modelisee (25 to 125 {{as|(+ {{as|{{critical damage|*1.1|110|mod=}}|critical damage}} AD)|ad}})
   - Q : aucune recharge dans les donnees wiki
   - W / Magic Damage : doublon de Physical Damage, ignore
   - W : aucune recharge dans les donnees wiki
   - R / Magic Damage : doublon de Physical Damage, ignore
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   - ressource particuliere (Flow) : non modelisee
   ------------------------------------------------------------------ */
