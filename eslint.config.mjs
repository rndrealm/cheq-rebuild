import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Public mutations/actions must go through the auth middleware in
    // convex/lib/functions.ts. Intentionally public functions opt out with an
    // eslint-disable comment explaining why.
    files: ["convex/**/*.ts"],
    ignores: ["convex/lib/functions.ts", "convex/_generated/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/_generated/server"],
              importNames: ["mutation", "action"],
              message:
                "Use authedMutation/authedAction from convex/lib/functions.ts (or internalMutation/internalAction).",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
