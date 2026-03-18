"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Play, Plus, Settings, Activity, Clock, CheckCircle2, AlertCircle, Workflow as WorkflowIcon, Zap, ChevronRight } from "lucide-react";
import { api } from "@/services/api";
import { Workflow } from "@/types";
import toast from "react-hot-toast";

export default function Dashboard() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
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

  const activeCount = workflows.filter(w => w.is_active).length;
  const draftCount = workflows.length - activeCount;
  const totalSteps = workflows.reduce((acc, w) => acc + (w.step_count || 0), 0);

  return (
    <div className="space-y-10 fade-in px-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Overview
          </h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">
            Project status and automation orchestration dashboard.
          </p>
        </div>
        <Link 
          href="/workflows/new"
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold transition-all bg-accent text-white hover:bg-accent-hover h-12 px-6 shadow-lg shadow-accent/20 active:scale-[0.98]"
        >
          <Plus size={18} strokeWidth={3} />
          Create New Workflow
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Active Pipelines", value: activeCount, icon: Activity, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-100" },
          { label: "Draft Workflows", value: draftCount, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-100" },
          { label: "Total Steps", value: totalSteps, icon: Zap, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-100" },
          { label: "System Health", value: "99.9%", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-100" }
        ].map((metric, i) => (
          <div key={i} className={`p-6 rounded-2xl border ${metric.border} bg-white shadow-sm hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300`}>
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${metric.bg} ${metric.color}`}>
                <metric.icon size={20} />
              </div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{metric.label}</h3>
            </div>
            <p className="text-3xl font-black text-foreground">{isLoading ? "..." : metric.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-bold text-foreground tracking-tight">Recent Pipelines</h2>
            <Link href="/workflows" className="text-sm font-bold text-accent hover:underline flex items-center gap-1">
                View All <ChevronRight size={14} />
            </Link>
        </div>
        
        <div className="rounded-2xl border border-border/60 bg-white shadow-sm overflow-hidden backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] text-slate-400 bg-slate-50/30 border-b border-border/60 uppercase tracking-[0.15em] font-black">
                <tr>
                  <th className="px-8 py-5 font-black">Name</th>
                  <th className="px-8 py-5 font-black">Structure</th>
                  <th className="px-8 py-5 font-black">Version</th>
                  <th className="px-8 py-5 font-black">Status</th>
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
                  workflows.slice(0, 5).map((workflow) => (
                    <tr key={workflow.id} className="hover:bg-slate-50/50 transition-all group">
                      <td className="px-8 py-5">
                         <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${workflow.is_active ? 'bg-accent/10 text-accent' : 'bg-slate-100 text-slate-400'}`}>
                                <WorkflowIcon size={16} />
                            </div>
                            <div>
                                <p className="font-bold text-foreground tracking-tight">{workflow.name}</p>
                                <p className="text-[10px] text-slate-400 font-medium font-mono uppercase mt-0.5">ID: {workflow.id.slice(0, 8)}</p>
                            </div>
                         </div>
                      </td>
                      <td className="px-8 py-5 text-slate-500">
                         <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{workflow.step_count || 0}</span>
                            <span className="text-xs font-medium text-slate-400">connected steps</span>
                         </div>
                      </td>
                      <td className="px-8 py-5">
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
    </div>
  );
}
