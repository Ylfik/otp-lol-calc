/* jhin — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Jhin.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"jhin", name:"Jhin", label:"Jhin", splash:0,
    base:{hp:[655,107], mana:[300,50], ad:[61,4.4],
          ar:[24,4.7], mr:[33,1.1],
          as:0.625, asPerLevel:3, ms:330},
    abilities_meta:[
      {k:"q", en:"Dancing Grenade", fr:"Grenade dansante"},
      {k:"w", en:"Deadly Flourish", fr:"Floraison mortelle"},
      {k:"e", en:"Captive Audience", fr:"Public captif"},
      {k:"r", en:"Curtain Call", fr:"Rappel de rideau"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[44,69,94,119,144], qAD:[0.44,0.515,0.59,0.665,0.74], qAP:0.6, qMaxAD:0.44, qMaxAP:1.23, qCd:[7,6.5,6,5.5,5],
      wFlat:[70,105,140,175,210], wAD:0.5, wCc:[1.25,1.5,1.75,2,2.25], wCd:[12,12,12,12,12],
      eFlat:[20,80,140,200,260], eAD:1.2, eAP:1, eCd:[2,2,2,2,2],
      rFlat:[128,256,384], rAD:0.5, rMax:[512,1024,1536], rMaxAD:2, rCd:[120,105,90]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Dancing Grenade */
      A.qDmg = R(T.qFlat,qr) + R(T.qAD,qr)*tot.ad + T.qAP*ap;
      A.qMax = T.qMaxAD*tot.ad + T.qMaxAP*ap;
      /* W — Deadly Flourish */
      A.wDmg = R(T.wFlat,wr) + T.wAD*tot.ad;
      A.wCc = R(T.wCc,wr);
      /* E — Captive Audience */
      A.eDmg = R(T.eFlat,er) + T.eAD*tot.ad + T.eAP*ap;
      /* R — Curtain Call */
      A.rDmg = R(T.rFlat,rr) + T.rAD*tot.ad;
      A.rMax = R(T.rMax,rr) + T.rMaxAD*tot.ad;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qMax=0; }
      if(!learned.w){ A.wDmg=0; A.wCc=0; }
      if(!learned.e){ A.eDmg=0; }
      if(!learned.r){ A.rDmg=0; A.rMax=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Whisper","Murmure"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Dancing Grenade", fr:"Q — Grenade dansante"},
      {id:"w", kind:"spell", en:"W — Deadly Flourish", fr:"W — Floraison mortelle"},
      {id:"e", kind:"spell", en:"E — Captive Audience", fr:"E — Public captif"},
      {id:"r", kind:"spell", en:"R — Curtain Call", fr:"R — Rappel de rideau"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"dancingGrenade", v:A.qDmg, type:"phys"});
      if(st.id === "w") out.parts.push({n:"deadlyFlourish", v:A.wDmg, type:"phys"});
      if(st.id === "e") out.parts.push({n:"captiveAudience", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"curtainCall", v:A.rDmg, type:"phys"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("damage"), val:n0(A.qMax)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("comboTime"), val:n0(A.wCc)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("damage"), val:n0(A.rMax)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - slot non reconnu « A » pour Basic Attack
   - Q / Bonus Damage per Target Death : ligne non modelisee ((44 to 144)*0.35 (+ (44 to 74)*0.35% AD) (+ 60*0.35% AP))
   - W / Minion Damage : ligne non modelisee (70*0.75 to 210*0.75 (+ 37.5% AD))
   - E / Reduced Damage : ligne non modelisee (20*0.65 to 260*0.65 (+ 78% AD) (+ 65% AP))
   - R : pas de ligne de degats simple, « Minimum Fourth Shot Damage » prise comme ligne principale
   - R / Minimum Physical Damage per Bullet : ligne non modelisee (64 to 192 (+ 25% AD))
   - R / Maximum Physical Damage per Bullet : ligne non modelisee (64*4 to 192*4 (+ 25*4% AD))
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
