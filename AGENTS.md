<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Package Manager

Always use `pnpm` for installing packages. Never use `npm` or `yarn`.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->

# Convex Auth (Middleware)

Every public Convex function that acts on behalf of a user must use the auth builders in `convex/lib/functions.ts` instead of raw `query` / `mutation` / `action`:

- `authedQuery`, `authedMutation`, `authedAction` resolve the caller from the session and expose the `users` doc as `ctx.user`. They throw `"Not authenticated"` if there is no session.
- `optionalAuthQuery` is for the caller's own data (notifications, point history): `ctx.user` is `null` when logged out and the handler returns an empty result instead of throwing, so live queries don't error while the user signs out.
- **Never accept a `userId` / `creatorId` argument to decide who is acting.** Use `ctx.user._id`. Ownership checks that depend on a specific document (e.g. "only the bet creator can cancel") go in the handler, comparing against `ctx.user._id`.
- Functions called only by the server (crons, scheduler, other functions) should be `internalQuery` / `internalMutation` / `internalAction`.
- Raw `mutation` / `action` imports in `convex/` are blocked by ESLint (`no-restricted-imports`). An intentionally public function (e.g. market data used on logged-out pages) opts out with `// eslint-disable-next-line no-restricted-imports -- <reason>`.
- Helpers: `getCurrentUser(ctx)` / `requireUser(ctx)` in `convex/lib/auth.ts` for code that can't use the builders.
- Tests: call authed functions with `t.withIdentity({ subject: "<authId>" })`, and cover the logged-out and wrong-user cases.

# Convex Mutations

Always use the `useConvexMutation` hook (`src/hooks/use-convex-mutation.ts`) instead of raw `useMutation` from `convex/react`. It provides `mutate`, `reset`, and derived state (`isPending`, `isSuccess`, `isError`, `data`, `error`).

# Remote Images

Always use the `RemoteImage` component (`src/components/ui/remote-image.tsx`) when displaying images from external URLs (e.g. token logos, user avatars). It handles loading shimmer states, fallback images, and uses `unoptimized` for remote sources. Never use raw `<img>` tags for external images.

# Class Merging

Always use the `cn()` utility (`src/lib/utils.ts`) when combining static and dynamic class names. Never use template literal interpolation for merging Tailwind classes.
