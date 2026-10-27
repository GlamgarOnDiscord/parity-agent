// Serve a folder of static files on 127.0.0.1: bun scripts/serve-static.ts <dir> [--port 4173]
// For examples and CI only; paths outside the folder are refused.
import { realpathSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import { parseArgs } from "node:util";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { port: { type: "string", default: "4173" } },
});
const root = realpathSync(resolve(positionals[0] ?? "."));
const server = Bun.serve({
  hostname: "127.0.0.1",
  port: Number(values.port),
  async fetch(req) {
    const path = decodeURIComponent(new URL(req.url).pathname);
    let file = resolve(join(root, path.endsWith("/") ? `${path}index.html` : path));
    try {
      file = realpathSync(file);
    } catch {
      return new Response("not found", { status: 404 });
    }
    if (file !== root && !file.startsWith(root + sep)) return new Response("forbidden", { status: 403 });
    return new Response(Bun.file(file));
  },
});
console.log(`Serving ${root} on http://127.0.0.1:${server.port}/`);
