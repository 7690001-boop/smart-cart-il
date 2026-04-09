# Smart Cart IL

Mobile-first Next.js MVP to optimize grocery shopping in Israel.

## Features

- Accounts and authenticated shopping lists.
- Per-item replacement restrictions (brand, kosher, premium, size tolerance).
- Central feed ingestion endpoint.
- Single-store basket optimization with explainable output.
- Admin clustering review queue.

## Run

1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`
3. Run tests: `npm run test`

## API Endpoints

- `POST /api/auth/login`
- `GET /api/lists`
- `POST /api/lists`
- `POST /api/lists/[listId]/items`
- `POST /api/ingestion/sync`
- `POST /api/optimize`
- `GET/PATCH /api/admin/clusters`