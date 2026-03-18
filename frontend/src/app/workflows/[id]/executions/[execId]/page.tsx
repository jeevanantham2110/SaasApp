"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, CheckCircle2, Clock, XCircle, AlertCircle, RefreshCw, FileText, ChevronRight, Activity } from "lucide-react";
import { api } from "@/services/api";
import { Execution, ExecutionLog, WorkflowWithSteps } from "@/types";
import toast from "react-hot-toast";

export default function ExecutionLogsPage() {
  const params = useParams();
  const router = useRouter();
  const [execution, setExecution] = useState<Execution | null>(null);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [workflow, setWorkflow] = useState<WorkflowWithSteps | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const execId = params.execId as string;
  const workflowId = params.id as string;

  useEffect(() => {
    if (execId && workflowId) {
      loadData();
    }
  }, [execId, workflowId]);

  const loadData = async () => {
    try {
      const [execData, logData, wfData] = await Promise.all([
        api.getExecution(execId),
        api.getExecutionLogs(execId),
        api.getWorkflow(workflowId)
      ]);
      setExecution(execData);
      setLogs(logData);
      setWorkflow(wfData);
    } catch (error) {
      toast.error("Failed to load execution details");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'failed': return <XCircle className="h-5 w-5 text-rose-500" />;
      case 'canceled': return <AlertCircle className="h-5 w-5 text-amber-500" />;
      default: return <Clock className="h-5 w-5 text-blue-500 animate-pulse" />;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20';
      case 'failed': return 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20';
      case 'canceled': return 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20';
      default: return 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20';
    }
  };

  if (isLoading) return <div className="p-12 text-center text-slate-500 animate-pulse">Loading execution details...</div>;
  if (!execution) return <div className="p-12 text-center text-slate-500">Execution not found.</div>;

  return (
    <div className="space-y-8 fade-in pb-12">
      <div className="flex flex-col gap-4">
        <div>
          <Link href={`/workflows/${workflowId}`} className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-foreground transition-colors mb-4 group">
            <ArrowLeft className="mr-1.5 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Workflow
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">Execution Details</h1>
                    <span className={`inline-flex items-center capitalize rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBg(execution.status)}`}>
                    {execution.status}
                    </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500 pl-1">
                    <span>ID: <code className="text-xs font-mono bg-slate-100 px-1 rounded">{execution.id}</code></span>
                    <span>•</span>
                    <span>Triggered by: {execution.triggered_by || 'System'}</span>
                </div>
            </div>
            
            <div className="flex gap-3">
                <button
                    onClick={loadData}
                    className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors border border-border bg-white text-slate-700 hover:bg-slate-50 h-10 px-4 shadow-sm"
                >
                    <RefreshCw className="h-4 w-4" /> Refresh
                </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-6">
           <div className="rounded-xl border border-border bg-background shadow-sm overflow-hidden group">
             <div className="px-5 py-4 border-b border-border bg-slate-50/50 flex items-center gap-2">
               <FileText size={16} className="text-slate-400" />
               <h3 className="font-semibold text-sm text-foreground">Input Data</h3>
             </div>
             <div className="relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent/20 to-purple-500/20" />
                <pre className="p-5 text-[11px] font-mono text-slate-600 m-0 overflow-x-auto leading-relaxed">
                  {JSON.stringify(execution.data, null, 2)}
                </pre>
             </div>
          </div>
          <div className="rounded-xl border border-border bg-background shadow-sm overflow-hidden">
             <div className="px-5 py-4 border-b border-border bg-slate-50/50 flex items-center gap-2">
               <Clock size={16} className="text-slate-400" />
               <h3 className="font-semibold text-sm text-foreground">Timing</h3>
             </div>
             <div className="p-5 space-y-4 text-sm">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Started</span>
                    <span className="font-medium text-foreground">{format(new Date(execution.started_at), 'MMM d, HH:mm:ss')}</span>
                </div>
                {execution.ended_at && (
                    <div className="flex justify-between items-center text-sm border-t border-border pt-4">
                        <span className="text-slate-500 font-medium">Ended</span>
                        <span className="font-medium text-foreground">{format(new Date(execution.ended_at), 'MMM d, HH:mm:ss')}</span>
                    </div>
                )}
             </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="rounded-xl border border-border bg-background shadow-sm overflow-hidden flex flex-col h-full">
             <div className="px-5 py-4 border-b border-border bg-slate-50/50 flex justify-between items-center">
               <h3 className="font-semibold text-sm text-foreground">Execution Path Log</h3>
               <span className="text-xs font-medium text-slate-600 bg-white px-2 py-1 rounded-full border border-border shadow-sm">
                   {logs.length} events
               </span>
             </div>
             <div className="flex-1 bg-slate-50/30 p-2 md:p-4">
                {logs.length > 0 ? (
                  <div className="relative space-y-4">
                    {/* Activity Line */}
                    <div className="absolute left-[2.25rem] top-8 bottom-8 w-px bg-border -z-10" />
                    
                    {logs.map((log, index) => (
                      <div key={log.id} className="relative p-5 bg-white rounded-lg border border-border shadow-sm hover:shadow transition-shadow hover:border-accent/30 group">
                        <div className="flex items-start gap-4">
                            <div className="mt-0.5 bg-white ring-4 ring-white rounded-full">
                                {getStatusIcon(log.log.status)}
                            </div>
                            <div className="flex-1 space-y-3">
                               <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                                   <div>
                                       <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
                                           {log.log.step_name || 'System Action'}
                                           <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                               {log.log.step_type}
                                           </span>
                                       </h4>
                                   </div>
                                   <div className="text-[11px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded inline-block border border-slate-100">
                                       {format(new Date(log.timestamp), 'HH:mm:ss.SSS')}
                                   </div>
                               </div>
                               
                               {log.log.evaluated_rules && log.log.evaluated_rules.length > 0 && (
                                   <div className="bg-slate-50/80 rounded-lg border border-border p-4 text-xs font-mono space-y-3 shadow-inner">
                                       <div className="text-slate-500 mb-2 border-b border-border pb-2 font-sans font-medium text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                                           Evaluated Rules
                                       </div>
                                       {log.log.evaluated_rules.map((r: any, i: number) => (
                                           <div key={i} className={`flex items-start gap-2.5 ${r.result ? 'text-emerald-700' : 'text-slate-500'} bg-white p-2.5 rounded border border-border shadow-sm`}>
                                               <span className={`shrink-0 flex items-center justify-center w-4 h-4 rounded-full ${r.result ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                                   {r.result ? '✓' : '✗'}
                                               </span>
                                               <span className="break-all pt-0.5 leading-relaxed font-medium">{r.rule}</span>
                                           </div>
                                       ))}
                                   </div>
                               )}

                               {log.log.selected_next_step && (
                                   <div className="text-xs mt-3 flex items-center gap-2 text-blue-700 bg-blue-50 p-2.5 rounded-lg border border-blue-100/50 w-max shadow-sm pr-4">
                                       <ChevronRight size={14} className="text-blue-500" />
                                       Next path: <span className="font-semibold text-blue-800">{log.log.selected_next_step}</span>
                                   </div>
                               )}
                               
                               {log.log.error_message && (
                                   <div className="text-xs text-rose-700 bg-rose-50 p-3.5 rounded-lg border border-rose-200/50 mt-2 font-medium shadow-sm flex items-start gap-2">
                                        <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                                        <span className="leading-relaxed leading-relaxed">{log.log.error_message}</span>
                                   </div>
                               )}
                            </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center flex flex-col items-center justify-center h-full">
                    <Activity size={24} className="text-slate-300 mb-3" />
                    <p className="text-slate-500 font-medium">No execution logs tracked yet.</p>
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
