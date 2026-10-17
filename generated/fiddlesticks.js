/* fiddlesticks — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Fiddlesticks.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"fiddlesticks", name:"Fiddlesticks", label:"Fiddlesticks", splash:0,
    base:{hp:[650,106], mana:[500,28], ad:[55,2.65],
          ar:[34,4.7], mr:[30,1.3],
          as:0.625, asPerLevel:2.11, ms:335},
    abilities_meta:[
      {k:"q", en:"Terrify", fr:"Terreur"},
      {k:"w", en:"Bountiful Harvest", fr:"Moisson fructueuse"},
      {k:"e", en:"Reap", fr:"Fauchaison"},
      {k:"r", en:"Crowstorm", fr:"Rafale de corbeaux"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qCc:[1.2,1.4,1.6,1.8,2], qCurPct:[4,4.5,5,5.5,6], qAP100:3, qMin:[40,60,80,100,120], qCcFear:[1.2,1.4,1.6,1.8,2], qMaxCurPct:[8,9,10,11,12], qMaxAP100:6, qMax:[80,120,160,200,240], qCd:[15,14.5,14,13.5,13],
      wFlat:[15,22.5,30,37.5,45], wAP:0.1125, wMissPct:[12,14.5,17,19.5,22], wTotal:[120,180,240,300,360], wTotalAP:0.9, wTotalMissPct:[12,14.5,17,19.5,22], wHeal:[25,32.5,40,47.5,55], wCd:[10,9.5,9,8.5,8],
      eFlat:[70,105,140,175,210], eAP:0.5, eSlow:[30,35,40,45,50], eCd:[10,9,8,7,6],
      rFlat:[750,1250,1750], rAP:2.5, rCd:[140,110,80]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Terrify */
      A.qCc = R(T.qCc,qr);
      A.qCurPct = R(T.qCurPct,qr) + T.qAP100*ap/100;   /* % des PV de la cible, applique dans onStep */
      A.qMin = R(T.qMin,qr);
      A.qCcFear = R(T.qCcFear,qr);
      A.qMaxCurPct = R(T.qMaxCurPct,qr) + T.qMaxAP100*ap/100;   /* % des PV de la cible, applique dans onStep */
      A.qMax = R(T.qMax,qr);
      /* W — Bountiful Harvest */
      A.wMissPct = R(T.wMissPct,wr);   /* % des PV de la cible, applique dans onStep */
      A.wDmg = R(T.wFlat,wr) + T.wAP*ap;
      A.wTotalMissPct = R(T.wTotalMissPct,wr);   /* % des PV de la cible, applique dans onStep */
      A.wTotal = R(T.wTotal,wr) + T.wTotalAP*ap;
      A.wHeal = R(T.wHeal,wr);
      /* E — Reap */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      A.eSlow = R(T.eSlow,er);
      /* R — Crowstorm */
      A.rDmg = R(T.rFlat,rr) + T.rAP*ap;
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qCc=0; A.qCurPct=0; A.qMin=0; A.qCcFear=0; A.qMaxCurPct=0; A.qMax=0; }
      if(!learned.w){ A.wMissPct=0; A.wDmg=0; A.wTotalMissPct=0; A.wTotal=0; A.wHeal=0; }
      if(!learned.e){ A.eDmg=0; A.eSlow=0; }
      if(!learned.r){ A.rDmg=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["A Harmless Scarecrow","Épouvantable épouvantail"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Terrify", fr:"Q — Terreur"},
      {id:"w", kind:"spell", en:"W — Bountiful Harvest", fr:"W — Moisson fructueuse"},
      {id:"e", kind:"spell", en:"E — Reap", fr:"E — Fauchaison"},
      {id:"r", kind:"spell", en:"R — Crowstorm", fr:"R — Rafale de corbeaux"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"terrify", v:cur * A.qCurPct/100 + cur * A.qMaxCurPct/100, type:"magic"});
      if(st.id === "w"){
        out.parts.push({n:"bountifulHarvest", v:A.wDmg + Math.max(0, hp - cur) * A.wMissPct/100 + Math.max(0, hp - cur) * A.wTotalMissPct/100, type:"magic"});
        out.heal = A.wHeal;
      }
      if(st.id === "e") out.parts.push({n:"reap", v:A.eDmg, type:"magic"});
      if(st.id === "r") out.parts.push({n:"crowstorm", v:A.rDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("comboTime"), val:n0(A.qCc)},
         {lab:TR("mPpct"), val:pc(A.qCurPct)},
         {lab:TR("damage"), val:n0(A.qMin)},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("mPpct"), val:pc(A.wMissPct)},
         {lab:TR("damage"), val:n0(A.wDmg)},
         {lab:TR("mPpct"), val:pc(A.wTotalMissPct)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("slow"), val:pc(A.eSlow)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.rDmg)},
         {lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - slot non reconnu « A » pour Basic Attack
   - W : 2 formes dans le wiki (Bountiful Harvest, Drain) — seule la premiere est modelisee
   - E : 2 formes dans le wiki (Reap, Dark Wind) — seule la premiere est modelisee
   - W / Damage per second : ligne non modelisee (120/2 to 360/2 (+ 45% AP))
   - W / Damage per Instance : ligne non modelisee (120/8 to 360/8 (+ 11.25% AP))
   - W / Total Heal per Champion : ligne non modelisee ((120 to 360)*(25 to 55)/100 (+ 90/100*(25 to 55)% AP) (+ (12 to 22)*(25 to 55)/100% of target's missing health))
   - W / Total Heal per Monster : ligne non modelisee (120*1.35*0.45 to 360*1.35*0.45 (+ 90*1.35*0.45% AP) (+ 12*1.35*0.45 to 22*1.35*0.45% of target's missing health))
   - W / Total Heal per Minion : ligne non modelisee (120*0.50*0.15 to 360*0.50*0.15 (+ 90*0.50*0.15% AP) (+ 12*0.50*0.15 to 22*0.50*0.15% of target's missing health))
   - R : pas de ligne de degats simple, « Total Magic Damage » prise comme ligne principale
   - R / Magic Damage per Tick : ligne non modelisee (150*0.25 to 350*0.25 (+ 12.5% AP))
   - passif : 2 blocs dans le wiki (A Harmless Scarecrow, Dread) — seul le premier est modelise
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
