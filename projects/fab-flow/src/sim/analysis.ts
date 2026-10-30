import { ANALYSIS_BUCKET_SECONDS, ANALYSIS_MAX_BUCKETS, ANALYSIS_MAX_EVENTS, ANALYSIS_VERSION, type AnalysisBucket, type AnalysisIntervention, type AnalysisReport, type AnalysisState, type InterventionComparison, type PendingAnalysisIntervention } from './analysisTypes';

const EPSILON = 1e-9;
const round = (value: number) => Math.round(value * 1e9) / 1e9;
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);

export function createAnalysisState(time = 0, historyComplete = true, lastCreated = 0, lastCompleted = 0): AnalysisState {
  const nextBucketEnd = (Math.floor(time / ANALYSIS_BUCKET_SECONDS) + 1) * ANALYSIS_BUCKET_SECONDS;
  return {
    version: ANALYSIS_VERSION,
    availableSince: time,
    historyComplete,
    events: [],
    nextEventSequence: 1,
    buckets: [],
    lastCreated,
    lastCompleted,
    nextBucketEnd: round(nextBucketEnd),
  };
}

export function recordIntervention(state: AnalysisState, event: PendingAnalysisIntervention): AnalysisIntervention {
  const sequence = state.nextEventSequence++;
  const recorded = { ...event, id: `OA-${String(sequence).padStart(6, '0')}`, sequence } as AnalysisIntervention;
  state.events.push(recorded);
  if (state.events.length > ANALYSIS_MAX_EVENTS) {
    state.events.shift();
    state.historyComplete = false;
  }
  return clone(recorded);
}

function currentBucket(state: AnalysisState, time: number): AnalysisBucket {
  let bucket = state.buckets.at(-1);
  const expectedStart = Math.max(state.availableSince, state.nextBucketEnd - ANALYSIS_BUCKET_SECONDS);
  if (!bucket || bucket.start < expectedStart - EPSILON) {
    const start = bucket ? bucket.end : state.availableSince;
    bucket = { start, end: Math.min(state.nextBucketEnd, time), created: 0, completed: 0, unfinished: 0, transportSecondsTotal: 0, meanTransportSeconds: 0, railWaitingSeconds: 0, waitingTicks: 0, rails: {} };
    state.buckets.push(bucket);
    while (state.buckets.length > ANALYSIS_MAX_BUCKETS) {
      state.buckets.shift();
      state.historyComplete = false;
    }
  }
  return bucket;
}

/** Collect one completed native tick. This only reads engine data and never feeds it back into movement. */
export function collectAnalysisTick(state: AnalysisState, input: {
  time: number;
  created: number;
  completed: number;
  unfinished: number;
  newlyCompletedTransportSeconds: number[];
  occupiedByLink: ReadonlyMap<string, number>;
  waitingByLink: ReadonlyMap<string, { seconds: number; ticks: number }>;
}): void {
  const bucket = currentBucket(state, input.time);
  bucket.end = input.time;
  const createdDelta = Math.max(0, input.created - state.lastCreated);
  const completedDelta = Math.max(0, input.completed - state.lastCompleted);
  bucket.created += createdDelta;
  bucket.completed += completedDelta;
  bucket.transportSecondsTotal = round(bucket.transportSecondsTotal + input.newlyCompletedTransportSeconds.reduce((sum, value) => sum + value, 0));
  bucket.meanTransportSeconds = bucket.completed ? round(bucket.transportSecondsTotal / bucket.completed) : 0;
  bucket.unfinished = input.unfinished;
  for (const [linkId, seconds] of input.occupiedByLink) {
    if (seconds <= 0) continue;
    const row = bucket.rails[linkId] ?? (bucket.rails[linkId] = { waitingSeconds: 0, occupiedSeconds: 0, waitingTicks: 0 });
    row.occupiedSeconds = round(row.occupiedSeconds + seconds);
  }
  for (const [linkId, waiting] of input.waitingByLink) {
    if (waiting.seconds <= 0 && waiting.ticks <= 0) continue;
    const row = bucket.rails[linkId] ?? (bucket.rails[linkId] = { waitingSeconds: 0, occupiedSeconds: 0, waitingTicks: 0 });
    row.waitingSeconds = round(row.waitingSeconds + waiting.seconds);
    row.waitingTicks += waiting.ticks;
    bucket.railWaitingSeconds = round(bucket.railWaitingSeconds + waiting.seconds);
    bucket.waitingTicks += waiting.ticks;
  }
  state.lastCreated = input.created;
  state.lastCompleted = input.completed;
  if (input.time + EPSILON >= state.nextBucketEnd) {
    bucket.end = state.nextBucketEnd;
    state.nextBucketEnd = round(state.nextBucketEnd + ANALYSIS_BUCKET_SECONDS);
  }
}

