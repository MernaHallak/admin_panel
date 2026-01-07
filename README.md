# Admin Panel (Next.js 15)

Converted from a React (Vite) admin panel to **Next.js 15 App Router**.

## Stack
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- No ESLint

## Routes
- `/shops` — Shops table
- `/shops/[shopId]` — Shop details
- `/products` — Products table
- `/products/add` — Add product
- `/products/[productId]/edit` — Edit product

## Persistence
Data (shops/products) is stored in **localStorage** under key `laptop_store_admin:v1`.
Use the `reset()` function from `useAdminData()` if you add a reset button later.

## Run
```bash
npm install
npm run dev
```
