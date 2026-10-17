/* taric — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Taric.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"taric", name:"Taric", label:"Taric", splash:0,
    base:{hp:[645,99], mana:[300,60], ad:[55,3.5],
          ar:[40,4.3], mr:[28,2.05],
          as:0.625, asPerLevel:2, ms:340},
    abilities_meta:[
      {k:"q", en:"Starlight's Touch", fr:"Bénédiction stellaire"},
      {k:"w", en:"Bastion", fr:"Bastion"},
      {k:"e", en:"Dazzle", fr:"Éblouissement"},
      {k:"r", en:"Cosmic Radiance", fr:"Lumière cosmique"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qCd:[3,3,3,3,3],
      wShieldHpPct:[7,8,9,10,11], wCd:[15,15,15,15,15],
      eFlat:[90,130,170,210,250], eAP:0.5, eArmor:0.5, eCd:[16,15,14,13,12],
      rCd:[180,150,120]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* W — Bastion */
      A.wShieldHpPct = R(T.wShieldHpPct,wr);   /* % des PV de la cible, applique dans onStep */
      /* E — Dazzle */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap + T.eArmor*tot.ar;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.w){ A.wShieldHpPct=0; }
      if(!learned.e){ A.eDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Bravado","Plastronneur"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"w", kind:"cast", label:"W", en:"W — Bastion", fr:"W — Bastion"},
      {id:"e", kind:"spell", en:"E — Dazzle", fr:"E — Éblouissement"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "w") out.parts.push({n:"bastion", v:hp * A.wShieldHpPct/100, type:"magic"});
      if(st.id === "e") out.parts.push({n:"dazzle", v:A.eDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("mPpct"), val:pc(A.wShieldHpPct)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q / Maximum Charges : ligne non modelisee (1 to 5)
   - W / Bonus Armor : ligne non modelisee (6 to 10% of Taric's armor)
   - E / Magic Damage : « 50% bonus armor » est lu comme une part des resistances DU CHAMPION — a verifier, le wiki ne le dit pas toujours
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
