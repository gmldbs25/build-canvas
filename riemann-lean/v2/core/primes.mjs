const LIMIT = 1_000_000;

function buildPrimeTable(limit = LIMIT) {
  const composite = new Uint8Array(limit + 1);
  const primes = [];
  for (let n = 2; n <= limit; n++) {
    if (composite[n]) continue;
    primes.push(n);
    if (n * n <= limit) for (let k = n * n; k <= limit; k += n) composite[k] = 1;
  }
  return { primes, composite };
}

const TABLE = buildPrimeTable();

export function primePi(x) {
  if (!Number.isFinite(x) || x < 1 || x > LIMIT) throw new RangeError(`x must be in [1, ${LIMIT}]`);
  const n = Math.floor(x);
  let lo = 0, hi = TABLE.primes.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (TABLE.primes[mid] <= n) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export function primesInRange(a, b) {
  if (!Number.isInteger(a) || !Number.isInteger(b) || a < 1 || b < a || b > LIMIT) {
    throw new RangeError(`integer range must satisfy 1 ≤ a ≤ b ≤ ${LIMIT}`);
  }
  return TABLE.primes.slice(a <= 2 ? 0 : primePi(a - 1), primePi(b));
}

export function factorize(n) {
  if (!Number.isSafeInteger(n) || n < 2 || n > LIMIT) throw new RangeError(`n must be an integer in [2, ${LIMIT}]`);
  let rest = n;
  const factors = [];
  for (const p of TABLE.primes) {
    if (p * p > rest) break;
    if (rest % p !== 0) continue;
    let exponent = 0;
    while (rest % p === 0) { rest /= p; exponent++; }
    factors.push({ prime: p, exponent });
  }
  if (rest > 1) factors.push({ prime: rest, exponent: 1 });
  return factors;
}

export const PRIME_LIMIT = LIMIT;
