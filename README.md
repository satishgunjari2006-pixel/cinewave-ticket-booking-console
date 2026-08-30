# CineWave Ticket Booking Console 🎬🎟️

A comprehensive, full-stack style Cinema Ticket Booking & Operations Management System built with **React**, **Vite**, and **Pega Case Management Architecture**.

---

## 🌟 Key Features

### 1. 🎟️ Customer Booking Portal
- **Interactive Movie Browsing**: Explore currently showing movies, trailers, and ratings.
- **Dynamic Showtime & Theatre Selection**: Choose date, screen format (IMAX, 4DX, Dolby Atmos), and timings.
- **Visual Seating Matrix**: Multi-tier seat selection (Standard, Prime, VIP Recliners) with real-time seat locking.
- **Concessions & Add-ons**: Add popcorn, beverages, gourmet snacks, and parking passes.
- **Instant Digital Ticket & QR Code**: Complete checkout with confetti animations and WhatsApp ticket receipt preview.

### 2. ⚙️ Pega Operations & Case Management
- **Case Lifecycle Stages**: Track tickets through `Draft` ➔ `Payment Pending` ➔ `Confirmed` ➔ `Fulfilled` / `Escalated`.
- **SLA Engine**: Real-time Goal, Deadline, and Passed-Deadline tracking with SLA badges.
- **Audit Trails**: Full chronological history of case events, approvals, and operator notes.
- **Time Travel Simulator**: Accelerate case timers to test SLA breaches and automated escalation triggers.

### 3. 📊 Analytics & Insights Dashboard
- **Occupancy & Capacity Metrics**: Live utilization stats per screen and showtime.
- **Revenue Analytics**: Visual breakdowns across movie tickets, food & beverages, and convenience fees.
- **Cancellation & SLA Compliance**: Monitor refund rates and operator response times.

### 4. 🎬 Show & Screen Inventory Manager
- Manage screens, seat layouts, ticket price tiers, and show schedules.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Vanilla CSS Design System
- **Icons**: Lucide React
- **Animations**: Canvas Confetti & CSS3 Transitions
- **Workflow / Case Engine**: Pega PRPC Inspired Case & SLA Architecture

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/satishgunjari2006-pixel/cinewave-ticket-booking-console.git
cd cinewave-ticket-booking-console
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start local development server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for production
```bash
npm run build
```

---

## 📄 License
MIT License
