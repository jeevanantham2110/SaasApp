export type StepType = 'task' | 'approval' | 'notification';
export type ExecutionStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'canceled';

export interface WorkflowBase {
  name: string;
  is_active?: boolean;
  input_schema?: Record<string, any>;
}

export interface Workflow extends WorkflowBase {
  id: string;
  version: number;
  step_count?: number;
  start_step_id: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface StepBase {
  name: string;
  step_type: StepType;
  order: number;
  metadata: Record<string, any>;
}

export interface Step extends StepBase {
  id: string;
  workflow_id: string;
  created_at: string;
  updated_at: string;
}

export interface RuleBase {
  condition: string;
  next_step_id: string | null;
  priority: number;
}

export interface Rule extends RuleBase {
  id: string;
  step_id: string;
  created_at: string;
  updated_at: string;
}

// What the backend requires in the POST body (workflow_id is in URL, not body)
export interface ExecutionCreate {
  data?: Record<string, any>;
  triggered_by?: string;
}

// Full execution response from backend
export interface ExecutionBase {
  workflow_id: string;
  data: Record<string, any>;
  triggered_by?: string;
}

export interface Execution extends ExecutionBase {
  id: string;
  workflow_version: number;
  status: ExecutionStatus;
  current_step_id: string | null;
  retries: number;
  started_at: string;
  ended_at: string | null;
}

export interface ExecutionLog {
  id: string;
  execution_id: string;
  step_id: string | null;
  log: Record<string, any>;
  timestamp: string;
}

export interface WorkflowWithSteps extends Workflow {
  steps: Step[];
}
