registerTemplate({
  key: "banner",
  label: "Header Banner",
  description: "Bold full-width header band with highlight chips — high-impact and recruiter-friendly.",
  css: `
  html,body{background:#525659;margin:0;}
  body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#2a2f37;font-size:10px;line-height:1.5;-webkit-font-smoothing:antialiased;}
  .page{--ink:#161b22;--muted:#525a64;--light:#828a94;--accent:#1d4ed8;--band:#10213f;--hair:#e5e8ed;
    width:8.5in;min-height:11in;margin:14px auto;background:#fff;box-shadow:0 4px 24px rgba(0,0,0,.28);overflow:hidden;}
  .band{background:var(--band);color:#fff;padding:0.34in 0.58in 0.3in;}
  .band-top{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;}
  .band .name{font-size:30px;font-weight:800;letter-spacing:-.3px;line-height:1;color:#fff;}
  .band .role{font-size:10.5px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#8fb4ff;margin-top:6px;}
  .band .contact{text-align:right;font-size:8.8px;color:#c4d0e0;line-height:1.6;}
  .band .contact a{color:#c4d0e0;text-decoration:none;}
  .hl{display:flex;flex-wrap:wrap;gap:6px;margin-top:11px;}
  .hl span{background:rgba(143,180,255,.14);border:1px solid rgba(143,180,255,.3);color:#dde8fb;border-radius:4px;padding:3px 8px;font-size:8.6px;font-weight:500;}
  .hl span b{color:#fff;font-weight:700;}
  .body{padding:0.3in 0.58in;}
  .lead{font-size:10px;color:var(--muted);line-height:1.5;margin-bottom:9px;}
  .lead strong{color:var(--ink);font-weight:600;}
  h2{font-size:11.5px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;color:var(--accent);margin:0 0 7px;display:flex;align-items:center;gap:9px;}
  h2::after{content:"";flex:1;height:2px;background:var(--hair);border-radius:2px;}
  section{margin-bottom:9px;}
  section:last-child{margin-bottom:0;}
  .exp{margin-bottom:6px;}
  .exp:last-child{margin-bottom:0;}
  .exp .top{display:flex;justify-content:space-between;align-items:baseline;gap:10px;}
  .exp .ttl{font-size:10.6px;font-weight:700;color:var(--ink);}
  .exp .co{color:var(--accent);font-weight:700;}
  .exp .dt{font-size:8.8px;font-weight:600;color:var(--light);white-space:nowrap;}
  ul.b{list-style:none;margin:2px 0 0;padding:0;}
  ul.b li{font-size:9.5px;color:var(--muted);line-height:1.34;padding-left:12px;position:relative;margin-bottom:1px;}
  ul.b li::before{content:"";position:absolute;left:0;top:4px;width:5px;height:5px;border-radius:1px;background:var(--accent);}
  ul.b b{color:var(--ink);font-weight:600;}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:0 28px;}
  .edu{margin-bottom:5px;}
  .edu .d{font-size:9.9px;font-weight:700;color:var(--ink);}
  .edu .s{font-size:9px;color:var(--muted);}
  .edu .m{font-size:8.6px;color:var(--accent);font-weight:600;margin-top:1px;}
  .sk{font-size:9.3px;color:var(--muted);line-height:1.5;}
  .sk div{margin-bottom:2px;}
  .sk .k{font-weight:700;color:var(--ink);}
  .pub{font-size:9.3px;color:var(--muted);line-height:1.4;margin-bottom:3px;padding-left:12px;position:relative;}
  .pub::before{content:"";position:absolute;left:0;top:4px;width:5px;height:5px;border-radius:1px;background:var(--accent);}
  .pub .t{color:var(--ink);font-weight:600;}
  .pub .v{color:var(--accent);font-weight:600;}
  @media print{ @page{size:8.5in 11in;margin:0;} html,body{background:#fff;} .page{margin:0;box-shadow:none;min-height:auto;} *{-webkit-print-color-adjust:exact;print-color-adjust:exact;} }
  `,
  render(d, H) {
    const C = d.contact;
    const hl = d.highlights.map(h => `<span>${h}</span>`).join("");
    const jobs = d.experience.map(j =>
      `<div class="exp"><div class="top"><div class="ttl">${j.title} · <span class="co">${j.company}</span></div><div class="dt">${j.date}</div></div><ul class="b">${H.bullets(j)}</ul></div>`).join("");
    const edu = d.education.map(e =>
      `<div class="edu"><div class="d">${e.degree}</div><div class="s">${e.shortSchool} · GPA ${e.gpa}</div><div class="m">${e.date}</div></div>`).join("");
    const skills = Object.entries(d.skills).map(([cat, arr]) =>
      `<div><span class="k">${cat}:</span> ${H.join(arr)}</div>`).join("");
    const pubs = H.pubs(d, true).map(p =>
      `<div class="pub"><span class="t">${p.title}</span> — <span class="v">${p.venue}</span>${p.note?`, ${p.note}`:""}.</div>`).join("");
    return `<div class="page">
      <div class="band">
        <div class="band-top">
          <div><div class="name">${d.name}</div><div class="role">${d.title}</div></div>
          <div class="contact">
            <div><a href="mailto:${C.email}">${C.email}</a></div>
            <div>${C.location}</div>
            <div><a href="${C.websiteUrl}">${C.website}</a> · <a href="${C.linkedinUrl}">${C.linkedin}</a> · <a href="${C.githubUrl}">${C.github}</a></div>
          </div>
        </div>
        <div class="hl">${hl}</div>
      </div>
      <div class="body">
        <p class="lead">${d.summary}</p>
        <section><h2>Experience</h2>${jobs}</section>
        <section><h2>Education &amp; Skills</h2>
          <div class="grid2"><div>${edu}</div><div class="sk">${skills}</div></div>
        </section>
        <section><h2>Selected Publications</h2>${pubs}</section>
      </div>
    </div>`;
  }
});
