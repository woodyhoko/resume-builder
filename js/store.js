/* ============================================================
   Editable résumé state + persistence (localStorage cache).
   The store holds a RESUME-shaped object plus per-block `include`
   flags. Templates render a *filtered view* (included blocks only),
   so the template modules never need to know about editing.
   ============================================================ */
window.ResumeStore = (function () {
  const KEY = "resumebuilder.state.v2";
  const RAW = "resumebuilder.rawupload.v2";
  const subs = [];
  let state = null;
  let seq = 0;

  const clone = (o) => JSON.parse(JSON.stringify(o));
  const str = (v) => (typeof v === "string" ? v : v == null ? "" : String(v));

  // Heal any RESUME-shaped object: guarantee every field templates read
  // exists with the right type, so stale localStorage states, imported
  // JSON, and LLM output can never crash a render.
  function withFlags(d) {
    if (!d || typeof d !== "object" || Array.isArray(d)) d = {};
    d.name = str(d.name); d.title = str(d.title);
    d.tagline = str(d.tagline); d.summary = str(d.summary);
    if (!d.contact || typeof d.contact !== "object") d.contact = {};
    ["experience", "education", "projects", "publications", "highlights"].forEach((k) => {
      if (!Array.isArray(d[k])) d[k] = [];
    });
    if (!d.skills || typeof d.skills !== "object" || Array.isArray(d.skills)) d.skills = {};
    d.experience = d.experience.filter((e) => e && typeof e === "object");
    d.education  = d.education.filter((e) => e && typeof e === "object");
    d.experience.forEach((e, i) => {
      if (!Array.isArray(e.bullets)) e.bullets = [];
      if (e.include === undefined) e.include = true;
      if (e.id === undefined) e.id = "exp" + i + "_" + Math.abs(hash(str(e.title) + str(e.company)));
    });
    d.projects.forEach((p, i) => { if (p.include === undefined) p.include = true; if (p.id === undefined) p.id = "prj" + i + "_" + Math.abs(hash(str(p.name))); });
    d.education.forEach((e, i) => { if (e.include === undefined) e.include = true; if (e.id === undefined) e.id = "edu" + i + "_" + Math.abs(hash(str(e.degree) + str(e.school))); });
    if (!Array.isArray(d.skillsHidden)) d.skillsHidden = [];
    return d;
  }
  function hash(s) { let h = 0; s = String(s || ""); for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i) | 0; } return h; }
  function uid(prefix) { return prefix + "_" + Date.now().toString(36) + "_" + (++seq); }

  function defaults() { return withFlags(clone(window.RESUME)); }

  function load() {
    try {
      const s = localStorage.getItem(KEY);
      if (s) {
        const parsed = JSON.parse(s);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) { state = withFlags(parsed); return; }
      }
    } catch (e) { console.warn("[store] discarding unreadable saved state:", e); }
    state = defaults();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  function emit() { subs.forEach((cb) => { try { cb(state); } catch (e) { console.error(e); } }); }

  load();

  return {
    get: () => state,
    /** RESUME-shaped object containing only the blocks the user kept, in order. */
    view: () => {
      const hidden = state.skillsHidden || [];
      const skills = {};
      Object.keys(state.skills || {}).forEach((k) => { if (hidden.indexOf(k) < 0) skills[k] = state.skills[k]; });
      return Object.assign({}, state, {
        experience: state.experience.filter((e) => e.include !== false),
        projects: state.projects.filter((p) => p.include !== false),
        education: state.education.filter((e) => e.include !== false),
        skills
      });
    },
    update: (fn) => { fn(state); withFlags(state); save(); emit(); },
    set: (ns) => { state = withFlags(ns); save(); emit(); },
    reset: () => { state = defaults(); save(); emit(); },
    subscribe: (cb) => subs.push(cb),
    uid,
    rawSave: (t) => { try { localStorage.setItem(RAW, t); } catch (e) {} },
    rawGet: () => { try { return localStorage.getItem(RAW) || ""; } catch (e) { return ""; } }
  };
})();
