// PRISM simulation engine — stands in for the AWS/ML backend so the frontend
// is fully interactive today. State transitions mirror the real pipeline:
// CloudWatch metrics -> Python Monitoring Engine -> ML Prediction ->
// Decision Engine -> AWS Lambda (auto-healing) -> Validation.
//
// This is the seam to swap for a real API later: everything the UI reads
// comes through `engine.getState()` / `engine.subscribe()`, so replacing the
// tick loop below with WebSocket/fetch calls to a real backend would not
// require any page changes.

const INSTANCE_SEEDS = [
  { id: 'i-0a1b2c3d4e5f60789', name: 'prod-web-01', type: 't3.large', az: 'us-east-1a', role: 'web', base: { cpu: 32, memory: 44, network: 180, disk: 38 } },
  { id: 'i-0b2c3d4e5f6078912', name: 'prod-web-02', type: 't3.large', az: 'us-east-1b', role: 'web', base: { cpu: 29, memory: 41, network: 165, disk: 36 } },
  { id: 'i-0c3d4e5f607891023', name: 'prod-api-01', type: 'm5.xlarge', az: 'us-east-1a', role: 'api', base: { cpu: 46, memory: 52, network: 310, disk: 44 } },
  { id: 'i-0d4e5f6078910234a', name: 'prod-api-02', type: 'm5.xlarge', az: 'us-east-1b', role: 'api', base: { cpu: 43, memory: 49, network: 295, disk: 41 } },
  { id: 'i-0e5f6078910234abc', name: 'prod-db-replica', type: 'r5.large', az: 'us-east-1c', role: 'db', base: { cpu: 38, memory: 68, network: 220, disk: 57 } },
  { id: 'i-0f6078910234abcde', name: 'prod-worker-01', type: 'c5.large', az: 'us-east-1a', role: 'worker', base: { cpu: 51, memory: 39, network: 140, disk: 33 } },
];

const METRIC_META = {
  cpu: { label: 'CPU Utilization', unit: '%', threshold: 82, max: 100 },
  memory: { label: 'Memory Utilization', unit: '%', threshold: 85, max: 100 },
  network: { label: 'Network Throughput', unit: 'Mbps', threshold: 720, max: 1000 },
  disk: { label: 'Disk Utilization', unit: '%', threshold: 88, max: 100 },
};

const CAUSE_PLAYBOOK = {
  cpu: { failureType: 'CPU Saturation', high: 'Auto Scale Out', medium: 'Instance Reboot' },
  memory: { failureType: 'Memory Leak Suspected', high: 'Instance Reboot', medium: 'Config Correction' },
  network: { failureType: 'Network Throughput Anomaly', high: 'Auto Scale Out', medium: 'Rate-Limit Config' },
  disk: { failureType: 'Disk Utilization Critical', high: 'Disk Cleanup & Reboot', medium: 'Config Correction' },
  deploy: { failureType: 'Post-Deploy Error Spike', high: 'Rollback Deployment', medium: 'Rollback Deployment' },
};

const STAGE_ORDER = ['predicted', 'deciding', 'recovering', 'validating', 'resolved'];

const HISTORY_LENGTH = 60; // ~2 minutes at 2s ticks
const TICK_MS = 2000;

