# Chapter 09 visual evidence

Generated from the static textbook build (node riemann-lean/v2/book/build.mjs) and served locally at /chapter-09/. Captures are from Chromium at CSS viewports 1440×1000, 390×844, and 320×740. “*-lab.png” crops the graph workspace; “*-workspace.png” shows the mounted lab in the page context. These files are review evidence and are excluded from the Pages build.

## Observed checks

- The 09-A lab mounts after its chapter section enters the viewport; no browser page errors.
- No horizontal page overflow at the three widths. The SVG chart adapts to available width, shows x ticks, and keeps the y-axis title clear of y tick labels.
- All 61 integer N choices are available; changing N to 7 and then using the N=60 preset changes Fₙ(5.5) to 4.0667185 and 4.1184984 respectively.
- At x=8, the right-continuous ψ readout is 6.73340189 and the ψ₀ midpoint readout is 6.38682830.
- The error graph tab changes its pressed state, and reset returns N=15.

Final integrated builds additionally show a dedicated single-wave view, signed bars, and pan/zoom controls. See [the final desktop workspace](../lab-09-a-1440.webp), [the final mobile workspace](../lab-09-a-390.webp), and [the integration checks](../browser-results.txt).
