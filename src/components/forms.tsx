import { useState, type FormEvent } from "react";
import { useStore } from "../lib/store";
import { emptyContact, emptyOpportunity, uid } from "../lib/model";
import { today } from "../lib/dates";
import {
  opportunitySchema,
  contactSchema,
  taskSchema,
  historySchema,
  PRIORITIES,
  STAGES,
  STAGE_LABELS,
  AVAILABILITIES,
  AVAILABILITY_LABELS,
  TASK_KINDS,
  TASK_LABELS,
  type Opportunity,
  type Contact,
  type Task,
} from "../types";
import { Field, FormError, Modal } from "./ui";
function formValues(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();
  return new FormData(e.currentTarget);
}
const value = (f: FormData, key: string) => String(f.get(key) || "").trim();
const err = (e: unknown) => (e instanceof Error ? e.message : String(e));
export function OpportunityEditor({
  opportunity,
  onClose,
}: {
  opportunity?: Opportunity;
  onClose: () => void;
}) {
  const { state, run, busy } = useStore();
  const [o] = useState(() => opportunity || emptyOpportunity()),
    [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    const f = formValues(e);
    try {
      const keys = [
        "name",
        "organization",
        "contactId",
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
      ];
      const fields = Object.fromEntries(keys.map((k) => [k, value(f, k)]));
      const result = opportunitySchema.safeParse({
        ...o,
        ...fields,
        areas: value(f, "areas")
          .split(/[,，]/)
          .map((x) => x.trim())
          .filter(Boolean),
      });
      if (!result.success) {
        setError(
          result.error.issues
            .map((x) => `${x.path.join(".")}: ${x.message}`)
            .join("；"),
        );
        return;
      }
      if (await run({ type: "saveOpportunity", value: result.data })) onClose();
    } catch (e) {
      setError(err(e));
    }
  }
  return (
    <Modal
      title={opportunity ? "编辑研究机会" : "添加研究机会"}
      onClose={onClose}
      wide
    >
      <form onSubmit={submit}>
        <div className="modal-body form-grid">
          <div className="form-section">
            基本信息 <small>已核实的信息才填入事实字段</small>
          </div>
          <Field label="Opportunity Name *" className="span-2">
            <input
              name="name"
              defaultValue={o.name}
              required
              maxLength={500}
              placeholder="研究机会或项目名称"
            />
          </Field>
          <Field label="Organization / Lab *">
            <input name="organization" defaultValue={o.organization} required />
          </Field>
          <Field label="Opportunity Type *">
            <input
              name="type"
              list="opportunity-types"
              defaultValue={o.type}
              required
            />
            <datalist id="opportunity-types">
              {Array.from(new Set(state.opportunities.map((o) => o.type))).map(
                (t) => (
                  <option key={t} value={t} />
                ),
              )}
            </datalist>
          </Field>
          <Field label="研究方向 · 用逗号分隔" className="span-2">
            <input
              name="areas"
              defaultValue={o.areas.join(", ")}
              placeholder="AI Agent, LLM, RAG"
            />
          </Field>
          <Field label="关联导师 / 联系人">
            <select name="contactId" defaultValue={o.contactId}>
              <option value="">尚未关联 · 可在 CRM 中添加</option>
              {state.contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Contact Email">
            <input
              type="email"
              name="contactEmail"
              defaultValue={o.contactEmail}
            />
          </Field>
          <Field label="Priority">
            <select name="priority" defaultValue={o.priority}>
              {PRIORITIES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </Field>
          <Field label="我的申请阶段">
            <select name="status" defaultValue={o.status}>
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABELS[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="岗位开放状态 · 独立于申请进度">
            <select name="availability" defaultValue={o.availability}>
              {AVAILABILITIES.map((s) => (
                <option key={s} value={s}>
                  {AVAILABILITY_LABELS[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Compensation">
            <select name="compensation" defaultValue={o.compensation}>
              {["Unknown", "Paid", "Unpaid"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </Field>
          <Field label="Work Mode">
            <select name="workMode" defaultValue={o.workMode}>
              {["Unknown", "On-site", "Remote", "Hybrid"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </Field>
          <Field label="Source / Official URL">
            <input
              type="url"
              name="sourceUrl"
              defaultValue={o.sourceUrl}
              placeholder="https://"
            />
          </Field>
          <div className="form-section">
            重要日期 <small>未知请留空；个人目标日期不是官方截止日期</small>
          </div>
          {(
            [
              ["postingDate", "发布日期"],
              ["deadline", "官方截止日期"],
              ["targetDate", "个人目标日期"],
              ["lastContactDate", "最近联系日期"],
              ["followUpDate", "下次跟进日期"],
            ] as const
          ).map(([key, label]) => (
            <Field key={key} label={label}>
              <input type="date" name={key} defaultValue={o[key]} />
            </Field>
          ))}
          <div className="form-section">研究与申请</div>
          {(
            [
              ["description", "岗位描述"],
              ["qualifications", "资格条件 · 未知请留空"],
              ["requirements", "Technical Requirements · 已知技能要求"],
              ["researchFit", "Research Fit · 我的匹配分析"],
              ["nextAction", "下一步行动"],
              ["notes", "个人备注"],
            ] as const
          ).map(([key, label]) => (
            <Field key={key} label={label} className="span-2">
              <textarea name={key} defaultValue={o[key]} rows={2} />
            </Field>
          ))}
          <FormError error={error} />
        </div>
        <div className="modal-footer">
          <button type="button" className="button" onClick={onClose}>
            取消
          </button>
          <button className="button primary" disabled={busy}>
            保存机会
          </button>
        </div>
      </form>
    </Modal>
  );
}
export function ContactEditor({
  contact,
  onClose,
}: {
  contact?: Contact;
  onClose: () => void;
}) {
  const { state, run, busy } = useStore(),
    [c] = useState(() => contact || emptyContact()),
    [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    const f = formValues(e);
    const result = contactSchema.safeParse({
      ...c,
      ...Object.fromEntries(
        [
          "name",
          "lab",
          "areas",
          "email",
          "homepage",
          "lastContactDate",
          "followUpDate",
          "reply",
          "notes",
        ].map((k) => [k, value(f, k)]),
      ),
      contacted: f.has("contacted"),
    });
    if (!result.success) {
      setError(
        result.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("；"),
      );
      return;
    }
    if (await run({ type: "saveContact", value: result.data })) {
      const selected = f.getAll("opportunities").map(String);
      for (const o of state.opportunities) {
        if (selected.includes(o.id) && o.contactId !== c.id)
          await run({
            type: "saveOpportunity",
            value: { ...o, contactId: c.id },
          });
        else if (!selected.includes(o.id) && o.contactId === c.id)
          await run({
            type: "saveOpportunity",
            value: { ...o, contactId: "" },
          });
      }
      onClose();
    }
  }
  return (
    <Modal title={contact ? "编辑联系人" : "添加联系人"} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="modal-body form-grid">
          <Field label="姓名 *">
            <input name="name" defaultValue={c.name} required />
          </Field>
          <Field label="所属实验室">
            <input name="lab" defaultValue={c.lab} />
          </Field>
          <Field label="研究领域" className="span-2">
            <input name="areas" defaultValue={c.areas} />
          </Field>
          <Field label="邮箱">
            <input name="email" type="email" defaultValue={c.email} />
          </Field>
          <Field label="个人主页">
            <input name="homepage" type="url" defaultValue={c.homepage} />
          </Field>
          <Field label="最近沟通日期">
            <input
              name="lastContactDate"
              type="date"
              defaultValue={c.lastContactDate}
            />
          </Field>
          <Field label="下次跟进日期">
            <input
              name="followUpDate"
              type="date"
              defaultValue={c.followUpDate}
            />
          </Field>
          <label className="check-label span-2">
            <input
              type="checkbox"
              name="contacted"
              defaultChecked={c.contacted}
            />
            已联系
          </label>
          <Field label="回复情况" className="span-2">
            <textarea name="reply" defaultValue={c.reply} />
          </Field>
          <Field label="备注" className="span-2">
            <textarea name="notes" defaultValue={c.notes} />
          </Field>
          <div className="field span-2">
            <span>关联机会 · 可多选（替换原关联导师）</span>
            <div className="link-checks">
              {state.opportunities.map((o) => (
                <label key={o.id} className="check-label">
                  <input
                    type="checkbox"
                    name="opportunities"
                    value={o.id}
                    defaultChecked={o.contactId === c.id}
                  />
                  {o.name}
                </label>
              ))}
            </div>
          </div>
          <FormError error={error} />
        </div>
        <div className="modal-footer">
          <button type="button" className="button" onClick={onClose}>
            取消
          </button>
          <button className="button primary" disabled={busy}>
            保存联系人
          </button>
        </div>
      </form>
    </Modal>
  );
}
export function TaskEditor({
  task,
  onClose,
  opportunityId = "",
  date = today(),
}: {
  task?: Task;
  onClose: () => void;
  opportunityId?: string;
  date?: string;
}) {
  const { state, run, busy } = useStore(),
    [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    const f = formValues(e);
    const result = taskSchema.safeParse({
      id: task?.id || uid(),
      title: value(f, "title"),
      opportunityId: value(f, "opportunityId"),
      date: value(f, "date"),
      kind: value(f, "kind"),
      notes: value(f, "notes"),
      done: task?.done || false,
    });
    if (!result.success) {
      setError(result.error.issues.map((i) => i.message).join("；"));
      return;
    }
    if (await run({ type: "saveTask", value: result.data })) onClose();
  }
  return (
    <Modal title={task ? "编辑任务" : "添加计划任务"} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="modal-body form-grid">
          <Field label="任务名称 *" className="span-2">
            <input
              name="title"
              required
              defaultValue={task?.title}
              placeholder="例如：阅读 INK Lab 最新论文"
            />
          </Field>
          <Field label="日期 *">
            <input
              name="date"
              type="date"
              required
              defaultValue={task?.date || date}
            />
          </Field>
          <Field label="类型">
            <select name="kind" defaultValue={task?.kind || "Preparation"}>
              {TASK_KINDS.map((k) => (
                <option key={k} value={k}>
                  {TASK_LABELS[k]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="关联机会" className="span-2">
            <select
              name="opportunityId"
              defaultValue={task?.opportunityId ?? opportunityId}
            >
              <option value="">独立任务</option>
              {state.opportunities.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="备注" className="span-2">
            <textarea name="notes" defaultValue={task?.notes} />
          </Field>
          <FormError error={error} />
        </div>
        <div className="modal-footer">
          <button type="button" className="button" onClick={onClose}>
            取消
          </button>
          <button className="button primary" disabled={busy}>
            保存任务
          </button>
        </div>
      </form>
    </Modal>
  );
}
export function HistoryEditor({
  opportunity,
  onClose,
}: {
  opportunity: Opportunity;
  onClose: () => void;
}) {
  const { state, run, busy } = useStore(),
    [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    const f = formValues(e);
    const result = historySchema.safeParse({
      id: uid(),
      opportunityId: opportunity.id,
      contactId: value(f, "contactId"),
      date: value(f, "date"),
      channel: value(f, "channel"),
      summary: value(f, "summary"),
      reply: value(f, "reply"),
      nextStep: value(f, "nextStep"),
    });
    if (!result.success) {
      setError(result.error.issues.map((i) => i.message).join("；"));
      return;
    }
    if (await run({ type: "addHistory", value: result.data })) onClose();
  }
  return (
    <Modal title="添加沟通记录" onClose={onClose}>
      <form onSubmit={submit}>
        <div className="modal-body form-grid">
          <Field label="联系日期 *">
            <input name="date" type="date" defaultValue={today()} required />
          </Field>
          <Field label="渠道">
            <select name="channel">
              {["Email", "Meeting", "Phone", "LinkedIn", "Other"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
          <Field label="联系人" className="span-2">
            <select name="contactId" defaultValue={opportunity.contactId}>
              <option value="">未关联</option>
              {state.contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="沟通摘要 *" className="span-2">
            <textarea name="summary" required rows={3} />
          </Field>
          <Field label="对方回复" className="span-2">
            <textarea name="reply" />
          </Field>
          <Field label="下一步计划 · 同步到机会" className="span-2">
            <textarea name="nextStep" />
          </Field>
          <p className="muted span-2">
            仅保存沟通记录，不会发送邮件或自动更改申请阶段。
          </p>
          <FormError error={error} />
        </div>
        <div className="modal-footer">
          <button type="button" className="button" onClick={onClose}>
            取消
          </button>
          <button className="button primary" disabled={busy}>
            保存记录
          </button>
        </div>
      </form>
    </Modal>
  );
}
