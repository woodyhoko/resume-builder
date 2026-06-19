# Resume Builder

A single-page web app that renders my résumé in **nine** professionally-designed,
print-ready layouts and exports a pixel-perfect **US Letter** PDF — entirely in the
browser, no backend.

**Live:** https://space.hoko.xyz/resume-builder/

## Designs

| # | Design | Style |
|---|--------|-------|
| 1 | **Modern Sidebar** | Two-column, dark navy sidebar, blue accent |
| 2 | **Classic Professional** | Single-column serif, centered header — ATS-friendly |
| 3 | **Tech Minimal** | Monospace accents, terminal-green, developer look |
| 4 | **Executive Serif** | Double-rule header, bronze accent — senior and authoritative |
| 5 | **Swiss Typographic** | Editorial grid, numbered sections, single red accent |
| 6 | **Timeline** | Vertical timeline rail for experience, indigo accents |
| 7 | **Compact Two-Column** | Light grey sidebar, teal accent — airy and skimmable |
| 8 | **Header Banner** | Bold full-width header band with highlight chips |
| 9 | **Elegant Centered** | Centered serif display, flanked headers, petrol accent |

Every design fits a single **US Letter** (8.5 × 11 in) page. Switch from the toolbar,
or deep-link one with `?t=swiss`, `?t=timeline`, etc. Ready-made PDFs of all nine live
in [`pdf/`](pdf/).

## Features

- **Nine switchable designs** rendered from one shared data model.
- **Edit text** — toggle in-place editing to tweak wording before exporting.
- **Save as PDF** — native print pipeline; crisp, vector, selectable text at exact Letter size.
- **Download PDF** — one-click rasterized export via `html2pdf.js`.
- **Fit guard** — warns in the UI if edits push a design past one page.

## Architecture (modular)

```
resume-builder/
├── index.html              # shell: toolbar + <script> includes
├── css/
│   └── app.css             # toolbar / preview chrome + print rules
├── js/
│   ├── data.js             # RESUME — single source of truth for all content
│   ├── registry.js         # registerTemplate() + shared render helpers (H)
│   ├── app.js              # switching, editing, PDF export, fit-check
│   └── templates/          # ONE self-contained module per design
│       ├── 01-modern-sidebar.js
│       ├── 02-classic.js
│       ├── 03-tech-minimal.js
│       ├── 04-executive.js
│       ├── 05-swiss.js
│       ├── 06-timeline.js
│       ├── 07-compact.js
│       ├── 08-banner.js
│       └── 09-elegant.js
├── pdf/                    # pre-rendered PDFs of every design
└── README.md
```

### Adding a new design

Drop a new file in `js/templates/` that calls `registerTemplate({...})` and add one
`<script>` line for it in `index.html`. Nothing else changes — it appears in the picker
automatically.

```js
registerTemplate({
  key: "my-design",
  label: "My Design",
  description: "One-line summary shown in the toolbar.",
  css: ` /* a complete stylesheet, incl. its own @media print / @page */ `,
  render(data, H) { return `<div class="page"> ... </div>`; }
});
```

Each template is fully isolated: only the **active** template's CSS is injected into a
single `<style>` tag at a time, so all designs can reuse the same class names
(`.page`, `.name`, `.bullets`, …) without colliding.

## How the PDF stays perfect

1. **Letter geometry** — every template declares `@page { size: 8.5in 11in }`.
2. **True colors** — `print-color-adjust: exact` keeps backgrounds (sidebars, bands).
3. **Fonts before paint** — the app awaits `document.fonts.ready` before the first
   render and before any export, so layout is measured with the real web fonts
   (Inter / Source Serif 4 / JetBrains Mono), never compact fallbacks.
4. **One page, verified** — each design is tuned so its content fits within 11 in with
   the real fonts loaded; the toolbar shows a warning if manual edits overflow.

## Editing the content

All résumé content is the `RESUME` object in [`js/data.js`](js/data.js). Update it once
and every design reflects the change. Each experience entry is:

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

For the sharpest output: **Save as PDF** → paper size **Letter**, margins **None**,
**Background graphics** on.
