# Documentation source map

Based on **the RedstoneLimiter source archive supplied Oct 8, 2026**, Maven plugin version **3.0.1**, config-version **7**.

This repository includes the exact original `src/main/resources/config.yml` as `public/config.yml`. It does not bundle or redistribute the plugin's Java source.

| Documentation topic | Original source authority |
| --- | --- |
| Config names and default values | `src/main/resources/config.yml`; `settings/RuntimeSettings.java`; `settings/ConfigMigrator.java` |
| Config schema version | `src/main/resources/config.yml`; `ConfigDefaultsTest.java` |
| Scope size and region origin | `model/BlockKey.java`; `model/SubchunkKey.java`; `model/ChunkKey.java`; `model/RegionKey.java` |
| Evaluation order and threshold application | `engine/CircuitActivityEngine.java`; `engine/ActivityState.java`; `engine/ActivityPolicy.java` |
| Rolling/fixed windows and sustain | `engine/ActivityState.java`; `engine/SlidingWindowCounter.java`; `settings/ActivityPeriodSettings.java` |
| Preset multipliers | `settings/TuningPreset.java` |
| TPS multipliers | `performance/TpsScalingPolicy.java` |
| Default material catalog and alias mapping | `utils/MaterialResolver.java`; `src/main/resources/config.yml` |
| Notification and cross-server fields | `src/main/resources/config.yml`; `notifications/NotificationService.java`; `crossserver/RedisCrossServerService.java` |
| Commands and permissions | `src/main/resources/plugin.yml`; `commands/RedstoneLimiterCommand.java` |
| GUI actions | `gui/ControlPanelListener.java`; `gui/ControlPanelService.java` |
| Piston extension hard limit | `listeners/PistonListener.java` |
| Exception policy | `managers/RedstoneLimiterManager.java`; `settings/RuntimeSettings.java` |
| Comparator/trapdoor protection | `listeners/modules/ComparatorTrapdoorProtectionListener.java` |
| Source explanatory overview | `docs/tutorial.md` |

## Important caveats, proven in code

1. On each recorded activity event, the engine tries Block, Subchunk, Chunk, then Region. It returns at the first block; a blocked lower-scope attempt does not advance broader scopes.
2. A zero **max-activations** is unlimited *for that specific threshold*, not a universal bypass.
3. `enabled: false` on one scope stops that scope threshold-blocking but does not stop its telemetry.
4. A whitelisted chunk bypasses the automatic activity threshold path, but the separate piston **extension push-size check** cancels oversized events before calling `immediateBlock`.
5. Observer `BlockPhysicsEvent` is an uncancellable observation signal, including in manually quarantined chunks. Do not describe this as cancellation of all Minecraft physics.
6. Manual quarantine never originates from an automatic threshold violation.
7. The current region max of **96** applies to a **32x32 chunk** geometric area, not to each chunk individually. The first examples therefore avoid making region limiting the default remedy for single-machine issues.
8. TPS policy maps 16.0 and below to **1.0x**, 19.5 and above to **2.0x**, with interpolation between, when enabled and measurable. If no TPS reading exists, multiplier is 1.0.
9. `max_piston_push=12` is a distinct check and affects piston extension even when a per-block threshold is configured as unlimited.

## Unsupported claims intentionally avoided

- No claimed universal version range beyond what the inspected plugin files prove.
- No claimed guarantee of a percentage FPS/TPS gain.
- No claim that region means a Folia scheduling region.
- No claim that every hopper inventory operation is observed.
- No claim of automatic permanent quarantine.
- No claim that the browser calculator fully simulates the plugin's rolling counters, sustain history, or concurrency.


## Animation integration — October 8, 2026

The user supplied `redstonelimiter-animations.zip` with five matching HTML/SVG animation sources and WebM renderings. Source inspected against the same uploaded plugin archive:

- `01-scope-cascade` → `CircuitActivityEngine.tryActivateWithLocation` and scope ordering. Demo counts intentionally illustrative.
- `02-activity-period` → `SlidingWindowCounter` and `ActivityState` for sliding/fixed periods.
- `03-threshold-sustain` → `ActivityState.isSustainBlocked/extendSustain` and the over-limit checks.
- `04-multipliers` → `ActivityPolicy.effectiveMaxActivations` and `TpsScalingPolicy.multiplier`.
- `05-chunk-policy` → `RedstoneLimiterManager.tryActivate`, chunk policy setters and telemetry handling.

The user-provided HTML/SVG/JS pages are executed directly at `public/visuals/*.html` inside sandboxed iframes. Their original drawing/model logic is preserved; the public copies replace only the self-playback bootstrap to support parent-controlled pause/resume. The unchanged HTML originals remain under `animation-sources/html/`. WebM/MP4 video and WebP poster assets were removed in v1.2. Their contextual placement is `src/pages/how-it-works.astro` via `src/components/AnimatedDiagram.astro`; related pages retain deep links.
