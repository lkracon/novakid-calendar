// Runs in the Novakid page's own JS world.
// 1. Remembers the parent user ID and the auth headers the page sends to its API
//    (in memory only, never stored or sent anywhere else).
// 2. Forwards the page's own students/classes responses to bridge.js.
// 3. Once the user ID is known, fetches every child's full upcoming schedule and posts it
//    as a snapshot, so cancelled or moved lessons can be detected.
(() => {
  const TAG = "novakid-cal";
  const WANTED = /\/api\/0\/users\/\d+\/(students|classes)\/?(\?|$)/;
  const SNAPSHOT_EVERY_MS = 5 * 60e3;
  const send = (msg) => { try { window.postMessage({ source: TAG, ...msg }, location.origin); } catch (_) {} };

  const origFetch = window.fetch;
  const apiHeaders = {};
  let userId = null;

  function noteRequest(url, headers) {
    url = String(url || "");
    if (!/\/api\/0\//.test(url)) return;
    for (const [k, v] of headers) if (/^(authorization|x-)/i.test(k)) apiHeaders[k] = v;
    const m = /\/api\/0\/users\/(\d+)\//.exec(url);
    if (m && !userId) { userId = m[1]; setTimeout(snapshot, 1500); }
  }

  const headerPairs = (h) => {
    if (!h) return [];
    if (h instanceof Headers) return [...h.entries()];
    if (Array.isArray(h)) return h;
    return Object.entries(h);
  };

  window.fetch = async function (...args) {
    try {
      const [input, init] = args;
      noteRequest(input && input.url ? input.url : input, [...headerPairs(input && input.headers), ...headerPairs(init && init.headers)]);
    } catch (_) {}
    const res = await origFetch.apply(this, args);
    try {
      if (WANTED.test(res.url)) res.clone().json().then((data) => send({ type: "response", url: res.url, data })).catch(() => {});
    } catch (_) {}
    return res;
  };

  const origOpen = XMLHttpRequest.prototype.open;
  const origSend = XMLHttpRequest.prototype.send;
  const origSetHeader = XMLHttpRequest.prototype.setRequestHeader;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this.__nkUrl = url;
    this.__nkHeaders = [];
    return origOpen.call(this, method, url, ...rest);
  };
  XMLHttpRequest.prototype.setRequestHeader = function (k, v) {
    if (this.__nkHeaders) this.__nkHeaders.push([k, v]);
    return origSetHeader.call(this, k, v);
  };
  XMLHttpRequest.prototype.send = function (...args) {
    try { noteRequest(this.__nkUrl, this.__nkHeaders || []); } catch (_) {}
    this.addEventListener("load", () => {
      try {
        const url = String(this.responseURL || this.__nkUrl);
        if (!WANTED.test(url)) return;
        const data = this.responseType === "json" ? this.response : JSON.parse(this.responseText);
        if (data) send({ type: "response", url, data });
      } catch (_) {}
    });
    return origSend.apply(this, args);
  };

  async function getJson(url) {
    const r = await origFetch(url, { credentials: "include", headers: { Accept: "application/json", ...apiHeaders } });
    if (!r.ok) throw new Error(`HTTP ${r.status} for ${new URL(url).pathname}`);
    return r.json();
  }

  async function snapshot() {
    try {
      const last = Number(sessionStorage.getItem("nkCalSnapshot") || 0);
      if (Date.now() - last < SNAPSHOT_EVERY_MS) return;
      sessionStorage.setItem("nkCalSnapshot", String(Date.now()));
    } catch (_) {}
    try {
      const base = `${location.origin}/api/0/users/${userId}`;
      const students = await getJson(`${base}/students/`);
      const kids = (students._embedded && students._embedded.students || []).filter((k) => !k.is_archived);

      const schedules = [];
      for (const kid of kids) {
        const q = new URLSearchParams({ detailed: "true", include_llm_content: "false", limit: "100", order_by: "start_time", student_id: String(kid.id) });
        q.append("status", "ongoing");
        q.append("status", "scheduled");
        let url = `${base}/classes?${q}`;
        const pages = [];
        for (let i = 0; url && i < 20; i++) {             // follow ?offset= pagination
          const data = await getJson(url);
          pages.push(data);
          const next = data && data._links && data._links.next && data._links.next.href;
          url = next && next !== url ? next : null;
        }
        schedules.push({ studentId: String(kid.id), pages });
      }
      send({ type: "snapshot", students, schedules });
    } catch (e) {
      send({ type: "error", message: String(e && e.message || e) });
    }
  }
})();
