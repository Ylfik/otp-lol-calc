/* mordekaiser — loaded on demand by index.html.
   Replace this file alone to change this champion. */
window.CHAMPION = {
    key:"mordekaiser", name:"Mordekaiser", splash:0,
    base:{hp:[645,104], mana:[0,0], ad:[61,4], ar:[37,4.2], mr:[32,2.05],
          as:0.625, asPerLevel:1, ms:335},
    abilities_meta:[
      {k:"q", en:"Obliterate", fr:"Anéantissement"},
      {k:"w", en:"Indestructible", fr:"Indestructible"},
      {k:"e", en:"Death's Grasp", fr:"Poigne de la mort"},
      {k:"r", en:"Realm of Death", fr:"Royaume de la mort"}
    ],
    rankCap: L => Math.min(5, Math.floor((L + 1) / 2)),
    rankCapR: L => Math.min(3, Math.floor(L / 5) + 1),
    maxRank: 5,
    ranks:{
      qFlat:[80,115,150,185,220], qAD:1.20, qAP:0.70, qIso:[1.3,1.35,1.4,1.45,1.5],
      wConv:[0.35,0.375,0.40,0.425,0.45],
      eFlat:[60,80,100,120,140], eAP:0.45, ePen:[5,7.5,10,12.5,15],
      qCd:[8,7,6,5,4], wCd:[12,11,10,9,8], eCd:[16,14,12,10,8], rCd:[140,130,120]
    },
    abilities(c){
      const {A, T, L, qr, wr, er, rr, tot, bonusAD, learned} = c;
      const R = (a,n) => a[Math.max(0, Math.min(a.length-1, n-1))] || 0;
      const ap = tot.ap, ah = 1 + tot.ah/100;
      A.qFlat = R(T.qFlat,qr) + T.qAD*bonusAD + T.qAP*ap + (L >= 10 ? 5*(L-9) : 0);
      A.qIso  = A.qFlat * R(T.qIso,qr);
      A.wConv = R(T.wConv,wr) * 100;
      A.eDmg  = R(T.eFlat,er) + T.eAP*ap;
      A.ePen  = R(T.ePen,er);
      A.qCd = R(T.qCd,qr)/ah; A.wCd = R(T.wCd,wr)/ah;
      A.eCd = R(T.eCd,er)/ah; A.rCd = R(T.rCd,rr)/(1 + tot.uh/100);
      if(!learned.q){ A.qFlat = 0; A.qIso = 0; }
      if(!learned.e){ A.eDmg = 0; A.ePen = 0; }
      A.msIdle = c.msSoftCap((c.base.ms + c.S.ms) * (1 + tot.mspct/100));
      return A;
    },
    passiveName:["Darkness Rise","Montée des ténèbres"],
    passiveRows(c){ const {TR} = c; return [{lab:TR("wipStat"), val:"—"}]; },
    stepMenu:[
      {id:"aa", kind:"attack", en:"Auto attack", fr:"Auto-attaque"},
      {id:"q",  kind:"spell", en:"Q — Obliterate", fr:"Q — Anéantissement"},
      {id:"qI", kind:"spell", iso:true, en:"Q — isolated target", fr:"Q — cible isolée"},
      {id:"e",  kind:"spell", en:"E — Death's Grasp", fr:"E — Poigne de la mort"}
    ],
    onStep(key, st, c){
      const {A} = c, out = {parts:[]};
      if(st.id === "q")  out.parts.push({n:"obliterate", v:A.qFlat, type:"magic"});
      if(st.id === "qI") out.parts.push({n:"obliterateIso", v:A.qIso, type:"magic"});
      if(st.id === "e")  out.parts.push({n:"deathsGrasp", v:A.eDmg, type:"magic"});
      return out;
    },
    abilityRows(c){
      const {A, TR, n0, pc, nf1} = c;
      return [
        [{lab:TR("damage"), val:n0(A.qFlat)}, {lab:TR("mIso"), val:n0(A.qIso), awk:true},
         {lab:TR("cooldown"), val:nf1.format(A.qCd)+" s"}],
        [{lab:TR("mConv"), val:pc(A.wConv)}, {lab:TR("cooldown"), val:nf1.format(A.wCd)+" s"}],
        [{lab:TR("damage"), val:n0(A.eDmg)}, {lab:TR("mPen"), val:pc(A.ePen), awk:true},
         {lab:TR("cooldown"), val:nf1.format(A.eCd)+" s"}],
        [{lab:TR("cooldown"), val:nf1.format(A.rCd)+" s"}]
      ];
    },
    combos:[]
  };
