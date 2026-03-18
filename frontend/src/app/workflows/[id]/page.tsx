"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, Plus, Settings, Play, Trash2, Edit, Workflow as WorkflowIcon, CodeSquare, CheckCircle2, ChevronRight, AlertCircle } from "lucide-react";
import { api } from "@/services/api";
import { WorkflowWithSteps, Rule } from "@/types";
import toast from "react-hot-toast";

import { WorkflowVisualizer } from "@/components/workflow-visualizer";

export default function WorkflowDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [workflow, setWorkflow] = useState<WorkflowWithSteps | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isStepModalOpen, setIsStepModalOpen] = useState(false);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [rulesByStep, setRulesByStep] = useState<Record<string, Rule[]>>({});
  
  const [newStep, setNewStep] = useState({ name: "", step_type: "task" as any, order: 0 });
  const [newRule, setNewRule] = useState({ condition: "", next_step_id: "", priority: 10 });

  useEffect(() => {
    if (params.id) {
      loadWorkflow(params.id as string);
    }
  }, [params.id]);

  const loadWorkflow = async (id: string) => {
    try {
      const data = await api.getWorkflow(id);
      setWorkflow(data);
      // Load rules for each step
      if (data.steps && data.steps.length > 0) {
        await loadAllRules(data.steps.map(s => s.id));
      }
    } catch (error) {
      toast.error("Failed to load workflow");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllRules = async (stepIds: string[]) => {
    try {
      const results = await Promise.all(stepIds.map(id => api.getRules(id)));
      const map: Record<string, Rule[]> = {};
      stepIds.forEach((id, i) => { map[id] = results[i]; });
      setRulesByStep(map);
    } catch (e) {
      console.error("Failed to load rules", e);
    }
  };

  const handleAddStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workflow) return;
    try {
      await api.createStep(workflow.id, { ...newStep, metadata: {} });
      toast.success("Step added");
      setIsStepModalOpen(false);
      loadWorkflow(workflow.id);
    } catch (error) {
      toast.error("Failed to add step");
    }
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStepId || !workflow) return;
    try {
      await api.createRule(selectedStepId, {
        ...newRule,
        next_step_id: newRule.next_step_id || null
      });
      toast.success("Rule added");
      setIsRuleModalOpen(false);
      setNewRule({ condition: "", next_step_id: "", priority: 10 });
      // Reload rules for the step we just added to
      const rules = await api.getRules(selectedStepId);
      setRulesByStep(prev => ({ ...prev, [selectedStepId]: rules }));
      loadWorkflow(workflow.id);
    } catch (error: any) {
      toast.error(error.message || "Failed to add rule");
    }
  };

  const handleDelete = async () => {
    if (!workflow || !confirm("Are you sure you want to delete this workflow? Everything associated with it will be permanently removed.")) return;
    try {
      await api.deleteWorkflow(workflow.id);
      toast.success("Workflow permanently deleted");
      router.push("/");
    } catch (error) {
      toast.error("Failed to delete workflow");
      console.error(error);
    }
  };

  const handleDeleteStep = async (stepId: string) => {
    if (!confirm("Are you sure you want to delete this step? This will also remove all transition rules starting from this step.")) return;
    try {
      await api.deleteStep(stepId);
      toast.success("Step removed");
      loadWorkflow(workflow!.id);
    } catch (error) {
      toast.error("Failed to remove step");
    }
  };

  const handleDeleteRule = async (stepId: string, ruleId: string) => {
    if (!confirm("Remove this rule?")) return;
    try {
      await api.deleteRule(ruleId);
      toast.success("Rule removed");
      // Reload rules for just this step
      const rules = await api.getRules(stepId);
      setRulesByStep(prev => ({ ...prev, [stepId]: rules }));
    } catch (error) {
      toast.error("Failed to remove rule");
    }
  };

  if (isLoading) return <div className="p-12 text-center text-slate-500 animate-pulse">Loading workflow details...</div>;
  if (!workflow) return <div className="p-12 text-center text-slate-500">Workflow not found.</div>;

  return (
    <div className="space-y-8 fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <button onClick={() => router.push('/')} className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-foreground transition-colors mb-4 group">
            <ArrowLeft className="mr-1.5 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Dashboard
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center border border-accent/20">
                     <WorkflowIcon className="w-5 h-5 text-accent" />
                  </div>
                  <h1 className="text-3xl font-semibold tracking-tight text-foreground">{workflow.name}</h1>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                      workflow.is_active 
                      ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' 
                      : 'bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-500/20'
                  }`}>
                      {workflow.is_active && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                      {workflow.is_active ? 'Active' : 'Draft'}
                  </span>
                  <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-mono font-medium bg-secondary text-secondary-foreground ring-1 ring-inset ring-slate-200">
                      v{workflow.version}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500 pl-1">
                  <span>ID: <code className="text-xs font-mono bg-slate-100 px-1 rounded">{workflow.id}</code></span>
                  <span>•</span>
                  <span>Created {format(new Date(workflow.created_at), 'MMM d, yyyy')}</span>
                </div>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={handleDelete}
                className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors border border-border bg-white text-rose-600 hover:bg-rose-50 hover:border-rose-200 h-10 px-4 shadow-sm"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </button>
              <Link 
                href={`/workflows/${workflow.id}/execute`}
                className="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-accent text-white hover:bg-accent-hover h-10 px-4 shadow-sm active:scale-[0.98] transition-all"
              >
                <Play className="mr-2 h-4 w-4 fill-current" />
                Execute
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Col: Info & Schema */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-xl border border-border bg-background shadow-sm overflow-hidden group">
             <div className="px-5 py-4 border-b border-border bg-slate-50/50 flex justify-between items-center transition-colors group-hover:bg-slate-50">
               <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">
                 <Settings size={16} className="text-slate-400" />
                 Configuration
               </h3>
               <button className="text-slate-400 hover:text-accent transition-colors"><Edit size={14} /></button>
             </div>
             <div className="p-5 space-y-4">
                <div>
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-2">Entry Point</span>
                  <div className="font-medium text-sm text-foreground flex items-center gap-2">
                    {workflow.start_step_id ? 
                      <>
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">S</div>
                        {workflow.steps.find((s) => s.id === workflow.start_step_id)?.name || workflow.start_step_id}
                      </>
                      : <span className="text-amber-700 text-xs flex items-center gap-1.5 ring-1 ring-inset ring-amber-600/20 bg-amber-50 px-2.5 py-1 rounded w-max">
                          Warning: No start step
                        </span>
                    }
                  </div>
                </div>
             </div>
          </div>

          <div className="rounded-xl border border-border bg-background shadow-sm overflow-hidden group">
             <div className="px-5 py-4 border-b border-border bg-slate-50/50 flex justify-between items-center transition-colors group-hover:bg-slate-50">
               <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">
                 <CodeSquare size={16} className="text-slate-400" />
                 Input Schema
               </h3>
             </div>
             <div className="relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent/20 to-purple-500/20" />
                <pre className="p-5 text-[11px] font-mono text-slate-600 overflow-x-auto m-0 leading-relaxed selection:bg-accent/20">
                  {JSON.stringify(workflow.input_schema, null, 2)}
                </pre>
             </div>
          </div>
        </div>

        {/* Right Col: Visualization */}
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-xl border border-border bg-background shadow-sm overflow-hidden flex flex-col h-full">
             <div className="px-5 py-4 border-b border-border bg-slate-50/50 flex flex-col sm:flex-row gap-4 sm:gap-0 justify-between sm:items-center">
               <div>
                  <h3 className="font-semibold text-foreground text-sm">Visual Workflow Builder</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Define and visualize the sequence of execution.</p>
               </div>
                <button 
                onClick={() => setIsStepModalOpen(true)}
                className="inline-flex items-center justify-center rounded-lg text-xs font-medium bg-white text-slate-700 border border-border hover:bg-slate-50 h-8 px-3 transition-colors shadow-sm"
               >
                 <Plus size={14} className="mr-1.5" /> Add Step
               </button>
             </div>
             <div className="p-6 bg-slate-50/30 overflow-y-auto max-h-[600px]">
                <WorkflowVisualizer steps={workflow.steps} />
                
                {/* Rules Administration Section */}
                <div className="mt-12 space-y-6">
                  <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                    <Settings size={16} className="text-slate-400" />
                    Manage Rules
                  </h3>
                  
                  <div className="space-y-6">
                    {workflow.steps.map(step => {
                      const stepRules = rulesByStep[step.id] || [];
                      return (
                      <div key={step.id} className="p-6 bg-white rounded-3xl border border-border/60 bg-gradient-to-br from-white to-slate-50/30 shadow-sm relative group/step hover:shadow-xl hover:border-accent/20 transition-all duration-300">
                        <div className="flex justify-between items-center mb-6">
                          <h4 className="font-bold text-base text-foreground flex items-center gap-3">
                            <span className="text-[10px] bg-slate-100 text-slate-500 font-black px-2 py-1 rounded-lg border border-slate-200 uppercase tracking-widest">Step {step.order}</span>
                            {step.name}
                          </h4>
                          <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => handleDeleteStep(step.id)}
                                    className="p-2 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover/step:opacity-100"
                                    title="Delete Step"
                                >
                                    <Trash2 size={16} />
                                </button>
                                <button 
                                    onClick={() => {
                                    setSelectedStepId(step.id);
                                    setNewRule({ condition: "", next_step_id: "", priority: (stepRules.length) * 10 });
                                    setIsRuleModalOpen(true);
                                    }}
                                    className="text-xs text-accent font-bold hover:bg-accent hover:text-white bg-accent/5 px-4 py-2 rounded-xl transition-all"
                                >
                                    + Add Rule
                                </button>
                          </div>
                        </div>

                        {stepRules.length === 0 ? (
                          <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50/50 border border-amber-100/50 text-xs text-amber-700 font-medium leading-relaxed">
                             <AlertCircle size={16} className="shrink-0 mt-0.5" />
                             No transition rules defined. This step will terminate the workflow unless a rule is established.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {stepRules.sort((a, b) => a.priority - b.priority).map(rule => {
                              const nextStep = workflow.steps.find(s => s.id === rule.next_step_id);
                              return (
                                <div key={rule.id} className="flex items-center gap-4 text-xs px-4 py-3 rounded-2xl border border-slate-100 bg-white group/rule hover:border-accent/20 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
                                  <span className="font-mono text-slate-400 shrink-0 w-8 text-center text-[10px] font-black">{rule.priority}</span>
                                  <span className={`font-mono font-bold flex-1 truncate tracking-tight text-sm ${
                                    rule.condition.toUpperCase() === 'DEFAULT'
                                      ? 'text-indigo-600'
                                      : 'text-foreground font-black'
                                  }`}>{rule.condition}</span>
                                  <ChevronRight className="h-4 w-4 text-slate-200 shrink-0" />
                                  <span className="text-slate-500 font-bold shrink-0 flex items-center gap-2 min-w-[120px] justify-end">
                                    {nextStep ? (
                                        <>
                                            <span className="truncate max-w-[120px]">{nextStep.name}</span>
                                            <div className="w-2 h-2 rounded-full bg-slate-200" />
                                        </>
                                    ) : (
                                        <span className="text-emerald-600 font-black bg-emerald-50 px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider border border-emerald-100">End Workflow</span>
                                    )}
                                  </span>
                                  <button 
                                    onClick={() => handleDeleteRule(step.id, rule.id)}
                                    className="p-1.5 rounded-lg text-slate-200 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover/rule:opacity-100 transition-all"
                                  >
                                    <Trash2 size={14} strokeWidth={3} />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )})}
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Step Modal */}
      {isStepModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-border w-full max-w-md shadow-2xl overflow-hidden fade-in">
            <div className="px-6 py-4 border-b border-border bg-slate-50 flex justify-between items-center">
              <h3 className="font-semibold text-foreground">Add New Step</h3>
              <button onClick={() => setIsStepModalOpen(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <form onSubmit={handleAddStep} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Name</label>
                <input 
                  required
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-accent/20 focus:outline-none" 
                  value={newStep.name}
                  onChange={e => setNewStep({...newStep, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Type</label>
                <select 
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-accent/20 focus:outline-none"
                  value={newStep.step_type}
                  onChange={e => setNewStep({...newStep, step_type: e.target.value as any})}
                >
                  <option value="task">Task</option>
                  <option value="approval">Approval</option>
                  <option value="notification">Notification</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Order</label>
                <input 
                  type="number"
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-accent/20 focus:outline-none" 
                  value={newStep.order}
                  onChange={e => setNewStep({...newStep, order: parseInt(e.target.value)})}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsStepModalOpen(false)} className="text-sm text-slate-500 px-4">Cancel</button>
                <button type="submit" className="bg-accent text-white px-4 py-2 rounded-lg text-sm font-medium">Add Step</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rule Modal */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-border w-full max-w-md shadow-2xl overflow-hidden fade-in">
            <div className="px-6 py-4 border-b border-border bg-slate-50 flex justify-between items-center">
              <h3 className="font-semibold text-foreground">Add Transition Rule</h3>
              <button onClick={() => setIsRuleModalOpen(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <form onSubmit={handleAddRule} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Condition</label>
                <input 
                  required
                  placeholder="e.g. amount > 100 or DEFAULT"
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-accent/20 focus:outline-none" 
                  value={newRule.condition}
                  onChange={e => setNewRule({...newRule, condition: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Next Step</label>
                <select 
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-accent/20 focus:outline-none"
                  value={newRule.next_step_id}
                  onChange={e => setNewRule({...newRule, next_step_id: e.target.value})}
                >
                  <option value="">End Workflow</option>
                  {workflow.steps.filter(s => s.id !== selectedStepId).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Priority</label>
                <input 
                  type="number"
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-accent/20 focus:outline-none" 
                  value={newRule.priority}
                  onChange={e => setNewRule({...newRule, priority: parseInt(e.target.value)})}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsRuleModalOpen(false)} className="text-sm text-slate-500 px-4">Cancel</button>
                <button type="submit" className="bg-accent text-white px-4 py-2 rounded-lg text-sm font-medium">Add Rule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
