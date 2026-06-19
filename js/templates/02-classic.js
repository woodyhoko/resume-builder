registerTemplate({
  key: "classic",
  label: "Classic Professional",
  description: "Single-column serif, centered header, justified text — ATS-friendly and conservative.",
  css: `
  html,body{background:#525659;margin:0;}
  body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a1a;font-size:10px;line-height:1.5;-webkit-font-smoothing:antialiased;}
  .page{--ink:#1a1a1a;--muted:#4a4a4a;--light:#6b6b6b;--rule:#222;--hair:#cfcfcf;--accent:#7a1f2b;
    width:8.5in;min-height:11in;margin:14px auto;background:#fff;padding:0.32in 0.6in;box-shadow:0 4px 24px rgba(0,0,0,.28);}
  header{text-align:center;border-bottom:2.2px solid var(--rule);padding-bottom:7px;margin-bottom:3px;}
  .name{font-family:'Source Serif 4',Georgia,serif;font-size:28px;font-weight:700;letter-spacing:1.2px;color:var(--ink);}
  .role{font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:var(--accent);margin-top:4px;}
  .contact{margin-top:8px;font-size:9.4px;color:var(--muted);display:flex;justify-content:center;flex-wrap:wrap;gap:4px 0;}
  .contact a{color:var(--muted);text-decoration:none;}
  .contact .dot{margin:0 8px;color:var(--hair);}
  section{margin-top:5px;}
  h2{font-family:'Source Serif 4',Georgia,serif;font-size:12px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:var(--ink);border-bottom:1px solid var(--hair);padding-bottom:2px;margin-bottom:5px;}
  .summary{font-size:10px;color:var(--muted);line-height:1.42;text-align:justify;}
  .summary strong{color:var(--ink);font-weight:600;}
  .entry{margin-bottom:4px;}
  .entry:last-child{margin-bottom:0;}
  .entry-head{display:flex;justify-content:space-between;align-items:baseline;gap:12px;}
  .entry-title{font-size:10.6px;font-weight:700;color:var(--ink);}
  .entry-org{font-weight:600;color:var(--accent);}
  .entry-date{font-size:9.2px;font-weight:600;color:var(--light);white-space:nowrap;font-variant-numeric:tabular-nums;}
  .bullets{list-style:none;margin:2px 0 0;padding:0;}
  .bullets li{font-size:9.5px;color:var(--muted);line-height:1.34;padding-left:13px;position:relative;margin-bottom:1px;}
  .bullets li::before{content:"\\2013";position:absolute;left:2px;top:0;color:var(--accent);font-weight:700;}
  .bullets b{color:var(--ink);font-weight:600;}
  .two-col{display:grid;grid-template-columns:1fr 1fr;gap:3px 26px;}
  .edu-line .d{font-size:10.2px;font-weight:700;color:var(--ink);}
  .edu-line .s{font-size:9.4px;color:var(--muted);}
  .edu-line .m{font-size:9px;color:var(--light);font-weight:600;}
  .edu-line{margin-bottom:4px;}
  ul.pub{list-style:none;margin:0;padding:0;}
  ul.pub li{font-size:9.5px;color:var(--muted);line-height:1.44;padding-left:14px;position:relative;margin-bottom:2px;}
  ul.pub li::before{content:"\\25B8";position:absolute;left:0;color:var(--accent);font-size:8px;top:1px;}
  ul.pub .t{color:var(--ink);font-weight:600;}
  ul.pub .v{font-weight:600;color:var(--ink);}
  .skills-grid{font-size:9.5px;color:var(--muted);line-height:1.55;}
  .skills-grid .k{font-weight:700;color:var(--ink);}
  @media print{ @page{size:8.5in 11in;margin:0;} html,body{background:#fff;} .page{margin:0;box-shadow:none;min-height:auto;} *{-webkit-print-color-adjust:exact;print-color-adjust:exact;} }
  `,
  render(d, H) {
    const C = d.contact;
    const contact = `<a href="mailto:${C.email}">${C.email}</a><span class="dot">•</span>`+
      `<span>${C.location}</span><span class="dot">•</span>`+
      `<a href="${C.websiteUrl}">${C.website}</a><span class="dot">•</span>`+
      `<a href="${C.linkedinUrl}">${C.linkedin}</a><span class="dot">•</span>`+
      `<a href="${C.githubUrl}">${C.github}</a>`;
    const jobs = d.experience.map(j =>
      `<div class="entry"><div class="entry-head"><div class="entry-title">${j.title}, <span class="entry-org">${j.company}</span></div><div class="entry-date">${j.date}</div></div><ul class="bullets">${H.bullets(j)}</ul></div>`).join("");
    const edu = d.education.map(e =>
      `<div class="edu-line"><div class="d">${e.degree} <span style="font-weight:600;color:var(--light);">· GPA ${e.gpa}</span></div><div class="s">${e.school}</div><div class="m">${e.date}</div></div>`).join("");
    const pubs = d.publications.map(p =>
      `<li><span class="t">${p.title}</span> — <span class="v">${p.venue}</span>${p.note?` (${p.note})`:""}.</li>`).join("");
    const skills = Object.entries(d.skills).map(([cat, arr]) =>
      `<div><span class="k">${cat}:</span> ${H.join(arr)}</div>`).join("");
    return `<div class="page">
      <header><div class="name">${d.name}</div><div class="role">${d.title.replace("AI/ML","AI / ML")}</div><div class="contact">${contact}</div></header>
      <section><h2>Summary</h2><p class="summary">${d.summary}</p></section>
      <section><h2>Professional Experience</h2>${jobs}</section>
      <section><h2>Education</h2><div class="two-col">${edu}</div></section>
      <section><h2>Selected Publications</h2><ul class="pub">${pubs}</ul></section>
      <section><h2>Technical Skills</h2><div class="skills-grid">${skills}</div></section>
    </div>`;
  }
});
