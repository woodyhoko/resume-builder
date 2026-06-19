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

  const clone = (o) => JSON.parse(JSON.stringify(o));

  function withFlags(d) {
    (d.experience || []).forEach((e, i) => { if (e.include === undefined) e.include = true; if (e.id === undefined) e.id = "exp" + i + "_" + Math.abs(hash(e.title + e.company)); });
    (d.projects || []).forEach((p, i) => { if (p.include === undefined) p.include = true; if (p.id === undefined) p.id = "prj" + i + "_" + Math.abs(hash(p.name)); });
    return d;
  }
  function hash(s) { let h = 0; s = String(s || ""); for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i) | 0; } return h; }
  function uid(prefix) { return prefix + "_" + Math.abs(hash(prefix + state.experience.length + JSON.stringify(state).length)); }

  function defaults() { return withFlags(clone(window.RESUME)); }

  function load() {
    try { const s = localStorage.getItem(KEY); if (s) { state = withFlags(JSON.parse(s)); return; } } catch (e) {}
    state = defaults();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  function emit() { subs.forEach((cb) => { try { cb(state); } catch (e) { console.error(e); } }); }

  load();

  return {
    get: () => state,
    /** RESUME-shaped object containing only the blocks the user kept, in order. */
    view: () => Object.assign({}, state, {
      experience: state.experience.filter((e) => e.include !== false),
      projects: state.projects.filter((p) => p.include !== false)
    }),
    update: (fn) => { fn(state); save(); emit(); },
    set: (ns) => { state = withFlags(ns); save(); emit(); },
    reset: () => { state = defaults(); save(); emit(); },
    subscribe: (cb) => subs.push(cb),
    uid,
    rawSave: (t) => { try { localStorage.setItem(RAW, t); } catch (e) {} },
    rawGet: () => { try { return localStorage.getItem(RAW) || ""; } catch (e) { return ""; } }
  };
})();
