/* ============================================================
   On-device LLM (Gemma 4 E2B) via MediaPipe LiteRT — the same
   approach hoko.xyz uses for its on-device chat:
     • import @mediapipe/tasks-genai genai_bundle.mjs
     • stream the .task weights, caching them in OPFS so the
       multi-GB download only happens once
     • LlmInference.createFromOptions(...).generateResponse(...)
   Everything runs locally on the user's GPU (WebGPU); no resume
   text ever leaves the browser.
   ============================================================ */
window.ResumeLLM = (function () {
  const WASM   = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai@latest/wasm";
  const BUNDLE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai@latest/genai_bundle.mjs";
  const MODEL_URL = "https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/resolve/main/gemma-4-E2B-it-web.task";
  const FILE_NAME = "gemma-4-E2B-it-web.task";

  let llm = null, loadingPromise = null, ready = false;

  function streamWithProgress(input, total, onProgress) {
    let done = 0;
    return input.pipeThrough(new TransformStream({
      transform(chunk, ctrl) {
        done += chunk.byteLength;
        const pct = total > 0 ? Math.min(100, Math.round(done / total * 100)) : 0;
        try { onProgress && onProgress(pct, done, total); } catch (e) {}
        ctrl.enqueue(chunk);
      }
    }));
  }

  // Cache the big .task file in the Origin Private File System.
  async function loadModelWithOpfsCache(url, fileName) {
    try {
      const root = await navigator.storage.getDirectory();
      try {
        const fh = await root.getFileHandle(fileName);
        const file = await fh.getFile();
        const sh = await root.getFileHandle(fileName + "_size");
        const expected = parseInt(await (await sh.getFile()).text(), 10);
        if (Number.isFinite(expected) && file.size === expected) {
          return { stream: file.stream(), size: file.size, cached: true };
        }
        await root.removeEntry(fileName).catch(() => {});
        await root.removeEntry(fileName + "_size").catch(() => {});
      } catch (e) { if (e && e.name !== "NotFoundError") console.warn("[LLM] OPFS read:", e); }

      let expected = 0;
      try { const h = await fetch(url, { method: "HEAD" }); if (h.ok) expected = Number(h.headers.get("Content-Length") || 0); } catch (e) {}
      const res = await fetch(url);
      if (!res.ok || !res.body) throw new Error("Fetch failed: " + res.status + " " + res.statusText);

      const [consumer, cache] = res.body.tee();
      (async () => {
        try {
          const fh = await root.getFileHandle(fileName, { create: true });
          const w = await fh.createWritable();
          const sh = await root.getFileHandle(fileName + "_size", { create: true });
          const sw = await sh.createWritable();
          await sw.write(new TextEncoder().encode(String(expected))); await sw.close();
          await cache.pipeTo(w);
        } catch (e) {
          console.error("[LLM] OPFS cache write failed:", e);
          await root.removeEntry(fileName).catch(() => {});
          await root.removeEntry(fileName + "_size").catch(() => {});
        }
      })();
      return { stream: consumer, size: expected, cached: false };
    } catch (e) {
      console.warn("[LLM] OPFS unavailable, direct fetch:", e);
      const res = await fetch(url);
      if (!res.ok || !res.body) throw new Error("Fetch failed: " + res.status);
      return { stream: res.body, size: Number(res.headers.get("Content-Length") || 0), cached: false };
    }
  }

  async function load(onProgress) {
    if (ready) return true;
    if (loadingPromise) return loadingPromise;
    loadingPromise = (async () => {
      if (!navigator.gpu) throw new Error("WebGPU not supported — use Chrome/Edge 113+.");
      onProgress && onProgress({ phase: "lib", msg: "Loading MediaPipe runtime…" });
      const { FilesetResolver, LlmInference } = await import(BUNDLE);

      onProgress && onProgress({ phase: "fetch", msg: "Fetching Gemma 4 weights (cached after first time)…" });
      const { stream, size, cached } = await loadModelWithOpfsCache(MODEL_URL, FILE_NAME);
      const tracked = streamWithProgress(stream, size, (pct, done, total) => {
        const mb = (b) => (b / 1048576).toFixed(0);
        onProgress && onProgress({ phase: "download", pct, msg: cached
          ? "Loading cached weights… " + pct + "%"
          : "Downloading Gemma 4… " + pct + "% (" + mb(done) + "/" + mb(total) + " MB)" });
      });

      onProgress && onProgress({ phase: "compile", msg: "Compiling model on WebGPU…" });
      const genai = await FilesetResolver.forGenAiTasks(WASM);
      llm = await LlmInference.createFromOptions(genai, {
        baseOptions: { modelAssetBuffer: tracked.getReader() },
        maxTokens: 2048, topK: 40, temperature: 0.6, randomSeed: 42
      });
      ready = true;
      onProgress && onProgress({ phase: "ready", msg: "Gemma 4 ready — running locally on your GPU." });
      return true;
    })().catch((e) => { loadingPromise = null; throw e; });
    return loadingPromise;
  }

  function gemmaPrompt(instruction) {
    return "<start_of_turn>user\n" + instruction + "<end_of_turn>\n<start_of_turn>model\n";
  }

  function clean(t) {
    return (t || "")
      .replace(/<end_of_turn>|<start_of_turn>|<eos>/gi, "")
      .replace(/<\|.*?\|>/g, "")
      .trim();
  }

  // Run one instruction to completion; onToken streams partial text.
  async function generate(instruction, onToken) {
    if (!ready || !llm) throw new Error("Model not loaded.");
    const prompt = gemmaPrompt(instruction);
    return new Promise((resolve, reject) => {
      let full = "";
      try {
        llm.generateResponse(prompt, (partial, done) => {
          if (partial) { full += partial; onToken && onToken(clean(full)); }
          if (done) resolve(clean(full));
        });
      } catch (e) { reject(e); }
    });
  }

  return {
    load,
    generate,
    isReady: () => ready,
    isLoading: () => !!loadingPromise && !ready,
    hasWebGPU: () => !!navigator.gpu
  };
})();
