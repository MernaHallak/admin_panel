# Admin architecture reference

`shop_portal` is the canonical implementation for this workspace. This document records patterns that are present in that project; it is not a proposed generic architecture.

## Overview

The reference is a Next.js 15 App Router dashboard using TypeScript, `next-intl`, Axios, TanStack Query, and Sonner. Server pages own route/session entry checks and translation loading. Interactive feature components are client components. Browser calls go to same-origin Next route handlers under `app/api`; those handlers read HttpOnly cookies and proxy to the real backend through a server-only Axios instance. The browser never receives access or refresh tokens.

## Important source tree

```text
shop_portal/
├── app/
│   ├── [locale]/                 localized pages, layout, and route error UI
│   │   ├── products/             product list, detail, create and edit routes
│   │   ├── store/                store detail and edit routes
│   │   └── login/page.tsx
│   ├── api/                      Next route handlers that proxy/authenticate backend calls
│   │   ├── auth/                 login, refresh, logout, and me handlers
│   │   └── store/                store, categories, and product handlers
│   ├── globals.css               application component-class styling
│   ├── layout.tsx                QueryProvider and one global Sonner Toaster
│   └── query-provider.tsx
├── api/                          browser Axios API functions and queryKeys
├── components/
│   ├── dashboard/                dashboard shell, navbar, and page header
│   ├── auth/                     login form
│   ├── products/                 list, details, and create/edit forms
│   ├── store/                    detail and edit form
│   └── language-switcher.tsx
├── hook/
│   ├── queries/                  one useQuery wrapper per read concern
│   └── mutations/                one useMutation wrapper per write concern
├── i18n/                         routing, request config, and localized navigation
├── lib/
│   ├── auth/session.ts           server session-status check
│   ├── server/backend-error.ts   safe upstream-error normalization
│   ├── api-error.ts              browser Axios-error normalization
│   ├── backend-client.ts         server-only backend Axios client
│   ├── i18n/                     localized-value helper
│   └── validation/               shared form validation helpers
├── messages/                     `ar.json` and `en.json` namespaces
├── types/                        API/domain interfaces
└── middleware.ts                 next-intl middleware
```

There are no App Router route groups in the reference. The only dynamic route segment is `[locale]`; the locale is always prefixed (`/ar/...` or `/en/...`). The source contains one actual reusable data-table list, `components/products/products-list.tsx`; the Store route is a details screen rather than a second list.

## Naming and TypeScript conventions

- Directories and filenames are lower-case kebab case: `products-list.tsx`, `use-store-products.ts`, `query-keys.ts`.
- React components use PascalCase and named exports (`ProductsList`, `DashboardShell`, `PageHeader`). Page and layout files default-export a function declaration because Next.js consumes them.
- APIs are verb-led async function declarations (`getStoreProducts`, `createProduct`, `updateStore`), typed with `Promise<ResponseType>`.
- Hooks are named `use-<feature>` and live under singular `hook/queries` or `hook/mutations`.
- Domain/API shapes are interfaces in lower-case, singular type files (`types/product.ts`, `types/store.ts`). Request and response interfaces use suffixes such as `CreateProductRequest` and `ProductsResponse`.
- Constants are upper snake case only for module-level values such as `TABLE_COLUMN_COUNT`; cache keys live in lower-camel `queryKeys`.
- The code is strict TypeScript with the `@/*` alias. Type-only imports are marked `import type`.
- Props are normally named interfaces (`ProductsPageProps`, `PageHeaderProps`) and destructured in parameters. Async work uses `async`/`await`; `try`/`catch` is used when UI state or error translation must be set.

## React and page composition

Server pages under `app/[locale]` load translations with `getTranslations`, verify session through `requireDashboardSession(locale)`, then compose `DashboardShell`, `PageHeader`, and a feature component. See `app/[locale]/products/page.tsx` and `app/[locale]/store/page.tsx`.

Interactive components place `"use client"` first, then use `useTranslations`, data hooks, local state, and localized navigation. Keep feature UI in `components/<feature>` when it contains data/state/markup substantial enough to reuse or keep the page server-rendered. Keep cross-feature chrome in `components/dashboard` and small cross-feature UI in `components/`.

The product list (`components/products/products-list.tsx`) is the table template: toolbar, debounced query state, table heading/body, skeleton rows, normalized error with retry/login action, empty row, background-refresh indicator, and confirmation dialog only where a mutation needs it.

## API, auth, and error architecture

`api/client.ts` creates the browser client with `baseURL: "/api"`, `withCredentials: true`, and a 10-second timeout. It coordinates a single refresh promise on 401, retries a failed request once, and sends the browser to the localized login route if refresh cannot restore the session.

Browser API modules call this client and return `response.data`; they do not access cookies or backend URLs. Examples: `api/products.ts`, `api/store.ts`, and `api/auth.ts`.

`lib/backend-client.ts` is explicitly `server-only`, requires `BACKEND_API_URL`, uses a 10-second timeout, and is imported only by route handlers and server session code. Route handlers read `access_token` from an HttpOnly cookie and forward it as `Authorization: Bearer ...`; compare `app/api/store/products/route.ts`. Handlers preserve allowed query parameters and return the backend data unchanged on success.

Login (`app/api/auth/login/route.ts`) stores access and refresh tokens in HttpOnly, `sameSite: "lax"` cookies; it deliberately removes `session` from the browser response. `lib/auth/session.ts` validates the access token server-side through `/api/auth/me`. `require-dashboard-session.ts` redirects unauthenticated users, returns `notFound()` for forbidden users, and throws on infrastructure failures so a segment `error.tsx` handles them.

