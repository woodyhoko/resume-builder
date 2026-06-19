registerTemplate({
  key: "modern-sidebar",
  label: "Modern Sidebar",
  description: "Two-column, dark navy sidebar, blue accent — bold and contemporary.",
  css: `
  html,body{background:#525659;margin:0;}
  body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1c2331;line-height:1.5;font-size:10.2px;-webkit-font-smoothing:antialiased;}
  .page{--ink:#1c2331;--muted:#5b6472;--line:#e2e6ec;--accent:#0f4c81;--accent-soft:#eaf1f8;--sidebar:#0f2740;--sidebar-ink:#dfe7f0;--sidebar-muted:#9fb2c8;
    width:8.5in;min-height:11in;margin:14px auto;background:#fff;display:grid;grid-template-columns:2.55in 1fr;box-shadow:0 4px 24px rgba(0,0,0,.28);overflow:hidden;}
  .sidebar{background:var(--sidebar);color:var(--sidebar-ink);padding:9mm 8mm;}
  .name{font-size:25px;font-weight:800;line-height:1.08;letter-spacing:.3px;color:#fff;}
  .role{margin-top:5px;font-size:11px;font-weight:600;color:#7fd0ff;letter-spacing:.6px;text-transform:uppercase;}
  .sb-block{margin-top:22px;}
  .sb-title{font-size:10px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#7fd0ff;padding-bottom:5px;margin-bottom:9px;border-bottom:1px solid rgba(127,208,255,.28);}
  .contact-row{display:flex;gap:8px;margin-bottom:7px;font-size:9.6px;color:var(--sidebar-ink);align-items:baseline;}
  .contact-row .lbl{color:var(--sidebar-muted);min-width:14px;font-weight:600;}
  .contact-row a{color:var(--sidebar-ink);text-decoration:none;word-break:break-all;}
  .skill-cat{font-size:9.4px;font-weight:700;color:#fff;margin:10px 0 5px;}
  .skill-cat:first-child{margin-top:0;}
  .chips{display:flex;flex-wrap:wrap;gap:4px;}
  .chip{background:rgba(127,208,255,.12);border:1px solid rgba(127,208,255,.25);color:#cfe6f7;border-radius:4px;padding:2px 6px;font-size:8.6px;font-weight:500;}
  .edu-item{margin-bottom:11px;}
  .edu-item:last-child{margin-bottom:0;}
  .edu-deg{font-size:9.8px;font-weight:700;color:#fff;line-height:1.3;}
  .edu-school{font-size:9px;color:var(--sidebar-muted);margin-top:1px;}
  .edu-meta{font-size:8.6px;color:#7fd0ff;font-weight:600;margin-top:2px;}
  .main{padding:9mm 11mm;}
  .summary{font-size:10.4px;color:var(--muted);line-height:1.46;margin-bottom:9px;}
  .summary strong{color:var(--ink);font-weight:600;}
  .sec{margin-bottom:9px;}
  .sec:last-child{margin-bottom:0;}
  .sec-head{display:flex;align-items:center;gap:9px;margin-bottom:7px;}
  .sec-head h2{font-size:12.5px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;color:var(--accent);white-space:nowrap;}
  .sec-head .bar{height:2px;background:var(--line);flex:1;border-radius:2px;}
  .job{margin-bottom:6px;position:relative;padding-left:14px;}
  .job:last-child{margin-bottom:0;}
  .job::before{content:"";position:absolute;left:0;top:4px;width:7px;height:7px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 3px var(--accent-soft);}
  .job-top{display:flex;justify-content:space-between;align-items:baseline;gap:10px;}
  .job-title{font-size:11px;font-weight:700;color:var(--ink);}
  .job-co{color:var(--accent);font-weight:700;}
  .job-date{font-size:9px;font-weight:600;color:var(--muted);white-space:nowrap;}
  .bullets{list-style:none;margin:3px 0 0;padding:0;}
  .bullets li{font-size:9.5px;color:var(--muted);line-height:1.34;padding-left:11px;position:relative;margin-bottom:1px;}
  .bullets li::before{content:"";position:absolute;left:0;top:5px;width:4px;height:4px;border-radius:50%;background:var(--accent);}
  .bullets b{color:var(--ink);font-weight:600;}
  .pub{font-size:9.6px;color:var(--muted);line-height:1.45;margin-bottom:5px;padding-left:14px;position:relative;}
  .pub::before{content:"";position:absolute;left:0;top:6px;width:5px;height:5px;border-radius:1px;background:var(--accent);}
  .pub .t{color:var(--ink);font-weight:600;font-style:italic;}
  .pub .v{color:var(--accent);font-weight:600;}
  .proj{margin-bottom:6px;padding-left:14px;position:relative;}
  .proj::before{content:"";position:absolute;left:0;top:5px;width:5px;height:5px;border-radius:1px;background:var(--accent);}
  .proj .pn{font-size:9.8px;font-weight:700;color:var(--ink);}
  .proj .pd{font-size:9.4px;color:var(--muted);line-height:1.5;}
  @media print{ @page{size:8.5in 11in;margin:0;} html,body{background:#fff;} .page{margin:0;box-shadow:none;width:8.5in;min-height:10.85in;} *{-webkit-print-color-adjust:exact;print-color-adjust:exact;} }
  `,
  render(d, H) {
    const C = d.contact;
    const skillBlocks = Object.entries(d.skills).map(([cat, arr]) =>
      `<div class="skill-cat">${cat}</div><div class="chips">${arr.map(s=>`<span class="chip">${s}</span>`).join("")}</div>`).join("");
    const edu = d.education.map(e =>
      `<div class="edu-item"><div class="edu-deg">${e.degree}</div><div class="edu-school">${e.school}</div><div class="edu-meta">${e.date} · GPA ${e.gpa}</div></div>`).join("");
    const jobs = d.experience.map(j =>
      `<div class="job"><div class="job-top"><div class="job-title">${j.title} · <span class="job-co">${j.company}</span></div><div class="job-date">${j.date}</div></div><ul class="bullets">${H.bullets(j)}</ul></div>`).join("");
    const pubs = H.pubs(d, true).map(p =>
      `<div class="pub"><span class="t">${p.title}</span> — <span class="v">${p.venue}</span>${p.note?`, ${p.note}`:""}.</div>`).join("");
    const projs = d.projects.map(p =>
      `<div class="proj"><span class="pn">${p.name}</span> — <span class="pd">${p.desc}</span></div>`).join("");
    return `<div class="page">
      <aside class="sidebar">
        <div class="name">${d.name}</div><div class="role">${d.title}</div>
        <div class="sb-block"><div class="sb-title">Contact</div>
          <div class="contact-row"><span class="lbl">✉</span><a href="mailto:${C.email}">${C.email}</a></div>
          <div class="contact-row"><span class="lbl">⌖</span><span>${C.location}</span></div>
          <div class="contact-row"><span class="lbl">⊕</span><a href="${C.websiteUrl}">${C.website}</a></div>
          <div class="contact-row"><span class="lbl">in</span><a href="${C.linkedinUrl}">${C.linkedin}</a></div>
          <div class="contact-row"><span class="lbl">gh</span><a href="${C.githubUrl}">${C.github}</a></div>
        </div>
        <div class="sb-block"><div class="sb-title">Skills</div>${skillBlocks}</div>
        <div class="sb-block"><div class="sb-title">Education</div>${edu}</div>
      </aside>
      <main class="main">
        <p class="summary">${d.summary}</p>
        <section class="sec"><div class="sec-head"><h2>Experience</h2><div class="bar"></div></div>${jobs}</section>
        <section class="sec"><div class="sec-head"><h2>Selected Publications</h2><div class="bar"></div></div>${pubs}</section>
        <section class="sec"><div class="sec-head"><h2>Selected Projects</h2><div class="bar"></div></div>${projs}</section>
      </main>
    </div>`;
  }
});
