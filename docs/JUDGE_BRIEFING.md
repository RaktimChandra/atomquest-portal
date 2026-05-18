\# AtomQuest Portal — Judge Briefing



A one-page guide for the AtomQuest Hackathon 2026 evaluation panel.



\*\*Submission by:\*\* Raktim Chandra · Solo participant

\*\*Live URL:\*\* https://atomquest-portal-eta.vercel.app  \*(check submission page for current URL)\*

\*\*Repo:\*\* https://github.com/RaktimChandra/atomquest-portal

\*\*Built:\*\* 30 continuous hours · Next.js 16 · TypeScript strict · Postgres on Neon



\---



\## 🎯 Quick start (60 seconds)



Open the live URL → click "Launch Portal" → use any persona quick-fill card on the right.



\*\*All passwords are `demo1234`.\*\*



| Role | Email | Tries this view |

|---|---|---|

| Admin / HR | `admin@atomberg.com` | Cycles · Org · Completion · 3D Galaxy · Audit · Escalations |

| Manager | `manager@atomberg.com` | Approvals · Team · Analytics · Check-ins |

| Employee | `employee@atomberg.com` | Goal sheet · Weightage donut · Quarterly check-ins |



The Microsoft button on the login screen demonstrates a working mock SSO flow (full Entra integration documented).



\---



\## ✅ Rubric coverage



\### 1 · Functionality of the Portal

Every flow works end-to-end. The seed data ships with a partially-progressed cycle so the panel can experience all states without setup.



\### 2 · Adherence to Brief



\*\*Phase 1 — Goal Creation \& Approval ✅\*\*

\- All 4 UoM types: Numeric (Min/Max), Percentage (Min/Max), Timeline, Zero-based

\- Validation enforced client + server: Σ weightage = 100%, min 10%, max 8 goals

\- Manager L1 approval with inline edit + return-for-rework with mandatory reason

\- Goals lock on approval; admin can unlock with audit-logged reason

\- \*\*Shared goals\*\* with primary-owner sync of achievement to child goals



\*\*Phase 2 — Achievement Tracking \& Check-ins ✅\*\*

\- Quarterly windows (July / Oct / Jan / Mar-Apr) enforced by current-quarter calculation

\- All 4 score formulas live:

&#x20; - Min UoM: actual ÷ target

&#x20; - Max UoM: target ÷ actual

&#x20; - Timeline: deadline-vs-completion-date scoring

&#x20; - Zero-based: 0 → 100%, else 0%

\- Manager check-in module with structured comments + optional rating

\- Status: Not Started / On Track / At Risk / Completed



\*\*Reporting \& Governance ✅\*\*

\- CSV export (UTF-8, RFC 4180 escaped)

\- Excel export (xlsx with banded rows, frozen header, auto-filter)

\- Completion dashboard with real-time aggregates per department × quarter

\- Audit trail: every change captured with user, timestamp, before/after JSON diff



\### 3 · User Friendliness

\- Light mode by default · Dark mode equally polished · Smooth toggle morph

\- Spring physics on every interaction (no linear easings)

\- Number tickers, magnetic hover on CTAs, animated reveals

\- Helpful inline validation errors (not generic toasts)

\- Role-aware sidebars — no clutter from features you can't use

\- Mobile-responsive for the most-used screens



\### 4 · Technical Robustness

\- TypeScript strict mode

\- Zod validation on every server action (defense-in-depth: never trust the client)

\- Immutable audit log table — no overwrite path exists

\- Edge middleware enforces role-based routing before pages even mount

\- Connection pooling via Neon's pooled endpoint (handles cold starts)

\- Comprehensive error handling on every async path with toast surfaces



\### 5 · Bonus Features (all four implemented)



