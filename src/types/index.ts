import { z } from "zod";
export const STAGES = [
  "Discovered",
  "Researching",
  "Preparing",
  "Contacted",
  "Applied",
  "Interviewing",
  "Offer",
  "Closed",
] as const;
export const STAGE_LABELS: Record<Stage, string> = {
  Discovered: "已发现",
  Researching: "了解中",
  Preparing: "准备申请",
  Contacted: "已联系",
  Applied: "已申请",
  Interviewing: "面试中",
  Offer: "获得机会",
  Closed: "结束 / 放弃",
};
export const PRIORITIES = ["S", "A", "B", "C"] as const;
export const AVAILABILITIES = [
  "Needs Verification",
  "Historical / Potentially Closed",
  "Open",
  "Closed",
  "Unknown",
] as const;
export const AVAILABILITY_LABELS: Record<string, string> = {
  "Needs Verification": "待核实",
  "Historical / Potentially Closed": "历史线索 · 可能已关闭",
  Open: "已核实开放",
  Closed: "已核实关闭",
  Unknown: "未知",
};
export const TASK_KINDS = [
  "Preparation",
  "Planned Contact",
  "Follow-up",
  "Interview",
] as const;
export const TASK_LABELS: Record<string, string> = {
  Preparation: "个人准备",
  "Planned Contact": "计划联系",
  "Follow-up": "后续跟进",
  Interview: "面试",
};
const txt = z.string().max(50000);
const short = z.string().max(500);
const required = short.trim().min(1, "此项不能为空");
const id = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[A-Za-z0-9_-]+$/, "ID 仅支持字母、数字、下划线和连字符");
export const dateSchema = z
  .string()
  .refine(
    (s) =>
      s === "" ||
      (/^\d{4}-\d{2}-\d{2}$/.test(s) &&
        !Number.isNaN(Date.parse(s)) &&
        new Date(s).toISOString().slice(0, 10) === s),
    "请输入有效日期",
  );
const email = z.union([z.literal(""), z.email().max(320)]);
export function safeUrl(url: string) {
  try {
    const u = new URL(url);
    return ["http:", "https:"].includes(u.protocol) ? u.href : "";
  } catch {
    return "";
  }
}
const url = short.refine(
  (s) => s === "" || !!safeUrl(s),
  "仅支持 http / https URL",
);
const timestamp = z.iso.datetime();
export const checklistSchema = z
  .object({ id, text: required, done: z.boolean() })
  .strict();
export const opportunitySchema = z
  .object({
    id,
    name: required,
    organization: required,
    contactId: z.string().max(100),
    areas: z.array(required).max(100),
    type: required,
    priority: z.enum(PRIORITIES),
    status: z.enum(STAGES),
    availability: z.enum(AVAILABILITIES),
    compensation: z.enum(["Paid", "Unpaid", "Unknown"]),
    workMode: z.enum(["On-site", "Remote", "Hybrid", "Unknown"]),
    postingDate: dateSchema,
    deadline: dateSchema,
    targetDate: dateSchema,
    lastContactDate: dateSchema,
    followUpDate: dateSchema,
    requirements: txt,
    sourceUrl: url,
    contactEmail: email,
    description: txt,
    qualifications: txt,
    researchFit: txt,
    notes: txt,
    nextAction: txt,
    checklist: z.array(checklistSchema).max(500),
    archived: z.boolean(),
    createdAt: timestamp,
    updatedAt: timestamp,
  })
  .strict();
export const contactSchema = z
  .object({
    id,
    name: required,
    lab: short,
    areas: short,
    email,
    homepage: url,
    contacted: z.boolean(),
    lastContactDate: dateSchema,
    followUpDate: dateSchema,
    reply: txt,
    notes: txt,
  })
  .strict();
export const historySchema = z
  .object({
    id,
    opportunityId: id,
    contactId: z.string().max(100),
    date: dateSchema.refine((s) => !!s, "联系日期不能为空"),
    channel: required,
    summary: required,
    reply: txt,
    nextStep: txt,
  })
  .strict();
export const taskSchema = z
  .object({
    id,
    title: required,
    opportunityId: z.string().max(100),
    date: dateSchema.refine((s) => !!s, "任务日期不能为空"),
    kind: z.enum(TASK_KINDS),
    done: z.boolean(),
    notes: txt,
  })
  .strict();
export const activitySchema = z
  .object({ id, opportunityId: id, at: timestamp, text: txt })
  .strict();
export const stateSchema = z
  .object({
    schemaVersion: z.literal(1),
    opportunities: z.array(opportunitySchema).max(10000),
    contacts: z.array(contactSchema).max(10000),
    tasks: z.array(taskSchema).max(20000),
    histories: z.array(historySchema).max(30000),
    activities: z.array(activitySchema).max(50000),
    theme: z.enum(["dark", "light"]),
  })
  .strict()
  .superRefine((data, ctx) => {
    const collections = [
      data.opportunities,
      data.contacts,
      data.tasks,
      data.histories,
      data.activities,
    ];
    for (const entries of collections)
      if (new Set(entries.map((x) => x.id)).size !== entries.length)
        ctx.addIssue({ code: "custom", message: "备份中存在重复 ID" });
    const ops = new Set(data.opportunities.map((o) => o.id)),
      contacts = new Set(data.contacts.map((c) => c.id));
    for (const o of data.opportunities) {
      if (o.contactId && !contacts.has(o.contactId))
        ctx.addIssue({ code: "custom", message: "机会关联的联系人不存在" });
      if (new Set(o.checklist.map((c) => c.id)).size !== o.checklist.length)
        ctx.addIssue({ code: "custom", message: "清单 ID 重复" });
    }
    for (const row of [...data.histories, ...data.tasks, ...data.activities])
      if (row.opportunityId && !ops.has(row.opportunityId))
        ctx.addIssue({ code: "custom", message: "关联的机会不存在" });
    for (const h of data.histories)
      if (h.contactId && !contacts.has(h.contactId))
        ctx.addIssue({ code: "custom", message: "沟通记录联系人不存在" });
  });
export type Stage = (typeof STAGES)[number];
export type Opportunity = z.infer<typeof opportunitySchema>;
export type Contact = z.infer<typeof contactSchema>;
export type ContactHistory = z.infer<typeof historySchema>;
export type Task = z.infer<typeof taskSchema>;
export type AppState = z.infer<typeof stateSchema>;
