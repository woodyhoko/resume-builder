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
        <textarea id="ed-paste" placeholder="…or paste your résumé text here, then Parse."></textarea>
        <div class="row" style="margin-top:8px;">
          <button class="ed-btn" id="ed-parse">Parse into blocks</button>
          <button class="ed-btn" id="ed-reset">Reset to sample</button>
        </div>
        <div class="hintline">Parsing uses the local AI if loaded; otherwise a simple splitter you can edit. Stored only in your browser.</div>

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
    root.querySelector("#ed-parse").addEventListener("click", onParse);
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
  async function onParse() {
    const fileInput = root.querySelector("#ed-file");
    const pasted = root.querySelector("#ed-paste").value.trim();
    let text = pasted;
    try {
      if (!text && fileInput.files && fileInput.files[0]) {
        const f = fileInput.files[0];
        modelStatus.textContent = "Reading " + f.name + "…";
        if (/\.json$/i.test(f.name)) {
          const obj = JSON.parse(await f.text());
          if (obj && obj.experience) { store.set(normalize(obj)); modelStatus.textContent = "Loaded JSON résumé."; return; }
        }
        text = /\.pdf$/i.test(f.name) ? await extractPdf(f) : await f.text();
      }
    } catch (e) { modelStatus.textContent = "Could not read file: " + (e && e.message || e); return; }

    if (!text) { modelStatus.textContent = "Add a file or paste text first."; return; }
    store.rawSave(text);

    if (llm.isReady()) {
      modelStatus.textContent = "AI is parsing your résumé…";
      try {
        const parsed = await parseWithLLM(text);
        store.set(normalize(parsed));
        modelStatus.textContent = "Parsed with AI into editable blocks.";
        return;
      } catch (e) { console.warn("LLM parse failed, using splitter:", e); }
    }
    store.set(normalize(heuristicParse(text)));
    modelStatus.textContent = llm.isReady() ? "Parsed (fallback)." : "Imported with the simple splitter — load AI for smarter parsing, then edit blocks.";
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
      "You convert a résumé into JSON. Output ONLY a JSON object (no prose, no code fences) with keys:\n" +
      '{"summary": string, "experience": [{"title": string, "company": string, "date": string, "bullets": [string]}], ' +
      '"education": [{"degree": string, "school": string, "date": string, "gpa": string}], ' +
      '"skills": {"Category": [string]}}\n' +
      "Use only facts present in the résumé. Résumé:\n\n" + text.slice(0, 6000);
    const raw = await llm.generate(instruction);
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("No JSON in model output");
    return JSON.parse(m[0]);
  }

  // Very forgiving splitter: blank-line-separated chunks become blocks.
  function heuristicParse(text) {
    const chunks = text.split(/\n\s*\n/).map((c) => c.trim()).filter(Boolean);
    const experience = [];
    chunks.forEach((c) => {
      const lines = c.split(/\n/).map((l) => l.trim()).filter(Boolean);
      if (!lines.length) return;
      experience.push({ title: lines[0].slice(0, 80), company: "", date: "", bullets: lines.slice(1).map((l) => l.replace(/^[-•*]\s*/, "")) });
    });
    return { summary: chunks[0] || "", experience: experience.length ? experience : [{ title: "Imported résumé", company: "", date: "", bullets: text.split(/\n/).map((l) => l.trim()).filter(Boolean) }] };
  }

  // Merge a parsed object into a full RESUME-shaped state (keep contact/name/title).
  function normalize(obj) {
    const base = store.get();
    const out = JSON.parse(JSON.stringify(base));
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
