/* The settings window. Every change is written straight away — there is no
   save button to forget, and the overlay picks it up on the next poll. */

const esc = s => String(s).replace(/[&<>"']/g,
  c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

let settings = null;
let bounds = { min: 5, max: 120 };
let objectives = [];
let savedTimer = null;

const $ = id => document.getElementById(id);

function noteSaved() {
  $("saved").textContent = "enregistré";
  clearTimeout(savedTimer);
  savedTimer = setTimeout(() => { $("saved").textContent = ""; }, 1400);
}

async function push() {
  settings = await window.overlay.setSettings(settings);
  noteSaved();
}

function drawObjectives() {
  $("objs").innerHTML = objectives.map(o => {
    const s = settings.objectives[o.id] || { enabled: true, lead: null };
    return `<div class="row ${s.enabled ? "" : "off"}" data-id="${esc(o.id)}">
      <input type="checkbox" data-on="${esc(o.id)}" ${s.enabled ? "checked" : ""}>
      <span class="nm">${esc(o.label.fr)}</span>
      <input type="number" data-lead="${esc(o.id)}"
             min="${bounds.min}" max="${bounds.max}"
             placeholder="${settings.leadSeconds}"
             value="${s.lead === null ? "" : s.lead}"
             ${s.enabled ? "" : "disabled"}>
      <span class="val">s</span>
    </div>`;
  }).join("");

  $("objs").querySelectorAll("input[data-on]").forEach(el =>
    el.addEventListener("change", async () => {
      settings.objectives[el.dataset.on].enabled = el.checked;
      await push();
      drawObjectives();
    }));

  $("objs").querySelectorAll("input[data-lead]").forEach(el =>
    el.addEventListener("change", async () => {
      const raw = el.value.trim();
      /* an empty field means "follow the general setting" rather than zero */
      if (raw === "") {
        settings.objectives[el.dataset.lead].lead = null;
      } else {
        const n = Math.min(bounds.max, Math.max(bounds.min, Math.round(Number(raw) || 0)));
        settings.objectives[el.dataset.lead].lead = n;
      }
      await push();
      drawObjectives();
    }));
}

function drawGlobal() {
  $("lead").min = bounds.min;
  $("lead").max = bounds.max;
  $("lead").value = settings.leadSeconds;
  $("leadVal").textContent = settings.leadSeconds + " s";
  $("showList").checked = settings.showList;
  $("lang").value = settings.lang;
}

$("lead").addEventListener("input", () => {
  settings.leadSeconds = Number($("lead").value);
  $("leadVal").textContent = settings.leadSeconds + " s";
  /* the placeholder of every field following the general setting moves too */
  drawObjectives();
});
$("lead").addEventListener("change", push);

$("showList").addEventListener("change", async () => {
  settings.showList = $("showList").checked;
  await push();
});
$("lang").addEventListener("change", async () => {
  settings.lang = $("lang").value === "en" ? "en" : "fr";
  await push();
});

/* ---- the optional account ---------------------------------------- */

async function drawAuth() {
  const a = await window.overlay.authStatus();
  const acct = $("acct"), btn = $("authBtn");
  acct.textContent = a.signedIn ? ("connecté" + (a.name ? " — " + a.name : "")) : "non connecté";
  btn.textContent = a.signedIn ? "Se déconnecter" : "Connexion Discord";
  btn.disabled = false;
  if (!a.canRemember)
    $("authHint").innerHTML +=
      " <em>Cette machine ne peut pas garder la session chiffrée :" +
      " il faudra se reconnecter à chaque démarrage.</em>";
}

$("authBtn").addEventListener("click", async () => {
  const btn = $("authBtn");
  const a = await window.overlay.authStatus();
  btn.disabled = true;
  if (a.signedIn) {
    await window.overlay.signOut();
  } else {
    btn.textContent = "ouverture du navigateur…";
    const r = await window.overlay.signIn();
    if (!r.ok) { $("acct").textContent = "échec : " + r.error; }
  }
  await drawAuth();
});

$("buildsOn").addEventListener("change", async () => {
  settings.builds.enabled = $("buildsOn").checked;
  await push();
});

async function drawUpdate() {
  const st = await window.overlay.updateState();
  if (!st || !st.available) return;              /* à jour : on ne dit rien */
  $("updBox").hidden = false;
  $("updTxt").textContent =
    "Version " + st.available.version + " disponible (vous avez " + st.installed + ")";
}
$("updBtn").addEventListener("click", () => window.overlay.openUpdate());

(async () => {
  const got = await window.overlay.getSettings();
  settings = got.settings;
  objectives = got.objectives;
  bounds = got.bounds;
  drawGlobal();
  drawObjectives();
  $("buildsOn").checked = settings.builds.enabled;
  drawAuth();
  drawUpdate();
})();
