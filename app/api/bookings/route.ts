import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Schedule from '@/models/Schedule';
import Passenger from '@/models/Passenger';

function generateBookingRef(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let ref = 'DF';
  for (let i = 0; i < 6; i++) {
    ref += chars[Math.floor(Math.random() * chars.length)];
  }
  return ref;
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { scheduleId, firstName, lastName, email, title } = body;

    if (!scheduleId || !firstName || !lastName || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find the schedule
    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return NextResponse.json({ error: 'Flight not found' }, { status: 404 });
    }

    // Check availability
    if (schedule.bookings.length >= schedule.capacity) {
      return NextResponse.json({ error: 'This flight is fully booked' }, { status: 409 });
    }

    // Check if this passenger already booked this flight
    const existingBooking = schedule.bookings.find(
      (b: { passengerEmail: string }) => b.passengerEmail.toLowerCase() === email.toLowerCase()
    );
    if (existingBooking) {
      return NextResponse.json({ error: 'You already have a booking on this flight' }, { status: 409 });
    }

    // Find or create passenger
    let passenger = await Passenger.findOne({ email: email.toLowerCase() });
    if (!passenger) {
      passenger = await Passenger.create({
        title: title || 'Mr',
        firstName,
        lastName,
        email: email.toLowerCase(),
        gender: '',
      });
    }

    // Generate unique booking reference
    let bookingReference = generateBookingRef();
    // Ensure uniqueness (simple retry)
    let attempts = 0;
    while (attempts < 10) {
      const exists = await Schedule.findOne({ 'bookings.bookingReference': bookingReference });
      if (!exists) break;
      bookingReference = generateBookingRef();
      attempts++;
    }

    const fullName = `${title || ''} ${firstName} ${lastName}`.trim();

    // Add booking to schedule
    schedule.bookings.push({
      passengerId: passenger._id.toString(),
      passengerName: fullName,
      passengerEmail: email.toLowerCase(),
      bookingReference,
      bookedAt: new Date(),
    });

    await schedule.save();

    return NextResponse.json({
      success: true,
      bookingReference,
      flightNumber: schedule.flightNumber,
      origin: schedule.origin,
      destination: schedule.destination,
      departureTime: schedule.departureTime,
      arrivalTime: schedule.arrivalTime,
      price: schedule.price,
      aircraft: schedule.aircraft,
      passengerName: fullName,
      passengerEmail: email.toLowerCase(),
    });
  } catch (error) {
    console.error('Booking POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
