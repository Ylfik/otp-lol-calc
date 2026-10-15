/* Draws what the main process sends. Plain JavaScript on purpose: the page
   runs with no Node access, and there is nothing here worth a build step. */

const T = {
  fr: { waiting: "en attente d'une partie…", up: "disponible",
        soon: "dans", alert: "arrive dans", error: "lecture impossible" },
  en: { waiting: "waiting for a game…", up: "up",
        soon: "in", alert: "due in", error: "cannot read the game" }
};
let lang = "fr";

const mmss = s => {
  const n = Math.max(0, Math.round(s));
  return Math.floor(n / 60) + ":" + String(n % 60).padStart(2, "0");
};
const esc = s => String(s).replace(/[&<>"']/g,
  c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const listEl = document.getElementById("list");
const alertsEl = document.getElementById("alerts");
const statusEl = document.getElementById("status");

function drawList(states) {
  const shown = states.filter(s => s.status !== "gone" && s.inSeconds !== null);
  shown.sort((a, b) => a.inSeconds - b.inSeconds);
  listEl.innerHTML = shown.map(s => {
    const up = s.status === "up";
    return `<div class="card ${up ? "up" : "soon"}" data-id="${esc(s.id)}">
      <span class="name">${esc(s.label[lang] || s.label.en)}</span>
      <span class="time">${up ? T[lang].up : mmss(s.inSeconds)}</span>
    </div>`;
  }).join("");
}

/* An alert counts down on screen and leaves when the objective lands.
   Showing a number frozen at the moment it appeared would be worse than
   showing nothing: a few seconds later it is simply wrong. */
const live = new Map();   /* key -> {el, spawnAt, label} */

function showAlert(a) {
  const key = `${a.id}@${Math.round(a.spawnAt)}`;
  if (live.has(key)) return;
  const el = document.createElement("div");
  el.className = "alert";
  el.innerHTML = `<small></small><span class="who"></span>`;
  alertsEl.appendChild(el);
  live.set(key, { el, spawnAt: a.spawnAt, label: a.label });
  paintAlert(key, a.inSeconds);
}

function paintAlert(key, left) {
  const a = live.get(key);
  if (!a) return;
  a.el.querySelector("small").textContent = `${T[lang].alert} ${Math.max(0, left)}s`;
  a.el.querySelector(".who").textContent = a.label[lang] || a.label.en;
}

function tickAlerts(gameTime) {
  for (const [key, a] of live) {
    const left = Math.round(a.spawnAt - gameTime);
    if (left <= 0) {
      live.delete(key);
      a.el.classList.add("fade");
      setTimeout(() => a.el.remove(), 450);
      continue;
    }
    paintAlert(key, left);
  }
}

function clearAlerts() {
  live.clear();
  alertsEl.innerHTML = "";
}

let showList = true;

const applySettings = s => {
  if (!s) return;
  lang = s.lang === "en" ? "en" : "fr";
  showList = s.showList !== false;
  if (!showList) listEl.innerHTML = "";
};

window.overlay.onTick(p => {
  applySettings(p.settings);
  if (showList) drawList(p.states);
  (p.alerts || []).forEach(showAlert);
  tickAlerts(p.gameTime);
  drawGuide(p.guide, p.siteNote);
  drawUpdate(p.update);
  statusEl.textContent = mmss(p.gameTime);
});

window.overlay.onStatus(p => {
  applySettings(p.settings);
  if (p.status !== "running") {
    listEl.innerHTML = "";
    clearAlerts();
    drawGuide(null);
    statusEl.textContent = T[lang].waiting;
  }
});

/* a change made in the settings window takes effect at once */
window.overlay.onSettings(s => applySettings(s));

/* ------------------------------------------------------------------
   What otp-lol-calc advises for the champion being played.
   The useful question mid-game is not "what does this build end on"
   but "what do I put my next point into".
   ------------------------------------------------------------------ */
const guideEl = document.getElementById("guide");
const GT = {
  fr: { next: "Monter", none: "aucun build publié", by: "par", lvl: "niv" },
  en: { next: "Level",  none: "no published build", by: "by",  lvl: "lv" }
};

function drawGuide(g, note) {
  if (!g || !g.next) {
    /* nothing to advise is not an error: most champions have no build yet */
    guideEl.className = "none";
    guideEl.innerHTML = "";
    return;
  }
  const t = GT[lang] || GT.fr;
  guideEl.className = "";
  guideEl.innerHTML =
    `<div class="nxt">${esc(t.next)} <b>${esc(String(g.next).toUpperCase())}</b></div>` +
    `<div class="who">${esc(g.name)} · ${esc(t.by)} ${esc(g.author)}</div>` +
    (g.summary ? `<div class="path">${esc(g.summary)} · ${esc(t.lvl)} ${esc(String(g.level))}</div>` : "");
}

/* ------------------------------------------------------------------
   A newer version exists. Said once, never acted on by itself.
   ------------------------------------------------------------------ */
const updEl = document.getElementById("upd");
const UT = {
  fr: { has: "Version", avail: "disponible", open: "Ouvrir la page" },
  en: { has: "Version", avail: "available",  open: "Open the page" }
};

function drawUpdate(u) {
  if (!u) { updEl.className = "none"; updEl.innerHTML = ""; return; }
  const t = UT[lang] || UT.fr;
  updEl.className = "";
  updEl.innerHTML = `${esc(t.has)} <b>${esc(u.version)}</b> ${esc(t.avail)}`;
}

window.overlay.onUpdate(st => drawUpdate(st && st.available));
