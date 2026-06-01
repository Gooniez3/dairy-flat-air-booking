import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Schedule from '@/models/Schedule';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const date1 = searchParams.get('date1');
    const date2 = searchParams.get('date2');
    const orig = searchParams.get('orig');
    const dest = searchParams.get('dest');
    const exactDate = searchParams.get('exact'); // if 'true', search exact date only

    if (!date1 || !orig || !dest) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const origin = orig.toUpperCase();
    const destination = dest.toUpperCase();

    if (exactDate === 'true') {
      // Search for flights on the EXACT date only
      const startOfDay = new Date(date1 + 'T00:00:00.000Z');
      const endOfDay = new Date(date1 + 'T23:59:59.999Z');

      const exactFlights = await Schedule.find({
        origin,
        destination,
        departureTime: { $gte: startOfDay, $lte: endOfDay },
        status: 'scheduled',
      }).sort({ departureTime: 1 });

      if (exactFlights.length > 0) {
        // Found flights on exact date
        return NextResponse.json({
          exactMatch: true,
          flights: exactFlights.map(toResult),
          nearestBefore: [],
          nearestAfter: [],
        });
      }

      // No flights on exact date - find nearest before and after
      const nearestBefore = await Schedule.find({
        origin,
        destination,
        departureTime: { $lt: startOfDay },
        status: 'scheduled',
      }).sort({ departureTime: -1 }).limit(2);

      const nearestAfter = await Schedule.find({
        origin,
        destination,
        departureTime: { $gt: endOfDay },
        status: 'scheduled',
      }).sort({ departureTime: 1 }).limit(3);

      return NextResponse.json({
        exactMatch: false,
        flights: [],
        nearestBefore: nearestBefore.reverse().map(toResult),
        nearestAfter: nearestAfter.map(toResult),
      });
    }

    // Normal range search (used for return flights window)
    const startDate = new Date(date1 + 'T00:00:00.000Z');
    const endDate = new Date((date2 || date1) + 'T23:59:59.999Z');

    const schedules = await Schedule.find({
      origin,
      destination,
      departureTime: { $gte: startDate, $lte: endDate },
      status: 'scheduled',
    }).sort({ departureTime: 1 });

    return NextResponse.json({
      exactMatch: true,
      flights: schedules.map(toResult),
      nearestBefore: [],
      nearestAfter: [],
    });

  } catch (error) {
    console.error('Schedules GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function toResult(s: any) {
  const bookings = Array.isArray(s.bookings) ? s.bookings : [];

  return {
    _id: s._id,
    flightNumber: s.flightNumber,
    origin: s.origin,
    destination: s.destination,
    aircraft: s.aircraft,
    departureTime: s.departureTime,
    arrivalTime: s.arrivalTime,
    durationMinutes: s.durationMinutes,
    price: s.price,
    capacity: s.capacity,
    seatsBooked: bookings.length,
    seatsAvailable: s.capacity - bookings.length,
  };
}