import {
  stateSchema,
  type AppState,
  type Opportunity,
  type Stage,
  type Task,
  type Contact,
  type ContactHistory,
  PRIORITIES,
} from "../types";
import { dayOffset, today } from "./dates";
export const uid = () => crypto.randomUUID();
export function emptyOpportunity(): Opportunity {
  const now = new Date().toISOString();
  return {
    id: uid(),
    name: "",
    organization: "",
    contactId: "",
    areas: [],
    type: "Research Opportunity",
    priority: "B",
    status: "Discovered",
    availability: "Needs Verification",
    compensation: "Unknown",
    workMode: "Unknown",
    postingDate: "",
    deadline: "",
    targetDate: "",
    lastContactDate: "",
    followUpDate: "",
    requirements: "",
    sourceUrl: "",
    contactEmail: "",
    description: "",
    qualifications: "",
    researchFit: "",
    notes: "",
    nextAction: "",
    checklist: [
      "Read Research Papers",
      "Prepare CV",
      "Update GitHub",
      "Prepare Project Demo",
      "Write Inquiry Email",
      "Submit Application",
      "Follow Up",
    ].map((text) => ({ id: uid(), text, done: false })),
    archived: false,
    createdAt: now,
    updatedAt: now,
  };
}
export function emptyContact(): Contact {
  return {
    id: uid(),
    name: "",
    lab: "",
    areas: "",
    email: "",
    homepage: "",
    contacted: false,
    lastContactDate: "",
    followUpDate: "",
    reply: "",
    notes: "",
  };
}
export type Command =
  | { type: "saveOpportunity"; value: Opportunity }
  | {
      type: "patchOpportunity";
      id: string;
      patch: Partial<Omit<Opportunity, "id" | "createdAt" | "updatedAt">>;
    }
  | {
      type: "checklist";
      id: string;
      action: "add" | "update" | "delete";
      itemId?: string;
      text?: string;
      done?: boolean;
    }
  | { type: "status"; id: string; status: Stage }
  | { type: "deleteOpportunity"; id: string }
  | { type: "saveContact"; value: Contact }
  | { type: "deleteContact"; id: string }
  | { type: "saveTask"; value: Task }
  | { type: "deleteTask"; id: string }
  | { type: "addHistory"; value: ContactHistory }
  | { type: "theme"; value: "light" | "dark" }
  | { type: "replace"; value: AppState };
