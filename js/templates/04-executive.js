registerTemplate({
  key: "executive",
  label: "Executive Serif",
  description: "Refined serif with a double-rule header and muted bronze accent — senior and authoritative.",
  css: `
  html,body{background:#525659;margin:0;}
  body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#262626;font-size:10px;line-height:1.5;-webkit-font-smoothing:antialiased;}
  .page{--ink:#1a1a1a;--muted:#525252;--light:#7a7a7a;--accent:#8a6d3b;--hair:#e2ded5;--rule:#1a1a1a;
    width:8.5in;min-height:11in;margin:14px auto;background:#fff;padding:0.44in 0.66in;box-shadow:0 4px 24px rgba(0,0,0,.28);}
  .head{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px double var(--rule);padding-bottom:9px;}
  .head .name{font-family:'Source Serif 4',Georgia,serif;font-size:31px;font-weight:700;letter-spacing:.4px;color:var(--ink);line-height:1;}
  .head .role{font-size:10px;font-weight:600;letter-spacing:3.2px;text-transform:uppercase;color:var(--accent);margin-top:7px;}
  .head .contact{text-align:right;font-size:9px;color:var(--muted);line-height:1.65;}
  .head .contact a{color:var(--muted);text-decoration:none;}
  .lead{font-size:10px;color:var(--muted);line-height:1.5;text-align:justify;margin:10px 0 2px;}
  .lead strong{color:var(--ink);font-weight:600;}
  h2{font-family:'Source Serif 4',Georgia,serif;font-size:11.5px;font-weight:700;letter-spacing:2.2px;text-transform:uppercase;color:var(--ink);margin:11px 0 6px;display:flex;align-items:center;gap:11px;}
  h2::after{content:"";flex:1;height:1px;background:var(--hair);}
  .exp{margin-bottom:5px;}
  .exp .top{display:flex;justify-content:space-between;align-items:baseline;gap:12px;}
  .exp .ttl{font-size:10.6px;font-weight:700;color:var(--ink);}
  .exp .co{color:var(--accent);font-weight:600;}
  .exp .dt{font-size:9px;color:var(--light);font-weight:600;white-space:nowrap;font-variant-numeric:tabular-nums;}
  ul.b{list-style:none;margin:2px 0 0;padding:0;}
  ul.b li{font-size:9.5px;color:var(--muted);line-height:1.34;padding-left:13px;position:relative;margin-bottom:1px;}
  ul.b li::before{content:"";position:absolute;left:1px;top:4.5px;width:4px;height:4px;background:var(--accent);transform:rotate(45deg);}
  ul.b b{color:var(--ink);font-weight:600;}
  .cols{display:grid;grid-template-columns:1fr 1fr;gap:1px 30px;}
  .edu{margin-bottom:5px;}
  .edu .d{font-size:10px;font-weight:700;color:var(--ink);}
  .edu .s{font-size:9.2px;color:var(--muted);}
  .edu .m{font-size:8.8px;color:var(--accent);font-weight:600;margin-top:1px;}
  .pub{font-size:9.4px;color:var(--muted);line-height:1.42;margin-bottom:3px;padding-left:13px;position:relative;}
  .pub::before{content:"";position:absolute;left:1px;top:5px;width:4px;height:4px;background:var(--accent);transform:rotate(45deg);}
  .pub .t{color:var(--ink);font-weight:600;font-style:italic;}
  .pub .v{color:var(--accent);font-weight:600;}
  .sk{font-size:9.5px;color:var(--muted);line-height:1.6;}
  .sk .k{font-weight:700;color:var(--ink);}
  @media print{ @page{size:8.5in 11in;margin:0;} html,body{background:#fff;} .page{margin:0;box-shadow:none;min-height:auto;} *{-webkit-print-color-adjust:exact;print-color-adjust:exact;} }
  `,
  render(d, H) {
    const C = d.contact;
    const jobs = d.experience.map(j =>
      `<div class="exp" data-rb-drag="exp:${j.id}"><div class="top"><div class="ttl">${j.title} &nbsp;·&nbsp; <span class="co">${j.company}</span></div><div class="dt">${j.date}</div></div><ul class="b">${H.bullets(j)}</ul></div>`).join("");
    const edu = d.education.map(e =>
      `<div class="edu"><div class="d">${e.degree}</div><div class="s">${e.shortSchool} · GPA ${e.gpa}</div><div class="m">${e.date}</div></div>`).join("");
    const pubs = H.pubs(d, true).map(p =>
      `<div class="pub"><span class="t">${p.title}</span> — <span class="v">${p.venue}</span>${p.note?`, ${p.note}`:""}.</div>`).join("");
    const skills = Object.entries(d.skills).map(([cat, arr]) =>
      `<div><span class="k">${cat}:</span> ${H.join(arr)}</div>`).join("");
    return `<div class="page">
      <div class="head">
        <div><div class="name">${d.name}</div><div class="role">${d.title.replace("AI/ML","AI / ML")}</div></div>
        <div class="contact">
          <div><a href="mailto:${C.email}">${C.email}</a></div>
          <div>${C.location}</div>
          <div><a href="${C.websiteUrl}">${C.website}</a> · <a href="${C.linkedinUrl}">${C.linkedin}</a></div>
          <div><a href="${C.githubUrl}">${C.github}</a></div>
        </div>
      </div>
      <p class="lead">${d.summary}</p>
      <h2>Experience</h2>${jobs}
      <h2>Education</h2><div class="cols">${edu}</div>
      <h2>Selected Publications</h2>${pubs}
      <h2>Technical Skills</h2><div class="sk">${skills}</div>
    </div>`;
  }
});
