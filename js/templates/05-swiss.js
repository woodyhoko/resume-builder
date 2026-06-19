registerTemplate({
  key: "swiss",
  label: "Swiss Typographic",
  description: "Editorial grid with numbered section labels and a single red accent — minimal and design-forward.",
  css: `
  html,body{background:#525659;margin:0;}
  body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#222;font-size:10px;line-height:1.5;-webkit-font-smoothing:antialiased;}
  .page{--ink:#111;--muted:#555;--light:#8a8a8a;--accent:#e1322d;--hair:#e6e6e6;
    width:8.5in;min-height:11in;margin:14px auto;background:#fff;padding:0.42in 0.6in;box-shadow:0 4px 24px rgba(0,0,0,.28);}
  .hero{border-bottom:3px solid var(--ink);padding-bottom:9px;margin-bottom:9px;}
  .hero .name{font-size:35px;font-weight:800;letter-spacing:-1.2px;line-height:.95;color:var(--ink);}
  .hero .name b{color:var(--accent);font-weight:800;}
  .hero .meta{display:flex;justify-content:space-between;align-items:flex-end;margin-top:9px;gap:14px;flex-wrap:wrap;}
  .hero .role{font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--ink);}
  .hero .contact{font-size:9px;color:var(--muted);text-align:right;line-height:1.55;}
  .hero .contact a{color:var(--muted);text-decoration:none;}
  .row{display:grid;grid-template-columns:1.35in 1fr;gap:16px;padding:6px 0;border-top:1px solid var(--hair);}
  .row:first-of-type{border-top:none;}
  .label{font-size:9px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:var(--ink);}
  .label .n{color:var(--accent);display:block;font-size:11px;margin-bottom:3px;font-weight:800;}
  .lead{font-size:10px;color:var(--muted);line-height:1.55;}
  .lead strong{color:var(--ink);font-weight:600;}
  .exp{margin-bottom:5px;}
  .exp:last-child{margin-bottom:0;}
  .exp .top{display:flex;justify-content:space-between;align-items:baseline;gap:10px;}
  .exp .ttl{font-size:10.5px;font-weight:700;color:var(--ink);}
  .exp .co{color:var(--accent);font-weight:600;}
  .exp .dt{font-size:8.8px;color:var(--light);font-weight:600;white-space:nowrap;}
  ul.b{list-style:none;margin:2px 0 0;padding:0;}
  ul.b li{font-size:9.4px;color:var(--muted);line-height:1.34;padding-left:11px;position:relative;margin-bottom:1px;}
  ul.b li::before{content:"";position:absolute;left:0;top:5px;width:5px;height:1.5px;background:var(--accent);}
  ul.b b{color:var(--ink);font-weight:600;}
  .edu{margin-bottom:5px;}
  .edu .d{font-size:9.8px;font-weight:700;color:var(--ink);}
  .edu .s{font-size:9px;color:var(--muted);}
  .edu .m{font-size:8.6px;color:var(--light);font-weight:600;}
  .sk{font-size:9.3px;color:var(--muted);line-height:1.5;}
  .sk div{margin-bottom:2px;}
  .sk .k{font-weight:700;color:var(--ink);}
  .pub{font-size:9.2px;color:var(--muted);line-height:1.38;margin-bottom:3px;}
  .pub .t{color:var(--ink);font-weight:600;}
  .pub .v{color:var(--accent);font-weight:600;}
  @media print{ @page{size:8.5in 11in;margin:0;} html,body{background:#fff;} .page{margin:0;box-shadow:none;min-height:auto;} *{-webkit-print-color-adjust:exact;print-color-adjust:exact;} }
  `,
  render(d, H) {
    const C = d.contact;
    const jobs = d.experience.map(j =>
      `<div class="exp" data-rb-drag="exp:${j.id}"><div class="top"><div class="ttl">${j.title} — <span class="co">${j.company}</span></div><div class="dt">${j.date}</div></div><ul class="b">${H.bullets(j)}</ul></div>`).join("");
    const edu = d.education.map(e =>
      `<div class="edu"><div class="d">${e.degree}</div><div class="s">${e.shortSchool}</div><div class="m">${e.date} · GPA ${e.gpa}</div></div>`).join("");
    const skills = Object.entries(d.skills).map(([cat, arr]) =>
      `<div><span class="k">${cat}</span> — ${H.join(arr)}</div>`).join("");
    const pubs = H.pubs(d, true).map(p =>
      `<div class="pub"><span class="t">${p.title}</span> · <span class="v">${p.venue}</span>${p.note?`, ${p.note}`:""}</div>`).join("");
    const row = (n, label, content) =>
      `<div class="row"><div class="label"><span class="n">${n}</span>${label}</div><div class="content">${content}</div></div>`;
    return `<div class="page">
      <div class="hero">
        <div class="name">Ho <b>Ko</b></div>
        <div class="meta">
          <div class="role">${d.title}</div>
          <div class="contact">
            <a href="mailto:${C.email}">${C.email}</a> &nbsp; ${C.location}<br>
            <a href="${C.websiteUrl}">${C.website}</a> &nbsp; <a href="${C.linkedinUrl}">${C.linkedin}</a> &nbsp; <a href="${C.githubUrl}">${C.github}</a>
          </div>
        </div>
      </div>
      ${row("01","Profile",`<p class="lead">${d.summary}</p>`)}
      ${row("02","Experience",jobs)}
      ${row("03","Education",edu)}
      ${row("04","Skills",`<div class="sk">${skills}</div>`)}
      ${row("05","Publications",pubs)}
    </div>`;
  }
});
