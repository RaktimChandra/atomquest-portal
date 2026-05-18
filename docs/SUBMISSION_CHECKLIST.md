\# AtomQuest — Submission Checklist



Run through this BEFORE clicking submit on Unstop.



\## Deliverables required by the platform



\- \[ ] \*\*1 submission document\*\* containing:

&#x20; - \[ ] Working link (Vercel URL)

&#x20; - \[ ] Source code repository URL (GitHub)

&#x20; - \[ ] Architecture diagram (PDF or image)

\- \[ ] Login credentials for the 3 roles (Employee, Manager, Admin)



\---



\## Pre-submission live URL test (do this on the Vercel URL, NOT localhost)



\### Landing page

\- \[ ] Loads without errors

\- \[ ] 3D atom renders smoothly (no console errors)

\- \[ ] Number tickers animate

\- \[ ] All 3 hero CTAs route correctly

\- \[ ] Logo animates on hover



\### Authentication

\- \[ ] All 3 quick-fill personas auto-fill credentials

\- \[ ] Sign in succeeds for each role

\- \[ ] Sign out → redirected to login

\- \[ ] Sign in as same role again → lands on correct dashboard

\- \[ ] Microsoft SSO button → simulates flow → lands in dashboard



\### Employee flows

\- \[ ] `/dashboard` loads with stats

\- \[ ] `/dashboard/goals` shows existing goals grouped by status

\- \[ ] `/dashboard/goals/new` editor loads

\- \[ ] Weightage donut updates as slider drags

\- \[ ] Adding a new goal works

\- \[ ] Submit button disabled until 100% weightage

\- \[ ] Submit button works → notification fires to manager

\- \[ ] `/dashboard/checkins` Q1/Q2/Q3/Q4 tabs work

\- \[ ] Check-in form's live score preview updates

\- \[ ] Save check-in persists



\### Manager flows

\- \[ ] `/dashboard/approvals` shows the inbox

\- \[ ] Click into report → detail page loads with weightage donut on right

\- \[ ] Inline edit a field → "Saved" toast

\- \[ ] Approve \& lock → toast confirms → goals now show APPROVED/LOCKED

\- \[ ] Return-for-rework dialog opens → reason validation → submit works

\- \[ ] `/dashboard/team` shows mini score gauges

\- \[ ] `/dashboard/analytics` loads

\- \[ ] 3D Galaxy renders, drag-rotate works

\- \[ ] Hover tooltip shows on galaxy nodes



\### Admin flows

\- \[ ] `/dashboard/cycles` lists cycles + thrust areas

\- \[ ] Edit a thrust area color → saves

\- \[ ] `/dashboard/org` lists all users

\- \[ ] Edit a user's department → saves

\- \[ ] `/dashboard/completion` loads heatmap + tiles

\- \[ ] CSV export downloads (open the file, looks valid)

\- \[ ] Excel export downloads (open in Excel — has banded rows, frozen header, auto-filter)

\- \[ ] `/dashboard/escalations` shows rules + scan button

\- \[ ] "Run scan now" works → toast shows N escalations created

\- \[ ] `/dashboard/audit` shows timeline

\- \[ ] Click "Diff" on an entry shows before/after JSON



\### Cross-cutting

\- \[ ] Theme toggle (sun/moon icon) switches modes smoothly

\- \[ ] Notification bell shows unread count

\- \[ ] Sign out works from every role

\- \[ ] No console errors during a full demo run (F12 → Console clean)

\- \[ ] No 500 errors in Network tab



\---



\## Final files to commit + push



\- \[ ] `docs/architecture.svg` — diagram

\- \[ ] `docs/DEMO\_SCRIPT.md` — 90-second walkthrough

\- \[ ] `docs/JUDGE\_BRIEFING.md` — judge cheat-sheet

\- \[ ] `docs/SUBMISSION\_CHECKLIST.md` — this file

\- \[ ] `README.md` — polished (see Phase 8C step 3)

\- \[ ] All Phase 8A + 8B code



\---



\## What to put in the submission document (uploaded to Unstop)



Paste this as your submission text:

