registerTemplate({
  key: "timeline",
  label: "Timeline",
  description: "Vertical timeline rail for experience with indigo accents — shows career progression at a glance.",
  css: `
  html,body{background:#525659;margin:0;}
  body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#2b2f38;font-size:10px;line-height:1.5;-webkit-font-smoothing:antialiased;}
  .page{--ink:#1b1f29;--muted:#5a616e;--light:#8b93a3;--accent:#4338ca;--accent-soft:#eef0fe;--hair:#e6e8ef;
    width:8.5in;min-height:11in;margin:14px auto;background:#fff;padding:0.46in 0.62in;box-shadow:0 4px 24px rgba(0,0,0,.28);}
  .head{display:flex;justify-content:space-between;align-items:flex-end;padding-bottom:9px;border-bottom:2px solid var(--accent);}
  .head .name{font-size:29px;font-weight:800;letter-spacing:-.4px;color:var(--ink);line-height:1;}
  .head .role{font-size:10.5px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:var(--accent);margin-top:6px;}
  .head .contact{text-align:right;font-size:9px;color:var(--muted);line-height:1.65;}
  .head .contact a{color:var(--muted);text-decoration:none;}
  .lead{font-size:10px;color:var(--muted);line-height:1.5;margin:9px 0 3px;}
  .lead strong{color:var(--ink);font-weight:600;}
  h2{font-size:11px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;color:var(--ink);margin:11px 0 8px;display:flex;align-items:center;gap:8px;}
  h2::before{content:"";width:14px;height:3px;border-radius:2px;background:var(--accent);}
  .tl{position:relative;padding-left:20px;}
  .tl::before{content:"";position:absolute;left:4.5px;top:4px;bottom:4px;width:2px;background:var(--hair);}
  .item{position:relative;margin-bottom:7px;}
  .item:last-child{margin-bottom:0;}
  .item::before{content:"";position:absolute;left:-20px;top:2.5px;width:11px;height:11px;border-radius:50%;background:#fff;border:2.5px solid var(--accent);box-shadow:0 0 0 3px var(--accent-soft);}
  .item .top{display:flex;justify-content:space-between;align-items:baseline;gap:10px;}
  .item .ttl{font-size:10.6px;font-weight:700;color:var(--ink);}
  .item .co{color:var(--accent);font-weight:700;}
  .item .dt{font-size:8.8px;font-weight:600;color:#fff;background:var(--accent);padding:1px 7px;border-radius:10px;white-space:nowrap;}
  ul.b{list-style:none;margin:2px 0 0;padding:0;}
  ul.b li{font-size:9.5px;color:var(--muted);line-height:1.34;padding-left:11px;position:relative;margin-bottom:1px;}
  ul.b li::before{content:"";position:absolute;left:0;top:5px;width:4px;height:4px;border-radius:50%;background:var(--accent);}
  ul.b b{color:var(--ink);font-weight:600;}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:0 26px;}
  .edu{margin-bottom:5px;}
  .edu .d{font-size:9.9px;font-weight:700;color:var(--ink);}
  .edu .s{font-size:9px;color:var(--muted);}
  .edu .m{font-size:8.6px;color:var(--accent);font-weight:600;margin-top:1px;}
  .sk{font-size:9.3px;color:var(--muted);line-height:1.5;}
  .sk div{margin-bottom:2px;}
  .sk .k{font-weight:700;color:var(--ink);}
  .pub{font-size:9.3px;color:var(--muted);line-height:1.4;margin-bottom:3px;padding-left:12px;position:relative;}
  .pub::before{content:"";position:absolute;left:0;top:5px;width:5px;height:5px;border-radius:50%;background:var(--accent);}
  .pub .t{color:var(--ink);font-weight:600;}
  .pub .v{color:var(--accent);font-weight:600;}
  @media print{ @page{size:8.5in 11in;margin:0;} html,body{background:#fff;} .page{margin:0;box-shadow:none;min-height:auto;} *{-webkit-print-color-adjust:exact;print-color-adjust:exact;} }
  `,
  render(d, H) {
    const C = d.contact;
    const items = d.experience.map(j =>
      `<div class="item" data-rb-drag="exp:${j.id}"><div class="top"><div class="ttl">${j.title} · <span class="co">${j.company}</span></div><div class="dt">${j.date}</div></div><ul class="b">${H.bullets(j)}</ul></div>`).join("");
    const edu = d.education.map(e =>
      `<div class="edu"><div class="d">${e.degree}</div><div class="s">${[e.shortSchool, e.gpa ? "GPA " + e.gpa : ""].filter(Boolean).join(" · ")}</div><div class="m">${e.date}</div></div>`).join("");
    const skills = Object.entries(d.skills).map(([cat, arr]) =>
      `<div><span class="k">${cat}:</span> ${H.join(arr)}</div>`).join("");
    const pubs = H.pubs(d, true).map(p =>
      `<div class="pub"><span class="t">${p.title}</span> — <span class="v">${p.venue}</span>${p.note?`, ${p.note}`:""}.</div>`).join("");
    return `<div class="page">
      <div class="head">
        <div><div class="name">${d.name}</div><div class="role">${d.title}</div></div>
        <div class="contact">${H.contactJoin(C, "<br>")}</div>
      </div>
      ${d.summary ? `<p class="lead">${d.summary}</p>` : ""}
      ${items ? `<h2>Experience</h2><div class="tl">${items}</div>` : ""}
      ${(edu || skills) ? `<h2>Education &amp; Skills</h2><div class="grid2"><div>${edu}</div><div class="sk">${skills}</div></div>` : ""}
      ${pubs ? `<h2>Selected Publications</h2>${pubs}` : ""}
    </div>`;
  }
});
