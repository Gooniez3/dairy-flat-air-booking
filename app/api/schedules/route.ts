import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Schedule from '@/models/Schedule';

const TZ_OFFSET: Record<string, number> = {
  NZNE: 12,
  YSSY: 10,
  NZRO: 12,
  NZCI: 12.75,
  NZGB: 12,
  NZTL: 12,
};

// Convert a selected local calendar date into the correct UTC search range.
function localDayRangeUTC(dateStr: string, airport: string) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const offset = TZ_OFFSET[airport] ?? 12;

  const start = new Date(
    Date.UTC(year, month - 1, day, 0, 0, 0, 0) -
      offset * 60 * 60 * 1000
  );

  const end = new Date(
    Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0) -
      offset * 60 * 60 * 1000 -
      1
  );

  return { start, end };
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const date1 = searchParams.get('date1');
    const date2 = searchParams.get('date2');
    const orig = searchParams.get('orig');
    const dest = searchParams.get('dest');
    const exactDate = searchParams.get('exact'); // if 'true', search exact local date only

    if (!date1 || !orig || !dest) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const origin = orig.toUpperCase();
    const destination = dest.toUpperCase();

    if (exactDate === 'true') {
      // Search for flights on the selected local calendar date.
      const { start: startOfDay, end: endOfDay } = localDayRangeUTC(date1, origin);

      const exactFlights = await Schedule.find({
        origin,
        destination,
        departureTime: { $gte: startOfDay, $lte: endOfDay },
        status: 'scheduled',
      }).sort({ departureTime: 1 });

      if (exactFlights.length > 0) {
        return NextResponse.json({
          exactMatch: true,
          flights: exactFlights.map(toResult),
          nearestBefore: [],
          nearestAfter: [],
        });
      }

      // If there is no flight on the selected date, show nearby options.
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

    // Normal range search, also based on the origin airport local calendar date.
    const { start: startDate } = localDayRangeUTC(date1, origin);
    const { end: endDate } = localDayRangeUTC(date2 || date1, origin);

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