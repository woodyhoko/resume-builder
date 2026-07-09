/* ============================================================
   Template registry + shared render helpers.
   Each template module calls registerTemplate({...}).
   A template is a self-contained module:
     { key, label, description, css, render(data, H) }
   - css:     a complete stylesheet (incl. its own @media print / @page).
              Only the active template's CSS is injected at a time, so
              templates may freely reuse class names without colliding.
   - render:  pure function returning the markup for one <div class="page">.
   - H:        shared helper namespace (see below).
   ============================================================ */
window.ResumeTemplates = window.ResumeTemplates || [];
window.registerTemplate = function (t) {
  if (!t || !t.key || typeof t.render !== "function") {
    console.warn("Invalid template skipped", t); return;
  }
  window.ResumeTemplates.push(t);
};

/* Shared helpers passed to every render() as the 2nd argument.
   Every helper tolerates missing/partial data — imported résumés
   rarely fill every field. */
window.RBHelpers = {
  // experience bullets as <li>
  bullets: (job) => (job && Array.isArray(job.bullets) ? job.bullets : []).map(b => `<li>${b}</li>`).join(""),
  // skills as flat "k: v" entries
  skillEntries: (skills) => Object.entries(skills || {}),
  // join a skill array
  join: (arr) => (Array.isArray(arr) ? arr : []).join(", "),
  // publications; coreOnly keeps everything not explicitly marked core:false,
  // so imported publications (no core flag) still show.
  pubs: (data, coreOnly) => {
    const list = Array.isArray(data.publications) ? data.publications : [];
    return coreOnly ? list.filter(p => p && p.core !== false) : list;
  },
  // Render a name with the last word wrapped in <b> (display templates).
  accentName: (name) => {
    const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (parts.length < 2) return parts[0] || "";
    const last = parts.pop();
    return parts.join(" ") + " <b>" + last + "</b>";
  },
  // A link when we have a URL, a plain span otherwise.
  link: (text, url) => url ? `<a href="${url}">${text}</a>` : `<span>${text}</span>`,
  // contact as an array of {label, text, href} for flexible layouts
  contactList: (c) => ([
    { k:"Email",    t:c.email,    href:c.email ? "mailto:"+c.email : null },
    { k:"Phone",    t:c.phone,    href:c.phone ? "tel:"+String(c.phone).replace(/[^\d+]/g, "") : null },
    { k:"Location", t:c.location, href:null },
    { k:"Website",  t:c.website,  href:c.websiteUrl || null },
    { k:"LinkedIn", t:c.linkedin, href:c.linkedinUrl || null },
    { k:"GitHub",   t:c.github,   href:c.githubUrl || null }
  ].filter(x => x.t)),
  // Inline contact line containing ONLY the fields that are present, joined by sep.
  contactJoin: (c, sep) => {
    const L = window.RBHelpers.link;
    const p = [];
    if (c.email)    p.push(L(c.email, "mailto:" + c.email));
    if (c.phone)    p.push(`<span>${c.phone}</span>`);
    if (c.location) p.push(`<span>${c.location}</span>`);
    if (c.website)  p.push(L(c.website, c.websiteUrl));
    if (c.linkedin) p.push(L(c.linkedin, c.linkedinUrl));
    if (c.github)   p.push(L(c.github, c.githubUrl));
    return p.join(sep);
  }
};
