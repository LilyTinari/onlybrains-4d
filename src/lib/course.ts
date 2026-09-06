import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";

export type CourseModule = { title: string; lessons: string[] };

export type GeneratedCourse = {
  title: string;
  level: string;
  hours: string;
  mentor: string;
  hook: string;
  modules: CourseModule[];
};

export type SavedCourse = GeneratedCourse & {
  id: number;
  topic: string;
  createdAt: string;
};

const MENTORS = [
  "Lucien",
  "Atlas",
  "Helix",
  "Forge",
  "Meridian",
  "Muse",
  "Synapse",
  "Quanta",
  "Nova",
  "Genome",
  "Terra",
  "Axiom",
] as const;

function clip(s: unknown, n: number) {
  return String(s ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, n);
}

function parseCourse(raw: string, topic: string): GeneratedCourse | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const json = JSON.parse(raw.slice(start, end + 1)) as Partial<GeneratedCourse>;
    const modules = Array.isArray(json.modules)
      ? json.modules
          .slice(0, 5)
          .map((m) => ({
            title: clip((m as CourseModule)?.title, 80) || "Module",
            lessons: Array.isArray((m as CourseModule)?.lessons)
              ? (m as CourseModule).lessons.map((l) => clip(l, 90)).filter(Boolean).slice(0, 4)
              : [],
          }))
          .filter((m) => m.lessons.length > 0)
      : [];
    if (modules.length < 3) return null;
    const mentorRaw = clip(json.mentor, 24);
    const mentor = MENTORS.includes(mentorRaw as (typeof MENTORS)[number])
      ? mentorRaw
      : "Lucien";
    return {
      title: clip(json.title, 80) || `${topic} — a course`,
      level: clip(json.level, 32) || "Calibrated",
      hours: clip(json.hours, 24) || "4–6 hours",
      mentor,
      hook: clip(json.hook, 180) || "Personalized to your cognitive DNA.",
      modules,
    };
  } catch {
    return null;
  }
}

export const generateCourse = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const data = input as { topic?: string };
    const topic = clip(data?.topic, 160);
    if (topic.length < 2) throw new Error("Name a topic.");
    return { topic };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "Course generation is offline in this environment." };
    }

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: 0.6,
        max_tokens: 700,
        messages: [
          {
            role: "system",
            content: `You are Lucien, the digital neural mentor of OnlyBrains — not a person, a cognitive field. Design evidence-based courses using retrieval practice, spaced repetition, and metacognitive calibration. Return ONLY compact JSON with keys: title, level, hours, mentor (one of ${MENTORS.join(", ")}), hook (one sentence), modules (array of 5 objects: title, lessons: array of 3 short lesson names). No markdown.`,
          },
          {
            role: "user",
            content: `Build a course on: ${data.topic}`,
          },
        ],
      }),
    });

    if (!res.ok) {
      return { ok: false as const, error: "Lucien could not build that just now." };
    }

    const body = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = body.choices?.[0]?.message?.content?.trim() ?? "";
    const course = parseCourse(text, data.topic);
    if (!course) {
      return { ok: false as const, error: "The course arrived malformed. Try a clearer topic." };
    }
    return { ok: true as const, topic: data.topic, course };
  });

export const saveCourse = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    const data = input as { topic?: string; course?: GeneratedCourse };
    const topic = clip(data?.topic, 160);
    const course = data?.course;
    if (!topic || !course?.title || !Array.isArray(course.modules)) {
      throw new Error("Nothing to save.");
    }
    return {
      topic,
      course: {
        title: clip(course.title, 80),
        level: clip(course.level, 32),
        hours: clip(course.hours, 24),
        mentor: clip(course.mentor, 24) || "Lucien",
        hook: clip(course.hook, 180),
        modules: course.modules.slice(0, 5).map((m) => ({
          title: clip(m.title, 80),
          lessons: (m.lessons ?? []).map((l) => clip(l, 90)).slice(0, 4),
        })),
      } satisfies GeneratedCourse,
    };
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<{ id: number }>`
      insert into courses (user_id, topic, title, level, hours, mentor, hook, modules)
      values (
        ${context.userId},
        ${data.topic},
        ${data.course.title},
        ${data.course.level},
        ${data.course.hours},
        ${data.course.mentor},
        ${data.course.hook},
        ${JSON.stringify(data.course.modules)}::jsonb
      )
      returning id
    `;
    return { ok: true as const, id: rows[0]?.id ?? 0 };
  });

export const listCourses = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<{
      id: number;
      topic: string;
      title: string;
      level: string;
      hours: string;
      mentor: string;
      hook: string;
      modules: CourseModule[] | string;
      created_at: string;
    }>`
      select id, topic, title, level, hours, mentor, hook, modules, created_at
      from courses
      where user_id = ${context.userId}
      order by created_at desc
      limit 8
    `;
    return rows.map((r) => ({
      id: r.id,
      topic: r.topic,
      title: r.title,
      level: r.level,
      hours: r.hours,
      mentor: r.mentor,
      hook: r.hook,
      modules: typeof r.modules === "string" ? (JSON.parse(r.modules) as CourseModule[]) : r.modules,
      createdAt: r.created_at,
    })) satisfies SavedCourse[];
  });
