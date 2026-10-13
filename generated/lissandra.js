/* lissandra — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Lissandra.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"lissandra", name:"Lissandra", label:"Lissandra", splash:0,
    base:{hp:[620,110], mana:[475,30], ad:[55,2.7],
          ar:[22,4.2], mr:[30,1.3],
          as:0.656, asPerLevel:1.5, ms:325},
    abilities_meta:[
      {k:"q", en:"Ice Shard", fr:"Éclat de glace"},
      {k:"w", en:"Ring of Frost", fr:"Cercle de givre"},
      {k:"e", en:"Glacial Path", fr:"Chemin glacial"},
      {k:"r", en:"Frozen Tomb", fr:"Tombeau polaire"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[80,115,150,185,220], qAP:0.75, qSlow:[20,24,28,32,36], qCd:[7,6,5,4,3],
      wFlat:[70,105,140,175,210], wAP:0.7, wCc:[1.25,1.35,1.45,1.55,1.65], wCd:[10,9.5,9,8.5,8],
      eFlat:[70,105,140,175,210], eAP:0.6, eCd:[24,21,18,15,12],
      rHealMin:[100,150,200], rHealMinAP:0.55, rHealMax:[200,300,400], rHealMaxAP:1.1, rFlat:[150,250,350], rAP:0.75, rSlow:[45,60,75], rCd:[120,100,80]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Ice Shard */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      A.qSlow = R(T.qSlow,qr);
      /* W — Ring of Frost */
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      A.wCc = R(T.wCc,wr);
      /* E — Glacial Path */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      /* R — Frozen Tomb */
      A.rHealMin = R(T.rHealMin,rr) + T.rHealMinAP*ap;
      A.rHealMax = R(T.rHealMax,rr) + T.rHealMaxAP*ap;
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.rSlow = R(T.rSlow,rr);
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qSlow=0; }
      if(!learned.w){ A.wDmg=0; A.wCc=0; }
      if(!learned.e){ A.eDmg=0; }
      if(!learned.r){ A.rHealMin=0; A.rHealMax=0; A.rDmg=0; A.rSlow=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Iceborn Subjugation","Emprise de la Sublimée"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Ice Shard", fr:"Q — Éclat de glace"},
      {id:"w", kind:"spell", en:"W — Ring of Frost", fr:"W — Cercle de givre"},
      {id:"e", kind:"spell", en:"E — Glacial Path", fr:"E — Chemin glacial"},
      {id:"r", kind:"spell", en:"R — Frozen Tomb", fr:"R — Tombeau polaire"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"iceShard", v:A.qDmg, type:"magic"});
      if(st.id === "w") out.parts.push({n:"ringOfFrost", v:A.wDmg, type:"magic"});
      if(st.id === "e") out.parts.push({n:"glacialPath", v:A.eDmg, type:"magic"});
      if(st.id === "r"){
        out.parts.push({n:"frozenTomb", v:A.rDmg, type:"magic"});
        out.heal = A.rHealMin;
      }
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("slow"), val:pc(A.qSlow)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("comboTime"), val:n0(A.wCc)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("healing"), val:n0(A.rHealMin)},
         {lab:TR("healing"), val:n0(A.rHealMax)},
         {lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - R / Minimum Heal per Tick : ligne non modelisee (100/10 to 200/10 (+ 55/10% AP))
   - R / Maximum Heal per Tick : ligne non modelisee (100*2/10 to 200*2/10 (+ 55*2/10% AP))
   - passif : 2 blocs dans le wiki (Iceborn Subjugation, Iceborn) — seul le premier est modelise
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
