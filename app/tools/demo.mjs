/* Runs the real reader against the fake game and prints what the overlay
   would show — no Electron, no League. This is the end-to-end check: the
   poller, the schedule and the alerts, on one script.

   node tools/demo.mjs            */

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const { pollGame, teamLookup } = await import(path.join(root, "dist/src/main/liveClient.js"));
const { objectiveStates, dueAlerts, mmss } =
  await import(path.join(root, "dist/src/shared/objectives.js"));
const { defaultSettings, leadFor } = await import(path.join(root, "dist/src/shared/settings.js"));

/* the same settings the app uses, so the demo proves the knob works */
const settings = defaultSettings();
if (process.env.OVERLAY_LEAD) settings.leadSeconds = Number(process.env.OVERLAY_LEAD);
if (process.env.DEMO_BARON_LEAD) settings.objectives.baron.lead = Number(process.env.DEMO_BARON_LEAD);
if (process.env.DEMO_OFF) for (const id of process.env.DEMO_OFF.split(","))
  if (settings.objectives[id]) settings.objectives[id].enabled = false;
console.log(`  reglage : ${settings.leadSeconds}s en general` +
  (settings.objectives.baron.lead ? `, ${settings.objectives.baron.lead}s pour le baron` : "") +
  (process.env.DEMO_OFF ? `, coupe : ${process.env.DEMO_OFF}` : ""));

const PORT = 2998;
const mock = spawn(process.execPath, [path.join(root, "dist/tools/mock-game.js")], {
  env: { ...process.env, MOCK_PORT: String(PORT), MOCK_SPEED: "60", MOCK_START: "250" },
  stdio: ["ignore", "pipe", "inherit"]
});
mock.stdout.on("data", d => process.stdout.write("  [faux jeu] " + d));

await new Promise(r => setTimeout(r, 700));

const seen = new Set();
let ticks = 0, alerts = 0;

const stop = pollGame(
  snap => {
    ticks++;
    const states = objectiveStates(snap.gameTime, snap.events, teamLookup(snap.players));
    for (const a of dueAlerts(states, id => leadFor(settings, id), seen)) {
      alerts++;
      console.log(`  ALERTE  ${mmss(snap.gameTime)}  ${a.label.fr} dans ${a.inSeconds}s`);
    }
    if (ticks % 10 === 0) {
      const live = states.filter(s => s.status !== "gone" && s.inSeconds !== null)
        .sort((a, b) => a.inSeconds - b.inSeconds)
        .map(s => `${s.label.fr} ${s.status === "up" ? "dispo" : mmss(s.inSeconds)}`);
      console.log(`  ${mmss(snap.gameTime)} | ${live.join("  ·  ") || "rien en vue"}`);
    }
  },
  (st, detail) => console.log(`  [etat] ${st}${detail ? " — " + detail : ""}`),
  { port: PORT, scheme: "http", everyMs: 250 }
);

setTimeout(() => {
  stop(); mock.kill();
  console.log(`\n  ${ticks} lectures, ${alerts} alertes levees.`);
  process.exit(alerts > 0 ? 0 : 1);
}, 9000);
