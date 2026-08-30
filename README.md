# CineWave — Movie Ticket Booking & Operations Console 🎬🎟️

A cinema ticketing and operational case-management system built with **React**
and **Vite**, modeled on a **Pega Platform** case-management exercise for
CineWave Entertainment. Rather than a typical e-commerce ticketing UI, this
implements the actual case-management concepts Pega uses — stages, SLAs,
calculated properties, and automated queue routing — as a working web
prototype.

> Built as a learning/portfolio project — not affiliated with or endorsed by Pegasystems Inc.

---

## 🌐 Live Demo

**[satishgunjari2006-pixel.github.io/cinewave-ticket-booking-console](https://satishgunjari2006-pixel.github.io/cinewave-ticket-booking-console/)**

---

## 🎯 Case Type: Movie Ticket Request

**Lifecycle stages:** `Initial Stage` ➔ `Availability` ➔ `Approval` ➔ `Booking Execution`

| Stage | What happens |
|---|---|
| **Initial Stage** | Customer submits a booking request — movie, state/city/theatre, showtime, seats. |
| **Availability** | Seat availability is checked against the show's remaining capacity; Total Cost is calculated live (in ₹). |
| **Approval** | An explicit confirm/cancel checkpoint — the customer reviews seats and total cost before the booking is finalized. Requests route automatically to **Premium ShowQueue** or **Standard ShowQueue** based on show format. |
| **Booking Execution** | Seats are locked, a ticket reference and QR code are generated, and a confirmation notification is logged. |

---

## 🌟 Key Features

### 🎟️ Customer Booking Portal
- Interactive movie browsing with trailers, ratings, and runtime.
- State → City → Theatre selection, then showtime and screen format (IMAX, 4DX, Dolby Atmos).
- Visual seating matrix (Standard / Prime / VIP Recliner) with real-time seat locking.
- Concessions & add-ons — popcorn, beverages, snacks, parking passes.
- Explicit approval checkpoint before final booking, separate from checkout.
- Digital ticket with QR code on confirmation.
- All pricing in ₹ (INR).

### ⚙️ Pega-Style Operations & Case Management
- Full case lifecycle tracking with a stage stepper per booking.
- Automated **queue routing** — Premium ShowQueue vs. Standard ShowQueue by show type.
- **SLA engine** — Goal (1 day) / Deadline (2 days) tracking with urgency badges and breach simulation.
- Audit trail — chronological history of case events, approvals, and operator actions.
- Staff **Movie & Show data management** — add/edit movies, screens, and showtimes.

### 📊 Analytics & Insights Dashboard
- Occupancy and capacity metrics per screen and showtime.
- Revenue breakdown across tickets, add-ons, and convenience fees.
- SLA compliance and cancellation tracking.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, Vite, Vanilla CSS Design System
- **Icons:** Lucide React
- **Workflow / Case Engine:** Pega PRPC–inspired case & SLA architecture

---

## 🚀 Running Locally (optional)

Only needed if you want to run or modify the project yourself — the live
demo above requires no setup.

### 1. Clone the repository
