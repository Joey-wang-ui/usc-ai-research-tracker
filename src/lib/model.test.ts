import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { createSeed } from "../data/seed";
import {
  applyCommand,
  calendarEvents,
  dashboardStats,
  emptyOpportunity,
  exportCsv,
  parseBackup,
  selectOpportunities,
  uid,
} from "./model";
import { readState, writeState } from "./db";
import { dateSchema, safeUrl, stateSchema, type AppState } from "../types";
let s: AppState;
beforeEach(() => {
  s = createSeed();
});
describe("seed and persistence", () => {
  it("loads exactly 21 documented leads without fabricated dates, salary or requirements", () => {
    expect(stateSchema.safeParse(s).success).toBe(true);
    expect(s.opportunities).toHaveLength(21);
    expect(s.opportunities.map((o) => o.id)).toEqual(
      Array.from(
        { length: 21 },
        (_, i) => `USC-${String(i + 1).padStart(2, "0")}`,
      ),
    );
    expect(
      s.opportunities.every(
        (o) => o.sourceUrl && o.deadline === "" && o.requirements === "",
      ),
    ).toBe(true);
    expect(
      s.opportunities.filter((o) => o.availability === "Needs Verification"),
    ).toHaveLength(19);
    expect(
      s.opportunities.filter(
        (o) => o.availability === "Historical / Potentially Closed",
      ),
    ).toHaveLength(2);
    expect(
      s.opportunities.filter((o) => o.compensation === "Unknown"),
    ).toHaveLength(20);
  });
  it("seeds only once and preserves edits, deletions and cleared data after reload", async () => {
    const initial = await readState();
    expect(initial.opportunities.length).toBe(21);
    initial.opportunities[0].notes = "persistent note";
    await writeState(initial);
    expect((await readState()).opportunities[0].notes).toBe("persistent note");
    const empty = {
      ...s,
      opportunities: [],
      contacts: [],
      tasks: [],
      histories: [],
      activities: [],
    };
    await writeState(empty);
    expect((await readState()).opportunities).toHaveLength(0);
  });
  it("adds and edits an opportunity with persistence", async () => {
    const o = {
      ...emptyOpportunity(),
      name: "Test Agent",
      organization: "Test lab",
    };
    s = applyCommand(s, { type: "saveOpportunity", value: o });
    expect(s.opportunities).toHaveLength(22);
    s = applyCommand(s, {
      type: "saveOpportunity",
      value: { ...o, notes: "edited", priority: "S" },
    });
    await writeState(s);
    const restored = await readState();
    expect(restored.opportunities.find((x) => x.id === o.id)?.notes).toBe(
      "edited",
    );
    expect(restored.opportunities.find((x) => x.id === o.id)?.priority).toBe(
      "S",
    );
  });
});
describe("application workflow", () => {
  it("changes stage and records activity without changing availability", () => {
    const before = s.opportunities[0];
    s = applyCommand(s, { type: "status", id: before.id, status: "Applied" });
    expect(s.opportunities[0].status).toBe("Applied");
    expect(s.opportunities[0].availability).toBe(before.availability);
    expect(s.activities[0].text).toBe("Discovered → Applied");
    expect(dashboardStats(s).submitted).toBe(1);
    expect(before.status).toBe("Discovered");
  });
  it("adds communication and updates linked contact without automatically sending or changing stage", () => {
    const o = s.opportunities[0];
    s = applyCommand(s, {
      type: "addHistory",
      value: {
        id: uid(),
        opportunityId: o.id,
        contactId: o.contactId,
        date: "2026-10-22",
        channel: "Email",
        summary: "Asked about research",
        reply: "Please send CV",
        nextStep: "Prepare CV",
      },
    });
    expect(s.histories).toHaveLength(1);
    expect(s.opportunities[0].nextAction).toBe("Prepare CV");
    expect(s.opportunities[0].lastContactDate).toBe("2026-10-22");
    expect(s.opportunities[0].status).toBe("Discovered");
    expect(s.contacts[0].contacted).toBe(true);
    expect(s.contacts[0].reply).toBe("Please send CV");
  });
  it("does not move last contact backwards when recording older communication", () => {
    s.opportunities[0].lastContactDate = "2026-11-01";
    s = applyCommand(s, {
      type: "addHistory",
      value: {
        id: uid(),
        opportunityId: "USC-01",
        contactId: "",
        date: "2026-10-22",
        channel: "Meeting",
        summary: "Earlier meeting",
        reply: "",
        nextStep: "",
      },
    });
    expect(s.opportunities[0].lastContactDate).toBe("2026-11-01");
  });
  it("adds, completes and deletes a personal task", () => {
    const task = {
      id: uid(),
      title: "Prepare CV",
      opportunityId: "USC-01",
      date: "2026-11-01",
      kind: "Preparation" as const,
      done: false,
      notes: "",
    };
    s = applyCommand(s, { type: "saveTask", value: task });
    s = applyCommand(s, { type: "saveTask", value: { ...task, done: true } });
    expect(s.tasks).toHaveLength(1);
    expect(s.tasks[0].done).toBe(true);
    s = applyCommand(s, { type: "deleteTask", id: task.id });
    expect(s.tasks).toHaveLength(0);
  });
  it("persists checklist changes", async () => {
    const o = structuredClone(s.opportunities[0]);
    o.checklist[0].done = true;
    o.checklist.push({ id: uid(), text: "Custom item", done: false });
    s = applyCommand(s, { type: "saveOpportunity", value: o });
    await writeState(s);
    expect((await readState()).opportunities[0].checklist[0].done).toBe(true);
  });
  it("deletes opportunity and related records while retaining shared contacts", () => {
    s = applyCommand(s, { type: "status", id: "USC-01", status: "Contacted" });
    s.tasks.push({
      id: uid(),
      title: "CV",
      opportunityId: "USC-01",
      date: "2026-11-01",
      kind: "Preparation",
      done: false,
      notes: "",
    });
    s = applyCommand(s, { type: "deleteOpportunity", id: "USC-01" });
    expect(s.opportunities).toHaveLength(20);
    expect(s.activities).toHaveLength(0);
    expect(s.tasks).toHaveLength(0);
    expect(s.contacts.length).toBeGreaterThan(0);
    expect(stateSchema.safeParse(s).success).toBe(true);
  });
  it("supports one professor with multiple opportunities and removes associations safely", () => {
    const c = s.contacts[0];
    expect(s.opportunities.filter((o) => o.contactId === c.id)).toHaveLength(2);
    s = applyCommand(s, { type: "deleteContact", id: c.id });
    expect(s.opportunities.some((o) => o.contactId === c.id)).toBe(false);
    expect(s.opportunities).toHaveLength(21);
  });
});
describe("atomic partial updates", () => {
  it("retains note and stage changes when updating a checklist in sequence", () => {
    const id = s.opportunities[0].id,
      first = s.opportunities[0].checklist[0].id,
      second = s.opportunities[0].checklist[1].id;
    s = applyCommand(s, {
      type: "patchOpportunity",
      id,
      patch: { notes: "Keep this note" },
    });
    s = applyCommand(s, { type: "status", id, status: "Applied" });
    s = applyCommand(s, {
      type: "checklist",
      id,
      action: "update",
      itemId: first,
      done: true,
    });
    s = applyCommand(s, {
      type: "checklist",
      id,
      action: "update",
      itemId: second,
      done: true,
    });
    s = applyCommand(s, {
      type: "checklist",
      id,
      action: "add",
      text: "Read new paper",
    });
    expect(s.opportunities[0].notes).toBe("Keep this note");
    expect(s.opportunities[0].status).toBe("Applied");
    expect(s.opportunities[0].checklist.slice(0, 2).every((x) => x.done)).toBe(
      true,
    );
    expect(s.opportunities[0].checklist.at(-1)?.text).toBe("Read new paper");
    s = applyCommand(s, {
      type: "checklist",
      id,
      action: "delete",
      itemId: first,
    });
    expect(s.opportunities[0].checklist.some((x) => x.id === first)).toBe(
      false,
    );
  });
  it("refuses invalid database writes without altering the existing snapshot", async () => {
    await writeState(s);
    const invalid = structuredClone(s);
    invalid.opportunities[0].sourceUrl = "javascript:alert(1)";
    await expect(writeState(invalid)).rejects.toThrow();
    expect(await readState()).toEqual(s);
  });
});
describe("backup, search and statistics", () => {
  it("round trips every collection and preferences through JSON", () => {
    s.theme = "light";
    s = applyCommand(s, { type: "status", id: "USC-01", status: "Offer" });
    s.tasks.push({
      id: uid(),
      title: "CV",
      opportunityId: "USC-01",
      date: "2026-11-01",
      kind: "Preparation",
      done: true,
      notes: "task notes",
    });
    s.histories.push({
      id: uid(),
      opportunityId: "USC-01",
      contactId: s.contacts[0].id,
      date: "2026-10-22",
      channel: "Email",
      summary: "summary",
      reply: "reply",
      nextStep: "CV",
    });
    expect(parseBackup(JSON.stringify(s))).toEqual(s);
  });
  it.each(["not json", "{}", '{"schemaVersion":99}'])(
    "rejects malformed backups without modifying current data: %s",
    (raw) => {
      const before = JSON.stringify(s);
      expect(() => parseBackup(raw)).toThrow();
      expect(JSON.stringify(s)).toBe(before);
    },
  );
  it("rejects duplicate IDs, invalid URLs and dangling references", () => {
    const duplicate = structuredClone(s);
    duplicate.opportunities.push(duplicate.opportunities[0]);
    expect(() => parseBackup(JSON.stringify(duplicate))).toThrow();
    s.opportunities[0].sourceUrl = "javascript:alert(1)";
    expect(() => parseBackup(JSON.stringify(s))).toThrow();
    s = createSeed();
    s.opportunities[0].contactId = "missing";
    expect(() => parseBackup(JSON.stringify(s))).toThrow();
  });
  it("exports escaped CSV with BOM and prevents formula execution", () => {
    s.opportunities[0].notes = '=HYPERLINK("bad")';
    const csv = exportCsv(s);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain('"\'=HYPERLINK(""bad"")"');
    expect(csv).toContain('"availability"');
  });
  it("searches professors, lab names, areas and notes; filters and sorts by multiple fields", () => {
    expect(selectOpportunities(s, { query: "Penkova" })).toHaveLength(2);
    expect(selectOpportunities(s, { query: "FORTIS" })).toHaveLength(1);
    expect(
      selectOpportunities(s, { area: "AI Agent", priority: "S" }),
    ).toHaveLength(2);
    expect(selectOpportunities(s, { compensation: "Unpaid" })).toHaveLength(1);
    expect(selectOpportunities(s, { verification: "yes" })).toHaveLength(19);
    expect(selectOpportunities(s, { status: "Applied" })).toHaveLength(0);
    expect(
      selectOpportunities(s, { sort: "priority", secondarySort: "name" })[0]
        .priority,
    ).toBe("S");
  });
  it("computes dashboard totals from active data and only official upcoming dates", () => {
    expect(dashboardStats(s, "2026-10-22")).toEqual({
      total: 21,
      high: 12,
      submitted: 0,
      awaiting: 0,
      deadlines: 0,
      offers: 0,
    });
    s.opportunities[0].status = "Applied";
    s.opportunities[0].deadline = "2026-11-01";
    s.opportunities[1].targetDate = "2026-11-02";
    s.opportunities[2].status = "Offer";
    s.opportunities[3].archived = true;
    expect(dashboardStats(s, "2026-10-22")).toEqual({
      total: 20,
      high: 11,
      submitted: 2,
      awaiting: 1,
      deadlines: 1,
      offers: 1,
    });
  });
  it("distinguishes official deadlines and personal target dates without fabricating events", () => {
    expect(calendarEvents(s)).toHaveLength(0);
    s.opportunities[0].targetDate = "2028-12-01";
    s.opportunities[1].deadline = "2029-01-01";
    const events = calendarEvents(s);
    expect(events.map((e) => e.kind)).toEqual([
      "Target Date",
      "Official Deadline",
    ]);
  });
  it("validates calendar dates and safe protocols", () => {
    expect(dateSchema.safeParse("2026-02-30").success).toBe(false);
    expect(dateSchema.safeParse("2028-02-29").success).toBe(true);
    expect(safeUrl("javascript:alert(1)")).toBe("");
    expect(safeUrl("https://usc.edu")).toBe("https://usc.edu/");
  });
});
