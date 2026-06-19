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

/* Shared helpers passed to every render() as the 2nd argument. */
window.RBHelpers = {
  // experience bullets as <li> using a given li class (default "")
  bullets: (job) => job.bullets.map(b => `<li>${b}</li>`).join(""),
  // skills as flat "k: v" entries
  skillEntries: (skills) => Object.entries(skills),
  // join a skill array
  join: (arr) => arr.join(", "),
  // publications, optionally only the "core" (most impactful) ones
  pubs: (data, coreOnly) => coreOnly ? data.publications.filter(p => p.core) : data.publications,
  // contact as an array of {label, text, href} for flexible layouts
  contactList: (c) => ([
    { k:"Email",    t:c.email,    href:"mailto:"+c.email },
    { k:"Location", t:c.location, href:null },
    { k:"Website",  t:c.website,  href:c.websiteUrl },
    { k:"LinkedIn", t:c.linkedin, href:c.linkedinUrl },
    { k:"GitHub",   t:c.github,   href:c.githubUrl }
  ])
};
