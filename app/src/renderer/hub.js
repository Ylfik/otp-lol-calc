/* The main window: whether the app is working, and what to send to the
   client while the draft is on. Everything here is a plain question to
   the main process — the window holds no state of its own beyond which
   build is selected. */

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g,
  c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

let chosenId = null;
let lastSig = null;

/* ---- état général -------------------------------------------------- */

function drawState(s) {
  const dot = $("dot");
  dot.className = "dot" + (s.game ? " on" : s.client ? " warm" : "");
  $("stateTxt").textContent =
    s.game ? "Partie en cours" :
    s.client ? "Client League détecté" :
    "En attente du client League";
  $("stateSub").textContent =
    s.game ? "L'overlay s'affiche par-dessus le jeu."
           : s.client ? "Les alertes démarreront avec la partie."
           : "L'app tourne. Rien à faire : lancez League.";
}

/* ---- la sélection des champions ------------------------------------ */

/* The main process pushes several times a second. Rebuilding the section
   each time would throw away the import's reply — and the click that was
   half way through — so the draft is only redrawn when it has really
   changed; choosing a build repaints the selection in place. */

function paintPick(builds) {
  for (const el of document.querySelectorAll("[data-pick]"))
    el.classList.toggle("sel", el.dataset.pick === chosenId);
  const pick = builds.find(b => b.id === chosenId);
  const what = $("what");
  if (what) what.textContent = pick
    ? `${pick.runes ? "runes" : "pas de runes"} · ${pick.items} objet${pick.items > 1 ? "s" : ""}`
    : "";
  const imp = $("imp");
  if (imp) imp.disabled = !pick;
}

let signedIn = false;

function drawDraft(d) {
  const box = $("draftBody");
  const state = d || { active: false, champion: "", builds: [] };
  const builds = state.builds || [];
  const sig = JSON.stringify([state.active, state.champion, builds.map(b => b.id), !!signedIn]);
  if (sig === lastSig) return;          /* rien de neuf : on ne touche à rien */
  lastSig = sig;
  chosenId = builds.some(b => b.id === chosenId) ? chosenId : ((builds[0] || {}).id || null);

  if (!state.active) {
    box.innerHTML = `<p class="sub">En attente d'une sélection de champions…</p>`;
    return;
  }
  if (!state.champion) {
    box.innerHTML = `<p class="sub">Sélection en cours. Choisissez un champion
      pour voir ses builds.</p>`;
    return;
  }
  if (!builds.length) {
    /* dire laquelle des deux sources a été consultée : « aucun build »
       alors qu'on en a enregistré dix est un message qui ment */
    box.innerHTML = signedIn
      ? `<p class="sub"><strong>${esc(state.champion)}</strong> — rien pour ce champion,
         ni dans vos builds enregistrés ni parmi ceux publiés.<br>
         Vos builds ne montent sur le site qu'une fois connecté : ouvrez
         otp-lol-calc en étant connecté et ils seront repris.</p>`
      : `<p class="sub"><strong>${esc(state.champion)}</strong> — aucun build publié
         pour ce champion.<br>Connectez-vous pour ajouter vos builds enregistrés.</p>`;
    return;
  }

  box.innerHTML =
    `<p class="sub" style="margin-bottom:9px"><strong>${esc(state.champion)}</strong>
       · ${builds.length} build${builds.length > 1 ? "s" : ""}</p>
     <div class="builds">${builds.map(b => `
       <div class="b" data-pick="${esc(b.id)}">
         <div class="t">
           <div class="n">${esc(b.name)}</div>
           <div class="w">${b.mine ? "votre bibliothèque" : "par " + esc(b.author)}${
             b.summary ? " · " + esc(b.summary) : ""}</div>
         </div>
         ${b.mine ? `<span class="tag">à vous</span>` : ""}
       </div>`).join("")}</div>
     <div class="row" style="padding-top:0">
       <span class="nm sub" id="what"></span>
       <button class="btn go" id="imp">Importer</button>
     </div>
     <div id="result"></div>`;

  box.querySelectorAll("[data-pick]").forEach(el =>
    el.addEventListener("click", () => { chosenId = el.dataset.pick; paintPick(builds); }));

  $("imp").addEventListener("click", async () => {
    const r = $("result"), imp = $("imp");
    imp.disabled = true;
    r.className = ""; r.textContent = "envoi au client…";
    try {
      const out = await window.overlay.importBuild(chosenId);
      r.className = out.ok ? "ok" : "ko";
      r.textContent = out.ok ? "Importé : " + out.done.join(", ") : "Échec : " + out.error;
    } catch (e) {
      r.className = "ko";
      r.textContent = "Échec : " + (e && e.message ? e.message : e);
    }
    imp.disabled = false;
  });

  paintPick(builds);
}

/* ---- compte, mise à jour, boutons ---------------------------------- */

async function drawAuth() {
  const a = await window.overlay.authStatus();
  $("acct").textContent = a.signedIn
    ? "connecté" + (a.name ? " — " + a.name : "") : "non connecté";
  $("authBtn").textContent = a.signedIn ? "Se déconnecter" : "Connexion Discord";
  $("authBtn").disabled = false;
}

$("authBtn").addEventListener("click", async () => {
  const a = await window.overlay.authStatus();
  $("authBtn").disabled = true;
  if (a.signedIn) await window.overlay.signOut();
  else {
    $("authBtn").textContent = "ouverture du navigateur…";
    const r = await window.overlay.signIn();
    if (!r.ok) $("acct").textContent = "échec : " + r.error;
  }
  await drawAuth();
});

function drawUpdate(said) {
  if (!said) return;
  $("updBox").hidden = !said.show;
  $("updTxt").textContent = said.text;
  $("updSub").textContent = said.detail;
  $("updInstall").hidden = !said.canInstall;
  $("updBtn").hidden = !said.canOpen;
  $("updBar").hidden = said.percent === null;
  if (said.percent !== null) $("updFill").style.width = said.percent + "%";
}

$("updBtn").addEventListener("click", () => window.overlay.openUpdate());
$("updInstall").addEventListener("click", async () => {
  $("updInstall").disabled = true;
  $("updSub").textContent = "redémarrage…";
  const r = await window.overlay.installUpdate();
  if (!r.ok) { $("updSub").textContent = "échec : " + r.error; $("updInstall").disabled = false; }
});
$("setBtn").addEventListener("click", () => window.overlay.openSettings());
$("hideBtn").addEventListener("click", () => window.overlay.hideHub());

/* ---- flux ----------------------------------------------------------- */

window.overlay.onHub(p => {
  drawState(p.state || {});
  signedIn = !!p.signedIn;
  drawDraft(p.draft);
  drawUpdate(p.said);
});

(async () => {
  const info = await window.overlay.hubInfo();
  $("ver").textContent = "v" + info.version;
  if (info.icon) $("logo").src = info.icon;
  drawAuth();
  drawUpdate((await window.overlay.autoUpdate()).said);
})();
