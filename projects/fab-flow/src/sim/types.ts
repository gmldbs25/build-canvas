import type { AnalysisIntervention, AnalysisState } from './analysisTypes';

export type SingleFloorLayoutId = 'small' | 'medium' | 'large';
export type LayoutId = SingleFloorLayoutId | 'multi-large';
export type Policy = 'DBR' | 'CBR';
export type DispatchPolicy = 'nearest' | 'fifo' | 'eta';
export type OperationalTimingKey = 'dispatchWaiting' | 'emptyTravel' | 'pickupWaiting' | 'pickupService' | 'loadedTravel' | 'railWaiting' | 'dropoffWaiting' | 'dropoffService' | 'failureWaiting';
export type OperationalTiming = Record<OperationalTimingKey, number>;
export type Point = { x: number; y: number; tangent?: number };
export type LayoutVersion = '6' | 'multi-large-1';
export type MultiLargeLifter = {
  id: string;
  resource: string;
  landingNodes: [string, string];
  entryWaitNodes: [string, string];
  exitWaitNodes: [string, string];
  location: Point;
  transferSeconds: 10;
};
export type Equipment = { id: string; portId: string; floor: number; area: string; x: number; y: number; width: number; height: number; variant: 'etch' | 'deposition' | 'lithography' | 'wet' | 'metrology' | 'stocker' | 'buffer'; facing: 'north' | 'south'; dock: Point };
export type DecorativeEquipment = Pick<Equipment, 'id' | 'floor' | 'area' | 'x' | 'y' | 'width' | 'height' | 'variant'>;
export type Aisle = { id: string; name: string; floor: number; x: number; y: number; width: number; height: number };
export type FloorBounds = { floor: number; x: number; y: number; width: number; height: number };
export type Facility = { version: '1.1'; unitsPerMeter: number; equipment: Equipment[]; decorativeEquipment?: DecorativeEquipment[]; aisles: Aisle[]; floorBounds: FloorBounds[] };
export type Node = { id: string; x: number; y: number; floor: number; area: string; heading?: number };
export type Link = { id: string; from: string; to: string; length: number; capacity: number; kind: 'rail' | 'bridge' | 'lifter'; resource?: string; path?: Point[] };
export type Port = { id: string; node: string; name: string; kind: 'tool' | 'stocker' | 'buffer'; capacity: number; area: string; floor: number };
export type Area = { id: string; name: string; floor: number; x: number; y: number; width: number; height: number };
export type Layout = { topologyVersion?: '6'; id: LayoutId; name: string; description: string; nodes: Node[]; links: Link[]; ports: Port[]; areas: Area[]; floors: number; width: number; height: number; facility?: Facility; parkingNodes?: string[]; multiLargeVersion?: '1'; lifters?: MultiLargeLifter[] };
export type Failure = { kind: 'rail' | 'vehicle' | 'lifter'; target: string; start: number; duration: number };
export type MCSConfig = { distanceWeight: number; congestionWeight: number; rerouteThreshold: number; recalculationInterval: number; dispatchPolicy: DispatchPolicy; congestionModel?: 'legacy' | 'delay' };
export type DemandStage = 'relaxed' | 'active' | 'congested';
export type DemandChange = { at: number; intervalSeconds: number; stage: DemandStage; paused?: boolean };
export type FleetChange = { eventId: string; at: number; vehicleIds: string[] };
export type TransportRecovery = { version: '1.0'; startAt: number };
export type Scenario = { version: 1 | 2; layoutVersion?: LayoutVersion; operationalVersion?: '2.1' | '2.2' | '2.3'; transportRecovery?: TransportRecovery; demandWindow?: number; demandMode?: 'per-minute' | 'per-10-seconds' | 'interval'; requestsPer10Seconds?: number; demandIntervalSeconds?: number; initialRequests?: 2 | 3; demandStage?: DemandStage; demandChanges?: DemandChange[]; fleetChanges?: FleetChange[]; interventions?: AnalysisIntervention[]; interventionHistoryComplete?: boolean; initialPolicy?: Policy; movementControl?: 'conservative' | 'clearance'; deadlockPolicy?: 'detect' | 'prevent-recover'; layoutId: LayoutId; fleet: number; demand: number; duration: number; seed: number; policy: Policy; pattern: 'steady' | 'peak'; distribution: 'balanced' | 'hotspot'; bridgeCapacity: number; lifterCapacity: number; storageCapacity: number; failures: Failure[]; mcs?: MCSConfig };
export type RequestPhase = 'pending' | 'assigned' | 'pickup' | 'loaded' | 'dropoff' | 'completed';
export type Request = { id: string; source: string; destination: string; created: number; phase: RequestPhase; vehicle?: string; assigned?: number; pickupStarted?: number; picked?: number; dropoffStarted?: number; completed?: number; waiting: number; movementWaiting?: number; timing?: OperationalTiming; waitReason?: string; blockingResources?: string[] };
export type Vehicle = { id: string; node: string; link?: string; progress: number; route: string[]; request?: string; phase: 'idle' | 'empty' | 'pickup' | 'loaded' | 'dropoff'; serviceRemaining: number; loaded: boolean; waiting: number; failed: boolean; distance: number; parked?: boolean; parkingPending?: boolean; parkingSlot?: number; waitReason?: string; blockingResources?: string[] };
export type DemandEvent = { at: number; source: string; destination: string };
export type StoredFoup = { requestId: string; portId: string; releaseAt: number };
export type MultiLifterPhase = 'approach' | 'transfer' | 'exit';
export type MultiLifterRuntime = {
  resource: string;
  ownerVehicleId?: string;
  phase?: MultiLifterPhase;
  entryFloor?: 0 | 1;
  exitFloor?: 0 | 1;
  entryWaitNode?: string;
  exitWaitNode?: string;
  entryLandingNode?: string;
  exitLandingNode?: string;
  continuationNodes?: string[];
  verticalTransferCompleted?: boolean;
  queuedVehicleIds: string[];
  nextQueueSequence: number;
  ownerQueueSequence?: number;
  transferTicks: number;
  completedTransfers: number;
  busyTicks: number; // owner-reserved native ticks without a vehicle or lifter failure
  queueTicks: number; // native ticks with at least one FIFO waiter
  failureTicks: number; // active lifter-failure native ticks, including idle downtime
  waitingTicks: number; // total queued vehicle-ticks
};
export type PortOccupancy = { portId: string; stored: number; reserved: number; capacity: number; requestIds: string[] };
export type OperationalCycle = { signature: string; firstSeen: number; vehicles: string[]; edges: Array<{ vehicleId: string; from: string; to: string; blockers: string[]; resources: string[] }> };
export type FleetVehicleTime = { id: string; introducedAt: number; observedSince: number; availableSeconds: number; busySeconds: number; waitingSeconds: number };
export type FleetAccounting = { appliedChangeCount: number; observedSince: number; baselineBusySeconds: number; baselineWaitingSeconds: number; vehicles: FleetVehicleTime[] };
export type FleetVehicleMetrics = FleetVehicleTime & { utilization: number };
export type FleetMetrics = { fleet: number; availableSeconds: number; busySeconds: number; waitingSeconds: number; utilization: number; congestion: number; observedSince: number; vehicles: FleetVehicleMetrics[] };
export type SimulationState = { version: string; time: number; tick: number; policy: Policy; requests: Request[]; vehicles: Vehicle[]; demandIndex: number; reroutes: number; routingOperations: number; vehicleBusySeconds: number; vehicleWaitingSeconds: number; fleetAccounting?: FleetAccounting; eventLog: { time: number; message: string }[]; storedFoups: StoredFoup[]; linkQueues?: { linkId: string; vehicleIds: string[] }[]; multiLifters?: MultiLifterRuntime[]; blockedTicks?: number; decisions?: Record<string, { reason: string; assignmentReason: string; from: string; to: string; candidates: { nodes: string[]; links: string[]; distance: number; cost: number; selected: boolean }[]; policy: Policy }>; operationalCycles?: OperationalCycle[]; preventionCount?: number; recoveryCount?: number };
export type Kpis = { created: number; completed: number; unfinished: number; pending: number; throughput: number; averageTransport: number; p50: number; p95: number; averageWaiting: number; averageMovementWaiting?: number; utilization: number; congestion: number; queue: number; reroutes: number; routingOperations: number; oldestUnfinished: number; elapsed: number };
export type Snapshot = { version: 1; scenario: Scenario; state: SimulationState; analysis?: AnalysisState };
