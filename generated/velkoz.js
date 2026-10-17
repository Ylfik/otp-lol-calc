/* velkoz — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Vel'Koz.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"velkoz", name:"Velkoz", label:"Vel'Koz", splash:0,
    base:{hp:[590,102], mana:[469,21], ad:[55,3.1416],
          ar:[22,4.7], mr:[30,1.3],
          as:0.643, asPerLevel:1.59, ms:340},
    abilities_meta:[
      {k:"q", en:"Plasma Fission", fr:"Fission du plasma"},
      {k:"w", en:"Void Rift", fr:"Ouverture de faille"},
      {k:"e", en:"Tectonic Disruption", fr:"Dislocation tectonique"},
      {k:"r", en:"Life Form Disintegration Ray", fr:"Désintégrateur de formes de vie"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[80,120,160,200,240], qAP:0.9, qCc:[1,1.4,1.8,2.2,2.6], qCd:[7,7,7,7,7],
      wFlat:[30,50,70,90,110], wAP:0.2, wTotal:[75,125,175,225,275], wTotalAP:0.45,
      eFlat:[70,100,130,160,190], eAP:0.3, eCd:[12,11.5,11,10.5,10],
      rFlat:[450,700,925], rAP:1.25, rCd:[100,90,80]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Plasma Fission */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      A.qCc = R(T.qCc,qr);
      /* W — Void Rift */
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      A.wTotal = R(T.wTotal,wr) + T.wTotalAP*ap;
      /* E — Tectonic Disruption */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      /* R — Life Form Disintegration Ray */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qCc=0; }
      if(!learned.w){ A.wDmg=0; A.wTotal=0; }
      if(!learned.e){ A.eDmg=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Organic Deconstruction","Décomposition organique"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Plasma Fission", fr:"Q — Fission du plasma"},
      {id:"w", kind:"spell", en:"W — Void Rift", fr:"W — Ouverture de faille"},
      {id:"e", kind:"spell", en:"E — Tectonic Disruption", fr:"E — Dislocation tectonique"},
      {id:"r", kind:"spell", en:"R — Life Form Disintegration Ray", fr:"R — Désintégrateur de formes de vie"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"plasmaFission", v:A.qDmg, type:"magic"});
      if(st.id === "w") out.parts.push({n:"voidRift", v:A.wDmg, type:"magic"});
      if(st.id === "e") out.parts.push({n:"tectonicDisruption", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"lifeFormDisintegrationRay", v:A.rDmg, type:"magic"});
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
         {lab:TR("damage"), val:n0(A.wTotal)}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q / Mana Restored per Kill : ligne non modelisee (20 to 30)
   - Q / Maximum Mana Restored : ligne non modelisee (20*3 to 30*3)
   - W / Magic Damage : doublon de Magic Damage, ignore
   - W : aucune recharge dans les donnees wiki
   - R : pas de ligne de degats simple, « Maximum Damage » prise comme ligne principale
   - R / Damage Per Tick : ligne non modelisee ((450*0.2)/2.6 (+ 125*0.2/2.6% AP))
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
