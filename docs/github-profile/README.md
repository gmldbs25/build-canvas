# Work 07 — GitHub Profile

## Scope

A short editorial article about transforming the GitHub profile for \`gmldbs25\` into an entry point for deployed projects, while using Build Canvas as the detailed development journal.

## Verified source material

- GitHub profile: https://github.com/gmldbs25
- Public profile README repository: https://github.com/gmldbs25/gmldbs25
- Live game and real screenshot: https://kotomachi-yoon.vercel.app/ and https://raw.githubusercontent.com/gmldbs25/gmldbs25/main/assets/kotomachi.webp
- Live simulator and real screenshot: https://fabflow-yoon.vercel.app/ and https://raw.githubusercontent.com/gmldbs25/gmldbs25/main/assets/fabflow.webp
- 3D graph: https://raw.githubusercontent.com/gmldbs25/gmldbs25/main/profile-3d-contrib/profile-green-animate.svg

## Editorial choices

- Keep the profile concise; show deployment outcomes before implementation details.
- The Work records the intent, technical mechanism, and problems solved: private contributions settings, SVG caching, and concurrent Actions commits.
- Both projects retain private source repositories. Link only to their public deployments and the public profile repository.
- Use actual deployed screenshots, never generated replacements. The linked SVG is updated independently by GitHub Actions.
- No release versions, volatile total contribution counts, or unsupported performance claims in durable copy.

## Integration

- Standalone page: \`projects/github-profile/index.html\`
- Public route: \`/build-canvas/github-profile/\`
- Entry listed first as Work 07 in \`app/page.tsx\`
- GitHub Pages packaging copies the single HTML file into \`dist-pages/github-profile/\`
- Keyboard shortcut \`H\` returns to Build Canvas home unless editing text; support reduced motion.
