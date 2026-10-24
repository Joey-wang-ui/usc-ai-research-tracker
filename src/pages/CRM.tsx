import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Mail,
  Pencil,
  Trash2,
  Copy,
  ArrowUpRight,
  Users,
  Check,
} from "lucide-react";
import { useStore } from "../lib/store";
import { displayDate, today } from "../lib/dates";
import { type Contact } from "../types";
import {
  Empty,
  Field,
  Modal,
  PageTitle,
  SearchBox,
  SourceLink,
} from "../components/ui";
import { ContactEditor } from "../components/forms";
function EmailTemplate({
  contact,
  onClose,
}: {
  contact: Contact;
  onClose: () => void;
}) {
  const { state, notify } = useStore(),
    [mode, setMode] = useState("inquiry");
  const linked = state.opportunities.filter((o) => o.contactId === contact.id),
    [subject, setSubject] = useState(
      `Research Inquiry — Spring 2027 MS in Analytics Student`,
    );
  const initial = `Dear ${contact.name},\n\nI am an incoming Spring 2027 MS in Analytics student at USC. I am interested in your work in ${contact.areas || "[research area]"}, particularly ${linked[0]?.name || "[specific project or paper]"}.\n\nMy interests include AI agents, LLM applications, and applied machine learning. [Add a specific connection to a paper you have read and a concise, truthful description of your relevant experience.]\n\nI would appreciate learning whether there may be research or student opportunities in your group and what preparation you would recommend. I am happy to share my CV and project portfolio.\n\nThank you for your time and consideration.\n\nBest regards,\n[Your name]\n[Portfolio / GitHub URL]`;
  const followup = `Dear ${contact.name},\n\nI hope you are doing well. I am following up on my earlier inquiry regarding research opportunities in your group. I remain interested in ${linked[0]?.name || "[research topic]"}.\n\n[Add a brief, relevant update if appropriate.] If you are currently considering students, I would be grateful for any guidance on next steps.\n\nThank you again for your time.\n\nBest regards,\n[Your name]`;
  const [body, setBody] = useState(initial);
  async function copy() {
    try {
      await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
      notify("邮件草稿已复制 · 尚未发送");
    } catch {
      notify("浏览器未允许复制，请在文本框中选择并复制。");
    }
  }
  return (
    <Modal title={`邮件草稿 · ${contact.name}`} onClose={onClose} wide>
      <div className="modal-body">
        <div className="segmented">
          <button
            className={mode === "inquiry" ? "active" : ""}
            onClick={() => {
              setMode("inquiry");
              setSubject(
                "Research Inquiry — Spring 2027 MS in Analytics Student",
              );
              setBody(initial);
            }}
          >
            Inquiry Email
          </button>
          <button
            className={mode === "followup" ? "active" : ""}
            onClick={() => {
              setMode("followup");
              setSubject("Follow-up: Research Inquiry");
              setBody(followup);
            }}
          >
            Follow-up Email
          </button>
        </div>
        <p className="inline-notice">
          请替换方括号内容并核实收件人。这里只生成草稿，不发送邮件。
        </p>
        <Field label="Subject">
          <input value={subject} onChange={(e) => setSubject(e.target.value)} />
        </Field>
        <Field label="英文邮件模板">
          <textarea
            className="email-editor"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={16}
          />
        </Field>
      </div>
      <div className="modal-footer">
        <button className="button" onClick={() => void copy()}>
          <Copy size={15} />
          复制草稿
        </button>
        {contact.email && (
          <a
            className="button primary"
            href={`mailto:${encodeURIComponent(contact.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}
          >
            <Mail size={15} />
            在邮件客户端打开
          </a>
        )}
      </div>
    </Modal>
  );
}
export default function CRM() {
  const { state, run } = useStore(),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all"),
    [editor, setEditor] = useState<Contact | "new" | null>(null),
    [template, setTemplate] = useState<Contact | null>(null);
  const contacts = state.contacts
    .filter((c) =>
      [c.name, c.lab, c.areas, c.email, c.notes]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
    .filter(
      (c) =>
        filter === "all" ||
        (filter === "contacted"
          ? c.contacted
          : filter === "due"
            ? c.followUpDate && c.followUpDate <= today()
            : !c.contacted),
    );
  return (
    <>
      <PageTitle
        eyebrow="RESEARCH BEGINS WITH A CONVERSATION"
        title="研究人脉"
        description="认真了解每一个团队，让每一次联系更有意义。"
        actions={
          <button className="button primary" onClick={() => setEditor("new")}>
            <Plus size={16} />
            添加联系人
          </button>
        }
      />
      <div className="crm-summary">
        <div>
          <Users size={19} />
          <strong>{state.contacts.length}</strong>
          <span>研究联系人</span>
        </div>
        <div>
          <Mail size={19} />
          <strong>{state.contacts.filter((c) => c.contacted).length}</strong>
          <span>已建立联系</span>
        </div>
        <div>
          <ArrowUpRight size={19} />
          <strong>
            {
              state.contacts.filter(
                (c) => c.followUpDate && c.followUpDate <= today(),
              ).length
            }
          </strong>
          <span>需要跟进</span>
        </div>
      </div>
      <div className="filter-toolbar">
        <SearchBox
          value={query}
          onChange={setQuery}
          placeholder="搜索教授、实验室、领域…"
        />
        <select
          aria-label="联系状态筛选"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">全部联系人</option>
          <option value="contacted">已联系</option>
          <option value="uncontacted">未联系</option>
          <option value="due">需要跟进</option>
        </select>
      </div>
      <div className="crm-grid">
        {contacts.map((c) => {
          const linked = state.opportunities.filter(
            (o) => o.contactId === c.id,
          );
          return (
            <article className="contact-card panel" key={c.id}>
              <div className="contact-top">
                <div className="contact-avatar">
                  {c.name
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <h2>{c.name}</h2>
                  <p>{c.lab || "实验室待补充"}</p>
                </div>
                <span
                  className={`contact-status ${c.contacted ? "contacted" : ""}`}
                >
                  {c.contacted ? (
                    <Check size={11} />
                  ) : (
                    <span className="tiny-dot" />
                  )}
                  {c.contacted ? "已联系" : "未联系"}
                </span>
              </div>
              <div className="tags">
                {c.areas
                  .split(",")
                  .filter(Boolean)
                  .map((a) => (
                    <span key={a}>{a.trim()}</span>
                  ))}
              </div>
              <div className="contact-links">
                {c.email ? (
                  <a href={`mailto:${encodeURIComponent(c.email)}`}>
                    <Mail size={13} />
                    {c.email}
                  </a>
                ) : (
                  <span className="muted">邮箱未提供</span>
                )}
                {c.homepage && <SourceLink url={c.homepage} label="主页" />}
              </div>
              <div className="linked-opportunities">
                <span>
                  关联机会 <b>{linked.length}</b>
                </span>
                {linked.map((o) => (
                  <Link key={o.id} to={`/opportunities/${o.id}`}>
                    {o.name}
                    <ArrowUpRight size={12} />
                  </Link>
                ))}
                {!linked.length && <p className="muted">尚未关联机会</p>}
              </div>
              <div className="contact-dates">
                <span>
                  最近沟通<strong>{displayDate(c.lastContactDate)}</strong>
                </span>
                <span
                  className={
                    c.followUpDate && c.followUpDate < today() ? "overdue" : ""
                  }
                >
                  下次跟进<strong>{displayDate(c.followUpDate)}</strong>
                </span>
              </div>
              {c.reply && (
                <div className="contact-note">
                  <strong>回复情况</strong>
                  <p>{c.reply}</p>
                </div>
              )}
              {c.notes && <p className="contact-note">{c.notes}</p>}
              <div className="contact-actions">
                <button className="button small" onClick={() => setTemplate(c)}>
                  <Mail size={14} />
                  邮件草稿
                </button>
                <button
                  className="icon-button"
                  aria-label={`编辑联系人 ${c.name}`}
                  onClick={() => setEditor(c)}
                >
                  <Pencil size={15} />
                </button>
                <button
                  className="icon-button danger-text"
                  aria-label={`删除联系人 ${c.name}`}
                  onClick={() => {
                    if (
                      confirm(
                        `删除联系人 ${c.name}？机会和沟通记录会保留，联系人关联会解除。`,
                      )
                    )
                      void run(
                        { type: "deleteContact", id: c.id },
                        "联系人已删除",
                      );
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {!contacts.length && (
        <Empty
          title="没有匹配的联系人"
          description="添加研究导师，或调整搜索与筛选条件。"
        />
      )}
      {editor && (
        <ContactEditor
          contact={editor === "new" ? undefined : editor}
          onClose={() => setEditor(null)}
        />
      )}{" "}
      {template && (
        <EmailTemplate contact={template} onClose={() => setTemplate(null)} />
      )}
    </>
  );
}