function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }

// Closed native buckets never change. Publish one independent, frozen copy;
// WeakMap keys disappear when bounded native history is evicted or restored.
const publishedBuckets = new WeakMap<AnalysisBucket, AnalysisBucket>();
function publishBucket(bucket: AnalysisBucket, closedThrough: number): AnalysisBucket {
  if (bucket.end > closedThrough + EPSILON) return clone(bucket);
  let published = publishedBuckets.get(bucket);
  if (!published) {
    published = clone(bucket);
    for (const row of Object.values(published.rails)) Object.freeze(row);
    Object.freeze(published.rails); Object.freeze(published);
    publishedBuckets.set(bucket, published);
  }
  return published;
}

export function validateAnalysisState(value: unknown, context: { now: number; requestCount: number; completedCount: number; linkIds: ReadonlySet<string>; vehicleIds: ReadonlySet<string> }): AnalysisState {
  if (!record(value) || value.version !== ANALYSIS_VERSION) throw new Error('Unsupported or malformed operations analysis data.');
  const state = value as unknown as AnalysisState;
  if (!finite(state.availableSince) || state.availableSince < 0 || state.availableSince > context.now || typeof state.historyComplete !== 'boolean') throw new Error('Invalid operations analysis observation boundary.');
  if (!Array.isArray(state.events) || state.events.length > ANALYSIS_MAX_EVENTS || !Array.isArray(state.buckets) || state.buckets.length > ANALYSIS_MAX_BUCKETS || !Number.isInteger(state.nextEventSequence) || state.nextEventSequence < 1) throw new Error('Operations analysis data exceeds bounded history limits.');
  if (!Number.isInteger(state.lastCreated) || state.lastCreated < 0 || state.lastCreated > context.requestCount || !Number.isInteger(state.lastCompleted) || state.lastCompleted < 0 || state.lastCompleted > context.completedCount) throw new Error('Invalid operations analysis counters.');
  const expectedNextBucketEnd = (Math.floor(context.now / ANALYSIS_BUCKET_SECONDS) + 1) * ANALYSIS_BUCKET_SECONDS;
  if (!finite(state.nextBucketEnd) || state.nextBucketEnd !== expectedNextBucketEnd) throw new Error('Invalid operations analysis bucket cursor.');
  let previousSequence = 0, previousAt = -1;
  for (const event of state.events) {
    if (!record(event) || !finite(event.at) || event.at < 0 || event.at > context.now || event.at < previousAt || !Number.isInteger(event.sequence) || event.sequence <= previousSequence || event.sequence >= state.nextEventSequence || event.id !== `OA-${String(event.sequence).padStart(6, '0')}`) throw new Error('Invalid operations analysis intervention history.');
    if (event.type === 'policy') {
      if (!['DBR', 'CBR'].includes(event.before) || !['DBR', 'CBR'].includes(event.after)) throw new Error('Invalid policy intervention values.');
    } else if (event.type === 'demand-pause') {
      if (typeof event.before !== 'boolean' || typeof event.after !== 'boolean') throw new Error('Invalid demand pause intervention values.');
    } else if (event.type === 'fleet-add') {
      if (!Number.isInteger(event.before) || !Number.isInteger(event.after) || event.before < 1 || event.after <= event.before || event.after > 300 || !Array.isArray(event.vehicleIds) || event.vehicleIds.length !== event.after - event.before || event.vehicleIds.some(id => !context.vehicleIds.has(id))) throw new Error('Invalid fleet intervention values.');
    } else if (event.type === 'demand-rate') {
      for (const settings of [event.before, event.after]) if (!record(settings) || !finite(settings.intervalSeconds) || settings.intervalSeconds < 0.5 || settings.intervalSeconds > 7200 || !['relaxed', 'active', 'congested'].includes(settings.stage) || typeof settings.paused !== 'boolean') throw new Error('Invalid demand-rate intervention values.');
    } else if (event.type === 'transport-recovery') {
      if (event.before !== null || !record(event.after) || event.after.version !== '1.0' || !finite(event.after.startAt) || event.after.startAt < 0 || Math.abs(event.after.startAt * 2 - Math.round(event.after.startAt * 2)) > EPSILON || Math.abs(event.at - (event.after.startAt - 0.5)) > EPSILON) throw new Error('Invalid transport recovery intervention values.');
    } else throw new Error('Unknown operations analysis intervention type.');
    previousAt = event.at;
    previousSequence = event.sequence;
  }
  let previousEnd = state.availableSince;
  for (const bucket of state.buckets) {
    if (!record(bucket) || !finite(bucket.start) || !finite(bucket.end) || bucket.start < previousEnd - EPSILON || bucket.end <= bucket.start || bucket.end > context.now + EPSILON || bucket.end - bucket.start > ANALYSIS_BUCKET_SECONDS + EPSILON || !Number.isInteger(bucket.created) || bucket.created < 0 || !Number.isInteger(bucket.completed) || bucket.completed < 0 || !Number.isInteger(bucket.unfinished) || bucket.unfinished < 0 || !finite(bucket.transportSecondsTotal) || bucket.transportSecondsTotal < 0 || !finite(bucket.meanTransportSeconds) || bucket.meanTransportSeconds < 0 || !finite(bucket.railWaitingSeconds) || bucket.railWaitingSeconds < 0 || !Number.isInteger(bucket.waitingTicks) || bucket.waitingTicks < 0 || !record(bucket.rails) || Object.keys(bucket.rails).length > context.linkIds.size) throw new Error('Malformed operations analysis bucket.');
    for (const [linkId, row] of Object.entries(bucket.rails)) {
      if (!context.linkIds.has(linkId) || !record(row) || !finite(row.waitingSeconds) || row.waitingSeconds < 0 || !finite(row.occupiedSeconds) || row.occupiedSeconds < 0 || !Number.isInteger(row.waitingTicks) || row.waitingTicks < 0) throw new Error('Malformed operations analysis rail bucket.');
    }
    const railWait = Object.values(bucket.rails).reduce((sum, row) => sum + row.waitingSeconds, 0);
    const railTicks = Object.values(bucket.rails).reduce((sum, row) => sum + row.waitingTicks, 0);
    if (Math.abs(railWait - bucket.railWaitingSeconds) > EPSILON || railTicks !== bucket.waitingTicks || Math.abs(bucket.meanTransportSeconds - (bucket.completed ? bucket.transportSecondsTotal / bucket.completed : 0)) > EPSILON) throw new Error('Operations analysis bucket totals do not reconcile.');
    previousEnd = bucket.end;
  }
  return clone(state);
}

