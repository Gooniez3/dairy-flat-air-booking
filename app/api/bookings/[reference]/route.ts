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

    const schedule = await Schedule.findOne({ 'bookings.bookingReference': reference });
    if (!schedule) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check if flight is in the past
    if (schedule.departureTime < new Date()) {
      return NextResponse.json({ error: 'Cannot cancel a past flight' }, { status: 400 });
    }

    const bookingIndex = schedule.bookings.findIndex(
      (b: { bookingReference: string }) => b.bookingReference === reference
    );

    if (bookingIndex === -1) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    schedule.bookings.splice(bookingIndex, 1);
    await schedule.save();

    return NextResponse.json({ success: true, message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Cancel booking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
