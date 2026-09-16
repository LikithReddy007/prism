import {
  Server, Activity, Cpu, BrainCircuit, GitBranch, Zap, CheckCircle2,
} from 'lucide-react';
import { useSimulation } from '../services/store';

const STAGES = [
  { key: 'ec2', label: 'AWS EC2', icon: Server, always: true },
  { key: 'cloudwatch', label: 'CloudWatch', icon: Activity },
  { key: 'monitoringEngine', label: 'Monitoring Engine', icon: Cpu },
  { key: 'mlPrediction', label: 'ML Prediction', icon: BrainCircuit },
  { key: 'decisionEngine', label: 'Decision Engine', icon: GitBranch },
  { key: 'lambda', label: 'AWS Lambda', icon: Zap },
  { key: 'validation', label: 'Validation', icon: CheckCircle2 },
];

export default function PipelineStrip() {
  const { pipelineActivity } = useSimulation();

  return (
    <div className="pipeline-strip">
      {STAGES.map((stage) => {
        const active = stage.always || pipelineActivity[stage.key];
        const Icon = stage.icon;
        return (
          <div key={stage.key} className={`pipeline-stage${active ? ' is-active' : ''}`}>
            <div className="pipeline-connector" />
            <div className="pipeline-stage-icon">
              <Icon size={18} />
            </div>
            <span className="pipeline-stage-label">{stage.label}</span>
          </div>
        );
      })}
    </div>
  );
}
