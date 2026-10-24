import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  Plus,
  Trash2,
  Archive,
  Check,
  Mail,
  BookOpen,
  MessageSquare,
  Target,
  Clock3,
} from "lucide-react";
import { useStore } from "../lib/store";
import { displayDate, relativeTime } from "../lib/dates";
import {
  Availability,
  Empty,
  Panel,
  Priority,
  SourceLink,
  StageSelect,
} from "../components/ui";
import {
  HistoryEditor,
  OpportunityEditor,
  TaskEditor,
} from "../components/forms";
export default function Detail() {
  const { id } = useParams(),
    { state, run } = useStore(),
    navigate = useNavigate(),
    [edit, setEdit] = useState(false),
    [history, setHistory] = useState(false),
    [task, setTask] = useState(false),
    [item, setItem] = useState("");
  const o = state.opportunities.find((o) => o.id === id);
  if (!o)
    return (
      <Empty
        title="机会不存在"
        description="此机会可能已被删除。"
        action={
          <Link className="button" to="/opportunities">
            返回研究机会
          </Link>
        }
      />
    );
  const opportunity = o;
  const c = state.contacts.find((c) => c.id === o.contactId),
    histories = state.histories
      .filter((h) => h.opportunityId === o.id)
      .sort((a, b) => b.date.localeCompare(a.date)),
    activities = state.activities
      .filter((a) => a.opportunityId === o.id)
      .sort((a, b) => b.at.localeCompare(a.at)),
    tasks = state.tasks.filter((t) => t.opportunityId === o.id);
  async function save(patch: Partial<typeof opportunity>) {
    return run({
      type: "patchOpportunity",
      id: opportunity.id,
      patch,
    });
  }
  return (
    <>
      <Link className="back-link" to="/opportunities">
        <ArrowLeft size={15} />
        全部研究机会
      </Link>
      <div className="detail-heading">
        <div>
          <div className="eyebrow">
            {o.id} <span> / </span>
            {o.type}
            {o.archived ? " · 已归档" : ""}
          </div>
          <h1>{o.name}</h1>
          <p>
            {o.organization}
            {c ? ` / ${c.name}` : ""}
          </p>
          <div className="tags">
            {o.areas.map((a) => (
              <span key={a}>{a}</span>
            ))}
          </div>
        </div>
        <button className="button primary" onClick={() => setEdit(true)}>
          <Pencil size={15} />
          编辑机会
        </button>
      </div>
      <div className="detail-status-bar">
        <Priority value={o.priority} />
        <StageSelect opportunity={o} />
        <span className="divider" />
        <Availability value={o.availability} />
        <SourceLink url={o.sourceUrl} />
      </div>
      {[
        "Needs Verification",
        "Historical / Potentially Closed",
        "Unknown",
      ].includes(o.availability) && (
        <div className="inline-notice">
          <BookOpen size={17} />
          <span>
            这是一条待重新核实的研究线索，请查看官方来源确认开放情况、资格和申请方式。
          </span>
        </div>
      )}
      <div className="detail-grid">
        <div className="detail-main">
          <Panel title="基本信息" meta="Basic Information">
            <div className="prose-text">
              {o.description || "尚无已核实的岗位描述。请阅读官方来源后补充。"}
            </div>
            <dl className="info-grid">
              <div>
                <dt>Organization / Lab</dt>
                <dd>{o.organization}</dd>
              </div>
              <div>
                <dt>Professor / Contact</dt>
                <dd>{c?.name || "Unknown"}</dd>
              </div>
              <div>
                <dt>Compensation</dt>
                <dd>{o.compensation}</dd>
              </div>
              <div>
                <dt>Work Mode</dt>
                <dd>{o.workMode}</dd>
              </div>
              <div>
                <dt>Contact Email</dt>
                <dd>
                  {o.contactEmail || c?.email ? (
                    <a
                      href={`mailto:${encodeURIComponent(o.contactEmail || c?.email || "")}`}
                    >
                      {o.contactEmail || c?.email}
                    </a>
                  ) : (
                    "Unknown"
                  )}
                </dd>
              </div>
              <div>
                <dt>发布日期</dt>
                <dd>{displayDate(o.postingDate)}</dd>
              </div>
            </dl>
            <div className="text-section">
              <h3>资格条件</h3>
              <p>
                {o.qualifications || "Unknown · 尚未核实，不推测录取资格。"}
              </p>
            </div>
          </Panel>
          <Panel
            title="研究匹配度"
            meta="Research Fit"
            action={<Target size={17} className="muted" />}
          >
            <div className="prose-text">
              {o.researchFit ||
                "记录这个方向为什么与你的 AI Agent、LLM 或应用工程目标匹配。编辑机会即可补充你的分析。"}
            </div>
          </Panel>
          <Panel title="技术要求" meta="Technical Requirements">
            <div className="prose-text">
              {o.requirements ||
                "尚未核实。研究方向标签不代表岗位的正式技能要求。"}
            </div>
          </Panel>
          <Panel
            title="申请准备清单"
            meta={`${o.checklist.filter((x) => x.done).length} / ${o.checklist.length} 已完成`}
          >
            <div className="checklist-progress">
              <span
                style={{
                  width: `${o.checklist.length ? (o.checklist.filter((x) => x.done).length / o.checklist.length) * 100 : 0}%`,
                }}
              />
            </div>
            <div className="checklist">
              {o.checklist.map((ch) => (
                <div
                  key={ch.id}
                  className={`checklist-row ${ch.done ? "done" : ""}`}
                >
                  <input
                    type="checkbox"
                    aria-label={`完成 ${ch.text}`}
                    checked={ch.done}
                    onChange={() =>
                      void run({
                        type: "checklist",
                        id: o.id,
                        action: "update",
                        itemId: ch.id,
                        done: !ch.done,
                      })
                    }
                  />
                  <input
                    className="inline-edit"
                    key={ch.id + ch.text}
                    aria-label={`清单条目 ${ch.text}`}
                    defaultValue={ch.text}
                    maxLength={500}
                    onBlur={(e) => {
                      const text = e.target.value.trim();
                      if (text && text !== ch.text)
                        void run({
                          type: "checklist",
                          id: o.id,
                          action: "update",
                          itemId: ch.id,
                          text,
                        });
                      else e.target.value = ch.text;
                    }}
                  />
                  <button
                    className="icon-button"
                    aria-label={`删除清单 ${ch.text}`}
                    onClick={() =>
                      void run({
                        type: "checklist",
                        id: o.id,
                        action: "delete",
                        itemId: ch.id,
                      })
                    }
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <form
              className="inline-add"
              onSubmit={(e) => {
                e.preventDefault();
                if (item.trim()) {
                  void run({
                    type: "checklist",
                    id: o.id,
                    action: "add",
                    text: item.trim(),
                  }).then((ok) => {
                    if (ok) setItem("");
                  });
                }
              }}
            >
              <input
                aria-label="新清单条目"
                placeholder="添加准备事项…"
                maxLength={500}
                value={item}
                onChange={(e) => setItem(e.target.value)}
              />
              <button className="button small" disabled={!item.trim()}>
                <Plus size={14} />
                添加
              </button>
            </form>
          </Panel>
          <Panel
            title="联系记录"
            meta="Contact History"
            action={
              <button className="button small" onClick={() => setHistory(true)}>
                <Plus size={14} />
                记录沟通
              </button>
            }
          >
            {histories.length ? (
              <div className="history-list">
                {histories.map((h) => (
                  <article className="history-item" key={h.id}>
                    <div className="flex-between">
                      <span className="history-channel">
                        <MessageSquare size={14} />
                        {h.channel}
                        {h.contactId &&
                          ` · ${state.contacts.find((c) => c.id === h.contactId)?.name}`}
                      </span>
                      <time>{displayDate(h.date)}</time>
                    </div>
                    <p>{h.summary}</p>
                    {h.reply && (
                      <div className="reply-box">
                        <strong>对方回复</strong>
                        <p>{h.reply}</p>
                      </div>
                    )}
                    {h.nextStep && (
                      <p className="muted">下一步：{h.nextStep}</p>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <Empty
                title="还没有沟通记录"
                description="记录联系摘要和回复，下一次跟进更从容。"
              />
            )}
          </Panel>
          <Panel title="个人笔记" meta="Personal Notes · 离开输入框自动保存">
            <textarea
              className="notes-editor"
              key={o.id + o.notes}
              defaultValue={o.notes}
              aria-label="个人笔记"
              placeholder="想法、论文链接、申请准备笔记…"
              onBlur={(e) => {
                if (e.target.value !== o.notes)
                  void save({ notes: e.target.value });
              }}
            />
          </Panel>
        </div>
        <aside className="detail-aside">
          <Panel title="下一步行动" action={<Target size={16} />}>
            <p className="prose-text">
              {o.nextAction || "还未设定。编辑机会，给自己一个清晰的下一步。"}
            </p>
            <button className="button full" onClick={() => setTask(true)}>
              <Plus size={15} />
              添加关联任务
            </button>
          </Panel>
          <Panel title="重要日期" meta="Dates & Planning">
            <dl className="dates-list">
              <div>
                <dt>官方截止日期</dt>
                <dd>
                  {o.deadline ? displayDate(o.deadline) : "Unknown · 未提供"}
                </dd>
              </div>
              <div>
                <dt>
                  个人目标日期 <span>个人计划</span>
                </dt>
                <dd>{displayDate(o.targetDate)}</dd>
              </div>
              <div>
                <dt>最近联系</dt>
                <dd>{displayDate(o.lastContactDate)}</dd>
              </div>
              <div>
                <dt>下次跟进</dt>
                <dd>{displayDate(o.followUpDate)}</dd>
              </div>
            </dl>
          </Panel>
          <Panel
            title="关联任务"
            meta={`${tasks.filter((t) => t.done).length} / ${tasks.length}`}
          >
            <div className="linked-tasks">
              {tasks.map((t) => (
                <label
                  className={`check-label ${t.done ? "done" : ""}`}
                  key={t.id}
                >
                  <input
                    type="checkbox"
                    checked={t.done}
                    onChange={() =>
                      void run({
                        type: "saveTask",
                        value: { ...t, done: !t.done },
                      })
                    }
                  />
                  <span>
                    {t.title}
                    <small>{displayDate(t.date)}</small>
                  </span>
                </label>
              ))}
              {!tasks.length && <p className="muted">尚无关联任务</p>}
            </div>
          </Panel>
          <Panel title="申请动态" meta="Activity Timeline">
            <div className="detail-timeline">
              {activities.slice(0, 25).map((a) => (
                <div key={a.id}>
                  <span className="timeline-icon">
                    <Clock3 size={12} />
                  </span>
                  <p>
                    {a.text}
                    <time>{relativeTime(a.at)}</time>
                  </p>
                </div>
              ))}
              {!activities.length && (
                <p className="muted">更新申请阶段后，记录会自动显示。</p>
              )}
            </div>
          </Panel>
          <div className="detail-tools">
            <button
              className="button full"
              onClick={() => void save({ archived: !o.archived })}
            >
              <Archive size={15} />
              {o.archived ? "取消归档" : "归档此机会"}
            </button>
            <button
              className="button full danger-text"
              onClick={() => {
                if (confirm(`确认删除 ${o.name} 及其关联任务、沟通和动态？`))
                  void run(
                    { type: "deleteOpportunity", id: o.id },
                    "已删除机会",
                  ).then((ok) => {
                    if (ok) navigate("/opportunities");
                  });
              }}
            >
              <Trash2 size={15} />
              删除机会
            </button>
            <span>
              <Check size={12} />
              修改保存在当前浏览器
            </span>
          </div>
        </aside>
      </div>
      {c && (
        <Link className="subtle-link" to="/crm">
          <Mail size={14} />在 Research CRM 管理 {c.name}
        </Link>
      )}
      {edit && (
        <OpportunityEditor opportunity={o} onClose={() => setEdit(false)} />
      )}{" "}
      {history && (
        <HistoryEditor opportunity={o} onClose={() => setHistory(false)} />
      )}{" "}
      {task && (
        <TaskEditor opportunityId={o.id} onClose={() => setTask(false)} />
      )}
    </>
  );
}
