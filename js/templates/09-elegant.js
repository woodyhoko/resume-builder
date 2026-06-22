registerTemplate({
  key: "elegant",
  label: "Elegant Centered",
  description: "Centered serif display with flanked section headers and a petrol accent — boutique and refined.",
  css: `
  html,body{background:#525659;margin:0;}
  body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#2c2c2c;font-size:10px;line-height:1.5;-webkit-font-smoothing:antialiased;}
  .page{--ink:#1d1d1d;--muted:#525252;--light:#7d7d7d;--accent:#2f6b6b;--hair:#dcdcd6;
    width:8.5in;min-height:11in;margin:14px auto;background:#fff;padding:0.46in 0.7in;box-shadow:0 4px 24px rgba(0,0,0,.28);}
  .head{text-align:center;margin-bottom:6px;}
  .head .name{font-family:'Source Serif 4',Georgia,serif;font-size:33px;font-weight:700;letter-spacing:.5px;color:var(--ink);line-height:1;}
  .head .role{font-size:10px;font-weight:600;letter-spacing:4px;text-transform:uppercase;color:var(--accent);margin-top:7px;}
  .head .contact{font-size:9.2px;color:var(--muted);margin-top:7px;}
  .head .contact a{color:var(--muted);text-decoration:none;}
  .head .contact .dot{margin:0 7px;color:var(--hair);}
  h2{display:flex;align-items:center;justify-content:center;gap:13px;text-align:center;
     font-family:'Source Serif 4',Georgia,serif;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:var(--ink);margin:11px 0 6px;}
  h2::before,h2::after{content:"";flex:1;height:1px;background:var(--hair);}
  .lead{font-size:10px;color:var(--muted);line-height:1.5;text-align:center;margin:9px auto 2px;max-width:6.4in;}
  .lead strong{color:var(--ink);font-weight:600;}
  .exp{margin-bottom:5px;}
  .exp .top{display:flex;justify-content:space-between;align-items:baseline;gap:12px;}
  .exp .ttl{font-size:10.6px;font-weight:700;color:var(--ink);}
  .exp .co{color:var(--accent);font-weight:600;}
  .exp .dt{font-size:9px;color:var(--light);font-weight:600;white-space:nowrap;font-variant-numeric:tabular-nums;}
  ul.b{list-style:none;margin:2px 0 0;padding:0;}
  ul.b li{font-size:9.5px;color:var(--muted);line-height:1.34;padding-left:13px;position:relative;margin-bottom:1px;}
  ul.b li::before{content:"\\2022";position:absolute;left:2px;top:-0.5px;color:var(--accent);font-weight:700;}
  ul.b b{color:var(--ink);font-weight:600;}
  .cols{display:grid;grid-template-columns:1fr 1fr;gap:1px 30px;}
  .edu{margin-bottom:5px;text-align:left;}
  .edu .d{font-size:10px;font-weight:700;color:var(--ink);}
  .edu .s{font-size:9.2px;color:var(--muted);}
  .edu .m{font-size:8.8px;color:var(--accent);font-weight:600;margin-top:1px;}
  .pub{font-size:9.3px;color:var(--muted);line-height:1.42;margin-bottom:3px;text-align:center;}
  .pub .t{color:var(--ink);font-weight:600;font-style:italic;}
  .pub .v{color:var(--accent);font-weight:600;}
  .sk{font-size:9.5px;color:var(--muted);line-height:1.6;text-align:center;}
  .sk .k{font-weight:700;color:var(--ink);}
  @media print{ @page{size:8.5in 11in;margin:0;} html,body{background:#fff;} .page{margin:0;box-shadow:none;min-height:auto;} *{-webkit-print-color-adjust:exact;print-color-adjust:exact;} }
  `,
  render(d, H) {
    const C = d.contact;
    const contact = H.contactJoin(C, '<span class="dot">◆</span>');
    const jobs = d.experience.map(j =>
      `<div class="exp" data-rb-drag="exp:${j.id}"><div class="top"><div class="ttl">${j.title} &nbsp;·&nbsp; <span class="co">${j.company}</span></div><div class="dt">${j.date}</div></div><ul class="b">${H.bullets(j)}</ul></div>`).join("");
    const edu = d.education.map(e =>
      `<div class="edu"><div class="d">${e.degree}</div><div class="s">${[e.shortSchool, e.gpa ? "GPA " + e.gpa : ""].filter(Boolean).join(" · ")}</div><div class="m">${e.date}</div></div>`).join("");
    const pubs = H.pubs(d, true).map(p =>
      `<div class="pub"><span class="t">${p.title}</span> — <span class="v">${p.venue}</span>${p.note?`, ${p.note}`:""}.</div>`).join("");
    const skills = Object.entries(d.skills).map(([cat, arr]) =>
      `<div><span class="k">${cat}:</span> ${H.join(arr)}</div>`).join("");
    return `<div class="page">
      <div class="head">
        <div class="name">${d.name}</div>
        <div class="role">${d.title.replace("AI/ML","AI / ML")}</div>
        <div class="contact">${contact}</div>
      </div>
      ${d.summary ? `<p class="lead">${d.summary}</p>` : ""}
      ${jobs ? `<h2>Experience</h2>${jobs}` : ""}
      ${edu ? `<h2>Education</h2><div class="cols">${edu}</div>` : ""}
      ${pubs ? `<h2>Selected Publications</h2>${pubs}` : ""}
      ${skills ? `<h2>Technical Skills</h2><div class="sk">${skills}</div>` : ""}
    </div>`;
  }
});
