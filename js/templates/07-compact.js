registerTemplate({
  key: "compact",
  label: "Compact Two-Column",
  description: "Light grey sidebar, teal accent — airy and modern, easy to skim.",
  css: `
  html,body{background:#525659;margin:0;}
  body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#2a2f37;font-size:10px;line-height:1.5;-webkit-font-smoothing:antialiased;}
  .page{--ink:#1b2027;--muted:#566069;--light:#869099;--accent:#0f6e7e;--rail:#f2f5f7;--hair:#e3e8ec;
    width:8.5in;min-height:11in;margin:14px auto;background:#fff;display:grid;grid-template-columns:2.45in 1fr;box-shadow:0 4px 24px rgba(0,0,0,.28);overflow:hidden;}
  .aside{background:var(--rail);padding:0.42in 0.28in;border-right:1px solid var(--hair);}
  .name{font-size:23px;font-weight:800;letter-spacing:-.2px;color:var(--ink);line-height:1.05;}
  .role{font-size:9.6px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--accent);margin-top:5px;}
  .ablock{margin-top:17px;}
  .atitle{font-size:9.5px;font-weight:800;letter-spacing:1.3px;text-transform:uppercase;color:var(--ink);margin-bottom:7px;padding-bottom:4px;border-bottom:2px solid var(--accent);}
  .crow{font-size:9.2px;color:var(--muted);margin-bottom:5px;word-break:break-all;}
  .crow a{color:var(--muted);text-decoration:none;}
  .crow .k{display:block;font-size:8px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:var(--light);margin-bottom:1px;}
  .scat{font-size:9px;font-weight:700;color:var(--ink);margin:8px 0 4px;}
  .scat:first-child{margin-top:0;}
  .chips{display:flex;flex-wrap:wrap;gap:4px;}
  .chip{background:#fff;border:1px solid var(--hair);color:#42525c;border-radius:4px;padding:2px 6px;font-size:8.4px;font-weight:500;}
  .edu{margin-bottom:9px;}
  .edu:last-child{margin-bottom:0;}
  .edu .d{font-size:9.4px;font-weight:700;color:var(--ink);line-height:1.25;}
  .edu .s{font-size:8.6px;color:var(--muted);margin-top:1px;}
  .edu .m{font-size:8.4px;color:var(--accent);font-weight:600;margin-top:1px;}
  .main{padding:0.42in 0.4in;}
  .lead{font-size:10px;color:var(--muted);line-height:1.46;margin-bottom:9px;}
  .lead strong{color:var(--ink);font-weight:600;}
  h2{font-size:11.5px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;color:var(--accent);margin:0 0 7px;display:flex;align-items:center;gap:8px;}
  h2::after{content:"";flex:1;height:1px;background:var(--hair);}
  section{margin-bottom:9px;}
  section:last-child{margin-bottom:0;}
  .exp{margin-bottom:6px;}
  .exp:last-child{margin-bottom:0;}
  .exp .top{display:flex;justify-content:space-between;align-items:baseline;gap:10px;}
  .exp .ttl{font-size:10.6px;font-weight:700;color:var(--ink);}
  .exp .co{color:var(--accent);font-weight:700;}
  .exp .dt{font-size:8.8px;font-weight:600;color:var(--light);white-space:nowrap;}
  ul.b{list-style:none;margin:2px 0 0;padding:0;}
  ul.b li{font-size:9.5px;color:var(--muted);line-height:1.34;padding-left:11px;position:relative;margin-bottom:1px;}
  ul.b li::before{content:"";position:absolute;left:0;top:5px;width:4px;height:4px;border-radius:50%;background:var(--accent);}
  ul.b b{color:var(--ink);font-weight:600;}
  .pub{font-size:9.4px;color:var(--muted);line-height:1.42;margin-bottom:3px;padding-left:12px;position:relative;}
  .pub::before{content:"";position:absolute;left:0;top:5px;width:5px;height:5px;border-radius:50%;background:var(--accent);}
  .pub .t{color:var(--ink);font-weight:600;}
  .pub .v{color:var(--accent);font-weight:600;}
  @media print{ @page{size:8.5in 11in;margin:0;} html,body{background:#fff;} .page{margin:0;box-shadow:none;min-height:10.85in;} *{-webkit-print-color-adjust:exact;print-color-adjust:exact;} }
  `,
  render(d, H) {
    const C = d.contact;
    const skillBlocks = Object.entries(d.skills).map(([cat, arr]) =>
      `<div class="scat">${cat}</div><div class="chips">${arr.map(s=>`<span class="chip">${s}</span>`).join("")}</div>`).join("");
    const edu = d.education.map(e =>
      `<div class="edu"><div class="d">${e.degree}</div><div class="s">${e.shortSchool}</div><div class="m">${[e.date, e.gpa ? "GPA " + e.gpa : ""].filter(Boolean).join(" · ")}</div></div>`).join("");
    const jobs = d.experience.map(j =>
      `<div class="exp" data-rb-drag="exp:${j.id}"><div class="top"><div class="ttl">${j.title} · <span class="co">${j.company}</span></div><div class="dt">${j.date}</div></div><ul class="b">${H.bullets(j)}</ul></div>`).join("");
    const pubs = H.pubs(d, true).map(p =>
      `<div class="pub"><span class="t">${p.title}</span> — <span class="v">${p.venue}</span>${p.note?`, ${p.note}`:""}.</div>`).join("");
    return `<div class="page">
      <aside class="aside">
        <div class="name">${d.name}</div><div class="role">${d.title}</div>
        <div class="ablock"><div class="atitle">Contact</div>
          ${C.email ? `<div class="crow"><span class="k">Email</span><a href="mailto:${C.email}">${C.email}</a></div>` : ""}
          ${C.location ? `<div class="crow"><span class="k">Location</span>${C.location}</div>` : ""}
          ${C.website ? `<div class="crow"><span class="k">Website</span><a href="${C.websiteUrl}">${C.website}</a></div>` : ""}
          ${C.linkedin ? `<div class="crow"><span class="k">LinkedIn</span><a href="${C.linkedinUrl}">${C.linkedin}</a></div>` : ""}
          ${C.github ? `<div class="crow"><span class="k">GitHub</span><a href="${C.githubUrl}">${C.github}</a></div>` : ""}
        </div>
        ${skillBlocks ? `<div class="ablock"><div class="atitle">Skills</div>${skillBlocks}</div>` : ""}
        ${edu ? `<div class="ablock"><div class="atitle">Education</div>${edu}</div>` : ""}
      </aside>
      <main class="main">
        ${d.summary ? `<p class="lead">${d.summary}</p>` : ""}
        ${jobs ? `<section><h2>Experience</h2>${jobs}</section>` : ""}
        ${pubs ? `<section><h2>Selected Publications</h2>${pubs}</section>` : ""}
      </main>
    </div>`;
  }
});
