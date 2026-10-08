# RedstoneLimiter live HTML animations · v1.2

These five **self-contained HTML/SVG/JavaScript animations** are served unchanged as static HTML assets by Astro, then embedded on `/how-it-works/` through isolated, sandboxed iframes. They are not videos and require no media codecs, libraries, fonts, or external assets.

| File | Concept |
| --- | --- |
| `01-scope-cascade.html` | Check sequence: block → subchunk → chunk → region |
| `02-activity-period.html` | Sliding vs fixed counting periods |
| `03-threshold-sustain.html` | Threshold and temporary sustain blocking |
| `04-multipliers.html` | Presets and TPS-based threshold multiplier |
| `05-chunk-policy.html` | Whitelist / quarantine / normal chunk handling |

These HTML pages retain the original source's drawing functions and deterministic `window.renderAt(t)` hook. The public copies replace only the standalone animation bootstrap with a small `postMessage` playback bridge that pauses animation frames offscreen and supports the docs page's Play/Pause controls. A reduced-motion preference results in a static mid-sequence frame unless the reader explicitly requests playback. Directly opening any HTML page displays the original standalone looping experience.

The originals are preserved in `animation-sources/html/` for reference. When updating, change the source drawing/model, then regenerate the public copy with the embedding bridge. Do not restore video encodes or posters. All animation counts are illustrative; plugin behavior and defaults remain authoritative in `public/config.yml` and the original Java source.
