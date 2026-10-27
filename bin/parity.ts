#!/usr/bin/env bun
// One entry point for every Parity command: `parity <command> [options]`. Each command is a script in scripts/,
// run in this process with its own arguments.
import { resolve } from "node:path";

const COMMANDS: Record<string, { script: string; about: string; models: boolean }> = {
  prove: { script: "prove.ts", about: "replay a proof on a web app and print every field", models: false },
  report: {
    script: "report.ts",
    about: "prove and write the one-page report and the diff screen data",
    models: false,
  },
  serve: {
    script: "../src/server/index.ts",
    about: "local screens: rules and diff (link printed at launch)",
    models: false,
  },
  capture: {
    script: "capture.ts",
    about: "read a narrated recording into fields, rules and evidence",
    models: true,
  },
  rebuild: {
    script: "rebuild.ts",
    about: "build the app from accepted rules with Muse Code, then prove it",
    models: true,
  },
  explore: {
    script: "explore.ts",
    about: "let Muse Spark computer use explore an app, capped",
    models: true,
  },
  record: {
    script: "record-reference.ts",
    about: "record a web app as the reference and measure its noise",
    models: false,
  },
  export: { script: "export-playwright.ts", about: "write a Playwright test from a proof", models: false },
  film: {
    script: "record-replay.ts",
    about: "film the rebuilt app next to the legacy recording",
    models: false,
  },
  models: { script: "check-models.ts", about: "one real call per Meta model", models: true },
};

const ROOT = resolve(import.meta.dir, "..");
const [command, ...rest] = process.argv.slice(2);

function help() {
  const width = Math.max(...Object.keys(COMMANDS).map((c) => c.length));
  console.log("parity <command> [options]\n");
  for (const [name, c] of Object.entries(COMMANDS)) {
    console.log(
      `  ${name.padEnd(width)}  ${c.about}${c.models ? "  (model calls, logged with their cost)" : ""}`,
    );
  }
  console.log("\nCommands without model calls never send anything off this machine.");
}

if (!command || command === "help" || command === "--help" || command === "-h") {
  help();
} else if (command === "version" || command === "--version") {
  const pkg = await Bun.file(resolve(ROOT, "package.json")).json();
  console.log(pkg.version ?? "0.0.0");
} else {
  const entry = COMMANDS[command];
  if (!entry) {
    console.error(`Unknown command "${command}".\n`);
    help();
    process.exit(2);
  }
  // The scripts read their arguments from process.argv and resolve paths from the repository root.
  process.argv = [process.argv[0] ?? "bun", resolve(ROOT, "scripts", entry.script), ...rest];
  process.chdir(ROOT);
  await import(resolve(ROOT, "scripts", entry.script));
}
