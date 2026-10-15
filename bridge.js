// Isolated content script: receives Novakid data from hook.js and keeps the minimal
// lesson/children data in chrome.storage.local (on this device only).
// Messages are handled one at a time so concurrent read-modify-writes don't drop data.
let queue = Promise.resolve();

window.addEventListener("message", (e) => {
  if (e.source !== window || !e.data || e.data.source !== "novakid-cal") return;
  const msg = e.data;
  queue = queue.then(() => handle(msg)).catch(() => {});
});

async function handle(msg) {
  const st = await chrome.storage.local.get(["lessons", "students"]);
  const lessons = st.lessons || {};
  const students = st.students || {};
  const now = Date.now();
  const extra = {};

  const addStudents = (data) => {
    const list = Novakid.students(data);
    if (list) for (const s of list) students[s.id] = s.name;
  };

  if (msg.type === "response") {
    if (Novakid.STUDENTS_URL.test(msg.url)) addStudents(msg.data);
    else if (Novakid.CLASSES_URL.test(msg.url)) for (const l of Novakid.classes(msg.data) || []) lessons[l.key] = l;
  } else if (msg.type === "snapshot") {
    addStudents(msg.students);
    for (const { studentId, pages } of msg.schedules) {
      const parsed = pages.map(Novakid.classes);
      if (parsed.some((p) => p === null)) continue;   // unexpected format → don't touch this child's lessons
      const current = new Set();
      for (const l of parsed.flat()) { lessons[l.key] = l; current.add(l.key); }
      // This is the child's complete list of upcoming lessons: anything we had that's
      // no longer on it was cancelled or moved, so the next sync removes its event.
      for (const l of Object.values(lessons)) {
        if (l.studentId === studentId && !current.has(l.key) && !l.cancelled && new Date(l.start).getTime() > now) {
          lessons[l.key] = { ...l, cancelled: true, status: "removed" };
        }
      }
    }
    extra.lastSnapshot = now;
    extra.lastError = "";
  } else if (msg.type === "error") {
    extra.lastError = msg.message;
  }

  for (const [k, l] of Object.entries(lessons)) {     // forget lessons that ended over a day ago
    if (new Date(l.end).getTime() < now - 864e5) delete lessons[k];
  }
  await chrome.storage.local.set({ lessons, students, ...extra });
}
