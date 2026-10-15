/* The spawn warnings, and nothing else.
   Each one counts down and leaves on its own when the objective lands. */

const T = {
  fr: { in: "arrive dans" },
  en: { in: "due in" }
};
let lang = "fr";

const esc = s => String(s).replace(/[&<>"']/g,
  c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const wrap = document.getElementById("wrap");
const live = new Map();          /* key -> {el, spawnAt, label} */

function paint(key, left) {
  const a = live.get(key);
  if (!a) return;
  const t = T[lang] || T.fr;
  a.el.innerHTML =
    `<div class="in">${esc(t.in)} ${Math.max(0, left)}s</div>` +
    `<div class="who">${esc(a.label[lang] || a.label.en)}</div>`;
}

function show(a) {
  const key = `${a.id}@${Math.round(a.spawnAt)}`;
  if (live.has(key)) return;
  const el = document.createElement("div");
  el.className = "alert";
  wrap.appendChild(el);
  live.set(key, { el, spawnAt: a.spawnAt, label: a.label });
  paint(key, a.inSeconds);
}

function tick(gameTime) {
  for (const [key, a] of live) {
    const left = Math.round(a.spawnAt - gameTime);
    if (left <= 0) {
      live.delete(key);
      a.el.classList.add("fade");
      setTimeout(() => a.el.remove(), 450);
      continue;
    }
    paint(key, left);
  }
}

function clear() { live.clear(); wrap.innerHTML = ""; }

window.overlay.onTick(p => {
  if (p.settings) lang = p.settings.lang === "en" ? "en" : "fr";
  (p.alerts || []).forEach(show);
  tick(p.gameTime);
});

window.overlay.onStatus(p => {
  if (p.settings) lang = p.settings.lang === "en" ? "en" : "fr";
  if (p.status !== "running") clear();
});
