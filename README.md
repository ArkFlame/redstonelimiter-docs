# RedstoneLimiter Docs v1.3 — GitHub Pages direct static deployment

**This archive fixes `actions/jekyll-build-pages@v1` / `Invalid YAML front matter in src/components/Code.astro` without requiring GitHub Actions publishing mode.**

The repository now contains *compiled HTML in its root*, together with a root `.nojekyll` file. GitHub Pages can publish it directly from `main/(root)`. The original Astro source is retained in `_astro-source/` for future editing, but it is **not** involved in deployment. There is no npm install, build action, Jekyll compilation, or Pages artifact upload.

## Publish — use these exact steps

1. **Replace the old repository contents** with all files from this archive, including hidden `.nojekyll`, `.gitignore` and `.github/workflows/deploy.yml`. Extract the archive before committing, not the `.tar.gz` itself.
2. Keep the repository's Pages setting **Settings → Pages → Build and deployment → Source: Deploy from a branch; Branch: main; Folder: /(root)**. That is the mode indicated by your failing Jekyll log. You do **not** need to select GitHub Actions with this release.
3. Push the files to `main`. `index.html` and `.nojekyll` **must appear together directly in the repository root**. The automatic Pages publishing job will deploy static files directly, bypassing Jekyll's `.astro` YAML parsing.
4. Keep the Pages custom domain `redstonelimiter.arkflame.com` (the root `CNAME` contains it). DNS must have a `CNAME` named `redstonelimiter` targeting `YOUR_GITHUB_OWNER.github.io` (replace with the actual owner). If you want `rl.arkflame.com` as a second domain, configure it as an HTTP redirect to the canonical domain at your DNS/CDN provider. One GitHub Pages site supports only one custom domain.

> **Important:** Merely uploading a new `deploy.yml` will not change Pages settings. This release avoids that requirement entirely, by shipping prebuilt HTML and `.nojekyll` for the already selected branch publishing mode. Do not set Source to GitHub Actions for this release.

## Confirm after upload

- GitHub repository root: `.nojekyll` (empty file) and `index.html` exist.
- Root website: `/` loads the documentation homepage; `/configuration/` loads the full config reference; `/how-it-works/` loads the five HTML animations; `/calculator/` loads the interactive calculator.
- GitHub's automatic Pages job should not call `actions/jekyll-build-pages@v1` after it detects `.nojekyll`. The separate **Verify static GitHub Pages site** workflow is a nondeploying integrity check.

If the same YAML error returns, inspect the **actual branch/folder being published**: `.nojekyll` must exist in the root of that selected publishing folder. This package targets `main/(root)`, as identified in the supplied log. If you uploaded with GitHub's file upload UI, inspect `.nojekyll` in the web listing because hidden files can be missed during selection.

## Editing and rebuilding later

The 8 published pages are static files: `index.html`, `guide/index.html`, `how-it-works/index.html`, `configuration/index.html`, `examples/index.html`, `calculator/index.html`, `commands/index.html`, and `faq/index.html`, plus `404.html`.

The original Astro sources are under `_astro-source/src` and the original public assets under `_astro-source/public`. To update content, edit those sources and regenerate **without Astro or npm**:

```bash
python3 scripts/build-static-from-astro.py --source _astro-source --output .
python3 scripts/verify-site.py
```

Only Python 3 and Node.js (used to evaluate the existing static source-data arrays; no packages required) are needed. Commit regenerated static files along with edited sources. The included nondeploying GitHub Actions workflow ensures the checked-in pages match the source.

## Features retained

- User-friendly docs based on RedstoneLimiter **3.0.1** source and configuration schema **v7**.
- All config paths, defaults, material limits, YAML recipes, commands and explanations.
- Interactive threshold calculator, searchable configuration tables, site search, mobile navigation and code copy buttons.
- All five original self-contained HTML/SVG animated explainers with play/pause, full-size viewing, responsive frames and reduced-motion behavior. No video files.
- Canonical link metadata, sitemap, robots.txt and canonical `CNAME` file.

## Technical proof boundary

This revision statically exports the previously authored Astro content into real HTML; it does **not** modify the plugin, its default configuration, or animation modeling. Static output, HTML assets, browser-executable script syntax and animation source parity are verified locally. Live GitHub deployment still depends on the Pages branch/folder and custom-domain DNS settings, which repository files cannot silently override.

References:
- GitHub: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
- GitHub: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