let idCounter = 1000;
function nextId(prefix) {
  idCounter += 1;
  return `${prefix}-${idCounter.toString(36).toUpperCase()}`;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function randRange(min, max) {
  return min + Math.random() * (max - min);
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function nowIso() {
  return new Date().toISOString();
}

class SimulationEngine {
  constructor() {
    this.listeners = new Set();
    this.timer = null;
    this.state = this.buildInitialState();
  }

  buildInitialState() {
    const now = Date.now();
    const instances = INSTANCE_SEEDS.map((seed) => ({
      id: seed.id,
      name: seed.name,
      type: seed.type,
      az: seed.az,
      role: seed.role,
      region: 'us-east-1',
      status: 'healthy',
      activeIncidentId: null,
      metrics: { ...seed.base },
      base: { ...seed.base },
    }));

    const metricsHistory = {};
    instances.forEach((inst) => {
      const series = [];
      for (let i = HISTORY_LENGTH - 1; i >= 0; i -= 1) {
        series.push({
          t: now - i * TICK_MS,
          cpu: clamp(inst.base.cpu + randRange(-4, 4), 1, 100),
          memory: clamp(inst.base.memory + randRange(-3, 3), 1, 100),
          network: clamp(inst.base.network + randRange(-20, 20), 5, 1000),
          disk: clamp(inst.base.disk + randRange(-2, 2), 1, 100),
        });
      }
      metricsHistory[inst.id] = series;
    });

    return {
      startedAt: now,
      tick: 0,
      instances,
      metricsHistory,
      incidents: [],
      recoveryActions: [],
      auditLog: [],
      modelMetrics: {
        accuracy: 0.934,
        precision: 0.912,
        recall: 0.887,
        auc: 0.951,
        confusionMatrix: { tp: 142, fp: 14, tn: 860, fn: 19 },
        featureImportance: [
          { feature: 'CPU Utilization (5m avg)', importance: 0.34 },
          { feature: 'Memory Utilization', importance: 0.27 },
          { feature: 'Network Throughput Delta', importance: 0.19 },
          { feature: 'Disk I/O Wait', importance: 0.12 },
          { feature: 'Error Rate (5xx/min)', importance: 0.08 },
        ],
        predictionVolume: this.seedPredictionVolume(),
      },
      pipelineActivity: {
        cloudwatch: false,
        monitoringEngine: false,
        mlPrediction: false,
        decisionEngine: false,
        lambda: false,
        validation: false,
      },
    };
  }

  seedPredictionVolume() {
    const days = [];
    const now = new Date();
    for (let i = 13; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days.push({ date: d.toISOString().slice(5, 10), count: Math.round(randRange(18, 58)) });
    }
    return days;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit() {
    this.listeners.forEach((l) => l());
  }

  getState() {
    return this.state;
  }

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), TICK_MS);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  pushAudit(entry) {
    const item = {
      id: nextId('AUD'),
      t: Date.now(),
      ...entry,
    };
    this.state = { ...this.state, auditLog: [item, ...this.state.auditLog].slice(0, 300) };
    return item;
  }

  // ----- main tick -----
  tick() {
    const now = Date.now();
    let { instances, metricsHistory } = this.state;
    const pipelineActivity = { cloudwatch: true, monitoringEngine: false, mlPrediction: false, decisionEngine: false, lambda: false, validation: false };

    instances = instances.map((inst) => {
      const incident = inst.activeIncidentId ? this.state.incidents.find((i) => i.id === inst.activeIncidentId) : null;
      const drifting = incident && ['predicted', 'deciding', 'recovering'].includes(incident.status);
      const recovering = incident && incident.status === 'validating';

      const metrics = { ...inst.metrics };
      Object.keys(METRIC_META).forEach((key) => {
        const base = inst.base[key];
        let target = base;
        if (drifting && incident.cause === key) {
          target = METRIC_META[key].threshold + METRIC_META[key].max * 0.12;
        } else if (drifting) {
          target = base;
        }
        const pull = drifting && incident.cause === key ? 0.35 : recovering ? 0.3 : 0.15;
        const noise = key === 'network' ? randRange(-15, 15) : randRange(-2.2, 2.2);
        const next = metrics[key] + (target - metrics[key]) * pull + noise;
        metrics[key] = clamp(next, key === 'network' ? 5 : 1, METRIC_META[key].max);
      });

      const history = [...metricsHistory[inst.id].slice(-(HISTORY_LENGTH - 1)), { t: now, ...metrics }];
      metricsHistory = { ...metricsHistory, [inst.id]: history };

      let status = 'healthy';
      if (incident) {
        status = incident.status === 'resolved' ? 'healthy' : incident.status === 'failed' ? 'degraded' : 'at-risk';
      }

      return { ...inst, metrics, status };
    });

    this.state = { ...this.state, instances, metricsHistory, tick: this.state.tick + 1 };

    // advance active incidents
    this.advanceIncidents(now, pipelineActivity);

    // maybe start a new incident
    if (!this.state.incidents.some((i) => STAGE_ORDER.includes(i.status) && i.status !== 'resolved' && i.status !== 'failed')) {
      if (Math.random() < 0.16) {
        this.maybeStartIncident(now);
      }
    }

    // occasional routine audit heartbeat
    if (this.state.tick % 9 === 0) {
      this.pushAudit({
        type: 'heartbeat',
        severity: 'info',
        message: `CloudWatch metrics batch ingested for ${this.state.instances.length} instances`,
        refId: null,
      });
    }

    this.state = { ...this.state, pipelineActivity };
    this.emit();
  }

  maybeStartIncident(now) {
    const candidates = this.state.instances.filter((i) => !i.activeIncidentId);
    if (candidates.length === 0) return;
    const inst = pick(candidates);
    const causeKeys = Object.keys(CAUSE_PLAYBOOK);
    const cause = Math.random() < 0.12 ? 'deploy' : pick(causeKeys.filter((c) => c !== 'deploy'));
    const meta = CAUSE_PLAYBOOK[cause];

    const riskScore = clamp(randRange(0.42, 0.97), 0, 1);
    const riskTier = riskScore >= 0.7 ? 'high' : riskScore >= 0.35 ? 'medium' : 'low';
    const confidence = clamp(randRange(0.78, 0.98), 0, 1);

    const incident = {
      id: nextId('INC'),
      instanceId: inst.id,
      instanceName: inst.name,
      cause,
      metric: cause === 'deploy' ? null : cause,
      failureType: meta.failureType,
      riskScore,
      riskTier,
      confidence,
      status: 'predicted',
      createdAt: now,
      updatedAt: now,
      nextTransitionAt: now + randRange(1800, 3200),
      playbook: null,
      recoveryActionId: null,
      outcome: null,
      stages: {
        predicted: { t: now, riskScore, riskTier, confidence, failureType: meta.failureType },
      },
    };

    this.state = {
      ...this.state,
      incidents: [incident, ...this.state.incidents].slice(0, 200),
      instances: this.state.instances.map((i) => (i.id === inst.id ? { ...i, activeIncidentId: incident.id, status: 'at-risk' } : i)),
    };

    this.pushAudit({
      type: 'prediction',
      severity: riskTier === 'high' ? 'danger' : riskTier === 'medium' ? 'warning' : 'info',
      message: `ML model flagged ${inst.name} — ${meta.failureType} (risk ${(riskScore * 100).toFixed(0)}%, confidence ${(confidence * 100).toFixed(0)}%)`,
      refId: incident.id,
    });
  }

  advanceIncidents(now, pipelineActivity) {
    const incidents = this.state.incidents.map((incident) => {
      if (incident.status === 'resolved' || incident.status === 'failed') return incident;
      if (now < incident.nextTransitionAt) {
        if (incident.status === 'predicted') pipelineActivity.mlPrediction = true;
        if (incident.status === 'deciding') pipelineActivity.decisionEngine = true;
        if (incident.status === 'recovering') pipelineActivity.lambda = true;
        if (incident.status === 'validating') pipelineActivity.validation = true;
        pipelineActivity.monitoringEngine = true;
        return incident;
      }

      return this.transitionIncident(incident, now);
    });

    this.state = { ...this.state, incidents };
  }

  transitionIncident(incident, now) {
    const meta = CAUSE_PLAYBOOK[incident.cause];

    if (incident.status === 'predicted') {
      const playbook = incident.riskTier === 'high' ? meta.high : meta.medium;
      const reason = incident.cause === 'deploy'
        ? 'Error rate spike correlated with most recent deployment window'
        : `${METRIC_META[incident.metric].label} exceeded safety threshold (${METRIC_META[incident.metric].threshold}${METRIC_META[incident.metric].unit}) with sustained upward trend`;

      this.pushAudit({
        type: 'decision',
        severity: 'info',
        message: `Decision Engine selected playbook "${playbook}" for ${incident.instanceName}`,
        refId: incident.id,
      });

      return {
        ...incident,
        status: 'deciding',
        updatedAt: now,
        playbook,
        nextTransitionAt: now + randRange(1500, 2600),
        stages: { ...incident.stages, deciding: { t: now, playbook, reason } },
      };
    }

    if (incident.status === 'deciding') {
      const actionId = nextId('ACT');
      const action = {
        id: actionId,
        incidentId: incident.id,
        instanceId: incident.instanceId,
        instanceName: incident.instanceName,
        type: incident.playbook,
        status: 'in-progress',
        startedAt: now,
        finishedAt: null,
        durationMs: null,
        outcome: null,
      };

      this.state = { ...this.state, recoveryActions: [action, ...this.state.recoveryActions].slice(0, 200) };

      this.pushAudit({
        type: 'action',
        severity: 'warning',
        message: `AWS Lambda invoked — executing "${incident.playbook}" on ${incident.instanceName}`,
        refId: incident.id,
      });

      return {
        ...incident,
        status: 'recovering',
        updatedAt: now,
        recoveryActionId: actionId,
        nextTransitionAt: now + randRange(2400, 4200),
        stages: { ...incident.stages, recovering: { t: now, actionId } },
      };
    }

    if (incident.status === 'recovering') {
      this.pushAudit({
        type: 'validation',
        severity: 'info',
        message: `Validating post-recovery metrics for ${incident.instanceName}`,
        refId: incident.id,
      });
      return {
        ...incident,
        status: 'validating',
        updatedAt: now,
        nextTransitionAt: now + randRange(1600, 2600),
        stages: { ...incident.stages, validating: { t: now } },
      };
    }

    if (incident.status === 'validating') {
      const success = Math.random() > 0.12;
      const outcome = success ? 'success' : 'failed';
      const finishedAt = now;

      this.state = {
        ...this.state,
        recoveryActions: this.state.recoveryActions.map((a) => (a.id === incident.recoveryActionId
          ? { ...a, status: success ? 'success' : 'failed', finishedAt, durationMs: finishedAt - a.startedAt, outcome }
          : a)),
        instances: this.state.instances.map((i) => (i.id === incident.instanceId
          ? { ...i, activeIncidentId: success ? null : i.activeIncidentId, status: success ? 'healthy' : 'degraded' }
          : i)),
        modelMetrics: this.bumpModelMetrics(this.state.modelMetrics, success),
      };

      this.pushAudit({
        type: 'validation',
        severity: success ? 'success' : 'danger',
        message: success
          ? `Recovery validated — ${incident.instanceName} restored to healthy baseline`
          : `Recovery attempt did not resolve the issue on ${incident.instanceName} — escalated for manual review`,
        refId: incident.id,
      });

      return {
        ...incident,
        status: success ? 'resolved' : 'failed',
        updatedAt: now,
        outcome,
        resolvedAt: now,
        stages: { ...incident.stages, resolved: { t: now, outcome } },
      };
    }

    return incident;
  }

  bumpModelMetrics(metrics, success) {
    const cm = { ...metrics.confusionMatrix };
    if (success) cm.tp += 1; else cm.fn += 1;
    const total = cm.tp + cm.fp + cm.tn + cm.fn;
    const precision = cm.tp / (cm.tp + cm.fp);
    const recall = cm.tp / (cm.tp + cm.fn);
    const accuracy = (cm.tp + cm.tn) / total;
    return { ...metrics, confusionMatrix: cm, precision, recall, accuracy };
  }

  // ----- user-triggered actions -----
  acknowledgeIncident(incidentId) {
    this.pushAudit({
      type: 'manual',
      severity: 'info',
      message: `Operator acknowledged incident ${incidentId}`,
      refId: incidentId,
    });
    this.emit();
  }

  resolveManually(incidentId) {
    const now = Date.now();
    const incident = this.state.incidents.find((i) => i.id === incidentId);
    if (!incident || incident.status === 'resolved' || incident.status === 'failed') return;

    this.state = {
      ...this.state,
      incidents: this.state.incidents.map((i) => (i.id === incidentId
        ? { ...i, status: 'resolved', outcome: 'success', resolvedAt: now, updatedAt: now, stages: { ...i.stages, resolved: { t: now, outcome: 'success', manual: true } } }
        : i)),
      instances: this.state.instances.map((inst) => (inst.id === incident.instanceId ? { ...inst, activeIncidentId: null, status: 'healthy' } : inst)),
      recoveryActions: this.state.recoveryActions.map((a) => (a.id === incident.recoveryActionId
        ? { ...a, status: 'success', finishedAt: now, durationMs: now - a.startedAt, outcome: 'success' }
        : a)),
    };

    this.pushAudit({
      type: 'manual',
      severity: 'success',
      message: `Operator manually resolved incident ${incidentId} on ${incident.instanceName}`,
      refId: incidentId,
    });
    this.emit();
  }
}

export const engine = new SimulationEngine();
export { METRIC_META, CAUSE_PLAYBOOK };
