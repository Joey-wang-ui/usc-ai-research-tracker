import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus,
  SlidersHorizontal,
  Archive,
  Pencil,
  Trash2,
  Star,
  LayoutList,
  Grid2X2,
  ArrowUpDown,
  StickyNote,
} from "lucide-react";
import { useStore } from "../lib/store";
import { selectOpportunities, type Filters } from "../lib/model";
import { PRIORITIES, STAGES, STAGE_LABELS, type Opportunity } from "../types";
import { displayDate } from "../lib/dates";
import {
  Availability,
  DetailLink,
  Empty,
  PageTitle,
  Priority,
  SearchBox,
  SourceLink,
  StageSelect,
} from "../components/ui";
import { OpportunityEditor } from "../components/forms";
export default function Opportunities() {
  const { state, run } = useStore(),
    [params, setParams] = useSearchParams(),
    [filters, setFilters] = useState<Filters>({
      query: params.get("search") || "",
      status: params.get("stage") || "",
    }),
    [editor, setEditor] = useState<Opportunity | "new" | null>(null),
    [grid, setGrid] = useState(false);
  const rows = selectOpportunities(state, filters);
  function filter(key: keyof Filters, value: string | boolean) {
    setFilters((f) => ({ ...f, [key]: value }));
    if (key === "status") {
      params.delete("stage");
      setParams(params, { replace: true });
    }
  }
  function actions(o: Opportunity) {
    return (
      <div className="row-actions">
        <SourceLink url={o.sourceUrl} label="来源" />
        <button
          className="icon-button"
          aria-label={`添加备注 ${o.name}`}
          onClick={() => setEditor(o)}
        >
          <StickyNote size={15} />
        </button>
        <button
          className={`icon-button ${o.priority === "S" ? "gold-text" : ""}`}
          aria-label={`标为重点 ${o.name}`}
          onClick={() =>
            void run({
              type: "saveOpportunity",
              value: { ...o, priority: o.priority === "S" ? "A" : "S" },
            })
          }
        >
          <Star size={15} fill={o.priority === "S" ? "currentColor" : "none"} />
        </button>
        <button
          className="icon-button"
          aria-label={`编辑 ${o.name}`}
          onClick={() => setEditor(o)}
        >
          <Pencil size={15} />
        </button>
        <button
          className="icon-button"
          aria-label={`${o.archived ? "取消归档" : "归档"} ${o.name}`}
          onClick={() =>
            void run(
              {
                type: "saveOpportunity",
                value: { ...o, archived: !o.archived },
              },
              o.archived ? "已取消归档" : "已归档",
            )
          }
        >
          <Archive size={15} />
        </button>
        <button
          className="icon-button danger-text"
          aria-label={`删除 ${o.name}`}
          onClick={() => {
            if (
              confirm(
                `删除“${o.name}”？关联任务、沟通和动态也会删除。此操作不可撤销。`,
              )
            )
              void run({ type: "deleteOpportunity", id: o.id }, "机会已删除");
          }}
        >
          <Trash2 size={15} />
        </button>
      </div>
    );
  }
  return (
    <>
      <PageTitle
        eyebrow="DISCOVER YOUR NEXT OPPORTUNITY"
        title="研究机会"
        description="把值得探索的方向，变成值得投入的机会。"
        actions={
          <button className="button primary" onClick={() => setEditor("new")}>
            <Plus size={16} />
            添加机会
          </button>
        }
      />
      <div className="collection-tabs">
        <button
          className={!filters.archived ? "active" : ""}
          onClick={() => filter("archived", false)}
        >
          全部机会{" "}
          <b>{state.opportunities.filter((o) => !o.archived).length}</b>
        </button>
        <button
          className={filters.archived ? "active" : ""}
          onClick={() => filter("archived", true)}
        >
          <Archive size={14} />
          已归档 <b>{state.opportunities.filter((o) => o.archived).length}</b>
        </button>
      </div>
      <div className="filter-toolbar">
        <SearchBox
          value={filters.query || ""}
          onChange={(v) => filter("query", v)}
        />
        <div className="view-toggle">
          <button
            aria-label="列表视图"
            className={!grid ? "active" : ""}
            onClick={() => setGrid(false)}
          >
            <LayoutList size={17} />
          </button>
          <button
            aria-label="卡片视图"
            className={grid ? "active" : ""}
            onClick={() => setGrid(true)}
          >
            <Grid2X2 size={17} />
          </button>
        </div>
      </div>
      <div className="filters">
        <SlidersHorizontal size={15} />
        {(
          [
            {
              key: "area",
              label: "全部研究方向",
              values: Array.from(
                new Set(state.opportunities.flatMap((o) => o.areas)),
              ).sort(),
            },
            { key: "priority", label: "全部优先级", values: PRIORITIES },
            { key: "status", label: "全部申请阶段", values: STAGES },
            {
              key: "type",
              label: "全部岗位类别",
              values: Array.from(
                new Set(state.opportunities.map((o) => o.type)),
              ).sort(),
            },
            {
              key: "compensation",
              label: "全部薪酬",
              values: ["Paid", "Unpaid", "Unknown"],
            },
            { key: "verification", label: "核实状态", values: ["yes", "no"] },
          ] as const
        ).map(({ key, label, values }) => (
          <select
            key={key}
            aria-label={label}
            value={String(filters[key] || "")}
            onChange={(e) => filter(key, e.target.value)}
          >
            <option value="">{label}</option>
            {values.map((v) => (
              <option value={v} key={v}>
                {key === "status"
                  ? STAGE_LABELS[v as keyof typeof STAGE_LABELS]
                  : key === "verification"
                    ? v === "yes"
                      ? "需要核实"
                      : "其他状态"
                    : v}
              </option>
            ))}
          </select>
        ))}
        <button
          className="text-button"
          onClick={() => {
            setFilters({ archived: filters.archived });
            setParams({}, { replace: true });
          }}
        >
          重置
        </button>
      </div>
      <div className="results-bar">
        <span>
          {rows.length} 个机会{" "}
          <span className="muted">
            · {filters.archived ? "归档记录" : "持续探索，逐步推进"}
          </span>
        </span>
        <div>
          <ArrowUpDown size={13} />
          <select
            aria-label="主排序"
            value={filters.sort || "priority"}
            onChange={(e) => filter("sort", e.target.value)}
          >
            <option value="priority">优先级</option>
            <option value="deadline">官方截止日期</option>
            <option value="targetDate">个人目标日期</option>
            <option value="updatedAt">最近更新</option>
            <option value="name">名称</option>
          </select>
          <select
            aria-label="次排序"
            value={filters.secondarySort || "name"}
            onChange={(e) => filter("secondarySort", e.target.value)}
          >
            <option value="name">其次按名称</option>
            <option value="priority">其次按优先级</option>
            <option value="deadline">其次按截止日期</option>
          </select>
        </div>
      </div>
      {rows.length ? (
        grid ? (
          <div className="opportunity-grid">
            {rows.map((o) => (
              <article className="opportunity-card panel" key={o.id}>
                <div className="flex-between">
                  <span className="muted mono">{o.id}</span>
                  <Priority value={o.priority} />
                </div>
                <h3>
                  <DetailLink opportunity={o} />
                </h3>
                <p className="muted">
                  {o.organization} ·{" "}
                  {state.contacts.find((c) => c.id === o.contactId)?.name ||
                    "联系人待确认"}
                </p>
                <div className="tags">
                  {o.areas.map((a) => (
                    <span key={a}>{a}</span>
                  ))}
                </div>
                <Availability value={o.availability} />
                <div className="card-bottom">
                  <StageSelect opportunity={o} />
                  <span>{o.compensation}</span>
                </div>
                {actions(o)}
              </article>
            ))}
          </div>
        ) : (
          <div className="table-scroll panel">
            <table className="opportunities-table">
              <thead>
                <tr>
                  <th>机会 / 实验室</th>
                  <th>Priority</th>
                  <th>我的申请阶段</th>
                  <th>开放状态</th>
                  <th>薪酬 / 工作模式</th>
                  <th>官方截止 / 目标日期</th>
                  <th>快捷操作</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <span className="table-id">{o.id}</span>
                      <DetailLink opportunity={o} />
                      <span className="table-sub">
                        {o.organization} ·{" "}
                        {state.contacts.find((c) => c.id === o.contactId)
                          ?.name ||
                          o.contactEmail ||
                          "联系人待确认"}
                      </span>
                      <div className="tags">
                        {o.areas.slice(0, 3).map((a) => (
                          <span key={a}>{a}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <Priority value={o.priority} />
                    </td>
                    <td>
                      <StageSelect opportunity={o} />
                    </td>
                    <td>
                      <Availability value={o.availability} />
                    </td>
                    <td>
                      <span className="cell-stack">
                        {o.compensation}
                        <small>{o.workMode}</small>
                      </span>
                    </td>
                    <td>
                      <span className="cell-stack">
                        {o.deadline ? displayDate(o.deadline) : "截止日期未知"}
                        <small>
                          个人目标：
                          {o.targetDate ? displayDate(o.targetDate) : "未设定"}
                        </small>
                      </span>
                    </td>
                    <td>{actions(o)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <Empty
          title="没有匹配的研究机会"
          description="试试其他关键词或重置筛选，也可以添加自己的研究线索。"
          action={
            <button className="button" onClick={() => setFilters({})}>
              显示全部机会
            </button>
          }
        />
      )}
      <p className="footnote">
        开放状态与个人申请阶段分别记录。初始线索均需核实，不代表当前招聘承诺。
      </p>
      {editor && (
        <OpportunityEditor
          opportunity={editor === "new" ? undefined : editor}
          onClose={() => setEditor(null)}
        />
      )}
    </>
  );
}
