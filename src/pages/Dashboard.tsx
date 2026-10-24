import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Plus,
  Telescope,
  Flag,
  Send,
  Clock3,
  CalendarClock,
  Award,
  ArrowDownToLine,
  CircleCheck,
  Circle,
  Sparkles,
  Check,
} from "lucide-react";
import { useStore } from "../lib/store";
import {
  calendarEvents,
  dashboardStats,
  selectOpportunities,
} from "../lib/model";
import { today, relativeTime, displayDate } from "../lib/dates";
import { STAGES, STAGE_LABELS } from "../types";
import {
  DetailLink,
  Empty,
  PageTitle,
  Panel,
  Priority,
  StageBadge,
} from "../components/ui";
import { OpportunityEditor, TaskEditor } from "../components/forms";
import { download } from "../lib/files";
export default function Dashboard() {
  const { state, run } = useStore(),
    [add, setAdd] = useState(false),
    [task, setTask] = useState(false);
  const date = today(),
    stats = dashboardStats(state),
    ops = selectOpportunities(state),
    events = calendarEvents(state)
      .filter((e) => !e.done)
      .slice(0, 5),
    activities = [...state.activities]
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 4);
  const cards = [
    ["研究机会", "Total Opportunities", stats.total, Telescope, "全部研究线索"],
    ["高优先级", "High Priority", stats.high, Flag, "S / A 级重点关注"],
    [
      "已提交申请",
      "Applications Submitted",
      stats.submitted,
      Send,
      "含面试及已获机会",
    ],
    ["等待回复", "Awaiting Response", stats.awaiting, Clock3, "已联系或已申请"],
    [
      "即将截止",
      "Upcoming Deadlines",
      stats.deadlines,
      CalendarClock,
      "未来 30 天 · 官方日期",
    ],
    ["获得机会", "Offers Received", stats.offers, Award, "让努力成为可能"],
  ] as const;
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - 5 + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const ids = new Set(
      state.activities
        .filter(
          (a) =>
            a.at.startsWith(key) &&
            (a.text.includes("→ Applied") ||
              a.text === "添加了研究机会 · Applied"),
        )
        .map((a) => a.opportunityId),
    );
    return { key, label: `${d.getMonth() + 1}月`, count: ids.size };
  });
  return (
    <>
      <PageTitle
        eyebrow="YOUR RESEARCH, IN FOCUS"
        title="每一步探索，都离目标更近。"
        description="在这里发现机会、建立连接，开启你的 USC 研究旅程。"
        actions={
          <>
            <button
              className="button"
              onClick={() =>
                download(
                  JSON.stringify(state, null, 2),
                  "usc-research-backup.json",
                  "application/json",
                )
              }
            >
              <ArrowDownToLine size={15} />
              备份数据
            </button>
            <button className="button primary" onClick={() => setAdd(true)}>
              <Plus size={16} />
              添加机会
            </button>
          </>
        }
      />
      <div className="welcome-banner">
        <div className="welcome-symbol">
          <Sparkles size={22} />
        </div>
        <div>
          <strong>从好奇心出发，找到你的研究方向。</strong>
          <p>
            AI Agent · LLM Applications · RAG & Knowledge Graph · Applied AI
          </p>
        </div>
        <Link to="/opportunities">
          探索研究机会 <ArrowUpRight size={17} />
        </Link>
        <div className="banner-lines" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
      <div className="stats-grid">
        {cards.map(([label, en, count, Icon, hint], i) => (
          <div className={`stat-card stat-${i}`} key={en}>
            <div className="stat-top">
              <span>{label}</span>
              <Icon size={16} />
            </div>
            <strong>{String(count).padStart(2, "0")}</strong>
            <span className="stat-en">{en}</span>
            <div className="stat-bottom">
              {i === 0 ? (
                <span className="green-dot" />
              ) : i === 1 ? (
                <span className="gold-dot" />
              ) : null}
              {hint}
            </div>
          </div>
        ))}
      </div>
      <div className="dashboard-grid">
        <Panel
          title="申请进度概览"
          meta="Application Pipeline"
          action={
            <Link className="subtle-link" to="/pipeline">
              查看看板 <ArrowRight size={14} />
            </Link>
          }
          className="pipeline-overview"
        >
          <div className="pipeline-bar">
            {STAGES.map((s, i) => {
              const count = ops.filter((o) => o.status === s).length;
              return count > 0 ? (
                <div
                  key={s}
                  title={`${STAGE_LABELS[s]}: ${count}`}
                  style={{ flex: count }}
                  className={`pipeline-color color-${i}`}
                />
              ) : null;
            })}
            {!ops.length && <div className="pipeline-no-data" />}
          </div>
          <div className="pipeline-stats">
            {STAGES.map((s, i) => (
              <Link to={`/opportunities?stage=${s}`} key={s}>
                <span>
                  <i className={`color-${i}`} />
                  {STAGE_LABELS[s]}
                </span>
                <strong>{ops.filter((o) => o.status === s).length}</strong>
              </Link>
            ))}
          </div>
          <div className="pipeline-caption">
            <span>一个清晰的过程，让每次行动都有方向。</span>
            <span>
              {stats.total
                ? Math.round((stats.submitted / stats.total) * 100)
                : 0}
              % 已申请
            </span>
          </div>
        </Panel>
        <Panel
          title="申请趋势"
          meta="Application Progress · 最近 6 个月"
          action={
            <span className="legend">
              <i />
              已提交
            </span>
          }
        >
          <div className="mini-chart">
            {months.map((m) => (
              <div className="chart-column" key={m.key}>
                <span className="chart-count">{m.count}</span>
                <div
                  className={`chart-bar ${m.count ? "has-data" : ""}`}
                  style={{
                    height: m.count
                      ? `${Math.max(12, (m.count / Math.max(1, ...months.map((m) => m.count))) * 90)}px`
                      : "2px",
                  }}
                />
                <span>{m.label}</span>
              </div>
            ))}
          </div>
          <div className="chart-caption">
            {months.every((m) => m.count === 0)
              ? "尚无申请记录，你的研究旅程即将开始。"
              : "根据本地申请阶段变更记录统计，每月去重。"}
          </div>
        </Panel>
        <Panel
          title="优先关注"
          meta="Priority Opportunities"
          action={
            <Link className="subtle-link" to="/opportunities">
              全部机会 <ArrowRight size={14} />
            </Link>
          }
          className="priority-panel"
        >
          <div className="mini-table-head">
            <span>机会 / 实验室</span>
            <span>优先级</span>
            <span>申请状态</span>
          </div>
          {ops.slice(0, 5).map((o) => (
            <div className="priority-row" key={o.id}>
              <div className="lab-icon">
                {o.organization.includes("ISI")
                  ? "ISI"
                  : o.name.includes("FORTIS")
                    ? "F"
                    : "USC"}
              </div>
              <div className="priority-row-info">
                <DetailLink opportunity={o} />
                <span>
                  {o.organization} <i /> {o.areas.slice(0, 2).join(" · ")}
                </span>
              </div>
              <Priority value={o.priority} />
              <StageBadge stage={o.status} />
            </div>
          ))}
          {!ops.length && (
            <Empty
              title="还没有研究机会"
              description="添加你的第一个研究线索。"
            />
          )}
          <Link className="panel-bottom-link" to="/opportunities">
            管理所有 {stats.total} 个机会 <ArrowRight size={14} />
          </Link>
        </Panel>
        <Panel
          title="接下来的行动"
          meta="Upcoming Actions"
          action={
            <button
              className="icon-button"
              aria-label="添加任务"
              onClick={() => setTask(true)}
            >
              <Plus size={17} />
            </button>
          }
        >
          {events.length ? (
            <div className="action-list">
              {events.map((e) => (
                <div
                  className={`action-row ${e.date < date ? "overdue" : ""}`}
                  key={e.id}
                >
                  {e.task ? (
                    <button
                      className="task-check"
                      aria-label={`完成 ${e.title}`}
                      onClick={() =>
                        void run({
                          type: "saveTask",
                          value: { ...e.task!, done: true },
                        })
                      }
                    >
                      <Circle size={18} />
                    </button>
                  ) : (
                    <CalendarClock size={18} />
                  )}
                  <div>
                    {e.opportunityId ? (
                      <Link to={`/opportunities/${e.opportunityId}`}>
                        {e.title}
                      </Link>
                    ) : (
                      <span>{e.title}</span>
                    )}
                    <small>
                      {e.kind === "Official Deadline"
                        ? "官方截止"
                        : e.kind === "Target Date"
                          ? "个人目标"
                          : e.kind === "Interview"
                            ? "面试"
                            : "计划任务"}{" "}
                      · {displayDate(e.date)}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-actions">
              <div className="quiet-check">
                <Check size={25} />
              </div>
              <h3>给下一步留一个位置</h3>
              <p>
                添加准备任务、联系计划或个人目标日期，
                <br />
                让每次行动都井然有序。
              </p>
              <button className="button small" onClick={() => setTask(true)}>
                <Plus size={14} />
                规划第一个任务
              </button>
            </div>
          )}
          <Link className="panel-bottom-link" to="/timeline">
            查看计划与任务 <ArrowRight size={14} />
          </Link>
        </Panel>
        <Panel
          title="最近动态"
          meta="Recent Activity"
          className="activity-panel"
        >
          {activities.length ? (
            activities.map((a) => (
              <div className="activity-row" key={a.id}>
                <span className="activity-dot" />
                <div>
                  <Link to={`/opportunities/${a.opportunityId}`}>
                    {
                      state.opportunities.find((o) => o.id === a.opportunityId)
                        ?.name
                    }
                  </Link>
                  <p>{a.text}</p>
                </div>
                <time>{relativeTime(a.at)}</time>
              </div>
            ))
          ) : (
            <div className="first-activity">
              <CircleCheck size={18} />
              <div>
                <strong>你的研究工作区已就绪</strong>
                <p>
                  全部 {state.opportunities.length}{" "}
                  条研究线索已载入。修改申请阶段后，动态会自动显示在这里。
                </p>
              </div>
              <span>开始探索</span>
            </div>
          )}
        </Panel>
      </div>
      <div className="verification-note">
        <span className="notice-dot" />
        <p>
          研究线索需要重新核实。初始信息不代表岗位目前仍开放，请以官方网站为准。
        </p>
        <Link to="/opportunities">
          查看来源 <ArrowUpRight size={13} />
        </Link>
      </div>
      {add && <OpportunityEditor onClose={() => setAdd(false)} />}{" "}
      {task && <TaskEditor onClose={() => setTask(false)} />}
    </>
  );
}
