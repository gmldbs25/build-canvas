import type { DemandStage, Policy, TransportRecovery } from './types';

export const ANALYSIS_VERSION = 1 as const;
export const ANALYSIS_BUCKET_SECONDS = 5;
export const ANALYSIS_MAX_BUCKETS = 180;
export const ANALYSIS_MAX_EVENTS = 2_000;

export type DemandSettings = { intervalSeconds: number; stage: DemandStage; paused: boolean };
type InterventionBase = { id: string; at: number; sequence: number };
export type AnalysisIntervention =
  | (InterventionBase & { type: 'demand-rate'; before: DemandSettings; after: DemandSettings })
  | (InterventionBase & { type: 'transport-recovery'; before: null; after: TransportRecovery })
  | (InterventionBase & { type: 'demand-pause'; before: boolean; after: boolean })
  | (InterventionBase & { type: 'fleet-add'; before: number; after: number; vehicleIds: string[] })
  | (InterventionBase & { type: 'policy'; before: Policy; after: Policy });
export type PendingAnalysisIntervention = AnalysisIntervention extends infer Event
  ? Event extends { id: string; sequence: number } ? Omit<Event, 'id' | 'sequence'> : never
  : never;

export type AnalysisBucket = {
  start: number;
  end: number;
  created: number;
  completed: number;
  unfinished: number;
  transportSecondsTotal: number;
  meanTransportSeconds: number;
  railWaitingSeconds: number;
  waitingTicks: number;
  rails: Record<string, { waitingSeconds: number; occupiedSeconds: number; waitingTicks: number }>;
};

export type AnalysisReport = {
  version: typeof ANALYSIS_VERSION;
  available: boolean;
  availableSince: number;
  observedSeconds: number;
  retainedSeconds: number;
  historyComplete: boolean;
  windowSeconds: number;
  windowObservedSeconds: number;
  kpis: {
    created: number;
    completed: number;
    unfinished: number;
    throughputPerMinute: number;
    meanTransportSeconds: number;
    railWaitingSeconds: number;
  };
  buckets: AnalysisBucket[];
  rails: Array<{
    linkId: string;
    currentQueue: number;
    waitingSeconds: number;
    occupiedSeconds: number;
    waitingTicks: number;
    closed: boolean;
    vehicleIds: string[];
    resources: string[];
  }>;
  events: AnalysisIntervention[];
};

export type AnalysisState = {
  version: typeof ANALYSIS_VERSION;
  availableSince: number;
  historyComplete: boolean;
  events: AnalysisIntervention[];
  nextEventSequence: number;
  buckets: AnalysisBucket[];
  lastCreated: number;
  lastCompleted: number;
  nextBucketEnd: number;
};

export type InterventionComparison = {
  event: AnalysisIntervention;
  before: { start: number; end: number; created: number; completed: number; unfinishedAtStart: number; unfinishedAtEnd: number; throughputPerMinute: number; meanTransportSeconds: number; railWaitingSeconds: number };
  after: { start: number; end: number; created: number; completed: number; unfinishedAtStart: number; unfinishedAtEnd: number; throughputPerMinute: number; meanTransportSeconds: number; railWaitingSeconds: number };
  simultaneousInterventions: number;
  caveat: 'observational';
};
