# Super Admin implementation rules

- `../shop_portal` is read-only and is the source of truth. Inspect its closest feature before coding.
- Use Next 15 App Router with locale routes in `app/[locale]`, `next-intl`, the `@/*` alias, strict TypeScript, and kebab-case filenames.
- Server pages compose `DashboardShell` + `PageHeader`; interactive feature UI lives in `components/<feature>` and begins with `"use client"`.
- Browser calls use `api/client.ts` with same-origin `/api` routes. Protected route handlers read HttpOnly cookies, forward `Authorization: Bearer` through `lib/backend-client.ts`, and never expose tokens or backend URLs.
- Put typed browser APIs in `api/`, keys in `api/query-keys.ts`, query hooks in `hook/queries/`, mutation hooks in `hook/mutations/`, and domain types in `types/`.
- Use TanStack Query. Lists have parameterized tuple keys, loading/error/empty states, localized retry actions, and documented filters only.
- Use `normalizeBackendError` at server boundaries and `normalizeApiError` in client UI. Do not display technical/5xx backend messages.
- Add every visible string and aria label to both `messages/ar.json` and `messages/en.json`; use localized navigation and format dates/numbers with the active locale.
- Preserve the shared dashboard/table CSS conventions. Do not introduce unrelated pages, API fields, or libraries.
- Before structural or non-trivial feature work, consult `docs/admin-architecture-reference.md`.
- Before reporting any UI work complete, perform a basic visual/UX review for alignment, spacing, responsiveness, RTL/LTR, localized strings, loading/error/empty states, and obvious duplicated or unreachable controls; fix clear regressions within scope.
- If the documentation and the actual `../shop_portal` implementation ever differ, the actual `shop_portal` code is the final source of truth.
