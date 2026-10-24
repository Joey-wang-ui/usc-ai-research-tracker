import { useEffect, useRef, type ReactNode } from "react";
import { ArrowUpRight, X, Search, Inbox } from "lucide-react";
import { Link } from "react-router-dom";
import {
  AVAILABILITY_LABELS,
  STAGES,
  STAGE_LABELS,
  safeUrl,
  type Opportunity,
  type Stage,
} from "../types";
import { useStore } from "../lib/store";
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const elements = ref.current?.querySelectorAll<HTMLElement>(
          'button,input,select,textarea,a[href],[tabindex="0"]',
        );
        if (!elements?.length) return;
        const first = elements[0],
          last = elements[elements.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [onClose]);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        tabIndex={-1}
        className={`modal ${wide ? "wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="icon-button" aria-label="关闭" onClick={onClose}>
            <X size={19} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
export function PageTitle({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="heading-actions">{actions}</div>
    </div>
  );
}
export function Priority({ value }: { value: Opportunity["priority"] }) {
  return <span className={`priority priority-${value}`}>{value}</span>;
}
export function StageBadge({ stage }: { stage: Stage }) {
  return (
    <span className={`stage stage-${stage}`}>
      <i />
      {STAGE_LABELS[stage]}
    </span>
  );
}
export function StageSelect({ opportunity }: { opportunity: Opportunity }) {
  const { run, busy } = useStore();
  return (
    <select
      className={`status-select stage-${opportunity.status}`}
      aria-label={`申请阶段 ${opportunity.name}`}
      disabled={busy}
      value={opportunity.status}
      onChange={(e) =>
        void run({
          type: "status",
          id: opportunity.id,
          status: e.target.value as Stage,
        })
      }
    >
      {STAGES.map((s) => (
        <option key={s} value={s}>
          {STAGE_LABELS[s]}
        </option>
      ))}
    </select>
  );
}
export function Availability({ value }: { value: string }) {
  return (
    <span className={`availability ${value === "Open" ? "open" : ""}`}>
      <i />
      {AVAILABILITY_LABELS[value]}
    </span>
  );
}
export function SourceLink({
  url,
  label = "官方来源",
}: {
  url: string;
  label?: string;
}) {
  const safe = safeUrl(url);
  return safe ? (
    <a
      className="source-link"
      href={safe}
      target="_blank"
      rel="noopener noreferrer"
    >
      {label}
      <ArrowUpRight size={14} />
    </a>
  ) : (
    <span className="muted">来源未填写</span>
  );
}
export function Empty({
  title = "这里还没有内容",
  description = "添加一条记录，开始你的下一步。",
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <Inbox size={28} />
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function SearchBox({
  value,
  onChange,
  placeholder = "搜索机会、导师、关键词…",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="search-box">
      <Search size={17} />
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button aria-label="清除搜索" onClick={() => onChange("")}>
          <X size={14} />
        </button>
      )}
    </label>
  );
}
export function Panel({
  title,
  meta,
  action,
  children,
  className = "",
}: {
  title: string;
  meta?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          {meta && <span>{meta}</span>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
export function DetailLink({ opportunity }: { opportunity: Opportunity }) {
  return (
    <Link className="opportunity-title" to={`/opportunities/${opportunity.id}`}>
      {opportunity.name}
    </Link>
  );
}
export function FormError({ error }: { error: string }) {
  return error ? (
    <p className="form-error" role="alert">
      {error}
    </p>
  ) : null;
}
export function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`field ${className}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}
