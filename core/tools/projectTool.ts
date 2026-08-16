import fs from 'node:fs/promises';
import path from 'node:path';
import type { Tool } from './registry.js';

const COFFEE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Aether Roast</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Outfit:wght@300;500;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="./styles.css" />
</head>
<body>
  <header class="hero">
    <div class="hero__veil"></div>
    <div class="hero__content">
      <p class="brand">Aether Roast</p>
      <h1>Slow mornings. Honest coffee.</h1>
      <p class="lede">Single-origin pour-overs and neighborhood warmth — no rush, just ritual.</p>
      <a class="cta" href="#menu">View the menu</a>
    </div>
  </header>
  <main>
    <section id="menu" class="menu">
      <h2>On the bar</h2>
      <p>Seasonal espresso, oat latte, and a rotating filter from our roaster partners.</p>
      <ul>
        <li><span>House Espresso</span><span>$3.50</span></li>
        <li><span>Oat Latte</span><span>$5.00</span></li>
        <li><span>Pour Over</span><span>$6.00</span></li>
        <li><span>Cold Brew</span><span>$4.75</span></li>
      </ul>
    </section>
  </main>
  <footer>
    <p>Built by JARVIS for you.</p>
  </footer>
  <script src="./main.js"></script>
</body>
</html>
`;

const COFFEE_CSS = `:root {
  --bg: #1a1210;
  --ink: #f4ebe3;
  --accent: #c9834a;
  --muted: #cbb8a8;
  --font-display: "Fraunces", Georgia, serif;
  --font-body: "Outfit", system-ui, sans-serif;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: var(--font-body);
  color: var(--ink);
  background: var(--bg);
}
.hero {
  min-height: 100vh;
  display: grid;
  place-items: end start;
  padding: clamp(1.5rem, 4vw, 4rem);
  background:
    radial-gradient(ellipse at 20% 20%, rgba(201,131,74,0.35), transparent 50%),
    linear-gradient(160deg, #2a1a14 0%, #120c0a 55%, #0a0706 100%),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 40 40'%3E%3Cg fill='%23c9834a' fill-opacity='0.05'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E");
  position: relative;
  overflow: hidden;
}
.hero__content { position: relative; max-width: 36rem; animation: rise 900ms ease-out both; }
.brand {
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 8vw, 5rem);
  margin: 0 0 0.5rem;
  letter-spacing: 0.02em;
}
h1 {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: clamp(1.4rem, 3.5vw, 2.2rem);
  margin: 0 0 0.75rem;
}
.lede { color: var(--muted); margin: 0 0 1.5rem; line-height: 1.5; }
.cta {
  display: inline-block;
  color: var(--bg);
  background: var(--accent);
  text-decoration: none;
  padding: 0.85rem 1.4rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-size: 0.8rem;
  transition: transform 180ms ease, filter 180ms ease;
}
.cta:hover { transform: translateY(-2px); filter: brightness(1.08); }
.menu { padding: clamp(2rem, 6vw, 5rem); max-width: 40rem; }
.menu h2 { font-family: var(--font-display); font-size: 2rem; }
.menu ul { list-style: none; padding: 0; margin: 1.5rem 0 0; }
.menu li {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 0;
  border-bottom: 1px solid rgba(244,235,227,0.15);
}
footer { padding: 2rem; color: var(--muted); font-size: 0.9rem; }
@keyframes rise {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
}
@media (max-width: 640px) {
  .hero { place-items: center start; }
}
`;

const COFFEE_JS = `document.querySelectorAll('.cta').forEach((el) => {
  el.addEventListener('click', () => {
    document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
  });
});
`;

export function createProjectTool(): Tool {
  return {
    name: 'code_project_scaffold',
    description: 'Scaffold a simple website project in the workspace',
    permission: 'confirm',
    async execute(args, ctx) {
      const name = String(args.name ?? 'site')
        .trim()
        .replace(/[^a-zA-Z0-9_-]/g, '-')
        .toLowerCase() || 'site';
      const kind = String(args.kind ?? 'coffee').toLowerCase();
      const dir = path.join(ctx.workspaceRoot, 'projects', name);
      await fs.mkdir(dir, { recursive: true });

      if (kind === 'coffee' || /coffee|cafe|roast/.test(name)) {
        await fs.writeFile(path.join(dir, 'index.html'), COFFEE_HTML, 'utf8');
        await fs.writeFile(path.join(dir, 'styles.css'), COFFEE_CSS, 'utf8');
        await fs.writeFile(path.join(dir, 'main.js'), COFFEE_JS, 'utf8');
      } else {
        await fs.writeFile(
          path.join(dir, 'index.html'),
          `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${name}</title><link rel="stylesheet" href="./styles.css"/></head><body><h1>${name}</h1><p>Created by JARVIS.</p></body></html>`,
          'utf8',
        );
        await fs.writeFile(
          path.join(dir, 'styles.css'),
          `body{font-family:Georgia,serif;background:#0f1419;color:#e7eef7;padding:3rem}`,
          'utf8',
        );
      }

      return {
        ok: true,
        output: `Created project at projects/${name}/index.html`,
        data: { path: `projects/${name}/index.html`, dir: `projects/${name}` },
      };
    },
  };
}
