# 💻 AiCademy · Frontend Web Application

The frontend client for the **AiCademy** agentic classroom platform, built with **React 19**, **TypeScript**, **Vite 8**, and **Tailwind CSS v4**.

For the complete project overview, architecture specifications, and agent topology, refer to the root [**`README.md`**](../README.md) and the project memory [**`brain.md`**](../brain.md).

---

## ⚡ Quick Start

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Run unit and integration tests
npx vitest run

# Run code linter
npm run lint

# Build production bundle with TypeScript typecheck
npm run build
```

The development server starts by default at **`http://localhost:5173/`**.

---

## 🛠️ Technology Stack

| Layer | Technology | Version | Purpose |
|:---|:---|:---|:---|
| **Core Framework** | [React](https://react.dev/) | `^19.2.8` | Declarative UI components & hooks |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | `~6.0.2` | Strict end-to-end type safety |
| **Bundler & Tooling** | [Vite](https://vitejs.dev/) | `^8.3.0` | Next-generation frontend tooling & lightning HMR |
| **Routing** | [React Router](https://reactrouter.com/) | `^7.18.4` | Client-side routing with role guards |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | `^4.3.3` | Utility-first styling with `@theme` CSS tokens |
| **Mock Engine** | [Mock Service Worker (MSW)](https://mswjs.io/) | `^2.15.0` | Network-level HTTP mock interception |
| **Validation** | [Zod](https://zod.dev/) | `^4.6.5` | Runtime schema validation for tool & API contracts |
| **Icons** | [Lucide React](https://lucide.dev/) | `^1.52.0` | Accessible, modern iconography |
| **Charts** | [Recharts](https://recharts.org/) | `^3.10.1` | Analytics and leaderboard visualization |
| **Test Runner** | [Vitest](https://vitest.dev/) | `^5.0.3` | Blazing-fast Vite-native testing suite |

---

## 📁 Source Directory Map

```
frontend/src/
├── auth/                 # AuthContext, RoleGuard, ProtectedRoute, JWT utilities
├── components/
│   ├── layout/           # AppShell, Topbar, Sidebar, PageContainer, Section
│   └── ui/               # Button, Card, Modal, FormField, ButtonGroup, StatCard, Badge
├── context/              # ThemeContext (light/dark), AccentContext (12 presets + custom)
├── mocks/
│   ├── browser.ts        # MSW worker initialization
│   ├── db/               # In-memory database, initial seed data & UUID generators
│   └── handlers/         # MSW HTTP request handlers (auth, courses, materials, etc.)
├── pages/
│   ├── admin/            # Administrative observability & system console
│   ├── auth/             # Login, Register & DemoRoleSwitcher
│   ├── common/           # Appearance Settings & profile screens
│   ├── professor/        # Professor dashboard, course studio, materials & roster
│   └── student/          # Student dashboard, course catalog & course detail
├── services/             # Typed Axios modules (http.ts, auth.ts, courses.ts, materials.ts)
├── test/                 # Automated test suites executed with Vitest
├── tokens/               # Spacing tokens (4px mathematical baseline scale)
└── types/                # Domain models, agent schemas, and API request/response types
```

---

## 🎨 Design System & Theming

- **Frosted Glass Depth**: UI surfaces leverage `backdrop-blur-xl`, `bg-surface/80-90`, and crisp hairline borders with ambient color illumination.
- **Dynamic Accent System**: 12 curated palettes (Iris Indigo, Ocean Blue, Electric Cyan, Deep Teal, Forest Emerald, Sunburst Amber, Sunset Coral, Crimson Rose, Vivid Pink, Neon Fuchsia, Amethyst Violet, Royal Purple) with automatic WCAG AA text contrast calculation.
- **Zero FOUC**: An inline `<head>` script in `index.html` resolves the active theme and accent color prior to initial browser render.
- **Strict 4px Scale**: All paddings, margins, gaps, and containers strictly adhere to the 4px baseline scale defined in `src/tokens/spacing.ts`.
- **Touch Accessibility**: All interactive elements adhere to minimum 44px mobile touch targets with full keyboard accessibility.

---

## 🧪 Testing

Run test suites from the `frontend/` directory:

```bash
# Run all tests once
npx vitest run

# Run tests in watch mode
npx vitest

# Run a specific test suite
npx vitest run src/test/courses.test.ts
```

All 17 integration and unit tests are currently passing.
