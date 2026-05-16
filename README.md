<div align="center">

# AtomQuest Portal

### Enterprise-grade Goal Setting & Tracking — built for Atomberg.

**Hackathon submission for the AtomQuest Hackathon 2026** by Atomberg Technologies.

[Live Demo](#) · [Architecture](./docs/ARCHITECTURE.md) · [Demo Credentials](#-demo-credentials)

</div>

---

## ✨ What it does

AtomQuest is a structured, audit-ready Goal Setting & Tracking portal that replaces fragmented spreadsheets and offline review cycles. It covers the entire lifecycle — from goal creation and L1 approval, through quarterly check-ins with auto-computed scores, all the way to exec analytics and audit governance.

Built for three distinct personas — Employee, Manager (L1), and Admin/HR — each gets a tailored workflow surface, with strict role-based access enforced at the middleware layer.

## 🎯 Brief alignment

Every Phase 1 + Phase 2 must-have from the Problem Statement is implemented:

| Requirement | Status |
|---|---|
| Goal creation with Thrust Area, UoM, Target, Weightage | ✅ |
| Validation: weightage = 100%, min 10%, max 8 goals | ✅ enforced client + server |
| Manager L1 approval with inline edits + return-for-rework | ✅ |
| Goal locking on approval | ✅ |
| Shared goals (admin/mgr push, recipient adjusts weightage only) | ✅ |
| Quarterly check-ins with status tracking | ✅ Q1–Q4 windows |
| Auto-computed scores for all 4 UoM formulas | ✅ |
| Manager check-in module with structured comments | ✅ |
| Quarterly window enforcement | ✅ |
| CSV / Excel export of planned vs actual | ✅ |
| Completion dashboard | ✅ |
| Audit trail of every change post-lock | ✅ |

**Plus all four good-to-have bonuses:**
- 🔐 Microsoft Entra ID — UI-ready SSO flow with documented integration path
- 🔔 Notification system + in-app deep links (email/Teams roadmap-ready)
- ⚡ Escalation engine — rule-based, configurable thresholds, visible escalation log
- 📊 Analytics — QoQ trends, heatmaps, thrust-area distribution, manager effectiveness

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Next.js 15 App Router (Vercel Edge)            │
│  ┌───────────┐  ┌────────────┐  ┌──────────────┐           │
│  │  Landing  │  │   Login    │  │  Dashboard   │           │
│  │  (3D R3F) │  │ Quick-fill │  │ Role-routed  │           │
│  └───────────┘  └────────────┘  └──────────────┘           │
│         │              │                │                   │
│         └──────────────┴────────────────┘                   │
│                        │                                    │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Middleware: Route protection + role enforcement   │    │
│  └────────────────────────────────────────────────────┘    │
│                        │                                    │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Server Actions / Route Handlers                   │    │
│  │  - Goal CRUD  - Approval  - Check-in  - Export     │    │
│  └────────────────────────────────────────────────────┘    │
│                        │                                    │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Domain Services                                   │    │
│  │  - Validators  - Score engine  - Audit logger      │    │
│  │  - Escalation rule engine  - Notification queue    │    │
│  └────────────────────────────────────────────────────┘    │
│                        │                                    │
│              Prisma ORM (type-safe queries)                 │
│                        │                                    │
└────────────────────────┼────────────────────────────────────┘
                         │
              ┌──────────▼──────────┐
              │  Postgres (Neon)    │  ← Serverless, auto-scaling
              │  ap-southeast-1     │  ← Regional for low latency
              └─────────────────────┘
```

## 🛠️ Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) | RSC + Server Actions = one codebase, fewer round trips |
| Language | TypeScript strict | Type safety end-to-end, fewer bugs at runtime |
| UI | Tailwind CSS + custom design system | Premium look, no CSS bloat |
| Components | Radix primitives + custom | Accessible, headless, fully owned |
| Animation | Framer Motion | Spring physics for natural motion |
| 3D | React Three Fiber + Drei | Signature 3D visualizations |
| Auth | NextAuth v5 (Credentials + SSO-ready) | Standard, swappable provider |
| Database | Postgres on Neon | Serverless, branch-able, free tier covers demo |
| ORM | Prisma 6 | Type-safe queries, schema-as-code |
| Validation | Zod + react-hook-form | Single source of truth, client+server validation |
| Charts | Recharts | Composable, themable, SSR-safe |
| Hosting | Vercel | Zero-config, edge-optimized, instant rollback |

## 💰 Cost optimization

- **All free-tier**: Neon free tier (3 GB storage), Vercel hobby (100 GB bandwidth)
- **Serverless throughout**: zero idle cost — pay nothing when no one's using it
- **Server Components**: HTML rendered on edge, dramatically less JS shipped
- **`optimizePackageImports`**: tree-shakes lucide, framer-motion, drei aggressively
- **Single-region Postgres** (ap-southeast-1): minimal latency for SAARC demo audience
- **DB queries are indexed** on every join column — see `prisma/schema.prisma`
- **Streaming UI**: Suspense boundaries make perceived load instant
- **Production-ready scale path documented** in `docs/SCALING.md`

## 🚀 Local setup

```bash
# 1. Install
npm install

# 2. Apply schema to your Neon database
npm run db:push

# 3. Seed demo data
npm run db:seed

# 4. Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 🔑 Demo credentials

Password for all: `demo1234`

| Role | Email | Persona |
|---|---|---|
| 👑 Admin / HR | `admin@atomberg.com` | Priya Sharma — HR Director |
| 👔 Manager (L1) | `manager@atomberg.com` | Rohan Kapoor — Engineering Manager |
| 💼 Employee | `employee@atomberg.com` | Arjun Patel — Senior SWE |
| 💼 Employee 2 | `employee2@atomberg.com` | Sneha Iyer — Product Designer |

The login screen has **one-click quick-fill** for each persona.

## 🧪 Evaluation rubric — how we score

| Criterion | Our approach |
|---|---|
| **1. Functionality end-to-end** | Every flow demoed: create → submit → approve → check-in → export |
| **2. Adherence to BRD** | 100% of must-haves implemented; all 4 bonus features included |
| **3. User Friendliness** | Premium SaaS-grade UI; spring animations; helpful inline errors; consistent across roles |
| **4. Bugs & stability** | Strict TS + Zod validation; server-side enforcement of every rule |
| **5. Bonus features** | SSO-ready, notifications, escalation engine, full analytics — all four |
| **6. Cost optimization** | Free-tier capable; serverless; indexed queries; tree-shaken bundle |

## 📁 Repository layout

```
atomquest-portal/
├── prisma/
│   ├── schema.prisma         # Complete data model
│   └── seed.ts                # Demo data
├── src/
│   ├── app/                   # App Router routes
│   │   ├── (landing)/         # Public landing
│   │   ├── login/             # Auth entry
│   │   ├── dashboard/         # Authenticated app
│   │   └── api/               # Route handlers
│   ├── components/
│   │   ├── ui/                # Design system primitives
│   │   ├── layout/            # Sidebar, topbar
│   │   ├── landing/           # Hero + 3D atom
│   │   ├── auth/              # Login form
│   │   └── goals/             # Goal creation, approval, check-in
│   └── lib/                   # Prisma client, auth, utils, score engine
└── docs/
    ├── ARCHITECTURE.md
    ├── SCALING.md
    └── architecture.svg
```

## 👤 Built by

**Raktim Chandra** — Solo participant, AtomQuest Hackathon 2026.

---

<div align="center">
<sub>Made with relentless focus over 30 sleepless hours. 🌒</sub>
</div>
