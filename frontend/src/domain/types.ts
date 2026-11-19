// Entity types for the same-day change prototype.
// Implements: data-model.md (all entities). Supports FR-001–FR-024.
// Times are minutes after midnight on the simulated service day.

export type Minutes = number;

export type Mobility = 'ambulatory' | 'wheelchair' | 'wheelchair-large';

export interface Rider {
  id: string;
  name: string;
  mobility: Mobility;
  /** Seeded per mobility need, standing in for deferred G-133 (A-18). */
  boardingMinutes: number;
  mobilityNote: string;
}

export interface Vehicle {
  id: string;
  label: string;
  /** Ambulatory seats, including seats used by attendants (A-13). */
  seats: number;
  wheelchairPositions: number;
}

export interface Location {
  id: string;
  label: string;
}

/** travel[a][b] = minutes from location a to location b (A-1). */
export type TravelTable = Record<string, Record<string, number>>;

export type TripStatus = 'scheduled' | 'picked-up' | 'completed' | 'cancelled';

export interface Trip {
  id: string;
  riderId: string;
  runId: string;
  pickupLocationId: string;
  dropoffLocationId: string;
  /** Pickup window is windowStart to windowStart + 30 (A-14). */
  windowStart: Minutes;
  /** Attendant rides at no charge and uses a seat (A-13). */
  attendant: boolean;
  status: TripStatus;
}

export type StopKind = 'pickup' | 'dropoff';

export interface ChangeMark {
  kind: 'changed' | 'removed';
  at: Minutes;
}

export interface Stop {
  tripId: string;
  kind: StopKind;
  /** Fixed time for stops already served; null for stops still to come. */
  completedAt: Minutes | null;
  /** Shown on the driver's manifest (FR-024). */
  changeMark: ChangeMark | null;
}

export interface Run {
  id: string;
  label: string;
  vehicleId: string;
  driverName: string;
  startLocationId: string;
  startTime: Minutes;
  /** Ordered by scheduled time (A-15). */
  stops: Stop[];
}

export type ChangeKind = 'time-change' | 'cancel';

export type RequestStatus = 'confirmed' | 'pending' | 'not-accepted' | 'withdrawn';

export type DecisionReason =
  | 'other-pickup-outside-window'
  | 'capacity-exceeded'
  | 'requester-window-unreachable';

export interface ChangeRequest {
  id: string;
  tripId: string;
  kind: ChangeKind;
  /** New window start for a time change; null for a cancellation. */
  requestedWindowStart: Minutes | null;
  /** The window start before the request, for the history and the rider message. */
  previousWindowStart: Minutes;
  submittedAt: Minutes;
  status: RequestStatus;
  decisionReasons: DecisionReason[];
  /** Required when status is not-accepted (FR-019). */
  declineReason: string | null;
  decidedAt: Minutes | null;
  /** 'system' for automatic decisions, otherwise the dispatcher's name. */
  decidedBy: string | null;
}

export type ActorRole = 'rider' | 'system' | 'dispatcher';

export type RecordEvent =
  | 'submitted'
  | 'confirmed'
  | 'routed'
  | 'accepted'
  | 'declined'
  | 'withdrawn'
  | 'cancelled';

export interface ChangeRecord {
  id: string;
  at: Minutes;
  requestId: string;
  tripId: string;
  riderName: string;
  actor: string;
  actorRole: ActorRole;
  event: RecordEvent;
  from: string;
  to: string;
  reason: string | null;
}

/** Everything the impact calculation needs. */
export interface World {
  riders: Record<string, Rider>;
  vehicles: Record<string, Vehicle>;
  locations: Record<string, Location>;
  travel: TravelTable;
  trips: Record<string, Trip>;
  runs: Record<string, Run>;
}

export interface AppData extends World {
  serviceDay: { start: Minutes; end: Minutes };
  requests: ChangeRequest[];
  history: ChangeRecord[];
  nextId: number;
}

/** Estimated service at one stop (contracts: simulateRun). */
export interface StopEstimate {
  tripId: string;
  kind: StopKind;
  /** Pickup: when service starts. Drop-off: arrival. Null if the trip is cancelled. */
  time: Minutes | null;
  outsideWindow: boolean;
  onboardSeats: number;
  onboardWheelchairs: number;
  skipped: boolean;
}

export interface ImpactRow {
  tripId: string;
  riderName: string;
  kind: StopKind;
  locationLabel: string;
  mobilityNote: string;
  attendant: boolean;
  windowStart: Minutes | null;
  windowEnd: Minutes | null;
  before: Minutes | null;
  after: Minutes | null;
  outsideWindowAfter: boolean;
  onboardSeatsAfter: number;
  onboardWheelchairsAfter: number;
  overCapacityAfter: boolean;
  isRequester: boolean;
  completed: boolean;
}

export interface ProposedChange {
  tripId: string;
  kind: ChangeKind;
  newWindowStart: Minutes | null;
}

export interface RouteImpact {
  requestKind: ChangeKind;
  tripId: string;
  runId: string;
  vehicle: Vehicle;
  rows: ImpactRow[];
  capacityExceeded: boolean;
  othersOutsideWindow: string[];
  requesterOutsideWindow: boolean;
  requesterPickupAfter: Minutes | null;
  decision: Decision;
  reasons: DecisionReason[];
}

export type Decision = 'confirm' | 'route-to-dispatcher';

/** What the rider may see before submitting (FR-004, FR-008). No other riders' data. */
export interface RiderPreview {
  tripId: string;
  newWindowStart: Minutes | null;
  newWindowEnd: Minutes | null;
  estimatedPickup: Minutes | null;
  needsApproval: boolean;
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };
