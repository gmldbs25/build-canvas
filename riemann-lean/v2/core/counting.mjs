import { PRIME_LIMIT, primesInRange } from './primes.mjs';

const LOG_LIMIT = Math.log(PRIME_LIMIT);
let eventTable;
const eventCache = new Map();

export function primePowerEvents(limit = PRIME_LIMIT) {
  if (!Number.isInteger(limit) || limit < 1 || limit > PRIME_LIMIT) throw new RangeError(`limit must be an integer in [1, ${PRIME_LIMIT}]`);
  if (limit === PRIME_LIMIT && eventTable) return eventTable;
  if (eventCache.has(limit)) return eventCache.get(limit);
  const events = [];
  for (const p of (limit >= 2 ? primesInRange(2, limit) : [])) {
    const jump = Math.log(p);
    for (let power = p; power <= limit;) {
      events.push({ n: power, prime: p, jump });
      if (power > Math.floor(limit / p)) break;
      power *= p;
    }
  }
  events.sort((a, b) => a.n - b.n);
  let sum = 0;
  for (const event of events) { sum += event.jump; event.prefix = sum; }
  const immutableEvents = Object.freeze(events.map(event => Object.freeze(event)));
  if (limit === PRIME_LIMIT) eventTable = immutableEvents;
  else {
    if (eventCache.size >= 8) eventCache.delete(eventCache.keys().next().value);
    eventCache.set(limit, immutableEvents);
  }
  return immutableEvents;
}

function upperEventIndex(x, events) {
  let lo = 0, hi = events.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (events[mid].n <= x) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

function evaluateCounting(x, midpoint) {
  if (!Number.isFinite(x) || x < 1 || x > PRIME_LIMIT) throw new RangeError(`x must be in [1, ${PRIME_LIMIT}]`);
  const events = primePowerEvents();
  const count = upperEventIndex(x, events);
  const sum = count ? events[count - 1].prefix : 0;
  if (!midpoint || count === 0) return sum;
  const event = events[count - 1];
  return event.n === x ? sum - event.jump / 2 : sum;
}

export function theta(x) {
  if (!Number.isFinite(x) || x < 1 || x > PRIME_LIMIT) throw new RangeError(`x must be in [1, ${PRIME_LIMIT}]`);
  if (x < 2) return 0;
  let sum = 0;
  for (const p of primesInRange(2, Math.floor(x))) sum += Math.log(p);
  return sum;
}

export const psi = x => evaluateCounting(x, false);
export const psi0 = x => evaluateCounting(x, true);

export function vonMangoldt(n) {
  if (!Number.isInteger(n) || n < 1 || n > PRIME_LIMIT) throw new RangeError(`n must be an integer in [1, ${PRIME_LIMIT}]`);
  const events = primePowerEvents();
  const event = events[upperEventIndex(n, events) - 1];
  return event?.n === n ? event.jump : 0;
}

export function li2(x) {
  if (!Number.isFinite(x) || x < 2 || x > PRIME_LIMIT) throw new RangeError(`Li₂ is supported for x in [2, ${PRIME_LIMIT}]`);
  if (x === 2) return 0;
  const L = Math.log(x);
  let term = L;
  let sum = term;
  for (let k = 2; k < 1000; k++) {
    term *= L / k;
    const add = term / k;
    sum += add;
    if (Math.abs(add) <= Math.abs(sum) * 2e-16) break;
  }
  return 0.5772156649015329 + Math.log(L) + sum - 1.0451637801174928;
}

// Integral from 2 to x (the offset logarithmic integral Li₂ used in the manuscript).
export const logIntegral = li2;
export const LOG_COUNTING_LIMIT = LOG_LIMIT;
