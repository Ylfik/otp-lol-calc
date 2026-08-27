/* udyr — loaded on demand by index.html.
   Replace this file alone to change this champion. */
window.CHAMPION = {
    stepMenu:[
      {id:"aa",    kind:"attack", en:"Auto attack",       fr:"Auto-attaque"},
      {id:"aaAwk", kind:"attack", awakened:true, en:"Auto, awakened", fr:"Auto, éveillée"},
      {id:"cq",    kind:"cast", label:"Q", en:"Q — enter Wilding Claw", fr:"Q — entrer en Griffe sauvage"},
      {id:"cqAwk", kind:"cast", label:"Q", awakened:true, en:"Q — awaken, the lightning", fr:"Q — éveil, l'éclair"},
      {id:"cw",    kind:"cast", label:"W", en:"W — Iron Mantle, the shield", fr:"W — Cape de fer, le bouclier"},
      {id:"cwAwk", kind:"cast", label:"W", awakened:true, en:"W — awaken, shield and regen", fr:"W — éveil, bouclier et régénération"},
      {id:"ce",    kind:"cast", label:"E", en:"E — Blazing Stampede", fr:"E — Piétinement flamboyant"},
      {id:"ceAwk", kind:"cast", label:"E", awakened:true, en:"E — awaken", fr:"E — éveil"},
      {id:"cr",    kind:"cast", label:"R", en:"R — Wingborne Storm", fr:"R — Tempête spirituelle"},
      {id:"crAwk", kind:"cast", label:"R", awakened:true, en:"R — awaken, the glacial storm", fr:"R — éveil, la tempête glaciale"}
    ],
    key:"udyr", name:"Udyr", splash:3,
    base:{hp:[664,92], mana:[271,50], ad:[62,4], ar:[31,4.7], mr:[32,2.05],
          as:0.65, asPerLevel:3, ms:350},
    abilities_meta:[
      {k:"q", en:"Wilding Claw",     fr:"Griffe sauvage"},
      {k:"w", en:"Iron Mantle",      fr:"Cape de fer"},
      {k:"e", en:"Blazing Stampede", fr:"Piétinement flamboyant"},
      {k:"r", en:"Wingborne Storm",  fr:"Tempête spirituelle"}
    ],
    rankCap: L => Math.min(6, Math.floor((L + 1) / 2)),   /* no ultimate here */
    awakenBase: L => L >= 16 ? 20 : L >= 11 ? 30 : L >= 6 ? 40 : 50,
    stanceCD: 6,
    comboASBonus: 30,          /* Monk Training, on every attack of the combo */
    passiveName:["Monk Training","Entraînement du moine"],
    passiveRows(c){
      const {A, TR, n0, pc, nf1} = c;
      return [
        {lab:TR("uAsAfterCast"), val:"+" + pc(30)},
        {lab:TR("uRefund"),      val:pc(5)},
        {lab:TR("awakenCD"),     val:nf1.format(A.awakenCD) + " s", awk:true}
      ];
    },
    /* what each ability panel shows, and what each combo column shows */
    abilityRows(c){
      const {A, M, TR, n0, pc, nf1} = c, cd = {lab:TR("cooldown"), val:nf1.format(A.stanceCD) + " s"};
      return [
        [{lab:TR("onHit"), val:n0(M.qOnHit)},
         {lab:TR("onHitPct"), val:pc(M.qPct)},
         {lab:TR("awkOnHit"), val:pc(M.qAwkPct), awk:true},
         {lab:TR("lightning"), val:pc(M.qLightning), awk:true},
         {lab:TR("bonusAsAwk"), val:n0(A.qBonusAS) + " / " + n0(A.qAwkAS) + "%"}, cd],
        [{lab:TR("shield"), val:n0(A.wShield)},
         {lab:TR("onHitHeal"), val:n0(A.wHeal)},
         {lab:TR("awkShield"), val:n0(A.wAwkShield), awk:true},
         {lab:TR("regen4s"), val:n0(A.wAwkRegen), awk:true},
         {lab:TR("awkOnHitHeal"), val:n0(A.wAwkHeal), awk:true}, cd],
        [{lab:TR("msBonus"), val:"+" + pc(A.eMs)},
         {lab:TR("msWithE"), val:n0(A.msE)},
         {lab:TR("msDecay"), val:n0(A.msEDecay)},
         {lab:TR("awkBonus"), val:"+" + pc(A.eMs + A.eAwkMs), awk:true},
         {lab:TR("awkMs"), val:n0(A.msEAwk), awk:true},
         {lab:TR("awkMsDecay"), val:n0(A.msEAwkDecay), awk:true}, cd],
        [{lab:TR("onHit"), val:n0(M.rOnHit)},
         {lab:TR("total4s"), val:n0(M.rTotal)},
         {lab:TR("awkTotalPct"), val:pc(M.rAwkTotal), awk:true},
         {lab:TR("slow"), val:n0(A.rSlow) + " / " + n0(A.rAwkSlow) + "%"}, cd]
      ];
    },
    comboRows(key, x){
      const {c, A, TR, n0, pc} = x;
      if(key === "e") return [
        {lab:TR("msWithE"), val:n0(A.msE), hi:true},
        {lab:TR("awkMs"), val:n0(A.msEAwk)},
        {lab:TR("msDecay"), val:n0(A.msEDecay)},
        {lab:TR("awkMsDecay"), val:n0(A.msEAwkDecay)},
        {lab:TR("msBonus"), val:"+" + pc(A.eMs) + " / " + pc(A.eMsDecay)}];
      if(key === "w") return [
        {lab:TR("damage"), val:n0(c.dmg), hi:true},
        {lab:TR("hps"), val:n0(c.hps)},
        {lab:TR("healing"), val:n0(c.heal)},
        {lab:TR("shielding"), val:n0(c.shield)},
        {lab:TR("healShield"), val:n0(c.sustain)}];
      if(key === "r") return [
        {lab:TR("damage"), val:n0(c.dmg), hi:true},
        {lab:TR("dps"), val:n0(c.dps)},
        {lab:TR("healing"), val:n0(c.heal)},
        {lab:TR("slow"), val:n0(A.rSlow) + " / " + n0(A.rAwkSlow) + "%"}];
      return [
        {lab:TR("damage"), val:n0(c.dmg), hi:true},
        {lab:TR("dps"), val:n0(c.dps)},
        {lab:TR("healing"), val:n0(c.heal)},
        {lab:"&nbsp;&nbsp;" + TR("fromLS"), val:n0(c.lsHeal), dim:c.lsHeal < 1},
        {lab:"&nbsp;&nbsp;" + TR("fromOV"), val:n0(c.ovHeal), dim:c.ovHeal < 1}];
    },
    /* Two attacks in the stance, then two awakened. */
    combos:[],
    /* what the stance adds to a single attack */
    castNote(st, key){
      const n = st.label || {q:"Q", w:"W", e:"E", r:"R"}[key] || "";
      return isFR() ? n + " — changement de posture" : n + " — stance swap";
    },
    newState(){ return {stance:null}; },
    onStep(key, st, c){
      const {A, hp, memo} = c, out = {parts:[], ls:0};
      /* a cast decides which stance the following attacks are in */
      /* A cast decides the stance, and some stances do something the moment
         they are entered — the shield, the storm — which used to be lost
         because it hung off the combo's name. */
      if(st.kind === "cast"){
        const k = st.label ? st.label.toLowerCase() : key;
        memo.stance = k;
        if(k === "w"){
          out.shield = st.awakened ? A.wShield + A.wAwkShield : A.wShield;
          out.heal   = st.awakened ? A.wAwkRegen : 0;
        }
        if(k === "r"){
          out.parts.push({n:"rStorm", v:A.rTotal, type:"magic"});
          if(st.awakened) out.parts.push({n:"rAwkStorm", v:hp*A.rAwkTotal*0.01, type:"magic"});
        }
        if(k === "q" && st.awakened)
          out.parts.push({n:"lightning", v:hp*A.qLightning*0.01*6, type:"magic"});
        return out;
      }
      if(st.kind !== "attack") return out;   /* the stance rides on attacks only */
      const stance = memo.stance || key;
      if(stance === "q"){
        out.parts.push({n:"qOnHit", v:A.qOnHit, type:"phys"});
        out.parts.push({n:st.awakened ? "qAwkPct" : "qPct",
                        v:hp*(st.awakened ? A.qAwkPct : A.qPct)*0.01, type:"phys"});
      }
      if(stance === "r") out.parts.push({n:"rOnHit", v:A.rOnHit, type:"magic"});
      if(stance === "w"){
        out.lsPct = st.awakened ? A.wAwkLifest : A.wLifesteal;
        out.heal  = st.awakened ? A.wAwkHeal : A.wHeal;
      }
      return out;
    },
    /* effects that resolve once the four attacks have landed */
    comboEnd(){ return {parts:[]}; },
    ranks:{
      qOnHit:      [5,13,21,29,37,45],
      qOnHitPct:   [3,4,5,6,7,8],
      qBonusAS:    [20,32,44,56,68,80],
      qNewOnHit:   [6,12,18,24,30,36],
      qNewHpRatio: [0.01,0.012,0.014,0.016,0.018,0.02],   /* 1 to 2% bonus health, wiki */
      wFlat:       [45,65,85,105,125,145],
      wHpPct:      [0.02,0.023,0.026,0.029,0.032,0.035],
      wLifesteal:  [15,16,17,18,19,20],
      wAwkLifest:  [30,32,34,36,38,40],
      wRegenFlat:  [22.5,32.5,42.5,52.5,62.5,72.5],
      eMs:         [25,31,37,43,49,55],
      rPerSec:     [10,18,26,34,42,50],   /* wiki data file: 10 to 50, total 80 to 400 over 8 ticks */
      rSlow:       [15,18,21,24,27,30],
      rAwkSlow:    [20,23,26,29,32,35]
    },
    /* handed the finished stats, gives back what each ability does */
    abilities(c){
      const {A, T, R1, lerp, L, qr, wr, er, rr, tot, base, S, bonusAD, bonusHP,
             learned, has, msSoftCap, qBonusAS, qAwkBonusAS} = c;
      A.qOnHit  = R1(T.qNewOnHit,qr) + 0.2*bonusAD + R1(T.qNewHpRatio,qr)*bonusHP;
      A.qPct    = R1(T.qOnHitPct,qr) + 0.035*bonusAD;
      A.qAwkPct = A.qPct + lerp(2,4.24,L) + 0.015*bonusAD + 0.001*bonusHP;
      A.qLightning = lerp(1.5,3.18,L) + 0.006*tot.ap;
      if(!learned.q){ A.qOnHit = 0; A.qPct = 0; A.qAwkPct = 0; A.qLightning = 0; }
      A.qBonusAS = qBonusAS;
      A.qAwkAS   = qAwkBonusAS;

      const sv = has("SPIRIT VISAGE") ? 1.25 : 1;
      A.wShield    = (R1(T.wFlat,wr) + R1(T.wHpPct,wr)*tot.hp + 0.4*tot.ap + 0.5*bonusAD) * sv;
      A.wHeal      = (0.012*tot.hp + 0.08*tot.ap) * sv;
      A.wLifesteal = R1(T.wLifesteal,wr);
      A.wAwkShield = (lerp(20,150,L) + R1(T.wFlat,wr) + 0.65*tot.ap + 0.08*tot.hp + 1.0*bonusAD) * sv;
      A.wAwkRegen  = (lerp(10,75,L) + R1(T.wRegenFlat,wr) + 0.325*tot.ap + 0.04*tot.hp + 0.5*bonusAD) * sv;
      A.wAwkHeal   = (0.024*tot.hp + 0.16*tot.ap) * sv;
      A.wAwkLifest = R1(T.wAwkLifest,wr);

      if(!learned.w){ A.wShield = 0; A.wHeal = 0; A.wAwkShield = 0; A.wAwkRegen = 0;
                      A.wAwkHeal = 0; A.wLifesteal = 0; A.wAwkLifest = 0; }
      A.eMs    = R1(T.eMs,er) + 0.05*bonusAD;
      A.eAwkMs = lerp(30,40,L) + 0.1*bonusAD;
      /* real move speed: (base + flat) x (1 + summed %), then soft caps */
      A.msIdle = msSoftCap((base.ms + S.ms) * (1 + tot.mspct/100));
      A.msE    = msSoftCap((base.ms + S.ms) * (1 + (tot.mspct + A.eMs)/100));
      A.msEAwk = msSoftCap((base.ms + S.ms) * (1 + (tot.mspct + A.eMs + A.eAwkMs)/100));
      /* Blazing Stampede decays over 1.5s down to 30% of the bonus it started with,
         so the burst figure above is only true for a moment. */
      const DECAY = 0.3;
      A.eMsDecay    = A.eMs * DECAY;
      A.eAwkMsDecay = (A.eMs + A.eAwkMs) * DECAY;
      A.msEDecay    = msSoftCap((base.ms + S.ms) * (1 + (tot.mspct + A.eMsDecay)/100));
      A.msEAwkDecay = msSoftCap((base.ms + S.ms) * (1 + (tot.mspct + A.eAwkMsDecay)/100));

      if(!learned.e){ A.eMs = 0; A.eAwkMs = 0; A.eMsDecay = 0; A.eAwkMsDecay = 0;
                      A.msEDecay = A.msIdle; A.msEAwkDecay = A.msIdle; }
      A.rOnHit    = lerp(10,40,L) + 0.35*tot.ap;
      A.rPerTick  = R1(T.rPerSec,rr) + 0.175*tot.ap;
      A.rTotal    = A.rPerTick * 8;
      A.rSlow     = R1(T.rSlow,rr);
      A.rAwkTick  = lerp(1, 1.84, L) + 0.0044*tot.ap;
      A.rAwkTotal = A.rAwkTick * 8;
      A.rAwkSlow  = R1(T.rAwkSlow,rr);
      return A;
    }
  };
