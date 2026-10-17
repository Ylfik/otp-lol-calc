/* singed — GENERE par tools/generate-module.js, a relire avant mise en ligne.
   Source : data/abilities/Singed.json + data/champion-base.json.
   Les valeurs sortent telles quelles des donnees du wiki : rien n'a ete
   invente, mais rien n'a ete verifie en jeu non plus. Les TODO en bas du
   fichier disent ce que le generateur n'a pas su lire. */
window.CHAMPION = {
    key:"singed", name:"Singed", label:"Singed", splash:0,
    base:{hp:[650,96], mana:[330,45], ad:[63,3.4],
          ar:[34,4.2], mr:[32,2.05],
          as:0.7, asPerLevel:1.9, ms:345},
    abilities_meta:[
      {k:"q", en:"Poison Trail", fr:"Piste empoisonnée"},
      {k:"w", en:"Mega Adhesive", fr:"Attrape-mouche"},
      {k:"e", en:"Fling", fr:"Projection"},
      {k:"r", en:"Insanity Potion", fr:"Potion de démence"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor((L - 1) / 5)),   /* ultime : 6, 11, 16 */
    maxRank: 5,
    ranks:{
      qFlat:[40,60,80,100,120], qAP:0.85,
      wSlow:[50,55,60,65,70], wCd:[17,16,15,14,13],
      eFlat:[50,60,70,80,90], eHpPct:[6,6.5,7,7.5,8], eAP:0.55, eCc:[1,1.25,1.5,1.75,2], eCd:[10,9.5,9,8.5,8],
      rCd:[100,100,100]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, bonusHP, learned, lerp} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      /* Q — Poison Trail */
      A.qDmg = R(T.qFlat,qr) + T.qAP*ap;
      /* W — Mega Adhesive */
      A.wSlow = R(T.wSlow,wr);
      /* E — Fling */
      A.eHpPct = R(T.eHpPct,er);   /* % des PV de la cible, applique dans onStep */
      A.eDmg = R(T.eFlat,er) + T.eAP*ap;
      A.eCc = R(T.eCc,er);
      A.wCd = R(T.wCd,wr)/ah; A.eCd = R(T.eCd,er)/ah;
      A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qDmg=0; }
      if(!learned.w){ A.wSlow=0; }
      if(!learned.e){ A.eHpPct=0; A.eDmg=0; A.eCc=0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Noxious Slipstream","Sillage toxique"],
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q", kind:"spell", en:"Q — Poison Trail", fr:"Q — Piste empoisonnée"},
      {id:"w", kind:"cast", label:"W", en:"W — Mega Adhesive", fr:"W — Attrape-mouche"},
      {id:"e", kind:"spell", en:"E — Fling", fr:"E — Projection"}
    ],
    onStep(key, st, c){
      const {A, hp, cur} = c, out = {parts:[]};
      if(st.id === "q") out.parts.push({n:"poisonTrail", v:A.qDmg, type:"magic"});
      if(st.id === "e") out.parts.push({n:"fling", v:A.eDmg + hp * A.eHpPct/100, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      /* TODO: libelles generiques — a affiner a la relecture */
      return [
        [{lab:TR("damage"), val:n0(A.qDmg)}],
        [{lab:TR("slow"), val:pc(A.wSlow)},
         {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("mPpct"), val:pc(A.eHpPct)},
         {lab:TR("damage"), val:n0(A.eDmg)},
         {lab:TR("comboTime"), val:n0(A.eCc)},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };

/* ------------------------------------------------------------------
   A RELIRE — ce que le generateur n'a pas su lire dans les donnees :
   - Q : pas de ligne de degats simple, « Minimum Magic Damage » prise comme ligne principale
   - Q / Magic Damage per Tick : ligne non modelisee (20/4 to 60/4 (+ 42.5/4% AP))
   - Q / Magic Damage per Second : ligne non modelisee (20 to 60 (+ 42.5% AP))
   - Q : aucune recharge dans les donnees wiki
   - R / Bonus Stats : ligne non modelisee (25 to 85)
   - R / HP/Mana Regenerated per 0.5 Seconds : ligne non modelisee (25/10 to 85/10)
   - R / Total HP/Mana Regenerated over the duration : ligne non modelisee (25*5 to 85*5)
   - passif : 2 blocs dans le wiki (Noxious Slipstream, Empowered Bulwark) — seul le premier est modelise
   - passif : aucune ligne chiffree dans les donnees (le wiki met ses valeurs dans la description) — a ecrire a la main
   ------------------------------------------------------------------ */
