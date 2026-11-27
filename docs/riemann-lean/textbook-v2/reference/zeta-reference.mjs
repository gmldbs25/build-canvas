// Work 08 candidate numeric core; educational prototype, not production or rigorous interval arithmetic.
// Euler–Maclaurin: N=64, m=10. DLMF §25.2. Domain -2<=re<=3, |im|<=80.
const COEFF = [1/12,-1/720,1/30240,-1/1209600,1/47900160,-691/1307674368000,1/74724249600,-3617/10670622842880000,43867/5109094217170944000,-174611/802857662698291200000];
const mul=([a,b],[c,d])=>[a*c-b*d,a*d+b*c];
const scale=([a,b],k)=>[a*k,b*k];
function div([a,b],[c,d]) {const v=c*c+d*d;return [(a*c+b*d)/v,(b*c-a*d)/v];}
function powNeg(n,re,im){const l=Math.log(n),a=Math.exp(-re*l),p=-im*l;return [a*Math.cos(p),a*Math.sin(p)];}
function sum(values){let s=0,c=0;for(const v of values){let t=s+v;c+=Math.abs(s)>=Math.abs(v)?(s-t)+v:(v-t)+s;s=t;}return s+c;}
export function zetaCandidate(re,im=0){
 if(!Number.isFinite(re)||!Number.isFinite(im)||re< -2||re>3||Math.abs(im)>80)return {status:'out-of-domain'};
 if(re===1&&im===0)return {status:'pole'};
 if(Math.hypot(re-1,im)<1e-6)return {status:'near-pole'};
 const N=64,a=powNeg(N,re,im),terms=[];
 for(let n=1;n<N;n++)terms.push(powNeg(n,re,im));
 terms.push(div(scale(a,N),[re-1,im]),scale(a,.5));
 let rising=[1,0],j=0;
 for(let k=1;k<=COEFF.length;k++){
   while(j<2*k-1){rising=mul(rising,[re+j,im]);j++;}
   terms.push(scale(mul(rising,a),COEFF[k-1]*N**(1-2*k)));
 }
 return {status:'numeric',re:sum(terms.map(t=>t[0])),im:sum(terms.map(t=>t[1]))};
}
