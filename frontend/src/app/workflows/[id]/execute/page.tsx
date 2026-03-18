"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Play, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "@/services/api";
import { WorkflowWithSteps } from "@/types";
import toast from "react-hot-toast";

export default function ExecuteWorkflowPage() {
  const params = useParams();
  const router = useRouter();
  const [workflow, setWorkflow] = useState<WorkflowWithSteps | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [inputData, setInputData] = useState<Record<string, any>>({});
  const [rawJson, setRawJson] = useState("{}");
  const [useRawJson, setUseRawJson] = useState(false);

  // Parsed schema fields from workflow.input_schema
  const [schemaFields, setSchemaFields] = useState<
    { key: string; type: string; required: boolean; allowed_values?: string[] }[]
  >([]);

  useEffect(() => {
    if (params.id) {
      loadWorkflow(params.id as string);
    }
  }, [params.id]);

  const loadWorkflow = async (id: string) => {
    try {
      const data = await api.getWorkflow(id);
      setWorkflow(data);

      if (data.input_schema && Object.keys(data.input_schema).length > 0) {
        const fields = Object.entries(data.input_schema).map(([key, config]) => ({
          key,
          type: (config as any).type || "string",
          required: (config as any).required || false,
          allowed_values: (config as any).allowed_values,
        }));
        setSchemaFields(fields);

        // Initialize default values
        const initial: Record<string, any> = {};
        fields.forEach((f) => {
          if (f.type === "number") initial[f.key] = 0;
          else if (f.allowed_values?.length) initial[f.key] = f.allowed_values[0];
          else initial[f.key] = "";
        });
        setInputData(initial);
      } else {
        // No schema — switch to raw JSON editor
        setUseRawJson(true);
      }
    } catch (error) {
      toast.error("Failed to load workflow");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workflow) return;

    setIsExecuting(true);
    try {
      let finalData: Record<string, any>;

      if (useRawJson) {
        try {
          finalData = JSON.parse(rawJson);
        } catch {
          toast.error("Invalid JSON in input data");
          setIsExecuting(false);
          return;
        }
      } else {
        finalData = { ...inputData };
        // Coerce number fields
        schemaFields.forEach((f) => {
          if (f.type === "number") {
            finalData[f.key] = Number(finalData[f.key]);
          }
        });
      }

      // workflow_id is passed in the URL — NOT in the request body
      const execution = await api.executeWorkflow(workflow.id, {
        data: finalData,
        triggered_by: "demo_user",
      });

      toast.success("Execution started!");
      // Navigate to the execution detail page
      router.push(`/executions/${execution.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to start execution");
      console.error(error);
    } finally {
      setIsExecuting(false);
    }
  };

  if (isLoading)
    return <div className="p-12 text-center text-slate-500 animate-pulse">Loading workflow...</div>;
  if (!workflow)
    return <div className="p-12 text-center text-slate-500">Workflow not found.</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-8 fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <button
          onClick={() => router.push(`/workflows/${workflow.id}`)}
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Workflow
        </button>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center shadow-lg shadow-accent/20">
            <Play className="w-6 h-6 text-white fill-current" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Execute Workflow
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">{workflow.name}</p>
          </div>
        </div>
      </div>

      {/* Warnings */}
      {workflow.steps.length === 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">No steps configured</p>
            <p className="text-amber-700 text-xs mt-0.5">
              Add at least one step with a DEFAULT rule before executing.
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="rounded-2xl border border-border bg-background shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-border bg-slate-50/50 flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-sm text-foreground">Run Configuration</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Provide input parameters for this execution run.
            </p>
          </div>
          {schemaFields.length > 0 && (
            <button
              type="button"
              onClick={() => setUseRawJson(!useRawJson)}
              className="text-xs text-accent hover:underline font-medium"
            >
              {useRawJson ? "Use Form" : "Raw JSON"}
            </button>
          )}
        </div>

        <form onSubmit={handleExecute} className="p-6 space-y-6">
          {useRawJson || schemaFields.length === 0 ? (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                Input Data (JSON)
              </label>
              <textarea
                rows={8}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                value={rawJson}
                onChange={(e) => setRawJson(e.target.value)}
                spellCheck={false}
                placeholder='{"amount": 500, "country": "US"}'
              />
              <p className="text-[10px] text-slate-400">
                Enter a valid JSON object with the data to pass to this workflow.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border -mt-4">
              {schemaFields.map((field) => (
                <div key={field.key} className="py-5 first:pt-0 last:pb-0 group">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block group-focus-within:text-accent transition-colors">
                    {field.key}{" "}
                    {field.required && <span className="text-rose-500 ml-0.5">*</span>}
                  </label>

                  {field.allowed_values ? (
                    <select
                      required={field.required}
                      className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                      value={inputData[field.key] || ""}
                      onChange={(e) => setInputData({ ...inputData, [field.key]: e.target.value })}
                    >
                      <option value="" disabled>
                        Select {field.key}
                      </option>
                      {field.allowed_values.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type === "number" ? "number" : "text"}
                      required={field.required}
                      placeholder={`Enter ${field.type} value`}
                      className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                      value={inputData[field.key] ?? ""}
                      onChange={(e) => setInputData({ ...inputData, [field.key]: e.target.value })}
                    />
                  )}
                  <p className="text-[10px] text-slate-400 mt-1.5 italic capitalize">
                    Type: {field.type}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-border">
            <button
              type="submit"
              disabled={isExecuting || workflow.steps.length === 0}
              className="inline-flex items-center justify-center rounded-xl text-sm font-semibold bg-accent text-white hover:bg-accent-hover h-11 px-8 shadow-lg shadow-accent/20 disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {isExecuting ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4 fill-current" />
              )}
              {isExecuting ? "Executing..." : "Start Workflow"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
