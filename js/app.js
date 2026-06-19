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

  function apply(key) {
    const t = byKey(key);
    current = t.key;
    styleEl.textContent = t.css;
    stage.innerHTML = t.render(DATA, H);
    select.value = t.key;
    descEl.textContent = t.description || "";
    if (editing) setEdit(true);
    requestAnimationFrame(checkFit);
    try { history.replaceState(null, "", "?t=" + t.key); } catch (e) {}
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

  async function downloadPDF() {
    setEdit(false);
    const page = stage.querySelector(".page");
    if (!page || !window.html2pdf) { return savePDF(); }
    if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (e) {} }
    // Capture without the on-screen margin/shadow so the element's box is exactly
    // 8.5in × 11in (the min-height floor) — html2canvas otherwise includes the
    // 14px page margin and overflows onto a near-empty 2nd page.
    const prev = { margin: page.style.margin, shadow: page.style.boxShadow };
    page.style.margin = "0";
    page.style.boxShadow = "none";
    const btn = document.getElementById("btn-download");
    const label = btn.textContent; btn.textContent = "Rendering…"; btn.disabled = true;
    try {
      await window.html2pdf().set({
        margin: 0,
        filename: "Ho-Ko-Resume-" + current + ".pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 3, useCORS: true, backgroundColor: "#ffffff", windowWidth: 816 },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
        pagebreak: { mode: ["avoid-all"] }
      }).from(page).save();
    } catch (e) {
      console.error("Download failed, falling back to print:", e);
      savePDF();
    } finally {
      page.style.margin = prev.margin;
      page.style.boxShadow = prev.shadow;
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
