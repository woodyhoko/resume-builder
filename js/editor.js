/* ============================================================
   Editor drawer: AI model loading, résumé upload + parsing,
   drag-and-drop experience blocks, add/edit blocks, and
   LLM-powered rephrasing. Operates on ResumeStore; the preview
   re-renders automatically via the store subscription in app.js.
   ============================================================ */
window.ResumeEditor = (function () {
  const store = window.ResumeStore;
  const llm = window.ResumeLLM;
  let root, blocksEl, collEl, eduEl, skillsEl, modelStatus, modelBar, toneSel, reqInput, busyEl;
  let dragId = null;
  let eduDrag = null, skillDrag = null;

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const decode = (s) => String(s == null ? "" : s).replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
  const disp = (s) => esc(decode(s));   // for safe plain-text display of entity-bearing data
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

  // Imported documents are untrusted: escape all markup, then re-allow the
  // simple emphasis tags our own JSON exports (and hand-written bullets) use.
  const sanitizeText = (s) => esc(String(s == null ? "" : s))
    .replace(/&lt;(\/?)(b|strong|em|i)&gt;/gi, "<$1$2>");
  function sanitizeParsed(v) {
    if (typeof v === "string") return sanitizeText(v);
    if (Array.isArray(v)) return v.map(sanitizeParsed);
    if (v && typeof v === "object") {
      const o = {};
      Object.keys(v).forEach((k) => { o[sanitizeText(k)] = k === "include" || k === "core" ? v[k] : sanitizeParsed(v[k]); });
      return o;
    }
    return v;
  }
  // "Is the pointer in the lower half of this element?" — for drop targets.
  // (ev.offsetY is relative to whichever CHILD the cursor is over, so it
  // cannot be compared against the container's height.)
  const inLowerHalf = (ev, elm) => { const r = elm.getBoundingClientRect(); return ev.clientY > r.top + r.height / 2; };

  function init() {
    build();
    store.subscribe(renderBlocks);
    renderBlocks();
  }

  function build() {
    root = el("div"); root.id = "editor";
    root.innerHTML = `
      <button id="ed-close" title="Close editor (Esc)" aria-label="Close editor">✕</button>
      <div class="ed-scroll">
        <h3>On-device AI (optional)</h3>
        <button class="ed-btn accent full" id="ed-load-ai">Load AI model (Gemma 4, ~3 GB)</button>
        <div class="bar"><i id="ed-bar"></i></div>
        <div class="status" id="ed-status">Runs locally on your GPU (WebGPU). Cached after first load. Powers parsing &amp; rephrasing.</div>

        <h3>Import your résumé</h3>
        <div class="row">
          <input type="file" id="ed-file" accept=".pdf,.txt,.md,.json" style="font-size:11.5px;">
        </div>
        <textarea id="ed-paste" placeholder="…or paste your résumé text here."></textarea>
        <div class="hintline" style="margin-top:8px;">How should this document be used?</div>
        <div class="row" style="margin-top:6px;">
          <button class="ed-btn accent" id="ed-build" title="Replace everything with what's parsed from this document">Build résumé from this</button>
          <button class="ed-btn" id="ed-collect" title="Keep your résumé; add every block found to the Collection to drag in">Add as block library</button>
        </div>
        <div class="row" style="margin-top:6px;">
          <button class="ed-btn" id="ed-reset">Reset to sample</button>
          <button class="ed-btn" id="ed-export" title="Download your current résumé as JSON — re-import it later to continue where you left off">Export JSON backup</button>
        </div>
        <div class="hintline">
          <b>Build</b> = treat the file as the whole résumé and recreate it.<br>
          <b>Library</b> = treat it as an extended/master CV — all entries go to the Collection so you pick what to show.<br>
          Uses the local AI if loaded (more accurate); otherwise a section-aware parser. Stored only in your browser.
        </div>

        <h3>Rephrase</h3>
        <div class="row">
          <select id="ed-tone">
            <option value="professional">Professional tone</option>
            <option value="concise">Concise &amp; punchy</option>
            <option value="impact">Impact / results-first</option>
            <option value="leadership">Leadership / senior</option>
            <option value="plain">Plain &amp; clear</option>
          </select>
        </div>
        <input type="text" id="ed-req" placeholder="Extra instruction (e.g. emphasize on-device ML)" style="margin-top:8px;">

        <h3>Experience <span class="ed-sub">drag on the résumé to reorder · ✕ to hide</span></h3>
        <div id="ed-blocks"></div>
        <button class="ed-btn full" id="ed-add">+ Add experience block</button>

        <h3>Collection <span class="ed-sub">hidden blocks — drag onto the résumé or click +</span></h3>
        <div id="ed-collection"></div>

        <h3>Education <span class="ed-sub">drag to reorder · toggle</span></h3>
        <div id="ed-edu"></div>

        <h3>Skills <span class="ed-sub">drag to reorder · toggle</span></h3>
        <div id="ed-skills"></div>

        <h3>Layout</h3>
        <label class="row" style="cursor:pointer;"><input type="checkbox" id="ed-autofit" checked style="width:15px;height:15px;accent-color:#2563eb;"> &nbsp;Auto-fit content to one page</label>
        <div class="hintline">Scales the type up to fill a sparse page, or down to rescue an overflowing one — always one perfect page.</div>
        <div style="height:24px;"></div>
      </div>`;
    document.body.appendChild(root);

    blocksEl = root.querySelector("#ed-blocks");
    collEl = root.querySelector("#ed-collection");
    eduEl = root.querySelector("#ed-edu");
    skillsEl = root.querySelector("#ed-skills");
    modelStatus = root.querySelector("#ed-status");
    modelBar = root.querySelector("#ed-bar");
    toneSel = root.querySelector("#ed-tone");
    reqInput = root.querySelector("#ed-req");

    root.querySelector("#ed-close").addEventListener("click", () => {
      const b = document.getElementById("btn-editor");
      if (b) b.click(); else toggle();     // the toolbar button owns the "on" state
    });
    root.querySelector("#ed-load-ai").addEventListener("click", loadAI);
    root.querySelector("#ed-build").addEventListener("click", () => doParse("build"));
    root.querySelector("#ed-collect").addEventListener("click", () => doParse("collect"));
    root.querySelector("#ed-reset").addEventListener("click", () => { if (confirm("Reset to the sample résumé? Your edits will be cleared.")) store.reset(); });
    root.querySelector("#ed-export").addEventListener("click", exportJSON);
    root.querySelector("#ed-add").addEventListener("click", addBlock);
    root.querySelector("#ed-autofit").addEventListener("change", (e) => {
      window.RBApp && (window.RBApp.autoFit = e.target.checked);
      window.RBApp && window.RBApp.rerender();
    });
  }

  function toggle() { root.classList.toggle("open"); document.body.classList.toggle("editor-open", root.classList.contains("open")); }

  // ---------------- AI model ----------------
  async function loadAI() {
    const btn = root.querySelector("#ed-load-ai");
    if (!llm.hasWebGPU()) { modelStatus.textContent = "WebGPU not available — use Chrome/Edge 113+ on desktop."; return; }
    btn.disabled = true; btn.textContent = "Loading…";
    try {
      await llm.load((p) => {
        if (p.msg) modelStatus.textContent = p.msg;
        if (typeof p.pct === "number") modelBar.style.width = p.pct + "%";
      });
      btn.textContent = "AI ready ✓"; modelBar.style.width = "100%";
    } catch (e) {
      console.error(e); btn.disabled = false; btn.textContent = "Retry load AI model";
      modelStatus.textContent = "Load failed: " + (e && e.message || e);
    }
  }

  // ---------------- Upload + parse ----------------
  // mode: "build" = recreate the whole résumé from the document;
  //       "collect" = treat it as an extended/master CV and add every block to
  //       the Collection (hidden) so the user drags in what they want.
  async function doParse(mode) {
    const fileInput = root.querySelector("#ed-file");
    let text = root.querySelector("#ed-paste").value.trim();
    try {
      if (!text && fileInput.files && fileInput.files[0]) {
        const f = fileInput.files[0];
        modelStatus.textContent = "Reading " + f.name + "…";
        if (/\.json$/i.test(f.name)) {
          const obj = JSON.parse(await f.text());
          if (obj && (Array.isArray(obj.experience) || Array.isArray(obj.education) || obj.skills)) {
            applyParsed(sanitizeParsed(obj), mode); return;
          }
          modelStatus.textContent = "That JSON doesn't look like a résumé export (no experience/education/skills)."; return;
        }
        text = /\.pdf$/i.test(f.name) ? await extractPdf(f) : await f.text();
      }
    } catch (e) { modelStatus.textContent = "Could not read file: " + (e && e.message || e); return; }

    if (!text) { modelStatus.textContent = "Choose a file or paste text first."; return; }
    store.rawSave(text);

    let parsed = null;
    if (llm.isReady()) {
      modelStatus.textContent = "AI is parsing your résumé…";
      try { parsed = await parseWithLLM(text); } catch (e) { console.warn("LLM parse failed, using parser:", e); }
    }
    if (!parsed) parsed = heuristicParse(text);
    parsed = sanitizeParsed(parsed);

    // Confirm before clobbering — lets the user catch a bad parse.
    const ne = (parsed.experience || []).length, nd = (parsed.education || []).length, ns = Object.keys(parsed.skills || {}).length;
    const np = (parsed.publications || []).length;
    const summary = "Found " + ne + " experience, " + nd + " education, " + ns + " skill group(s)" + (np ? ", " + np + " publication(s)" : "") +
      (llm.isReady() ? " (AI parse)." : " (built-in parser — load AI for better accuracy).");
    const q = mode === "build"
      ? summary + "\n\nReplace your current résumé with this?"
      : summary + "\n\nAdd these to the Collection (your current résumé is kept)?";
    if (!confirm(q)) { modelStatus.textContent = "Import cancelled."; return; }
    applyParsed(parsed, mode);
  }

  function applyParsed(parsed, mode) {
    if (mode === "collect") {
      store.update((s) => addToCollection(s, parsed));
      modelStatus.textContent = "Added to Collection — drag the blocks you want onto the résumé.";
    } else {
      store.set(normalize(parsed));
      modelStatus.textContent = "Résumé rebuilt from your document. Review the blocks and edit as needed.";
    }
  }

  // Download the current state as a JSON backup (re-importable via Build).
  function exportJSON() {
    try {
      const blob = new Blob([JSON.stringify(store.get(), null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      const name = decode(store.get().name || "resume").trim().replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "resume";
      a.download = name + "-resume.json";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      modelStatus.textContent = "Backup downloaded — import it any time with “Build résumé from this”.";
    } catch (e) { modelStatus.textContent = "Export failed: " + (e && e.message || e); }
  }

  // Append parsed blocks as a hidden library (Collection).
  function addToCollection(s, parsed) {
    (parsed.experience || []).forEach((e) => s.experience.push({
      id: store.uid("exp"), title: e.title || "Role", company: e.company || "",
      date: e.date || "", bullets: Array.isArray(e.bullets) ? e.bullets : (e.description ? [e.description] : []), include: false
    }));
    (parsed.education || []).forEach((e) => s.education.push({
      id: store.uid("edu"), degree: e.degree || "", school: e.school || "", shortSchool: e.shortSchool || e.school || "",
      date: e.date || "", gpa: e.gpa || "", include: false
    }));
    if (parsed.skills) { s.skillsHidden = s.skillsHidden || []; Object.entries(parsed.skills).forEach(([k, v]) => { if (!s.skills[k]) { s.skills[k] = Array.isArray(v) ? v : String(v).split(/,\s*/); s.skillsHidden.push(k); } }); }
  }

  // Reconstruct text lines from a PDF using each glyph-run's position. pdf.js
  // returns items in content-stream order with a transform matrix; we group runs
  // that share a baseline (y) into one line, and split when y jumps — otherwise
  // the whole résumé collapses into a single space-joined blob.
  async function extractPdf(file) {
    const pdfjs = await import("https://cdn.jsdelivr.net/npm/pdfjs-dist@4.7.76/build/pdf.min.mjs");
    pdfjs.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.7.76/build/pdf.worker.min.mjs";
    const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    const allLines = [];
    for (let p = 1; p <= doc.numPages; p++) {
      const tc = await (await doc.getPage(p)).getTextContent();
      const rows = [];
      tc.items.forEach((it) => {
        const s = it.str;
        if (!s) return;
        const y = it.transform[5], x = it.transform[4];
        let row = rows.find((r) => Math.abs(r.y - y) <= 3);
        if (!row) { row = { y, parts: [] }; rows.push(row); }
        row.parts.push({ x, w: it.width || 0, s });
      });
      rows.sort((a, b) => b.y - a.y); // top→bottom (PDF y grows upward)
      rows.forEach((r) => {
        r.parts.sort((a, b) => a.x - b.x);
        // Split a row into separate lines at large horizontal gaps, so a two-column
        // layout (content left, location/dates right) doesn't merge into one line.
        const segs = []; let seg = null;
        r.parts.forEach((pt) => {
          if (seg && pt.x - seg.endX > 45) { segs.push(seg.text); seg = null; }
          if (!seg) seg = { text: "", endX: pt.x };
          const gap = pt.x - seg.endX;
          // Only insert a space at a real horizontal gap — adjacent glyph runs
          // (e.g. the "fi" ligature) are contiguous and must not be split.
          if (seg.text && gap > 1.2 && !seg.text.endsWith(" ") && pt.s[0] !== " ") seg.text += " ";
          seg.text += pt.s; seg.endX = pt.x + pt.w;
        });
        if (seg) segs.push(seg.text);
        segs.forEach((t) => { t = t.replace(/\s{2,}/g, " ").trim(); if (t) allLines.push(t); });
      });
      allLines.push("");
    }
    return allLines.join("\n");
  }

  async function parseWithLLM(text) {
    const instruction =
      "You convert a résumé into JSON. Output ONLY a JSON object (no prose, no markdown, no code fences). Schema:\n" +
      '{"name": string, "title": string, "contact": {"email": string, "location": string, "linkedin": string, "github": string, "website": string}, ' +
      '"summary": string, "experience": [{"title": string, "company": string, "date": string, "bullets": [string]}], ' +
      '"education": [{"degree": string, "school": string, "date": string, "gpa": string}], ' +
      '"skills": {"Category": [string]}}\n' +
      "Rules: use ONLY facts present in the résumé; never invent. Put each role's responsibilities/achievements as separate bullet strings. Omit unknown fields. Résumé text:\n\n" + text.slice(0, 6000);
    const raw = await llm.generate(instruction);
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("No JSON in model output");
    return JSON.parse(m[0]);
  }

  // Section-aware parser. Real résumés put dates/locations in a right-hand
  // column, so after line reconstruction those values trail each entry — this
  // parser treats them as attributes of the current entry rather than new rows.
  const MON = "(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?";
  const DATE_RE = new RegExp("((?:19|20)\\d{2}|" + MON + "\\s+(?:19|20)\\d{2})\\s*(?:[\\u2013\\u2014\\-]|to)\\s*((?:19|20)\\d{2}|present|current|now|" + MON + "\\s+(?:19|20)\\d{2})", "i");
  const YEAR_RE = /\b(?:19|20)\d{2}\b/;
  const BULLET_RE = /^\s*[-•*●·▪◦‣]\s+/;
  const DEGREE_RE = /\b(b\.?s\.?|m\.?s\.?|ph\.?\s?d|bachelor|master|doctor|b\.?a\.?|m\.?a\.?|m\.?eng|b\.?eng|mba|associate|diploma|m\.?b\.?a)\b/i;
  const SCHOOL_RE = /(university|college|institute|\bschool\b|academy|polytechnic)/i;

  function sectionOf(line) {
    const h = line.toLowerCase().replace(/[^a-z ]/g, "").trim();
    if (h.length > 26 || h.length < 3) return null;
    if (/^(work )?experien|^employ|^professional (experience|background)|^career|^work history/.test(h)) return "experience";
    if (/^educat|^academic/.test(h)) return "education";
    if (/^(technical |core )?skills?|^competenc|^technolog|^languages?$/.test(h)) return "skills";
    if (/^projects?/.test(h)) return "experience";
    if (/^(summary|profile|objective|about)/.test(h)) return "summary";
    if (/^public|^papers/.test(h)) return "publications";
    if (/^additional|^other|^misc|^interests|^awards|^certif/.test(h)) return "additional";
    return null;
  }

  function isDateLine(l) {
    const hasYear = /(?:19|20)\d{2}/.test(l), hasPresent = /\b(present|current|now)\b/i.test(l);
    return (hasYear || hasPresent) && l.replace(/\s/g, "").length <= 24;
  }
  function isLocation(l) {
    const s = l.trim();
    return /^remote$/i.test(s)
      || /^[A-Z][\w.]+(?:[ \-][A-Z][\w.]+)*,\s*(?:[A-Z]{2}|[A-Z][a-z]+\.?)$/.test(s) // City, ST | City, Country
      || /^[A-Z][a-z]+,$/.test(s);                                                    // "Shandong," (wrapped)
  }

  function heuristicParse(text) {
    const lines = text.split(/\r?\n/).map((l) => l.trim());
    const head = lines.slice(0, 6).join(" ");
    const contact = {};
    const em = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/); if (em) contact.email = em[0].replace(/[).,]+$/, "");
    const li = text.match(/linkedin\.com\/[\w/%-]+/i); if (li) contact.linkedin = li[0].replace(/[).,]+$/, "");
    const gh = text.match(/github\.com\/[\w/%-]+/i); if (gh) contact.github = gh[0].replace(/[).,]+$/, "");
    const ph = head.match(/\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/); if (ph) contact.phone = ph[0];
    const contactLine = lines.slice(0, 6).find((l) => /[•|]|@|\d{3}[-.\s]\d{3}/.test(l)) || "";
    const loc = contactLine.match(/([A-Z][a-zA-Z.]+(?:\s[A-Z][a-zA-Z.]+){0,2},\s*[A-Z]{2})\b/); if (loc) contact.location = loc[1];

    let name = "", title = "";
    const firstReal = lines.find((l) => l);
    if (firstReal && firstReal.length <= 40 && !/[@\d]/.test(firstReal)) name = firstReal;
    // Headline: the line right under the name, if it isn't contact info or a section.
    if (name) {
      const after = lines.slice(lines.indexOf(name) + 1).find((l) => l);
      if (after && after.length <= 70 && !CONTACT_RE(after) && !sectionOf(after) && !/\d{4}/.test(after)) title = after;
    }

    const buckets = { summary: [], experience: [], education: [], skills: [], publications: [], additional: [] };
    let cur = "summary";
    lines.forEach((l) => {
      if (!l) return;
      const sec = sectionOf(l);
      if (sec) { cur = sec; return; }
      if (l === name) return;
      if (title && l === title && cur === "summary") return;
      if (cur === "summary" && (CONTACT_RE(l))) return;     // drop header contact line
      buckets[cur].push(l);
    });

    // "X Skills: …" lines may appear under Additional/Other — route them to skills.
    const skillLines = buckets.skills.slice();
    buckets.additional.forEach((l) => { if (/skills?\s*:/i.test(l) || /:/.test(l)) skillLines.push(l); });

    const out = {
      name, title, contact,
      summary: buckets.summary.join(" ").replace(/\s{2,}/g, " ").trim().slice(0, 700),
      experience: groupExperience(buckets.experience),
      education: groupEducation(buckets.education),
      skills: parseSkills(skillLines),
      publications: groupPublications(buckets.publications)
    };
    if (!out.experience.length && !out.education.length && !Object.keys(out.skills).length) {
      out.experience = [{ title: "Imported résumé", company: "", date: "", bullets: lines.filter(Boolean) }];
    }
    return out;
  }

  // One publication per line; wrapped lines (lowercase start) join the previous
  // one. "Title — Venue" splits on the em/en dash.
  function groupPublications(arr) {
    const lines = [];
    arr.forEach((l) => {
      l = l.replace(BULLET_RE, "").trim();
      if (!l) return;
      if (lines.length && /^[a-z(]/.test(l)) lines[lines.length - 1] += " " + l;
      else lines.push(l);
    });
    return lines.map((l) => {
      const m = l.match(/^(.{8,}?)\s+[—–]\s+(.+)$/);
      return m ? { title: tidy(m[1]), venue: tidy(m[2]), note: "" } : { title: tidy(l), venue: "", note: "" };
    });
  }

  function CONTACT_RE(l) {
    return /@|linkedin\.com|github\.com|\b[\w-]+\.(?:xyz|dev|io|me)\b|\d{3}[-.\s]\d{3}[-.\s]\d{4}|•|\|/.test(l);
  }

  const tidy = (s) => s.replace(/\s+([.,;:%)])/g, "$1").replace(/\(\s+/g, "(").replace(/\s{2,}/g, " ").trim();

  function groupExperience(arr) {
    const out = []; let cur = null, expectCompany = false;
    const mk = (t) => { const e = { title: t, company: "", date: "", location: "", bullets: [] }; out.push(e); return e; };
    arr.forEach((l) => {
      if (BULLET_RE.test(l)) { if (!cur) cur = mk("Experience"); cur.bullets.push(l.replace(BULLET_RE, "").trim()); expectCompany = false; return; }
      if (isDateLine(l)) { if (cur) cur.date = (cur.date ? cur.date + " " : "") + l; return; }
      if (isLocation(l)) { if (cur) cur.location = l; return; }
      if (cur && expectCompany && !cur.company && cur.bullets.length === 0) { cur.company = l; expectCompany = false; return; }
      // Wrapped continuation of the previous bullet (PDF line-wrap): a line that
      // starts lowercase, or a long sentence-like line, is not a new entry —
      // append it to the last bullet. Short title-case lines ("Software
      // Engineer") are treated as the next entry's title, never as wrap.
      if (cur && cur.bullets.length) {
        const prev = cur.bullets[cur.bullets.length - 1];
        const startsLower = /^[a-z(]/.test(l);
        const sentenceLike = l.length > 65 && !/[.!?:]$/.test(prev);
        if (startsLower || sentenceLike) { cur.bullets[cur.bullets.length - 1] = prev + " " + l; return; }
      }
      cur = mk(l); expectCompany = true;
    });
    out.forEach((e) => {
      e.date = e.date.replace(/\s*[–—\-]\s*/g, " – ").replace(/\s{2,}/g, " ").replace(/–\s*$/, "").trim();
      e.bullets = e.bullets.map(tidy);
    });
    return out.filter((e) => e.bullets.length || e.company || e.date);
  }

  function groupEducation(arr) {
    const out = []; let cur = null;
    const mk = () => { const e = { degree: "", school: "", shortSchool: "", date: "", gpa: "" }; out.push(e); return e; };
    arr.forEach((l) => {
      const gpaM = l.match(/gpa[:\s]*([0-4](?:\.\d{1,2})?(?:\s*\/\s*4(?:\.0)?)?)/i);
      if (SCHOOL_RE.test(l) && !DEGREE_RE.test(l)) { cur = mk(); cur.school = cur.shortSchool = l; return; }
      if (DEGREE_RE.test(l)) { if (!cur) cur = mk(); cur.degree = l; return; }
      if (gpaM) { if (cur) cur.gpa = gpaM[1].replace(/\s/g, ""); return; }
      if (isDateLine(l)) { if (cur) cur.date = (cur.date ? cur.date + " " : "") + l; return; }
      if (isLocation(l)) return;
      if (cur && !cur.degree) cur.degree = l;
    });
    out.forEach((e) => { e.date = e.date.replace(/\s*[–—\-]\s*/g, " – ").replace(/\s{2,}/g, " ").replace(/–\s*$/, "").trim(); });
    return out.filter((e) => e.degree || e.school);
  }

  function parseSkills(arr) {
    const skills = {};
    arr.forEach((l) => {
      const m = l.match(/^([A-Za-z][\w &/+.-]{1,34}?)\s*:\s*(.+)$/);
      if (m) {
        const cat = m[1].trim().replace(/\s*skills?$/i, "").replace(/^technical$/i, "Technical").replace(/^language$/i, "Languages") || "Skills";
        skills[cat] = m[2].split(/[,;|·]\s*/).map((x) => x.trim()).filter(Boolean);
      } else {
        (skills["Skills"] = skills["Skills"] || []).push(...l.split(/[,;|·]\s*/).map((x) => x.trim()).filter(Boolean));
      }
    });
    return skills;
  }

  // Merge a parsed object into a full RESUME-shaped state.
  function normalize(obj) {
    const base = store.get();
    const out = JSON.parse(JSON.stringify(base));
    if (obj.name) out.name = obj.name;
    out.title = obj.title || "";
    // Build mode replaces contact wholesale so no sample details leak through.
    const c = obj.contact || {};
    const url = (v) => "https://" + String(v).replace(/^https?:\/\//, "");
    out.contact = {
      email: c.email || "", location: c.location || "", phone: c.phone || "",
      website: c.website || "", websiteUrl: c.website ? url(c.website) : "",
      linkedin: c.linkedin || "", linkedinUrl: c.linkedin ? url(c.linkedin) : "",
      github: c.github || "", githubUrl: c.github ? url(c.github) : ""
    };
    out.summary = obj.summary || "";
    out.tagline = obj.tagline || "";   // never carry the sample tagline into an import
    // Kept when present (JSON backup round-trip); cleared otherwise so no
    // sample content leaks into an imported résumé.
    out.highlights = Array.isArray(obj.highlights) ? obj.highlights : [];
    out.projects = Array.isArray(obj.projects) ? obj.projects : [];
    out.publications = Array.isArray(obj.publications) ? obj.publications : [];
    out.skillsHidden = Array.isArray(obj.skillsHidden) ? obj.skillsHidden : [];
    if (Array.isArray(obj.experience) && obj.experience.length) {
      out.experience = obj.experience.map((e) => ({
        title: e.title || "Role", company: e.company || "", date: e.date || "",
        bullets: Array.isArray(e.bullets) ? e.bullets : (e.description ? [e.description] : []),
        include: true
      }));
    }
    if (Array.isArray(obj.education) && obj.education.length) {
      out.education = obj.education.map((e) => ({ degree: e.degree || "", school: e.school || "", shortSchool: e.shortSchool || e.school || "", date: e.date || "", gpa: e.gpa || "" }));
    }
    if (obj.skills && typeof obj.skills === "object") {
      out.skills = {};
      Object.entries(obj.skills).forEach(([k, v]) => { out.skills[k] = Array.isArray(v) ? v : String(v).split(/,\s*/); });
    }
    return out;
  }

  // ---------------- Blocks UI + drag/drop ----------------
  function renderBlocks() {
    if (!blocksEl) return;
    const s = store.get();
    blocksEl.innerHTML = "";
    s.experience.filter((e) => e.include !== false).forEach((e) => blocksEl.appendChild(blockEl(e)));

    // Collection: hidden experience blocks
    const hidden = s.experience.filter((e) => e.include === false);
    collEl.innerHTML = "";
    if (!hidden.length) collEl.innerHTML = '<div class="coll-empty">Nothing hidden. Click ✕ on a résumé entry to stash it here.</div>';
    hidden.forEach((e) => collEl.appendChild(collCard(e)));

    // Education list
    eduEl.innerHTML = "";
    s.education.forEach((e, i) => eduEl.appendChild(eduRow(e, i)));

    // Skills list
    skillsEl.innerHTML = "";
    Object.keys(s.skills).forEach((cat) => skillsEl.appendChild(skillRow(cat, s)));
  }

  // ---- Collection (hidden experience) ----
  function collCard(e) {
    const c = el("div", "coll-card");
    c.draggable = true;
    c.innerHTML = `<div class="ct">${disp(e.title)}</div><div class="cs">${disp([e.company, e.date].filter(Boolean).join(" · "))}</div><button class="cadd">+ Add to résumé</button>`;
    c.querySelector(".cadd").addEventListener("click", () => store.update((s) => { const t = s.experience.find((x) => x.id === e.id); if (t) t.include = true; }));
    c.addEventListener("dragstart", (ev) => { try { ev.dataTransfer.setData("text/plain", "collection:" + e.id); } catch (x) {} ev.dataTransfer.effectAllowed = "move"; });
    return c;
  }

  // ---- Education rows (reorder + toggle) ----
  function eduRow(e, idx) {
    const b = el("div", "block" + (e.include === false ? " excluded" : ""));
    b.draggable = true; b.dataset.idx = idx;
    b.innerHTML = `<div class="bhead"><span class="grip">⠿</span>
      <input type="checkbox" class="bx" ${e.include === false ? "" : "checked"}>
      <div><div class="btitle">${disp(e.degree)}</div><div class="bsub">${disp([e.shortSchool || e.school, e.gpa ? "GPA " + e.gpa : ""].filter(Boolean).join(" · "))}</div></div></div>`;
    b.querySelector(".bx").addEventListener("change", (ev) => store.update((s) => { s.education[idx].include = ev.target.checked; }));
    b.addEventListener("dragstart", () => { eduDrag = idx; b.classList.add("dragging"); });
    b.addEventListener("dragend", () => { eduDrag = null; b.classList.remove("dragging"); });
    b.addEventListener("dragover", (ev) => { ev.preventDefault(); });
    b.addEventListener("drop", (ev) => {
      ev.preventDefault();
      if (eduDrag == null || eduDrag === idx) return;
      const below = inLowerHalf(ev, b);
      store.update((s) => { const arr = s.education; const [m] = arr.splice(eduDrag, 1); const ti = idx > eduDrag ? idx - 1 : idx; arr.splice(below ? ti + 1 : ti, 0, m); });
    });
    return b;
  }

  // ---- Skill category rows (reorder + hide) ----
  function skillRow(cat, s) {
    const hidden = (s.skillsHidden || []).indexOf(cat) >= 0;
    const b = el("div", "block" + (hidden ? " excluded" : ""));
    b.draggable = true; b.dataset.cat = cat;
    b.innerHTML = `<div class="bhead"><span class="grip">⠿</span>
      <input type="checkbox" class="bx" ${hidden ? "" : "checked"}>
      <div><div class="btitle">${disp(cat)}</div><div class="bsub">${disp((s.skills[cat] || []).join(", ")).slice(0, 80)}</div></div></div>`;
    b.querySelector(".bx").addEventListener("change", (ev) => store.update((st) => {
      st.skillsHidden = st.skillsHidden || [];
      const i = st.skillsHidden.indexOf(cat);
      if (ev.target.checked && i >= 0) st.skillsHidden.splice(i, 1);
      else if (!ev.target.checked && i < 0) st.skillsHidden.push(cat);
    }));
    b.addEventListener("dragstart", () => { skillDrag = cat; b.classList.add("dragging"); });
    b.addEventListener("dragend", () => { skillDrag = null; b.classList.remove("dragging"); });
    b.addEventListener("dragover", (ev) => ev.preventDefault());
    b.addEventListener("drop", (ev) => {
      ev.preventDefault();
      const below = inLowerHalf(ev, b);
      store.update((st) => {
        if (skillDrag == null || skillDrag === cat) return;
        const keys = Object.keys(st.skills);
        const from = keys.indexOf(skillDrag); keys.splice(from, 1);
        let ti = keys.indexOf(cat); ti = below ? ti + 1 : ti;
        keys.splice(ti, 0, skillDrag);
        const ns = {}; keys.forEach((k) => ns[k] = st.skills[k]); st.skills = ns;
      });
    });
    return b;
  }

  function blockEl(e) {
    const b = el("div", "block" + (e.include === false ? " excluded" : ""));
    b.draggable = true; b.dataset.id = e.id;
    b.innerHTML = `
      <div class="bhead">
        <span class="grip" title="Drag to reorder">⠿</span>
        <input type="checkbox" class="bx" ${e.include === false ? "" : "checked"} title="Include in résumé">
        <div>
          <div class="btitle">${disp(e.title)}</div>
          <div class="bsub">${disp([e.company, e.date].filter(Boolean).join(" · "))}</div>
        </div>
      </div>
      <div class="bactions">
        <button class="mini" data-act="rephrase">✦ Rephrase</button>
        <button class="mini" data-act="edit">Edit</button>
        <button class="mini warn" data-act="del">Delete</button>
      </div>`;
    b.querySelector(".bx").addEventListener("change", (ev) => store.update((s) => { const t = s.experience.find((x) => x.id === e.id); if (t) t.include = ev.target.checked; }));
    b.querySelector('[data-act="del"]').addEventListener("click", () => { if (confirm("Delete this block?")) store.update((s) => { s.experience = s.experience.filter((x) => x.id !== e.id); }); });
    b.querySelector('[data-act="edit"]').addEventListener("click", () => openEdit(b, e));
    b.querySelector('[data-act="rephrase"]').addEventListener("click", (ev) => rephrase(e, ev.target));

    b.addEventListener("dragstart", () => { dragId = e.id; b.classList.add("dragging"); });
    b.addEventListener("dragend", () => { dragId = null; b.classList.remove("dragging"); [...blocksEl.children].forEach((c) => c.classList.remove("drop-above", "drop-below")); });
    b.addEventListener("dragover", (ev) => { ev.preventDefault(); const below = inLowerHalf(ev, b); b.classList.toggle("drop-below", below); b.classList.toggle("drop-above", !below); });
    b.addEventListener("dragleave", () => b.classList.remove("drop-above", "drop-below"));
    b.addEventListener("drop", (ev) => {
      ev.preventDefault();
      const below = inLowerHalf(ev, b);
      // Dropped block is either a visible one (dragId) or a Collection card
      // (id travels in the dataTransfer payload as "collection:ID").
      let fromId = dragId;
      if (!fromId) {
        const dt = ev.dataTransfer && ev.dataTransfer.getData("text/plain");
        if (dt && dt.indexOf(":") > 0) fromId = dt.split(":")[1];
      }
      store.update((s) => {
        const from = s.experience.findIndex((x) => x.id === fromId);
        let to = s.experience.findIndex((x) => x.id === e.id);
        if (from < 0 || to < 0 || from === to) return;
        const [moved] = s.experience.splice(from, 1);
        moved.include = true;
        to = s.experience.findIndex((x) => x.id === e.id);
        s.experience.splice(below ? to + 1 : to, 0, moved);
      });
    });
    return b;
  }

  function openEdit(b, e) {
    const ed = el("div");
    ed.style.marginTop = "8px";
    ed.innerHTML = `
      <input type="text" class="f-title" value="${disp(e.title)}" placeholder="Title" style="margin-bottom:6px;">
      <div class="row" style="margin-bottom:6px;">
        <input type="text" class="f-co" value="${disp(e.company)}" placeholder="Company" style="flex:1;">
        <input type="text" class="f-date" value="${disp(e.date)}" placeholder="Dates" style="width:96px;">
      </div>
      <textarea class="f-bul" placeholder="One bullet per line">${disp((e.bullets || []).map((x) => x.replace(/<\/?b>/g, "")).join("\n"))}</textarea>
      <div class="row" style="margin-top:6px;">
        <button class="mini" data-s="save">Save</button>
        <button class="mini" data-s="cancel">Cancel</button>
      </div>`;
    b.querySelector(".bactions").style.display = "none";
    b.appendChild(ed);
    ed.querySelector('[data-s="cancel"]').addEventListener("click", () => renderBlocks());
    ed.querySelector('[data-s="save"]').addEventListener("click", () => {
      const title = ed.querySelector(".f-title").value.trim();
      const company = ed.querySelector(".f-co").value.trim();
      const date = ed.querySelector(".f-date").value.trim();
      const bullets = ed.querySelector(".f-bul").value.split(/\n/).map((l) => l.trim()).filter(Boolean);
      store.update((s) => { const t = s.experience.find((x) => x.id === e.id); if (t) { t.title = title; t.company = company; t.date = date; t.bullets = bullets; } });
    });
  }

  function addBlock() {
    store.update((s) => {
      s.experience.unshift({ id: store.uid("exp"), title: "New Role", company: "Company", date: "20XX", bullets: ["Describe an achievement, leading with the result."], include: true });
    });
  }

  // ---------------- Rephrase via LLM ----------------
  const TONE = {
    professional: "a polished, professional tone",
    concise: "a concise, punchy style with strong action verbs",
    impact: "an impact-first style that leads each line with a quantified result",
    leadership: "a senior/leadership tone emphasizing ownership and scope",
    plain: "plain, clear language without jargon"
  };

  async function rephrase(e, btn) {
    if (!llm.isReady()) { modelStatus.textContent = "Load the AI model first to rephrase."; return; }
    const tone = TONE[toneSel.value] || TONE.professional;
    const extra = reqInput.value.trim() ? (" Additional requirement: " + reqInput.value.trim() + ".") : "";
    const label = btn.textContent; btn.textContent = "…"; btn.disabled = true;
    const instruction =
      "Rewrite these résumé bullet points in " + tone + "." + extra +
      " Rules: keep every fact truthful (invent nothing), one bullet per line, each starting with '- ', " +
      "at most ~22 words per line, no preamble. Bullets:\n" +
      (e.bullets || []).map((x) => "- " + x.replace(/<\/?b>/g, "")).join("\n");
    try {
      const out = await llm.generate(instruction);
      const lines = out.split(/\n/).map((l) => l.replace(/^[-•*]\s*/, "").trim()).filter((l) => l.length > 1);
      if (lines.length) store.update((s) => { const t = s.experience.find((x) => x.id === e.id); if (t) t.bullets = lines; });
      modelStatus.textContent = "Rephrased ✓";
    } catch (err) { console.error(err); modelStatus.textContent = "Rephrase failed: " + (err && err.message || err); }
    finally { btn.textContent = label; btn.disabled = false; }
  }

  return { init, toggle };
})();
