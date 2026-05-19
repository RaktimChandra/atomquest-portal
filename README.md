<div align="center">

<h1>AtomQuest Portal</h1>

### Goals that actually align.

**Enterprise-grade goal setting & tracking portal — built for Atomberg.**

[Live Demo](https://atomquest-portal-eta.vercel.app) · [Architecture Diagram](./docs/architecture.svg) · [Judge Briefing](./docs/JUDGE_BRIEFING.md) · [Demo Script](./docs/DEMO_SCRIPT.md)

<sub>Submission for **AtomQuest Hackathon 2026** by Atomberg Technologies · Built solo in 30 hours by **Raktim Chandra**</sub>

</div>

---

## 🚀 Try it now

Open the [live URL](https://atomquest-portal-eta.vercel.app) → click "Launch Portal" → tap any persona quick-fill card.

**Password for all roles: `demo1234`**

| Role | Email | What you'll see |
|---|---|---|
| 👑 **Admin / HR** | `admin@atomberg.com` | Cycles · Org · Completion · 3D Galaxy · Audit · Escalations |
| 👔 **Manager** | `manager@atomberg.com` | Approvals · Team · Analytics · Check-ins |
| 👔 **Manager 2** | `manager2@atomberg.com` | Same as above, different team |
| 💼 **Employee** | `employee@atomberg.com` | Goal sheet · Live weightage donut · Quarterly check-ins |
| 💼 **Employee 2** | `employee2@atomberg.com` | Has 3 submitted goals awaiting manager approval |
| 💼 **Employee 3** | `employee3@atomberg.com` | Different department, alternate workflow state |

---

## ✨ What's inside

AtomQuest is a complete goal-management system replacing fragmented spreadsheets with a single audit-ready portal. Three personas, full lifecycle, real-time scoring, exec analytics.

### Phase 1 — Goal Creation & Approval ✅
- 4 UoM types (Numeric Min/Max, Percentage Min/Max, Timeline, Zero-based)
- Client + server enforcement: Σ weightage = 100%, min 10%, max 8 goals
- Live animated weightage donut with state-aware colouring
- Manager L1 approval workflow with inline edits + return-for-rework
- Goal locking on approval (admin can unlock with audit log)
- **Shared goals** with primary-owner sync of achievement to children

### Phase 2 — Quarterly Check-ins ✅
- Q1/Q2/Q3/Q4 windows (July / Oct / Jan / Mar-Apr) enforced
- All 4 score formulas computing live
- Manager check-in module with structured comments + optional rating
- Status: Not Started / On Track / At Risk / Completed

### Reporting & Governance ✅
- CSV + Excel export (formatted XLSX with banded rows, frozen header, auto-filter)
- Real-time completion dashboard with department × quarter heatmap
- Immutable audit log with before/after JSON diffs, role-scoped views

### All 4 Bonus Features ✅
- 🔐 **Microsoft Entra ID** — Mock SSO flow with documented real integration path
- 🔔 **Notifications** — In-app bell + dedicated page + deep-links
- ⚡ **Escalation Engine** — Configurable rules + on-demand scan + audit log
- 📊 **Analytics** — QoQ trends, distributions, heatmaps, manager effectiveness, **+ 3D Org Galaxy**

---

## 🎨 Design language

**Monochrome canvas with one perfect accent.** Light by default, dark mode equally premium. Inspired by Linear's restraint, Vercel's gradient moments, Notion's warmth.

Three signature 3D visualizations:
1. **Quark Logo** — animated brand monogram (orbit + filled sphere)
2. **Atom v2** — landing-page glass icosahedron with refraction + 3 particle ribbons
3. **Org Galaxy** — analytics centerpiece; drag-rotate, hover for details

Animation principles: spring physics everywhere, magnetic CTAs, number tickers, scroll-revealed sections, smooth theme morph.

---

## 🏗️ Tech stack

| Layer | Tech | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) | RSC + Server Actions = fewer round-trips |
| Language | TypeScript strict | Type safety end-to-end |
| Auth | NextAuth v5 (Credentials + mock SSO) | Edge-safe; ready for real Entra |
| DB | Postgres on Neon (ap-southeast-1) | Serverless, free-tier, low India latency |
| ORM | Prisma 6 | Type-safe, schema-as-code |
| UI | Tailwind v3 + Radix primitives | Accessible, owned, no bloat |
| Animation | Framer Motion | Spring physics |
| 3D | React Three Fiber + Drei | Three signature scenes |
| Charts | Recharts | SSR-safe, themable |
| Export | ExcelJS | Formatted XLSX |
| Hosting | Vercel | Zero-config, edge-optimized |

See [`docs/architecture.svg`](./docs/architecture.svg) for the full diagram.

---

## 💰 Cost optimization

- **Free-tier capable:** Vercel Hobby + Neon Free = ₹0/month at demo scale
- **Serverless throughout** — zero idle cost
- **Edge middleware split** — sub-100KB bundle (well under Vercel's 1 MB limit)
- **Server Components** — ~60% less JS shipped vs a SPA
- **Pooled DB connections** via Neon pooler — no exhaustion on cold starts
- **Indexed queries** on every join column
- **Streaming exports** — no disk I/O for XLSX/CSV

---

## 🛠️ Local setup

```bash
git clone https://github.com/RaktimChandra/atomquest-portal.git
cd atomquest-portal
npm install
cp .env.example .env  # then fill DATABASE_URL + AUTH_SECRET
npm run db:push       # apply schema to your Postgres
npm run db:seed       # populate demo data
npm run dev           # http://localhost:3000
```

**Indian ISP note:** Some ISPs block port 5432. If `db:seed` hangs, enable Cloudflare WARP and retry.

---

## 📁 Repository layout

```
atomquest-portal/
├── prisma/
│   ├── schema.prisma          # Full data model (13 tables)
│   └── seed.ts                # Demo data (6 users, 1 cycle, sample goals)
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── page.tsx           # Landing
│   │   ├── login/             # Login + persona quick-fill
│   │   ├── dashboard/         # All authenticated pages, role-routed
│   │   ├── api/               # Auth, notifications, escalations, exports
│   │   └── sso/               # Mock Entra ID flow
│   ├── components/
│   │   ├── ui/                # Design system primitives + Logo + tickers
│   │   ├── layout/            # Sidebar + Topbar
│   │   ├── landing/           # Hero + Atom v2 (R3F)
│   │   ├── auth/              # Login form
│   │   ├── goals/             # Goal editor + weightage donut v2
│   │   ├── manager/           # Approval inbox + detail
│   │   ├── checkins/          # Check-in form + score gauge
│   │   ├── shared/            # Shared-goal form
│   │   ├── admin/             # Cycles, org, escalations, completion, export
│   │   ├── analytics/         # Charts + 3D Org Galaxy v2
│   │   ├── audit/             # Timeline viewer
│   │   └── notifications/     # Bell + list
│   └── lib/
│       ├── actions/           # All Server Actions (Zod validated)
│       ├── auth.ts            # NextAuth config
│       ├── auth.config.ts     # Edge-safe subset (keeps middleware <100KB)
│       ├── prisma.ts          # Singleton client
│       ├── score-engine.ts    # 4 UoM formulas + quarter helpers
│       ├── utils.ts           # Helpers
│       └── validators.ts      # Zod schemas
└── docs/
    ├── architecture.svg       # System diagram
    ├── DEMO_SCRIPT.md         # 90-second walkthrough
    ├── JUDGE_BRIEFING.md      # Evaluation cheat-sheet
    └── SUBMISSION_CHECKLIST.md
```

---

## 👤 Built by

**Raktim Chandra** — Solo participant, AtomQuest Hackathon 2026.

GitHub: [@RaktimChandra](https://github.com/RaktimChandra)

---

<div align="center">
<sub>Crafted with relentless focus over 30 sleepless hours. 🌒</sub>
</div>