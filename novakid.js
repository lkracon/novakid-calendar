// Parsers for Novakid's (unofficial, undocumented) API responses.
// Only the fields the extension needs are kept; everything else is dropped.
const Novakid = (() => {
  const STUDENTS_URL = /\/api\/0\/users\/\d+\/students\/?(\?|$)/;
  const CLASSES_URL = /\/api\/0\/users\/\d+\/classes\/?(\?|$)/;
  const DEFAULT_MINUTES = 25;

  // GET /api/0/users/<parent>/students/ → [{id, name}]
  function students(data) {
    const list = data && data._embedded && data._embedded.students;
    if (!Array.isArray(list)) return null;
    return list.filter((s) => s && s.id != null && !s.is_archived).map((s) => ({ id: String(s.id), name: String(s.name || "") }));
  }

  // GET /api/0/users/<parent>/classes?detailed=true&... → lessons.
  // Returns null when the response doesn't have the expected shape (so callers can tell
  // "no lessons" from "couldn't read").
  function classes(data) {
    const list = data && data._embedded && data._embedded.classes;
    if (!Array.isArray(list)) return null;
    return list.map(lesson).filter(Boolean);
  }

  function lesson(c) {
    if (!c || c.id == null || !c.start_time) return null;
    const start = new Date(c.start_time);
    if (isNaN(start)) return null;
    const minutes = Number(c.duration) > 0 ? Number(c.duration) : DEFAULT_MINUTES;
    const emb = c._embedded || {};
    const status = String(c.status || "");
    return {
      key: "id:" + c.id,
      studentId: String(c.student_id ?? (emb.student && emb.student.id) ?? ""),
      student: (emb.student && emb.student.name) || "",
      start: start.toISOString(),
      end: new Date(start.getTime() + minutes * 60000).toISOString(),
      title: (emb.lesson && emb.lesson.name) || "",
      lessonCode: (emb.lesson && emb.lesson.full_number) || "",
      teacher: (emb.teacher && emb.teacher.name) || "",
      status,
      cancelled: /cancel/i.test(status),
    };
  }

  return { STUDENTS_URL, CLASSES_URL, students, classes };
})();
