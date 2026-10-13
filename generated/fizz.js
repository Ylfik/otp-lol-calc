/* fizz — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Fizz.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"fizz", name:"Fizz", label:"Fizz", splash:0,
    base:{hp:[640,106], mana:[317,52], ad:[58,3],
          ar:[26,4.6], mr:[32,2.05],
          as:0.658, asPerLevel:3.1, ms:335},
    abilities_meta:[
      {k:"q", en:"Urchin Strike", fr:"Frappe de l'oursin"},
      {k:"w", en:"Seastone Trident", fr:"Trident marin"},
      {k:"e", en:"Playful / Trickster", fr:"Joueur/Filou"},
      {k:"r", en:"Chum the Waters", fr:"Pêche au gros"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[10,25,40,55,70], qAP:0.55, qCd:[8,7.5,7,6.5,6],
      wTotal:[30,45,60,75,90], wTotalAP:0.25, wFlat:[50,75,100,125,150], wAP:0.45, wActive:[20,25,30,35,40], wActiveAP:0.3, wCd:[7,6,5,4,3],
      eFlat:[80,130,180,230,280], eAP:0.95, eSlow:[40,45,50,55,60], eCd:[16,14,12,10,8],
      rFlat:[180,300,420], rAP:0.6, rFlat2:[225,375,525], rAP2:0.75, rGigalodon:[270,450,630], rGigalodonAP:0.9, rCd:[120,100,80]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Urchin Strike */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      /* W — Seastone Trident */
      A.wTotal = R(T.wTotal,wr) + T.wTotalAP*ap;
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      A.wActive = R(T.wActive,wr) + T.wActiveAP*ap;
      /* E — Playful / Trickster */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      A.eSlow = R(T.eSlow,er);
      /* R — Chum the Waters */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.rDmg = (R(T.rFlat2,rr))/100*ap + T.rAP2*ap;
      A.rGigalodon = R(T.rGigalodon,rr) + T.rGigalodonAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wTotal=0; A.wDmg=0; A.wActive=0; }
      if(!learned.e){ A.eDmg=0; A.eSlow=0; }
      if(!learned.r){ A.rDmg=0; A.rDmg=0; A.rGigalodon=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Nimble Fighter","Combattant agile"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Urchin Strike", fr:"Q — Frappe de l'oursin"},
      {id:"w", kind:"spell", en:"W — Seastone Trident", fr:"W — Trident marin"},
      {id:"e", kind:"spell", en:"E — Playful / Trickster", fr:"E — Joueur/Filou"},
      {id:"r", kind:"spell", en:"R — Chum the Waters", fr:"R — Pêche au gros"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"urchinStrike", v:A.qDmg, type:"magic"});
      if(st.id === "w") out.parts.push({n:"seastoneTrident", v:A.wDmg, type:"magic"});
      if(st.id === "e") out.parts.push({n:"playfulTrickster", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"chumTheWaters", v:A.rDmg + A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wTotal)},
         {lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("damage"), val:n0(A.wActive)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("slow"), val:pc(A.eSlow)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("damage"), val:n0(A.rGigalodon)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - E : 2 formes dans le wiki (Playful, Trickster) — seule la premiere est modelisee
   - W / Passive Magic Damage per Tick : ligne non modelisee (30/6 to 90/6 (+ 25/6% AP))
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
