"use client";

import React from 'react';
import { Step } from '@/types';
import { 
  ArrowRight, 
  MessageSquare, 
  CheckCircle2, 
  Play, 
  Zap, 
  MoreHorizontal,
  Mail,
  ShieldCheck,
  Terminal,
  MousePointer2,
  Clock
} from 'lucide-react';

interface WorkflowVisualizerProps {
  steps: Step[];
  activeStepId?: string;
}

export const WorkflowVisualizer: React.FC<WorkflowVisualizerProps> = ({ steps, activeStepId }) => {
  if (!steps || steps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 mt-4">
        <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 border border-slate-100">
          <Zap size={24} className="text-slate-300" />
        </div>
        <p className="text-sm text-slate-400 font-medium">Add steps to see your workflow pipeline</p>
      </div>
    );
  }

  const getStepIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'approval': return <ShieldCheck size={18} className="text-emerald-500" />;
      case 'notification': return <Mail size={18} className="text-blue-500" />;
      case 'task': return <Terminal size={18} className="text-amber-500" />;
      case 'trigger': return <Zap size={18} className="text-purple-500" />;
      default: return <MousePointer2 size={18} className="text-slate-500" />;
    }
  };

  return (
    <div className="relative p-10 bg-slate-50/20 rounded-3xl border border-border/40 min-h-[450px] flex flex-col items-center overflow-auto custom-scrollbar">
      {/* Starting point indicator */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center shadow-xl shadow-accent/20 ring-4 ring-white mb-2 z-10 transition-transform hover:scale-110">
          <Play size={18} className="text-white fill-current" />
        </div>
        <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">Entry</span>
            <div className="w-px h-10 bg-gradient-to-b from-accent to-border mt-2" />
        </div>
      </div>

      <div className="flex flex-col items-center gap-0 w-full max-w-sm">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div 
              className={`
                relative w-full p-5 rounded-2xl border transition-all duration-500 group
                ${step.id === activeStepId 
                  ? 'bg-white border-accent shadow-2xl shadow-accent/10 ring-1 ring-accent scale-[1.03] z-20' 
                  : 'bg-white/80 border-border shadow-sm hover:shadow-xl hover:border-slate-300 hover:scale-[1.01] hover:bg-white z-10'
                }
                backdrop-blur-md
              `}
            >
              <div className="flex items-center gap-4">
                <div className={`
                  w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-inner transition-colors
                  ${step.id === activeStepId ? 'bg-accent/10' : 'bg-slate-50 group-hover:bg-slate-100'}
                `}>
                  {getStepIcon(step.step_type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-foreground truncate group-hover:text-accent transition-colors tracking-tight">
                      {step.name}
                    </h4>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200 group-hover:bg-accent/10 group-hover:text-accent group-hover:border-accent/20 transition-all">
                      {step.step_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock size={10} className="text-slate-300" />
                    <p className="text-[10px] text-slate-400 font-medium tracking-wide">
                      ID: {step.id.split('-')[0].toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="opacity-0 group-hover:opacity-100 transition-opacity translate-x-1 group-hover:translate-x-0 group-hover:duration-300">
                  <div className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer text-slate-400">
                    <MoreHorizontal size={16} />
                  </div>
                </div>
              </div>

              {/* Connector dot for branches */}
              {index < steps.length - 1 && (
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white border-2 border-border z-10 shadow-sm" />
              )}
            </div>

            {/* Connection line */}
            {index < steps.length - 1 && (
              <div className="flex flex-col items-center py-1 h-12 w-full">
                <div className="w-px h-full bg-border relative">
                  <ArrowRight size={14} className="absolute bottom-0 left-1/2 -translate-x-1/2 rotate-90 text-slate-300" />
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
        
        {/* End terminal */}
        <div className="flex flex-col items-center mt-6 group">
          <div className="w-px h-8 bg-border mb-2 group-hover:h-10 transition-all" />
          <div className="p-1.5 rounded-full bg-indigo-50 border border-indigo-100 group-hover:scale-110 transition-transform shadow-sm">
            <div className="w-8 h-8 rounded-full bg-white border-2 border-indigo-200 flex items-center justify-center shadow-inner">
                <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse" />
            </div>
          </div>
          <span className="text-[10px] uppercase tracking-[0.3em] font-black text-indigo-400 mt-3 group-hover:text-indigo-600 transition-colors">Finish</span>
        </div>
      </div>
    </div>
  );
};
