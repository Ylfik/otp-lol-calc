/* shen — loaded on demand by index.html.
   Replace this file alone to change this champion. */
window.CHAMPION = {
    stepMenu:[
      {id:"aa",  kind:"attack", en:"Auto attack",  fr:"Auto-attaque"},
      {id:"aaQ", kind:"attack", empowered:true, en:"Auto, enhanced by Q", fr:"Auto, renforcée par le Q"},
      {id:"q", kind:"cast", label:"Q", en:"Q — Twilight Assault", fr:"Q — Assaut crépusculaire"},
      {id:"e", kind:"spell", en:"E — Shadow Dash",  fr:"E — Ruée de l'ombre"}
    ],
    key:"shen", name:"Shen", splash:0,
    base:{hp:[610,99], mana:[400,0], ad:[64,3], ar:[34,4.2], mr:[32,2.05],
          as:0.751, asPerLevel:3, ms:340},
    abilities_meta:[
      {k:"q", en:"Twilight Assault",  fr:"Assaut crépusculaire"},
      {k:"w", en:"Spirit's Refuge",   fr:"Refuge de l'esprit"},
      {k:"e", en:"Shadow Dash",       fr:"Ruée de l'ombre"},
      {k:"r", en:"Stand United",      fr:"Unis dans l'épreuve"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[10,16,22,28,34,40], qPct:[2,2.5,3,3.5,4], qPctUp:[5,5.5,6,6.5,7],
      qSlow:[25,30,35,40,45],
      eDmg:[60,85,110,135,160], eHpPct:11,
      rShield:[120,220,320], rAP:1.35, rHpPct:15,
      qCd:[8,7.25,6.5,5.75,5], wCd:[16,14.5,13,11.5,10], eCd:[18,16,14,12,10], rCd:[200,180,160]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, lerp, learned} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      const bonusHP = tot.hp - c.base.hp;
      /* the flat part of Twilight Assault grows with level, not with rank */
      A.qFlat  = lerp(10, 40, L, 16);
      A.qPct   = R(T.qPct,qr)   + 1.5*ap/100;
      A.qPctUp = R(T.qPctUp,qr) + 2.0*ap/100;
      A.qSlow  = R(T.qSlow,qr);
      A.eDmg   = R(T.eDmg,er) + T.eHpPct/100 * bonusHP;
      A.rShield= R(T.rShield,rr) + T.rAP*ap + T.rHpPct/100 * bonusHP;
      A.rShieldMax = A.rShield * 1.6;
      A.qAS = 50;                 /* granted when the blade catches a champion */
      /* Ki Barrier: a shield after every ability, sooner if it caught someone */
      A.pShield = lerp(47, 120, L, 20) + 0.13 * bonusHP;
      A.pCd     = 13 / ah;
      A.pCdHit  = Math.max(0, 13 - (lerp(4, 8, Math.min(18, L)) + Math.max(0, L - 18) * 0.125)) / ah;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah;
      A.eCd = R(T.eCd,er)/ah; A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qFlat=0; A.qPct=0; A.qPctUp=0; A.qAS=0; }
      if(!learned.e) A.eDmg=0;
      if(!learned.r){ A.rShield=0; A.rShieldMax=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Ki Barrier","Barrière de Ki"],
    passiveRows(c){
      const {A, TR, n0, nf1} = c;
      return [
        {lab:TR("shield"),   val:n0(A.pShield)},
        {lab:TR("sPcd"),     val:nf1.format(A.pCd) + " s"},
        {lab:TR("sPcdHit"),  val:nf1.format(A.pCdHit) + " s", awk:true}
      ];
    },
    castNote(st){
      if(st.id === "q") return isFR() ? "Assaut crépusculaire — la lame traverse, 3 attaques renforcées"
                                      : "Twilight Assault — the blade passes through, 3 attacks enhanced";
      return isFR() ? "aucun dégât propre" : "no damage of its own";
    },
    combos:[],
    onStep(key, st, c){
      const {A, hp} = c, out = {parts:[]};
      /* the blade caught someone on the way, so the higher figure applies
         and the attack speed comes with it */
      if(st.kind === "cast" && st.id === "q") out.asBonus = A.qAS;
      if(st.kind === "spell" && st.id === "e")
        out.parts.push({n:"shadowDash", v:A.eDmg, type:"phys"});
      if(st.kind === "attack" && st.empowered)
        out.parts.push({n:"twilightAssault",
                        v:A.qFlat + hp * A.qPctUp/100, type:"magic"});
      return out;
    },
    comboEnd(){ return {parts:[]}; },
    comboRows(key, x){
      const {c, TR, n0} = x;
      return [
        {lab:TR("damage"), val:n0(c.dmg), hi:true},
        {lab:TR("dps"), val:n0(c.dps)},
        {lab:TR("targetLeft"), val:n0(c.leftover)}];
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      return [
        [{lab:TR("sQflat"), val:n0(A.qFlat)}, {lab:TR("sQpct"), val:pc(A.qPct)},
         {lab:TR("sQpctUp"), val:pc(A.qPctUp), awk:true},
         {lab:TR("sQas"), val:"+" + pc(A.qAS), awk:true},
         {lab:TR("slow"), val:pc(A.qSlow)}, {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)}, {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("shield"), val:n0(A.rShield)}, {lab:TR("sRmax"), val:n0(A.rShieldMax), awk:true},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    }
  };
