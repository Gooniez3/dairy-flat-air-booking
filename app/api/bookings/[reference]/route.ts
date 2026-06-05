import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Schedule from '@/models/Schedule';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    await connectDB();

    const { reference } = await params;

    // Find ALL schedules that have this booking reference (covers return trip legs).
    const schedules = await Schedule.find({ 'bookings.bookingReference': reference });

    if (!schedules || schedules.length === 0) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check if any leg is in the past — if so, block the entire cancellation.
    for (const schedule of schedules) {
      if (schedule.departureTime < new Date()) {
        return NextResponse.json({ error: 'Cannot cancel a past flight' }, { status: 400 });
      }
    }

    // Remove the booking from every leg that shares this reference.
    for (const schedule of schedules) {
      const bookingIndex = schedule.bookings.findIndex(
        (b: { bookingReference: string }) => b.bookingReference === reference
      );
      if (bookingIndex !== -1) {
        schedule.bookings.splice(bookingIndex, 1);
        await schedule.save();
      }
    }

    return NextResponse.json({ success: true, message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Cancel booking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}