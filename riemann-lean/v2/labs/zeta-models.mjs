export function reflectedZeros(beta, gamma) {
  if (!Number.isFinite(beta) || beta < .05 || beta > .95 || !Number.isFinite(gamma) || gamma < 5 || gamma > 80) {
    throw new RangeError('β는 0.05–0.95, γ는 5–80 범위에서 선택하세요.');
  }
  return (beta === .5 ? [beta] : [beta, 1 - beta])
    .flatMap(re => [[re, gamma], [re, -gamma]]);
}

export function zetaColor(result) {
  if (result.status !== 'numeric') return [38, 42, 49];
  const angle = Math.atan2(result.im, result.re);
  const magnitude = Math.hypot(result.re, result.im);
  const hue = (angle / (2 * Math.PI) + 1) % 1;
  const light = .18 + .64 * magnitude / (1 + magnitude);
  const chroma = (1 - Math.abs(2 * light - 1)) * .7;
  const h = 6 * hue;
  const x = chroma * (1 - Math.abs(h % 2 - 1));
  const rgb = [[chroma, x, 0], [x, chroma, 0], [0, chroma, x], [0, x, chroma], [x, 0, chroma], [chroma, 0, x]][Math.floor(h)];
  return rgb.map(channel => Math.round((channel + light - chroma / 2) * 255));
}
