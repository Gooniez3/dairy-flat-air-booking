import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Schedule from '@/models/Schedule';
import Passenger from '@/models/Passenger';
import { generateScheduledFlights } from '@/lib/scheduleData';

const SEED_KEY = process.env.SEED_KEY || 'dairy-flat-seed-2026';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    if (body.key !== SEED_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Clear existing data
    await Schedule.deleteMany({});
    await Passenger.deleteMany({});

    // Generate flights for 10 weeks
    const flights = generateScheduledFlights(10);
    await Schedule.insertMany(flights);

    // Seed some passengers from the CSV (a sample)
    const samplePassengers = [
      { title: 'Mr', firstName: 'Ojas', lastName: 'Naik', email: 'ojas.naik@proton.com', gender: 'm' },
      { title: 'Miss', firstName: 'Ella', lastName: 'Lee', email: 'ella.lee@blobmail.com', gender: 'f' },
      { title: 'Mrs', firstName: 'Hannah', lastName: 'King', email: 'hannah.king@bazooka.com', gender: 'f' },
      { title: 'Mr', firstName: 'Leroy', lastName: 'Thompson', email: 'leroy.thompson@proton.com', gender: 'm' },
      { title: 'Mr', firstName: 'Miguel', lastName: 'Williamson', email: 'miguel.williamson@quark.co.nz', gender: 'm' },
    ];

    await Passenger.insertMany(samplePassengers);

    return NextResponse.json({
      success: true,
      flightsCreated: flights.length,
      passengersCreated: samplePassengers.length,
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
