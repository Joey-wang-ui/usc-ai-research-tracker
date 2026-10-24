import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  ListTodo,
  Pencil,
  Trash2,
  Check,
  Circle,
} from "lucide-react";
import { useStore } from "../lib/store";
import { calendarEvents, type CalendarEvent } from "../lib/model";
import { today, displayDate } from "../lib/dates";
import { TASK_LABELS, type Task } from "../types";
import { Empty, PageTitle } from "../components/ui";
import { TaskEditor } from "../components/forms";
export default function Timeline() {
  const { state, run } = useStore(),
    [month, setMonth] = useState(today().slice(0, 7)),
    [view, setView] = useState<"month" | "list">("month"),
    [filter, setFilter] = useState("open"),
    [editor, setEditor] = useState<Task | "new" | null>(null),
    [selectedDate, setSelectedDate] = useState(today());
  const events = calendarEvents(state).filter(
    (e) => filter === "all" || (filter === "done" ? e.done : !e.done),
  );
  const [y, m] = month.split("-").map(Number),
    first = new Date(y, m - 1, 1),
    days = new Date(y, m, 0).getDate(),
    offset = (first.getDay() + 6) % 7;
  function move(n: number) {
    const d = new Date(y, m - 1 + n, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  function add(date = today()) {
    setSelectedDate(date);
    setEditor("new");
  }
  function eventRow(e: CalendarEvent) {
    const overdue = e.date < today() && !e.done;
    return (
      <div
        key={e.id}
        className={`event-row ${e.done ? "done" : ""} ${overdue ? "overdue" : ""}`}
      >
        <span
          className={`event-date ${e.kind === "Official Deadline" ? "official" : ""}`}
        >
          <strong>{e.date.slice(8)}</strong>
          <small>{e.date.slice(0, 7)}</small>
        </span>
        {e.task ? (
          <button
            className="task-check"
            aria-label={`${e.done ? "取消完成" : "完成任务"} ${e.title}`}
            onClick={() =>
              void run({
                type: "saveTask",
                value: { ...e.task!, done: !e.done },
              })
            }
          >
            {e.done ? <Check size={18} /> : <Circle size={18} />}
          </button>
        ) : (
          <CalendarDays className="muted" size={18} />
        )}
        <div className="event-info">
          {e.opportunityId ? (
            <Link to={`/opportunities/${e.opportunityId}`}>{e.title}</Link>
          ) : (
            <strong>{e.title}</strong>
          )}
          <div>
            <span
              className={`event-kind ${e.kind === "Official Deadline" ? "official" : ""}`}
            >
              {e.kind === "Official Deadline"
                ? "官方截止日期"
                : e.kind === "Target Date"
                  ? "个人目标 · 非官方截止"
                  : e.kind === "CRM Follow-up"
                    ? "CRM 跟进"
                    : TASK_LABELS[e.kind] || e.kind}
            </span>
            {overdue && <span className="overdue-label">已过期</span>}
            {e.done && <span className="muted">已完成</span>}
          </div>
          {e.task?.notes && <p>{e.task.notes}</p>}
        </div>
        {e.task && (
          <div className="row-actions">
            <button
              className="icon-button"
              aria-label={`编辑任务 ${e.title}`}
              onClick={() => setEditor(e.task!)}
            >
              <Pencil size={15} />
            </button>
            <button
              className="icon-button danger-text"
              aria-label={`删除任务 ${e.title}`}
              onClick={() => {
                if (confirm(`删除任务“${e.title}”？`))
                  void run({ type: "deleteTask", id: e.id }, "任务已删除");
              }}
            >
              <Trash2 size={15} />
            </button>
          </div>
        )}
      </div>
    );
  }
  const visible = events.filter((e) => e.date.startsWith(month));
  return (
    <>
      <PageTitle
        eyebrow="MAKE ROOM FOR WHAT MATTERS"
        title="计划与任务"
        description="把准备、联系和跟进，放进一份可执行的研究计划。"
        actions={
          <button className="button primary" onClick={() => add()}>
            <Plus size={16} />
            添加任务
          </button>
        }
      />
      <div className="inline-notice">
        <CalendarDays size={17} />
        <span>
          规划重点：October 2026 – December
          2028，支持任意未来日期。官方截止与个人目标日期分别标注。
        </span>
      </div>
      <div className="calendar-toolbar">
        <div className="month-control">
          <button
            className="icon-button"
            aria-label="上个月"
            onClick={() => move(-1)}
          >
            <ChevronLeft size={18} />
          </button>
          <input
            aria-label="选择月份"
            type="month"
            min="0001-01"
            value={month}
            onChange={(e) => {
              if (e.target.value) setMonth(e.target.value);
            }}
          />
          <button
            className="icon-button"
            aria-label="下个月"
            onClick={() => move(1)}
          >
            <ChevronRight size={18} />
          </button>
          <button
            className="button small"
            onClick={() => setMonth(today().slice(0, 7))}
          >
            本月
          </button>
        </div>
        <div className="calendar-controls">
          <select
            aria-label="任务完成筛选"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="open">待完成</option>
            <option value="all">全部事项</option>
            <option value="done">已完成任务</option>
          </select>
          <div className="view-toggle">
            <button
              className={view === "month" ? "active" : ""}
              aria-label="月度视图"
              onClick={() => setView("month")}
            >
              <CalendarDays size={16} />
            </button>
            <button
              className={view === "list" ? "active" : ""}
              aria-label="待办列表视图"
              onClick={() => setView("list")}
            >
              <ListTodo size={16} />
            </button>
          </div>
        </div>
      </div>
      {view === "month" ? (
        <>
          <div className="calendar panel">
            <div className="calendar-weekdays">
              {["一", "二", "三", "四", "五", "六", "日"].map((d) => (
                <span key={d}>周{d}</span>
              ))}
            </div>
            <div className="calendar-days">
              {Array.from({ length: offset }, (_, i) => (
                <div className="calendar-day outside" key={`empty-${i}`} />
              ))}
              {Array.from({ length: days }, (_, i) => {
                const date = `${month}-${String(i + 1).padStart(2, "0")}`,
                  dayEvents = visible.filter((e) => e.date === date);
                return (
                  <div
                    className={`calendar-day ${date === today() ? "is-today" : ""}`}
                    key={date}
                  >
                    <div className="calendar-day-heading">
                      <button
                        className="day-number"
                        aria-label={`查看 ${date} 的计划`}
                        onClick={() => setSelectedDate(date)}
                      >
                        {i + 1}
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`在 ${date} 添加任务`}
                        onClick={() => add(date)}
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                    {dayEvents.slice(0, 3).map((e) => (
                      <button
                        className={`calendar-event ${e.kind === "Official Deadline" ? "official" : ""} ${e.done ? "done" : ""} ${e.date < today() && !e.done ? "late" : ""}`}
                        key={e.id}
                        title={`${e.title} · ${e.kind}`}
                        onClick={() => {
                          setSelectedDate(date);
                        }}
                      >
                        <i />
                        {e.title}
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <button
                        className="calendar-more"
                        onClick={() => setSelectedDate(date)}
                      >
                        还有 {dayEvents.length - 3} 项
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="section-title">
            <h2>{displayDate(selectedDate)} 的计划</h2>
            <button className="text-button" onClick={() => add(selectedDate)}>
              添加事项 <Plus size={13} />
            </button>
          </div>
          <div className="panel event-list">
            {events.filter((e) => e.date === selectedDate).length ? (
              events.filter((e) => e.date === selectedDate).map(eventRow)
            ) : (
              <Empty
                title="这一天没有安排"
                description="为重要的准备和联系留出时间。"
              />
            )}
          </div>
        </>
      ) : (
        <>
          <div className="section-title">
            <h2>待办事项</h2>
            <span className="muted">全部日期 · {events.length} 项</span>
          </div>
          <div className="panel event-list">
            {events.length ? (
              events.map(eventRow)
            ) : (
              <Empty
                title="当前没有待办事项"
                description="添加一个任务，开始规划下一步。"
              />
            )}
          </div>
        </>
      )}
      {editor && (
        <TaskEditor
          task={editor === "new" ? undefined : editor}
          date={selectedDate}
          onClose={() => setEditor(null)}
        />
      )}
    </>
  );
}
