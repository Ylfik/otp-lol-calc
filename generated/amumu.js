/* amumu — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Amumu.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"amumu", name:"Amumu", label:"Amumu", splash:0,
    base:{hp:[685,94], mana:[285,40], ad:[57,3.8],
          ar:[33,4], mr:[32,2.05],
          as:0.736, asPerLevel:2.18, ms:335},
    abilities_meta:[
      {k:"q", en:"Bandage Toss", fr:"Jet de bandelette"},
      {k:"w", en:"Despair", fr:"Désespoir"},
      {k:"e", en:"Tantrum", fr:"Colère"},
      {k:"r", en:"Curse of the Sad Mummy", fr:"Malédiction d'Amumu"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[70,95,120,145,170], qAP:0.85,
      eFlat:[65,95,125,155,185], eAP:0.5, eCd:[9,8,7,6,5],
      rFlat:[200,300,400], rAP:0.8, rCd:[150,125,100]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Bandage Toss */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      /* E — Tantrum */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      /* R — Curse of the Sad Mummy */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.e){ A.eDmg=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Cursed Touch","Toucher maudit"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Bandage Toss", fr:"Q — Jet de bandelette"},
      {id:"e", kind:"spell", en:"E — Tantrum", fr:"E — Colère"},
      {id:"r", kind:"spell", en:"R — Curse of the Sad Mummy", fr:"R — Malédiction d'Amumu"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"bandageToss", v:A.qDmg, type:"magic"});
      if(st.id === "e") out.parts.push({n:"tantrum", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"curseOfTheSadMummy", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)}],
        [],
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
   - Q : aucune recharge dans les donnees wiki
   - W / Magic Damage Per Tick : ligne non modelisee (5 (+ 0.5 to 1% (+ 0.25% per 100 AP) of target's maximum health))
   - W : aucune recharge dans les donnees wiki
   - E / Physical Damage Reduction : ligne non modelisee (5 to 13 (+ 3% bonus armor) (+ 3% bonus magic resistance))
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
