/* tahmkench — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Tahm Kench.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"tahmkench", name:"TahmKench", label:"Tahm Kench", splash:0,
    base:{hp:[640,103], mana:[325,50], ad:[56,3.2],
          ar:[39,4.7], mr:[32,2.05],
          as:0.658, asPerLevel:2.5, ms:335},
    abilities_meta:[
      {k:"q", en:"Tongue Lash", fr:"Coup de langue"},
      {k:"w", en:"Abyssal Dive", fr:"Plongée abyssale"},
      {k:"e", en:"Thick Skin", fr:"Peau épaisse"},
      {k:"r", en:"Devour", fr:"Dévoration"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[75,120,165,210,255], qAP:1, qHeal:[10,15,20,25,30], qHealMissPct:[5,5.5,6,6.5,7], qCd:[7,6.5,6,5.5,5],
      wFlat:[100,135,170,205,240], wAP:1.5, wCd:[21,20,19,18,17],
      eFlat:[15,23,31,39,47], eMax:[42,44,46,48,50], eCd:[3,3,3,3,3],
      rShield:[650,800,950], rShieldAP:1, rCd:[120,100,80]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Tongue Lash */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      A.qHealMissPct = R(T.qHealMissPct,qr);
      A.qHeal = R(T.qHeal,qr);
      /* W — Abyssal Dive */
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      /* E — Thick Skin */
      A.eDmg = R(T.eFlat,er);
      A.eMax = R(T.eMax,er);
      /* R — Devour */
      A.rShield = R(T.rShield,rr) + T.rShieldAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qHealMissPct=0; A.qHeal=0; }
      if(!learned.w){ A.wDmg=0; }
      if(!learned.e){ A.eDmg=0; A.eMax=0; }
      if(!learned.r){ A.rShield=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["An Acquired Taste","Goût acquis"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Tongue Lash", fr:"Q — Coup de langue"},
      {id:"w", kind:"spell", en:"W — Abyssal Dive", fr:"W — Plongée abyssale"},
      {id:"e", kind:"spell", en:"E — Thick Skin", fr:"E — Peau épaisse"},
      {id:"r", kind:"cast", label:"R", en:"R — Devour", fr:"R — Dévoration"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q"){
        out.parts.push({n:"tongueLash", v:A.qDmg, type:"magic"});
        out.heal = A.qHeal;
      }
      if(st.id === "w") out.parts.push({n:"abyssalDive", v:A.wDmg, type:"magic"});
      if(st.id === "e") out.parts.push({n:"thickSkin", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.shield = A.rShield;
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("sQpct"), val:pc(A.qHealMissPct)},
         {lab:TR("healing"), val:n0(A.qHeal)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("damage"), val:n0(A.eMax)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("shield"), val:n0(A.rShield)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q / Magic Damage : « 4% bonus health » appartient a un autre effet (crochets du wiki), non compte ici
   - Q / Heal : « 5 to 7% of missing health » est une part des PV du champion — le moteur ne suit pas ses PV courants, la valeur reste un pourcentage affiche
   - W / Cooldown Refund : ligne non modelisee (40 to 50%)
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
