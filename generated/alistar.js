/* alistar — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Alistar.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"alistar", name:"Alistar", label:"Alistar", splash:0,
    base:{hp:[685,120], mana:[350,40], ad:[62,3.75],
          ar:[40,4.7], mr:[32,2.05],
          as:0.625, asPerLevel:2.125, ms:335},
    abilities_meta:[
      {k:"q", en:"Pulverize", fr:"Atomisation"},
      {k:"w", en:"Headbutt", fr:"Coup de tête"},
      {k:"e", en:"Trample", fr:"Piétinement"},
      {k:"r", en:"Unbreakable Will", fr:"Volonté de fer"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[60,100,140,180,220], qAP:0.8, qCd:[14,13,12,11,10],
      wFlat:[55,110,165,220,275], wAP:1, wCd:[14,13,12,11,10],
      eFlat:[80,110,140,170,200], eAP:0.7, eCd:[12,11.5,11,10.5,10],
      rCd:[120,100,80]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Pulverize */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      /* W — Headbutt */
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      /* E — Trample */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wDmg=0; }
      if(!learned.e){ A.eDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Triumphant Roar","Cri triomphant"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Pulverize", fr:"Q — Atomisation"},
      {id:"w", kind:"spell", en:"W — Headbutt", fr:"W — Coup de tête"},
      {id:"e", kind:"spell", en:"E — Trample", fr:"E — Piétinement"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"pulverize", v:A.qDmg, type:"magic"});
      if(st.id === "w") out.parts.push({n:"headbutt", v:A.wDmg, type:"magic"});
      if(st.id === "e") out.parts.push({n:"trample", v:A.eDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
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
   - E : pas de ligne de degats simple, « Total Magic Damage » prise comme ligne principale
   - E / Magic Damage Per Tick : ligne non modelisee (80/10 to 200/10 (+ 70/10% AP))
   - R / Damage Reduction : ligne non modelisee (55 to 75%)
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
