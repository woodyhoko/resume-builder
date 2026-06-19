/* ============================================================
   App logic: template switching, editing, and PDF export.
   ============================================================ */
(function () {
  const TPLS = window.ResumeTemplates || [];
  const DATA = window.RESUME;
  const H = window.RBHelpers;

  const styleEl = document.getElementById("tpl-style");
  const stage   = document.getElementById("stage");
  const select  = document.getElementById("tpl-select");
  const descEl  = document.getElementById("tpl-desc");
  const fitBadge= document.getElementById("fit-badge");

  let current = null;
  let editing = false;

  // Populate the template picker
  TPLS.forEach((t, i) => {
    const o = document.createElement("option");
    o.value = t.key;
    o.textContent = (i + 1) + ". " + t.label;
    select.appendChild(o);
  });

  const indexOf = (key) => Math.max(0, TPLS.findIndex(t => t.key === key));
  const byKey   = (key) => TPLS.find(t => t.key === key) || TPLS[0];

  const DATAVIEW = () => (window.ResumeStore ? window.ResumeStore.view() : DATA);
  let baseCSS = "";
  const PAGE_PX = 1056;        // 11in @ 96dpi
  const FIT_TARGET = 1038;     // aim just under a full page for safety

  function apply(key) {
    const t = byKey(key || current);
    current = t.key;
    baseCSS = t.css;
    styleEl.textContent = baseCSS;
    stage.innerHTML = t.render(DATAVIEW(), H);
    select.value = t.key;
    descEl.textContent = t.description || "";
    if (editing) setEdit(true);
    requestAnimationFrame(() => { fitToPage(); enableArrange(); checkFit(); });
    try { history.replaceState(null, "", "?t=" + t.key); } catch (e) {}
  }

  // ---- On-résumé drag-to-reorder (Arrange mode) ----
  let dragKey = null;

  function enableArrange() {
    const page = stage.querySelector(".page");
    if (!page) return;
    stage.classList.toggle("rb-arrange", !!(window.RBApp && window.RBApp.arrange));
    if (!(window.RBApp && window.RBApp.arrange)) return;
    page.querySelectorAll("[data-rb-drag]").forEach((elm) => {
      const key = elm.getAttribute("data-rb-drag");
      if (!key.startsWith("exp:")) return;          // only experience is reorderable on-page
      elm.setAttribute("draggable", "true");
      const ctl = document.createElement("div");
      ctl.className = "rb-ctl"; ctl.setAttribute("data-html2canvas-ignore", "true");
      ctl.innerHTML = '<span class="mv">⠿ drag</span><button class="rm" title="Move to collection">✕</button>';
      elm.appendChild(ctl);
      ctl.querySelector(".rm").addEventListener("click", (e) => {
        e.stopPropagation();
        const id = key.slice(4);
        window.ResumeStore.update((s) => { const t = s.experience.find((x) => x.id === id); if (t) t.include = false; });
      });
      elm.addEventListener("dragstart", (ev) => { dragKey = key; elm.classList.add("rb-drag"); ev.dataTransfer.effectAllowed = "move"; try { ev.dataTransfer.setData("text/plain", key); } catch (e) {} });
      elm.addEventListener("dragend", () => { elm.classList.remove("rb-drag"); page.querySelectorAll(".rb-over").forEach((x) => x.classList.remove("rb-over")); });
      elm.addEventListener("dragover", (ev) => { ev.preventDefault(); elm.classList.add("rb-over"); });
      elm.addEventListener("dragleave", () => elm.classList.remove("rb-over"));
      elm.addEventListener("drop", (ev) => {
        ev.preventDefault(); elm.classList.remove("rb-over");
        const below = ev.offsetY > elm.offsetHeight / 2;
        dropExp(dragKey || (ev.dataTransfer && ev.dataTransfer.getData("text/plain")), key.slice(4), below);
        dragKey = null;
      });
    });
  }

  // Reorder / insert an experience block. fromKey: "exp:ID" or "collection:ID".
  function dropExp(fromKey, toId, below) {
    if (!fromKey) return;
    const fromId = fromKey.split(":")[1];
    if (fromId === toId) return;
    window.ResumeStore.update((s) => {
      const arr = s.experience;
      const item = arr.find((x) => x.id === fromId);
      if (!item) return;
      item.include = true;
      arr.splice(arr.indexOf(item), 1);
      let ti = arr.findIndex((x) => x.id === toId);
      if (ti < 0) ti = arr.length - 1;
      arr.splice(below ? ti + 1 : ti, 0, item);
    });
  }
  window.RBApp_dropExp = dropExp;   // used by the collection tray in editor.js

  // Scale every px length in a stylesheet (fonts, margins, gaps, borders…) by f.
  // Leaves in/mm units (page box, column widths) untouched so the sheet only
  // grows/shrinks the *type and rhythm*, keeping the page exactly US Letter.
  function scalePx(css, f) {
    if (Math.abs(f - 1) < 0.004) return css;
    return css.replace(/(-?\d*\.?\d+)px/g, (m, n) => (parseFloat(n) * f).toFixed(2) + "px");
  }

  function trueContentHeight(page) {
    const prev = page.style.minHeight;
    page.style.minHeight = "0";
    const h = page.scrollHeight;
    page.style.minHeight = prev;
    return h;
  }

  // Dynamic auto-fit: scale the template's type/rhythm UP to fill a sparse page,
  // or DOWN to rescue an overflowing one — so every résumé fills exactly one page.
  function fitToPage() {
    const page = stage.querySelector(".page");
    if (!page) return;
    styleEl.textContent = baseCSS;
    window.RBApp.fitScale = 1;
    if (!window.RBApp.autoFit) return;
    let f = 1;
    for (let i = 0; i < 4; i++) {
      const contentH = trueContentHeight(page);
      if (!contentH) break;
      const next = Math.max(0.78, Math.min(1.22, f * (FIT_TARGET / contentH)));
      if (Math.abs(next - f) < 0.008) { f = next; break; }
      f = next;
      styleEl.textContent = scalePx(baseCSS, f);
    }
    window.RBApp.fitScale = f;
  }

  function setEdit(on) {
    editing = on;
    const page = stage.querySelector(".page");
    if (page) {
      page.contentEditable = on ? "true" : "false";
      page.style.outline = on ? "2px dashed #2563eb" : "";
      page.style.outlineOffset = on ? "3px" : "";
    }
    const b = document.getElementById("btn-edit");
    b.classList.toggle("on", on);
    b.textContent = on ? "Editing ✓" : "Edit text";
  }

  // Warn (in the UI only) if a template's content exceeds one Letter page.
  function checkFit() {
    const page = stage.querySelector(".page");
    if (!page) return;
    const onePage = 11 * 96;            // 11in at 96dpi
    const over = page.scrollHeight > onePage + 4;
    fitBadge.style.display = over ? "block" : "none";
    if (over) fitBadge.textContent = "⚠ Over one page (" + (page.scrollHeight / 96).toFixed(2) + "in) — trim before export";
  }

  function cycle(delta) {
    const i = (indexOf(current) + delta + TPLS.length) % TPLS.length;
    apply(TPLS[i].key);
  }

  // ---- Export ----
  async function savePDF() {
    setEdit(false);
    if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (e) {} }
    window.print();
  }

  // Render the current page to a single canvas (auto-fit already applied to the
  // live DOM), returning { canvas }. Captures the on-screen element directly —
  // off-screen clones render blank in html2canvas.
  async function renderCanvas() {
    const page = stage.querySelector(".page");
    if (!page || !window.html2canvas) return null;
    if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (e) {} }
    const saved = { margin: page.style.margin, shadow: page.style.boxShadow, minH: page.style.minHeight };
    page.style.margin = "0"; page.style.boxShadow = "none"; page.style.minHeight = "11in";
    try {
      return await window.html2canvas(page, {
        scale: 3, useCORS: true, backgroundColor: "#ffffff",
        windowWidth: 816, width: 816, scrollX: 0, scrollY: -window.scrollY
      });
    } finally {
      page.style.margin = saved.margin; page.style.boxShadow = saved.shadow; page.style.minHeight = saved.minH;
    }
  }

  // Build a single-page US Letter jsPDF from the canvas (fit to width; if the
  // capture is taller than the page, fit to height instead — always ONE page).
  function canvasToLetterPdf(canvas) {
    const JsPDF = window.jspdf && window.jspdf.jsPDF;
    if (!JsPDF) return null;
    const pdf = new JsPDF({ unit: "in", format: "letter", orientation: "portrait", compress: true });
    const PW = 8.5, PH = 11, cw = canvas.width, ch = canvas.height;
    let w = PW, h = ch / cw * PW;
    if (h > PH + 0.01) { h = PH; w = cw / ch * PH; }
    const x = (PW - w) / 2, y = 0;
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", x, y, w, h, undefined, "FAST");
    return pdf;
  }

  async function downloadPDF() {
    setEdit(false);
    const btn = document.getElementById("btn-download");
    const label = btn.textContent; btn.textContent = "Rendering…"; btn.disabled = true;
    try {
      const canvas = await renderCanvas();
      const pdf = canvas && canvasToLetterPdf(canvas);
      if (!pdf) { return savePDF(); }
      pdf.save("Ho-Ko-Resume-" + current + ".pdf");
    } catch (e) {
      console.error("Download failed, falling back to print:", e);
      savePDF();
    } finally {
      btn.textContent = label; btn.disabled = false;
    }
  }

  // ---- Wire up ----
  select.addEventListener("change", () => apply(select.value));
  document.getElementById("nav-prev").addEventListener("click", () => cycle(-1));
  document.getElementById("nav-next").addEventListener("click", () => cycle(1));
  document.getElementById("btn-edit").addEventListener("click", () => setEdit(!editing));
  document.getElementById("btn-print").addEventListener("click", savePDF);
  document.getElementById("btn-download").addEventListener("click", downloadPDF);
  window.addEventListener("resize", checkFit);

  // Expose a small API for the editor module; re-render the preview from the
  // store whenever the user edits blocks, reorders, rephrases, or imports.
  window.RBApp = { autoFit: true, fitScale: 1, arrange: false, rerender: () => apply(current) };
  if (window.ResumeStore) window.ResumeStore.subscribe(() => apply(current));

  const arrBtn = document.getElementById("btn-arrange");
  if (arrBtn) {
    arrBtn.addEventListener("click", () => {
      window.RBApp.arrange = !window.RBApp.arrange;
      arrBtn.classList.toggle("on", window.RBApp.arrange);
      apply(current);
    });
    if (new URLSearchParams(location.search).get("arrange") === "1") {
      window.RBApp.arrange = true; arrBtn.classList.add("on");
    }
  }

  // Editor drawer
  if (window.ResumeEditor) {
    window.ResumeEditor.init();
    const edBtn = document.getElementById("btn-editor");
    if (edBtn) edBtn.addEventListener("click", () => { window.ResumeEditor.toggle(); edBtn.classList.toggle("on"); });
    if (new URLSearchParams(location.search).get("editor") === "1") {
      window.ResumeEditor.toggle(); edBtn && edBtn.classList.add("on");
    }
  }

  // Initial template from ?t= param, else first.
  const params = new URLSearchParams(location.search);
  const wanted = params.get("t");
  const startKey = (wanted && byKey(wanted).key === wanted) ? wanted : (TPLS[0] && TPLS[0].key);

  // Wait for fonts so the first paint and the fit-check are accurate,
  // with a timeout fallback if the font API never settles.
  let booted = false;
  function boot() {
    if (booted || !startKey) return;
    booted = true;
    apply(startKey);
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(boot);
    setTimeout(boot, 1500);
  } else {
    boot();
  }
})();
