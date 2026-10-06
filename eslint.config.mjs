import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "**/dist/**",
    "**/dist-pages/**",
    "next-env.d.ts",
  ]),
  {
    files: ["projects/transformer-to-agent/components/ui/**/*.{ts,tsx}"],
    rules: {
      // Work 3's local ESLint config preserves this vendored shadcn exception.
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