Both boundary layers normalize errors:

- `lib/server/backend-error.ts` preserves safe 4xx messages/validation errors but replaces unsafe technical or 5xx content with a route-specific fallback.
- `lib/api-error.ts` converts Axios failures into `{status, code, message, fieldErrors, translationKey}`. Client components show a safe backend message when available, otherwise translate `translationKey` from `Common`.
- Expected form errors stay within the form and use `role="alert"`; query errors use a table/page state with retry. The product list treats 401 as a login action and other failures as a retry action.

## TanStack Query conventions

`app/query-provider.tsx` creates one `QueryClient` in `useState`, with `staleTime: 30_000` and `refetchOnWindowFocus: false`. Read hooks call `useQuery`; product list queries explicitly retry non-401 failures fewer than two times (`hook/queries/use-store-products.ts`). Query keys are centralized in `api/query-keys.ts`: list keys are tuples containing params (`["store-products", params] as const`), individual resources are keyed by id, and singleton reads use one-element arrays.

Mutation hooks call their API function and invalidate the smallest list/singleton key in `onSuccess`. For example `use-create-product`, `use-update-product`, `use-delete-product`, and `use-hide-product` invalidate `queryKeys.storeProducts()`; image deletion invalidates both the detail and the list with `Promise.all`.

## Forms and CRUD

The product feature is the representative CRUD workflow:

- list: `app/[locale]/products/page.tsx` + `components/products/products-list.tsx` + `api/products.ts` + `use-store-products.ts`;
- create: `products/create/page.tsx` + `product-create-form.tsx` + `use-create-product.ts`;
- detail/edit: `products/[id]/page.tsx`, `products/[id]/edit/page.tsx`, corresponding components, `use-product.ts`, and mutation hooks.

Create/edit forms use native controlled inputs and local field state, not a shared form abstraction. They use `noValidate`, perform client checks before mutation, map normalized backend field errors to their associated controls, disable controls during submission, render a spinner in the submit button, and navigate through localized `useRouter`. Multipart operations build `FormData` in the API module, not the component. `lib/validation/product-validation.ts` contains the bilingual pair validation helper.

## Localization

`i18n/routing.ts` defines `ar` and `en`, Arabic as the default, and `localePrefix: "always"`. `middleware.ts` applies it to all non-API/non-static routes. `app/[locale]/layout.tsx` validates the locale, calls `setRequestLocale`, loads messages, sets `lang` and `dir`, and wraps content in `NextIntlClientProvider`. `i18n/navigation.ts` exports the localized `Link`, `redirect`, `usePathname`, and `useRouter`; do not import navigation primitives directly for localized navigation. `components/language-switcher.tsx` preserves the route while switching locales. Text lives in namespace-organized `messages/ar.json` and `messages/en.json`. Localized API fields use `getLocalizedValue` to prefer current locale, then legacy fallback, then alternate locale.

## Styling and reusable UI

The reference primarily uses semantic class names styled in `app/globals.css`, with a small Tailwind configuration rather than Tailwind utility composition. Repeated classes include `dashboard-page`, `dashboard-navbar`, `dashboard-content`, `page-heading`, `data-table-panel`, `table-toolbar`, `products-table`, `table-state`, `primary-button`, `secondary-button`, `skeleton`, and `spinner`. Tables sit in a horizontally scrollable wrapper, have responsive toolbar wrapping, and use full-width table rows for load/error/empty states. Responsive breakpoints are in the shared stylesheet. Icons come from `lucide-react`; product images use `next/image` when the remote host is configured.

`PageHeader`, `DashboardShell`, `DashboardNavbar`, and `LanguageSwitcher` are reusable because they serve multiple pages. Feature-specific table, form, and details markup remains in its feature directory.

## Super Admin rules

1. Treat `shop_portal` as read-only and inspect the closest implementation before adding a Super Admin feature.
2. Use `app/[locale]`, next-intl routing/messages/navigation, `@/*`, named component exports, and lower-case kebab filenames.
3. Keep browser API functions in `api/`, types in `types/`, query keys in `api/query-keys.ts`, read hooks in `hook/queries/`, and mutations in `hook/mutations/`.
4. Use a same-origin route handler plus the server-only backend client for protected APIs. Never expose bearer tokens or `BACKEND_API_URL` to client code.
5. Type the actual documented response. Forward only documented query/body fields and do not invent list columns or actions.
6. Use `normalizeBackendError` in proxy handlers and `normalizeApiError` in client UI. Provide loading, error/retry, and empty states.
7. Use query-key parameter tuples for paginated/filterable lists. Reset pagination when filters change; invalidate only affected keys after a mutation.
8. Keep user-visible strings in both message files, including aria labels and table-state content. Format dates/numbers with the active locale.
9. Reuse the existing dashboard/table classes and responsive behavior; do not redesign the administration UI.
10. Implement only the requested feature and the supporting shared infrastructure it requires.

## Stores list adaptation

The implemented Super Admin list follows the product-list composition but maps the documented global endpoint exactly: `GET /api/super-admin/stores` has `q`, `status`, `sort`, `page`, and `limit`, returns `{data, pagination}`, and includes active and inactive stores. It therefore uses a table and debounced search like products, adds the two documented select filters and documented pagination controls, and intentionally omits create/detail/toggle actions because this task is list-only.
