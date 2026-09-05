# Admin Dashboard UI

React + TypeScript + Vite starter for the admin dashboard.

## Getting started

```bash
cp .env.example .env
npm install
npm run dev
```

## Structure

- `src/components` — reusable UI and layout components
- `src/features` — page/domain-specific modules
- `src/hooks` — reusable React hooks
- `src/lib` — API client and shared utilities
- `src/pages` — route-level pages
- `src/types` — shared TypeScript types

Set `VITE_API_BASE_URL` in `.env` to point at the backend. The API client automatically attaches a bearer token from local storage when present.
