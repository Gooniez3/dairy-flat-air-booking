#!/usr/bin/env node
// Run: node scripts/seed.mjs
// Requires MONGODB_URI env variable

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Please set MONGODB_URI environment variable');
  process.exit(1);
}

const AIRPORTS = {
  NZNE: { name: 'Dairy Flat Airport', city: 'Dairy Flat, Auckland', tzOffset: 12 },
  YSSY: { name: 'Sydney Airport', city: 'Sydney, Australia', tzOffset: 10 },
  NZRO: { name: 'Rotorua Airport', city: 'Rotorua, NZ', tzOffset: 12 },
  NZCI: { name: 'Tuuta Airport', city: 'Chatham Islands, NZ', tzOffset: 12.75 },
  NZGB: { name: 'Claris Airport', city: 'Great Barrier Island, NZ', tzOffset: 12 },
  NZTL: { name: 'Lake Tekapo Airport', city: 'Lake Tekapo, NZ', tzOffset: 12 },
};

const AIRCRAFT = {
  SJ30i: { name: 'SyberJet SJ30i', capacity: 6 },
  SF50_A: { name: 'Cirrus SF50 (Alpha)', capacity: 4 },
  SF50_B: { name: 'Cirrus SF50 (Bravo)', capacity: 4 },
  HJ_A: { name: 'HondaJet Elite (Alpha)', capacity: 5 },
  HJ_B: { name: 'HondaJet Elite (Bravo)', capacity: 5 },
};

const ROUTE_TEMPLATES = [
  { flightNumber: 'DF101', origin: 'NZNE', destination: 'YSSY', aircraft: 'SJ30i', departureTime: '10:30', durationMinutes: 195, price: 1250, daysOfWeek: [5] },
  { flightNumber: 'DF102', origin: 'YSSY', destination: 'NZNE', aircraft: 'SJ30i', departureTime: '14:30', durationMinutes: 165, price: 1250, daysOfWeek: [0] },
  { flightNumber: 'DF201', origin: 'NZNE', destination: 'NZRO', aircraft: 'SF50_A', departureTime: '07:00', durationMinutes: 45, price: 185, daysOfWeek: [1,2,3,4,5] },
  { flightNumber: 'DF202', origin: 'NZRO', destination: 'NZNE', aircraft: 'SF50_A', departureTime: '08:15', durationMinutes: 45, price: 185, daysOfWeek: [1,2,3,4,5] },
  { flightNumber: 'DF203', origin: 'NZNE', destination: 'NZRO', aircraft: 'SF50_A', departureTime: '16:30', durationMinutes: 45, price: 185, daysOfWeek: [1,2,3,4,5] },
  { flightNumber: 'DF204', origin: 'NZRO', destination: 'NZNE', aircraft: 'SF50_A', departureTime: '18:00', durationMinutes: 45, price: 185, daysOfWeek: [1,2,3,4,5] },
  { flightNumber: 'DF301', origin: 'NZNE', destination: 'NZGB', aircraft: 'SF50_B', departureTime: '09:00', durationMinutes: 35, price: 220, daysOfWeek: [1,3,5] },
  { flightNumber: 'DF302', origin: 'NZGB', destination: 'NZNE', aircraft: 'SF50_B', departureTime: '10:00', durationMinutes: 35, price: 220, daysOfWeek: [2,4,6] },
  { flightNumber: 'DF401', origin: 'NZNE', destination: 'NZCI', aircraft: 'HJ_A', departureTime: '08:00', durationMinutes: 135, price: 680, daysOfWeek: [2,5] },
  { flightNumber: 'DF402', origin: 'NZCI', destination: 'NZNE', aircraft: 'HJ_A', departureTime: '09:00', durationMinutes: 120, price: 680, daysOfWeek: [3,6] },
  { flightNumber: 'DF501', origin: 'NZNE', destination: 'NZTL', aircraft: 'HJ_B', departureTime: '09:30', durationMinutes: 105, price: 420, daysOfWeek: [1] },
  { flightNumber: 'DF502', origin: 'NZTL', destination: 'NZNE', aircraft: 'HJ_B', departureTime: '11:00', durationMinutes: 100, price: 420, daysOfWeek: [2] },
];

function generateFlights(weeksAhead = 10) {
  const flights = [];
  const today = new Date();
  const startDate = new Date(today);
  const dayOfWeek = today.getDay();
  // Go back to last Monday
  startDate.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  startDate.setHours(0, 0, 0, 0);

  for (let w = -1; w < weeksAhead; w++) {
    for (const template of ROUTE_TEMPLATES) {
      for (const dow of template.daysOfWeek) {
        const flightDate = new Date(startDate);
        const daysFromMonday = dow === 0 ? 6 : dow - 1;
        flightDate.setDate(startDate.getDate() + w * 7 + daysFromMonday);

        const [hour, minute] = template.departureTime.split(':').map(Number);
        flightDate.setHours(hour, minute, 0, 0);

        const arrivalDate = new Date(flightDate.getTime() + template.durationMinutes * 60000);

        flights.push({
          flightNumber: template.flightNumber,
          origin: template.origin,
          destination: template.destination,
          aircraft: template.aircraft,
          departureTime: flightDate,
          arrivalTime: arrivalDate,
          durationMinutes: template.durationMinutes,
          price: template.price,
          capacity: AIRCRAFT[template.aircraft].capacity,
          bookings: [],
          status: 'scheduled',
        });
      }
    }
  }
  return flights;
}

async function seed() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('dairy-flat-air');

    // Clear collections
    await db.collection('schedules').deleteMany({});
    await db.collection('passengers').deleteMany({});
    console.log('Cleared existing data');

    // Create indexes
    await db.collection('schedules').createIndex({ origin: 1, destination: 1, departureTime: 1 });
    await db.collection('schedules').createIndex({ 'bookings.bookingReference': 1 });
    await db.collection('schedules').createIndex({ 'bookings.passengerEmail': 1 });

    // Insert flights
    const flights = generateFlights(10);
    await db.collection('schedules').insertMany(flights);
    console.log(`Inserted ${flights.length} scheduled flights`);

    console.log('Seeding complete!');
  } finally {
    await client.close();
  }
}

seed().catch(console.error);
