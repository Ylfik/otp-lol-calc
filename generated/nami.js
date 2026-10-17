/* nami — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Nami.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"nami", name:"Nami", label:"Nami", splash:0,
    base:{hp:[560,88], mana:[365,43], ad:[54,3.1],
          ar:[29,5.2], mr:[30,1.3],
          as:0.644, asPerLevel:2.61, ms:335},
    abilities_meta:[
      {k:"q", en:"Aqua Prison", fr:"Prison aqueuse"},
      {k:"w", en:"Ebb and Flow", fr:"Flux et reflux"},
      {k:"e", en:"Tidecaller's Blessing", fr:"Bénédiction de l'Aquamancienne"},
      {k:"r", en:"Tidal Wave", fr:"Raz-de-marée"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[90,145,200,255,310], qAP:0.5, qCd:[12,11,10,9,8],
      wHeal:[55,80,105,130,155], wHealAP:0.4, wHealMinAP:0.24, wFlat:[60,95,130,165,200], wAP:0.5, wMinAP:0.3, wCd:[10,10,10,10,10],
      eFlat:[60,105,150,195,240], eAP:0.6, eSlow:[15,20,25,30,35], eSlowAP100:5, eCd:[11,11,11,11,11],
      rFlat:[150,250,350], rAP:0.6, rCd:[120,110,100]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Aqua Prison */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      /* W — Ebb and Flow */
      A.wHeal = R(T.wHeal,wr) + T.wHealAP*ap;
      A.wHealMin = T.wHealMinAP*ap;
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      A.wMin = T.wMinAP*ap;
      /* E — Tidecaller's Blessing */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      A.eSlow = R(T.eSlow,er) + T.eSlowAP100*ap/100;
      /* R — Tidal Wave */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wHeal=0; A.wHealMin=0; A.wDmg=0; A.wMin=0; }
      if(!learned.e){ A.eDmg=0; A.eSlow=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Surging Tides","Déferlantes"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Aqua Prison", fr:"Q — Prison aqueuse"},
      {id:"w", kind:"spell", en:"W — Ebb and Flow", fr:"W — Flux et reflux"},
      {id:"e", kind:"spell", en:"E — Tidecaller's Blessing", fr:"E — Bénédiction de l'Aquamancienne"},
      {id:"r", kind:"spell", en:"R — Tidal Wave", fr:"R — Raz-de-marée"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"aquaPrison", v:A.qDmg, type:"magic"});
      if(st.id === "w"){
        out.parts.push({n:"ebbAndFlow", v:A.wDmg, type:"magic"});
        out.heal = A.wHeal;
      }
      if(st.id === "e") out.parts.push({n:"tidecallerSBlessing", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"tidalWave", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("healing"), val:n0(A.wHeal)},
         {lab:TR("healing"), val:n0(A.wHealMin)},
         {lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("slow"), val:pc(A.eSlow)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - E : pas de ligne de degats simple, « Total Bonus Magic Damage » prise comme ligne principale
   - E / Bonus Magic Damage Per Hit : ligne non modelisee (20 to 80 (+ 20% AP))
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
