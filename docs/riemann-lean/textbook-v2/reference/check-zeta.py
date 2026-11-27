"""Reproduce the sampled numeric audit; requires Python mpmath==1.3.0 and Node >=22.
Run from this directory: python check-zeta.py. Does not certify the full domain."""
import json
import random
import subprocess
from pathlib import Path
import mpmath as mp

mp.mp.dps = 45
rng = random.Random(20261127)
reals = [-2,-1.75,-1.5,-1,-.5,0,.1,.25,.5,.75,.9,.99,1,1.001,1.5,2,3]
imags = [-80,-40,-14.134725141734693,-1,0,.001,.1,1,9.064720283654388,14,14.134725141734693,21.02203963877155,40,60,80]
points = [(a,b) for a in reals for b in imags if (a,b)!=(1,0)]
points += [(rng.uniform(-2,3),rng.uniform(-80,80)) for _ in range(150)]
rows = []
for a,b in points:
    z = mp.zeta(mp.mpc(a,b))
    rows.append([a,b,float(z.real),float(z.imag)])
js = """
import {zetaCandidate as z} from './zeta-reference.mjs';
import fs from 'node:fs';
const rows=JSON.parse(fs.readFileSync(0,'utf8'));
let worst=0, absolute=0, worstCase=null, passed=0;
for(const [a,b,r,i] of rows) {
  const v=z(a,b);
  if(v.status!=='numeric') throw new Error('unexpected status: '+a+','+b);
  const e=Math.hypot(v.re-r,v.im-i), q=e/Math.max(1,Math.hypot(r,i));
  if(q>worst){worst=q;worstCase=[a,b];}
  absolute=Math.max(absolute,e);
  if(q<=1e-8)passed++;
}
const statuses=[z(1).status,z(1+1e-8).status,z(-3,20).status,z(NaN,0).status];
console.log(JSON.stringify({n:rows.length,passed,worstScaledError:worst,worstAbsoluteError:absolute,worstCase,statuses}));
if(passed!==rows.length || statuses.join(',')!=='pole,near-pole,out-of-domain,out-of-domain') process.exit(1);
"""
subprocess.run(["node","--input-type=module","-e",js], input=json.dumps(rows), text=True,
               cwd=Path(__file__).resolve().parent, check=True)
