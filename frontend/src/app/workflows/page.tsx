"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Plus, Settings, Activity, Clock, Play, Workflow as WorkflowIcon, ChevronRight, Edit } from "lucide-react";
import { api } from "@/services/api";
import { Workflow } from "@/types";
import toast from "react-hot-toast";

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    setIsLoading(true);
    try {
      const data = await api.getWorkflows();
      setWorkflows(data);
    } catch (error) {
      toast.error("Failed to load workflows");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-10 fade-in px-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">Workflows</h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">Manage all your automation sequences in one place.</p>
        </div>
        <Link 
          href="/workflows/new"
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold transition-all bg-accent text-white hover:bg-accent-hover h-12 px-6 shadow-lg shadow-accent/20 active:scale-[0.98]"
        >
          <Plus size={18} strokeWidth={3} />
          New Workflow
        </Link>
      </div>

      <div className="rounded-2xl border border-border/60 bg-white shadow-sm overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-slate-400 bg-slate-50/30 border-b border-border/60 uppercase tracking-[0.15em] font-black">
              <tr>
                <th className="px-8 py-5 font-black">Name</th>
                <th className="px-8 py-5 font-black">Version</th>
                <th className="px-8 py-5 font-black">Status</th>
                <th className="px-8 py-5 font-black">Created</th>
                <th className="px-8 py-5 font-black text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <Activity className="animate-spin text-accent" size={24} />
                      <span className="font-medium animate-pulse">Synchronizing workflows...</span>
                    </div>
                  </td>
                </tr>
              ) : workflows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-inner">
                         <WorkflowIcon className="w-10 h-10 text-slate-200" />
                      </div>
                      <div className="space-y-2 max-w-xs">
                        <p className="font-bold text-foreground text-lg">No pipelines found</p>
                        <p className="text-sm text-slate-400 leading-relaxed">Start by connecting your first business flow to the automation engine.</p>
                      </div>
                      <Link 
                        href="/workflows/new" 
                        className="mt-4 inline-flex gap-2 items-center text-sm bg-slate-900 text-white hover:bg-black px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg active:scale-95"
                      >
                        <Plus size={18} /> Create Pipeline
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                workflows.map((workflow) => (
                  <tr key={workflow.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-8 py-5 font-medium text-foreground">
                       <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${workflow.is_active ? 'bg-accent/10 text-accent' : 'bg-slate-100 text-slate-400'} group-hover:scale-110 transition-transform shadow-sm`}>
                             <WorkflowIcon size={16} />
                          </div>
                          <div className="flex flex-col">
                             <span className="text-sm font-bold tracking-tight">{workflow.name}</span>
                             <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-tighter" title={workflow.id}>ID: {workflow.id.slice(0, 13)}...</span>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-5 text-slate-500">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-wider">v{workflow.version}</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                         workflow.is_active 
                         ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                         : 'bg-slate-50 text-slate-500 border border-slate-100'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${workflow.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                        {workflow.is_active ? 'Operational' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-slate-500">
                      <div className="flex items-center gap-2 font-medium">
                        <Clock size={14} className="text-slate-300" />
                        {format(new Date(workflow.created_at), 'MMM d, yyyy')}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-300">
                        <Link 
                          href={`/workflows/${workflow.id}/execute`}
                          className="inline-flex items-center justify-center rounded-xl text-xs font-bold transition-all hover:bg-accent/20 h-9 w-9 text-accent bg-accent/5"
                          title="Instant Launch"
                        >
                          <Play className="h-4 w-4 ml-0.5" fill="currentColor" />
                        </Link>
                        <Link 
                          href={`/workflows/${workflow.id}`}
                          className="inline-flex items-center justify-center rounded-xl text-xs font-bold transition-all hover:bg-slate-100 text-slate-600 h-9 px-4 border border-border bg-white shadow-sm"
                        >
                          Configure
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