\*\*🔐 Microsoft Entra ID\*\* — Working mock SSO flow (login.microsoftonline.com simulation → consent → callback → session). Documented swap to real `AzureAD` provider in \[README · SSO section](#).



\*\*🔔 Notifications\*\* — In-app notification center with bell icon, polling, mark-read, dedicated page. Deep-links route directly to relevant goal/approval/check-in.



\*\*⚡ Escalation Engine\*\* — Configurable rules with thresholds (e.g., "goal not submitted in 7 days → notify manager"). Admin can run scan on demand. Escalation log with resolve capability. Auto-creates notifications.



\*\*📊 Analytics\*\* — QoQ trend chart, thrust-area distribution, UoM distribution, status distribution, department × quarter heatmap, manager effectiveness ranked. \*\*Plus the 3D org-alignment galaxy\*\* — judges' centerpiece.



\### 6 · Cost Optimization

\- \*\*Free-tier capable:\*\* Vercel Hobby (100 GB bandwidth) + Neon Free (3 GB Postgres) = ₹0/month at demo scale

\- \*\*Serverless throughout:\*\* zero idle cost

\- \*\*Server Components\*\* reduce JS shipped to client by \~60% vs a SPA

\- \*\*Edge middleware split\*\* (`auth.config.ts` separate) — sub-100KB edge bundle, well under Vercel's 1 MB limit

\- \*\*Indexed Postgres queries\*\* on every join column (see `prisma/schema.prisma`)

\- \*\*Connection pooling\*\* via Neon pooler — no connection exhaustion on cold starts

\- \*\*Excel export streams to buffer\*\*, no disk I/O

\- \*\*Production scale path documented\*\* in this briefing



\---



\## 🏗️ Architecture summary



See `docs/architecture.svg` for the full diagram. Three-layer separation:



1\. \*\*Client\*\* — React 19 Server Components + Client Components for interactivity

2\. \*\*Edge middleware\*\* — Auth + role routing, sub-100KB bundle

3\. \*\*Server functions\*\* — Server Actions for mutations, Route Handlers for streaming exports

4\. \*\*Data\*\* — Prisma 6 + Postgres on Neon Singapore (lowest latency for India)



\---



\## 📊 Numbers



\- \*\*66 source files\*\* (\~6,500 LOC excluding node\_modules)

\- \*\*8 phases\*\* delivered in 30 hours

\- \*\*0 known bugs\*\* in core flows at submission time

\- \*\*3 distinct 3D scenes\*\* (hero atom, org galaxy, weightage donut)

\- \*\*All 13 Prisma models\*\* seeded with realistic Atomberg-themed demo data



\---



\## 🎨 Design rationale



Atomberg makes premium consumer products with celebrated design (Renesa, Aizen, Studio). A goal-tracking portal for that company shouldn't look like a generic admin template.



\*\*Aesthetic chosen:\*\* Monochrome canvas + one perfect accent gradient (electric blue → meridian cyan). Inspired by Linear's restraint, Vercel's gradient moments, and Notion's warmth. Light by default; dark mode equally premium.



\*\*Three signature visuals:\*\*

1\. The \*\*Quark Logo\*\* — geometric monogram (orbit + filled sphere) replacing the generic atom

2\. \*\*Atom v2 hero\*\* — translucent glass icosahedron with refraction + 3 orbital particle ribbons

3\. \*\*3D Org Galaxy\*\* — admin/manager/employee nodes orbiting like a stellar system, with goals as colored particles



\---



\## 🚀 What's next (production roadmap)



This is hackathon code with production guardrails. To reach actual production:



1\. \*\*Replace mock SSO\*\* — swap to `AzureAD` provider in `auth.ts` with tenant + client credentials (15 min)

2\. \*\*Replace polling with WebSockets\*\* — use Neon WebSocket driver or Pusher for real-time notifications

3\. \*\*Email + Teams notifications\*\* — wire SendGrid + Microsoft Graph API

4\. \*\*Cron the escalation scan\*\* — Vercel Cron, hourly

5\. \*\*Multi-tenant\*\* — add `organizationId` to schema, scoped row-level security in Postgres



\---



\## 🙏 Acknowledgments



Built end-to-end, solo, by Raktim Chandra over 30 sleepless hours. No starter templates. No team. Every line of TypeScript and every 3D scene written from scratch for AtomQuest 2026.



\*\*Looking forward to the Pune round.\*\*

