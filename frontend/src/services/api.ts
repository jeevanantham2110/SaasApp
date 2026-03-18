import { Workflow, WorkflowWithSteps, Step, Rule, Execution, ExecutionLog, WorkflowBase, StepBase, RuleBase, ExecutionBase, ExecutionCreate } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorMsg = `API request failed: ${response.statusText} (${response.status})`;
    try {
      const errorData = await response.json();
      errorMsg = errorData.detail || errorMsg;
    } catch (e) {
      console.error("Error parsing API error response:", e);
    }
    console.error(`Fetch error at ${url}:`, errorMsg);
    throw new Error(errorMsg);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// Workflows
export const api = {
  getWorkflows: () => fetchAPI<Workflow[]>('/workflows/'),
  getWorkflow: (id: string) => fetchAPI<WorkflowWithSteps>(`/workflows/${id}`),
  createWorkflow: (data: WorkflowBase) => fetchAPI<Workflow>('/workflows/', { method: 'POST', body: JSON.stringify(data) }),
  updateWorkflow: (id: string, data: Partial<WorkflowBase> & { start_step_id?: string }) => fetchAPI<Workflow>(`/workflows/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteWorkflow: (id: string) => fetchAPI<void>(`/workflows/${id}`, { method: 'DELETE' }),

  // Steps
  getSteps: (workflowId: string) => fetchAPI<Step[]>(`/workflows/${workflowId}/steps`),
  createStep: (workflowId: string, data: StepBase) => fetchAPI<Step>(`/workflows/${workflowId}/steps`, { method: 'POST', body: JSON.stringify(data) }),
  updateStep: (id: string, data: Partial<StepBase>) => fetchAPI<Step>(`/steps/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteStep: (id: string) => fetchAPI<void>(`/steps/${id}`, { method: 'DELETE' }),

  // Rules
  getRules: (stepId: string) => fetchAPI<Rule[]>(`/steps/${stepId}/rules`),
  createRule: (stepId: string, data: RuleBase) => fetchAPI<Rule>(`/steps/${stepId}/rules`, { method: 'POST', body: JSON.stringify(data) }),
  updateRule: (id: string, data: Partial<RuleBase>) => fetchAPI<Rule>(`/rules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRule: (id: string) => fetchAPI<void>(`/rules/${id}`, { method: 'DELETE' }),

  // Executions
  executeWorkflow: (workflowId: string, data: ExecutionCreate) => fetchAPI<Execution>(`/workflows/${workflowId}/execute`, { method: 'POST', body: JSON.stringify(data) }),
  listExecutions: () => fetchAPI<Execution[]>(`/executions`),
  getExecution: (id: string) => fetchAPI<Execution>(`/executions/${id}`),
  cancelExecution: (id: string) => fetchAPI<Execution>(`/executions/${id}/cancel`, { method: 'POST' }),
  retryExecution: (id: string) => fetchAPI<Execution>(`/executions/${id}/retry`, { method: 'POST' }),
  getExecutionLogs: (id: string) => fetchAPI<ExecutionLog[]>(`/executions/${id}/logs`),
};
