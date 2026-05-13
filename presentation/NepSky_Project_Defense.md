# NepSky — International Airlines

---

# Slide 1 — Title
- NepSky: International Airlines Ticketing System
- Presenter: [Your Name]
- Supervisor: [Supervisor Name]
- Date: April 2026

Notes: Introduce yourself, your role, and set expectations for a ~10–15 minute demo + Q&A.

---

# Slide 2 — Problem Statement
- Fragmented booking experiences for international travelers.
- Complex payment flows for local gateways (NPR support).
- Admins need simple management for flights, policies, and reports.

Notes: Explain the motivation — customers need a reliable, localized booking flow; operators need manageable admin tools.

---

# Slide 3 — Project Objectives
- Provide a responsive flight search and booking SPA.
- Integrate Nepal-specific payment gateways (eSewa, Khalti, IME Pay, ConnectIPS).
- Support user accounts, booking history and admin operations.

Notes: Emphasize real-world constraints (currency, regional gateways) and measurable goals.

---

# Slide 4 — Scope & Key Features
- Flight search with filters (from, to, dates, passengers, class).
- Multi-step booking: passenger details, seat selection, review.
- Payment orchestration + server-side verification.
- Admin dashboard: manage flights, payments, users.

Notes: Clarify what is in-scope for the defense and what was intentionally left out.

---

# Slide 5 — High-level Architecture
- Frontend: React + TypeScript (Vite) with Tailwind and Framer Motion.
- Backend: Express server for lightweight endpoints & verification.
- Data & Auth: Supabase (DB + auth); migrations included.
- Payment: Client-side flows with server-side verification endpoints.

Notes: Walk through sequence: user -> frontend -> supabase/backend -> payment gateway -> verification.

---

# Slide 6 — Data Model & Migrations
- Core entities: User, Flight, Booking, Passenger, Seat.
- Types defined in `src/types/index.ts` for consistency.
- Supabase migrations in `supabase/migrations` (RLS & admin policies).

Notes: Explain how RLS and migrations enforce security and how schema evolved during the project.

---

# Slide 7 — Key Components (Frontend)
- Contexts: `AuthContext`, `BookingContext`, `AdminContext`, `LanguageContext`.
- Routes: Search, BookingFlow, MyBookings, Profile, Admin pages.
- Reusable services: `paymentService.ts`, `supabase.ts`, utilities (currency conversion).

Notes: Point to a couple of files (e.g., `src/services/paymentService.ts`) if asked for code references.

---

# Slide 8 — Payment Integration
- Implemented `PaymentServiceFactory` with providers for:
  - eSewa (HTML redirect form & verify), Khalti, IME Pay, ConnectIPS.
- Currency conversion helper and formatting (USD/NPR).
- Verification endpoint pattern to confirm transactions before marking bookings confirmed.

Notes: Stress the importance of server-side verification and show the eSewa redirect approach as an example.

---

# Slide 9 — Security & Access Control
- Supabase policies and migrations used to restrict access (RLS).
- Server-only keys used in `server/supabaseClient.mjs` to avoid exposing service keys to clients.
- Recommendations: HMAC/signature verification for gateway callbacks, rate-limiting, and audit logs.

Notes: Be ready to answer how you protect against forged verification calls and how to rotate keys.

---

# Slide 10 — Demo Flow (User Journey)
1. Search flights on Home page → choose flight.
2. Enter passenger details, select seats.
3. Choose payment gateway → redirect or payment URL.
4. Post-payment verification → booking confirmation and PNR generation.

Notes: Live demo idea: run through a short recorded flow or prepared screenshots—point out state carried in `BookingContext`.

---

# Slide 11 — Testing, Deployment & Limitations
- Current testing: manual flows and local dev; no automated E2E yet.
- Deployment options: Vercel/Netlify for frontend, small VPS or Heroku for Express, Supabase for DB/auth.
- Known limitations: no automated tests for payment flows; edge-cases on timezones and seat race-conditions.

Notes: Offer plan to add CI tests and transactional locking for seat allocations.

---

# Slide 12 — Conclusion & Future Work
- Delivered a complete booking SPA with local payments and admin capabilities.
- Future: automated tests, seat reservation locking, live availability updates, analytics, mobile PWA improvements.

Questions?

Notes: Invite questions and suggest follow-ups (demos, code walkthroughs, deployment walkthrough).
