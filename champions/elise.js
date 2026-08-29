/* elise — loaded on demand by index.html.
   Replace this file alone to change this champion. */
window.CHAMPION = {
    stepMenu:[
      {id:"aa",       kind:"attack", en:"Auto, human",  fr:"Auto, humaine", ranged:true},
      {id:"aaSpider", kind:"attack", spider:true, en:"Auto, spider", fr:"Auto, araignée"},
      {id:"q",  kind:"spell", en:"Q — Neurotoxin",         fr:"Q — Neurotoxine/Morsure venimeuse"},
      {id:"w",  kind:"spell", en:"W — Volatile Spiderling", fr:"W — Araignée explosive/Frénésie symbiotique"},
      {id:"e",  kind:"spell", en:"E — Cocoon",             fr:"E — Cocon/Suspension"},
      {id:"sq", kind:"spell", spider:true, en:"Q — Venomous Bite", fr:"Q — Neurotoxine/Morsure venimeuse"},
      {id:"sw", kind:"spell", en:"W — Skittering Frenzy",  fr:"W — Araignée explosive/Frénésie symbiotique"},
      {id:"spiders", kind:"spell", brood:true,
       en:"Spiderlings, one bite each", fr:"Araignées, une morsure chacune"}
    ],
    key:"elise", name:"Elise", splash:15,
    base:{hp:[620,109], mana:[324,50], ad:[55,3], ar:[30,4.5], mr:[30,1.3],
          as:0.625, asPerLevel:1.75, ms:330},
    /* Spider form is melee at 125 range and adds 25 base move speed */
    spider:{ms:25, range:125},
    abilities_meta:[
      {k:"q", en:"Neurotoxin / Venomous Bite", fr:"Neurotoxine/Morsure venimeuse"},
      {k:"w", en:"Volatile Spiderling / Skittering Frenzy", fr:"Araignée explosive/Frénésie symbiotique"},
      {k:"e", en:"Cocoon / Rappel", fr:"Cocon/Suspension"},
      {k:"r", en:"Spider Form / Human Form", fr:"Forme arachnéenne"}
    ],
    /* Q, W and E cap at 5; the transform has 4 ranks, taken at levels 1, 6, 11 and 16 */
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(4, Math.floor(L / 5) + 1),
    freeRanks: 1,    /* the first rank of her transform is granted at level 1 */
    maxRank: 5,
    ranks:{
      /* human */
      qFlat:      [40,70,100,130,160],
      qCurPct:    4,          /* + 3% per 100 AP, of the target's current health */
      wFlat:      [60,100,140,180,220],
      wAP:        0.75,
      eStun:      [1.6,1.8,2.0,2.2,2.4],
      eCd:        [12,11.5,11,10.5,10],
      eRappelCd:  [22,21,20,19,18],
      /* spider */
      sqFlat:     [50,80,110,140,170],
      sqMissPct:  8,          /* + 3% per 100 AP, of the target's missing health */
      swAS:       [60,75,90,105,120],
      /* passive, by transform rank */
      pOnHit:     [12,22,32,42],
      pHeal:      [6,8,10,12],
      spiderCap:  [2,3,4,5]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, base, bonusAD, learned} = c;
      const R = (arr, n) => arr[Math.max(0, Math.min(arr.length - 1, n - 1))] || 0;
      const ap = tot.ap;

      /* --- human form --- */
      A.qFlat    = R(T.qFlat, qr);
      A.qCurPct  = T.qCurPct + 3 * ap / 100;        /* of the target's current health */
      A.wDmg     = R(T.wFlat, wr) + T.wAP * ap;
      A.eStun     = R(T.eStun, er);
      A.eCd       = R(T.eCd, er)      / (1 + tot.ah/100);
      A.eRappelCd = R(T.eRappelCd, er)/ (1 + tot.ah/100);
      A.qCd       = 6  / (1 + tot.ah/100);
      A.wCd       = 12 / (1 + tot.ah/100);
      A.swCd      = 6  / (1 + tot.ah/100);

      /* --- spider form --- */
      A.sqFlat     = R(T.sqFlat, qr);
      A.sqMissPct  = T.sqMissPct + 3 * ap / 100;    /* of the target's missing health */
      A.swAS       = R(T.swAS, wr);                 /* bonus attack speed for 3s */

      /* --- Spider Queen, scaling on the transform rank --- */
      A.pOnHit    = R(T.pOnHit, rr) + 0.15 * ap;    /* magic damage on every spider attack */
      A.pHeal     = R(T.pHeal, rr) + 0.08 * ap;     /* healed on the same hit */
      A.spiderCap = R(T.spiderCap, rr);
      /* a spiderling's own bite, and what the whole brood lands in one pass */
      A.spiderHit  = 8 + (26 - 8) * (L - 1) / 17 + 0.10 * ap;
      A.spiderAll  = A.spiderHit * A.spiderCap;

      if(!learned.q){ A.qFlat = 0; A.qCurPct = 0; A.sqFlat = 0; A.sqMissPct = 0; }
      if(!learned.w){ A.wDmg = 0; A.swAS = 0; }
      if(!learned.e){ A.eStun = 0; }

      /* nothing here changes movement or attack rate outside spider form */
      A.msIdle = c.msSoftCap((base.ms + c.S.ms) * (1 + tot.mspct/100));
      A.msSpider = c.msSoftCap((base.ms + 25 + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Spider Queen","Reine araignée"],
    passiveRows(c){
      const {A, TR, n0} = c;
      return [
        {lab:TR("ePassive"),     val:n0(A.pOnHit)},
        {lab:TR("ePassiveHeal"), val:n0(A.pHeal)},
        {lab:TR("eSpiders"),     val:n0(A.spiderCap)},
        {lab:TR("eSpiderHit"),   val:n0(A.spiderHit), awk:true},
        {lab:TR("eSpiderAll"),   val:n0(A.spiderAll), awk:true}
      ];
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      return [
        [{lab:TR("eQhuman"), val:n0(A.qFlat) + " + " + pc(A.qCurPct)},
         {lab:TR("eQspider"), val:n0(A.sqFlat) + " + " + pc(A.sqMissPct), awk:true},
         {lab:TR("cooldown"), val:nf1.format(A.qCd) + " s"}],
        [{lab:TR("eWhuman"), val:n0(A.wDmg)},
         {lab:TR("eWspider"), val:"+" + pc(A.swAS), awk:true},
         {lab:TR("cooldown"), val:nf1.format(A.wCd) + " / " + nf1.format(A.swCd) + " s"}],
        [{lab:TR("eStun"), val:nf1.format(A.eStun) + " s"},
         {lab:TR("eCd"), val:nf1.format(A.eCd) + " s"},
         {lab:TR("eRappel"), val:nf1.format(A.eRappelCd) + " s", awk:true}],
        [{lab:TR("ePassive"), val:n0(A.pOnHit), awk:true},
         {lab:TR("ePassiveHeal"), val:n0(A.pHeal), awk:true},
         {lab:TR("eSpiders"), val:n0(A.spiderCap)},
         {lab:TR("msSpider"), val:n0(A.msSpider), awk:true}]
      ];
    },
    comboRows(key, x){
      const {c, TR, n0} = x;
      return [
        {lab:TR("damage"), val:n0(c.dmg), hi:true},
        {lab:TR("dps"), val:n0(c.dps)},
        {lab:TR("healing"), val:n0(c.heal), dim:c.heal < 1},
        {lab:TR("targetLeft"), val:n0(c.leftover)}];
    },
    /* Three sequences: the human opener, the spider follow-up, and the whole
       thing end to end. Spider attacks carry the passive's magic damage and
       its heal; Venomous Bite applies on-hit effects, Cocoon deals none. */
    combos:[],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.kind === "spell"){
        if(st.id === "q")  out.parts.push({n:"qHuman",
          v:A.qFlat + cur * A.qCurPct/100, type:"magic"});          /* current health */
        if(st.id === "w")  out.parts.push({n:"wHuman", v:A.wDmg, type:"magic"});
        if(st.id === "sq") out.parts.push({n:"qSpider",
          v:A.sqFlat + (hp - cur) * A.sqMissPct/100, type:"magic"}); /* missing health */
        if(st.id === "sw") out.asBonus = A.swAS;   /* Skittering Frenzy, 3s */
        /* Cocoon and Rappel deal nothing */
      }
      if(st.brood)
        out.parts.push({n:"spiderlings", v:A.spiderAll, type:"phys"});
      if(st.kind === "attack" && st.spider){
        out.parts.push({n:"spiderQueen", v:A.pOnHit, type:"magic"});
        out.heal = A.pHeal;
      }
      return out;
    },
    comboEnd(key, c){ return {parts:[]}; },
    spellNote(st){
      if(st.id === "e")  return isFR() ? "Cocon — étourdit, aucun dégât" : "Cocoon — stun, no damage";
      if(st.id === "sw") return isFR() ? "Frénésie grouillante — vitesse d'attaque"
                                       : "Skittering Frenzy — attack speed";
      return isFR() ? "aucun dégât propre" : "no damage of its own";
    }
  };
