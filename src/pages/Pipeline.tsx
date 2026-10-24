import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, GripVertical, ArrowRight, CalendarClock } from "lucide-react";
import { useStore } from "../lib/store";
import { STAGES, STAGE_LABELS } from "../types";
import { displayDate } from "../lib/dates";
import { PageTitle, Priority, SearchBox, StageSelect } from "../components/ui";
import { OpportunityEditor } from "../components/forms";
export default function Pipeline() {
  const { state, run } = useStore(),
    [query, setQuery] = useState(""),
    [add, setAdd] = useState(false),
    [drag, setDrag] = useState("");
  const ops = state.opportunities.filter(
    (o) =>
      !o.archived &&
      [o.name, o.organization, ...o.areas]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <PageTitle
        eyebrow="TURN INTENT INTO ACTION"
        title="申请看板"
        description="每一个阶段，都值得认真对待。拖动卡片或使用菜单推进申请。"
        actions={
          <button className="button primary" onClick={() => setAdd(true)}>
            <Plus size={16} />
            添加机会
          </button>
        }
      />
      <div className="pipeline-toolbar">
        <SearchBox value={query} onChange={setQuery} />
        <span className="muted">
          {ops.length} 个活跃机会 · {STAGES.length} 个阶段
        </span>
      </div>
      <div className="kanban">
        {STAGES.map((stage, i) => {
          const rows = ops.filter((o) => o.status === stage);
          return (
            <section
              className={`kanban-column ${drag ? "drop-enabled" : ""}`}
              key={stage}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
              }}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain");
                if (ops.some((o) => o.id === id))
                  void run({ type: "status", id, status: stage });
                setDrag("");
              }}
            >
              <div className="kanban-heading">
                <i className={`color-${i}`} />
                <h2>{STAGE_LABELS[stage]}</h2>
                <b>{rows.length}</b>
                <span>{stage}</span>
              </div>
              <div className="kanban-cards">
                {rows.map((o) => (
                  <article
                    key={o.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", o.id);
                      e.dataTransfer.effectAllowed = "move";
                      setDrag(o.id);
                    }}
                    onDragEnd={() => setDrag("")}
                    className={`kanban-card ${drag === o.id ? "dragging" : ""}`}
                  >
                    <div className="flex-between">
                      <Priority value={o.priority} />
                      <GripVertical className="muted" size={15} />
                    </div>
                    <Link
                      className="opportunity-title"
                      to={`/opportunities/${o.id}`}
                    >
                      {o.name}
                    </Link>
                    <p className="muted">{o.organization}</p>
                    <div className="tags">
                      {o.areas.slice(0, 2).map((a) => (
                        <span key={a}>{a}</span>
                      ))}
                    </div>
                    <div className="kanban-next">
                      <ArrowRight size={13} />
                      <span>{o.nextAction || "尚未设定下一步行动"}</span>
                    </div>
                    <div className="kanban-date">
                      <CalendarClock size={13} />
                      跟进：{displayDate(o.followUpDate)}
                    </div>
                    <StageSelect opportunity={o} />
                  </article>
                ))}
                {!rows.length && (
                  <div className="kanban-empty">
                    拖入机会，或通过菜单移到此阶段
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
      {add && <OpportunityEditor onClose={() => setAdd(false)} />}
    </>
  );
}