function upsert<T extends { id: string }>(rows: T[], value: T) {
  return rows.some((x) => x.id === value.id)
    ? rows.map((x) => (x.id === value.id ? value : x))
    : [...rows, value];
}
export function applyCommand(state: AppState, command: Command): AppState {
  let next = structuredClone(state);
  const now = new Date().toISOString();
  function log(id: string, text: string) {
    next.activities.push({ id: uid(), opportunityId: id, at: now, text });
  }
  switch (command.type) {
    case "saveOpportunity": {
      const old = next.opportunities.find((x) => x.id === command.value.id);
      next.opportunities = upsert(next.opportunities, {
        ...command.value,
        updatedAt: now,
      });
      if (!old)
        log(command.value.id, `添加了研究机会 · ${command.value.status}`);
      else if (old.status !== command.value.status)
        log(old.id, `${old.status} → ${command.value.status}`);
      else log(old.id, "更新了机会信息");
      break;
    }
    case "patchOpportunity": {
      const o = state.opportunities.find((x) => x.id === command.id);
      if (!o) throw Error("机会不存在");
      return applyCommand(state, {
        type: "saveOpportunity",
        value: { ...o, ...command.patch },
      });
    }
    case "checklist": {
      const o = next.opportunities.find((x) => x.id === command.id);
      if (!o) throw Error("机会不存在");
      if (command.action === "add") {
        o.checklist.push({ id: uid(), text: command.text || "", done: false });
      } else if (command.action === "delete") {
        o.checklist = o.checklist.filter((c) => c.id !== command.itemId);
      } else {
        const c = o.checklist.find((c) => c.id === command.itemId);
        if (!c) throw Error("清单条目不存在");
        if (command.text !== undefined) c.text = command.text;
        if (command.done !== undefined) c.done = command.done;
      }
      o.updatedAt = now;
      log(o.id, "更新了申请清单");
      break;
    }
    case "status": {
      const o = next.opportunities.find((x) => x.id === command.id);
      if (!o) throw Error("机会不存在");
      if (o.status !== command.status) {
        log(o.id, `${o.status} → ${command.status}`);
        o.status = command.status;
        o.updatedAt = now;
      }
      break;
    }
    case "deleteOpportunity":
      next.opportunities = next.opportunities.filter(
        (x) => x.id !== command.id,
      );
      next.tasks = next.tasks.filter((x) => x.opportunityId !== command.id);
      next.histories = next.histories.filter(
        (x) => x.opportunityId !== command.id,
      );
      next.activities = next.activities.filter(
        (x) => x.opportunityId !== command.id,
      );
      break;
    case "saveContact":
      next.contacts = upsert(next.contacts, command.value);
      break;
    case "deleteContact":
      next.contacts = next.contacts.filter((x) => x.id !== command.id);
      next.opportunities.forEach((o) => {
        if (o.contactId === command.id) o.contactId = "";
      });
      next.histories.forEach((h) => {
        if (h.contactId === command.id) h.contactId = "";
      });
      break;
    case "saveTask":
      next.tasks = upsert(next.tasks, command.value);
      break;
    case "deleteTask":
      next.tasks = next.tasks.filter((x) => x.id !== command.id);
      break;
    case "addHistory": {
      const h = command.value;
      next.histories.push(h);
      const o = next.opportunities.find((x) => x.id === h.opportunityId);
      if (!o) throw Error("机会不存在");
      o.lastContactDate = [o.lastContactDate, h.date].sort().at(-1)!;
      o.updatedAt = now;
      if (h.nextStep) o.nextAction = h.nextStep;
      const c = next.contacts.find((c) => c.id === h.contactId);
      if (c) {
        c.contacted = true;
        c.lastContactDate = [c.lastContactDate, h.date].sort().at(-1)!;
        if (h.reply) c.reply = h.reply;
      }
      log(o.id, `记录沟通 · ${h.channel}`);
      break;
    }
    case "theme":
      next.theme = command.value;
      break;
    case "replace":
      next = command.value;
      break;
  }
  return stateSchema.parse(next);
}
export interface Filters {
  query?: string;
  area?: string;
  priority?: string;
  status?: string;
  type?: string;
  compensation?: string;
  verification?: string;
  archived?: boolean;
  sort?: string;
  secondarySort?: string;
}
export function selectOpportunities(state: AppState, f: Filters = {}) {
  const q = (f.query || "").toLowerCase().trim();
  const rows = state.opportunities
    .filter((o) => o.archived === !!f.archived)
    .filter((o) => {
      const c = state.contacts.find((c) => c.id === o.contactId);
      return (
        (!q ||
          [
            o.id,
            o.name,
            o.organization,
            c?.name,
            o.contactEmail,
            o.notes,
            o.requirements,
            ...o.areas,
          ]
            .join(" ")
            .toLowerCase()
            .includes(q)) &&
        (!f.area || o.areas.includes(f.area)) &&
        (!f.priority || o.priority === f.priority) &&
        (!f.status || o.status === f.status) &&
        (!f.type || o.type === f.type) &&
        (!f.compensation || o.compensation === f.compensation) &&
        (!f.verification ||
          (f.verification === "yes"
            ? o.availability === "Needs Verification"
            : o.availability !== "Needs Verification"))
      );
    });
  function compare(a: Opportunity, b: Opportunity, key: string) {
    if (key === "priority")
      return PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority);
    if (key === "deadline" || key === "targetDate")
      return (a[key] || "9999").localeCompare(b[key] || "9999");
    if (key === "updatedAt") return b.updatedAt.localeCompare(a.updatedAt);
    return a.name.localeCompare(b.name);
  }
  return rows.sort(
    (a, b) =>
      compare(a, b, f.sort || "priority") ||
      compare(a, b, f.secondarySort || "name") ||
      a.id.localeCompare(b.id),
  );
}
export function dashboardStats(s: AppState, date = today()) {
  const ops = s.opportunities.filter((o) => !o.archived);
  return {
    total: ops.length,
    high: ops.filter((o) => ["S", "A"].includes(o.priority)).length,
    submitted: ops.filter((o) =>
      ["Applied", "Interviewing", "Offer"].includes(o.status),
    ).length,
    awaiting: ops.filter((o) => ["Contacted", "Applied"].includes(o.status))
      .length,
    deadlines: ops.filter(
      (o) =>
        o.deadline && o.deadline >= date && o.deadline <= dayOffset(date, 30),
    ).length,
    offers: ops.filter((o) => o.status === "Offer").length,
  };
}
export interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  kind: string;
  opportunityId: string;
  done: boolean;
  task?: Task;
}
export function calendarEvents(s: AppState): CalendarEvent[] {
  const events: CalendarEvent[] = s.tasks.map((t) => ({
    id: t.id,
    date: t.date,
    title: t.title,
    kind: t.kind,
    opportunityId: t.opportunityId,
    done: t.done,
    task: t,
  }));
  for (const o of s.opportunities.filter((o) => !o.archived))
    for (const [field, kind] of [
      ["deadline", "Official Deadline"],
      ["targetDate", "Target Date"],
      ["followUpDate", "Follow-up"],
    ] as const)
      if (o[field])
        events.push({
          id: `${o.id}-${field}`,
          date: o[field],
          title: o.name,
          kind,
          opportunityId: o.id,
          done: false,
        });
  for (const c of s.contacts)
    if (c.followUpDate)
      events.push({
        id: `${c.id}-followup`,
        date: c.followUpDate,
        title: `跟进 ${c.name}`,
        kind: "CRM Follow-up",
        opportunityId: "",
        done: false,
      });
  return events.sort((a, b) => a.date.localeCompare(b.date));
}
export function parseBackup(raw: string): AppState {
  if (raw.length > 15_000_000) throw Error("备份超过 15 MB");
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    throw Error("文件不是有效 JSON");
  }
  const r = stateSchema.safeParse(value);
  if (!r.success)
    throw Error(
      `备份结构无效：${r.error.issues
        .slice(0, 3)
        .map((i) => `${i.path.join(".")} ${i.message}`)
        .join("；")}`,
    );
  return r.data;
}
export function exportCsv(s: AppState) {
  const fields: (keyof Opportunity)[] = [
    "id",
    "name",
    "organization",
    "contactId",
    "areas",
    "type",
    "priority",
    "status",
    "availability",
    "compensation",
    "workMode",
    "postingDate",
    "deadline",
    "targetDate",
    "lastContactDate",
    "followUpDate",
    "requirements",
    "sourceUrl",
    "contactEmail",
    "description",
    "qualifications",
    "researchFit",
    "notes",
    "nextAction",
    "archived",
  ];
  const cell = (v: unknown) => {
    let t = Array.isArray(v) ? v.join("; ") : String(v ?? "");
    if (/^[\s]*[=+@-]/.test(t)) t = "'" + t;
    return '"' + t.replaceAll('"', '""') + '"';
  };
  return (
    "\uFEFF" +
    [
      [...fields, "professorContact"].map(cell).join(","),
      ...s.opportunities.map((o) =>
        [
          ...fields.map((k) => cell(o[k])),
          cell(s.contacts.find((c) => c.id === o.contactId)?.name || ""),
        ].join(","),
      ),
    ].join("\r\n")
  );
}
