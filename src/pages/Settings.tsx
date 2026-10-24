import { useRef, useState, type ChangeEvent } from "react";
import {
  Download,
  Upload,
  ShieldCheck,
  Database,
  Sun,
  Moon,
  RotateCcw,
  Trash2,
  HardDrive,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { useStore } from "../lib/store";
import { createSeed } from "../data/seed";
import { exportCsv, parseBackup } from "../lib/model";
import { download } from "../lib/files";
import { today } from "../lib/dates";
import { Empty, Modal, PageTitle, Panel } from "../components/ui";
import type { AppState } from "../types";
export default function Settings() {
  const { state, run, notify, busy } = useStore(),
    input = useRef<HTMLInputElement>(null),
    [backup, setBackup] = useState<AppState | null>(null),
    [error, setError] = useState(""),
    [persistent, setPersistent] = useState("");
  async function importFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 15_000_000)
        throw Error("文件超过 15 MB，请选择较小的备份。");
      setBackup(parseBackup(await file.text()));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      e.target.value = "";
    }
  }
  function exportJSON() {
    download(
      JSON.stringify(state, null, 2),
      `usc-research-backup-${today()}.json`,
      "application/json",
    );
    notify("备份已导出，请保存在安全位置。");
  }
  async function restore() {
    if (
      !confirm(
        "恢复默认的 21 条研究线索？只补回缺失的默认机会，不覆盖已有修改或自定义数据。",
      )
    )
      return;
    const seeds = createSeed(),
      next = structuredClone(state);
    for (const o of seeds.opportunities) {
      if (!next.opportunities.some((x) => x.id === o.id)) {
        if (o.contactId && !next.contacts.some((c) => c.id === o.contactId)) {
          const c = seeds.contacts.find((c) => c.id === o.contactId);
          if (c) next.contacts.push(c);
        }
        next.opportunities.push(o);
      }
    }
    await run(
      { type: "replace", value: next },
      "已补回缺失的默认机会，现有修改已保留",
    );
  }
  async function clear() {
    if (
      !confirm(
        "这会删除此浏览器中的全部机会、联系人、任务、沟通及动态。建议先导出 JSON 备份。继续？",
      )
    )
      return;
    if (prompt("二次确认：输入 CLEAR 才会清空数据") !== "CLEAR") {
      notify("清空操作已取消");
      return;
    }
    await run(
      {
        type: "replace",
        value: {
          schemaVersion: 1,
          opportunities: [],
          contacts: [],
          tasks: [],
          histories: [],
          activities: [],
          theme: state.theme,
        },
      },
      "已清空本地数据，不会自动重新初始化",
    );
  }
  return (
    <>
      <PageTitle
        eyebrow="A WORKSPACE THAT STAYS YOURS"
        title="设置与数据"
        description="你的研究计划，由你掌握。定期备份，安心继续。"
      />
      <div className="data-warning">
        <div className="warning-icon">
          <HardDrive size={23} />
        </div>
        <div>
          <h2>数据只保存在当前浏览器，不会自动跨设备同步</h2>
          <p>
            GitHub Pages
            只托管网站。不同设备、浏览器或网站地址拥有独立的数据；清除浏览器数据、隐私模式或存储回收可能导致丢失。请定期导出
            JSON，在其他设备导入恢复。
          </p>
          <span>备份包含个人笔记和沟通记录，请妥善保存。</span>
        </div>
      </div>
      <div className="settings-grid">
        <div>
          <Panel title="外观" meta="Appearance">
            <div className="theme-choices">
              <button
                className={`theme-choice dark-preview ${state.theme === "dark" ? "selected" : ""}`}
                onClick={() =>
                  void run({ type: "theme", value: "dark" }, "深色主题已保存")
                }
              >
                <div className="theme-mini">
                  <i />
                  <span />
                  <span />
                  <span />
                </div>
                <span>
                  <Moon size={15} />
                  Dark Mode{state.theme === "dark" && <b>当前</b>}
                </span>
              </button>
              <button
                className={`theme-choice light-preview ${state.theme === "light" ? "selected" : ""}`}
                onClick={() =>
                  void run({ type: "theme", value: "light" }, "浅色主题已保存")
                }
              >
                <div className="theme-mini">
                  <i />
                  <span />
                  <span />
                  <span />
                </div>
                <span>
                  <Sun size={15} />
                  Light Mode{state.theme === "light" && <b>当前</b>}
                </span>
              </button>
            </div>
          </Panel>
          <Panel title="备份与恢复" meta="Backup & Restore">
            <div className="settings-row">
              <div className="settings-icon">
                <Download size={19} />
              </div>
              <div>
                <h3>导出完整 JSON 备份</h3>
                <p>包含机会、联系人、任务、沟通记录、清单、动态与主题。</p>
              </div>
              <button className="button" onClick={exportJSON}>
                导出 JSON
              </button>
            </div>
            <div className="settings-row">
              <div className="settings-icon">
                <Upload size={19} />
              </div>
              <div>
                <h3>从 JSON 恢复</h3>
                <p>先验证结构和关联关系，再确认替换。支持本应用 v1 格式。</p>
              </div>
              <button className="button" onClick={() => input.current?.click()}>
                导入 JSON
              </button>
              <input
                ref={input}
                type="file"
                accept=".json,application/json"
                className="sr-only"
                aria-label="导入 JSON 文件"
                onChange={(e) => void importFile(e)}
              />
            </div>
            {error && (
              <div className="form-error" role="alert">
                <strong>未导入，原有数据保持不变。</strong>
                <p>{error}</p>
              </div>
            )}
            <div className="settings-row">
              <div className="settings-icon">
                <Database size={19} />
              </div>
              <div>
                <h3>导出 CSV 表格</h3>
                <p>机会主要字段，可在 Excel 中打开。完整恢复请使用 JSON。</p>
              </div>
              <button
                className="button"
                onClick={() => {
                  download(
                    exportCsv(state),
                    `usc-opportunities-${today()}.csv`,
                    "text/csv",
                  );
                  notify("CSV 已导出");
                }}
              >
                导出 CSV
              </button>
            </div>
            <div className="settings-row">
              <div className="settings-icon">
                <ShieldCheck size={19} />
              </div>
              <div>
                <h3>申请持久存储</h3>
                <p>
                  {persistent || "尽量降低浏览器自动回收风险，仍需定期备份。"}
                </p>
              </div>
              <button
                className="button"
                onClick={async () => {
                  try {
                    const granted = await navigator.storage?.persist?.();
                    setPersistent(
                      granted
                        ? "浏览器已授予持久存储，仍请保留备份。"
                        : "浏览器未授予持久存储，请定期备份。",
                    );
                  } catch {
                    setPersistent("此浏览器不支持该请求，请定期备份。");
                  }
                }}
              >
                检查存储
              </button>
            </div>
          </Panel>
          <Panel title="数据管理" meta="Manage Local Data">
            <div className="settings-row">
              <div className="settings-icon">
                <RotateCcw size={19} />
              </div>
              <div>
                <h3>恢复默认研究线索</h3>
                <p>补回缺失的默认机会，保留现有修改、自定义数据和联系人。</p>
              </div>
              <button className="button" onClick={() => void restore()}>
                恢复默认机会
              </button>
            </div>
            <div className="settings-row danger-zone">
              <div className="settings-icon">
                <Trash2 size={19} />
              </div>
              <div>
                <h3>清空全部数据</h3>
                <p>不可撤销，需要二次确认。清空后不会再次自动初始化。</p>
              </div>
              <button className="button danger" onClick={() => void clear()}>
                清空数据
              </button>
            </div>
          </Panel>
        </div>
        <aside>
          <Panel title="本地工作区" meta="Stored on this browser">
            <div className="storage-stats">
              {[
                ["研究机会", state.opportunities.length],
                ["联系人", state.contacts.length],
                ["任务", state.tasks.length],
                ["沟通记录", state.histories.length],
                ["动态记录", state.activities.length],
              ].map(([label, num]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{num}</strong>
                </div>
              ))}
            </div>
            <div className="storage-size">
              <Database size={15} />
              {(new Blob([JSON.stringify(state)]).size / 1024).toFixed(1)} KB ·
              IndexedDB
            </div>
          </Panel>
          <Panel title="关于此工具" meta="USC AI Research Tracker">
            <div className="about-copy">
              <p>Research Opportunities & Application Management</p>
              <p>
                为 Spring 2027 USC MS in Analytics
                及之后的研究旅程打造的个人申请管理工具。
              </p>
              <strong>个人管理工具，非 USC 官方网站。</strong>
              <p>
                不提供录取概率预测，不保证研究机会当前开放。所有岗位信息以官方来源为准。
              </p>
              <p>无账户、无服务器、无数据上传，也不会自动发送邮件。</p>
              <a
                className="subtle-link"
                href="https://www.usc.edu/"
                target="_blank"
                rel="noopener noreferrer"
              >
                USC 官方网站 <ExternalLink size={13} />
              </a>
              <span className="version">VERSION 1.0.0 · LOCAL FIRST</span>
            </div>
          </Panel>
        </aside>
      </div>
      {backup && (
        <Modal title="确认恢复备份" onClose={() => setBackup(null)}>
          <div className="modal-body">
            <div className="inline-notice">
              <AlertTriangle size={19} />
              恢复会完整替换当前浏览器的数据。
            </div>
            <p>
              已验证：{backup.opportunities.length} 个机会、
              {backup.contacts.length} 位联系人、{backup.tasks.length} 个任务、
              {backup.histories.length} 条沟通和 {backup.activities.length}{" "}
              条动态。
            </p>
            <p className="muted">请先备份当前数据。此操作不是合并导入。</p>
            {!backup.opportunities.length && (
              <Empty
                title="这是一个空机会备份"
                description="确认后当前机会将全部清空。"
              />
            )}
          </div>
          <div className="modal-footer">
            <button className="button" onClick={exportJSON}>
              先备份当前数据
            </button>
            <button
              className="button primary"
              disabled={busy}
              onClick={() =>
                void run({ type: "replace", value: backup }, "备份已恢复").then(
                  (ok) => {
                    if (ok) setBackup(null);
                  },
                )
              }
            >
              确认替换并恢复
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
