/* ============================================================
   Résumé content — single source of truth for every template.
   Edit here once; all templates re-render from this object.
   ============================================================ */
window.RESUME = {
  name: "Ho Ko",
  title: "AI/ML Software Engineer",
  tagline: "On-device LLMs · efficient inference · 3D graphics",
  contact: {
    email: "woodyhoko@gmail.com",
    location: "San Francisco Bay Area, CA",
    website: "hoko.xyz",            websiteUrl: "https://hoko.xyz",
    linkedin: "linkedin.com/in/hoko", linkedinUrl: "https://linkedin.com/in/hoko",
    github: "github.com/woodyhoko",   githubUrl: "https://github.com/woodyhoko"
  },
  summary: "AI/ML Software Engineer with cross-domain experience spanning astronomy, weather forecasting, economics, healthcare, NLP, and computer vision. Works across the full <strong>model lifecycle</strong> — training and distilling deep models, architecting highly efficient inference engines, and building scalable, high-throughput serving — and brings that intelligence <strong>on-device</strong> through WebGPU, Three.js, and local LLMs in privacy-preserving systems that have reached <strong>1B+ users</strong>.",

  // Short, punchy impact lines for banner / executive layouts
  highlights: [
    "Powering <b>AI Mode &amp; AI Overviews</b> in Google Search (Google Lens)",
    "Shipped on-device LLMs reaching <b>1B+ users</b> — Chrome Built-in AI &amp; Google AI Core",
    "<b>Sparse RAG</b> — first-author paradigm published at ICLR 2025 (Google DeepMind)",
    "<b>100%</b> GenAI task-library coverage in the LiteRT Task Library"
  ],

  experience: [
    { title:"Machine Learning Engineer", company:"Google", date:"2026–Present", bullets:[
      "Build <b>knowledge-grounded retrieval &amp; ranking models</b> on Google Lens that power AI Mode in Google Search and AI Overviews at Search scale.",
      "<b>Distill Gemini</b> into highly compressed models that hold near-equal quality while meeting the Lens stack's latency, scalability, and multimodal requirements." ]},
    { title:"Software Engineer", company:"Google", date:"2023–2026", bullets:[
      "Core contributor to the <b>LiteRT LM inference engine</b>, running LLMs privately and offline across Windows, macOS, Linux, and Android — including NPU acceleration.",
      "Enabled Gemma multimodality (vision + audio + text) and Gemini Nano on-device; helped ship <b>Chrome Built-in AI and Google AI Core, reaching 1B+ users</b>.",
      "Shipped the <b>Google AI Edge Gallery</b> app on Android and iOS." ]},
    { title:"Research Collaborator", company:"Google DeepMind", date:"2024–2025", bullets:[
      "Designed <b>Sparse RAG (ICLR 2025)</b>, a sparse decoding paradigm that encodes retrieved docs in parallel and attends only to the most relevant caches via learned control tokens.",
      "Cut long-range attention latency while <b>improving generation quality across 4 retrieval benchmarks</b>." ]},
    { title:"Research Collaborator", company:"Google Health &amp; Fitbit", date:"2024–2025", bullets:[
      "Built and evaluated ML models <b>detecting hypertension risk from raw wrist PPG</b> passively collected on a consumer smartwatch (medRxiv), enabling non-invasive screening at population scale." ]},
    { title:"Software Engineer", company:"MyCareLinq", date:"2023", bullets:[
      "Built <b>NLP pipelines and a home-health-care knowledge graph</b> from unstructured health documentation.",
      "Integrated LLMs powering caregiving assistants that surface contextual recommendations and care-plan summaries." ]},
    { title:"Software Engineer Intern", company:"Google", date:"2022", bullets:[
      "Built a TFLite tensor extractor + metadata-writer with classification rules at <b>100% coverage of common GenAI task libraries</b> (LiteRT Task Library).",
      "Integrated a <b>C++ code generator</b> compiling optimized inference pipelines for arbitrary TFLite files." ]},
    { title:"Research Assistant", company:"Caltech (SURF)", date:"2018", bullets:[
      "Analyzed transient imaging from the Zwicky Transient Facility; <b>co-authored a Type IIb supernova study in ApJL (878:L5)</b> and simulated double-peak light-curve models." ]}
  ],

  education: [
    { degree:"M.S. Computer Science", school:"University of Southern California — AI &amp; ML specialization", shortSchool:"USC — AI &amp; ML", date:"2021–2023", gpa:"4.0/4.0" },
    { degree:"M.S. Electrical &amp; Computer Eng.", school:"University of Waterloo — Machine Learning &amp; AI", shortSchool:"Waterloo — ML &amp; AI", date:"2020–2021", gpa:"3.9/4.0" },
    { degree:"B.S. Computer Science", school:"National Central University, Taiwan", shortSchool:"NCU, Taiwan", date:"2016–2020", gpa:"3.8/4.0" }
  ],

  skills: {
    "Languages": ["Python","C/C++","Swift","Java","Kotlin","JavaScript","x86 Assembly","MATLAB"],
    "ML Lifecycle": ["Model Training","Distillation","Quantization &amp; Compression","Inference Engines","On-Device Deployment","Scalable Serving"],
    "On-Device &amp; Web": ["WebGPU","Three.js","Transformers.js","MediaPipe","WebRTC","Local LLMs (Gemma, LFM)"],
    "Domains": ["NLP","Computer Vision","Healthcare","Astronomy","Weather Forecasting","Economics"]
  },

  publications: [
    { title:"Accelerating Inference of Retrieval-Augmented Generation via Sparse Context Selection", venue:"ICLR 2025", note:"Google DeepMind", core:true },
    { title:"Opportunistic Hypertension Detection from Wearable PPG", venue:"medRxiv 2025", note:"Google Health &amp; Fitbit", core:true },
    { title:"Forecasting of Solar Power Generation using Real-time Meteorological Information", venue:"2020", note:"", core:false },
    { title:"A Type IIb Supernova (ZTF18aalrxas)", venue:"ApJL 878:L5", note:"2019", core:true },
    { title:"Real-world WebAssembly Performance for ML", venue:"ACM IMC 2023", note:"", core:true }
  ],

  projects: [
    { name:"AI Mesh", desc:"P2P network of on-device AI agents over WebRTC; each browser tab runs a local LLM + MCP knowledge base and gossips queries across the mesh." },
    { name:"The Match Maker", desc:"Webcam multiplayer game running Gemma 3n fully client-side via WebGPU at ~15 tok/s with MediaPipe face mesh." },
    { name:"Tetris AI in x86 Assembly", desc:"Self-learning heuristic AI in ~2,000 lines of hand-written x86, averaging 50,000 cleared lines." }
  ]
};
