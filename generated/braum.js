/* braum — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Braum.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"braum", name:"Braum", label:"Braum", splash:0,
    base:{hp:[610,112], mana:[311,45], ad:[55,3.2],
          ar:[35,5], mr:[32,2.05],
          as:0.644, asPerLevel:3.5, ms:335},
    abilities_meta:[
      {k:"q", en:"Winter's Bite", fr:"Morsure de l'hiver"},
      {k:"w", en:"Stand Behind Me", fr:"Bouclier humain"},
      {k:"e", en:"Unbreakable", fr:"Incassable"},
      {k:"r", en:"Glacial Fissure", fr:"Fissure glaciale"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[75,120,165,210,255], qMaxHp:0.025, qCd:[8,7.5,7,6.5,6],
      wCd:[12,11,10,9,8],
      eCd:[16,14,12,10,8],
      rFlat:[150,250,350], rAP:0.6, rSlow:[40,50,60], rCd:[130,115,100]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Winter's Bite */
      A.qDmg = R(T.qFlat,qr) + T.qMaxHp*tot.hp;
      /* R — Glacial Fissure */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.rSlow = R(T.rSlow,rr);
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.r){ A.rDmg=0; A.rSlow=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Concussive Blows","Coups étourdissants"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Winter's Bite", fr:"Q — Morsure de l'hiver"},
      {id:"r", kind:"spell", en:"R — Glacial Fissure", fr:"R — Fissure glaciale"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"winterSBite", v:A.qDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"glacialFissure", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("slow"), val:pc(A.rSlow)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - W / Ally Bonus Armor : ligne non modelisee (20 to 40 (+ 12% bonus armor))
   - W / Ally Bonus Magic Resistance : ligne non modelisee (20 to 40 (+ 12% bonus magic resistance))
   - W / Self Bonus Armor : ligne non modelisee (20 to 40 (+ 36% bonus armor))
   - W / Self Bonus Magic Resistance : ligne non modelisee (20 to 40 (+ 36% bonus magic resistance))
   - E / Damage reduction : ligne non modelisee (35 to 55%)
   - E / Barrier Duration : ligne non modelisee (3 to 4 seconds)
   - R / Maximum Knock up Duration : ligne non modelisee (1 to 2 seconds)
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
