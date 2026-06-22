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

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  const decode = (s) => String(s == null ? "" : s).replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
  const disp = (s) => esc(decode(s));   // for safe plain-text display of entity-bearing data
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

  function init() {
    build();
    store.subscribe(renderBlocks);
    renderBlocks();
  }

  function build() {
    root = el("div"); root.id = "editor";
    root.innerHTML = `
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

    root.querySelector("#ed-load-ai").addEventListener("click", loadAI);
    root.querySelector("#ed-build").addEventListener("click", () => doParse("build"));
    root.querySelector("#ed-collect").addEventListener("click", () => doParse("collect"));
    root.querySelector("#ed-reset").addEventListener("click", () => { if (confirm("Reset to the sample résumé? Your edits will be cleared.")) store.reset(); });
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
          if (obj && obj.experience) { applyParsed(obj, mode); return; }
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

    // Confirm before clobbering — lets the user catch a bad parse.
    const ne = (parsed.experience || []).length, nd = (parsed.education || []).length, ns = Object.keys(parsed.skills || {}).length;
    const summary = "Found " + ne + " experience, " + nd + " education, " + ns + " skill group(s)" +
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

  async function extractPdf(file) {
    const pdfjs = await import("https://cdn.jsdelivr.net/npm/pdfjs-dist@4.7.76/build/pdf.min.mjs");
    pdfjs.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.7.76/build/pdf.worker.min.mjs";
    const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    let out = "";
    for (let i = 1; i <= doc.numPages; i++) {
      const tc = await (await doc.getPage(i)).getTextContent();
      out += tc.items.map((it) => it.str).join(" ") + "\n";
    }
    return out;
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

  // Section-aware parser: splits the document into Summary / Experience /
  // Education / Skills by recognising headings, then groups entries + bullets.
  const MON = "(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?";
  const DATE_RE = new RegExp("((?:19|20)\\d{2}|" + MON + "\\s+(?:19|20)\\d{2})\\s*(?:[\\u2013\\u2014\\-]|to)\\s*((?:19|20)\\d{2}|present|current|now|" + MON + "\\s+(?:19|20)\\d{2})", "i");
  const YEAR_RE = /\b(?:19|20)\d{2}\b/;
  const BULLET_RE = /^\s*[-•*●·▪◦‣–]\s+/;
  const CONTACT_RE = /@|linkedin\.com|github\.com|\b[\w-]+\.(?:xyz|dev|io|me)\b|^\+?\d[\d\s().-]{7,}$|\|\s*\S+\s*\|/i;

  function sectionOf(line) {
    const h = line.toLowerCase().replace(/[^a-z ]/g, "").trim();
    if (h.length > 32) return null;
    if (/^(work )?experien|^employ|^professional (experience|background)|^career/.test(h)) return "experience";
    if (/^educat|^academic/.test(h)) return "education";
    if (/^(technical )?skills?|^competenc|^technolog/.test(h)) return "skills";
    if (/^projects?/.test(h)) return "experience";          // fold projects into experience blocks
    if (/^(summary|profile|objective|about)/.test(h)) return "summary";
    if (/^public|^papers/.test(h)) return "publications";
    return null;
  }

  function heuristicParse(text) {
    const lines = text.split(/\r?\n/).map((l) => l.replace(/\s+$/, ""));
    const contact = {};
    const em = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/); if (em) contact.email = em[0];
    const li = text.match(/linkedin\.com\/[\w/%-]+/i); if (li) contact.linkedin = li[0].replace(/[).,]+$/, "");
    const gh = text.match(/github\.com\/[\w/%-]+/i); if (gh) contact.github = gh[0].replace(/[).,]+$/, "");
    const site = text.match(/\b[\w-]+\.(?:xyz|dev|io|me|com)\b/i);

    const buckets = { summary: [], experience: [], education: [], skills: [], publications: [] };
    let cur = "summary";
    let name = "", title = "";
    const firstReal = lines.find((l) => l.trim());
    if (firstReal && firstReal.trim().length <= 40 && !/[@\d]/.test(firstReal)) name = firstReal.trim();

    lines.forEach((raw) => {
      const l = raw.trim();
      if (!l) return;
      const sec = sectionOf(l);
      if (sec) { cur = sec; return; }
      if (l === name) { return; }
      if (!title && cur === "summary" && buckets.summary.length === 0 && l.length <= 60 && /engineer|developer|scientist|manager|designer|analyst|consultant|architect|lead/i.test(l)) { title = l; return; }
      // Skip contact / header lines (already extracted) so they don't pollute the summary.
      if (cur === "summary" && CONTACT_RE.test(l)) return;
      buckets[cur].push(l);
    });

    const out = {
      name, title, contact,
      summary: buckets.summary.join(" ").replace(/\s{2,}/g, " ").trim().slice(0, 700),
      experience: groupEntries(buckets.experience),
      education: groupEdu(buckets.education),
      skills: parseSkills(buckets.skills)
    };
    if (!out.experience.length && !out.education.length && !Object.keys(out.skills).length) {
      // nothing recognised — keep raw text as one editable block rather than losing it
      out.experience = [{ title: "Imported résumé", company: "", date: "", bullets: lines.map((l) => l.trim()).filter(Boolean) }];
    }
    return out;
  }

  function groupEntries(arr) {
    const out = []; let cur = null;
    arr.forEach((l) => {
      if (BULLET_RE.test(l)) {
        if (!cur) { cur = { title: "Experience", company: "", date: "", bullets: [] }; out.push(cur); }
        cur.bullets.push(l.replace(BULLET_RE, "").trim());
      } else {
        const dm = l.match(DATE_RE) || l.match(YEAR_RE);
        const date = dm ? dm[0] : "";
        let head = (date ? l.replace(date, "") : l).replace(/[|•·,–-]\s*$/, "").replace(/\s{2,}/g, " ").trim();
        let title = head, company = "";
        const sp = head.split(/\s+(?:at|@)\s+|\s+[|–—]\s+|,\s+/);
        if (sp.length >= 2 && sp[0].length <= 60) { title = sp[0].trim(); company = sp.slice(1).join(", ").trim(); }
        cur = { title: title || "Role", company: company, date: date, bullets: [] };
        out.push(cur);
      }
    });
    return out;
  }

  function groupEdu(arr) {
    const out = [];
    arr.forEach((l) => {
      const isDegree = /\b(b\.?s\.?|m\.?s\.?|ph\.?d|bachelor|master|doctor|b\.?a\.?|m\.?a\.?|mba|associate|diploma)\b/i.test(l);
      const dm = l.match(DATE_RE) || l.match(YEAR_RE);
      const date = dm ? dm[0] : "";
      const gpa = (l.match(/gpa[:\s]*([0-4]\.\d{1,2})/i) || [])[1] || "";
      const rest = l.replace(date, "").replace(/gpa[:\s]*[0-4]\.\d{1,2}/i, "").replace(/\s{2,}/g, " ").replace(/[,\s]+$/, "").trim();
      if (isDegree || !out.length) {
        let degree = rest, school = "";
        const sp = rest.split(/,\s+/);
        if (sp.length >= 2) { degree = sp[0].trim(); school = sp.slice(1).join(", ").trim(); }
        out.push({ degree: degree || rest, school, shortSchool: school, date, gpa });
      } else {
        const last = out[out.length - 1];
        if (!last.school) last.school = last.shortSchool = rest;
        if (date && !last.date) last.date = date;
        if (gpa && !last.gpa) last.gpa = gpa;
      }
    });
    return out;
  }

  function parseSkills(arr) {
    const skills = {};
    arr.forEach((l) => {
      const m = l.match(/^([A-Za-z][\w &/+.-]{1,34}?):\s*(.+)$/);
      if (m) { skills[m[1].trim()] = m[2].split(/[,;|·]\s*/).map((x) => x.trim()).filter(Boolean); }
      else { (skills["Skills"] = skills["Skills"] || []).push(...l.split(/[,;|·]\s*/).map((x) => x.trim()).filter(Boolean)); }
    });
    return skills;
  }

  // Merge a parsed object into a full RESUME-shaped state.
  function normalize(obj) {
    const base = store.get();
    const out = JSON.parse(JSON.stringify(base));
    if (obj.name) out.name = obj.name;
    if (obj.title) out.title = obj.title;
    if (obj.contact && typeof obj.contact === "object") {
      const c = obj.contact;
      if (c.email) out.contact.email = c.email;
      if (c.location) out.contact.location = c.location;
      if (c.linkedin) { out.contact.linkedin = c.linkedin; out.contact.linkedinUrl = "https://" + c.linkedin.replace(/^https?:\/\//, ""); }
      if (c.github) { out.contact.github = c.github; out.contact.githubUrl = "https://" + c.github.replace(/^https?:\/\//, ""); }
      if (c.website) { out.contact.website = c.website; out.contact.websiteUrl = "https://" + c.website.replace(/^https?:\/\//, ""); }
    }
    if (obj.summary) out.summary = obj.summary;
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
      const below = ev.offsetY > b.offsetHeight / 2;
      store.update((s) => { const arr = s.education; if (eduDrag == null) return; const [m] = arr.splice(eduDrag, 1); let ti = idx > eduDrag ? idx - 1 : idx; arr.splice(below ? ti + 1 : ti, 0, m); });
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
      const below = ev.offsetY > b.offsetHeight / 2;
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
    b.addEventListener("dragover", (ev) => { ev.preventDefault(); const below = ev.offsetY > b.offsetHeight / 2; b.classList.toggle("drop-below", below); b.classList.toggle("drop-above", !below); });
    b.addEventListener("dragleave", () => b.classList.remove("drop-above", "drop-below"));
    b.addEventListener("drop", (ev) => {
      ev.preventDefault();
      const below = ev.offsetY > b.offsetHeight / 2;
      store.update((s) => {
        const from = s.experience.findIndex((x) => x.id === dragId);
        let to = s.experience.findIndex((x) => x.id === e.id);
        if (from < 0 || to < 0 || from === to) return;
        const [moved] = s.experience.splice(from, 1);
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
