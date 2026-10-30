import type { Port, SimulationState } from '../sim/types';

export type FacilityPortIndicators = {
  stored: number;
  reserved: number;
  sourceQueue: number;
  serviceAtPort: boolean;
};

/** Aggregate the state used by each rendered equipment port in one pass. */
export function facilityPortIndicators(
  ports: readonly Pick<Port, 'id' | 'node'>[],
  state: Pick<SimulationState, 'storedFoups' | 'requests' | 'vehicles'>,
): Map<string, FacilityPortIndicators> {
  const result = new Map<string, FacilityPortIndicators>();
  const nodeByPort = new Map<string, string>();
  for (const port of ports) {
    nodeByPort.set(port.id, port.node);
    if (!result.has(port.id)) result.set(port.id, { stored: 0, reserved: 0, sourceQueue: 0, serviceAtPort: false });
  }

  for (const foup of state.storedFoups) {
    const indicators = result.get(foup.portId);
    if (indicators) indicators.stored++;
  }

  const requestsById = new Map<string, typeof state.requests>();
  for (const request of state.requests) {
    const reservedPort = result.get(request.destination);
    if (reservedPort && ['assigned', 'pickup', 'loaded', 'dropoff'].includes(request.phase)) reservedPort.reserved++;
    const sourcePort = result.get(request.source);
    if (sourcePort && ['pending', 'assigned'].includes(request.phase)) sourcePort.sourceQueue++;

    const matching = requestsById.get(request.id);
    if (matching) matching.push(request);
    else requestsById.set(request.id, [request]);
  }

  for (const vehicle of state.vehicles) {
    if ((vehicle.phase !== 'pickup' && vehicle.phase !== 'dropoff') || !vehicle.request) continue;
    for (const request of requestsById.get(vehicle.request) ?? []) {
      if (request.vehicle !== vehicle.id) continue;
      if (nodeByPort.get(request.source) === vehicle.node) {
        const sourcePort = result.get(request.source);
        if (sourcePort) sourcePort.serviceAtPort = true;
      }
      if (nodeByPort.get(request.destination) === vehicle.node) {
        const destinationPort = result.get(request.destination);
        if (destinationPort) destinationPort.serviceAtPort = true;
      }
    }
  }

  return result;
}
