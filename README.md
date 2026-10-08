# RedstoneLimiter documentation · v1.2 — live HTML animated visual guide

A fast, responsive, static Astro documentation website for **RedstoneLimiter 3.0.1 / config schema v7**, based on the supplied RedstoneLimiter source (Oct 8, 2026). Main focus: teach server administrators what every configuration option actually does.

## Assumptions

- **Canonical domain:** `https://redstonelimiter.arkflame.com/`.
- **Short domain:** `https://rl.arkflame.com/` is a redirect alias, **not** a second GitHub Pages CNAME. GitHub Pages supports one custom domain per site, and unrelated subdomains require an external redirect (e.g. Cloudflare Redirect Rules).
- **Branch:** `main`.
- **Runtime:** Node 24 on GitHub Actions.
- **Deployment:** GitHub Pages via GitHub Actions; no runtime server, API, database, or framework adapter needed.
- **Source:** The plugin source is not bundled into the public documentation repository. Only its default config is copied for reference; the source itself is available in the supplied archive.

## Pages

| Route | Content |
| --- | --- |
| `/` | Landing page, circuit animation, key concepts |
| `/guide/` | Installation and first-time configuration |
| `/how-it-works/` | Scope geometry, activity windows, sustain, TPS scaling; 5 self-contained interactive HTML/SVG animated explainers |
| `/configuration/` | Every config key and the full 28-entry material catalog |
| `/examples/` | Partial YAML examples for real server administration |
| `/calculator/` | Interactive effective threshold calculation |
| `/commands/` | Commands, permissions, GUI and chunk policy |
| `/faq/` | Answers to common user questions and troubleshooting |
| `/config.yml` | Exact default plugin configuration from uploaded source |
| `/examples/*.yml` | Three complete example configuration downloads |

## Publish on GitHub Pages

1. Create a GitHub repository for the docs (for example `redstonelimiter-docs`) and extract **the archive contents at the repository root**, including `.github` and `.gitignore`. Upload files, not the `.tar.gz` itself.
2. In GitHub: **Settings → Pages → Build and deployment → Source = GitHub Actions**.
3. In the GitHub Pages settings, set **Custom domain** to `redstonelimiter.arkflame.com` and verify ownership if prompted. Enable **Enforce HTTPS** after the certificate becomes available.
4. In the DNS provider for `arkflame.com`, create `CNAME redstonelimiter` pointing to the GitHub Pages owner domain `YOUR_OWNER.github.io` (the actual repository owner, **not** the repository name; no scheme/path). Do not point at a guessed owner.
5. Push to `main`: the workflow installs Astro, runs the source-parity tests, generates `dist/` and deploys it to Pages. The workflow requires no secrets.
6. Configure **an HTTP 301/308 redirect** at your DNS/CDN/hosting provider from `rl.arkflame.com` to `redstonelimiter.arkflame.com` while preserving paths and query strings. DNS CNAME alone does **not** perform an HTTP redirect. **Do not put both names into `public/CNAME`.**

### Cloudflare alias rule (when using Cloudflare)

Create a **proxied** DNS record for `rl` (for example `A rl → 192.0.2.1`, proxied; this reserved address is used for Cloudflare's redirect-only aliases, not as a live origin). In **Rules → Redirect Rules**, add one Single Redirect:

- Expression: `(http.host eq "rl.arkflame.com")`
- Type: Dynamic
- Target expression: `concat("https://redstonelimiter.arkflame.com", http.request.uri.path)`
- Status: `301` (permanent)
- **Preserve query string:** On

Cloudflare requires incoming traffic to be proxied for this rule. Do not create conflicting records if `rl` currently serves another service. Reference: https://developers.cloudflare.com/fundamentals/manage-domains/redirect-domain/

The supplied Astro config and `public/CNAME` match the canonical domain. For a GitHub Pages project URL without a custom domain, adjust `astro.config.mjs` `site` and `base` and internal links before publishing; this build targets the custom domain root only.

### Why one domain?

GitHub Pages accepts one custom-domain value for a Pages site. Two unrelated subdomains (`redstonelimiter` and `rl`) cannot both be declared as direct custom domains on one site. A redirect from the short name is the simplest reliable configuration. See https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/troubleshooting-custom-domains-and-github-pages.

## Develop locally

```bash
# Node 24 required by this project configuration
npm install
npm run dev
```

Open the local URL printed by Astro. Build and run checks:

```bash
npm test
npm run check:source
npm run build
npm run preview
```

`astro` is pinned to `7.3.4`. Since the creation environment did not have registry access, it could not generate a reliable npm lockfile. The first CI run uses `npm install`, not `npm ci`. **After the first successful local `npm install`, commit the generated `package-lock.json` and change the workflow's install step to `npm ci` for reproducible dependency resolution.** No unverified lockfile is shipped.

## Content maintenance

The source version and schema are shown in `src/data/site.ts`; the complete default config is served from `public/config.yml`. When the RedstoneLimiter plugin changes, rerun a source audit and update the reference tables, examples and FAQ. The `tests/source-parity.mjs` checks important invariants, but do **not** prove parity with a future source version or execute the Bukkit plugin.

### Integrated animations (October 8, 2026)

All five supplied diagrams are integrated directly into `/how-it-works/` beside their related topics:

1. Scope cascade — Block → Subchunk → Chunk → Region.
2. Activity periods — sliding bucket counts versus fixed periods.
3. Threshold and sustain — temporary blocking/extension.
4. Effective limits — preset and TPS multipliers.
5. Chunk policy — whitelist, quarantine, normal checks.

Each explainer is now a directly executed HTML/SVG/JavaScript file under `public/visuals/*.html`, loaded into a sandboxed responsive iframe (`sandbox="allow-scripts"`) without WebM, MP4 or poster assets. The site includes accessible explanatory captions, a Play/Pause button, a full-size HTML link, lazy loading, IntersectionObserver-powered offscreen pausing and reduced-motion support. The original five generators remain unchanged in `animation-sources/html/` so they are editable; the published copies contain only a small additional playback bridge. All data points are illustrative. See `public/visuals/README.md` and `tests/animations.test.mjs`.

**Runtime note:** Astro copies files from `public/` directly into `dist/`. Each HTML iframe initializes on demand (`loading="lazy"`); the parent pauses its requestAnimationFrame loop when offscreen. On reduced-motion devices, a static explanation frame is rendered unless the user chooses Play. Static GitHub Pages hosting is sufficient. A full Astro build/browser validation should be completed on CI after dependency installation.

## Scope and testing honesty

Source facts were cross-checked against `config.yml`, `plugin.yml`, `CircuitActivityEngine`, `ActivityPolicy`, `RuntimeSettings`, `TpsScalingPolicy`, `TuningPreset`, `PistonListener` and the supplied `docs/tutorial.md`. Examples that differ from defaults are explicitly labeled as suggested examples. Browser and Astro build validation require downloading the dependency from npm. The included Node unit, live-HTML integration, and source-parity checks run without downloading any packages.
