# /backend (reserved, NOT implemented)

Future home of the Express API described in /docs/ARCHITECTURE_SOURCE.md Sections 3.2 and 5
(Node.js, Express, MVC, JWT, bcryptjs, Multer, rate limiting, MongoDB models).

Do not implement anything here until the project owner starts ROADMAP.md Phase 1.
Until then, every `/api/*` route is served by the MSW mock layer in `/frontend/src/mocks`.
When this phase starts, the frontend switches over by setting `VITE_USE_MOCKS=false` and `VITE_API_BASE_URL`.