export function makeAnalysisReport(state: AnalysisState, input: {
  now: number;
  unfinished: number;
  links: Array<{ id: string; closed: boolean }>;
  queues: Array<{ linkId: string; vehicleIds: string[] }>;
  vehicles: Array<{ id: string; link?: string; waiting: number; waitReason?: string; blockingResources?: string[] }>;
}, requestedWindowSeconds: number): AnalysisReport {
  const windowSeconds = finite(requestedWindowSeconds) ? Math.max(ANALYSIS_BUCKET_SECONDS, Math.min(ANALYSIS_BUCKET_SECONDS * ANALYSIS_MAX_BUCKETS, Math.floor(requestedWindowSeconds / ANALYSIS_BUCKET_SECONDS) * ANALYSIS_BUCKET_SECONDS)) : 300;
  const cutoff = Math.max(state.availableSince, input.now - windowSeconds);
  const buckets = state.buckets.filter(bucket => bucket.end > state.availableSince + EPSILON && bucket.start < input.now + EPSILON);
  const windowBuckets = buckets.filter(bucket => bucket.start >= cutoff - EPSILON);
  const elapsed = windowBuckets.reduce((sum, bucket) => sum + bucket.end - bucket.start, 0);
  const created = windowBuckets.reduce((sum, bucket) => sum + bucket.created, 0);
  const completed = windowBuckets.reduce((sum, bucket) => sum + bucket.completed, 0);
  const transportSeconds = windowBuckets.reduce((sum, bucket) => sum + bucket.transportSecondsTotal, 0);
  const railWaitingSeconds = round(windowBuckets.reduce((sum, bucket) => sum + bucket.railWaitingSeconds, 0));
  const historicalRail = new Map<string, { waitingSeconds: number; occupiedSeconds: number; waitingTicks: number }>();
  for (const bucket of windowBuckets) for (const [linkId, sample] of Object.entries(bucket.rails)) {
    const row = historicalRail.get(linkId) ?? { waitingSeconds: 0, occupiedSeconds: 0, waitingTicks: 0 };
    row.waitingSeconds = round(row.waitingSeconds + sample.waitingSeconds);
    row.occupiedSeconds = round(row.occupiedSeconds + sample.occupiedSeconds);
    row.waitingTicks += sample.waitingTicks;
    historicalRail.set(linkId, row);
  }
  const currentQueueByLink = new Map(input.queues.map(queue => [queue.linkId, queue.vehicleIds]));
  const vehiclesById = new Map(input.vehicles.map(vehicle => [vehicle.id, vehicle]));
  const occupiedWaitersByLink = new Map<string, string[]>();
  for (const vehicle of input.vehicles) if (vehicle.link && vehicle.waiting > 0 && vehicle.waitReason !== 'port') {
    const ids = occupiedWaitersByLink.get(vehicle.link) ?? [];
    ids.push(vehicle.id); occupiedWaitersByLink.set(vehicle.link, ids);
  }
  const rails = input.links.map(link => {
    const queuedIds = (currentQueueByLink.get(link.id) ?? []).filter(id => vehiclesById.get(id)?.waitReason !== 'port');
    const occupiedWaiters = occupiedWaitersByLink.get(link.id) ?? [];
    const vehicleIds = [...new Set([...queuedIds, ...occupiedWaiters])].sort();
    const resources = [...new Set(vehicleIds.flatMap(id => vehiclesById.get(id)?.blockingResources ?? []))].sort();
    const historical = historicalRail.get(link.id);
    return { linkId: link.id, currentQueue: queuedIds.length, waitingSeconds: historical?.waitingSeconds ?? 0, occupiedSeconds: historical?.occupiedSeconds ?? 0, waitingTicks: historical?.waitingTicks ?? 0, closed: link.closed, vehicleIds, resources };
  }).sort((a, b) => b.waitingSeconds - a.waitingSeconds || b.currentQueue - a.currentQueue || a.linkId.localeCompare(b.linkId));
  return {
    version: ANALYSIS_VERSION,
    available: elapsed > 0,
    availableSince: state.availableSince,
    observedSeconds: round(Math.max(0, input.now - state.availableSince)),
    retainedSeconds: round(Math.max(0, (buckets.at(-1)?.end ?? state.availableSince) - (buckets[0]?.start ?? state.availableSince))),
    historyComplete: state.historyComplete,
    windowSeconds,
    windowObservedSeconds: round(elapsed),
    kpis: {
      created,
      completed,
      unfinished: input.unfinished,
      throughputPerMinute: elapsed > 0 ? round(completed * 60 / elapsed) : 0,
      meanTransportSeconds: completed > 0 ? round(transportSeconds / completed) : 0,
      railWaitingSeconds,
    },
    buckets: buckets.map(bucket => publishBucket(bucket, state.nextBucketEnd - ANALYSIS_BUCKET_SECONDS)),
    rails,
    events: clone(state.events),
  };
}

