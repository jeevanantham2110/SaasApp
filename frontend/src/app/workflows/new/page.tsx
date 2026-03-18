"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import { WorkflowBase } from "@/types";
import { ArrowLeft, Check, CodeSquare, Workflow as WorkflowIcon } from "lucide-react";
import toast from "react-hot-toast";

export default function NewWorkflowPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<WorkflowBase>({
    name: "",
    is_active: true,
    input_schema: {
        "amount": {"type":"number", "required":true},
        "country": {"type":"string", "required":true},
        "priority": {"type":"string", "required":true, "allowed_values":["High","Medium","Low"]}
    }
  });
  const [schemaText, setSchemaText] = useState(JSON.stringify(formData.input_schema, null, 2));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const parsedSchema = JSON.parse(schemaText);
      const dataToSubmit = { ...formData, input_schema: parsedSchema };
      const created = await api.createWorkflow(dataToSubmit);
      toast.success("Workflow created successfully");
      router.push(`/workflows/${created.id}`);
    } catch (error) {
      toast.error(error instanceof SyntaxError ? "Invalid JSON schema" : "Failed to create workflow");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 fade-in pb-20 px-4">
      <div className="flex items-center justify-between">
        <div>
            <button 
                onClick={() => router.back()}
                className="inline-flex items-center text-xs font-bold text-slate-400 hover:text-accent transition-all mb-4 group uppercase tracking-widest"
            >
                <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Return to Library
            </button>
            <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">Create Pipeline</h1>
            <p className="text-sm text-slate-500 mt-2 font-medium">Define the orchestration logic and input requirements.</p>
        </div>
        <div className="hidden sm:block">
             <div className="w-16 h-16 rounded-3xl bg-accent/5 flex items-center justify-center border-2 border-dashed border-accent/20">
                <WorkflowIcon className="w-8 h-8 text-accent/30" />
             </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-[24px] border border-border/60 shadow-xl shadow-slate-200/40 overflow-hidden backdrop-blur-sm">
        
        <div className="p-8 sm:p-12 space-y-10">
            <div className="space-y-4">
                <label htmlFor="name" className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Pipeline Identity</label>
                <div className="relative">
                    <input
                        id="name"
                        required
                        className="flex h-14 w-full rounded-2xl border-2 border-slate-100 bg-slate-50/30 px-5 py-2 text-base font-bold placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent transition-all"
                        placeholder="e.g. Enterprise Onboarding Flow"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <label htmlFor="schema" className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <CodeSquare size={16} className="text-accent" />
                        Input Validation Schema (JSON)
                    </label>
                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full font-bold text-slate-500">JSON SCHEMA V1</span>
                </div>
                <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">
                    Define the structured data requirements. The automation engine uses this schema for real-time validation upon trigger.
                </p>
                <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-purple-500/5 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
                    <textarea
                        id="schema"
                        required
                        rows={12}
                        className="relative flex w-full rounded-2xl border-2 border-slate-100 bg-slate-900 px-6 py-5 text-sm font-mono focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent transition-all text-emerald-400 selection:bg-emerald-500/20 shadow-inner"
                        value={schemaText}
                        onChange={(e) => setSchemaText(e.target.value)}
                        spellCheck={false}
                    />
                </div>
            </div>

            <div className="flex items-center gap-4 p-6 rounded-2xl border-2 border-slate-100 bg-slate-50/50 hover:border-accent/10 transition-colors cursor-pointer group" onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}>
                <div className="flex items-center justify-center">
                    <input
                        type="checkbox"
                        id="isActive"
                        className="peer sr-only"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    <div className="w-6 h-6 rounded-lg border-2 border-slate-200 bg-white peer-checked:bg-accent peer-checked:border-accent flex items-center justify-center transition-all group-hover:scale-110">
                        <Check size={16} className="text-white opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={4} />
                    </div>
                </div>
                <div className="space-y-0.5">
                    <label className="text-sm font-bold text-slate-900 cursor-pointer">Deploy Immediately</label>
                    <p className="text-xs text-slate-500 font-medium cursor-pointer">Activate this pipeline and allow it to receive execution requests immediately upon creation.</p>
                </div>
            </div>
        </div>

        <div className="flex items-center justify-between p-6 sm:px-12 border-t border-slate-100 bg-slate-50/30">
          <p className="text-xs text-slate-400 font-medium">Drafts are saved locally until submission.</p>
          <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex items-center justify-center rounded-xl text-sm font-bold transition-all hover:bg-slate-200/50 text-slate-500 h-12 px-6"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-black h-12 px-8 shadow-xl shadow-slate-900/10 disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                {isSubmitting ? "Orchestrating..." : "Initialize Pipeline"}
              </button>
          </div>
        </div>
      </form>
    </div>
  );
}
