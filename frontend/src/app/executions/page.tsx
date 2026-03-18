"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { CheckCircle2, Clock, XCircle, AlertCircle, RefreshCw, FileText, Activity } from "lucide-react";
import { Execution } from "@/types";
import { api } from "@/services/api";
import toast from "react-hot-toast";

export default function ExecutionsPage() {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await api.listExecutions();
      setExecutions(data);
    } catch (error) {
      toast.error("Failed to load executions");
      setExecutions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-rose-500" />;
      case 'canceled': return <AlertCircle className="h-4 w-4 text-amber-500" />;
      default: return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20';
      case 'failed': return 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20';
      case 'canceled': return 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20';
      default: return 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20';
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-2xl font-semibold tracking-tight text-foreground">Execution Audit Log</h1>
           <p className="text-sm text-slate-500 mt-1">Review the history and status of all workflow runs.</p>
        </div>
        <button
            onClick={loadData}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all bg-white border border-border hover:bg-slate-50 active:scale-[0.98] text-slate-700 h-10 px-4 py-2 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> 
            Refresh
        </button>
      </div>

      <div className="rounded-xl border border-border bg-background shadow-sm overflow-hidden">
        <div className="relative w-full overflow-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 bg-slate-50/50 border-b border-border uppercase tracking-wider">
              <tr>
                <th className="h-12 px-6 font-medium w-32">ID</th>
                <th className="h-12 px-6 font-medium">Workflow</th>
                <th className="h-12 px-6 font-medium">Status</th>
                <th className="h-12 px-6 font-medium">Triggered By</th>
                <th className="h-12 px-6 font-medium">Started</th>
                <th className="h-12 px-6 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                     <div className="flex items-center justify-center gap-2">
                        <Activity className="animate-spin" size={16} />
                        <span>Loading audit logs...</span>
                     </div>
                  </td>
                </tr>
              ) : executions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                     <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                           <FileText className="w-6 h-6 text-slate-400" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">No execution logs found</p>
                          <p className="text-sm text-slate-500">Trigger a workflow to see its logs here.</p>
                        </div>
                      </div>
                  </td>
                </tr>
              ) : (
                executions.map((execution) => (
                  <tr key={execution.id} className="transition-colors hover:bg-slate-50/50 group">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500" title={execution.id}>
                        {execution.id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex flex-col">
                            <span className="font-medium text-foreground">{execution.workflow_id}</span>
                            <span className="text-xs text-slate-500 font-mono">v{execution.workflow_version}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 capitalize rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadge(execution.status)}`}>
                        {getStatusIcon(execution.status)}
                        {execution.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">
                        {execution.triggered_by || 'System'}
                    </td>
                    <td className="px-6 py-4 text-slate-500 flex items-center gap-1.5 mt-1">
                      <Clock size={14} className="text-slate-400" />
                      {format(new Date(execution.started_at), 'MMM d, HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link 
                            href={`/executions/${execution.id}`}
                            className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors border border-border bg-white hover:bg-slate-50 text-slate-700 h-8 px-3 shadow-sm"
                          >
                            <FileText className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
                            Details
                          </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
