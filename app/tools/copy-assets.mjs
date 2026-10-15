/* tsc only emits JavaScript, so the page, its script and the preload
   bridge have to be carried over by hand. Written in Node rather than as
   a shell line so that it behaves the same on Windows. */

import { cp, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const jobs = [
  ["src/renderer", "dist/src/renderer"],
  ["src/main/preload.cjs", "dist/src/main/preload.cjs"]
];

for (const [from, to] of jobs) {
  const src = path.join(root, from);
  const dst = path.join(root, to);
  await mkdir(path.dirname(dst), { recursive: true });
  await cp(src, dst, { recursive: true });
  console.log("copie :", from, "->", to);
}
