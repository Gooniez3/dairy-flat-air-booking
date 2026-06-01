import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Schedule from '@/models/Schedule';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');
    const lastName = searchParams.get('lastName');

    if (!reference || !lastName) {
      return NextResponse.json({ error: 'Booking reference and last name are required' }, { status: 400 });
    }

    // Find schedule with this booking reference
    const schedule = await Schedule.findOne({
      'bookings.bookingReference': reference.toUpperCase(),
    });

    if (!schedule) {
      return NextResponse.json({ error: 'Booking not found. Please check your reference.' }, { status: 404 });
    }

    const booking = schedule.bookings.find(
      (b: { bookingReference: string }) => b.bookingReference === reference.toUpperCase()
    );

    // Verify last name matches (case insensitive)
    const passengerName: string = booking?.passengerName || '';
    const nameParts = passengerName.split(' ');
    const storedLastName = nameParts[nameParts.length - 1].toLowerCase();
    if (storedLastName !== lastName.toLowerCase().trim()) {
      return NextResponse.json({ error: 'Last name does not match. Please check your details.' }, { status: 404 });
    }

    // Get all bookings for this passenger email
    const email = booking?.passengerEmail;
    const allSchedules = await Schedule.find({
      'bookings.passengerEmail': email,
    }).sort({ departureTime: 1 });

    const bookings = allSchedules.map((s) => {
      const b = s.bookings.find(
        (b: { passengerEmail: string }) => b.passengerEmail === email
      );
      return {
        scheduleId: s._id,
        flightNumber: s.flightNumber,
        origin: s.origin,
        destination: s.destination,
        aircraft: s.aircraft,
        departureTime: s.departureTime,
        arrivalTime: s.arrivalTime,
        durationMinutes: s.durationMinutes,
        price: s.price,
        bookingReference: b?.bookingReference,
        passengerName: b?.passengerName,
        bookedAt: b?.bookedAt,
        isPast: s.departureTime < new Date(),
      };
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Passengers GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}