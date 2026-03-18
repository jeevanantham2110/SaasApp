"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft, CheckCircle2, XCircle, Clock, AlertCircle,
  RefreshCw, ChevronDown, ChevronRight, Activity, Loader2
} from "lucide-react";
import { api } from "@/services/api";
import { Execution, ExecutionLog } from "@/types";
import toast from "react-hot-toast";

const statusConfig: Record<string, { icon: React.ReactNode; badge: string; label: string }> = {
  completed: {
    icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
    label: "Completed",
  },
  failed: {
    icon: <XCircle className="h-5 w-5 text-rose-500" />,
    badge: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20",
    label: "Failed",
  },
  canceled: {
    icon: <AlertCircle className="h-5 w-5 text-amber-500" />,
    badge: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
    label: "Canceled",
  },
  in_progress: {
    icon: <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />,
    badge: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20",
    label: "In Progress",
  },
  pending: {
    icon: <Clock className="h-5 w-5 text-slate-400" />,
    badge: "bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-500/20",
    label: "Pending",
  },
};

function LogEntry({ log }: { log: ExecutionLog }) {
  const [expanded, setExpanded] = useState(true);
  const l = log.log;
  const status = l.status as string;
  const cfg = statusConfig[status] || statusConfig.pending;

  return (
    <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
      {/* Row header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50/60 transition-colors"
      >
        {cfg.icon}
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-foreground truncate">{l.step_name || "—"}</span>
          <span className="ml-2 text-xs text-slate-400 font-mono">{l.step_type}</span>
        </div>
        {l.selected_next_step ? (
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <ChevronRight className="h-3 w-3" />
            {l.selected_next_step}
          </span>
        ) : (
          <span className="text-xs text-emerald-600 font-medium">Terminal</span>
        )}
        <span className={`ml-3 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cfg.badge}`}>
          {cfg.label}
        </span>
        {expanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-border divide-y divide-border">
          {/* Timing */}
          <div className="px-4 py-3 grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 uppercase tracking-wider font-medium block mb-1">Started</span>
              <span className="font-mono text-slate-600">{l.started_at ? format(new Date(l.started_at), "HH:mm:ss.SSS") : "—"}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase tracking-wider font-medium block mb-1">Ended</span>
              <span className="font-mono text-slate-600">{l.ended_at ? format(new Date(l.ended_at), "HH:mm:ss.SSS") : "—"}</span>
            </div>
          </div>

          {/* Rules */}
          {Array.isArray(l.evaluated_rules) && l.evaluated_rules.length > 0 && (
            <div className="px-4 py-3">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-medium block mb-2">
                Evaluated Rules
              </span>
              <div className="space-y-1.5">
                {l.evaluated_rules.map((r: any, i: number) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-mono ${
                      r.matched
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-slate-50 text-slate-500 border border-slate-200"
                    }`}
                  >
                    {r.matched ? (
                      <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                    ) : (
                      <span className="h-3 w-3 rounded-full border border-slate-300 shrink-0" />
                    )}
                    <span className="flex-1 truncate">{r.condition}</span>
                    <span className="text-[10px] text-slate-400 shrink-0">p={r.priority ?? i}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {l.error_message && (
            <div className="px-4 py-3">
              <span className="text-xs text-rose-400 uppercase tracking-wider font-medium block mb-1">Error</span>
              <p className="text-xs text-rose-700 font-mono bg-rose-50 px-2 py-1 rounded border border-rose-200">
                {l.error_message}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ExecutionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [execution, setExecution] = useState<Execution | null>(null);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);

  const loadExecution = useCallback(async () => {
    if (!params.id) return;
    try {
      const [exec, execLogs] = await Promise.all([
        api.getExecution(params.id as string),
        api.getExecutionLogs(params.id as string),
      ]);
      setExecution(exec);
      setLogs(execLogs);
      return exec;
    } catch (error) {
      toast.error("Failed to load execution");
      console.error(error);
    }
  }, [params.id]);

  useEffect(() => {
    loadExecution().then((exec) => {
      setIsLoading(false);
      // Auto-poll while pending/in-progress
      if (exec && (exec.status === "pending" || exec.status === "in_progress")) {
        setIsPolling(true);
      }
    });
  }, [loadExecution]);

  // Polling logic
  useEffect(() => {
    if (!isPolling) return;
    const interval = setInterval(async () => {
      const exec = await loadExecution();
      if (exec && exec.status !== "pending" && exec.status !== "in_progress") {
        setIsPolling(false);
        clearInterval(interval);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [isPolling, loadExecution]);

  if (isLoading)
    return <div className="p-12 text-center text-slate-500 animate-pulse">Loading execution...</div>;
  if (!execution)
    return <div className="p-12 text-center text-slate-500">Execution not found.</div>;

  const cfg = statusConfig[execution.status] || statusConfig.pending;
  const duration =
    execution.started_at && execution.ended_at
      ? `${((new Date(execution.ended_at).getTime() - new Date(execution.started_at).getTime()) / 1000).toFixed(2)}s`
      : "—";

  return (
    <div className="space-y-8 fade-in">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push("/executions")}
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-foreground transition-colors group mb-4"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Executions
        </button>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              {cfg.icon}
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Execution Detail
              </h1>
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${cfg.badge}`}>
                {cfg.label}
                {isPolling && <Activity className="ml-1.5 h-3 w-3 animate-spin" />}
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400 pl-8">{execution.id}</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => loadExecution()}
              className="inline-flex items-center gap-1.5 rounded-lg text-sm font-medium transition-colors border border-border bg-white hover:bg-slate-50 text-slate-700 h-9 px-3 shadow-sm"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
            <Link
              href={`/workflows/${execution.workflow_id}`}
              className="inline-flex items-center gap-1.5 rounded-lg text-sm font-medium transition-colors bg-accent text-white hover:bg-accent-hover h-9 px-4 shadow-sm"
            >
              View Workflow
            </Link>
          </div>
        </div>
      </div>

      {/* Meta info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Workflow ID", value: execution.workflow_id.slice(0, 8) + "...", mono: true },
          { label: "Version", value: `v${execution.workflow_version}`, mono: true },
          { label: "Triggered By", value: execution.triggered_by || "System" },
          { label: "Duration", value: duration, mono: true },
        ].map((item) => (
          <div key={item.label} className="p-4 rounded-xl border border-border bg-background shadow-sm">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-medium block mb-1">
              {item.label}
            </span>
            <span className={`text-sm font-semibold text-foreground ${item.mono ? "font-mono" : ""}`}>
              {item.value}
            </span>
          </div>
        ))}
      </div>

      {/* Input data */}
      {execution.data && Object.keys(execution.data).length > 0 && (
        <div className="rounded-xl border border-border bg-background shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-slate-50/50">
            <h3 className="font-semibold text-sm text-foreground">Input Data</h3>
          </div>
          <pre className="p-5 text-xs font-mono text-slate-600 overflow-x-auto m-0">
            {JSON.stringify(execution.data, null, 2)}
          </pre>
        </div>
      )}

      {/* Execution logs */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">
          Step Logs
          <span className="ml-2 text-sm font-normal text-slate-400">
            ({logs.length} {logs.length === 1 ? "step" : "steps"})
          </span>
        </h2>

        {isPolling && logs.length === 0 && (
          <div className="flex items-center gap-3 p-6 rounded-xl border border-border bg-background text-slate-500 text-sm">
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            Waiting for execution to process...
          </div>
        )}

        {logs.length === 0 && !isPolling && (
          <div className="p-8 rounded-xl border border-border bg-background text-center text-slate-400 text-sm">
            No step logs available.
          </div>
        )}

        <div className="space-y-3">
          {logs.map((log) => (
            <LogEntry key={log.id} log={log} />
          ))}
        </div>
      </div>
    </div>
  );
}