function period(buckets: AnalysisBucket[]) {
  const start = buckets[0].start, end = buckets.at(-1)!.end;
  const seconds = end - start;
  const completed = buckets.reduce((sum, bucket) => sum + bucket.completed, 0);
  const transport = buckets.reduce((sum, bucket) => sum + bucket.transportSecondsTotal, 0);
  return {
    start, end,
    created: buckets.reduce((sum, bucket) => sum + bucket.created, 0),
    completed,
    unfinishedAtStart: buckets[0].unfinished - buckets[0].created + buckets[0].completed,
    unfinishedAtEnd: buckets.at(-1)!.unfinished,
    throughputPerMinute: seconds > 0 ? round(completed * 60 / seconds) : 0,
    meanTransportSeconds: completed > 0 ? round(transport / completed) : 0,
    railWaitingSeconds: round(buckets.reduce((sum, bucket) => sum + bucket.railWaitingSeconds, 0)),
  };
}

/** Compare complete equal-duration native buckets around an intervention. Partial buckets are excluded. */
export function compareIntervention(report: AnalysisReport, eventId: string, windowSeconds = 300): InterventionComparison | null {
  const event = report.events.find(item => item.id === eventId);
  if (!event || !finite(windowSeconds) || windowSeconds < ANALYSIS_BUCKET_SECONDS) return null;
  const count = Math.floor(windowSeconds / ANALYSIS_BUCKET_SECONDS);
  const before = report.buckets.filter(bucket => bucket.end <= event.at + EPSILON).slice(-count);
  const after = report.buckets.filter(bucket => bucket.start >= event.at - EPSILON).slice(0, count);
  const isComplete = (items: AnalysisBucket[]) => items.length === count && items.every((bucket, index) => bucket.end - bucket.start === ANALYSIS_BUCKET_SECONDS && (index === 0 || Math.abs(items[index - 1].end - bucket.start) < EPSILON));
  if (!isComplete(before) || !isComplete(after)) return null;
  const expectedBeforeEnd = Math.floor(event.at / ANALYSIS_BUCKET_SECONDS) * ANALYSIS_BUCKET_SECONDS;
  const expectedAfterStart = Math.ceil(event.at / ANALYSIS_BUCKET_SECONDS) * ANALYSIS_BUCKET_SECONDS;
  if (Math.abs(before.at(-1)!.end - expectedBeforeEnd) >= EPSILON || Math.abs(after[0].start - expectedAfterStart) >= EPSILON) return null;
  const start = before[0].start, end = after.at(-1)!.end;
  return {
    event: clone(event), before: period(before), after: period(after),
    simultaneousInterventions: report.events.filter(item => item.at >= start && item.at <= end).length,
    caveat: 'observational',
  };
}
