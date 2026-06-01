# Dairy Flat Air – Online Airline Booking System

## Overview

Dairy Flat Air is a web-based airline booking system developed as part of Assignment 2 for 159.352.

The application allows users to search scheduled flights, make bookings, receive booking invoices, view existing bookings, and cancel bookings. The system operates using real calendar dates and supports multiple regional routes operating from Dairy Flat Airport (NZNE).

The application is built using Next.js, MongoDB Atlas, and deployed on Vercel.

---

## Features

### Flight Search

* Search scheduled flights by origin, destination, and travel date
* Supports one-way and return-trip bookings
* Displays nearest available flights when no exact match is found

### Booking System

* Select available flights
* Enter passenger information
* Generate unique booking reference numbers
* Prevent bookings on full flights

### Invoice Generation

* Displays booking confirmation
* Shows flight details, departure and arrival times
* Displays aircraft type and ticket price

### Manage Bookings

* Retrieve bookings using booking reference and passenger last name
* View all flight details associated with a booking
* Cancel existing bookings

### Real Flight Scheduling

Routes include:

* Dairy Flat (NZNE) ↔ Sydney (YSSY)
* Dairy Flat (NZNE) ↔ Rotorua (NZRO)
* Dairy Flat (NZNE) ↔ Great Barrier Island (NZGB)
* Dairy Flat (NZNE) ↔ Chatham Islands (NZCI)
* Dairy Flat (NZNE) ↔ Lake Tekapo (NZTL)

Schedules are generated using real calendar dates and extend beyond a single week.

---

## Technologies Used

### Frontend

* Next.js 16
* React
* TypeScript
* Tailwind CSS

### Backend

* Next.js API Routes
* MongoDB Atlas
* Mongoose

### Deployment

* Vercel

---

## Installation

Clone the repository:

```bash
git clone <repository-url>
cd airline-app
```

Install dependencies:

```bash
npm install
```

Create a `.env.local` file:

```env
MONGODB_URI=<your_mongodb_connection_string>
SEED_KEY=<your_seed_key>
```

Run the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## Deployment

The application is deployed using Vercel.

Production deployment requires:

* MongoDB Atlas database
* Environment variables configured in Vercel
* Successful build and deployment through Vercel

---

## Author

SAW LWIN HTOO

Bachelor of Information Sciences
Double Major in Computer Science and Information Technology
Massey University (PSB Academy)

---

## Assignment Information

Course: 159.352
Assignment: Assignment 2 – Online Booking System
Year: 2026
