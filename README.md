# Resume Builder

A single-page web app that renders my résumé in three professionally-designed,
print-ready layouts and exports a pixel-perfect **US Letter** PDF — entirely in the
browser, no backend.

**Live:** https://woodyhoko.github.io/resume-builder/

## Designs

| Design | Style |
|--------|-------|
| **Modern Sidebar** | Two-column, dark navy sidebar, blue accent |
| **Classic Professional** | Single-column serif, centered header, ATS-friendly |
| **Tech Minimal** | Monospace accents, terminal-green, developer aesthetic |

Switch designs from the toolbar; deep-link a specific one with `?d=sidebar`,
`?d=classic`, or `?d=tech`.

## Features

- **Three switchable designs** rendered from one shared data model.
- **Edit text** — toggle in-place editing to tweak wording before exporting.
- **Save as PDF** — uses the browser's native print pipeline for crisp, vector,
  selectable-text output at exact US Letter size.
- **Download PDF** — one-click rasterized export via `html2pdf.js`.
- Ready-made PDFs of all three designs live in [`pdf/`](pdf/).

## How it works

Everything is one static `index.html`:

1. **Data model.** A single `RESUME` object holds the name, contact, summary,
   experience (bulleted, metric-first), education, skills, publications, and projects.
2. **Renderers.** Three pure functions (`render_sidebar`, `render_classic`,
   `render_tech`) turn that object into the markup for each design.
3. **Scoped styles.** Each design's CSS lives in its own `<style>` block that is
   disabled by default (`media="not all"`). Switching a design flips the active block
   to `media="all"` and re-renders the preview, so the three stylesheets never collide
   even though they reuse class names.
4. **Letter-accurate PDF.** Each design declares `@page { size: 8.5in 11in }` and uses
   `print-color-adjust: exact`, so printing to PDF reproduces the on-screen layout at
   true US Letter with full background colors.

No build step and no dependencies to install — open `index.html` or serve it from any
static host. The only runtime CDN dependencies are Google Fonts and `html2pdf.js`.

## Editing the content

All résumé content is the `RESUME` object near the bottom of `index.html`. Update it
once and every design reflects the change. Each experience entry is:

```js
{ title:"Role", company:"Company", date:"2024–2025", bullets:[
  "Lead with the <b>quantified result</b>, then the context."
]}
```

## Local preview

```bash
# any static server works, e.g.
python -m http.server 8000
# then open http://localhost:8000
```

For the sharpest PDF: **Save as PDF** → paper size **Letter**, margins **None**,
**Background graphics** on.
