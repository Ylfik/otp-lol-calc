/* zoe — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Zoe.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"zoe", name:"Zoe", label:"Zoe", splash:0,
    base:{hp:[630,106], mana:[425,25], ad:[58,3.3],
          ar:[21,4.7], mr:[30,1.3],
          as:0.658, asPerLevel:2.5, ms:340},
    abilities_meta:[
      {k:"q", en:"Paddle Star!", fr:"Astro-pong !"},
      {k:"w", en:"Spell Thief", fr:"Voleuse de sorts"},
      {k:"e", en:"Sleepy Trouble Bubble", fr:"Bulle soporifique"},
      {k:"r", en:"Portal Jump", fr:"Bond dimensionnel"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qAdd:[50,80,110,140,170], qAP:0.6, qMaxAP:1.5, qCd:[8.5,8,7.5,7,6.5],
      wMs:[30,40,50,60,70], wMsMovement:[2,2.25,2.5,2.75,3], wFlat:[45,75,105,135,165], wAP:0.3, wCd:[0.25,0.25,0.25,0.25,0.25],
      eFlat:[70,110,150,190,230], eAP:0.45, eSlowMax:[10,15,20,25,30], eCap:[70,110,150,190,230], eCapAP:0.45, eMax:[140,220,300,380,460], eMaxAP:0.9, eCd:[18,17,16,15,14],
      rCd:[11,8,5]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Paddle Star! */
      A.qDmg = R(T.qAdd,qr) + T.qAP*ap;
      A.qMax = T.qMaxAP*ap;
      /* W — Spell Thief */
      A.wMs = R(T.wMs,wr);
      A.wMsMovement = R(T.wMsMovement,wr);
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      /* E — Sleepy Trouble Bubble */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      A.eSlowMax = R(T.eSlowMax,er);
      A.eCap = R(T.eCap,er) + T.eCapAP*ap;
      A.eMax = R(T.eMax,er) + T.eMaxAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; A.qMax=0; }
      if(!learned.w){ A.wMs=0; A.wMsMovement=0; A.wDmg=0; }
      if(!learned.e){ A.eDmg=0; A.eSlowMax=0; A.eCap=0; A.eMax=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["More Sparkles!","Plus d'étincelles !"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Paddle Star!", fr:"Q — Astro-pong !"},
      {id:"w", kind:"spell", en:"W — Spell Thief", fr:"W — Voleuse de sorts"},
      {id:"e", kind:"spell", en:"E — Sleepy Trouble Bubble", fr:"E — Bulle soporifique"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"paddleStar", v:A.qDmg, type:"magic"});
      if(st.id === "w") out.parts.push({n:"spellThief", v:A.wDmg, type:"magic"});
      if(st.id === "e") out.parts.push({n:"sleepyTroubleBubble", v:A.eDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)},
         {lab:TR("damage"), val:n0(A.qMax)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("msBonus"), val:"+" + pc(A.wMs)},
         {lab:TR("msBonus"), val:"+" + pc(A.wMsMovement)},
         {lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("slow"), val:pc(A.eSlowMax)},
         {lab:TR("damage"), val:n0(A.eCap)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q : pas de ligne de degats simple, « Minimum Magic Damage » prise comme ligne principale
   - Q / Maximum Magic Damage : ratio sans statistique « 50*2.5 to 170*2.5 » non modelise
   - W : pas de ligne de degats simple, « Total Magic Damage » prise comme ligne principale
   - W / Magic Damage Per Bolt : ligne non modelisee (15 to 55 (+ 10% AP))
   - E / Cooldown Refund : ligne non modelisee (16 to 30%)
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
