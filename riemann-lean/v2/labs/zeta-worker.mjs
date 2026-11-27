import { zetaCandidate } from '../core/zeta.mjs';
import { zetaColor } from './zeta-models.mjs';

const width = 96, height = 160;
const cache = new Map();
self.addEventListener('message', event => {
  const { request, bounds } = event.data;
  const key = bounds.join(',');
  if (!cache.has(key)) {
    const [a, b, c, d] = bounds;
    const pixels = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y++) {
      const im = d - (d - c) * (y + .5) / height;
      for (let x = 0; x < width; x++) {
        const re = a + (b - a) * (x + .5) / width;
        const withinPolePixel = Math.abs(re - 1) <= (b - a) / width / 2 && Math.abs(im) <= (d - c) / height / 2;
        const color = withinPolePixel ? [38, 42, 49] : zetaColor(zetaCandidate(re, im));
        pixels.set([...color, 255], (y * width + x) * 4);
      }
    }
    if (cache.size >= 6) cache.delete(cache.keys().next().value);
    cache.set(key, pixels);
  }
  self.postMessage({ request, width, height, pixels: cache.get(key) });
});
