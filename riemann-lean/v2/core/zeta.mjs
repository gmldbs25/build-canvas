// Euler–Maclaurin candidate, N=64, m=10; see NUMERICS.md. This is a sampled
// Float64 approximation on a bounded domain, not interval arithmetic.
const COEFFICIENTS = [1/12,-1/720,1/30240,-1/1209600,1/47900160,-691/1307674368000,1/74724249600,-3617/10670622842880000,43867/5109094217170944000,-174611/802857662698291200000];
const multiply = ([a,b],[c,d]) => [a*c-b*d,a*d+b*c];
const scale = ([a,b],k) => [a*k,b*k];
function divide([a,b],[c,d]) { const v=c*c+d*d; return [(a*c+b*d)/v,(b*c-a*d)/v]; }
function negativePower(n,re,im) { const log=Math.log(n), mag=Math.exp(-re*log), phase=-im*log; return [mag*Math.cos(phase),mag*Math.sin(phase)]; }
function compensated(values) { let sum=0, correction=0; for (const value of values) { const next=sum+value; correction += Math.abs(sum)>=Math.abs(value) ? (sum-next)+value : (value-next)+sum; sum=next; } return sum+correction; }

export function zetaCandidate(re, im = 0) {
  if (!Number.isFinite(re) || !Number.isFinite(im) || re < -2 || re > 3 || Math.abs(im) > 80) return { status: 'out-of-domain' };
  if (re === 1 && im === 0) return { status: 'pole' };
  if (Math.hypot(re - 1, im) < 1e-6) return { status: 'near-pole' };
  const N=64, atN=negativePower(N,re,im), terms=[];
  for (let n=1;n<N;n++) terms.push(negativePower(n,re,im));
  terms.push(divide(scale(atN,N),[re-1,im]),scale(atN,0.5));
  let rising=[1,0], multiplied=0;
  for (let k=1;k<=COEFFICIENTS.length;k++) {
    while (multiplied < 2*k-1) { rising=multiply(rising,[re+multiplied,im]); multiplied++; }
    terms.push(scale(multiply(rising,atN),COEFFICIENTS[k-1]*N**(1-2*k)));
  }
  return { status: 'numeric', re: compensated(terms.map(v=>v[0])), im: compensated(terms.map(v=>v[1])), algorithm: 'Euler–Maclaurin N=64,m=10', domain: '−2≤Re(s)≤3; |Im(s)|≤80' };
}
