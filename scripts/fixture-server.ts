// Serves the rebuilt-invoice fixture on 127.0.0.1. `roundOnce` true reproduces the legacy rounding.
const page = await Bun.file(new URL("../fixtures/apps/rebuilt-invoice/index.html", import.meta.url)).text();

export function serveFixture(roundOnce: boolean, port = 0) {
  const html = page.replace(
    "<script>",
    `<script>window.PARITY_ROUND_ONCE = ${roundOnce};</script>\n<script>`,
  );
  return Bun.serve({
    hostname: "127.0.0.1",
    port,
    fetch: () => new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } }),
  });
}
