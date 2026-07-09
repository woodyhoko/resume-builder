registerTemplate({
  key: "tech-minimal",
  label: "Tech Minimal",
  description: "Monospace accents, terminal-green palette — a clean developer aesthetic.",
  css: `
  html,body{background:#525659;margin:0;}
  body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#3a4250;font-size:10.3px;line-height:1.5;-webkit-font-smoothing:antialiased;}
  .page{--ink:#0d1117;--body:#3a4250;--muted:#6a7280;--hair:#e7eaef;--accent:#0aa37f;--accent-ink:#06795e;--soft:#edf8f4;
    width:8.5in;min-height:11in;margin:14px auto;background:#fff;padding:0.4in 0.6in;box-shadow:0 4px 24px rgba(0,0,0,.28);}
  header{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid var(--ink);padding-bottom:10px;}
  .name{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:28px;font-weight:700;letter-spacing:-1px;color:var(--ink);line-height:1;}
  .role{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:500;color:var(--accent-ink);margin-top:7px;letter-spacing:.3px;}
  .role::before{content:"// ";color:var(--muted);}
  .contact{text-align:right;font-family:'JetBrains Mono',monospace;font-size:8.7px;color:var(--muted);line-height:1.7;}
  .contact a{color:var(--body);text-decoration:none;}
  .contact .k{color:var(--accent);}
  .summary{font-size:10.3px;color:var(--body);line-height:1.52;margin:8px 0 4px;}
  .summary strong{color:var(--ink);font-weight:600;}
  section{margin-top:8px;}
  h2{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--ink);display:flex;align-items:center;gap:9px;margin-bottom:11px;}
  h2::before{content:"";display:inline-block;width:9px;height:9px;background:var(--accent);border-radius:2px;transform:rotate(45deg);}
  h2 .ln{flex:1;height:1px;background:var(--hair);}
  .job{margin-bottom:6px;}
  .job:last-child{margin-bottom:0;}
  .job-head{display:flex;justify-content:space-between;align-items:baseline;gap:12px;}
  .job-title{font-size:11px;font-weight:600;color:var(--ink);}
  .job-co{color:var(--accent-ink);font-weight:700;}
  .job-date{font-family:'JetBrains Mono',monospace;font-size:8.7px;font-weight:500;color:var(--muted);white-space:nowrap;background:var(--soft);padding:1px 7px;border-radius:4px;}
  .bullets{list-style:none;margin:3px 0 0;padding:0;}
  .bullets li{font-size:9.5px;color:var(--muted);line-height:1.34;padding-left:13px;position:relative;margin-bottom:1px;}
  .bullets li::before{content:"\\25B9";position:absolute;left:0;top:0;color:var(--accent);font-weight:700;}
  .bullets b{color:var(--ink);font-weight:600;}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:9px 22px;}
  .edu{border-left:2px solid var(--accent);padding-left:9px;margin-bottom:7px;}
  .edu:last-child{margin-bottom:0;}
  .edu .d{font-size:10px;font-weight:600;color:var(--ink);}
  .edu .s{font-size:9.2px;color:var(--muted);margin-top:1px;}
  .edu .m{font-family:'JetBrains Mono',monospace;font-size:8.6px;color:var(--accent-ink);font-weight:500;margin-top:2px;}
  .skill-row{display:flex;gap:9px;margin-bottom:6px;align-items:baseline;}
  .skill-row .k{font-family:'JetBrains Mono',monospace;font-size:8.7px;color:var(--accent-ink);font-weight:600;min-width:54px;text-align:right;}
  .skill-row .v{font-size:9.5px;color:var(--body);line-height:1.5;}
  .pub{font-size:9.6px;color:var(--muted);line-height:1.52;margin-bottom:6px;padding-left:16px;position:relative;}
  .pub::before{content:"\\203A";position:absolute;left:2px;top:0;color:var(--accent);font-weight:700;font-size:11px;}
  .pub .t{color:var(--ink);font-weight:600;}
  .pub .v{font-family:'JetBrains Mono',monospace;font-size:8.6px;color:var(--accent-ink);font-weight:600;}
  @media print{ @page{size:8.5in 11in;margin:0;} html,body{background:#fff;} .page{margin:0;box-shadow:none;min-height:auto;} *{-webkit-print-color-adjust:exact;print-color-adjust:exact;} }
  `,
  render(d, H) {
    const C = d.contact;
    const km = {"Languages":"lang","ML Lifecycle":"ml","On-Device &amp; Web":"web","Domains":"domains"};
    const jobs = d.experience.map(j =>
      `<div class="job" data-rb-drag="exp:${j.id}"><div class="job-head"><div class="job-title">${j.title} · <span class="job-co">${j.company}</span></div><div class="job-date">${j.date}</div></div><ul class="bullets">${H.bullets(j)}</ul></div>`).join("");
    const edu = d.education.map(e =>
      `<div class="edu"><div class="d">${e.degree}</div><div class="s">${[e.shortSchool, e.gpa ? "GPA " + e.gpa : ""].filter(Boolean).join(" · ")}</div><div class="m">${e.date}</div></div>`).join("");
    const skills = Object.entries(d.skills).map(([cat, arr]) =>
      `<div class="skill-row"><div class="k">${km[cat]||cat}</div><div class="v">${H.join(arr)}</div></div>`).join("");
    const pubs = H.pubs(d, true).map(p =>
      `<div class="pub"><span class="t">${p.title}</span> — <span class="v">${p.venue}</span>${p.note?`, ${p.note}`:""}.</div>`).join("");
    return `<div class="page">
      <header><div><div class="name">${d.name}</div><div class="role">${d.title}</div></div>
        <div class="contact">
          ${C.email ? `<div><span class="k">email</span> <a href="mailto:${C.email}">${C.email}</a></div>` : ""}
          ${C.phone ? `<div><span class="k">tel&nbsp;&nbsp;</span> ${C.phone}</div>` : ""}
          ${C.location ? `<div><span class="k">loc&nbsp;&nbsp;</span> ${C.location}</div>` : ""}
          ${C.website ? `<div><span class="k">web&nbsp;&nbsp;</span> <a href="${C.websiteUrl}">${C.website}</a></div>` : ""}
          ${C.linkedin ? `<div><span class="k">li&nbsp;&nbsp;&nbsp;</span> <a href="${C.linkedinUrl}">${C.linkedin}</a></div>` : ""}
          ${C.github ? `<div><span class="k">git&nbsp;&nbsp;</span> <a href="${C.githubUrl}">${C.github}</a></div>` : ""}
        </div>
      </header>
      ${d.summary ? `<p class="summary">${d.summary}</p>` : ""}
      ${jobs ? `<section><h2>Experience<span class="ln"></span></h2>${jobs}</section>` : ""}
      ${(edu || skills) ? `<div class="grid2">
        ${edu ? `<section><h2>Education<span class="ln"></span></h2>${edu}</section>` : "<section></section>"}
        ${skills ? `<section><h2>Skills<span class="ln"></span></h2>${skills}</section>` : "<section></section>"}
      </div>` : ""}
      ${pubs ? `<section><h2>Selected Publications<span class="ln"></span></h2>${pubs}</section>` : ""}
    </div>`;
  }
});
