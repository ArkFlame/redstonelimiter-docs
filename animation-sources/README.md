# Original editable HTML animation sources

`html/` contains the five original self-contained user-provided HTML/SVG/JavaScript animated diagrams, unchanged. They are retained for future edits and for comparing the public version's drawing/model logic.

The website **executes HTML directly**, embedding the five files from `public/visuals/*.html` in sandboxed iframes. Their drawing code is identical to these originals. Public copies replace only the playback bootstrap with pause/resume support so the site can stop animations outside the viewport and respect reduced-motion preferences.

To revise a diagram, edit its original model and drawing function, propagate those changes to the matching public HTML file without removing the embedding bridge, and run `npm test`. All example values should remain explicitly illustrative and checked against the plugin source. No WebM, MP4, or poster generation is required.
