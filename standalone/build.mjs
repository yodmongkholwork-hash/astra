// Builds ASTRA as one self-contained HTML file (no server): dist/ASTRA.html
// - Next.js modules are swapped for tiny shims (hash router, lazy dynamic, plain links)
// - /api/oracle is answered in the browser: Claude via the artifact `sample`
//   capability when opened inside Claude, otherwise Demo Mode
// Usage: npm run build:standalone
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const out = join(here, "dist");
mkdirSync(out, { recursive: true });

await esbuild.build({
  entryPoints: [join(here, "main.tsx")],
  bundle: true, minify: true, format: "esm", platform: "browser", target: "es2020",
  outfile: join(out, "app.js"), jsx: "automatic", tsconfig: join(root, "tsconfig.json"),
  logLevel: "warning", legalComments: "none",
  alias: {
    "next/link": join(here, "shims/next-link.tsx"),
    "next/navigation": join(here, "shims/next-navigation.ts"),
    "next/dynamic": join(here, "shims/next-dynamic.tsx"),
    "server-only": join(here, "shims/empty.ts"),
    "@supabase/supabase-js": join(here, "shims/supabase.ts"),
    "@": join(root, "src"),
  },
  define: {
    "process.env.NODE_ENV": '"production"',
    "process.env.NEXT_PUBLIC_SUPABASE_URL": '""',
    "process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY": '""',
  },
});
execFileSync(join(root, "node_modules/.bin/tailwindcss"), ["-i", "src/app/globals.css", "-o", join(out, "app.css"), "--minify"], { cwd: root, stdio: "inherit" });

const css = readFileSync(join(out, "app.css"), "utf8").replaceAll("</style", "<\\/style");
const js = readFileSync(join(out, "app.js"), "utf8").replaceAll("</script", "<\\/script");
const fonts = "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Noto+Sans+Thai:wght@300;400;500&family=Noto+Serif+Thai:wght@400;600&display=swap";
const body = `<title>ASTRA Fortune Universe</title>
<meta name="theme-color" content="#06040d">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${fonts}">
<style>${css}
:root{color-scheme:dark;background:#06040d}
html{height:100%;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
body{min-height:100%;background:#06040d;color:#f4ead5}
#boot{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#06040d;color:#e6c47a;font:12px/1 Cinzel,Georgia,serif;letter-spacing:.5em}
</style>
<div id="root"><div id="boot">✦ ASTRA</div></div>
<script>document.documentElement.lang="th";</script>
<script type="module">${js}</script>
`;
// artifact.html: page body only (the Claude artifact host adds the document skeleton)
writeFileSync(join(out, "artifact.html"), body);
// ASTRA.html: complete document to open from disk
writeFileSync(join(out, "ASTRA.html"), `<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>${body}</body></html>`);
console.log("standalone build →", join(out, "ASTRA.html"));
