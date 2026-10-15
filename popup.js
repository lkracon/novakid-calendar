const API = "https://www.googleapis.com/calendar/v3";
const SCHEDULE_URL = "https://school.novakidschool.com/parent/schedule";
// Names Google (and users) give the shared family calendar in common languages.
const FAMILY = /famil|rodzin|aile|famiglia|gezin|perhe|семья|сім'я|сем'я|οικογένεια/i;

const $ = (id) => document.getElementById(id);
const t = (key, ...subs) => chrome.i18n.getMessage(key, subs.map(String)) || key;
const status = (msg) => ($("status").textContent = msg);
let token = null;
let students = {};   // studentId → name (from Novakid)

for (const el of document.querySelectorAll("[data-i18n]")) el.textContent = t(el.dataset.i18n);

const fmt = (iso) => new Date(iso).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

async function loadLessons() {
  const { lessons = {} } = await chrome.storage.local.get("lessons");
  const now = Date.now();
  return Object.values(lessons)
    .filter((l) => new Date(l.end).getTime() > now)
    .sort((a, b) => a.start.localeCompare(b.start));
}

const student = (l) => students[l.studentId] || l.student || "";

function summary(l) {
  return "Novakid" + (student(l) ? ` – ${student(l)}` : "") + (l.title ? `: ${l.title}` : "");
}

function details(l) {
  return [
    student(l) && `${t("evStudent")}: ${student(l)}`,
    l.lessonCode && `${t("evLesson")}: ${l.lessonCode}`,
    l.teacher && `${t("evTeacher")}: ${l.teacher}`,
  ].filter(Boolean);
}

async function render() {
  const st = await chrome.storage.local.get(["students", "lastSnapshot", "lastError"]);
  students = st.students || {};
  $("hint").textContent = st.lastSnapshot ? t("lastRead", fmt(new Date(st.lastSnapshot).toISOString())) : t("hintOpen");
  $("error").textContent = st.lastError ? t("lastError", st.lastError) : "";

  const lessons = await loadLessons();
  const ul = $("list");
  ul.textContent = "";
  if (!lessons.length) {
    const li = document.createElement("li");
    li.className = "muted";
    li.textContent = t("noLessons");
    ul.appendChild(li);
    return;
  }
  for (const l of lessons) {
    const li = document.createElement("li");
    if (l.cancelled) li.className = "cancelled";
    li.innerHTML = '<input type="checkbox"><div><b></b><br><span class="muted"></span></div>';
    const box = li.querySelector("input");
    box.dataset.key = l.key;
    box.checked = !l.cancelled;
    box.disabled = l.cancelled;
    li.querySelector("b").textContent = fmt(l.start);
    li.querySelector("span").textContent = [summary(l), l.teacher, l.cancelled && t("cancelled")].filter(Boolean).join(" · ");
    ul.appendChild(li);
  }
}

// Checked lessons, plus cancelled ones (so their events get removed).
async function selectedLessons() {
  const keys = new Set([...document.querySelectorAll("#list input:checked")].map((c) => c.dataset.key));
  return (await loadLessons()).filter((l) => keys.has(l.key) || l.cancelled);
}

// Deterministic Google event id (base32hex charset: 0-9a-v) so re-syncing updates instead of duplicating.
async function eventId(l) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("novakid|" + l.key));
  return "nk" + [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 40);
}

async function gapi(method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) {
    await chrome.identity.removeCachedAuthToken({ token });
    throw new Error(t("sessionExpired"));
  }
  return res;
}

async function connect() {
  try {
    ({ token } = await chrome.identity.getAuthToken({ interactive: true }));
    const res = await gapi("GET", "/users/me/calendarList?minAccessRole=writer");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { items = [] } = await res.json();
    const { calendarId: saved } = await chrome.storage.local.get("calendarId");
    const name = (c) => c.summaryOverride || c.summary;
    const sel = $("calendar");
    sel.textContent = "";
    for (const c of items) sel.add(new Option(name(c), c.id));
    const family = items.find((c) => FAMILY.test(name(c)));
    sel.value = (saved && items.some((c) => c.id === saved) && saved) || (family && family.id) || "primary";
    sel.disabled = false;
    $("sync").disabled = false;
    $("connect").textContent = t("connected");
    status(family ? "" : t("noFamily"));
  } catch (e) {
    status(t("connectFailed", e.message || e));
  }
}

async function sync() {
  const cal = encodeURIComponent($("calendar").value);
  await chrome.storage.local.set({ calendarId: $("calendar").value });
  const lessons = await selectedLessons();
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  let added = 0, updated = 0, removed = 0;
  const failed = [];
  $("sync").disabled = true;
  for (const l of lessons) {
    const id = await eventId(l);
    try {
      if (l.cancelled) {
        const r = await gapi("DELETE", `/calendars/${cal}/events/${id}`);
        if (r.ok) removed++;                              // 404/410: was never synced or already gone
        continue;
      }
      const ev = {
        id,
        status: "confirmed",
        summary: summary(l),
        description: [...details(l), SCHEDULE_URL].join("\n"),
        start: { dateTime: l.start, timeZone: tz },
        end: { dateTime: l.end, timeZone: tz },
        source: { title: "Novakid", url: SCHEDULE_URL },
      };
      let r = await gapi("POST", `/calendars/${cal}/events`, ev);
      if (r.status === 409) {                             // already exists → update it
        r = await gapi("PUT", `/calendars/${cal}/events/${id}`, ev);
        if (r.ok) updated++;
      } else if (r.ok) added++;
      if (!r.ok) failed.push(`${fmt(l.start)}: HTTP ${r.status}`);
    } catch (e) {
      failed.push(`${fmt(l.start)}: ${e.message}`);
      if (e.message === t("sessionExpired")) break;
    }
  }
  $("sync").disabled = false;
  status(t("syncResult", added, updated, removed) + (failed.length ? `\n${t("failed")}\n${failed.join("\n")}` : ""));
}

async function downloadIcs() {
  const lessons = (await selectedLessons()).filter((l) => !l.cancelled);
  const stamp = (iso) => iso.replace(/[-:]/g, "").replace(/\.\d+/, "");
  const esc = (s) => String(s).replace(/[\;,]/g, (c) => "\\" + c).replace(/\n/g, "\\n");
  const now = stamp(new Date().toISOString());
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//novakid-calendar//EN", "CALSCALE:GREGORIAN"];
  for (const l of lessons) {
    lines.push("BEGIN:VEVENT", `UID:${await eventId(l)}@novakid-calendar`, `DTSTAMP:${now}`,
      `DTSTART:${stamp(l.start)}`, `DTEND:${stamp(l.end)}`, `SUMMARY:${esc(summary(l))}`,
      `DESCRIPTION:${esc([...details(l), SCHEDULE_URL].join("\n"))}`, "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/calendar" }));
  a.download = "novakid-schedule.ics";
  a.click();
  status(t("icsDone", lessons.length));
}

async function forget() {
  await chrome.storage.local.clear();
  try { await chrome.identity.clearAllCachedAuthTokens(); } catch (_) {}
  token = null;
  $("connect").textContent = t("connect");
  $("calendar").disabled = $("sync").disabled = true;
  await render();
  status(t("forgotten"));
}

$("connect").onclick = connect;
$("sync").onclick = sync;
$("ics").onclick = downloadIcs;
$("forget").onclick = forget;
render();
